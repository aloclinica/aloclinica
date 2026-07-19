-- =====================================================================
-- SECURITY HARDENING CRÍTICO (pré-lançamento)
-- Fecha as brechas exploráveis por qualquer anônimo. Idempotente.
--   1. Auto-promoção a admin via role no metadata do signup (CRÍTICO)
--   2. IDOR financeiro em fn_get_cartao_summary
--   3. Oráculo de enumeração de CPF exposto a anon (LGPD)
--   4. search_path fixo em todas as funções SECURITY DEFINER
--   5. Backdoor legado de admin por e-mail hardcoded (defensivo)
-- =====================================================================

-- 1. handle_new_user não confia no `role` do cliente ------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role text;
  v_app_role app_role;
  v_cpf text;
BEGIN
  v_cpf := NULLIF(regexp_replace(COALESCE(NEW.raw_user_meta_data->>'cpf',''), '\D', '', 'g'), '');

  IF v_cpf IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles WHERE cpf = v_cpf) THEN
    RAISE EXCEPTION 'CPF_ALREADY_REGISTERED' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.profiles (user_id, first_name, last_name, cpf, phone, date_of_birth)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    v_cpf,
    NULLIF(regexp_replace(COALESCE(NEW.raw_user_meta_data->>'phone',''), '\D', '', 'g'), ''),
    NULLIF(NEW.raw_user_meta_data->>'date_of_birth','')::date
  )
  ON CONFLICT (user_id) DO NOTHING;

  v_role := lower(COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'patient'));
  -- SECURITY: roles privilegiados jamais por auto-cadastro.
  IF v_role IN ('admin', 'support') THEN
    v_role := 'patient';
  END IF;

  BEGIN
    v_app_role := v_role::app_role;
  EXCEPTION WHEN invalid_text_representation THEN
    v_app_role := 'patient'::app_role;
  END;

  IF v_app_role IN ('admin'::app_role, 'support'::app_role) THEN
    v_app_role := 'patient'::app_role;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- 2. fn_get_cartao_summary: só o dono ou admin -----------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
             WHERE n.nspname='public' AND p.proname='fn_get_cartao_summary') THEN
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.fn_get_cartao_summary(p_user_id uuid DEFAULT auth.uid())
      RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
      AS $body$
      DECLARE v_sub RECORD; v_plan RECORD; v_ticket_balance numeric := 0;
              v_dep_count integer := 0; v_savings_month numeric := 0; v_next_invoice RECORD;
      BEGIN
        IF p_user_id IS NOT NULL AND p_user_id <> auth.uid() AND NOT public.is_admin() THEN
          RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
        END IF;
        IF p_user_id IS NULL THEN RETURN jsonb_build_object('has_subscription', false); END IF;
        SELECT * INTO v_sub FROM public.pingo_card_subscriptions
          WHERE user_id = p_user_id AND status IN ('active','trial','past_due')
          ORDER BY started_at DESC LIMIT 1;
        IF NOT FOUND THEN
          SELECT COALESCE(balance,0) INTO v_ticket_balance FROM public.pingo_ticket_accounts WHERE user_id = p_user_id;
          RETURN jsonb_build_object('has_subscription', false, 'pingo_ticket_balance', COALESCE(v_ticket_balance,0));
        END IF;
        SELECT * INTO v_plan FROM public.pingo_card_plans WHERE id = v_sub.plan_id;
        SELECT COALESCE(balance,0) INTO v_ticket_balance FROM public.pingo_ticket_accounts WHERE user_id = p_user_id;
        SELECT COUNT(*) INTO v_dep_count FROM public.dependents WHERE guardian_id = p_user_id;
        SELECT COALESCE(SUM(discount_amount),0) INTO v_savings_month FROM public.pingo_card_benefit_usage
          WHERE user_id = p_user_id AND used_at >= date_trunc('month', now());
        SELECT * INTO v_next_invoice FROM public.pingo_card_invoices
          WHERE user_id = p_user_id AND status IN ('pending','failed') ORDER BY due_date ASC LIMIT 1;
        RETURN jsonb_build_object(
          'has_subscription', true,
          'subscription', to_jsonb(v_sub), 'plan', to_jsonb(v_plan),
          'pingo_ticket_balance', v_ticket_balance, 'dependents_count', v_dep_count,
          'savings_this_month', v_savings_month,
          'next_invoice', CASE WHEN v_next_invoice IS NULL THEN NULL ELSE to_jsonb(v_next_invoice) END
        );
      END $body$;
    $fn$;
    REVOKE EXECUTE ON FUNCTION public.fn_get_cartao_summary(uuid) FROM anon;
  END IF;
END $$;

-- 3. cpf_in_use: sem enumeração anônima ------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='cpf_in_use') THEN
    REVOKE EXECUTE ON FUNCTION public.cpf_in_use(text) FROM anon;
  END IF;
END $$;

-- 4. search_path fixo em TODA função SECURITY DEFINER ----------------
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.prosecdef=true
       AND NOT EXISTS (SELECT 1 FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) c WHERE c LIKE 'search_path=%')
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', r.sig);
  END LOOP;
END $$;

-- 5. Backdoor legado de admin por e-mail (defensivo) -----------------
DROP TRIGGER IF EXISTS on_auth_user_created_assign_admin ON auth.users;
DROP TRIGGER IF EXISTS assign_admin_on_signup_trigger ON auth.users;

-- =====================================================================
-- APÓS APLICAR: auditar e revogar roles privilegiados de auto-cadastro:
--   SELECT ur.user_id, ur.role, u.email FROM public.user_roles ur
--     JOIN auth.users u ON u.id=ur.user_id WHERE ur.role IN ('admin','support');
-- =====================================================================
