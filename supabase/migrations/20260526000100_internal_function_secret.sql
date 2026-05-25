-- =============================================================
-- Trigger -> edge-function call hardening / correctness.
--
-- 1. invoke_edge_function now sends BOTH:
--      - Authorization: Bearer <anon key of the CORRECT project> → satisfies
--        the gateway's verify_jwt for functions that require a JWT
--        (send-email, send-whatsapp, send-push-notification, ...).
--      - x-internal-secret → satisfies the in-function guards of the
--        sensitive trigger-only functions (process-refund, ai-ticket-triage,
--        auto-clinical-summary, suggest-reschedule).
--    The anon key is public (also shipped in the client bundle) — safe to embed.
--
-- 2. fn_trigger_edge_email is rewired off the hardcoded WRONG project ref
--    (oaixgmuocuwhsabidpei) onto invoke_edge_function (correct ref + secret).
--
-- REQUIRED CONFIG (must match the edge functions' INTERNAL_FUNCTION_SECRET):
--   ALTER DATABASE postgres SET app.settings.internal_function_secret = '<segredo>';
--   supabase secrets set INTERNAL_FUNCTION_SECRET=<mesmo-segredo>
-- =============================================================

CREATE OR REPLACE FUNCTION public.invoke_edge_function(fn_name text, payload jsonb DEFAULT '{}'::jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net
AS $$
DECLARE
  request_id bigint;
  base_url text := 'https://pwxvvimdtmvziynbspgx.supabase.co/functions/v1/';
  -- Public anon key for project pwxvvimdtmvziynbspgx (not a secret).
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3eHZ2aW1kdG12eml5bmJzcGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMjMwNDAsImV4cCI6MjA5MTY5OTA0MH0.GYOrbxDlr_GxII92m6Fk7BiVoT5D2uuAk4Uhn0PZzNM';
  internal_secret text := current_setting('app.settings.internal_function_secret', true);
BEGIN
  SELECT net.http_post(
    url := base_url || fn_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key,
      'x-internal-secret', COALESCE(internal_secret, '')
    ),
    body := payload,
    timeout_milliseconds := 30000
  ) INTO request_id;
  RETURN request_id;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'invoke_edge_function(%) failed: %', fn_name, SQLERRM;
  RETURN NULL;
END $$;

-- ── Rewire fn_trigger_edge_email off the wrong project ref ──
CREATE OR REPLACE FUNCTION public.fn_trigger_edge_email(
  p_type TEXT,
  p_to   TEXT,
  p_data JSONB
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_to IS NULL OR p_to = '' THEN
    RETURN;
  END IF;
  PERFORM public.invoke_edge_function(
    'send-email',
    jsonb_build_object('type', p_type, 'to', p_to, 'data', COALESCE(p_data, '{}'::jsonb))
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'fn_trigger_edge_email failed (non-blocking): %', SQLERRM;
END;
$$;

-- ── Rewire auto_trigger_post_consultation_survey off the wrong project ref ──
CREATE OR REPLACE FUNCTION public.auto_trigger_post_consultation_survey()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
    -- Send in-app notification to patient
    IF NEW.patient_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        NEW.patient_id,
        '⭐ Avalie sua consulta',
        'Como foi sua experiência? Sua avaliação nos ajuda a melhorar!',
        'survey',
        '/dashboard/rate/' || NEW.id || '?role=patient'
      );
    END IF;

    -- Fire edge function for email/whatsapp survey (correct ref + secret).
    PERFORM public.invoke_edge_function(
      'post-consultation-survey',
      jsonb_build_object('appointment_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- ── Defensive: unschedule any cron still pointing at the wrong project ref ──
DO $$
DECLARE j RECORD;
BEGIN
  FOR j IN SELECT jobid FROM cron.job WHERE command LIKE '%oaixgmuocuwhsabidpei%' LOOP
    PERFORM cron.unschedule(j.jobid);
  END LOOP;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'cron cleanup skipped: %', SQLERRM;
END $$;
