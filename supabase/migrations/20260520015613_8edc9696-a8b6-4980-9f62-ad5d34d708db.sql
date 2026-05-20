CREATE UNIQUE INDEX IF NOT EXISTS uniq_appointments_doctor_slot_active
ON public.appointments (doctor_id, scheduled_at)
WHERE status <> 'cancelled';