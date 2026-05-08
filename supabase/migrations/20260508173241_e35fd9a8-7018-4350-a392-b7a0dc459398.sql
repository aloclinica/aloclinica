INSERT INTO public.app_settings (key, value, updated_at)
VALUES 
('wpp_appointment_confirmed', 'true', now()),
('wpp_appointment_reminder_1h', 'true', now()),
('wpp_appointment_reminder_15m', 'true', now()),
('wpp_post_consultation', 'true', now())
ON CONFLICT (key) DO UPDATE SET value = 'true', updated_at = now();