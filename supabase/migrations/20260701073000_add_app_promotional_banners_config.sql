INSERT INTO public.site_config (key, value, category, label, input_type)
VALUES (
  'app_promotional_banners',
  '[
    {
      "id": "default-telemedicine",
      "title": "Consulta online com seguranca",
      "subtitle": "Encontre especialistas verificados e cuide da saude sem sair de casa.",
      "eyebrow": "Telemedicina",
      "cta_label": "Agendar agora",
      "cta_href": "/dashboard/schedule?role=patient",
      "image_url": "/images/app-promo-telemedicine.png",
      "audience": "patient",
      "placement": "global",
      "enabled": true,
      "priority": 10,
      "theme": "blue"
    },
    {
      "id": "default-doctor-agenda",
      "title": "Agenda inteligente para atender melhor",
      "subtitle": "Acompanhe fila, proximas consultas e performance em tempo real.",
      "eyebrow": "Medicos",
      "cta_label": "Ver agenda",
      "cta_href": "/dashboard/doctor/calendar?role=doctor",
      "image_url": "/images/app-promo-telemedicine.png",
      "audience": "doctor",
      "placement": "global",
      "enabled": true,
      "priority": 9,
      "theme": "emerald"
    }
  ]',
  'apps',
  'Banners promocionais dos apps',
  'json'
)
ON CONFLICT (key) DO UPDATE
SET
  category = EXCLUDED.category,
  label = EXCLUDED.label,
  input_type = EXCLUDED.input_type;
