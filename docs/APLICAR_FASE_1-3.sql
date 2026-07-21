-- ============================================================================
-- AloClinica — SQL consolidado das Fases 1-3 (correcoes de bugs P0/P1)
-- Aplicar UMA vez no Supabase: SQL Editor -> New query -> colar tudo -> Run.
-- Idempotente e seguro (0 transacoes financeiras existentes).
-- ============================================================================

-- (1) Repasse de fonte unica: valor REAL pago + pula split MP (sem pagamento duplo)
CREATE OR REPLACE FUNCTION public.fn_create_payout_on_completion()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
DECLARE v_paid NUMERIC; v_fee NUMERIC; v_net NUMERIC; v_pix TEXT; v_split BOOLEAN;
BEGIN
  IF NEW.status='completed' AND OLD.status IS DISTINCT FROM 'completed'
     AND NEW.payment_status IN ('confirmed','approved','received')
     AND NOT EXISTS (SELECT 1 FROM public.doctor_payouts WHERE appointment_id=NEW.id) THEN
    SELECT (dp.mp_access_token IS NOT NULL AND dp.mp_user_id IS NOT NULL), dp.pix_key
      INTO v_split, v_pix FROM public.doctor_profiles dp WHERE dp.id=NEW.doctor_id;
    IF COALESCE(v_split,false) THEN RETURN NEW; END IF;
    SELECT COALESCE(MAX(pt.amount_cents),0)/100.0 INTO v_paid FROM public.payment_transactions pt
      WHERE pt.resource_type='appointment' AND pt.resource_id=NEW.id::text AND pt.status='approved';
    IF v_paid IS NULL OR v_paid<=0 THEN RETURN NEW; END IF;
    v_fee:=ROUND(v_paid*0.20,2); v_net:=v_paid-v_fee;
    INSERT INTO public.doctor_payouts (doctor_id,appointment_id,gross_amount,platform_fee,net_amount,release_at,pix_key)
    VALUES (NEW.doctor_id,NEW.id,v_paid,v_fee,v_net,now()+interval '7 days',v_pix);
  END IF; RETURN NEW;
END $f$;

-- (2) Nota do medico recalculada no servidor (nao mais pelo cliente-paciente)
CREATE OR REPLACE FUNCTION public.fn_recompute_doctor_rating()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
DECLARE v_avg NUMERIC; v_cnt INTEGER;
BEGIN
  SELECT AVG(((s.nps_score::numeric/10)*5 + COALESCE(s.quality_score,(s.nps_score::numeric/10)*5))/2), COUNT(*)
    INTO v_avg, v_cnt FROM public.satisfaction_surveys s WHERE s.doctor_id=NEW.doctor_id;
  UPDATE public.doctor_profiles SET rating=ROUND(COALESCE(v_avg,0)::numeric,1), total_reviews=COALESCE(v_cnt,0) WHERE id=NEW.doctor_id;
  RETURN NEW;
END $f$;
DROP TRIGGER IF EXISTS trg_recompute_doctor_rating ON public.satisfaction_surveys;
CREATE TRIGGER trg_recompute_doctor_rating AFTER INSERT ON public.satisfaction_surveys
  FOR EACH ROW EXECUTE FUNCTION public.fn_recompute_doctor_rating();

-- (3) Cupom: consumo idempotente (1 uso por cupom+reference)
CREATE TABLE IF NOT EXISTS public.coupon_usages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), coupon_code text NOT NULL, reference_id text NOT NULL,
  user_id uuid, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (coupon_code, reference_id));
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins read coupon usages" ON public.coupon_usages;
CREATE POLICY "admins read coupon usages" ON public.coupon_usages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- (4) Clawback: reembolso cancela repasse ainda NAO pago
CREATE OR REPLACE FUNCTION public.fn_clawback_on_refund()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
BEGIN
  IF NEW.status='refunded' AND OLD.status IS DISTINCT FROM 'refunded'
     AND NEW.resource_type='appointment' AND NEW.resource_id IS NOT NULL THEN
    UPDATE public.doctor_payouts SET status='clawed_back', updated_at=now(),
      notes=COALESCE(notes,'')||' [clawback: consulta reembolsada]'
    WHERE appointment_id=NEW.resource_id::uuid AND status IN ('pending','ready');
  END IF; RETURN NEW;
END $f$;
DROP TRIGGER IF EXISTS trg_clawback_on_refund ON public.payment_transactions;
CREATE TRIGGER trg_clawback_on_refund AFTER UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.fn_clawback_on_refund();

-- (5) Preferencias de notificacao na CONTA (backend respeita)
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  prefs jsonb NOT NULL DEFAULT '{}'::jsonb, updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own notif prefs" ON public.notification_preferences;
CREATE POLICY "own notif prefs" ON public.notification_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- (6) Saque: saldo real + claim/unclaim atomico (fim do double-spend)
CREATE OR REPLACE FUNCTION public.fn_doctor_available_balance(p_doctor_id uuid)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT COALESCE(SUM(net_amount), 0)::numeric
  FROM public.doctor_payouts WHERE doctor_id = p_doctor_id AND status = 'ready';
$$;

CREATE OR REPLACE FUNCTION public.fn_claim_ready_payouts(p_doctor_id uuid, p_pix_tx_id text DEFAULT NULL)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_total numeric;
BEGIN
  WITH claimed AS (
    UPDATE public.doctor_payouts
       SET status='paid', paid_at=now(), updated_at=now(), pix_tx_id=COALESCE(p_pix_tx_id, pix_tx_id)
     WHERE doctor_id=p_doctor_id AND status='ready' RETURNING net_amount
  )
  SELECT COALESCE(SUM(net_amount),0) INTO v_total FROM claimed;
  RETURN v_total;
END $$;

CREATE OR REPLACE FUNCTION public.fn_unclaim_payouts(p_doctor_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  UPDATE public.doctor_payouts SET status='ready', paid_at=NULL, updated_at=now()
  WHERE doctor_id=p_doctor_id AND status='paid' AND paid_at > now() - interval '5 minutes';
$$;
