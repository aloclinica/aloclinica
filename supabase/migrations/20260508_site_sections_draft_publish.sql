-- Adiciona modo draft/publicado ao editor de seções do site.
--
-- Comportamento:
--   * config              → versão PUBLICADA (lida pelo site público)
--   * draft_config        → versão em edição (não exibida ao público)
--   * has_draft           → true quando draft_config diverge de config
--   * last_published_at   → timestamp da última publicação
--
-- Migração é segura: tudo é aditivo, valores default preservam comportamento atual.

ALTER TABLE public.site_sections
  ADD COLUMN IF NOT EXISTS draft_config JSONB,
  ADD COLUMN IF NOT EXISTS has_draft BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_published_at TIMESTAMPTZ;

-- Inicializa last_published_at usando updated_at existente (best-effort)
UPDATE public.site_sections
   SET last_published_at = updated_at
 WHERE last_published_at IS NULL;

-- Index parcial para localizar seções com draft pendente
CREATE INDEX IF NOT EXISTS idx_site_sections_has_draft
  ON public.site_sections (has_draft)
  WHERE has_draft = true;

COMMENT ON COLUMN public.site_sections.draft_config IS
  'Versão em edição. NULL quando não há rascunho. Públicos NÃO veem este conteúdo.';
COMMENT ON COLUMN public.site_sections.has_draft IS
  'true quando há draft_config divergente de config aguardando publicação.';
COMMENT ON COLUMN public.site_sections.last_published_at IS
  'Timestamp da última publicação (cópia draft_config → config).';
