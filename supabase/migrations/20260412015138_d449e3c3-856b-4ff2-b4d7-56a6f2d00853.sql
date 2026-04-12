
-- Table for doctor care areas / conditions treated
CREATE TABLE public.doctor_care_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  area_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(doctor_id, area_name)
);

-- Index for fast lookup
CREATE INDEX idx_doctor_care_areas_doctor ON public.doctor_care_areas(doctor_id);

-- Enable RLS
ALTER TABLE public.doctor_care_areas ENABLE ROW LEVEL SECURITY;

-- Anyone can view care areas (public info)
CREATE POLICY "Care areas are publicly viewable"
ON public.doctor_care_areas FOR SELECT
USING (true);

-- Doctors can manage their own care areas
CREATE POLICY "Doctors can insert their own care areas"
ON public.doctor_care_areas FOR INSERT
TO authenticated
WITH CHECK (
  doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Doctors can delete their own care areas"
ON public.doctor_care_areas FOR DELETE
TO authenticated
USING (
  doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid())
);

-- Admins can manage all
CREATE POLICY "Admins can manage all care areas"
ON public.doctor_care_areas FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
