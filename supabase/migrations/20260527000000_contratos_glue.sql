-- =============================================================
-- COLA SERVER-SIDE DO MODELO DE CONTRATOS
-- (complementa 20260526154820 / 20260526155850 — NÃO cria modelo novo)
--
-- Adiciona o que faltava para operacionalizar contratos/ações/licitações:
--   1. contratos.dominio_proprio (white-label por domínio do órgão)
--   2. resolve_tenant(host, slug)  -> contexto público p/ subdomínio/path/domínio próprio
--   3. fn_contrato_elegivel(...)    -> valida vigência, cota, beneficiário (lista de CPF)
--   4. fn_consumir_contrato(...)    -> registra consulta_contrato + debita cotas (idempotente)
-- =============================================================

-- 1) Domínio próprio (além de subdominio)
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS dominio_proprio text;
CREATE UNIQUE INDEX IF NOT EXISTS uq_contratos_dominio_proprio
  ON public.contratos (lower(dominio_proprio)) WHERE dominio_proprio IS NOT NULL;

-- =============================================================
-- 2) resolve_tenant — contexto PÚBLICO (anon) para branding/landing.
--    Resolve por path (slug), domínio próprio ou subdomínio.
--    Expõe só dados públicos; nunca cota/valores/observações.
-- =============================================================
CREATE OR REPLACE FUNCTION public.resolve_tenant(p_host text DEFAULT NULL, p_slug text DEFAULT NULL)
RETURNS TABLE (
  contrato_id uuid,
  nome text,
  tipo public.contrato_tipo,
  modelo_cobranca public.contrato_cobranca,
  especialidades_permitidas text[],
  subdominio text,
  branding jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_host text := lower(regexp_replace(COALESCE(p_host,''), ':\d+$', ''));
  v_slug text := lower(COALESCE(p_slug,''));
  v_sub  text;
BEGIN
  IF v_slug <> '' THEN
    RETURN QUERY SELECT c.id, c.nome, c.tipo, c.modelo_cobranca, c.especialidades_permitidas, c.subdominio, c.branding
      FROM public.contratos c
      WHERE c.subdominio = v_slug AND c.status = 'ativo' LIMIT 1;
    RETURN;
  END IF;

  RETURN QUERY SELECT c.id, c.nome, c.tipo, c.modelo_cobranca, c.especialidades_permitidas, c.subdominio, c.branding
    FROM public.contratos c
    WHERE lower(c.dominio_proprio) = v_host AND c.status = 'ativo' LIMIT 1;
  IF FOUND THEN RETURN; END IF;

  IF v_host LIKE '%.aloclinica.com.br' THEN
    v_sub := split_part(v_host, '.', 1);
    IF v_sub NOT IN ('www','app','api','admin','paciente','medico','clinica','parceiro','parceiros','acoes','laudista','oftalmo','meet','whatsapp','face') THEN
      RETURN QUERY SELECT c.id, c.nome, c.tipo, c.modelo_cobranca, c.especialidades_permitidas, c.subdominio, c.branding
        FROM public.contratos c
        WHERE c.subdominio = v_sub AND c.status = 'ativo' LIMIT 1;
    END IF;
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.resolve_tenant(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_tenant(text, text) TO anon, authenticated;

-- =============================================================
-- 3) fn_contrato_elegivel — vigência + cota + beneficiário (lista de CPF) / aberto.
--    Para tipo 'gratuito_patrocinado'/ação social, exige CPF na lista (beneficiário ativo).
-- =============================================================
CREATE OR REPLACE FUNCTION public.fn_contrato_elegivel(
  p_contrato_id uuid, p_cpf text DEFAULT NULL, p_user_id uuid DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.contratos%ROWTYPE;
  v_cpf text := regexp_replace(COALESCE(p_cpf,''), '\D', '', 'g');
  b public.contrato_beneficiarios%ROWTYPE;
BEGIN
  SELECT * INTO c FROM public.contratos WHERE id = p_contrato_id;
  IF NOT FOUND OR c.status <> 'ativo' THEN RETURN false; END IF;
  IF now()::date < c.vigencia_inicio THEN RETURN false; END IF;
  IF c.vigencia_fim IS NOT NULL AND now()::date > c.vigencia_fim THEN RETURN false; END IF;
  -- cota global (pacote pré-pago / cota definida)
  IF c.cota_total IS NOT NULL AND c.cota_utilizada >= c.cota_total THEN RETURN false; END IF;

  -- beneficiário por CPF ou user_id
  SELECT * INTO b FROM public.contrato_beneficiarios
   WHERE contrato_id = p_contrato_id
     AND ativo = true
     AND (
       (v_cpf <> '' AND regexp_replace(COALESCE(cpf,''), '\D','','g') = v_cpf)
       OR (p_user_id IS NOT NULL AND user_id = p_user_id)
     )
   LIMIT 1;

  IF NOT FOUND THEN RETURN false; END IF;
  -- limite individual
  IF b.limite_individual IS NOT NULL AND b.consultas_utilizadas >= b.limite_individual THEN RETURN false; END IF;

  RETURN true;
END $$;

REVOKE ALL ON FUNCTION public.fn_contrato_elegivel(uuid, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_contrato_elegivel(uuid, text, uuid) TO authenticated;

-- =============================================================
-- 4) fn_consumir_contrato — registra a consulta no contrato e debita cotas.
--    Idempotente (consulta_contrato.appointment_id é UNIQUE). Só service_role.
--    Retorna jsonb {ok, reason}.
-- =============================================================
CREATE OR REPLACE FUNCTION public.fn_consumir_contrato(
  p_contrato_id uuid,
  p_appointment_id uuid,
  p_patient_user_id uuid,
  p_cpf text DEFAULT NULL,
  p_voucher_codigo text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.contratos%ROWTYPE;
  b public.contrato_beneficiarios%ROWTYPE;
  v public.vouchers%ROWTYPE;
  v_cpf text := regexp_replace(COALESCE(p_cpf,''), '\D','','g');
BEGIN
  -- idempotência
  IF EXISTS (SELECT 1 FROM public.consulta_contrato WHERE appointment_id = p_appointment_id) THEN
    RETURN jsonb_build_object('ok', true, 'reason', 'already_consumed');
  END IF;

  SELECT * INTO c FROM public.contratos WHERE id = p_contrato_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'contrato_nao_encontrado'); END IF;

  -- via voucher (fluxo alternativo de elegibilidade)
  IF p_voucher_codigo IS NOT NULL AND length(p_voucher_codigo) > 0 THEN
    SELECT * INTO v FROM public.vouchers
      WHERE contrato_id = p_contrato_id AND codigo = p_voucher_codigo AND ativo = true FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'voucher_invalido'); END IF;
    IF v.validade_fim IS NOT NULL AND now()::date > v.validade_fim THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'voucher_expirado'); END IF;
    IF v.usos_atuais >= v.usos_maximos THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'voucher_esgotado'); END IF;
  ELSE
    -- via beneficiário (lista de CPF)
    IF NOT public.fn_contrato_elegivel(p_contrato_id, p_cpf, p_patient_user_id) THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'nao_elegivel_ou_cota_esgotada');
    END IF;
    SELECT * INTO b FROM public.contrato_beneficiarios
      WHERE contrato_id = p_contrato_id AND ativo = true
        AND ( (v_cpf <> '' AND regexp_replace(COALESCE(cpf,''),'\D','','g') = v_cpf)
              OR (p_patient_user_id IS NOT NULL AND user_id = p_patient_user_id) )
      LIMIT 1 FOR UPDATE;
  END IF;

  INSERT INTO public.consulta_contrato
    (appointment_id, contrato_id, beneficiario_id, voucher_id, valor_repassado, patient_user_id)
  VALUES (p_appointment_id, p_contrato_id, b.id, v.id, c.valor_consulta, p_patient_user_id);

  -- débito de cotas
  IF c.cota_total IS NOT NULL THEN
    UPDATE public.contratos SET cota_utilizada = cota_utilizada + 1, updated_at = now() WHERE id = p_contrato_id;
  END IF;
  IF b.id IS NOT NULL THEN
    UPDATE public.contrato_beneficiarios SET consultas_utilizadas = consultas_utilizadas + 1, updated_at = now() WHERE id = b.id;
  END IF;
  IF v.id IS NOT NULL THEN
    UPDATE public.vouchers SET usos_atuais = usos_atuais + 1, updated_at = now() WHERE id = v.id;
  END IF;

  RETURN jsonb_build_object('ok', true, 'reason', 'consumido');
END $$;

REVOKE ALL ON FUNCTION public.fn_consumir_contrato(uuid, uuid, uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_consumir_contrato(uuid, uuid, uuid, text, text) TO service_role;
