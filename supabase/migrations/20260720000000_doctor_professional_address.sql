-- CFM 2.314/2022 Art. 13 alínea "a": documentos emitidos devem conter o
-- endereço profissional do médico. Adiciona a coluna em doctor_profiles.
ALTER TABLE public.doctor_profiles
  ADD COLUMN IF NOT EXISTS professional_address text;

COMMENT ON COLUMN public.doctor_profiles.professional_address IS
  'Endereço profissional do médico — obrigatório em receitas/atestados (CFM 2.314/2022, Art. 13, a).';
