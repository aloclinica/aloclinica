
-- Council types enum
DO $$ BEGIN
  CREATE TYPE public.council_type AS ENUM (
    'CRM','CRP','CRN','CRFa','CREFITO','COREN','CRO','CRBM','CRF','CREF','CRESS','CRTR','OUTRO'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- New columns on doctor_profiles
ALTER TABLE public.doctor_profiles
  ADD COLUMN IF NOT EXISTS council_type public.council_type,
  ADD COLUMN IF NOT EXISTS council_number text,
  ADD COLUMN IF NOT EXISTS council_state text;

-- Backfill from legacy crm columns
UPDATE public.doctor_profiles
SET council_type = COALESCE(council_type, 'CRM'),
    council_number = COALESCE(council_number, crm),
    council_state = COALESCE(council_state, crm_state)
WHERE council_type IS NULL OR council_number IS NULL OR council_state IS NULL;

-- Sync trigger: keep legacy crm column populated
CREATE OR REPLACE FUNCTION public.sync_doctor_council_to_crm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.council_type IS NOT NULL AND NEW.council_number IS NOT NULL THEN
    IF NEW.council_type = 'CRM' THEN
      NEW.crm := NEW.council_number;
      NEW.crm_state := COALESCE(NEW.council_state, NEW.crm_state);
    ELSE
      NEW.crm := NEW.council_type::text || '/' || COALESCE(NEW.council_state, '--') || ' ' || NEW.council_number;
      NEW.crm_state := COALESCE(NEW.council_state, NEW.crm_state, '--');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_doctor_council_to_crm ON public.doctor_profiles;
CREATE TRIGGER trg_sync_doctor_council_to_crm
  BEFORE INSERT OR UPDATE OF council_type, council_number, council_state
  ON public.doctor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_doctor_council_to_crm();
