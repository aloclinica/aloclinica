-- ================================================================
-- AloClinica — SQL FINANCEIRO para aplicar no Supabase SQL Editor
-- (o assistente nao pode aplicar DDL financeiro automaticamente)
-- Como aplicar: Supabase Dashboard > SQL Editor > New query >
--   cole TUDO abaixo > Run. Seguro: 0 transacoes financeiras hoje.
-- ================================================================

-- ===== BLOCO 1: cupom (coupon_usages) + clawback no reembolso =====
-- FASE 1 (financeiro): consumo de cupom idempotente + clawback de repasse no reembolso.

-- 1) Registro de uso de cupom (idempotencia: 1 uso por (cupom, reference)).
--    O edge mercadopago-create-payment insere aqui e so entao incrementa
--    coupons.times_used (fn_increment_coupon_usage_atomic). Antes, times_used
--    nunca subia -> cupom com limite virava ilimitado.
CREATE TABLE IF NOT EXISTS public.coupon_usages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_code text NOT NULL,
  reference_id text NOT NULL,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coupon_code, reference_id)
);
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins read coupon usages" ON public.coupon_usages;
CREATE POLICY "admins read coupon usages" ON public.coupon_usages
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
-- (writes only via service_role no edge; service_role bypassa RLS)

-- 2) Clawback: ao reembolsar a consulta, cancela o repasse do medico se ainda NAO
--    foi pago. doctor_payouts.status: pending -> ready -> paid. So estorna
--    pending/ready (nunca 'paid'/'completed'). Fecha o buraco de "reembolso nao
--    reverte o credito do medico".
CREATE OR REPLACE FUNCTION public.fn_clawback_on_refund()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'refunded'
     AND OLD.status IS DISTINCT FROM 'refunded'
     AND NEW.resource_type = 'appointment'
     AND NEW.resource_id IS NOT NULL THEN
    UPDATE public.doctor_payouts
       SET status = 'clawed_back',
           updated_at = now(),
           notes = COALESCE(notes, '') || ' [clawback: consulta reembolsada]'
     WHERE appointment_id = NEW.resource_id::uuid
       AND status IN ('pending', 'ready');
  END IF;
  RETURN NEW;
END
$function$;

DROP TRIGGER IF EXISTS trg_clawback_on_refund ON public.payment_transactions;
CREATE TRIGGER trg_clawback_on_refund
  AFTER UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.fn_clawback_on_refund();

-- ===== BLOCO 2: repasse (fonte unica de verdade do valor pago) =====
-- FASE 1 (financeiro): repasse de fonte única e autoritativo.
--
-- Corrige dois problemas latentes no gatilho de repasse ao médico:
--   (1) usava price_at_booking (coluna gravável pelo cliente) como valor do
--       repasse -> valor manipulável. Passa a usar o valor REALMENTE PAGO
--       (payment_transactions.amount_cents, status 'approved').
--   (2) não excluía médicos pagos direto pelo split do Mercado Pago -> pagamento
--       duplo. Passa a PULAR médicos conectados ao marketplace (mp_access_token).
--
-- Seguro de aplicar: não há transações financeiras existentes (0 linhas em
-- doctor_payouts/wallet_transactions/withdrawal_requests).

CREATE OR REPLACE FUNCTION public.fn_create_payout_on_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_paid NUMERIC;
  v_fee NUMERIC;
  v_net NUMERIC;
  v_pix TEXT;
  v_split BOOLEAN;
BEGIN
  IF NEW.status = 'completed'
     AND OLD.status IS DISTINCT FROM 'completed'
     AND NEW.payment_status IN ('confirmed','approved','received')
     AND NOT EXISTS (SELECT 1 FROM public.doctor_payouts WHERE appointment_id = NEW.id) THEN

    -- (2) Médicos conectados ao Mercado Pago recebem a parte deles DIRETO pelo
    -- split no momento do pagamento. Não criar também um repasse da plataforma.
    SELECT (dp.mp_access_token IS NOT NULL AND dp.mp_user_id IS NOT NULL), dp.pix_key
      INTO v_split, v_pix
      FROM public.doctor_profiles dp WHERE dp.id = NEW.doctor_id;

    IF COALESCE(v_split, false) THEN
      RETURN NEW;
    END IF;

    -- (1) Valor autoritativo = o que foi de fato aprovado em payment_transactions.
    SELECT COALESCE(MAX(pt.amount_cents), 0) / 100.0
      INTO v_paid
      FROM public.payment_transactions pt
      WHERE pt.resource_type = 'appointment'
        AND pt.resource_id = NEW.id::text
        AND pt.status = 'approved';

    IF v_paid IS NULL OR v_paid <= 0 THEN
      RETURN NEW; -- nada foi pago -> sem repasse
    END IF;

    v_fee := ROUND(v_paid * 0.20, 2);  -- 20% de taxa da plataforma
    v_net := v_paid - v_fee;

    INSERT INTO public.doctor_payouts
      (doctor_id, appointment_id, gross_amount, platform_fee, net_amount, release_at, pix_key)
    VALUES
      (NEW.doctor_id, NEW.id, v_paid, v_fee, v_net, now() + interval '7 days', v_pix);
  END IF;
  RETURN NEW;
END
$function$;
