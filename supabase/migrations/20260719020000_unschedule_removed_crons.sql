-- =====================================================================
-- Desagenda crons órfãos que invocam edge functions REMOVIDAS
-- (senão falhariam em runtime). Não mexe em dados. Idempotente.
--   - generate-sweepstake-tickets  (Cartão Pingo — removido)
--   - notify-expired-prescriptions (oftalmologia — removido)
-- =====================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-sweepstake-tickets') THEN
    PERFORM cron.unschedule('generate-sweepstake-tickets');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'notify-expired-prescriptions') THEN
    PERFORM cron.unschedule('notify-expired-prescriptions');
  END IF;
EXCEPTION WHEN undefined_table OR undefined_function THEN
  NULL; -- pg_cron ausente: nada a fazer
END $$;
