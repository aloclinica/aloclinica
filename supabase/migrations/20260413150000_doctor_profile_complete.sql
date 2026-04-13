-- Complete doctor_profiles schema for full settings UI
-- All columns are idempotent (IF NOT EXISTS)

-- Personal
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS cpf text;

-- Professional
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS rqe text;
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS specialty_id uuid REFERENCES public.specialties(id) ON DELETE SET NULL;
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS sub_specialties text[] DEFAULT '{}'::text[];

-- Bio / content
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS short_description text;
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS languages text[] DEFAULT ARRAY['Português']::text[];
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS education_list jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS certifications jsonb DEFAULT '[]'::jsonb;

-- Media
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS cover_url text;
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS video_intro_url text;

-- Contact & address
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS whatsapp text;
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS address_street text;
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS address_number text;
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS address_complement text;
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS address_neighborhood text;
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS address_city text;
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS address_state text;
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS address_zip text;
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS address_country text DEFAULT 'BR';

-- Practice
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS consultation_duration_min integer DEFAULT 30;
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS accepts_insurance boolean DEFAULT false;
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS insurance_plans text[] DEFAULT '{}'::text[];
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS available_for_telemedicine boolean DEFAULT true;
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS available_for_in_person boolean DEFAULT false;

-- Settings
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS auto_confirm_bookings boolean DEFAULT true;
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS show_in_directory boolean DEFAULT true;
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/Sao_Paulo';

-- Ensure avatars bucket is public (already exists, but make sure)
UPDATE storage.buckets SET public = true WHERE id = 'avatars';

-- Basic storage policy allowing authenticated users to upload to their own folder in avatars
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='doctor_avatar_upload') THEN
    CREATE POLICY "doctor_avatar_upload" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='doctor_avatar_update') THEN
    CREATE POLICY "doctor_avatar_update" ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='doctor_avatar_public_read') THEN
    CREATE POLICY "doctor_avatar_public_read" ON storage.objects
      FOR SELECT TO public USING (bucket_id = 'avatars');
  END IF;
END $$;
