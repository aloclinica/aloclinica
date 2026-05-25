
ALTER TABLE public.kyc_verificacoes
  ADD COLUMN IF NOT EXISTS document_type text,
  ADD COLUMN IF NOT EXISTS mismatch_reasons jsonb,
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_kyc_verificacoes_user_created
  ON public.kyc_verificacoes (user_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_kyc_verificacoes_updated_at ON public.kyc_verificacoes;
CREATE TRIGGER trg_kyc_verificacoes_updated_at
  BEFORE UPDATE ON public.kyc_verificacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
