INSERT INTO public.user_roles (user_id, role)
VALUES ('77c528d4-c8b4-4e7f-8678-dabef20b5a44', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;