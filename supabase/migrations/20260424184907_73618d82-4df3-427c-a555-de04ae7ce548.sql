-- ============================================
-- PINGO CARD — Cartão de benefícios
-- ============================================

-- 1) Planos
CREATE TABLE public.pingo_card_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  tagline text,
  description text,
  price_monthly numeric(10,2) NOT NULL DEFAULT 0,
  price_yearly numeric(10,2) NOT NULL DEFAULT 0,
  consultation_discount_percent integer NOT NULL DEFAULT 0,
  exam_discount_percent integer NOT NULL DEFAULT 0,
  partner_discount_percent integer NOT NULL DEFAULT 0,
  max_dependents integer NOT NULL DEFAULT 0,
  benefits jsonb NOT NULL DEFAULT '[]'::jsonb,
  color text DEFAULT 'blue',
  is_highlighted boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pingo_card_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active pingo plans"
  ON public.pingo_card_plans FOR SELECT
  USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage pingo plans"
  ON public.pingo_card_plans FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_pingo_plans_updated_at
  BEFORE UPDATE ON public.pingo_card_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Parceiros
CREATE TABLE public.pingo_card_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'farmacia',
  description text,
  discount_percent integer NOT NULL DEFAULT 0,
  discount_description text,
  logo_url text,
  website text,
  phone text,
  address text,
  city text,
  state text,
  zip_code text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pingo_card_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active partners"
  ON public.pingo_card_partners FOR SELECT
  USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage partners"
  ON public.pingo_card_partners FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_pingo_partners_updated_at
  BEFORE UPDATE ON public.pingo_card_partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_pingo_partners_category ON public.pingo_card_partners(category) WHERE is_active = true;
CREATE INDEX idx_pingo_partners_city ON public.pingo_card_partners(city) WHERE is_active = true;

-- 3) Assinaturas
CREATE TABLE public.pingo_card_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.pingo_card_plans(id),
  card_number text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'trialing',
  billing_cycle text NOT NULL DEFAULT 'monthly',
  started_at timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz,
  canceled_at timestamptz,
  cancellation_reason text,
  asaas_subscription_id text,
  asaas_customer_id text,
  total_savings numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pingo_card_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscription"
  ON public.pingo_card_subscriptions FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users create own subscription"
  ON public.pingo_card_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own subscription"
  ON public.pingo_card_subscriptions FOR UPDATE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage subscriptions"
  ON public.pingo_card_subscriptions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_pingo_subs_updated_at
  BEFORE UPDATE ON public.pingo_card_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_pingo_subs_user ON public.pingo_card_subscriptions(user_id);
CREATE INDEX idx_pingo_subs_status ON public.pingo_card_subscriptions(status);

-- 4) Transações / uso
CREATE TABLE public.pingo_card_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.pingo_card_subscriptions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  partner_id uuid REFERENCES public.pingo_card_partners(id),
  description text,
  original_amount numeric(10,2) NOT NULL DEFAULT 0,
  discount_amount numeric(10,2) NOT NULL DEFAULT 0,
  final_amount numeric(10,2) NOT NULL DEFAULT 0,
  category text DEFAULT 'parceiro',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pingo_card_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own transactions"
  ON public.pingo_card_transactions FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System inserts transactions"
  ON public.pingo_card_transactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins manage transactions"
  ON public.pingo_card_transactions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_pingo_tx_user ON public.pingo_card_transactions(user_id);
CREATE INDEX idx_pingo_tx_subscription ON public.pingo_card_transactions(subscription_id);

-- ============================================
-- SEED — planos padrão e parceiros de exemplo
-- ============================================
INSERT INTO public.pingo_card_plans (name, slug, tagline, description, price_monthly, price_yearly, consultation_discount_percent, exam_discount_percent, partner_discount_percent, max_dependents, benefits, color, is_highlighted, display_order) VALUES
('Essencial', 'essencial', 'Comece a economizar agora', 'O cartão básico para você começar a aproveitar descontos em consultas e na rede de parceiros.', 19.90, 199.00, 15, 10, 10, 0, '["15% de desconto em consultas", "10% em exames", "Acesso à rede de parceiros", "Cartão digital + QR Code"]'::jsonb, 'blue', false, 1),
('Família', 'familia', 'Cuide de quem você ama', 'Inclua até 3 dependentes e proteja toda a família com benefícios estendidos.', 39.90, 399.00, 25, 20, 15, 3, '["25% de desconto em consultas", "20% em exames", "Até 3 dependentes incluídos", "Atendimento prioritário", "Rede ampliada de parceiros"]'::jsonb, 'cyan', true, 2),
('Premium', 'premium', 'Benefícios sem limites', 'Tudo do Família mais consultas ilimitadas com clínicos e benefícios exclusivos.', 79.90, 799.00, 40, 35, 25, 5, '["40% de desconto em consultas", "35% em exames", "Consultas ilimitadas com clínicos", "Até 5 dependentes", "Concierge médico 24h", "Telemedicina sem limite"]'::jsonb, 'amber', false, 3);

INSERT INTO public.pingo_card_partners (name, category, description, discount_percent, discount_description, city, state, is_featured, display_order) VALUES
('Drogaria São Paulo', 'farmacia', 'Rede de farmácias com mais de 500 unidades.', 20, 'Até 20% em medicamentos genéricos', 'São Paulo', 'SP', true, 1),
('Laboratório Sabin', 'laboratorio', 'Exames laboratoriais com qualidade garantida.', 30, '30% em exames laboratoriais', 'São Paulo', 'SP', true, 2),
('Ótica Carol', 'otica', 'Óculos, lentes de contato e acessórios.', 15, '15% em armações e lentes', 'Rio de Janeiro', 'RJ', false, 3),
('Smart Fit', 'academia', 'A maior rede de academias do Brasil.', 25, '25% na mensalidade', 'Belo Horizonte', 'MG', true, 4);