
-- ============================================
-- 1. SCHEMA ADDITIONS
-- ============================================

-- Support tickets: AI triage fields
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,
  ADD COLUMN IF NOT EXISTS ai_category_suggested TEXT,
  ADD COLUMN IF NOT EXISTS ai_priority_suggested TEXT,
  ADD COLUMN IF NOT EXISTS ai_triaged_at TIMESTAMPTZ;

-- Appointments: AI clinical summary
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS ai_clinical_summary TEXT,
  ADD COLUMN IF NOT EXISTS ai_summary_generated_at TIMESTAMPTZ;

-- Profiles: account status + last consultation
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS last_consultation_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS account_blocked_reason TEXT,
  ADD COLUMN IF NOT EXISTS reengagement_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS churn_flagged_at TIMESTAMPTZ;

-- Doctor profiles: auto-pause
ALTER TABLE public.doctor_profiles
  ADD COLUMN IF NOT EXISTS auto_paused_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_pause_reason TEXT,
  ADD COLUMN IF NOT EXISTS price_suggestion_sent_at TIMESTAMPTZ;

-- Subscriptions: retry tracking
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pix_reminder_sent_at TIMESTAMPTZ;

-- ============================================
-- 2. TRIGGERS
-- ============================================

-- Trigger: AI ticket triage on insert
CREATE OR REPLACE FUNCTION public.fn_trigger_ticket_triage()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.ai_triaged_at IS NULL THEN
    PERFORM public.invoke_edge_function(
      'ai-ticket-triage',
      jsonb_build_object('ticket_id', NEW.id::text)
    );
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_ticket_triage ON public.support_tickets;
CREATE TRIGGER trg_ticket_triage
  AFTER INSERT ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.fn_trigger_ticket_triage();

-- Trigger: AI clinical summary after appointment completed
CREATE OR REPLACE FUNCTION public.fn_trigger_clinical_summary()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'completed'
     AND OLD.status IS DISTINCT FROM 'completed'
     AND NEW.notes IS NOT NULL
     AND NEW.ai_summary_generated_at IS NULL
  THEN
    PERFORM public.invoke_edge_function(
      'auto-clinical-summary',
      jsonb_build_object('appointment_id', NEW.id::text)
    );

    -- Update profile last_consultation_at
    IF NEW.patient_id IS NOT NULL THEN
      UPDATE public.profiles
        SET last_consultation_at = now()
      WHERE user_id = NEW.patient_id;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_clinical_summary ON public.appointments;
CREATE TRIGGER trg_clinical_summary
  AFTER UPDATE OF status ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.fn_trigger_clinical_summary();

-- Trigger: block defaulter from booking
CREATE OR REPLACE FUNCTION public.fn_block_defaulter()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_status TEXT;
BEGIN
  IF NEW.patient_id IS NULL THEN RETURN NEW; END IF;

  SELECT account_status INTO v_status FROM public.profiles WHERE user_id = NEW.patient_id;
  IF v_status = 'blocked' THEN
    RAISE EXCEPTION 'Conta bloqueada por pendência financeira. Regularize para agendar nova consulta.';
  END IF;

  -- Check unpaid > 30d or refund_pending
  IF EXISTS (
    SELECT 1 FROM public.appointments
    WHERE patient_id = NEW.patient_id
      AND (
        (payment_status = 'pending' AND created_at < now() - interval '30 days')
        OR payment_status = 'refund_pending'
      )
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    UPDATE public.profiles
      SET account_status = 'blocked',
          account_blocked_reason = 'Pagamento pendente há mais de 30 dias'
    WHERE user_id = NEW.patient_id;
    RAISE EXCEPTION 'Há cobranças pendentes na sua conta. Regularize antes de agendar.';
  END IF;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_block_defaulter ON public.appointments;
CREATE TRIGGER trg_block_defaulter
  BEFORE INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.fn_block_defaulter();

-- ============================================
-- 3. CRON-DRIVEN FUNCTIONS
-- ============================================

-- 3a. Subscription retry (1/3/7 days backoff)
CREATE OR REPLACE FUNCTION public.fn_subscription_retry()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s RECORD;
BEGIN
  FOR s IN
    SELECT id, user_id, retry_count
    FROM public.subscriptions
    WHERE status IN ('past_due', 'payment_failed')
      AND retry_count < 3
      AND (last_retry_at IS NULL OR last_retry_at < now() - (
        CASE retry_count WHEN 0 THEN interval '1 day'
                         WHEN 1 THEN interval '3 days'
                         ELSE interval '7 days' END
      ))
  LOOP
    PERFORM public.invoke_edge_function(
      'mercadopago-charge-saved-card',
      jsonb_build_object('subscription_id', s.id::text, 'is_retry', true)
    );
    UPDATE public.subscriptions
      SET retry_count = retry_count + 1,
          last_retry_at = now()
    WHERE id = s.id;
  END LOOP;

  -- Mark exhausted retries as cancelled
  UPDATE public.subscriptions
    SET status = 'cancelled',
        cancelled_at = now()
  WHERE status IN ('past_due','payment_failed') AND retry_count >= 3;
END; $$;

-- 3b. PIX expiry reminder (10min before expiry)
CREATE OR REPLACE FUNCTION public.fn_pix_expiry_reminder()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE pix RECORD;
BEGIN
  FOR pix IN
    SELECT a.id, a.patient_id, a.scheduled_at, a.price_at_booking, a.created_at
    FROM public.appointments a
    WHERE a.status = 'scheduled'
      AND a.payment_status = 'pending'
      AND a.created_at BETWEEN now() - interval '25 minutes' AND now() - interval '20 minutes'
      AND a.patient_id IS NOT NULL
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      pix.patient_id,
      '⏰ PIX expirando em 10 minutos',
      'Seu PIX para a consulta expira em breve. Pague para confirmar o agendamento.',
      'urgent',
      '/dashboard/appointments/' || pix.id
    );
  END LOOP;
