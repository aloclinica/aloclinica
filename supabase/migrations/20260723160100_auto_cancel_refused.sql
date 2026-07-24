-- BUG (vazamento de vaga): fetchBookedSlots considera ocupado todo agendamento
-- que NÃO está 'cancelled' (independe do pagamento). O auto-cancel só limpava
-- payment_status='pending' — então uma consulta com pagamento RECUSADO e depois
-- abandonada (status 'scheduled', payment_status 'refused') segurava o horário
-- para sempre, bloqueando outros pacientes.
--
-- Correção: o auto-cancel passa a limpar também 'refused' (mesma janela de 30 min,
-- mesma exceção de boleto). O paciente recusado ainda pode tentar outro cartão
-- dentro da janela; passado o prazo, a vaga é liberada.
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
    AND a.payment_status IN ('pending', 'refused')
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
