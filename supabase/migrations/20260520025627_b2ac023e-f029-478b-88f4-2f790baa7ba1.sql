CREATE TABLE IF NOT EXISTS public.appointment_reminder_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL,
  window_label TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'all',
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (appointment_id, window_label, channel)
);

CREATE INDEX IF NOT EXISTS idx_appt_reminder_log_appt ON public.appointment_reminder_log(appointment_id);

ALTER TABLE public.appointment_reminder_log ENABLE ROW LEVEL SECURITY;

-- Only service role writes/reads; deny all to clients
CREATE POLICY "no client access" ON public.appointment_reminder_log
FOR ALL TO authenticated USING (false) WITH CHECK (false);