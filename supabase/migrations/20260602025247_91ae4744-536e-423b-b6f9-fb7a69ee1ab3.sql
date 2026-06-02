-- 1. Unschedule cron job if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('process_recurring_subscriptions')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process_recurring_subscriptions');
  END IF;
END $$;

-- 2. Drop functions (this also removes triggers)
DROP FUNCTION IF EXISTS public.process_recurring_subscriptions() CASCADE;
DROP FUNCTION IF EXISTS public.touch_payment_transactions() CASCADE;

-- 3. Drop tables (CASCADE handles RLS policies and indexes)
DROP TABLE IF EXISTS public.payment_transactions CASCADE;
DROP TABLE IF EXISTS public.saved_cards CASCADE;

-- 4. Remove columns from subscriptions
ALTER TABLE public.subscriptions
  DROP COLUMN IF EXISTS pagbank_subscription_id,
  DROP COLUMN IF EXISTS saved_card_id,
  DROP COLUMN IF EXISTS next_charge_at,
  DROP COLUMN IF EXISTS last_charge_at,
  DROP COLUMN IF EXISTS last_charge_status,
  DROP COLUMN IF EXISTS interval_days,
  DROP COLUMN IF EXISTS currency,
  DROP COLUMN IF EXISTS amount_cents,
  DROP COLUMN IF EXISTS retry_count,
  DROP COLUMN IF EXISTS metadata;
