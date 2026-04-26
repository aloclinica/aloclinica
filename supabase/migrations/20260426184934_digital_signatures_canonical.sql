-- Tabela canonica para assinaturas digitais ICP-Brasil
CREATE TABLE IF NOT EXISTS public.digital_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id TEXT NOT NULL UNIQUE,
    document_type TEXT NOT NULL CHECK (document_type IN ('prescription', 'exam', 'report', 'laudo', 'certificate')),
    related_record_id UUID,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    doctor_name TEXT NOT NULL,
    doctor_crm TEXT NOT NULL,
    doctor_cpf TEXT NOT NULL,
    patient_name TEXT,
    document_hash TEXT NOT NULL,
    signature_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    certificate_alias TEXT,
    provider TEXT DEFAULT 'vidaas',
    storage_path TEXT,
    public_url TEXT,
    is_valid BOOLEAN DEFAULT true,
    revoked_at TIMESTAMPTZ,
    revoke_reason TEXT,
    signed_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_digital_signatures_document_id ON public.digital_signatures(document_id);
CREATE INDEX IF NOT EXISTS idx_digital_signatures_user_id ON public.digital_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_signatures_related ON public.digital_signatures(related_record_id);

ALTER TABLE public.digital_signatures ENABLE ROW LEVEL SECURITY;

-- Médicos podem ver suas próprias assinaturas
CREATE POLICY "Doctors can read their own signatures"
ON public.digital_signatures FOR SELECT
USING (auth.uid() = user_id);

-- Médicos podem criar suas próprias assinaturas
CREATE POLICY "Doctors can insert their own signatures"
ON public.digital_signatures FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Service role (Edge Functions) pode tudo
CREATE POLICY "Service role full access"
ON public.digital_signatures FOR ALL
USING (auth.role() = 'service_role');

-- RPC público para validação (qualquer pessoa pode validar)
CREATE OR REPLACE FUNCTION public.validate_signature_public(p_document_id TEXT)
RETURNS TABLE (
    document_id TEXT,
    document_type TEXT,
    doctor_name TEXT,
    doctor_crm TEXT,
    patient_name TEXT,
    document_hash TEXT,
    certificate_alias TEXT,
    signed_at TIMESTAMPTZ,
    is_valid BOOLEAN,
    revoked_at TIMESTAMPTZ,
    revoke_reason TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT
        ds.document_id,
        ds.document_type,
        ds.doctor_name,
        ds.doctor_crm,
        ds.patient_name,
        ds.document_hash,
        ds.certificate_alias,
        ds.signed_at,
        (ds.is_valid AND ds.revoked_at IS NULL) AS is_valid,
        ds.revoked_at,
        ds.revoke_reason
    FROM public.digital_signatures ds
    WHERE ds.document_id = p_document_id
    LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.validate_signature_public(TEXT) TO anon, authenticated;
