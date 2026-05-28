-- pg_cron diário: dispara a edge function auto-payout-tick às 11:00 UTC (08:00 BRT)
-- A função consulta doctor_profiles.payout_frequency e cria withdrawal_requests
-- automáticos para os médicos cujo dia de repasse é hoje.

-- (pg_cron e pg_net já estão habilitados no projeto)
-- Remove agendamento anterior caso exista (idempotente)
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'auto-payout-daily';

SELECT cron.schedule(
  'auto-payout-daily',
  '0 11 * * *',
  $cron$
  SELECT net.http_post(
    url     := 'https://pwxvvimdtmvziynbspgx.supabase.co/functions/v1/auto-payout-tick',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'x-tick-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'auto_payout_tick_secret' LIMIT 1)
    ),
    body    := '{}'::jsonb
  );
  $cron$
);
