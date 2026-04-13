-- ============================================================================
-- SETUP DADOS DE TESTE - TELEMEDICINA ALOCLINICA
-- ============================================================================
-- Execute este script no Supabase SQL Editor para criar dados de teste
-- https://app.supabase.com/project/[seu-project-id]/sql/new
-- ============================================================================

-- 1. CRIAR ESPECIALIDADES (caso não existam)
INSERT INTO public.specialties (name, icon, description)
VALUES
  ('Clínico Geral', '🏥', 'Consultas gerais de saúde'),
  ('Cardiologia', '❤️', 'Doenças do coração'),
  ('Dermatologia', '🩹', 'Doenças da pele'),
  ('Pediatria', '👶', 'Saúde infantil'),
  ('Psicologia', '🧠', 'Saúde mental')
ON CONFLICT DO NOTHING;

-- 2. CRIAR USUÁRIOS MÉDICOS (com auth_id fictício)
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  specialty_id,
  avatar_url,
  bio,
  verified,
  created_at
)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'dr.carlos@aloclinica.com',
    'Dr. Carlos Silva',
    'doctor',
    (SELECT id FROM public.specialties WHERE name = 'Clínico Geral' LIMIT 1),
    'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos',
    'Clínico Geral com 15 anos de experiência',
    true,
    NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'dra.amanda@aloclinica.com',
    'Dra. Amanda Costa',
    'doctor',
    (SELECT id FROM public.specialties WHERE name = 'Cardiologia' LIMIT 1),
    'https://api.dicebear.com/7.x/avataaars/svg?seed=amanda',
    'Cardiologista especializada em hipertensão',
    true,
    NOW()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'dra.mariana@aloclinica.com',
    'Dra. Mariana Santos',
    'doctor',
    (SELECT id FROM public.specialties WHERE name = 'Dermatologia' LIMIT 1),
    'https://api.dicebear.com/7.x/avataaars/svg?seed=mariana',
    'Dermatologista clínica e estética',
    true,
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- 3. CRIAR USUÁRIOS PACIENTES
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  avatar_url,
  verified,
  created_at
)
VALUES
  (
    '44444444-4444-4444-4444-444444444444',
    'joao.silva@email.com',
    'João Silva',
    'patient',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=joao',
    true,
    NOW()
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'maria.santos@email.com',
    'Maria Santos',
    'patient',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=maria',
    true,
    NOW()
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    'pedro.oliveira@email.com',
    'Pedro Oliveira',
    'patient',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=pedro',
    true,
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- 4. CRIAR SLOTS DE DISPONIBILIDADE PARA MÉDICOS
INSERT INTO public.availability_slots (
  doctor_id,
  date,
  start_time,
  end_time,
  status
)
VALUES
  -- Dr. Carlos - Hoje e amanhã
  (
    '11111111-1111-1111-1111-111111111111',
    CURRENT_DATE,
    '09:00:00'::time,
    '09:30:00'::time,
    'available'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    CURRENT_DATE,
    '10:00:00'::time,
    '10:30:00'::time,
    'available'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    CURRENT_DATE,
    '14:00:00'::time,
    '14:30:00'::time,
    'available'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    CURRENT_DATE + INTERVAL '1 day',
    '09:00:00'::time,
    '09:30:00'::time,
    'available'
  ),
  -- Dra. Amanda - Hoje e amanhã
  (
    '22222222-2222-2222-2222-222222222222',
    CURRENT_DATE,
    '11:00:00'::time,
    '11:30:00'::time,
    'available'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    CURRENT_DATE,
    '15:00:00'::time,
    '15:30:00'::time,
    'available'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    CURRENT_DATE + INTERVAL '1 day',
    '10:00:00'::time,
    '10:30:00'::time,
    'available'
  ),
  -- Dra. Mariana - Hoje e amanhã
  (
    '33333333-3333-3333-3333-333333333333',
    CURRENT_DATE,
    '13:00:00'::time,
    '13:30:00'::time,
    'available'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    CURRENT_DATE + INTERVAL '1 day',
    '14:00:00'::time,
    '14:30:00'::time,
    'available'
  )
ON CONFLICT DO NOTHING;

-- 5. CRIAR AGENDAMENTOS DE EXEMPLO
INSERT INTO public.appointments (
  id,
  patient_id,
  doctor_id,
  scheduled_for,
  duration_minutes,
  specialty,
  status,
  reason,
  payment_status,
  created_at,
  updated_at
)
VALUES
  -- Agendamento em progresso (para testar realtime PIX)
  (
    '77777777-7777-7777-7777-777777777777',
    '44444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    CURRENT_TIMESTAMP + INTERVAL '2 hours',
    30,
    'Clínico Geral',
    'scheduled',
    'Consulta de acompanhamento',
    'pending',
    NOW(),
    NOW()
  ),
  -- Agendamento confirmado
  (
    '88888888-8888-8888-8888-888888888888',
    '55555555-5555-5555-5555-555555555555',
    '22222222-2222-2222-2222-222222222222',
    CURRENT_TIMESTAMP + INTERVAL '1 day 10 hours',
    30,
    'Cardiologia',
    'scheduled',
    'Avaliação cardiológica',
    'confirmed',
    NOW() - INTERVAL '1 day',
    NOW()
  ),
  -- Agendamento para próximos dias
  (
    '99999999-9999-9999-9999-999999999999',
    '66666666-6666-6666-6666-666666666666',
    '33333333-3333-3333-3333-333333333333',
    CURRENT_TIMESTAMP + INTERVAL '3 days',
    30,
    'Dermatologia',
    'scheduled',
    'Consulta de dermatologia',
    'pending',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- 6. CRIAR TABELA DE MENSAGENS (se não existir)
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text text NOT NULL,
  file_url text,
  file_name text,
  file_type text CHECK (file_type IN ('image', 'document', NULL)),
  created_at timestamp WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_appointment_id ON public.messages(appointment_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);

-- 7. CRIAR TABELA DE GRAVAÇÕES (se não existir)
CREATE TABLE IF NOT EXISTS public.consultation_recordings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  recorded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  duration_seconds integer,
  uploaded_at timestamp WITH TIME ZONE DEFAULT now(),
  created_at timestamp WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consultation_recordings_appointment_id ON public.consultation_recordings(appointment_id);

-- 8. HABILITAR REALTIME (IMPORTANTE!)
ALTER TABLE public.appointments REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.consultation_recordings REPLICA IDENTITY FULL;

-- 9. EXIBIR DADOS CRIADOS
SELECT '✅ DADOS DE TESTE CRIADOS COM SUCESSO!' as status;

-- Verificar quantidades
SELECT
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'doctor') as "Médicos",
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'patient') as "Pacientes",
  (SELECT COUNT(*) FROM public.availability_slots) as "Slots Disponíveis",
  (SELECT COUNT(*) FROM public.appointments) as "Agendamentos";
