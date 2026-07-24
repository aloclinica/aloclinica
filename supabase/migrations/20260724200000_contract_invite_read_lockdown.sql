-- EXPOSIÇÃO/ESCALONAMENTO: contract_manager_invites tinha uma política de SELECT
-- "public reads invite by token" com USING (true) — apesar do nome, isso deixava
-- QUALQUER anon/authenticated fazer SELECT * e ler TODOS os convites (tokens +
-- e-mails). Como fn_accept_manager_invite concede o papel 'contract_manager' a quem
-- apresenta um token válido, um atacante podia enumerar tokens e assumir a gestão
-- de contratos alheios (além de vazar e-mails dos convidados).
--
-- Não dá para escopar RLS "por token" num SELECT direto (a policy não recebe o
-- token do usuário). Correção: preview passa a ser por RPC SECURITY DEFINER que
-- retorna SÓ o convite daquele token (campos de preview), e o SELECT direto público
-- é desabilitado (USING false). Admin continua gerenciando via a policy de admin.
CREATE OR REPLACE FUNCTION public.get_contract_invite_by_token(p_token text)
 RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'email', cmi.email,
    'contrato_nome', c.nome,
    'expires_at', cmi.expires_at,
    'used_at', cmi.used_at
  )
  FROM public.contract_manager_invites cmi
  LEFT JOIN public.contratos c ON c.id = cmi.contrato_id
  WHERE cmi.token = p_token
  LIMIT 1;
$function$;
GRANT EXECUTE ON FUNCTION public.get_contract_invite_by_token(text) TO anon, authenticated;

ALTER POLICY "public reads invite by token" ON public.contract_manager_invites
  USING (false);
