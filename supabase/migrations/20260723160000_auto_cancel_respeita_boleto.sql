-- BUG: fn_auto_cancel_unpaid cancelava QUALQUER consulta não paga após 30 min,
-- inclusive as pagas por BOLETO — que leva 1-3 dias úteis para compensar. Isso
-- quebrava o boleto (a consulta era cancelada antes de o paciente pagar).
--
-- Correção: mantém os 30 min para PIX/cartão (PIX expira em 30 min), mas NÃO
-- cancela enquanto houver uma transação de BOLETO pendente criada nos últimos
-- 3 dias (prazo típico do boleto). Passado o prazo, cancela normalmente.
CREATE OR REPLACE FUNCTION public.fn_auto_cancel_unpaid()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE appointments a
  SET status = 'cancelled',
      cancel_reason = 'Pagamento não confirmado no prazo',
      updated_at = now()
  WHERE a.status = 'scheduled'
    AND a.payment_status = 'pending'
    AND a.payment_confirmed_at IS NULL
    AND a.created_at < now() - interval '30 minutes'
    -- Não cancelar se há um boleto pendente ainda dentro do prazo (~3 dias).
    AND NOT EXISTS (
      SELECT 1 FROM public.payment_transactions pt
      WHERE pt.resource_type = 'appointment'
        AND pt.resource_id = a.id::text
        AND pt.payment_method = 'boleto'
        AND pt.status IN ('pending', 'in_process', 'in_mediation')
        AND pt.created_at > now() - interval '3 days'
    );
END;
$function$
