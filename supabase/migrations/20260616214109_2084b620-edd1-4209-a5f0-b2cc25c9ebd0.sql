
WITH pages(slug, name, hero_title, hero_subtitle, body_html) AS (
  VALUES
    ('sobre','Sobre','Quem somos','Saúde de qualidade, acessível e humana.','<p>Conteúdo institucional editável no Studio.</p>'),
    ('para-empresas','Para Empresas','Benefícios corporativos','Telemedicina para times de qualquer tamanho.','<p>Planos, cobertura e diferenciais corporativos.</p>'),
    ('para-profissionais','Para Profissionais','Trabalhe na AloClínica','Atenda pacientes do Brasil inteiro.','<p>Vantagens, requisitos e onboarding.</p>'),
    ('contato','Contato','Fale com a gente','Estamos aqui para ajudar.','<p>Canais oficiais de atendimento.</p>'),
    ('ajuda','Ajuda','Central de Ajuda','Tire suas dúvidas em segundos.','<p>Categorias e artigos da base de conhecimento.</p>'),
    ('recursos','Recursos','Recursos e materiais','Guias, ebooks e atualizações clínicas.','<p>Listagem de materiais.</p>'),
    ('servicos','Serviços','O que oferecemos','Da consulta on-demand ao plano familiar.','<p>Catálogo de serviços.</p>'),
    ('como-funciona','Como Funciona','Como funciona','Em poucos passos você fala com um médico.','<p>Passo a passo do fluxo.</p>'),
    ('seguranca','Segurança','Segurança e privacidade','Seus dados protegidos por criptografia ponta-a-ponta.','<p>Medidas técnicas e organizacionais.</p>'),
    ('lgpd','LGPD','LGPD','Seus direitos como titular de dados.','<p>Como exercer os direitos da LGPD.</p>'),
    ('cookies','Cookies','Política de Cookies','Como usamos cookies neste site.','<p>Categorias de cookies e controles.</p>'),
    ('privacidade','Privacidade','Política de Privacidade','Compromisso com a privacidade do paciente.','<p>Política completa.</p>'),
    ('termos','Termos','Termos de Uso','Regras de uso da plataforma.','<p>Termos detalhados.</p>'),
    ('refund-policy','Política de Reembolso','Reembolso','Quando e como solicitar reembolso.','<p>Regras detalhadas de reembolso.</p>')
)
INSERT INTO public.site_blocks (scope, page_slug, block_key, display_name, display_order, is_enabled, schema, published, last_published_at)
SELECT 'page', slug, 'hero', name || ' — Hero', 0, true,
       jsonb_build_object('fields', jsonb_build_array(
         jsonb_build_object('key','title','label','Título','type','text'),
         jsonb_build_object('key','subtitle','label','Subtítulo','type','textarea')
       )),
       jsonb_build_object('title', hero_title, 'subtitle', hero_subtitle),
       now()
FROM pages
ON CONFLICT (scope, page_slug, block_key) DO NOTHING;

WITH pages(slug, name, body_html) AS (
  VALUES
    ('sobre','Sobre','<p>Conteúdo institucional editável no Studio.</p>'),
    ('para-empresas','Para Empresas','<p>Planos, cobertura e diferenciais corporativos.</p>'),
    ('para-profissionais','Para Profissionais','<p>Vantagens, requisitos e onboarding.</p>'),
    ('contato','Contato','<p>Canais oficiais de atendimento.</p>'),
    ('ajuda','Ajuda','<p>Categorias e artigos da base de conhecimento.</p>'),
    ('recursos','Recursos','<p>Listagem de materiais.</p>'),
    ('servicos','Serviços','<p>Catálogo de serviços.</p>'),
    ('como-funciona','Como Funciona','<p>Passo a passo do fluxo.</p>'),
    ('seguranca','Segurança','<p>Medidas técnicas e organizacionais.</p>'),
    ('lgpd','LGPD','<p>Como exercer os direitos da LGPD.</p>'),
    ('cookies','Cookies','<p>Categorias de cookies e controles.</p>'),
    ('privacidade','Privacidade','<p>Política completa.</p>'),
    ('termos','Termos','<p>Termos detalhados.</p>'),
    ('refund-policy','Política de Reembolso','<p>Regras detalhadas de reembolso.</p>')
)
INSERT INTO public.site_blocks (scope, page_slug, block_key, display_name, display_order, is_enabled, schema, published, last_published_at)
SELECT 'page', slug, 'body', name || ' — Corpo', 1, true,
       jsonb_build_object('fields', jsonb_build_array(
         jsonb_build_object('key','html','label','Conteúdo','type','richtext')
       )),
       jsonb_build_object('html', body_html),
       now()
FROM pages
ON CONFLICT (scope, page_slug, block_key) DO NOTHING;

INSERT INTO public.site_blocks (scope, page_slug, block_key, display_name, display_order, is_enabled, schema, published, last_published_at)
SELECT 'theme', NULL, 'default', 'Tema Principal', 0, true,
       jsonb_build_object('fields', jsonb_build_array(
         jsonb_build_object('key','primary','label','Cor primária (HSL)','type','text','placeholder','215 75% 32%'),
         jsonb_build_object('key','secondary','label','Cor secundária (HSL)','type','text','placeholder','168 50% 40%'),
         jsonb_build_object('key','logo_url','label','Logo URL','type','image'),
         jsonb_build_object('key','favicon_url','label','Favicon URL','type','image')
       )),
       jsonb_build_object('primary','215 75% 32%','secondary','168 50% 40%','logo_url','','favicon_url',''),
       now()
WHERE NOT EXISTS (SELECT 1 FROM public.site_blocks WHERE scope='theme' AND block_key='default');
