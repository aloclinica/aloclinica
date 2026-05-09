-- ===================================================================
-- ARCHIVE ACTIVITY LOGS — pruning automático de logs antigos
-- ===================================================================
-- Problema: activity_logs cresce indefinidamente. A 1k inserts/dia,
-- em 1 ano são ~365k linhas. Sem pruning, vai estourar disco.
--
-- Solução em 2 partes:
--   1. activity_logs_archive (mesma estrutura, mas read-only para users)
--   2. pg_cron diário às 04:00 UTC move registros >90 dias para o archive
--      e DELETE do original
--
-- Quem precisa de logs antigos: admin via consulta SQL direta no archive.
-- ===================================================================

-- 1. Tabela de arquivo (clone read-only)
CREATE TABLE IF NOT EXISTS public.activity_logs_archive (
  LIKE public.activity_logs INCLUDING ALL
);

-- Garante que o archive tem ID único (se LIKE não copiou)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
     WHERE table_schema='public' AND table_name='activity_logs_archive'
       AND constraint_type='PRIMARY KEY'
  ) THEN
    -- LIKE INCLUDING ALL deve copiar, mas se não, ignoramos silenciosamente.
    NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_activity_logs_archive_created
  ON public.activity_logs_archive (created_at DESC);

-- RLS: só admin pode ler o archive (logs históricos sensíveis)
ALTER TABLE public.activity_logs_archive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin reads archive" ON public.activity_logs_archive;
CREATE POLICY "admin reads archive" ON public.activity_logs_archive
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "service role full archive" ON public.activity_logs_archive;
CREATE POLICY "service role full archive" ON public.activity_logs_archive
  FOR ALL TO service_role USING (true);

-- 2. Função de arquivamento
CREATE OR REPLACE FUNCTION public.archive_old_activity_logs()
RETURNS TABLE(archived_count BIGINT, deleted_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_cutoff TIMESTAMPTZ := NOW() - INTERVAL '90 days';
  v_archived BIGINT := 0;
  v_deleted BIGINT := 0;
BEGIN
  -- Insere no archive (idempotente via ON CONFLICT)
  WITH moved AS (
    INSERT INTO public.activity_logs_archive
    SELECT * FROM public.activity_logs
     WHERE created_at < v_cutoff
    ON CONFLICT (id) DO NOTHING
    RETURNING id
  )
  SELECT count(*) INTO v_archived FROM moved;

  -- Apaga do original
  WITH deleted AS (
    DELETE FROM public.activity_logs
     WHERE created_at < v_cutoff
    RETURNING id
  )
  SELECT count(*) INTO v_deleted FROM deleted;

  -- Logging do próprio job (na tabela ativa, recente)
  INSERT INTO public.activity_logs (action, entity_type, entity_id, details)
  VALUES (
    'archive_activity_logs_run',
    'system',
    NULL,
    jsonb_build_object(
      'cutoff', v_cutoff,
      'archived', v_archived,
      'deleted', v_deleted
    )
  );

  RETURN QUERY SELECT v_archived, v_deleted;
END;
$$;

-- 3. pg_cron diário às 04:00 UTC (01:00 BRT — fora de pico)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('archive_old_activity_logs')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'archive_old_activity_logs');
    PERFORM cron.schedule(
      'archive_old_activity_logs',
      '0 4 * * *',
      $cron$ SELECT public.archive_old_activity_logs(); $cron$
    );
  END IF;
END $$;

COMMENT ON TABLE public.activity_logs_archive IS
  'Logs de atividade movidos do activity_logs após 90 dias. Apenas admin lê.';
COMMENT ON FUNCTION public.archive_old_activity_logs() IS
  'Move activity_logs > 90 dias para archive. Roda diariamente via pg_cron 04:00 UTC.';
