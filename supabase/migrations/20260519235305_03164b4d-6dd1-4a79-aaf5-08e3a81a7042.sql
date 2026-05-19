
-- ============ 1. PLANS: novos campos ============
ALTER TABLE public.pingo_card_plans
  ADD COLUMN IF NOT EXISTS pingo_ticket_monthly_credit numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trial_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS features_included jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS cta_label text NOT NULL DEFAULT 'Assinar agora';

-- ============ 2. SUBSCRIPTIONS: novos campos ============
ALTER TABLE public.pingo_card_subscriptions
  ADD COLUMN IF NOT EXISTS mp_subscription_id text,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS dependents_included integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS card_holder_name text;

CREATE INDEX IF NOT EXISTS idx_pcs_user_status ON public.pingo_card_subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_pcs_mp_preapproval ON public.pingo_card_subscriptions(mp_preapproval_id) WHERE mp_preapproval_id IS NOT NULL;

-- ============ 3. INVOICES ============
CREATE TABLE IF NOT EXISTS public.pingo_card_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.pingo_card_subscriptions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending|paid|failed|refunded
  mp_payment_id text,
  due_date timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  pdf_url text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pci_user ON public.pingo_card_invoices(user_id, status);
CREATE INDEX IF NOT EXISTS idx_pci_sub ON public.pingo_card_invoices(subscription_id);

ALTER TABLE public.pingo_card_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pingo_card_invoices FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own invoices" ON public.pingo_card_invoices;
CREATE POLICY "Users view own invoices" ON public.pingo_card_invoices
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Admin manage invoices" ON public.pingo_card_invoices;
CREATE POLICY "Admin manage invoices" ON public.pingo_card_invoices
  FOR ALL USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP TRIGGER IF EXISTS trg_pci_updated ON public.pingo_card_invoices;
