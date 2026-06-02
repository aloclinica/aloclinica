UPDATE auth.users 
SET encrypted_password = crypt('@Costagold2026', gen_salt('bf')),
    email_confirmed_at = now(),
    updated_at = now(),
    raw_app_meta_data = raw_app_meta_data || '{"provider":"email","providers":["email"]}',
    raw_user_meta_data = raw_user_meta_data || '{"full_name":"Admin Plena Saúde"}'
WHERE email = 'plenasaudebv@gmail.com';