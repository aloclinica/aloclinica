
DO $$
DECLARE
  pacientes jsonb := '[
    {"first":"Maria","last":"Teste","phone":"11999990001","gender":"female","dob":"1990-05-12"},
    {"first":"Joao","last":"Teste","phone":"11999990002","gender":"male","dob":"1985-09-23"},
    {"first":"Larissa","last":"Teste","phone":"11999990003","gender":"female","dob":"1995-02-08"},
    {"first":"Pedro","last":"Teste","phone":"11999990004","gender":"male","dob":"1978-11-30"}
  ]'::jsonb;
  p jsonb;
  v_user_id uuid;
  v_email text;
  v_idx int := 0;
  v_first_patient uuid;
  v_second_patient uuid;
  v_doc record;
  v_count int := 0;
BEGIN
  FOR p IN SELECT * FROM jsonb_array_elements(pacientes) LOOP
    v_idx := v_idx + 1;
    v_email := 'paciente' || v_idx || '@test.alomedico.local';

    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
    IF v_user_id IS NOT NULL THEN
      IF v_idx = 1 THEN v_first_patient := v_user_id; END IF;
      IF v_idx = 2 THEN v_second_patient := v_user_id; END IF;
      CONTINUE;
    END IF;

    v_user_id := gen_random_uuid();
    IF v_idx = 1 THEN v_first_patient := v_user_id; END IF;
    IF v_idx = 2 THEN v_second_patient := v_user_id; END IF;

    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, is_anonymous
    ) VALUES (
      v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      v_email, crypt('SeedPatient!2026', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('first_name', p->>'first', 'last_name', p->>'last', 'seed', true),
      false, false
    );

    INSERT INTO public.profiles (
      user_id, first_name, last_name, phone, gender, date_of_birth, account_status
    ) VALUES (
      v_user_id, p->>'first', p->>'last',
      p->>'phone', p->>'gender', (p->>'dob')::date, 'active'
    )
    ON CONFLICT (user_id) DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      phone = EXCLUDED.phone,
      account_status = 'active';

    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'patient')
    ON CONFLICT (user_id, role) DO NOTHING;
  END LOOP;

  IF v_first_patient IS NOT NULL THEN
    FOR v_doc IN
      SELECT dp.id AS doctor_id, dp.price, dp.consultation_duration
      FROM public.doctor_profiles dp
      WHERE dp.is_approved = true
      ORDER BY dp.created_at DESC
      LIMIT 3
    LOOP
      v_count := v_count + 1;
      INSERT INTO public.appointments (
        patient_id, doctor_id, scheduled_at, duration_minutes,
        status, payment_status, payment_confirmed_at,
        price_at_booking, appointment_type, notes
      ) VALUES (
        v_first_patient, v_doc.doctor_id,
        now() - (v_count * interval '14 days'),
        COALESCE(v_doc.consultation_duration, 30),
        'completed', 'confirmed', now() - (v_count * interval '14 days'),
        v_doc.price, 'first_visit',
        'Consulta de teste — histórico seed'
      );
    END LOOP;
  END IF;

  IF v_second_patient IS NOT NULL THEN
    SELECT dp.id AS doctor_id, dp.price, dp.consultation_duration
    INTO v_doc
    FROM public.doctor_profiles dp
    WHERE dp.is_approved = true
    ORDER BY random()
    LIMIT 1;

    IF v_doc.doctor_id IS NOT NULL THEN
      INSERT INTO public.appointments (
        patient_id, doctor_id, scheduled_at, duration_minutes,
        status, payment_status, payment_confirmed_at,
        price_at_booking, appointment_type, notes
      ) VALUES (
        v_second_patient, v_doc.doctor_id,
        now() + interval '2 days',
        COALESCE(v_doc.consultation_duration, 30),
        'confirmed', 'confirmed', now(),
        v_doc.price, 'first_visit',
        'Consulta futura de teste'
      );
    END IF;
  END IF;
END $$;
