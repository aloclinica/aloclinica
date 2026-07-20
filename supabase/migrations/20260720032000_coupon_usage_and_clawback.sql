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
