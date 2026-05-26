
-- ============================================================
-- CONTRATOS E AÇÕES SOCIAIS
-- ============================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE public.contrato_tipo AS ENUM ('empresa', 'prefeitura', 'ong', 'plano_proprio');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.contrato_cobranca AS ENUM ('mensal', 'pacote_pre_pago', 'gratuito_patrocinado');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.contrato_status AS ENUM ('ativo', 'pausado', 'encerrado');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================
-- TABELA: contratos
-- ============================================================
CREATE TABLE public.contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo public.contrato_tipo NOT NULL,
  cnpj TEXT,
  contato_nome TEXT,
  contato_email TEXT,
  contato_telefone TEXT,
  modelo_cobranca public.contrato_cobranca NOT NULL DEFAULT 'pacote_pre_pago',
  valor_consulta NUMERIC(10,2),
  cota_total INTEGER,
  cota_utilizada INTEGER NOT NULL DEFAULT 0,
  vigencia_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  vigencia_fim DATE,
  especialidades_permitidas TEXT[] DEFAULT '{}',
  subdominio TEXT UNIQUE,
  branding JSONB DEFAULT '{}'::jsonb,
  status public.contrato_status NOT NULL DEFAULT 'ativo',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contratos TO authenticated;
GRANT ALL ON public.contratos TO service_role;

ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos FORCE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam contratos"
  ON public.contratos FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_contratos_subdominio ON public.contratos(subdominio) WHERE subdominio IS NOT NULL;
CREATE INDEX idx_contratos_status ON public.contratos(status);

-- ============================================================
-- TABELA: contrato_beneficiarios
-- ============================================================
CREATE TABLE public.contrato_beneficiarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  user_id UUID,
  cpf TEXT,
  email TEXT,
  nome TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  consultas_utilizadas INTEGER NOT NULL DEFAULT 0,
  limite_individual INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_beneficiario_identificacao CHECK (cpf IS NOT NULL OR email IS NOT NULL OR user_id IS NOT NULL)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contrato_beneficiarios TO authenticated;
GRANT ALL ON public.contrato_beneficiarios TO service_role;

ALTER TABLE public.contrato_beneficiarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_beneficiarios FORCE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam beneficiarios"
  ON public.contrato_beneficiarios FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Beneficiario ve proprio vinculo"
  ON public.contrato_beneficiarios FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX idx_benef_contrato ON public.contrato_beneficiarios(contrato_id);
CREATE INDEX idx_benef_user ON public.contrato_beneficiarios(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_benef_cpf ON public.contrato_beneficiarios(cpf) WHERE cpf IS NOT NULL;
CREATE UNIQUE INDEX uq_benef_contrato_cpf ON public.contrato_beneficiarios(contrato_id, cpf) WHERE cpf IS NOT NULL;

-- ============================================================
-- TABELA: vouchers
-- ============================================================
CREATE TABLE public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL UNIQUE,
  descricao TEXT,
  validade_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  validade_fim DATE,
  usos_maximos INTEGER NOT NULL DEFAULT 1,
  usos_atuais INTEGER NOT NULL DEFAULT 0,
  especialidades_permitidas TEXT[] DEFAULT '{}',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vouchers TO authenticated;
GRANT ALL ON public.vouchers TO service_role;

ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers FORCE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam vouchers"
  ON public.vouchers FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_vouchers_contrato ON public.vouchers(contrato_id);
CREATE INDEX idx_vouchers_codigo ON public.vouchers(codigo);

-- ============================================================
-- TABELA: consulta_contrato
-- ============================================================
CREATE TABLE public.consulta_contrato (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL UNIQUE,
  contrato_id UUID NOT NULL REFERENCES public.contratos(id) ON DELETE RESTRICT,
  beneficiario_id UUID REFERENCES public.contrato_beneficiarios(id) ON DELETE SET NULL,
  voucher_id UUID REFERENCES public.vouchers(id) ON DELETE SET NULL,
  valor_repassado NUMERIC(10,2),
  patient_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.consulta_contrato TO authenticated;
GRANT ALL ON public.consulta_contrato TO service_role;

ALTER TABLE public.consulta_contrato ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulta_contrato FORCE ROW LEVEL SECURITY;

CREATE POLICY "Admins veem consultas contrato"
  ON public.consulta_contrato FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Paciente ve proprias consultas contrato"
  ON public.consulta_contrato FOR SELECT
  TO authenticated
  USING (patient_user_id = auth.uid());

CREATE INDEX idx_consulta_contrato_contrato ON public.consulta_contrato(contrato_id);
CREATE INDEX idx_consulta_contrato_appt ON public.consulta_contrato(appointment_id);

-- ============================================================
-- TRIGGERS de updated_at
-- ============================================================
CREATE TRIGGER trg_contratos_updated
  BEFORE UPDATE ON public.contratos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_benef_updated
  BEFORE UPDATE ON public.contrato_beneficiarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_vouchers_updated
  BEFORE UPDATE ON public.vouchers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
