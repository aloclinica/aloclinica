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
