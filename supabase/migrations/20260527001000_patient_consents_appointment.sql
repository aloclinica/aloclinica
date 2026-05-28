-- Liga o consentimento TCLE à consulta específica (auditoria CFM 2.314/2022).
-- A tabela patient_consents existia sem appointment_id, o que quebrava o
-- registro de consentimento ao entrar na sala de teleconsulta.
ALTER TABLE public.patient_consents
  ADD COLUMN IF NOT EXISTS appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_patient_consents_appointment
  ON public.patient_consents(appointment_id);
