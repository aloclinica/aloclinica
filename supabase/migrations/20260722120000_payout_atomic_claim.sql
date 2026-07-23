-- Trava atômica anti-duplo-saque (2ª camada de proteção do ledger doctor_payouts).
--
-- O mercadopago-withdraw já tem trava contra duplo-SUBMIT (flip atômico do
-- withdrawal_requests p/ 'processing'). Estas funções fecham a integridade do
-- LEDGER: debitam os repasses 'ready' ANTES do PIX e revertem SÓ os deste saque
-- se o PIX falhar — nunca revertem saques anteriores já confirmados.
--
-- Seguro de aplicar: 0 repasses hoje (doctor_payouts vazia).

-- 1) Coluna que marca QUAL saque travou cada repasse (rollback cirúrgico).
ALTER TABLE public.doctor_payouts ADD COLUMN IF NOT EXISTS withdrawal_id uuid;

-- 2) Saldo disponível do médico = repasses liberados ('ready'), ainda não sacados.
CREATE OR REPLACE FUNCTION public.fn_doctor_available_balance(p_doctor_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(SUM(net_amount), 0)::numeric
    FROM public.doctor_payouts
   WHERE doctor_id = p_doctor_id
     AND status = 'ready';
$function$;

-- 3) CLAIM: trava atomicamente os repasses 'ready' do médico como 'paid',
--    marcando o saque (withdrawal_id). O UPDATE ... WHERE status='ready' pega
--    lock por linha, então duas retiradas concorrentes não travam o mesmo saldo
--    (a 2ª encontra 0 linhas 'ready'). Retorna o total travado por ESTE saque.
CREATE OR REPLACE FUNCTION public.fn_claim_ready_payouts(p_doctor_id uuid, p_withdrawal_id uuid DEFAULT NULL)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_total numeric;
BEGIN
  UPDATE public.doctor_payouts
     SET status = 'paid',
         withdrawal_id = p_withdrawal_id,
         paid_at = now(),
         updated_at = now()
   WHERE doctor_id = p_doctor_id
     AND status = 'ready';

  SELECT COALESCE(SUM(net_amount), 0)
    INTO v_total
    FROM public.doctor_payouts
   WHERE doctor_id = p_doctor_id
     AND status = 'paid'
     AND withdrawal_id IS NOT DISTINCT FROM p_withdrawal_id;

  RETURN COALESCE(v_total, 0);
END;
$function$;

-- 4) UNCLAIM: se o PIX falhar, devolve para 'ready' SOMENTE os repasses travados
--    por ESTE saque (withdrawal_id). Não toca em saques anteriores já 'paid'.
CREATE OR REPLACE FUNCTION public.fn_unclaim_payouts(p_doctor_id uuid, p_withdrawal_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.doctor_payouts
     SET status = 'ready',
         withdrawal_id = NULL,
         paid_at = NULL,
         updated_at = now()
   WHERE doctor_id = p_doctor_id
     AND status = 'paid'
     AND withdrawal_id IS NOT DISTINCT FROM p_withdrawal_id;
END;
$function$;

-- 5) SEGURANÇA: estas funções mexem em dinheiro — só o service_role (edge
--    functions server-side) pode chamá-las. Bloqueia chamada via RPC por
--    usuário logado (anon/authenticated).
-- NB: no Supabase o EXECUTE já vem concedido a anon/authenticated por padrão,
-- então além de PUBLIC é preciso revogar desses papéis explicitamente.
REVOKE ALL ON FUNCTION public.fn_claim_ready_payouts(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_unclaim_payouts(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_doctor_available_balance(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_claim_ready_payouts(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_unclaim_payouts(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_doctor_available_balance(uuid) TO service_role;
