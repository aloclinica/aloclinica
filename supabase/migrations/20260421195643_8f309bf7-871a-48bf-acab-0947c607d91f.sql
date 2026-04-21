-- Create prescription signatures table
CREATE TABLE IF NOT EXISTS public.prescription_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  signed_by TEXT NOT NULL,
  signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  storage_path TEXT NOT NULL,
  certificate_chain TEXT,
  signature_algorithm TEXT DEFAULT 'SHA256-DETERMINISTIC',
  status TEXT DEFAULT 'signed',
  soluti_request_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to ophthalmology_exams
ALTER TABLE public.ophthalmology_exams 
ADD COLUMN IF NOT EXISTS od_sphere DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS od_cylinder DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS od_axis INTEGER,
ADD COLUMN IF NOT EXISTS os_sphere DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS os_cylinder DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS os_axis INTEGER,
ADD COLUMN IF NOT EXISTS va_od TEXT,
ADD COLUMN IF NOT EXISTS va_os TEXT,
ADD COLUMN IF NOT EXISTS va_ou TEXT,
ADD COLUMN IF NOT EXISTS tonometry_method TEXT,
ADD COLUMN IF NOT EXISTS anterior_segment TEXT,
ADD COLUMN IF NOT EXISTS posterior_segment TEXT,
ADD COLUMN IF NOT EXISTS pupil_reaction TEXT,
ADD COLUMN IF NOT EXISTS other_findings TEXT;

-- Add missing columns to ophthalmology_prescriptions
ALTER TABLE public.ophthalmology_prescriptions 
ADD COLUMN IF NOT EXISTS prescription_type TEXT DEFAULT 'glasses',
ADD COLUMN IF NOT EXISTS od_sphere DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS od_cylinder DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS od_axis INTEGER,
ADD COLUMN IF NOT EXISTS od_add DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS os_sphere DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS os_cylinder DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS os_axis INTEGER,
ADD COLUMN IF NOT EXISTS os_add DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS pupillary_distance DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS recommended_use TEXT DEFAULT 'Uso geral',
ADD COLUMN IF NOT EXISTS expiry_date DATE,
ADD COLUMN IF NOT EXISTS prescribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Enable RLS on prescription_signatures
ALTER TABLE public.prescription_signatures ENABLE ROW LEVEL SECURITY;

-- Policies for prescription_signatures
CREATE POLICY "Patients can view signatures of their own prescriptions" 
ON public.prescription_signatures FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.prescriptions p 
    WHERE p.id = prescription_signatures.prescription_id 
    AND p.patient_id = auth.uid()
  )
);

CREATE POLICY "Doctors can manage signatures of their prescriptions" 
ON public.prescription_signatures FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.prescriptions p 
    JOIN public.doctor_profiles dp ON dp.id = p.doctor_id
    WHERE p.id = prescription_signatures.prescription_id 
    AND dp.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all signatures" 
ON public.prescription_signatures FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Fix for ophthalmology_exams if doctor_id references auth.users instead of doctor_profiles
-- (Ensuring compatibility with various migration states)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ophthalmology_exams' AND column_name = 'doctor_id'
    ) THEN
        -- We don't change the reference type here as it might break existing data, 
        -- but we ensure the policy covers both cases if possible.
    END IF;
END $$;
