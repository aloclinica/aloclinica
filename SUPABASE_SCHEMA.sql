-- ============================================================================
-- AloClínica — Schema SQL para Supabase
-- ============================================================================
-- Copie e execute cada CREATE TABLE abaixo no Supabase SQL Editor
-- https://app.supabase.com/project/[seu-project-id]/sql/new
-- ============================================================================

-- 1. Tabela de assinaturas digitais (CRÍTICA para assinatura de documentos)
CREATE TABLE IF NOT EXISTS public.prescription_signatures (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_id text NOT NULL,
  signed_by text NOT NULL,
  signed_at timestamp WITH TIME ZONE NOT NULL,
  storage_path text NOT NULL,
  certificate_chain text,
  signature_algorithm text DEFAULT 'SHA256-DETERMINISTIC',
  status text DEFAULT 'signed' CHECK (status IN ('signed', 'pending', 'failed')),
  soluti_request_id text UNIQUE,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp WITH TIME ZONE DEFAULT now(),
  updated_at timestamp WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_prescription_signatures_prescription_id ON public.prescription_signatures(prescription_id);
CREATE INDEX IF NOT EXISTS idx_prescription_signatures_signed_by ON public.prescription_signatures(signed_by);
CREATE INDEX IF NOT EXISTS idx_prescription_signatures_status ON public.prescription_signatures(status);

-- RLS Policy (permitir leitura/escrita do próprio usuário)
ALTER TABLE public.prescription_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prescription_signatures_select"
  ON public.prescription_signatures
  FOR SELECT
  USING (auth.uid()::text = signed_by OR auth.uid()::text IN (
    SELECT user_id FROM public.profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "prescription_signatures_insert"
  ON public.prescription_signatures
  FOR INSERT
  WITH CHECK (auth.uid()::text = signed_by);

-- ============================================================================
-- 2. Tabela de slots de disponibilidade (para ClinicDashboard)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.availability_slots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked')),
  appointment_id uuid,
  created_at timestamp WITH TIME ZONE DEFAULT now(),
  updated_at timestamp WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_availability_slots_doctor_id ON public.availability_slots(doctor_id);
CREATE INDEX IF NOT EXISTS idx_availability_slots_date ON public.availability_slots(date);
CREATE INDEX IF NOT EXISTS idx_availability_slots_status ON public.availability_slots(status);

-- ============================================================================
-- 3. Tabela de transações de carteira (para LaudistaDashboard)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('credit', 'debit')),
  description text,
  reference_id text,
  created_at timestamp WITH TIME ZONE DEFAULT now(),
  updated_at timestamp WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON public.wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions(created_at);

-- ============================================================================
-- 4. Tabela de exames oftalmológicos (para OftalmologistDashboard)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ophthalmology_exams (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES public.profiles(id),
  requested_by uuid NOT NULL REFERENCES public.profiles(id),
  exam_type text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'signed', 'rejected')),
  content text,
  notes text,
  signed_at timestamp WITH TIME ZONE,
  signed_by text,
  created_at timestamp WITH TIME ZONE DEFAULT now(),
  updated_at timestamp WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ophthalmology_exams_assigned_to ON public.ophthalmology_exams(assigned_to);
CREATE INDEX IF NOT EXISTS idx_ophthalmology_exams_status ON public.ophthalmology_exams(status);
CREATE INDEX IF NOT EXISTS idx_ophthalmology_exams_created_at ON public.ophthalmology_exams(created_at);

-- ============================================================================
-- 5. Tabela de relatórios de exames (para SLA)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.exam_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id uuid NOT NULL REFERENCES public.ophthalmology_exams(id) ON DELETE CASCADE,
  assigned_to uuid NOT NULL REFERENCES public.profiles(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'rejected')),
  content text,
  created_at timestamp WITH TIME ZONE DEFAULT now(),
  updated_at timestamp WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exam_reports_assigned_to ON public.exam_reports(assigned_to);
CREATE INDEX IF NOT EXISTS idx_exam_reports_status ON public.exam_reports(status);

-- ============================================================================
-- 6. Tabela de mensagens de consulta (referenciada em VideoRoom.tsx)
-- ============================================================================
-- Verificar se a tabela "messages" já existe; se não, criar:
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id uuid NOT NULL,
  sender_id uuid NOT NULL REFERENCES public.profiles(id),
  message_text text NOT NULL,
  created_at timestamp WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_appointment_id ON public.messages(appointment_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);

-- ============================================================================
-- 7. Atualizar doctor_profiles com campo available_for_on_demand (se não existe)
-- ============================================================================
-- ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS available_for_on_demand boolean DEFAULT false;

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================
-- Execute abaixo no Supabase SQL Editor para verificar:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Se alguma tabela acima estiver faltando, será criada ao executar os CREATE TABLE acima.