CREATE TRIGGER trg_pci_updated BEFORE UPDATE ON public.pingo_card_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 4. BENEFIT USAGE ============
CREATE TABLE IF NOT EXISTS public.pingo_card_benefit_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES public.pingo_card_subscriptions(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  benefit_type text NOT NULL, -- consultation|exam|partner|ticket
  reference_id uuid,
  original_amount numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  final_amount numeric NOT NULL DEFAULT 0,
  description text,
  used_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pcbu_user ON public.pingo_card_benefit_usage(user_id, used_at DESC);

ALTER TABLE public.pingo_card_benefit_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pingo_card_benefit_usage FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own usage" ON public.pingo_card_benefit_usage;
CREATE POLICY "Users view own usage" ON public.pingo_card_benefit_usage
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "System insert usage" ON public.pingo_card_benefit_usage;
CREATE POLICY "System insert usage" ON public.pingo_card_benefit_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- ============ 5. RLS reforço em tabelas existentes ============
ALTER TABLE public.pingo_card_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pingo_card_subscriptions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own sub" ON public.pingo_card_subscriptions;
CREATE POLICY "Users view own sub" ON public.pingo_card_subscriptions
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Users insert own sub" ON public.pingo_card_subscriptions;
CREATE POLICY "Users insert own sub" ON public.pingo_card_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own sub" ON public.pingo_card_subscriptions;
CREATE POLICY "Users update own sub" ON public.pingo_card_subscriptions
  FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Admin manage sub" ON public.pingo_card_subscriptions;
CREATE POLICY "Admin manage sub" ON public.pingo_card_subscriptions
  FOR ALL USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

ALTER TABLE public.pingo_card_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Plans public read" ON public.pingo_card_plans;
CREATE POLICY "Plans public read" ON public.pingo_card_plans
  FOR SELECT USING (is_active = true OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Plans admin manage" ON public.pingo_card_plans;
CREATE POLICY "Plans admin manage" ON public.pingo_card_plans
  FOR ALL USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

ALTER TABLE public.pingo_card_partners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Partners public read" ON public.pingo_card_partners;
CREATE POLICY "Partners public read" ON public.pingo_card_partners
  FOR SELECT USING (is_active = true OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Partners admin manage" ON public.pingo_card_partners;
CREATE POLICY "Partners admin manage" ON public.pingo_card_partners
  FOR ALL USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ 6. TRIGGER: créditos Pingo Ticket ao pagar fatura ============
CREATE OR REPLACE FUNCTION public.fn_credit_pingo_ticket_on_invoice_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credit numeric := 0;
  v_account RECORD;
  v_new_balance numeric;
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid') THEN
    SELECT p.pingo_ticket_monthly_credit INTO v_credit
    FROM public.pingo_card_subscriptions s
    JOIN public.pingo_card_plans p ON p.id = s.plan_id
    WHERE s.id = NEW.subscription_id;

    IF COALESCE(v_credit, 0) > 0 THEN
      SELECT * INTO v_account FROM public.pingo_ticket_accounts
        WHERE user_id = NEW.user_id FOR UPDATE;
      IF NOT FOUND THEN
        INSERT INTO public.pingo_ticket_accounts(user_id, balance, status)
          VALUES (NEW.user_id, v_credit, 'active')
          RETURNING * INTO v_account;
        v_new_balance := v_credit;
      ELSE
        v_new_balance := v_account.balance + v_credit;
        UPDATE public.pingo_ticket_accounts SET balance = v_new_balance WHERE id = v_account.id;
      END IF;

      INSERT INTO public.pingo_ticket_transactions
        (account_id, user_id, type, amount, merchant, category, description, balance_after)
      VALUES (v_account.id, NEW.user_id, 'credit', v_credit, 'AloClinica', 'mensalidade',
              'Crédito mensal Pingo Ticket (fatura ' || NEW.id || ')', v_new_balance);
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_credit_pingo_ticket ON public.pingo_card_invoices;
CREATE TRIGGER trg_credit_pingo_ticket
  AFTER UPDATE ON public.pingo_card_invoices
  FOR EACH ROW EXECUTE FUNCTION public.fn_credit_pingo_ticket_on_invoice_paid();

-- ============ 7. TRIGGER: bloqueio de dependentes acima do limite ============
CREATE OR REPLACE FUNCTION public.fn_enforce_dependent_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max integer := 0;
  v_count integer := 0;
BEGIN
  SELECT COALESCE(p.max_dependents, 0) INTO v_max
  FROM public.pingo_card_subscriptions s
  JOIN public.pingo_card_plans p ON p.id = s.plan_id
  WHERE s.user_id = NEW.guardian_id AND s.status = 'active'
  ORDER BY s.started_at DESC LIMIT 1;

  IF v_max IS NULL OR v_max = 0 THEN
    -- Sem plano ou plano sem dependentes: permite cadastrar até 1 (próprio uso) — ajuste se quiser bloquear
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO v_count FROM public.dependents WHERE guardian_id = NEW.guardian_id;
  IF v_count >= v_max THEN
    RAISE EXCEPTION 'Limite de dependentes atingido para seu plano (% / %).', v_count, v_max;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_enforce_dependent_limit ON public.dependents;
CREATE TRIGGER trg_enforce_dependent_limit
  BEFORE INSERT ON public.dependents
  FOR EACH ROW EXECUTE FUNCTION public.fn_enforce_dependent_limit();

-- ============ 8. RPC: resumo do cartão ============
CREATE OR REPLACE FUNCTION public.fn_get_cartao_summary(p_user_id uuid DEFAULT auth.uid())
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub RECORD;
  v_plan RECORD;
  v_ticket_balance numeric := 0;
  v_dep_count integer := 0;
  v_savings_month numeric := 0;
  v_next_invoice RECORD;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('has_subscription', false);
  END IF;

  SELECT * INTO v_sub FROM public.pingo_card_subscriptions
   WHERE user_id = p_user_id AND status IN ('active','trial','past_due')
   ORDER BY started_at DESC LIMIT 1;

  IF NOT FOUND THEN
    SELECT COALESCE(balance,0) INTO v_ticket_balance FROM public.pingo_ticket_accounts WHERE user_id = p_user_id;
    RETURN jsonb_build_object(
      'has_subscription', false,
      'pingo_ticket_balance', COALESCE(v_ticket_balance,0)
    );
  END IF;

  SELECT * INTO v_plan FROM public.pingo_card_plans WHERE id = v_sub.plan_id;
  SELECT COALESCE(balance,0) INTO v_ticket_balance FROM public.pingo_ticket_accounts WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_dep_count FROM public.dependents WHERE guardian_id = p_user_id;

  SELECT COALESCE(SUM(discount_amount),0) INTO v_savings_month
    FROM public.pingo_card_benefit_usage
    WHERE user_id = p_user_id
      AND used_at >= date_trunc('month', now());

  SELECT * INTO v_next_invoice FROM public.pingo_card_invoices
    WHERE user_id = p_user_id AND status IN ('pending','failed')
    ORDER BY due_date ASC LIMIT 1;

  RETURN jsonb_build_object(
    'has_subscription', true,
    'subscription', jsonb_build_object(
      'id', v_sub.id,
      'status', v_sub.status,
      'billing_cycle', v_sub.billing_cycle,
      'started_at', v_sub.started_at,
      'current_period_end', v_sub.current_period_end,
      'next_charge_at', v_sub.next_charge_at,
      'trial_ends_at', v_sub.trial_ends_at,
      'card_number', v_sub.card_number
    ),
    'plan', jsonb_build_object(
      'id', v_plan.id,
      'name', v_plan.name,
      'slug', v_plan.slug,
      'tagline', v_plan.tagline,
      'price_monthly', v_plan.price_monthly,
      'price_yearly', v_plan.price_yearly,
      'consultation_discount_percent', v_plan.consultation_discount_percent,
      'exam_discount_percent', v_plan.exam_discount_percent,
      'partner_discount_percent', v_plan.partner_discount_percent,
      'max_dependents', v_plan.max_dependents,
      'pingo_ticket_monthly_credit', v_plan.pingo_ticket_monthly_credit,
      'benefits', v_plan.benefits,
      'color', v_plan.color
    ),
    'pingo_ticket_balance', v_ticket_balance,
    'dependents_count', v_dep_count,
    'savings_this_month', v_savings_month,
    'next_invoice', CASE WHEN v_next_invoice IS NULL THEN NULL ELSE
      jsonb_build_object('id', v_next_invoice.id, 'amount', v_next_invoice.amount,
                         'due_date', v_next_invoice.due_date, 'status', v_next_invoice.status)
    END
  );
END $$;

GRANT EXECUTE ON FUNCTION public.fn_get_cartao_summary(uuid) TO authenticated, anon;

-- ============ 9. Seed inicial de planos (se vazio) ============
INSERT INTO public.pingo_card_plans
  (name, slug, tagline, description, price_monthly, price_yearly,
   consultation_discount_percent, exam_discount_percent, partner_discount_percent,
   max_dependents, pingo_ticket_monthly_credit, benefits, features_included, color, is_highlighted, is_active, display_order, cta_label, trial_days)
SELECT * FROM (VALUES
  ('Pingo Essencial','essencial','Comece a cuidar da sua saúde','Plano individual com descontos em consultas e exames.',
   19.90, 199.00, 20, 15, 10, 0, 0,
   '["20% off em consultas","15% off em exames","10% off na rede credenciada"]'::jsonb,
   '["Carteirinha digital","Suporte WhatsApp"]'::jsonb,
   'blue', false, true, 1, 'Começar agora', 7),
  ('Pingo Família','familia','Proteção para até 4 pessoas','Cobre você e até 3 dependentes com descontos ampliados.',
   39.90, 399.00, 30, 25, 15, 3, 25.00,
   '["30% off em consultas","25% off em exames","15% off na rede credenciada","R$25/mês em Pingo Ticket"]'::jsonb,
   '["Carteirinha digital","Até 3 dependentes","Pingo Ticket mensal","Suporte prioritário"]'::jsonb,
   'emerald', true, true, 2, 'Assinar Família', 7),
  ('Pingo Premium','premium','Saúde sem limites','Descontos máximos, Pingo Ticket cheio e até 6 dependentes.',
   69.90, 699.00, 40, 35, 20, 6, 75.00,
   '["40% off em consultas","35% off em exames","20% off na rede credenciada","R$75/mês em Pingo Ticket","Atendimento 24/7"]'::jsonb,
   '["Carteirinha digital","Até 6 dependentes","Pingo Ticket Premium","Atendimento 24/7","Telemedicina ilimitada"]'::jsonb,
   'amber', false, true, 3, 'Assinar Premium', 14)
) AS v(name,slug,tagline,description,price_monthly,price_yearly,
        consultation_discount_percent,exam_discount_percent,partner_discount_percent,
        max_dependents,pingo_ticket_monthly_credit,benefits,features_included,color,
        is_highlighted,is_active,display_order,cta_label,trial_days)
WHERE NOT EXISTS (SELECT 1 FROM public.pingo_card_plans);
