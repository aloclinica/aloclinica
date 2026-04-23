UPDATE site_sections 
SET config = jsonb_set(config, '{logo_url}', 'null') 
WHERE key = 'header';