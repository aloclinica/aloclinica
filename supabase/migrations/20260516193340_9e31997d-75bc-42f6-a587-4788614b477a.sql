UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email = 'medico.teste01@aloclinica.com.br';

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'doctor'::app_role FROM auth.users WHERE email = 'medico.teste01@aloclinica.com.br'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.doctor_profiles (user_id, is_approved, crm_verified)
SELECT id, true, true FROM auth.users WHERE email = 'medico.teste01@aloclinica.com.br'
ON CONFLICT (user_id) DO UPDATE SET is_approved = true;