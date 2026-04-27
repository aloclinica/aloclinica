-- ============================================================================
-- Pingo Card extra features: funeral assistance + monthly sweepstake + B2B sales
-- ============================================================================

-- ─── FUNERAL ASSISTANCE ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.funeral_providers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  cnpj text,
  contact_phone text,
  contact_email text,
  coverage_areas text[] DEFAULT ARRAY[]::text[],
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_funeral_providers_active ON public.funeral_providers(is_active);

CREATE TABLE IF NOT EXISTS public.funeral_assistance_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.pingo_card_subscriptions(id) ON DELETE SET NULL,
  deceased_name text NOT NULL,
  deceased_cpf text,
  relationship text NOT NULL,
  death_date date NOT NULL,
  death_certificate_url text,
  city text NOT NULL,
  state text NOT NULL,
  contact_phone text NOT NULL,
  preferred_provider_id uuid REFERENCES public.funeral_providers(id) ON DELETE SET NULL,
  assigned_provider_id uuid REFERENCES public.funeral_providers(id) ON DELETE SET NULL,
  coverage_amount numeric(10,2),
  status text DEFAULT 'pending' CHECK (status IN ('pending','approved','in_progress','completed','rejected')),
  rejection_reason text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_funeral_requests_user ON public.funeral_assistance_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_funeral_requests_status ON public.funeral_assistance_requests(status);
CREATE INDEX IF NOT EXISTS idx_funeral_requests_created ON public.funeral_assistance_requests(created_at DESC);

ALTER TABLE public.funeral_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funeral_assistance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "funeral_providers_public_read" ON public.funeral_providers
  FOR SELECT USING (is_active = true);
CREATE POLICY "funeral_providers_admin_write" ON public.funeral_providers
  FOR ALL USING (public.is_admin());

CREATE POLICY "funeral_requests_owner_select" ON public.funeral_assistance_requests
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "funeral_requests_owner_insert" ON public.funeral_assistance_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "funeral_requests_admin_update" ON public.funeral_assistance_requests
  FOR UPDATE USING (public.is_admin());

-- ─── MONTHLY SWEEPSTAKE (R$ 20k draw) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sweepstakes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  prize_value numeric(10,2) NOT NULL,
  prize_description text,
  draw_date date NOT NULL,
  ticket_generation_start date NOT NULL,
  ticket_generation_end date NOT NULL,
  authorization_code text,
  regulation_url text,
  status text DEFAULT 'open' CHECK (status IN ('open','closed','drawn','cancelled')),
  drawn_ticket_number text,
  drawn_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sweepstakes_status ON public.sweepstakes(status);
CREATE INDEX IF NOT EXISTS idx_sweepstakes_draw_date ON public.sweepstakes(draw_date);

CREATE TABLE IF NOT EXISTS public.sweepstake_tickets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sweepstake_id uuid NOT NULL REFERENCES public.sweepstakes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.pingo_card_subscriptions(id) ON DELETE SET NULL,
  ticket_number text NOT NULL,
  source text DEFAULT 'monthly' CHECK (source IN ('monthly','signup_bonus','referral','manual')),
  is_winner boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE (sweepstake_id, ticket_number)
);
CREATE INDEX IF NOT EXISTS idx_sweepstake_tickets_user ON public.sweepstake_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_sweepstake_tickets_sweepstake ON public.sweepstake_tickets(sweepstake_id);

