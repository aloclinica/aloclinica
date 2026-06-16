-- Wave 2 — Seed inicial de site_blocks a partir das tabelas legadas

-- Importa site_sections como blocos scope='section'
INSERT INTO public.site_blocks (scope, page_slug, block_key, display_name, display_order, is_enabled, schema, published)
SELECT
  'section',
  'home',
  key,
  COALESCE(display_name, key),
  COALESCE(display_order, 0),
  COALESCE(is_enabled, true),
  COALESCE(schema, '{}'::jsonb),
  COALESCE(config, '{}'::jsonb)
FROM public.site_sections
ON CONFLICT (scope, page_slug, block_key) DO NOTHING;

-- Importa site_config como blocos scope='config' (1 bloco "global" agrupando todos)
INSERT INTO public.site_blocks (scope, page_slug, block_key, display_name, display_order, is_enabled, schema, published)
SELECT
  'config',
  NULL,
  'global',
  'Configurações Globais',
  0,
  true,
  '{}'::jsonb,
  COALESCE(jsonb_object_agg(key, value), '{}'::jsonb)
FROM public.site_config
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_blocks WHERE scope='config' AND block_key='global'
);

-- Marca os blocos importados como já publicados
UPDATE public.site_blocks
   SET last_published_at = COALESCE(last_published_at, now())
 WHERE last_published_at IS NULL;