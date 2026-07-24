-- ESCALONAMENTO DE PRIVILÉGIO (cadastro): handle_new_user pegava o papel de
-- NEW.raw_user_meta_data->>'role' e só bloqueava 'admin'/'support'. Como o cliente
-- controla raw_user_meta_data no signup (supabase.auth.signUp options.data), um
-- usuário podia se auto-conceder papéis privilegiados via API, sem passar pela UI:
--   - 'cartao_beneficios'  -> cartão de benefícios/descontos DE GRAÇA (mesmo efeito
--                             do exploit de RLS do Pingo, por outro vetor);
--   - 'laudista'           -> leitura de PHI (exames/laudos/DICOM no Storage);
--   - 'receptionist'/'partner'/'affiliate'/... -> acesso operacional indevido.
--
-- Correção: WHITELIST. Só papéis de AUTO-REGISTRO legítimo são aceitos do metadata:
-- patient, doctor, clinic (as três jornadas de cadastro self-service; doctor/clinic
-- ainda ficam gated por aprovação para agir). Qualquer outro papel é coagido a
-- 'patient' — os demais só podem ser concedidos por admin (user_roles é admin-only),
-- convite (fn_accept_manager_invite) ou pagamento (fn_sync_cartao_role, já travado).
--
-- Obs.: se recepcionistas forem se auto-cadastrar no futuro, o papel deve ser
-- concedido pela clínica/admin após vínculo — não reivindicado no signup.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
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
  -- SECURITY: whitelist de papéis de auto-registro. Ver comentário da migration.
  IF v_role NOT IN ('patient', 'doctor', 'clinic') THEN
    v_role := 'patient';
  END IF;

  BEGIN
    v_app_role := v_role::app_role;
  EXCEPTION WHEN invalid_text_representation THEN
    v_app_role := 'patient'::app_role;
  END;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;
