
-- Append-only consent audit log (LGPD compliance)
CREATE TABLE IF NOT EXISTS public.consent_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  consent_type TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  accepted BOOLEAN NOT NULL DEFAULT true,
  document_url TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consent_logs_user ON public.consent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_logs_type ON public.consent_logs(consent_type);
CREATE INDEX IF NOT EXISTS idx_consent_logs_created ON public.consent_logs(created_at DESC);

ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_logs FORCE ROW LEVEL SECURITY;

-- Authenticated users can insert their own consent (or anonymous nullable for pre-signup like cookies)
CREATE POLICY "Users insert own consents"
ON public.consent_logs FOR INSERT TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Anonymous can insert cookie consents"
ON public.consent_logs FOR INSERT TO anon
WITH CHECK (user_id IS NULL AND consent_type IN ('cookies_essential','cookies_analytics','cookies_marketing','cookies_all','cookies_rejected'));

CREATE POLICY "Users view own consents"
ON public.consent_logs FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins view all consents"
ON public.consent_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- No update / no delete policies => immutable

COMMENT ON TABLE public.consent_logs IS 'LGPD audit trail: append-only consent records. Never updated or deleted.';
