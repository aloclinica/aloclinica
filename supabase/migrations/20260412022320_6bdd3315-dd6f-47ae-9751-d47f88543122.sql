-- Remove unnecessary roles from admin account, keeping only 'admin'
DELETE FROM public.user_roles 
WHERE user_id = 'a5c1ac9a-5368-4429-83a0-85e2b3d4a353' 
AND role != 'admin';