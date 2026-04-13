-- Migration: Adicionar suporte a assinatura digital ICP-Brasil
-- Data: 2026-04-13
-- Descrição: Tabela para armazenar metadata de prescrições digitalmente assinadas com ICP-Brasil

-- Tabela de assinaturas digitais de prescrições
CREATE TABLE IF NOT EXISTS public.prescription_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  signed_by TEXT NOT NULL, -- Nome completo do médico que assinou
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  storage_path TEXT NOT NULL, -- Caminho no Supabase Storage do PDF assinado
  certificate_chain TEXT NOT NULL, -- Informações do certificado ICP-Brasil (CN, OU, O, etc)
  signature_algorithm TEXT DEFAULT 'RSA-SHA256', -- Algoritmo de assinatura usado
  status TEXT NOT NULL DEFAULT 'signed' CHECK (status IN ('pending', 'signed', 'failed', 'revoked')),
  soluti_request_id TEXT, -- ID retornado por Soluti para rastreamento
  soluti_timestamp TEXT, -- Timestamp do servidor Soluti (para auditoria)
  metadata JSONB DEFAULT '{}', -- Dados adicionais (ex: versão do certificado, carimbo de tempo)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT unique_prescription_signature UNIQUE(prescription_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_prescription_signatures_prescription_id
  ON public.prescription_signatures(prescription_id);

CREATE INDEX IF NOT EXISTS idx_prescription_signatures_signed_at
  ON public.prescription_signatures(signed_at DESC);

CREATE INDEX IF NOT EXISTS idx_prescription_signatures_status
  ON public.prescription_signatures(status);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_prescription_signatures_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prescription_signatures_updated_at_trigger ON public.prescription_signatures;

CREATE TRIGGER prescription_signatures_updated_at_trigger
BEFORE UPDATE ON public.prescription_signatures
FOR EACH ROW
EXECUTE FUNCTION update_prescription_signatures_timestamp();

-- RLS (Row Level Security) - Apenas médicos podem assinar suas próprias prescrições
ALTER TABLE public.prescription_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Médicos podem assinar suas prescrições"
  ON public.prescription_signatures
  FOR INSERT
  WITH CHECK (
    auth.uid() = (
      SELECT doctor_id FROM public.prescriptions WHERE id = prescription_id
    )
  );

CREATE POLICY "Qualquer um pode ler assinaturas de prescrições"
  ON public.prescription_signatures
  FOR SELECT
  USING (true);

-- Adicionar coluna reference na tabela prescriptions se ainda não existir
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS
  digital_signature_id UUID REFERENCES public.prescription_signatures(id) ON DELETE SET NULL;

-- Comentários de documentação
COMMENT ON TABLE public.prescription_signatures IS 'Armazena metadata de prescrições assinadas digitalmente com ICP-Brasil (Soluti)';
COMMENT ON COLUMN public.prescription_signatures.certificate_chain IS 'Informações do certificado A3 ICP-Brasil usado para assinar (CN, OU, O, C)';
COMMENT ON COLUMN public.prescription_signatures.soluti_request_id IS 'ID retornado pela API Soluti para rastreamento de assinatura';
COMMENT ON COLUMN public.prescription_signatures.status IS 'Status da assinatura: pending (aguardando), signed (concluída), failed (erro), revoked (revogada)';
