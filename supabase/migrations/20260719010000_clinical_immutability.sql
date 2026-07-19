-- =====================================================================
-- Imutabilidade de registros clínicos (CFM): bloqueia DELETE via app.
-- Política RESTRICTIVE afeta o role `authenticated` (médicos/pacientes).
-- `service_role` (backend/admin) continua podendo corrigir dados legítimos,
-- pois bypassa RLS. Idempotente; só cria para tabelas que existem.
-- =====================================================================
DO $$
DECLARE
  t text;
  clinical_tables text[] := ARRAY[
    'medical_records','consultation_notes','prescriptions','clinical_anamnesis',
    'exam_reports','aloc_exames','aloc_laudos','ophthalmology_exams',
    'ophthalmology_prescriptions','consultation_recordings','vaccination_records',
    'medical_certificates'
  ];
BEGIN
  FOREACH t IN ARRAY clinical_tables LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_no_delete', t);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated USING (false)',
        t || '_no_delete', t
      );
    END IF;
  END LOOP;
END $$;

-- Nota: imutabilidade de UPDATE de conteúdo pós-lançamento e retenção de 20
-- anos (CFM 1.821/2007) exigem trigger/arquivamento adicional (trabalho futuro).
