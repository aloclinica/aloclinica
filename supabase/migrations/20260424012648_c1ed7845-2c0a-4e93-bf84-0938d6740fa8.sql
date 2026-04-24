
-- Add health fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS blood_type text,
  ADD COLUMN IF NOT EXISTS allergies text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS chronic_conditions text[] DEFAULT '{}'::text[];

-- Update signup trigger to populate all available signup fields from raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    first_name,
    last_name,
    cpf,
    phone,
    date_of_birth
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NULLIF(regexp_replace(COALESCE(NEW.raw_user_meta_data->>'cpf',''), '\D', '', 'g'), ''),
    NULLIF(regexp_replace(COALESCE(NEW.raw_user_meta_data->>'phone',''), '\D', '', 'g'), ''),
    NULLIF(NEW.raw_user_meta_data->>'date_of_birth','')::date
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Ensure trigger exists on auth.users (Supabase managed; recreate idempotently)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
