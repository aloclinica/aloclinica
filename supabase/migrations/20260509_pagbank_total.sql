-- ===================================================================
-- PAGBANK TOTAL — schema completo para pagamentos + assinaturas + vault
-- ===================================================================
-- Cobre:
--   1. saved_cards (vault PagBank)
--   2. subscriptions augmentation (next_charge_at, saved_card_id, pagbank_id)
--   3. payment_transactions (log unificado de TODAS as cobranças)
--   4. cron schedule de cobranças recorrentes
--   5. RLS policies
-- ===================================================================

-- ──────────────────────────────────────────────────────────────────
-- 1. SAVED CARDS — vault de cartões reutilizáveis
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.saved_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- ID do cartão tokenizado no PagBank (reutilizável)
  pagbank_card_id TEXT NOT NULL,
  -- Metadata exibida na UI (nunca o número completo)
  last4 TEXT NOT NULL CHECK (last4 ~ '^[0-9]{4}$'),
  brand TEXT, -- VISA, MASTERCARD, AMEX, ELO, HIPERCARD
  holder_name TEXT,
  expiry_month TEXT,  -- MM
  expiry_year TEXT,   -- YYYY
  is_default BOOLEAN NOT NULL DEFAULT false,
  -- Estado
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Soft delete
  removed_at TIMESTAMPTZ,
  UNIQUE (user_id, pagbank_card_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_cards_user ON public.saved_cards (user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_saved_cards_default ON public.saved_cards (user_id, is_default) WHERE is_default = true;

-- Garante apenas 1 cartão default por usuário
CREATE UNIQUE INDEX IF NOT EXISTS uniq_saved_cards_default_per_user
  ON public.saved_cards (user_id) WHERE is_default = true;

ALTER TABLE public.saved_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users view own cards" ON public.saved_cards;
CREATE POLICY "users view own cards" ON public.saved_cards
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users manage own cards" ON public.saved_cards;
CREATE POLICY "users manage own cards" ON public.saved_cards
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "service role full" ON public.saved_cards;
CREATE POLICY "service role full" ON public.saved_cards FOR ALL TO service_role USING (true);

-- ──────────────────────────────────────────────────────────────────
-- 2. SUBSCRIPTIONS — augmentation
-- ──────────────────────────────────────────────────────────────────
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS pagbank_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS saved_card_id UUID REFERENCES public.saved_cards(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS next_charge_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_charge_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_charge_status TEXT,
  ADD COLUMN IF NOT EXISTS interval_days INT NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS amount_cents INT,
  ADD COLUMN IF NOT EXISTS retry_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_subscriptions_next_charge
  ON public.subscriptions (next_charge_at)
  WHERE status = 'active' AND next_charge_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_active
  ON public.subscriptions (user_id) WHERE status = 'active';

-- ──────────────────────────────────────────────────────────────────
-- 3. PAYMENT TRANSACTIONS — log unificado de todas cobranças
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Vincula ao recurso pago (genérico)
  resource_type TEXT NOT NULL CHECK (resource_type IN (
    'appointment', 'subscription', 'prescription_renewal', 'urgent_queue',
    'optical_order', 'pingo_card', 'b2b_lead', 'other'
  )),
  resource_id TEXT NOT NULL,
  -- PagBank
  pagbank_order_id TEXT,
  pagbank_charge_id TEXT,
  -- Valor + método
  amount_cents INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('PIX', 'CREDIT_CARD', 'BOLETO', 'SAVED_CARD')),
  saved_card_id UUID REFERENCES public.saved_cards(id) ON DELETE SET NULL,
  installments INT,
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'authorized', 'paid', 'declined', 'cancelled', 'refunded', 'partial_refund', 'failed'
  )),
  -- Refund tracking
  refund_amount_cents INT,
  refunded_at TIMESTAMPTZ,
  refund_reason TEXT,
  -- Eventos
  authorized_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  -- Detalhes
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  raw_response JSONB,  -- payload completo do PagBank para debug
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_tx_user ON public.payment_transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_tx_resource ON public.payment_transactions (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_pagbank_order ON public.payment_transactions (pagbank_order_id) WHERE pagbank_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_tx_pagbank_charge ON public.payment_transactions (pagbank_charge_id) WHERE pagbank_charge_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_tx_status ON public.payment_transactions (status, created_at DESC);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users view own transactions" ON public.payment_transactions;
CREATE POLICY "users view own transactions" ON public.payment_transactions
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "service role full tx" ON public.payment_transactions;
CREATE POLICY "service role full tx" ON public.payment_transactions FOR ALL TO service_role USING (true);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.touch_payment_transactions()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS payment_tx_touch ON public.payment_transactions;
CREATE TRIGGER payment_tx_touch BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.touch_payment_transactions();

DROP TRIGGER IF EXISTS saved_cards_touch ON public.saved_cards;
CREATE TRIGGER saved_cards_touch BEFORE UPDATE ON public.saved_cards
  FOR EACH ROW EXECUTE FUNCTION public.touch_payment_transactions();

-- ──────────────────────────────────────────────────────────────────
-- 4. CRON job — cobrança de assinaturas
-- ──────────────────────────────────────────────────────────────────
-- Função que invoca a edge function pagbank-charge-saved-card para cada
-- assinatura com next_charge_at <= now(). Roda diariamente às 06:00 BRT.

CREATE OR REPLACE FUNCTION public.process_recurring_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sub RECORD;
  v_url TEXT;
  v_anon_key TEXT;
BEGIN
  -- Lê secrets do vault
  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'project_url';
  SELECT decrypted_secret INTO v_anon_key FROM vault.decrypted_secrets WHERE name = 'service_role_key';

  IF v_url IS NULL OR v_anon_key IS NULL THEN
    RAISE NOTICE '[process_recurring_subscriptions] secrets ausentes (project_url ou service_role_key) — pulando';
    RETURN;
  END IF;

  FOR v_sub IN
    SELECT id, user_id, plan_id, saved_card_id, amount_cents, retry_count
      FROM public.subscriptions
     WHERE status = 'active'
       AND next_charge_at <= NOW()
       AND saved_card_id IS NOT NULL
       AND amount_cents IS NOT NULL
       AND retry_count < 3
     ORDER BY next_charge_at ASC
     LIMIT 100
  LOOP
    BEGIN
      PERFORM net.http_post(
        url := v_url || '/functions/v1/pagbank-charge-saved-card',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_anon_key
        ),
        body := jsonb_build_object(
          'subscriptionId', v_sub.id,
          'savedCardId', v_sub.saved_card_id,
          'amountCents', v_sub.amount_cents,
          'description', 'Renovação automática de assinatura',
          'resourceType', 'subscription',
          'resourceId', v_sub.id::text
        )
      );

      -- Marca tentativa em retry_count para evitar duplicação se cron rodar 2x
      UPDATE public.subscriptions
         SET retry_count = retry_count + 1
       WHERE id = v_sub.id;
    EXCEPTION WHEN OTHERS THEN
      -- Não para o loop se uma sub falhar
      RAISE NOTICE '[process_recurring_subscriptions] erro sub %: %', v_sub.id, SQLERRM;
    END;
  END LOOP;
END;
$$;

-- Agenda diária às 09:00 UTC (06:00 BRT). pg_cron deve estar habilitado no projeto.
-- Se a extensão não existir, o agendamento é silenciosamente ignorado pelo IF.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remove versão anterior se existir (idempotente)
    PERFORM cron.unschedule('process_recurring_subscriptions')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process_recurring_subscriptions');
    PERFORM cron.schedule(
      'process_recurring_subscriptions',
      '0 9 * * *',
      $cron$ SELECT public.process_recurring_subscriptions(); $cron$
    );
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────────────
-- 5. COMENTÁRIOS — apenas se a coluna existir
-- ──────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='subscriptions'
               AND column_name='pagbank_subscription_id') THEN
    EXECUTE $c$COMMENT ON COLUMN public.subscriptions.pagbank_subscription_id IS
      'ID interno (não API PagBank — usamos cron próprio). Reservado para futuro.'$c$;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='subscriptions'
               AND column_name='next_charge_at') THEN
    EXECUTE $c$COMMENT ON COLUMN public.subscriptions.next_charge_at IS
      'Quando o cron deve cobrar de novo. Atualizado em cada cobrança bem-sucedida.'$c$;
  END IF;
END $$;
