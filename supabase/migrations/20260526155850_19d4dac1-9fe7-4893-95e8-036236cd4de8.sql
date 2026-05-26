
ALTER TABLE public.contratos
  ADD COLUMN IF NOT EXISTS numero_processo TEXT,
  ADD COLUMN IF NOT EXISTS numero_empenho TEXT,
  ADD COLUMN IF NOT EXISTS modalidade_licitacao TEXT;

CREATE TABLE public.contrato_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  nome TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  tamanho_bytes BIGINT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contrato_documentos TO authenticated;
GRANT ALL ON public.contrato_documentos TO service_role;

ALTER TABLE public.contrato_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_documentos FORCE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam documentos contrato"
  ON public.contrato_documentos FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_contrato_docs_contrato ON public.contrato_documentos(contrato_id);

INSERT INTO storage.buckets (id, name, public) VALUES ('contrato-docs', 'contrato-docs', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins leem docs contrato"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'contrato-docs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins escrevem docs contrato"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'contrato-docs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins removem docs contrato"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'contrato-docs' AND public.has_role(auth.uid(), 'admin'));
