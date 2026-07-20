-- FASE 2: a nota do medico e recalculada no SERVIDOR (nao pelo cliente-paciente).
-- Antes, RateConsultation.tsx gravava doctor_profiles.rating pelo navegador do
-- paciente -> manipulavel. Agora um trigger recomputa a media/contagem a partir
-- de satisfaction_surveys sempre que uma avaliacao e inserida.

CREATE OR REPLACE FUNCTION public.fn_recompute_doctor_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_avg NUMERIC;
  v_cnt INTEGER;
BEGIN
  SELECT
    AVG( ((s.nps_score::numeric / 10) * 5 + COALESCE(s.quality_score, (s.nps_score::numeric / 10) * 5)) / 2 ),
    COUNT(*)
  INTO v_avg, v_cnt
  FROM public.satisfaction_surveys s
  WHERE s.doctor_id = NEW.doctor_id;

  UPDATE public.doctor_profiles
    SET rating = ROUND(COALESCE(v_avg, 0)::numeric, 1),
        total_reviews = COALESCE(v_cnt, 0)
    WHERE id = NEW.doctor_id;

  RETURN NEW;
END
$function$;

DROP TRIGGER IF EXISTS trg_recompute_doctor_rating ON public.satisfaction_surveys;
CREATE TRIGGER trg_recompute_doctor_rating
  AFTER INSERT ON public.satisfaction_surveys
  FOR EACH ROW EXECUTE FUNCTION public.fn_recompute_doctor_rating();
