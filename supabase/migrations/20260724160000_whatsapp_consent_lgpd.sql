-- Consentimento/opt-out de WhatsApp (LGPD). Antes, apenas whatsapp-notify respeitava
-- notification_preferences; os demais envios (lembretes, confirmação, receita, etc.)
-- ignoravam qualquer preferência e não havia opt-out de canal. Agora existe uma fonte
-- única de verdade e o lembrete (cron live) já a respeita.
--
-- Modelo opt-out (default permitido): bloqueia se o usuário desligou o CANAL WhatsApp
-- (prefs.channel_whatsapp=false) ou a CATEGORIA (prefs.<categoria>=false). Sem
-- preferências salvas → permitido (mensagens transacionais de serviço).
CREATE OR REPLACE FUNCTION public.fn_whatsapp_allowed(p_user_id uuid, p_category text DEFAULT NULL)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT COALESCE((
    SELECT CASE
      WHEN (np.prefs->>'channel_whatsapp') = 'false' THEN false
      WHEN p_category IS NOT NULL AND (np.prefs->>p_category) = 'false' THEN false
      ELSE true
    END
    FROM public.notification_preferences np WHERE np.user_id = p_user_id
  ), true);
$function$;
GRANT EXECUTE ON FUNCTION public.fn_whatsapp_allowed(uuid, text) TO anon, authenticated, service_role;

-- Lembrete de consulta (cron live */5) passa a respeitar o consentimento de WhatsApp.
-- A notificação in-app continua (canal distinto, filtrado no cliente).
CREATE OR REPLACE FUNCTION public.fn_send_appointment_reminders()
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE a RECORD; phone text; pname text; msg text; rtype text; mins_until int;
BEGIN
  FOR a IN
    SELECT ap.id, ap.patient_id, ap.scheduled_at, ap.jitsi_link,
           EXTRACT(EPOCH FROM (ap.scheduled_at - now()))/60 AS mins
    FROM appointments ap
    WHERE ap.status IN ('scheduled','confirmed')
      AND ap.payment_status IN ('confirmed','approved','received')
      AND ap.patient_id IS NOT NULL
      AND ap.scheduled_at BETWEEN now() AND now() + interval '25 hours'
  LOOP
    mins_until := a.mins::int;
    rtype := CASE
      WHEN mins_until BETWEEN 1380 AND 1500 THEN '24h'
      WHEN mins_until BETWEEN 105 AND 135 THEN '2h'
      WHEN mins_until BETWEEN 10 AND 20 THEN '15min'
      ELSE NULL END;
    IF rtype IS NULL THEN CONTINUE; END IF;
    IF EXISTS (SELECT 1 FROM appointment_reminders_sent WHERE appointment_id = a.id AND reminder_type = rtype) THEN CONTINUE; END IF;

    SELECT p.phone, p.first_name INTO phone, pname FROM profiles p WHERE p.user_id = a.patient_id;
    msg := CASE rtype
      WHEN '24h' THEN '🩺 Lembrete: você tem consulta amanhã às ' || to_char(a.scheduled_at AT TIME ZONE 'America/Sao_Paulo','HH24:MI') || '. Não esqueça!'
      WHEN '2h' THEN '⏰ Sua consulta começa em 2 horas. Acesse: ' || COALESCE(a.jitsi_link,'')
      WHEN '15min' THEN '🚨 Sua consulta começa em 15 min! Entre agora: ' || COALESCE(a.jitsi_link,'')
    END;

    INSERT INTO notifications (user_id,title,message,type,link)
    VALUES (a.patient_id,'Lembrete de consulta', msg, 'reminder','/dashboard/appointments/'||a.id);

    -- LGPD: só envia WhatsApp se o paciente não desligou o canal/categoria.
    IF phone IS NOT NULL AND phone <> '' AND public.fn_whatsapp_allowed(a.patient_id, 'appointment') THEN
      PERFORM public.invoke_edge_function('send-whatsapp',
        jsonb_build_object('phone', phone, 'message', msg));
    END IF;

    INSERT INTO appointment_reminders_sent(appointment_id, reminder_type) VALUES (a.id, rtype);
  END LOOP;
END $function$;