END; $$;

-- 3c. NPS WhatsApp follow-up (30min after completed)
CREATE OR REPLACE FUNCTION public.fn_nps_whatsapp_followup()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT a.id, a.patient_id, p.phone, p.first_name
    FROM public.appointments a
    JOIN public.profiles p ON p.user_id = a.patient_id
    WHERE a.status = 'completed'
      AND a.updated_at BETWEEN now() - interval '40 minutes' AND now() - interval '30 minutes'
      AND p.phone IS NOT NULL AND p.phone <> ''
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.user_id = a.patient_id
          AND n.type = 'survey'
          AND n.created_at > now() - interval '2 hours'
      )
  LOOP
    PERFORM public.invoke_edge_function(
      'send-whatsapp',
      jsonb_build_object(
        'phone', r.phone,
        'message', 'Olá ' || COALESCE(r.first_name, '') || '! 💚 Como foi sua consulta? Avalie em: ' ||
                   COALESCE(current_setting('app.site_url', true), 'https://aloclinica.com.br') ||
                   '/dashboard/survey/' || r.id
      )
    );
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (r.patient_id, 'Como foi sua consulta?', 'Avalie seu atendimento.', 'survey', '/dashboard/survey/' || r.id);
  END LOOP;
END; $$;

-- 3d. Re-engagement for inactive (60+ days no consultation)
CREATE OR REPLACE FUNCTION public.fn_reengagement_inactive()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE p RECORD;
BEGIN
  FOR p IN
    SELECT user_id, first_name FROM public.profiles
    WHERE last_consultation_at IS NOT NULL
      AND last_consultation_at < now() - interval '60 days'
      AND (reengagement_sent_at IS NULL OR reengagement_sent_at < now() - interval '90 days')
      AND account_status = 'active'
    LIMIT 100
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      p.user_id,
      '💚 Sentimos sua falta!',
      'Olá ' || COALESCE(p.first_name, '') || ', use o cupom VOLTEI20 para 20% off na próxima consulta.',
      'promo',
      '/dashboard/book?coupon=VOLTEI20'
    );
    UPDATE public.profiles SET reengagement_sent_at = now() WHERE user_id = p.user_id;
  END LOOP;
END; $$;

-- 3e. Suggest price increase to top doctors
CREATE OR REPLACE FUNCTION public.fn_suggest_price_increase()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE d RECORD;
BEGIN
  FOR d IN
    SELECT dp.id, dp.user_id, dp.price, dp.rating
    FROM public.doctor_profiles dp
    WHERE dp.is_approved = true
      AND dp.rating >= 4.8
      AND dp.price < 200
      AND (dp.price_suggestion_sent_at IS NULL OR dp.price_suggestion_sent_at < now() - interval '60 days')
      AND (
        SELECT COUNT(*) FROM public.appointments a
        WHERE a.doctor_id = dp.id
          AND a.status = 'completed'
          AND a.updated_at > now() - interval '30 days'
      ) >= 20
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      d.user_id,
      '💰 Sua avaliação está excelente!',
      'Com nota ' || d.rating || ' e alta demanda, considere ajustar seu preço de R$ ' || d.price || ' para R$ ' || (d.price * 1.15)::int || '. Você decide.',
      'info',
      '/dashboard/doctor/profile'
    );
    UPDATE public.doctor_profiles SET price_suggestion_sent_at = now() WHERE id = d.id;
  END LOOP;
END; $$;

