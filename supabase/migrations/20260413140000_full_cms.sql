-- Full CMS: section registry, media library, version history
-- 1. Section registry: order, enable/disable, per-section config
CREATE TABLE IF NOT EXISTS public.site_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- 2. Media library
CREATE TABLE IF NOT EXISTS public.site_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  path TEXT NOT NULL,
  name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INT,
  width INT,
  height INT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Version history
CREATE TABLE IF NOT EXISTS public.site_sections_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL,
  config JSONB NOT NULL,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  saved_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.site_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_sections_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read sections" ON public.site_sections;
CREATE POLICY "public read sections" ON public.site_sections FOR SELECT USING (true);
DROP POLICY IF EXISTS "admins manage sections" ON public.site_sections;
CREATE POLICY "admins manage sections" ON public.site_sections FOR ALL
  USING (public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

DROP POLICY IF EXISTS "public read media" ON public.site_media;
CREATE POLICY "public read media" ON public.site_media FOR SELECT USING (true);
DROP POLICY IF EXISTS "admins manage media" ON public.site_media;
CREATE POLICY "admins manage media" ON public.site_media FOR ALL
  USING (public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

DROP POLICY IF EXISTS "admins read history" ON public.site_sections_history;
CREATE POLICY "admins read history" ON public.site_sections_history FOR SELECT
  USING (public.has_role(auth.uid(),'admin'::app_role));
DROP POLICY IF EXISTS "admins insert history" ON public.site_sections_history;
CREATE POLICY "admins insert history" ON public.site_sections_history FOR INSERT
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

CREATE OR REPLACE FUNCTION public.fn_site_section_history() RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.config IS DISTINCT FROM NEW.config) THEN
    INSERT INTO public.site_sections_history (section_key, config, saved_by)
    VALUES (OLD.key, OLD.config, NEW.updated_by);
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_site_section_history ON public.site_sections;
CREATE TRIGGER trg_site_section_history
BEFORE UPDATE ON public.site_sections
FOR EACH ROW EXECUTE FUNCTION public.fn_site_section_history();

INSERT INTO storage.buckets (id, name, public) VALUES ('site-media', 'site-media', true) ON CONFLICT DO NOTHING;
DROP POLICY IF EXISTS "public read site-media" ON storage.objects;
CREATE POLICY "public read site-media" ON storage.objects FOR SELECT USING (bucket_id='site-media');
DROP POLICY IF EXISTS "admins write site-media" ON storage.objects;
CREATE POLICY "admins write site-media" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id='site-media' AND public.has_role(auth.uid(),'admin'::app_role));
