-- Localização opcional no profile do paciente (para painel epidemiológico
-- e distribuição geográfica anonimizada). Coletada no /dashboard/profile.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS city text;

CREATE INDEX IF NOT EXISTS idx_profiles_state ON public.profiles(state) WHERE state IS NOT NULL;

NOTIFY pgrst, 'reload schema';
