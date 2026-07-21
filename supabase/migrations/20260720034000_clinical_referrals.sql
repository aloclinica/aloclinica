-- FASE 4: encaminhamento clinico estruturado (medico -> especialista).
-- Preenche a lacuna CFM: hoje o "referral" da plataforma e indicacao de marketing,
-- nao um encaminhamento clinico real.

CREATE TABLE IF NOT EXISTS public.clinical_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid,
  doctor_id uuid NOT NULL,                 -- doctor_profiles.id (medico que encaminha)
  patient_id uuid,                         -- profiles.user_id (null p/ convidado)
  patient_name text NOT NULL,
  patient_cpf text,
  specialty text NOT NULL,                 -- especialidade de destino
  reason text NOT NULL,                    -- motivo do encaminhamento
  clinical_summary text,                   -- resumo clinico / dados relevantes
  urgency text NOT NULL DEFAULT 'rotina',  -- rotina | prioritario | urgente
  pdf_url text,
  storage_path text,
  verification_code text,
  status text NOT NULL DEFAULT 'issued',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clinical_referrals ENABLE ROW LEVEL SECURITY;

-- Medico dono do encaminhamento pode criar/ler/editar.
DROP POLICY IF EXISTS "referrals doctor manage" ON public.clinical_referrals;
CREATE POLICY "referrals doctor manage" ON public.clinical_referrals
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.doctor_profiles dp WHERE dp.id = doctor_id AND dp.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.doctor_profiles dp WHERE dp.id = doctor_id AND dp.user_id = auth.uid()));

-- Paciente le os proprios; admin le todos.
DROP POLICY IF EXISTS "referrals patient read" ON public.clinical_referrals;
CREATE POLICY "referrals patient read" ON public.clinical_referrals
  FOR SELECT TO authenticated
  USING (patient_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));
