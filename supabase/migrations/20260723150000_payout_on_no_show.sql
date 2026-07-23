-- No-show remunerado (decisão da proprietária, 2026-07-23): quando o paciente
-- PAGA e não comparece, o médico reservou o horário e recebe o repasse de 50%.
-- A função de payout passa a disparar também em status='no_show' (além de
-- 'completed'), mantendo a mesma taxa e a proteção contra duplicidade.
CREATE OR REPLACE FUNCTION public.fn_create_payout_on_completion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_paid NUMERIC; v_fee NUMERIC; v_net NUMERIC; v_pix TEXT; v_split BOOLEAN;
BEGIN
  IF NEW.status IN ('completed','no_show')
     AND (OLD.status IS NULL OR OLD.status NOT IN ('completed','no_show'))
     AND NEW.payment_status IN ('confirmed','approved','received')
     AND NOT EXISTS (SELECT 1 FROM public.doctor_payouts WHERE appointment_id = NEW.id) THEN

    SELECT (dp.mp_access_token IS NOT NULL AND dp.mp_user_id IS NOT NULL), dp.pix_key
      INTO v_split, v_pix
      FROM public.doctor_profiles dp WHERE dp.id = NEW.doctor_id;

    IF COALESCE(v_split, false) THEN
      RETURN NEW;
    END IF;

    SELECT COALESCE(MAX(pt.amount_cents), 0) / 100.0
      INTO v_paid
      FROM public.payment_transactions pt
      WHERE pt.resource_type = 'appointment'
        AND pt.resource_id = NEW.id::text
        AND pt.status = 'approved';

    IF v_paid IS NULL OR v_paid <= 0 THEN
      RETURN NEW;
    END IF;

    v_fee := ROUND(v_paid * 0.50, 2);
    v_net := v_paid - v_fee;

    INSERT INTO public.doctor_payouts
      (doctor_id, appointment_id, gross_amount, platform_fee, net_amount, release_at, pix_key)
    VALUES
      (NEW.doctor_id, NEW.id, v_paid, v_fee, v_net, now() + interval '7 days', v_pix);
  END IF;
  RETURN NEW;
END
$function$
