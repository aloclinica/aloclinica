-- FASE 4: lembretes de medicacao. O paciente cadastra remedio + horarios e recebe
-- aviso (notificacao/push). Dispatch pelo edge medication-reminder-tick (cron).

CREATE TABLE IF NOT EXISTS public.medication_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_name text NOT NULL,
  dosage text,
  times jsonb NOT NULL DEFAULT '[]'::jsonb,   -- ["08:00","20:00"] (horario local BRT)
  active boolean NOT NULL DEFAULT true,
  last_sent_slot text,                        -- "2026-07-20T08:00" p/ idempotencia diaria
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.medication_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own medication reminders" ON public.medication_reminders;
CREATE POLICY "own medication reminders" ON public.medication_reminders
  FOR ALL TO authenticated
  USING (patient_id = auth.uid())
  WITH CHECK (patient_id = auth.uid());
-- service_role (o tick) bypassa RLS para ler/enviar.

CREATE INDEX IF NOT EXISTS medication_reminders_active_idx
  ON public.medication_reminders (active) WHERE active = true;