-- 3f. Auto-pause doctor with 3 no-shows in 7 days
CREATE OR REPLACE FUNCTION public.fn_auto_pause_doctor_no_shows()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE d RECORD; admin_id UUID;
BEGIN
  SELECT user_id INTO admin_id FROM public.user_roles WHERE role = 'admin' LIMIT 1;

  FOR d IN
    SELECT a.doctor_id, dp.user_id, COUNT(*) AS ns_count
    FROM public.appointments a
    JOIN public.doctor_profiles dp ON dp.id = a.doctor_id
    WHERE a.status = 'no_show'
      AND a.cancelled_by = a.doctor_id::text
      AND a.updated_at > now() - interval '7 days'
      AND dp.auto_paused_at IS NULL
      AND dp.is_approved = true
    GROUP BY a.doctor_id, dp.user_id
    HAVING COUNT(*) >= 3
  LOOP
    UPDATE public.doctor_profiles
      SET available_now = false,
          is_approved = false,
          auto_paused_at = now(),
          auto_pause_reason = 'Pausa automática: ' || d.ns_count || ' no-shows em 7 dias'
    WHERE id = d.doctor_id;

    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (d.user_id, '⛔ Conta pausada', 'Você acumulou ' || d.ns_count || ' no-shows em 7 dias. Entre em contato com o suporte.', 'urgent', '/dashboard');

    IF admin_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (admin_id, '⚠️ Médico pausado automaticamente', 'Doctor ' || d.doctor_id || ' pausado: ' || d.ns_count || ' no-shows.', 'warning', '/dashboard/admin/doctors');
    END IF;
  END LOOP;
END; $$;

-- 3g. Detect churn (2 consecutive cancellations)
CREATE OR REPLACE FUNCTION public.fn_detect_churn()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE p RECORD; admin_id UUID;
BEGIN
  SELECT user_id INTO admin_id FROM public.user_roles WHERE role = 'admin' LIMIT 1;
  IF admin_id IS NULL THEN RETURN; END IF;

  FOR p IN
    SELECT patient_id
    FROM public.appointments
    WHERE patient_id IS NOT NULL
      AND created_at > now() - interval '30 days'
    GROUP BY patient_id
    HAVING COUNT(*) FILTER (WHERE status = 'cancelled') >= 2
       AND COUNT(*) FILTER (WHERE status = 'cancelled') = COUNT(*)
  LOOP
    UPDATE public.profiles
      SET churn_flagged_at = now()
    WHERE user_id = p.patient_id
      AND (churn_flagged_at IS NULL OR churn_flagged_at < now() - interval '30 days');

    IF FOUND THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (admin_id, '🚨 Risco de churn', 'Paciente cancelou 2+ consultas seguidas: ' || p.patient_id, 'warning', '/dashboard/admin/users');
    END IF;
  END LOOP;
END; $$;

-- 3h. LGPD anonymization (5+ years inactive)
CREATE OR REPLACE FUNCTION public.fn_anonymize_old_patients()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.profiles
    SET first_name = 'Anonimizado',
        last_name = '',
        phone = NULL,
        cpf = NULL,
        date_of_birth = NULL,
        avatar_url = NULL,
        account_status = 'anonymized'
  WHERE account_status <> 'anonymized'
    AND last_consultation_at IS NOT NULL
    AND last_consultation_at < now() - interval '5 years';
END; $$;

-- ============================================
-- 4. CLEANUP STALE CRON JOBS (wrong project ref)
-- ============================================
DO $$
DECLARE j RECORD;
BEGIN
  FOR j IN SELECT jobid, jobname FROM cron.job
           WHERE command LIKE '%oaixgmuocuwhsabidpei%'
  LOOP
    PERFORM cron.unschedule(j.jobid);
  END LOOP;
END $$;

-- ============================================
-- 5. SCHEDULE NEW CRON JOBS (correct project)
-- ============================================
DO $$
BEGIN
  -- Unschedule existing if present
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname IN (
    'subscription-retry','pix-expiry-reminder','nps-whatsapp-followup',
    'reengagement-inactive','suggest-price-increase','auto-pause-doctors',
    'detect-churn','anonymize-old-patients','weekly-admin-report'
  );
END $$;

SELECT cron.schedule('subscription-retry', '0 */6 * * *', $$SELECT public.fn_subscription_retry()$$);
SELECT cron.schedule('pix-expiry-reminder', '*/5 * * * *', $$SELECT public.fn_pix_expiry_reminder()$$);
SELECT cron.schedule('nps-whatsapp-followup', '*/10 * * * *', $$SELECT public.fn_nps_whatsapp_followup()$$);
SELECT cron.schedule('reengagement-inactive', '0 10 * * *', $$SELECT public.fn_reengagement_inactive()$$);
SELECT cron.schedule('suggest-price-increase', '0 11 * * 1', $$SELECT public.fn_suggest_price_increase()$$);
SELECT cron.schedule('auto-pause-doctors', '0 * * * *', $$SELECT public.fn_auto_pause_doctor_no_shows()$$);
SELECT cron.schedule('detect-churn', '0 9 * * *', $$SELECT public.fn_detect_churn()$$);
SELECT cron.schedule('anonymize-old-patients', '0 3 * * 0', $$SELECT public.fn_anonymize_old_patients()$$);
SELECT cron.schedule('weekly-admin-report', '0 9 * * 1', $$SELECT public.invoke_edge_function('weekly-admin-report', '{}'::jsonb)$$);
