-- Consistência de segurança/descoberta: os RPCs públicos de médico (perfil, slug,
-- busca por nome) gateavam só por is_approved. Um médico DESATIVADO (is_active=false)
-- continuava alcançável por link direto / slug / busca e, portanto, agendável.
-- Agora todos exigem is_active = true, alinhados à busca principal (DoctorSearch),
-- para que um médico desativado suma de TODOS os caminhos de descoberta.
CREATE OR REPLACE FUNCTION public.get_public_doctor_profile(p_doctor_id uuid)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', dp.id, 'slug', dp.slug, 'bio', dp.bio, 'price', dp.price,
    'return_price', dp.return_price, 'consultation_duration', dp.consultation_duration,
    'professional_photo_url', dp.professional_photo_url, 'rating_avg', dp.rating_avg,
    'rating_count', dp.rating_count, 'crm', dp.crm, 'crm_state', dp.crm_state,
    'crm_verified', dp.crm_verified, 'areas_of_expertise', dp.areas_of_expertise,
    'first_name', p.first_name, 'last_name', p.last_name, 'avatar_url', p.avatar_url
  ) INTO result
  FROM doctor_profiles dp JOIN profiles p ON p.user_id = dp.user_id
  WHERE dp.id = p_doctor_id AND dp.is_approved = true AND dp.is_active = true;
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.resolve_doctor_slug(p_slug text)
 RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT id FROM doctor_profiles WHERE slug = p_slug AND is_approved = true AND is_active = true LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.search_doctor_by_name(p_query text)
 RETURNS SETOF jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'id', dp.id, 'slug', dp.slug, 'price', dp.price,
    'first_name', p.first_name, 'last_name', p.last_name,
    'avatar_url', p.avatar_url, 'crm_verified', dp.crm_verified
  )
  FROM doctor_profiles dp JOIN profiles p ON p.user_id = dp.user_id
  WHERE dp.is_approved = true AND dp.is_active = true
    AND (p.first_name ILIKE '%' || p_query || '%' OR p.last_name ILIKE '%' || p_query || '%')
  LIMIT 20;
$function$;
