-- KYC status fields for patient profiles (doctors already have on doctor_profiles)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS kyc_status text,
  ADD COLUMN IF NOT EXISTS kyc_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS kyc_face_match_score numeric;

CREATE INDEX IF NOT EXISTS idx_profiles_kyc_status ON public.profiles (kyc_status);