-- ============================================================================
-- SECURITY FIX 3: Stop pg_cron / trigger edge-function calls from authenticating
-- with the PUBLIC anon key. Use the service-role key instead.
--
-- BACKGROUND (verified against migration history)
-- -----------------------------------------------
-- Every live scheduled job and status trigger that invokes an internal edge
-- function routes through ONE shared helper: public.invoke_edge_function(fn,
-- payload). The cron `command` strings themselves do NOT embed an Authorization
-- header -- e.g. the live jobs are literally:
--
--   daily-backup                  '0 3 * * *'   SELECT public.invoke_edge_function('daily-backup', '{}'::jsonb);
--   scheduled-tasks               '*/10 * * * *' SELECT public.invoke_edge_function('scheduled-tasks', '{}'::jsonb);
--   generate-sweepstake-tickets   '0 3 1 * *'   SELECT public.invoke_edge_function('generate-sweepstake-tickets', '{}'::jsonb);
--   notify-expired-prescriptions  '0 9 * * *'   SELECT public.invoke_edge_function('notify-expired-prescriptions', '{}'::jsonb);
--   appointment-reminders         '*/5 * * * *'  (see NOTE below)
--   appointment-confirmed         (trigger trg_appointment_status_automations)
--   post-consultation-survey      (trigger trg_appointment_status_automations)
--
-- The anon-key bearer therefore lives INSIDE invoke_edge_function (last defined
-- in 20260526000100_internal_function_secret.sql), which currently sends:
--     Authorization: Bearer <anon key of pwxvvimdtmvziynbspgx>
--     x-internal-secret: <app.settings.internal_function_secret>
-- The edge functions were hardened to require isInternalOrService(req), which
-- accepts EITHER a service-role bearer OR a valid x-internal-secret header.
--
-- FIX (chosen for minimal timing risk)
-- ------------------------------------
-- We re-define public.invoke_edge_function so it authenticates with the
-- SERVICE-ROLE key read from current_setting('app.settings.service_role_key',
-- true) -- the same GUC pattern already used by notify_whatsapp_on_confirmed
-- (20260221041437). We keep x-internal-secret as a belt-and-suspenders header.
-- Because the helper is the single choke point, this hardens ALL five live
-- http cron jobs AND both status triggers at once, WITHOUT unscheduling or
-- rescheduling anything -- so no job name or cron expression changes and there
-- is zero risk of altering timing.
--
-- The anon-key fallback is REMOVED: if the service-role GUC is unset the call
-- omits the bearer and relies on x-internal-secret (still authorized), rather
-- than silently falling back to the public anon key. See VERIFY note below.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.invoke_edge_function(fn_name text, payload jsonb DEFAULT '{}'::jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net
AS $$
DECLARE
  request_id bigint;
  base_url text := 'https://pwxvvimdtmvziynbspgx.supabase.co/functions/v1/';
  -- Service-role key (secret) — configured out-of-band via:
  --   ALTER DATABASE postgres SET app.settings.service_role_key = '<service-role-jwt>';
  service_key text := current_setting('app.settings.service_role_key', true);
  -- Internal shared secret kept as an alternative accepted by isInternalOrService.
  internal_secret text := current_setting('app.settings.internal_function_secret', true);
  auth_header text;
BEGIN
  -- Prefer the service-role bearer. If the GUC is not set, send an empty bearer
  -- and let x-internal-secret authorize the call — NEVER fall back to anon.
  IF service_key IS NOT NULL AND service_key <> '' THEN
    auth_header := 'Bearer ' || service_key;
  ELSE
    auth_header := '';
    RAISE WARNING 'invoke_edge_function(%): app.settings.service_role_key is not set; relying on x-internal-secret', fn_name;
  END IF;

  SELECT net.http_post(
    url := base_url || fn_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', auth_header,
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

-- ── Defensive: re-assert the four DO-block http cron jobs from 20260427b so the
--    schema cache / job commands are unambiguous. Names + cron expressions are
--    IDENTICAL to the live definitions (verified) — timing is preserved. They
--    call the hardened helper above. daily-backup (0 3 * * *) is left exactly as
--    scheduled in 20260515231910 and is intentionally NOT touched here.
--    appointment-reminders is intentionally NOT re-scheduled: its LATEST
--    definition (20260515233724) points at the in-DB function
--    public.fn_send_appointment_reminders() and makes no outbound HTTP call, so
--    it has no anon-key exposure to fix (see NOTE).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'scheduled-tasks') THEN
    PERFORM cron.unschedule('scheduled-tasks');
  END IF;
  PERFORM cron.schedule(
    'scheduled-tasks',
    '*/10 * * * *',
    $cron$ SELECT public.invoke_edge_function('scheduled-tasks', '{}'::jsonb); $cron$
  );

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-sweepstake-tickets') THEN
    PERFORM cron.unschedule('generate-sweepstake-tickets');
  END IF;
  PERFORM cron.schedule(
    'generate-sweepstake-tickets',
    '0 3 1 * *',
    $cron$ SELECT public.invoke_edge_function('generate-sweepstake-tickets', '{}'::jsonb); $cron$
  );

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'notify-expired-prescriptions') THEN
    PERFORM cron.unschedule('notify-expired-prescriptions');
  END IF;
  PERFORM cron.schedule(
    'notify-expired-prescriptions',
    '0 9 * * *',
    $cron$ SELECT public.invoke_edge_function('notify-expired-prescriptions', '{}'::jsonb); $cron$
  );

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-backup') THEN
    PERFORM cron.unschedule('daily-backup');
  END IF;
  PERFORM cron.schedule(
    'daily-backup',
    '0 3 * * *',
    $cron$ SELECT public.invoke_edge_function('daily-backup', '{}'::jsonb); $cron$
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'cron re-assert skipped (pg_cron unavailable?): %', SQLERRM;
END $$;

-- ============================================================================
-- NOTE (appointment-reminders / lembrete-consultas):
--   * 'lembrete-consultas' has NO cron job anywhere in migration history — the
--     Portuguese-named reminder flow is served by the 'appointment-reminders'
--     job. Nothing to re-point.
--   * The LIVE 'appointment-reminders' job ('*/5 * * * *', from 20260515233724)
--     runs the in-database function public.fn_send_appointment_reminders(),
--     which sends WhatsApp via public.invoke_edge_function('send-whatsapp', ...)
--     — i.e. it also benefits from the service-role hardening above. It makes no
--     direct anon-key HTTP call, so its schedule is deliberately left untouched.
--
-- FOLLOW-UP OPS TASK (do NOT run here — separate, potentially destructive):
--   Scrub historical public.activity_logs rows written by the old didit-kyc
--   logging that contain raw CPF / patient names in the `details` payload.
--   This is a data-scrub / LGPD concern, intentionally left as a TODO so this
--   security migration stays non-destructive. Suggested (for a dedicated,
--   reviewed migration/OPS job):
--     -- TODO(ops): UPDATE public.activity_logs
--     --   SET details = details - 'cpf' - 'patient_name' - 'full_name'
--     --   WHERE action ILIKE '%kyc%' OR action ILIKE '%didit%';
--     -- (verify key names against real rows before running; consider archiving.)
-- ============================================================================
