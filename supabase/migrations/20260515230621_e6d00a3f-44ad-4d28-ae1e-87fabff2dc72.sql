
-- Trigger 1: Auto-call verify-crm edge function when CRM is set/changed and not yet verified
CREATE OR REPLACE FUNCTION public.fn_auto_verify_crm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Fire only if CRM and UF are present and CRM not yet verified,
  -- and either it's a new row or crm/crm_state changed
  IF NEW.crm IS NOT NULL AND NEW.crm <> ''
     AND NEW.crm_state IS NOT NULL AND NEW.crm_state <> ''
     AND COALESCE(NEW.crm_verified, false) = false
     AND (
       TG_OP = 'INSERT'
       OR OLD.crm IS DISTINCT FROM NEW.crm
       OR OLD.crm_state IS DISTINCT FROM NEW.crm_state
     )
  THEN
    PERFORM public.invoke_edge_function(
      'verify-crm',
      jsonb_build_object(
        'crm', NEW.crm,
        'uf', NEW.crm_state,
        'doctor_profile_id', NEW.id::text
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_verify_crm ON public.doctor_profiles;
CREATE TRIGGER trg_auto_verify_crm
  AFTER INSERT OR UPDATE OF crm, crm_state ON public.doctor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.fn_auto_verify_crm();

-- Trigger 2: Auto-approve doctor when CRM verified AND KYC approved
CREATE OR REPLACE FUNCTION public.fn_auto_approve_doctor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Only act if not already approved and both CRM + KYC are valid
  IF COALESCE(NEW.is_approved, false) = false
     AND COALESCE(NEW.crm_verified, false) = true
     AND NEW.kyc_status = 'approved'
  THEN
    NEW.is_approved := true;

    -- Notify the doctor
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      '✅ Cadastro aprovado!',
      'Seu CRM foi verificado e seu cadastro foi aprovado automaticamente. Você já pode atender.',
      'success',
      '/dashboard'
    );

    -- Notify first admin
    SELECT user_id INTO admin_user_id FROM public.user_roles WHERE role = 'admin' LIMIT 1;
    IF admin_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        admin_user_id,
        '🩺 Médico aprovado automaticamente',
        'O médico (CRM ' || NEW.crm || '/' || NEW.crm_state || ') passou na verificação de CRM e KYC.',
        'info',
        '/dashboard/admin/doctors'
      );
    END IF;

    -- Activity log
    INSERT INTO public.activity_logs (action, entity_type, entity_id, user_id, details)
    VALUES (
      'doctor_auto_approved',
      'doctor_profile',
      NEW.id,
      NEW.user_id,
      jsonb_build_object(
        'crm', NEW.crm,
        'crm_state', NEW.crm_state,
        'kyc_score', NEW.kyc_face_match_score
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_approve_doctor ON public.doctor_profiles;
CREATE TRIGGER trg_auto_approve_doctor
  BEFORE UPDATE OF crm_verified, kyc_status ON public.doctor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.fn_auto_approve_doctor();
