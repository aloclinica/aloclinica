-- ============================================================================
-- Security hardening — payment support schema (2026-07-01)
--
-- Supports the hardened payment edge functions:
--   * mp-oauth-callback     -> requires an anti-CSRF state store (mp_oauth_states)
--   * mercadopago-create-payment / charge-saved-card -> derive the charge amount
--     SERVER-SIDE from the resource. The consolidated schema dropped the price
--     columns for on-demand queue and prescription renewals, so those payment
--     types would fail-secure (400) until the columns exist again.
-- Idempotent: safe to run once.
-- ============================================================================

-- 1) Anti-CSRF state for the Mercado Pago OAuth (marketplace onboarding) flow.
--    The initiator function inserts (state, user_id, short TTL); the callback
--    verifies + single-uses it. Only service_role touches this table.
CREATE TABLE IF NOT EXISTS public.mp_oauth_states (
  state       text PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mp_oauth_states ENABLE ROW LEVEL SECURITY;
-- No policies => no anon/authenticated access; only the service_role (which
-- bypasses RLS) can read/write. That is exactly what the edge functions use.
CREATE INDEX IF NOT EXISTS idx_mp_oauth_states_expires ON public.mp_oauth_states (expires_at);

-- 2) Restore the server-side price for on-demand (urgent) queue consultations.
--    Original default was R$ 75 before the consolidated rebuild dropped it.
ALTER TABLE public.on_demand_queue
  ADD COLUMN IF NOT EXISTS price numeric NOT NULL DEFAULT 75;

-- 3) Add the server-side price for prescription renewals.
--    NOTE: the renewal-creation flow SHOULD set the real price per renewal.
--    Default 0 is fail-secure: create-payment rejects amounts <= 0, so a
--    misconfigured renewal cannot be charged an arbitrary/zero value silently.
ALTER TABLE public.prescription_renewals
  ADD COLUMN IF NOT EXISTS price numeric NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.prescription_renewals.price IS
  'Preço (em reais) da renovação, definido no momento da criação. create-payment usa este valor no servidor.';

-- 4) Defense-in-depth: ensure mp_payment_id is unique so idempotent upserts in
--    payment functions cannot create duplicate rows under concurrency.
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_transactions_mp_payment_id
  ON public.payment_transactions (mp_payment_id)
  WHERE mp_payment_id IS NOT NULL;
