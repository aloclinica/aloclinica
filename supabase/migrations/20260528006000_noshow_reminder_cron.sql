-- pg_cron: dispara no-show-reminder-tick a cada hora.
-- O job 41 (auto-payout-daily) já existe; aqui é um job separado.

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'no-show-reminder-hourly';

SELECT cron.schedule(
  'no-show-reminder-hourly',
  '0 * * * *',
  $cron$
  SELECT net.http_post(
    url     := 'https://pwxvvimdtmvziynbspgx.supabase.co/functions/v1/no-show-reminder-tick',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'x-tick-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'auto_payout_tick_secret' LIMIT 1)
    ),
    body    := '{}'::jsonb
  );
  $cron$
);
