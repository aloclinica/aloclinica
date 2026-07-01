-- ============================================================================
-- SECURITY FIX 1: Remove the hardcoded-admin auto-grant trigger.
--
-- Migration 20260215222202_* created public.assign_admin_on_signup(), an
-- AFTER INSERT trigger on auth.users named `on_auth_user_created_assign_admin`.
-- That function grants admin + patient + doctor + clinic roles to ANY user who
-- signs up with the email 'plenasaudebv@gmail.com'. This is a privilege-
-- escalation backdoor: anyone able to register (or spoof) that address gets
-- full platform admin. Role assignment must be explicit/administrative, never
-- derived from a hardcoded email at signup.
--
-- This migration DROPs the trigger and the function safely and idempotently.
-- Existing role rows are intentionally left untouched (removing them is an
-- OPS/data decision, not a schema concern). Reversible only by re-creating the
-- backdoor, which we deliberately do not do.
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created_assign_admin ON auth.users;

DROP FUNCTION IF EXISTS public.assign_admin_on_signup() CASCADE;
