-- ============================================================
-- Wave 1 — Studio unificado: site_blocks, versions, themes
-- ============================================================

-- ---------- site_blocks ----------
CREATE TABLE IF NOT EXISTS public.site_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scope TEXT NOT NULL CHECK (scope IN ('section','page','config','theme','email')),
  page_slug TEXT,
  block_key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  parent_id UUID REFERENCES public.site_blocks(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  published JSONB NOT NULL DEFAULT '{}'::jsonb,
  draft JSONB,
  has_draft BOOLEAN NOT NULL DEFAULT false,
  i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_published_at TIMESTAMPTZ,
  last_published_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (scope, page_slug, block_key)
);

GRANT SELECT ON public.site_blocks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_blocks TO authenticated;
GRANT ALL ON public.site_blocks TO service_role;

ALTER TABLE public.site_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_blocks FORCE ROW LEVEL SECURITY;

CREATE POLICY "site_blocks_public_read"
  ON public.site_blocks FOR SELECT
  USING (is_enabled = true);

CREATE POLICY "site_blocks_admin_write"
  ON public.site_blocks FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_site_blocks_scope_slug
  ON public.site_blocks (scope, page_slug, display_order);
CREATE INDEX IF NOT EXISTS idx_site_blocks_has_draft
  ON public.site_blocks (has_draft) WHERE has_draft = true;

-- ---------- site_block_versions (imutável) ----------
CREATE TABLE IF NOT EXISTS public.site_block_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  block_id UUID NOT NULL REFERENCES public.site_blocks(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  locale TEXT,
  snapshot JSONB NOT NULL,
  change_note TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_by UUID,
  UNIQUE (block_id, version)
);

GRANT SELECT, INSERT ON public.site_block_versions TO authenticated;
GRANT ALL ON public.site_block_versions TO service_role;

ALTER TABLE public.site_block_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_block_versions FORCE ROW LEVEL SECURITY;

CREATE POLICY "site_block_versions_admin_read"
  ON public.site_block_versions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "site_block_versions_admin_insert"
  ON public.site_block_versions FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Bloqueia UPDATE/DELETE em versions (imutabilidade)
CREATE OR REPLACE FUNCTION public.block_site_block_versions_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'site_block_versions é imutável';
END;
$$;

CREATE TRIGGER site_block_versions_no_update
  BEFORE UPDATE OR DELETE ON public.site_block_versions
  FOR EACH ROW EXECUTE FUNCTION public.block_site_block_versions_mutation();

CREATE INDEX IF NOT EXISTS idx_site_block_versions_block
  ON public.site_block_versions (block_id, version DESC);

-- ---------- site_themes ----------
CREATE TABLE IF NOT EXISTS public.site_themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tokens JSONB NOT NULL DEFAULT '{}'::jsonb,
  logo_url TEXT,
  favicon_url TEXT,
  og_image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_themes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_themes TO authenticated;
GRANT ALL ON public.site_themes TO service_role;

ALTER TABLE public.site_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_themes FORCE ROW LEVEL SECURITY;

CREATE POLICY "site_themes_public_read_active"
  ON public.site_themes FOR SELECT
  USING (is_active = true);

CREATE POLICY "site_themes_admin_write"
  ON public.site_themes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE UNIQUE INDEX IF NOT EXISTS uq_site_themes_single_active
  ON public.site_themes (is_active) WHERE is_active = true;

-- Tema seed inicial
INSERT INTO public.site_themes (name, is_active, tokens)
SELECT 'Pingo Default', true, jsonb_build_object(
  'primary',   '215 75% 32%',
  'secondary', '168 50% 40%',
  'accent',    '45 90% 55%',
  'radius',    '0.75rem',
  'font_heading', 'Manrope',
  'font_body',    'Inter'
)
WHERE NOT EXISTS (SELECT 1 FROM public.site_themes WHERE is_active = true);

