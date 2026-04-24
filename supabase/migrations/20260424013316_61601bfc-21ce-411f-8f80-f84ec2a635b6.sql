
-- Cross-device KYC sessions
CREATE TABLE IF NOT EXISTS public.kyc_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'patient',
  status text NOT NULL DEFAULT 'pending', -- pending | scanned | completed | failed | expired
  match_score numeric,
  failure_reason text,
  device_info jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes')
);

CREATE INDEX IF NOT EXISTS idx_kyc_sessions_token ON public.kyc_sessions(token);
CREATE INDEX IF NOT EXISTS idx_kyc_sessions_user ON public.kyc_sessions(user_id);

ALTER TABLE public.kyc_sessions ENABLE ROW LEVEL SECURITY;

-- Owner can manage their sessions
CREATE POLICY "Users manage own kyc sessions"
  ON public.kyc_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins
CREATE POLICY "Admins view all kyc sessions"
  ON public.kyc_sessions
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_kyc_sessions_updated_at ON public.kyc_sessions;
CREATE TRIGGER trg_kyc_sessions_updated_at
  BEFORE UPDATE ON public.kyc_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.kyc_sessions;
ALTER TABLE public.kyc_sessions REPLICA IDENTITY FULL;
