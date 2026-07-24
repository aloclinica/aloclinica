-- CRÍTICO (dinheiro): a tabela pingo_card_subscriptions permitia ao próprio usuário
-- gravar status='active' — a policy de INSERT só tinha WITH CHECK (user_id) e as de
-- UPDATE não tinham WITH CHECK nenhum. O trigger fn_sync_cartao_role concede o papel
-- 'cartao_beneficios' (descontos de consulta/exame) a QUALQUER linha que fique
-- status='active', SEM verificar pagamento no Mercado Pago. Logo, qualquer usuário
-- autenticado podia se auto-conceder o cartão de benefícios de graça via PostgREST.
--
-- Correção: usuário só pode INSERT como 'pending' e só pode UPDATE para 'cancelled'.
-- A ATIVAÇÃO (status='active') passa a ser exclusiva do service-role (edge function
-- mercadopago-create-subscription / webhook, que ignoram RLS) e do admin. O front
-- nunca escreve nesta tabela, então nada legítimo quebra.
ALTER POLICY "Users insert own sub" ON public.pingo_card_subscriptions
  WITH CHECK (auth.uid() = user_id AND status = 'pending');
ALTER POLICY "Users create own subscription" ON public.pingo_card_subscriptions
  WITH CHECK (auth.uid() = user_id AND status = 'pending');
ALTER POLICY "Users update own sub" ON public.pingo_card_subscriptions
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status IN ('cancelled','canceled'));
ALTER POLICY "Users update own subscription" ON public.pingo_card_subscriptions
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status IN ('cancelled','canceled'));
ALTER POLICY "users cancel own pingo sub" ON public.pingo_card_subscriptions
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status IN ('cancelled','canceled'));
