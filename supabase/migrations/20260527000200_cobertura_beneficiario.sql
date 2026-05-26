-- =============================================================
-- Reconhecimento de cobertura por beneficiário (CPF ou user_id)
--
-- Permite que QUALQUER paciente logado descubra se está coberto por um contrato
-- ativo (órgão público / ação social / empresa) — independentemente de ter
-- entrado pelo portal do tenant. Usado no agendamento para pular o pagamento.
-- =============================================================

CREATE OR REPLACE FUNCTION public.meu_contrato_ativo()
RETURNS TABLE (
  contrato_id uuid,
  nome text,
  tipo public.contrato_tipo,
  modelo_cobranca public.contrato_cobranca,
  especialidades_permitidas text[],
  branding jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.nome, c.tipo, c.modelo_cobranca,
         c.especialidades_permitidas, c.branding
  FROM public.contrato_beneficiarios b
  JOIN public.contratos c ON c.id = b.contrato_id
  LEFT JOIN public.profiles p ON p.user_id = auth.uid()
  WHERE b.ativo = true
    AND c.status = 'ativo'
    AND now()::date >= c.vigencia_inicio
    AND (c.vigencia_fim IS NULL OR now()::date <= c.vigencia_fim)
    AND (c.cota_total IS NULL OR c.cota_utilizada < c.cota_total)
    AND (b.limite_individual IS NULL OR b.consultas_utilizadas < b.limite_individual)
    AND (
      b.user_id = auth.uid()
      OR (p.cpf IS NOT NULL AND regexp_replace(b.cpf, '\D', '', 'g') = regexp_replace(p.cpf, '\D', '', 'g'))
    )
  ORDER BY c.created_at DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.meu_contrato_ativo() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.meu_contrato_ativo() TO authenticated;
