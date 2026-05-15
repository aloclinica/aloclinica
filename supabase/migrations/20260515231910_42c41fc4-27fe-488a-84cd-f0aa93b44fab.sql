
-- 6. Doctor payouts
CREATE TABLE IF NOT EXISTS public.doctor_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  gross_amount NUMERIC(10,2) NOT NULL,
  platform_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, ready, paid, disputed, cancelled
  release_at TIMESTAMPTZ NOT NULL,
  paid_at TIMESTAMPTZ,
  pix_key TEXT,
  pix_tx_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_doctor_payouts_doctor ON public.doctor_payouts(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_payouts_status ON public.doctor_payouts(status, release_at);
ALTER TABLE public.doctor_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_payouts FORCE ROW LEVEL SECURITY;
CREATE POLICY "doctor_payouts_admin_all" ON public.doctor_payouts FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "doctor_payouts_doctor_view" ON public.doctor_payouts FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.doctor_profiles dp WHERE dp.id = doctor_payouts.doctor_id AND dp.user_id = auth.uid())
);
CREATE TRIGGER trg_doctor_payouts_updated BEFORE UPDATE ON public.doctor_payouts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create payout on appointment completion
CREATE OR REPLACE FUNCTION public.fn_create_payout_on_completion()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_fee NUMERIC; v_net NUMERIC; v_pix TEXT;
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed'
     AND NEW.payment_status IN ('confirmed','approved','received')
     AND NEW.price_at_booking IS NOT NULL AND NEW.price_at_booking > 0
     AND NOT EXISTS (SELECT 1 FROM public.doctor_payouts WHERE appointment_id = NEW.id) THEN
    v_fee := ROUND(NEW.price_at_booking * 0.20, 2); -- 20% platform fee
    v_net := NEW.price_at_booking - v_fee;
    SELECT pix_key INTO v_pix FROM public.doctor_profiles WHERE id = NEW.doctor_id;
    INSERT INTO public.doctor_payouts(doctor_id, appointment_id, gross_amount, platform_fee, net_amount, release_at, pix_key)
    VALUES (NEW.doctor_id, NEW.id, NEW.price_at_booking, v_fee, v_net, now() + interval '7 days', v_pix);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_create_payout_on_completion ON public.appointments;
CREATE TRIGGER trg_create_payout_on_completion AFTER UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.fn_create_payout_on_completion();

-- Cron job releases pending payouts after release_at if no dispute
CREATE OR REPLACE FUNCTION public.fn_release_doctor_payouts()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  UPDATE public.doctor_payouts dp
  SET status = 'ready', updated_at = now()
  WHERE dp.status = 'pending'
    AND dp.release_at < now()
    AND NOT EXISTS (
      SELECT 1 FROM public.support_tickets st
      WHERE st.related_appointment_id = dp.appointment_id
        AND st.status IN ('open','in_progress')
    );
END $$;

-- Add pix_key to doctor_profiles if missing
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS pix_key TEXT;

-- 9. Reschedule suggestion: trigger on patient cancel
CREATE OR REPLACE FUNCTION public.fn_suggest_reschedule()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status NOT IN ('cancelled','no_show')
     AND NEW.cancelled_by IS NOT NULL
     AND NEW.cancelled_by = NEW.patient_id::text
     AND NEW.patient_id IS NOT NULL THEN
    PERFORM public.invoke_edge_function('suggest-reschedule',
      jsonb_build_object('appointment_id', NEW.id::text));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_suggest_reschedule ON public.appointments;
CREATE TRIGGER trg_suggest_reschedule AFTER UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.fn_suggest_reschedule();

-- 10. Idle slot suggestion (weekly cron)
CREATE OR REPLACE FUNCTION public.fn_idle_slot_suggestion()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE d RECORD;
BEGIN
  FOR d IN
    SELECT dp.id, dp.user_id,
      (SELECT COUNT(*) FROM appointments a WHERE a.doctor_id = dp.id
         AND a.scheduled_at BETWEEN now() AND now() + interval '7 days'
         AND a.status NOT IN ('cancelled','no_show')) AS booked
    FROM doctor_profiles dp
    WHERE dp.is_approved = true
  LOOP
    IF d.booked < 5 THEN
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (d.user_id, '📅 Sua agenda está com horários livres',
        'Você tem ' || d.booked || ' consultas marcadas nos próximos 7 dias. Considere ampliar disponibilidade ou ativar "Atender agora".',
        'info', '/dashboard/doctor/availability');
    END IF;
  END LOOP;
END $$;

-- 12. Onboarding gamificado (function returns progress JSON)
CREATE OR REPLACE FUNCTION public.fn_doctor_onboarding_progress(p_user_id UUID)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_dp RECORD; v_steps jsonb := '[]'::jsonb; v_done INT := 0; v_total INT := 8;
  v_has_specialty BOOL; v_has_avail BOOL; v_has_first_appt BOOL;
BEGIN
  SELECT * INTO v_dp FROM doctor_profiles WHERE user_id = p_user_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','not_doctor'); END IF;

  SELECT EXISTS(SELECT 1 FROM doctor_specialties WHERE doctor_id = v_dp.id) INTO v_has_specialty;
  SELECT EXISTS(SELECT 1 FROM doctor_availability WHERE doctor_id = v_dp.id) INTO v_has_avail;
  SELECT EXISTS(SELECT 1 FROM appointments WHERE doctor_id = v_dp.id AND status='completed') INTO v_has_first_appt;

  v_steps := jsonb_build_array(
    jsonb_build_object('key','crm','label','Verificar CRM','done', COALESCE(v_dp.crm_verified,false)),
    jsonb_build_object('key','kyc','label','Verificação facial (KYC)','done', v_dp.kyc_status='approved'),
    jsonb_build_object('key','photo','label','Foto profissional','done', v_dp.professional_photo_url IS NOT NULL),
    jsonb_build_object('key','bio','label','Biografia preenchida','done', length(COALESCE(v_dp.bio,''))>=50),
    jsonb_build_object('key','price','label','Definir preço','done', COALESCE(v_dp.price,0)>0),
    jsonb_build_object('key','specialty','label','Adicionar especialidade','done', v_has_specialty),
    jsonb_build_object('key','availability','label','Configurar agenda','done', v_has_avail),
    jsonb_build_object('key','first_appointment','label','Primeira consulta concluída','done', v_has_first_appt)
  );

  SELECT count(*) INTO v_done FROM jsonb_array_elements(v_steps) e WHERE (e->>'done')::bool;

  RETURN jsonb_build_object(
    'doctor_id', v_dp.id,
    'progress_pct', ROUND(v_done::numeric * 100 / v_total),
    'completed', v_done, 'total', v_total,
    'badge', CASE WHEN v_done = v_total THEN 'gold' WHEN v_done >= 6 THEN 'silver' WHEN v_done >= 4 THEN 'bronze' ELSE 'starter' END,
    'steps', v_steps
  );
END $$;

-- Schedule new cron jobs
SELECT cron.schedule('release-doctor-payouts', '0 */2 * * *',
  $$ SELECT public.fn_release_doctor_payouts(); $$);
SELECT cron.schedule('idle-slot-suggestion', '0 9 * * 1',
  $$ SELECT public.fn_idle_slot_suggestion(); $$);
SELECT cron.schedule('daily-backup', '0 3 * * *',
  $$ SELECT public.invoke_edge_function('daily-backup', '{}'::jsonb); $$);
