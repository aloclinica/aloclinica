-- =============================================================
-- Inject an internal shared secret into trigger->edge-function calls.
--
-- Trigger/cron-driven functions (process-refund, ai-ticket-triage,
-- auto-clinical-summary, suggest-reschedule, ...) now reject calls that don't
-- present `x-internal-secret`. This recreates public.invoke_edge_function so
-- every trigger automatically forwards that header.
--
-- REQUIRED CONFIG (must match the edge functions' INTERNAL_FUNCTION_SECRET):
--   ALTER DATABASE postgres SET app.settings.internal_function_secret = '<segredo>';
-- (and `supabase secrets set INTERNAL_FUNCTION_SECRET=<mesmo-segredo>`)
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
  internal_secret text := current_setting('app.settings.internal_function_secret', true);
BEGIN
  SELECT net.http_post(
    url := base_url || fn_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
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
