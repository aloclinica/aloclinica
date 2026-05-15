
-- 1. Views: SECURITY INVOKER
ALTER VIEW public.payment_gateway_status SET (security_invoker = true);
ALTER VIEW public.security_dashboard SET (security_invoker = true);
ALTER VIEW public.doctor_sla_dashboard SET (security_invoker = true);

-- 2. Drop redundant service_role policies (service_role bypasses RLS)
DROP POLICY IF EXISTS "service role full archive" ON public.activity_logs_archive;
DROP POLICY IF EXISTS "service role full failed_login" ON public.failed_login_attempts;
DROP POLICY IF EXISTS "service role full lgpd export" ON public.lgpd_export_jobs;
DROP POLICY IF EXISTS "service role full" ON public.medical_certificates;
DROP POLICY IF EXISTS "service role full notif log" ON public.notification_log;
DROP POLICY IF EXISTS "service role full templates" ON public.notification_templates;
DROP POLICY IF EXISTS "service role full tx" ON public.payment_transactions;
DROP POLICY IF EXISTS "service role full" ON public.saved_cards;
DROP POLICY IF EXISTS "service role full consent_log" ON public.user_consent_log;

-- 3. notifications: restringir INSERT
DROP POLICY IF EXISTS "System creates notifications" ON public.notifications;
CREATE POLICY "Users insert own notifications or admins"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 4. pingo_card_transactions: bloquear INSERT do cliente (apenas admin/service_role)
DROP POLICY IF EXISTS "System inserts transactions" ON public.pingo_card_transactions;
CREATE POLICY "Admins insert pingo card transactions"
ON public.pingo_card_transactions
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. activity_logs: usuário só insere log com seu próprio user_id (ou admin)
DROP POLICY IF EXISTS "System creates logs" ON public.activity_logs;
CREATE POLICY "Users insert own activity logs"
ON public.activity_logs
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
);
