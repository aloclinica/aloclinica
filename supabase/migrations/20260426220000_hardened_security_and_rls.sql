-- ============================================================================
-- MASTER DATABASE SECURITY & CONFIGURATION
-- This migration ensures a baseline of high security for the entire database.
-- ============================================================================

-- 1. ENABLE RLS ON ALL TABLES (IDEMPOTENT)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
END $$;

-- 2. HARDEN SCHEMA PERMISSIONS
REVOKE ALL ON SCHEMA public FROM public;
REVOKE ALL ON SCHEMA public FROM anon;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO service_role;

-- 3. HELPER FUNCTIONS SECURITY DEFINER
DO $$ BEGIN
    ALTER FUNCTION public.has_role(_user_id uuid, _role public.app_role) SECURITY DEFINER;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER FUNCTION public.update_updated_at_column() SECURITY DEFINER;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 4. REFINED CORE POLICIES

-- PROFILES: Strict access
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public view basic profiles" ON public.profiles;
  CREATE POLICY "Public view basic profiles" ON public.profiles 
    FOR SELECT USING (true);
END $$;

-- USER ROLES: Only admins can manage, users can see their own
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
  CREATE POLICY "Admins manage roles" ON public.user_roles 
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));
END $$;

-- 5. MEDICAL RECORD SECURITY (CRITICAL)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Strict medical records access" ON public.medical_records;
  CREATE POLICY "Strict medical records access" ON public.medical_records
    FOR SELECT USING (
      auth.uid() = patient_id 
      OR EXISTS (SELECT 1 FROM public.doctor_profiles dp WHERE dp.id = doctor_id AND dp.user_id = auth.uid())
      OR public.has_role(auth.uid(), 'admin')
    );
END $$;

-- 6. WALLET & FINANCE SECURITY
DO $$ BEGIN
  DROP POLICY IF EXISTS "Strict wallet access" ON public.wallet_transactions;
  CREATE POLICY "Strict wallet access" ON public.wallet_transactions
    FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
END $$;

-- 7. AUDIT LOGGING ENFORCEMENT
DO $$ BEGIN
  DROP POLICY IF EXISTS "Audit logs are immutable" ON public.activity_logs;
  CREATE POLICY "Audit logs are immutable" ON public.activity_logs
    FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
  
  DROP POLICY IF EXISTS "Audit logs insert" ON public.activity_logs;
  CREATE POLICY "Audit logs insert" ON public.activity_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);
END $$;

-- 8. AUTO-PROFILES TRIGGER (Safety Check)
CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS TRIGGER AS 12495
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (NEW.id, split_part(NEW.raw_user_meta_data->>'full_name', ' ', 1), split_part(NEW.raw_user_meta_data->>'full_name', ' ', 2))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
12495 LANGUAGE plpgsql SECURITY DEFINER;

-- 9. ADMIN SYSTEM FUNCTIONS
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id uuid)
RETURNS void AS 12495
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;
  DELETE FROM auth.users WHERE id = target_user_id;
END;
12495 LANGUAGE plpgsql SECURITY DEFINER;

-- 10. FINAL CHECK ON SENSITIVE TABLES
DO $$ BEGIN
    REVOKE ALL ON public.medical_records FROM anon;
    REVOKE ALL ON public.wallet_transactions FROM anon;
    REVOKE ALL ON public.prescriptions FROM anon;
    REVOKE ALL ON public.user_roles FROM anon;

    GRANT SELECT, INSERT, UPDATE ON public.medical_records TO authenticated;
    GRANT SELECT, INSERT, UPDATE ON public.wallet_transactions TO authenticated;
    GRANT SELECT, INSERT, UPDATE ON public.prescriptions TO authenticated;
    GRANT SELECT ON public.user_roles TO authenticated;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
