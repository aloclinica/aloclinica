-- Backfill doctor_profiles for users with doctor role but no profile
INSERT INTO public.doctor_profiles (user_id, is_approved, crm_verified)
SELECT ur.user_id, true, false
FROM public.user_roles ur
LEFT JOIN public.doctor_profiles dp ON dp.user_id = ur.user_id
WHERE ur.role = 'doctor' AND dp.id IS NULL
ON CONFLICT (user_id) DO NOTHING;