CREATE TABLE IF NOT EXISTS public.sweepstake_winners (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sweepstake_id uuid NOT NULL REFERENCES public.sweepstakes(id) ON DELETE CASCADE,
  ticket_id uuid NOT NULL REFERENCES public.sweepstake_tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prize_value numeric(10,2) NOT NULL,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','disputed')),
  paid_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sweepstake_winners_sweepstake ON public.sweepstake_winners(sweepstake_id);

ALTER TABLE public.sweepstakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sweepstake_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sweepstake_winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sweepstakes_public_read" ON public.sweepstakes FOR SELECT USING (true);
CREATE POLICY "sweepstakes_admin_write" ON public.sweepstakes FOR ALL USING (public.is_admin());

CREATE POLICY "sweepstake_tickets_owner_select" ON public.sweepstake_tickets
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "sweepstake_tickets_admin_write" ON public.sweepstake_tickets
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "sweepstake_tickets_admin_update" ON public.sweepstake_tickets
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "sweepstake_winners_public_read" ON public.sweepstake_winners FOR SELECT USING (true);
CREATE POLICY "sweepstake_winners_admin_write" ON public.sweepstake_winners FOR ALL USING (public.is_admin());

-- ─── B2B (corporate Pingo Card sales) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cnpj text NOT NULL UNIQUE,
  legal_name text NOT NULL,
  trade_name text,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  address jsonb DEFAULT '{}'::jsonb,
  managed_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text DEFAULT 'active' CHECK (status IN ('active','suspended','cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON public.companies(cnpj);
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(status);

CREATE TABLE IF NOT EXISTS public.company_card_orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  pingo_card_plan_id uuid NOT NULL REFERENCES public.pingo_card_plans(id) ON DELETE RESTRICT,
  num_seats integer NOT NULL CHECK (num_seats > 0),
  price_per_seat numeric(10,2) NOT NULL,
  total_amount numeric(10,2) NOT NULL,
  billing_cycle text DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','yearly')),
  status text DEFAULT 'pending_payment' CHECK (status IN ('pending_payment','active','suspended','cancelled')),
  asaas_subscription_id text,
  next_billing_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_company_orders_company ON public.company_card_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_company_orders_status ON public.company_card_orders(status);

CREATE TABLE IF NOT EXISTS public.employee_invites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_card_order_id uuid NOT NULL REFERENCES public.company_card_orders(id) ON DELETE CASCADE,
  invite_token text NOT NULL UNIQUE,
  employee_email text NOT NULL,
  employee_name text,
  employee_cpf text,
  status text DEFAULT 'sent' CHECK (status IN ('sent','accepted','expired','cancelled')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  pingo_card_subscription_id uuid REFERENCES public.pingo_card_subscriptions(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_employee_invites_token ON public.employee_invites(invite_token);
CREATE INDEX IF NOT EXISTS idx_employee_invites_order ON public.employee_invites(company_card_order_id);
CREATE INDEX IF NOT EXISTS idx_employee_invites_email ON public.employee_invites(employee_email);
CREATE INDEX IF NOT EXISTS idx_employee_invites_status ON public.employee_invites(status);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_card_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companies_admin_all" ON public.companies FOR ALL USING (public.is_admin());
CREATE POLICY "companies_managed_select" ON public.companies
  FOR SELECT USING (managed_by_user_id = auth.uid());

CREATE POLICY "company_orders_admin_all" ON public.company_card_orders FOR ALL USING (public.is_admin());
CREATE POLICY "company_orders_managed_select" ON public.company_card_orders
  FOR SELECT USING (
    company_id IN (SELECT id FROM public.companies WHERE managed_by_user_id = auth.uid())
  );

CREATE POLICY "employee_invites_admin_all" ON public.employee_invites FOR ALL USING (public.is_admin());
CREATE POLICY "employee_invites_self_select" ON public.employee_invites
  FOR SELECT USING (
    user_id = auth.uid()
    OR company_card_order_id IN (
      SELECT cco.id FROM public.company_card_orders cco
      JOIN public.companies c ON c.id = cco.company_id
      WHERE c.managed_by_user_id = auth.uid()
    )
  );
CREATE POLICY "employee_invites_token_accept" ON public.employee_invites
  FOR UPDATE USING (true) WITH CHECK (status = 'accepted' AND user_id = auth.uid());

-- ─── HELPERS ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'touch_funeral_providers') THEN
    CREATE TRIGGER touch_funeral_providers BEFORE UPDATE ON public.funeral_providers
      FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'touch_funeral_requests') THEN
    CREATE TRIGGER touch_funeral_requests BEFORE UPDATE ON public.funeral_assistance_requests
      FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'touch_sweepstakes') THEN
    CREATE TRIGGER touch_sweepstakes BEFORE UPDATE ON public.sweepstakes
      FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'touch_companies') THEN
    CREATE TRIGGER touch_companies BEFORE UPDATE ON public.companies
      FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'touch_company_orders') THEN
    CREATE TRIGGER touch_company_orders BEFORE UPDATE ON public.company_card_orders
      FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
END $$;
