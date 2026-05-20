DROP TRIGGER IF EXISTS trg_auto_assign_on_demand ON public.doctor_profiles;
DROP FUNCTION IF EXISTS public.fn_auto_assign_on_demand() CASCADE;