-- AloClinica production readiness checks.
-- Read-only SQL. Run in Supabase SQL editor or through Management API.

-- 1) Critical tables must have RLS enabled and at least one policy.
SELECT
  t.tablename,
  t.rowsecurity,
  COUNT(p.policyname) AS policy_count
FROM pg_tables t
LEFT JOIN pg_policies p
  ON p.schemaname = t.schemaname
 AND p.tablename = t.tablename
WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'profiles',
    'user_roles',
    'doctor_profiles',
    'appointments',
    'messages',
    'prescriptions',
    'medical_records',
    'payment_transactions',
    'subscriptions',
    'saved_cards',
    'kyc_verificacoes',
    'lgpd_access_log'
  )
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;

-- 2) Cron status and last result.
SELECT
  j.jobid,
  j.jobname,
  j.schedule,
  j.active,
  d.last_finish,
  d.last_status
FROM cron.job j
LEFT JOIN LATERAL (
  SELECT
    MAX(end_time)::text AS last_finish,
    (array_agg(status ORDER BY end_time DESC NULLS LAST))[1] AS last_status
  FROM cron.job_run_details
  WHERE jobid = j.jobid
) d ON true
ORDER BY j.jobid;

-- 3) Appointment queue and active consultation pressure.
SELECT
  status,
  COUNT(*) AS total
FROM public.appointments
WHERE scheduled_at > now() - interval '24 hours'
GROUP BY status
ORDER BY total DESC;

-- 4) Doctor readiness.
SELECT
  COUNT(*) AS total_doctors,
  COUNT(*) FILTER (WHERE is_approved IS TRUE) AS approved,
  COUNT(*) FILTER (WHERE crm_verified IS TRUE) AS crm_verified,
  COUNT(*) FILTER (WHERE is_active IS TRUE) AS active
FROM public.doctor_profiles;

-- 5) Duplicate active slot protection should exist.
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'appointments'
  AND indexdef ILIKE '%doctor_id%'
  AND indexdef ILIKE '%scheduled_at%';

-- 6) Large tables that need retention/partition decisions.
SELECT
  relname AS table_name,
  n_live_tup AS estimated_rows,
  n_dead_tup AS estimated_dead_rows,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC
LIMIT 20;

-- 7) Storage buckets.
SELECT id, name, public, file_size_limit
FROM storage.buckets
ORDER BY name;
