-- Mercado Pago Marketplace: vincula a conta MP do médico ao perfil dele.
-- O OAuth do MP devolve {access_token, refresh_token, user_id}; guardamos
-- para usar como collector_id em cada pagamento (split automático).

ALTER TABLE public.doctor_profiles
  ADD COLUMN IF NOT EXISTS mp_user_id text,
  ADD COLUMN IF NOT EXISTS mp_access_token text,
  ADD COLUMN IF NOT EXISTS mp_refresh_token text,
  ADD COLUMN IF NOT EXISTS mp_token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS mp_connected_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_doctor_profiles_mp_user_id
  ON public.doctor_profiles(mp_user_id) WHERE mp_user_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';
