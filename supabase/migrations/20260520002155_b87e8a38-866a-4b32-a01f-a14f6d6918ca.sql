-- Adiciona o valor cartao_beneficios ao enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cartao_beneficios';