-- Onboarding de contratos: leads públicos + convites de gestor com token.

-- 1) Leads inbound — formulário público em /contratos
CREATE TABLE IF NOT EXISTS public.contract_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name text NOT NULL,
  org_type text NOT NULL CHECK (org_type IN ('prefeitura','secretaria','ong','empresa','sindicato','operadora','outro')),
  cnpj text,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  contact_role text,
  expected_beneficiaries integer,
  message text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','won','lost')),
  created_at timestamptz NOT NULL DEFAULT now(),
  contacted_by uuid REFERENCES auth.users(id),
  contacted_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contract_leads_status ON public.contract_leads(status, created_at DESC);
ALTER TABLE public.contract_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public can submit lead" ON public.contract_leads;
CREATE POLICY "public can submit lead" ON public.contract_leads FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "admin reads leads" ON public.contract_leads;
CREATE POLICY "admin reads leads" ON public.contract_leads FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "admin updates leads" ON public.contract_leads;
CREATE POLICY "admin updates leads" ON public.contract_leads FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2) Convites de gestor — admin gera link único, gestor cria conta com role auto-aplicada
CREATE TABLE IF NOT EXISTS public.contract_manager_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  contrato_id uuid NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  email text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  used_at timestamptz,
  used_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_invites_token ON public.contract_manager_invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_contrato ON public.contract_manager_invites(contrato_id);
ALTER TABLE public.contract_manager_invites ENABLE ROW LEVEL SECURITY;
-- Convite por token é público (necessário para a página de aceite)
DROP POLICY IF EXISTS "public reads invite by token" ON public.contract_manager_invites;
CREATE POLICY "public reads invite by token" ON public.contract_manager_invites FOR SELECT USING (true);
DROP POLICY IF EXISTS "admin manages invites" ON public.contract_manager_invites;
CREATE POLICY "admin manages invites" ON public.contract_manager_invites FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3) RPC: aceita convite (público — paciente acabou de criar conta)
-- Aplica role contract_manager + vincula ao contrato + marca convite usado.
CREATE OR REPLACE FUNCTION public.fn_accept_manager_invite(p_token text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE inv RECORD; result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'authentication_required');
  END IF;

  SELECT * INTO inv FROM public.contract_manager_invites
   WHERE token = p_token AND used_at IS NULL AND expires_at > now()
   LIMIT 1;

  IF inv IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_or_expired_token');
  END IF;

  -- Aplica a role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'contract_manager'::public.app_role)
  ON CONFLICT DO NOTHING;

  -- Marca o contrato como gerenciado por este usuário
  UPDATE public.contratos
     SET managed_by_user_id = auth.uid(), updated_at = now()
   WHERE id = inv.contrato_id;

  -- Marca o convite como usado
  UPDATE public.contract_manager_invites
     SET used_at = now(), used_by_user_id = auth.uid()
   WHERE id = inv.id;

  SELECT jsonb_build_object('ok', true, 'contrato_id', inv.contrato_id, 'contrato_nome', c.nome)
    INTO result
    FROM public.contratos c WHERE c.id = inv.contrato_id;

  RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.fn_accept_manager_invite(text) TO authenticated;

NOTIFY pgrst, 'reload schema';
