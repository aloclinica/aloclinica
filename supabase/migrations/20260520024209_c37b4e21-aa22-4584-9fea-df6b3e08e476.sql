-- Status enum
DO $$ BEGIN
  CREATE TYPE public.refund_status AS ENUM ('pending', 'approved', 'refunded', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.refund_tier AS ENUM ('full', 'partial', 'none');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.refund_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status public.refund_status NOT NULL DEFAULT 'pending',
  tier public.refund_tier NOT NULL DEFAULT 'full',
  amount_cents INTEGER,
  reason TEXT,
  notes TEXT,
  processed_by UUID,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refund_requests_appointment ON public.refund_requests(appointment_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_user ON public.refund_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON public.refund_requests(status);

ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own refund requests" ON public.refund_requests;
CREATE POLICY "Users view own refund requests"
  ON public.refund_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users create own refund requests" ON public.refund_requests;
CREATE POLICY "Users create own refund requests"
  ON public.refund_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage refund requests" ON public.refund_requests;
CREATE POLICY "Admins manage refund requests"
  ON public.refund_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete refund requests" ON public.refund_requests;
CREATE POLICY "Admins delete refund requests"
  ON public.refund_requests FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_refund_requests_updated_at
  BEFORE UPDATE ON public.refund_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();