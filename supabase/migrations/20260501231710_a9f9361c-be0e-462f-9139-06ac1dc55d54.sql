
-- Pingo Ticket: vale-alimentação com saldo e transações
CREATE TABLE IF NOT EXISTS public.pingo_ticket_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  card_number TEXT NOT NULL UNIQUE DEFAULT ('7821' || lpad((floor(random()*1000000000000))::bigint::text, 12, '0')),
  balance NUMERIC(12,2) NOT NULL DEFAULT 1000.00,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pingo_ticket_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pingo_ticket_accounts FORCE ROW LEVEL SECURITY;

CREATE POLICY "Users see own ticket account" ON public.pingo_ticket_accounts
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users insert own ticket account" ON public.pingo_ticket_accounts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins update ticket accounts" ON public.pingo_ticket_accounts
  FOR UPDATE TO authenticated USING (public.is_admin());

CREATE TRIGGER trg_pingo_ticket_accounts_updated
  BEFORE UPDATE ON public.pingo_ticket_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Transações
CREATE TABLE IF NOT EXISTS public.pingo_ticket_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.pingo_ticket_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit','debit')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  merchant TEXT,
  category TEXT,
  description TEXT,
  balance_after NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pingo_ticket_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pingo_ticket_transactions FORCE ROW LEVEL SECURITY;

CREATE POLICY "Users see own ticket tx" ON public.pingo_ticket_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users insert own ticket tx" ON public.pingo_ticket_transactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_pingo_ticket_tx_user_created ON public.pingo_ticket_transactions(user_id, created_at DESC);

-- RPC atômico para gastar saldo
CREATE OR REPLACE FUNCTION public.fn_spend_pingo_ticket(
  p_amount NUMERIC,
  p_merchant TEXT,
  p_category TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_account RECORD;
  v_new_balance NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Invalid amount'; END IF;

  SELECT * INTO v_account FROM pingo_ticket_accounts
    WHERE user_id = auth.uid() FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO pingo_ticket_accounts (user_id) VALUES (auth.uid())
      RETURNING * INTO v_account;
  END IF;

  IF v_account.status <> 'active' THEN RAISE EXCEPTION 'Account inactive'; END IF;
  IF v_account.balance < p_amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  v_new_balance := v_account.balance - p_amount;

  UPDATE pingo_ticket_accounts SET balance = v_new_balance WHERE id = v_account.id;

  INSERT INTO pingo_ticket_transactions
    (account_id, user_id, type, amount, merchant, category, description, balance_after)
  VALUES
    (v_account.id, auth.uid(), 'debit', p_amount, p_merchant, p_category, p_description, v_new_balance);

  RETURN jsonb_build_object('success', true, 'balance', v_new_balance);
END; $$;
