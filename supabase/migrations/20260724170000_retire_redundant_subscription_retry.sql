-- Aposenta o retry de assinatura redundante/quebrado.
--
-- A cobrança recorrente E o retry de falhas são feitos NATIVAMENTE pelo Mercado
-- Pago (preapproval auto_recurring criado em mercadopago-create-subscription). A
-- função customizada fn_subscription_retry:
--   1) chamava mercadopago-charge-saved-card com payload/auth incompatíveis (nunca
--      cobrava de fato);
--   2) o webhook nunca marca 'past_due'/'payment_failed', então o SELECT dela não
--      casava nada (inerte);
--   3) SE algum estado externo marcasse past_due, ela incrementava retry_count sem
--      cobrar e, ao chegar a 3, CANCELAVA a assinatura — cancelamento indevido.
--
-- Correção: função vira no-op (remove o risco de cancelamento indevido) e o cron
-- 'subscription-retry' é desagendado (redundante). A revogação de benefício em
-- inadimplência continua vindo do ciclo nativo do MP + webhook (handlePreapproval,
-- que rebaixa subscriptions/pingo_card_subscriptions quando o MP pausa/cancela).
CREATE OR REPLACE FUNCTION public.fn_subscription_retry()
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  -- No-op intencional (ver comentário da migration). O Mercado Pago faz a
  -- recorrência e o retry; não recobramos/cancelamos por conta própria.
  RETURN;
END;
$function$;

-- Desagenda o cron redundante (guarded: não falha se já removido).
DO $$ BEGIN
  PERFORM cron.unschedule('subscription-retry');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