-- ---------- updated_at trigger ----------
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS site_blocks_touch ON public.site_blocks;
CREATE TRIGGER site_blocks_touch
  BEFORE UPDATE ON public.site_blocks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS site_themes_touch ON public.site_themes;
CREATE TRIGGER site_themes_touch
  BEFORE UPDATE ON public.site_themes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------- auditoria automática ----------
CREATE OR REPLACE FUNCTION public.log_site_block_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_action TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN v_action := 'site_block.create';
  ELSIF TG_OP = 'DELETE' THEN v_action := 'site_block.delete';
  ELSE
    IF OLD.published IS DISTINCT FROM NEW.published THEN v_action := 'site_block.publish';
    ELSE v_action := 'site_block.update';
    END IF;
  END IF;

  BEGIN
    INSERT INTO public.activity_logs (user_id, action, resource_type, resource_id, metadata)
    VALUES (
      auth.uid(),
      v_action,
      'site_block',
      COALESCE(NEW.id, OLD.id),
      jsonb_build_object(
        'scope',     COALESCE(NEW.scope, OLD.scope),
        'page_slug', COALESCE(NEW.page_slug, OLD.page_slug),
        'block_key', COALESCE(NEW.block_key, OLD.block_key),
        'has_draft', COALESCE(NEW.has_draft, false)
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- não bloqueia a operação se activity_logs tiver schema diferente
    NULL;
  END;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS site_blocks_audit ON public.site_blocks;
CREATE TRIGGER site_blocks_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.site_blocks
  FOR EACH ROW EXECUTE FUNCTION public.log_site_block_change();

-- ---------- helper: publicar bloco (draft → published + version) ----------
CREATE OR REPLACE FUNCTION public.publish_site_block(
  p_block_id UUID,
  p_change_note TEXT DEFAULT NULL
)
RETURNS public.site_blocks
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_block public.site_blocks;
  v_next_version INTEGER;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT * INTO v_block FROM public.site_blocks WHERE id = p_block_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'block not found'; END IF;
  IF v_block.draft IS NULL OR NOT v_block.has_draft THEN
    RAISE EXCEPTION 'no draft to publish';
  END IF;

  SELECT COALESCE(MAX(version), 0) + 1 INTO v_next_version
    FROM public.site_block_versions WHERE block_id = p_block_id;

  INSERT INTO public.site_block_versions (block_id, version, snapshot, change_note, published_by)
  VALUES (p_block_id, v_next_version, v_block.draft, p_change_note, auth.uid());

  UPDATE public.site_blocks
     SET published = draft,
         draft = NULL,
         has_draft = false,
         last_published_at = now(),
         last_published_by = auth.uid()
   WHERE id = p_block_id
   RETURNING * INTO v_block;

  RETURN v_block;
END;
$$;

GRANT EXECUTE ON FUNCTION public.publish_site_block(UUID, TEXT) TO authenticated;

-- ---------- helper: rollback ----------
CREATE OR REPLACE FUNCTION public.rollback_site_block(p_version_id UUID)
RETURNS public.site_blocks
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_version public.site_block_versions;
  v_block public.site_blocks;
  v_next_version INTEGER;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT * INTO v_version FROM public.site_block_versions WHERE id = p_version_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'version not found'; END IF;

  SELECT COALESCE(MAX(version), 0) + 1 INTO v_next_version
    FROM public.site_block_versions WHERE block_id = v_version.block_id;

  INSERT INTO public.site_block_versions (block_id, version, snapshot, change_note, published_by)
  VALUES (v_version.block_id, v_next_version, v_version.snapshot,
          'rollback para v' || v_version.version, auth.uid());

  UPDATE public.site_blocks
     SET published = v_version.snapshot,
         draft = NULL,
         has_draft = false,
         last_published_at = now(),
         last_published_by = auth.uid()
   WHERE id = v_version.block_id
   RETURNING * INTO v_block;

  RETURN v_block;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rollback_site_block(UUID) TO authenticated;