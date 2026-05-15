
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_patient
  ON public.appointments (doctor_id, patient_id);

CREATE INDEX IF NOT EXISTS idx_appointments_patient_status
  ON public.appointments (patient_id, status);

CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_status
  ON public.appointments (scheduled_at, status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_health_metrics_patient
  ON public.health_metrics (patient_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_role
  ON public.user_roles (user_id, role);
