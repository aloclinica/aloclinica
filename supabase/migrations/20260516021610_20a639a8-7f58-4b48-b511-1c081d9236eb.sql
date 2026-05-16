
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS original_appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.fn_notify_waitlist()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE wl RECORD; cancelled_date DATE;
BEGIN
  IF NEW.status IN ('cancelled', 'no_show') AND OLD.status NOT IN ('cancelled', 'no_show') THEN
    cancelled_date := (NEW.scheduled_at AT TIME ZONE 'America/Sao_Paulo')::date;
    FOR wl IN
      SELECT id, patient_id FROM public.appointment_waitlist
      WHERE doctor_id = NEW.doctor_id AND desired_date = cancelled_date AND notified = false
      LIMIT 5
    LOOP
      INSERT INTO public.notifications (user_id, title, body, type, action_url)
      VALUES (wl.patient_id, 'Vaga disponível!',
        'Uma vaga abriu para a data que você solicitou. Agende agora!',
        'waitlist',
        '/dashboard/book?doctor=' || NEW.doctor_id || '&date=' || cancelled_date);
      UPDATE public.appointment_waitlist SET notified = true WHERE id = wl.id;
    END LOOP;
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.fn_suggest_reschedule()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status NOT IN ('cancelled','no_show')
     AND NEW.cancelled_by IS NOT NULL
     AND NEW.cancelled_by = NEW.patient_id
     AND NEW.patient_id IS NOT NULL THEN
    PERFORM public.invoke_edge_function('suggest-reschedule',
      jsonb_build_object('appointment_id', NEW.id::text));
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.fn_handle_doctor_no_show()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE appt RECORD; new_doctor_id UUID; new_doctor_user_id UUID;
BEGIN
  FOR appt IN
    SELECT a.id, a.patient_id, a.doctor_id, a.scheduled_at, a.price_at_booking,
           a.payment_status, a.jitsi_link, a.appointment_type, a.notes
    FROM appointments a
    WHERE a.status IN ('confirmed','scheduled')
      AND a.payment_status IN ('confirmed','approved','received')
      AND a.scheduled_at < now() - interval '30 minutes'
      AND a.scheduled_at > now() - interval '3 hours'
      AND NOT EXISTS (
        SELECT 1 FROM activity_logs al
        WHERE al.entity_id = a.id AND al.action = 'doctor_no_show_handled'
      )
  LOOP
    UPDATE appointments
    SET status = 'no_show',
        cancel_reason = 'Médico não compareceu — reagendamento automático em andamento',
        cancelled_by = appt.doctor_id,
        updated_at = now()
    WHERE id = appt.id;

    INSERT INTO activity_logs (action, entity_type, entity_id, user_id, metadata)
    VALUES ('doctor_no_show_handled','appointment', appt.id, appt.patient_id,
      jsonb_build_object('original_doctor_id', appt.doctor_id,'scheduled_at',appt.scheduled_at,'price',appt.price_at_booking));

    SELECT dp.id, dp.user_id INTO new_doctor_id, new_doctor_user_id
    FROM doctor_profiles dp
    WHERE dp.available_now = true AND dp.is_approved = true AND dp.id <> appt.doctor_id
    ORDER BY dp.rating DESC NULLS LAST, random() LIMIT 1;

    IF new_doctor_id IS NOT NULL AND appt.patient_id IS NOT NULL THEN
      INSERT INTO appointments (
        patient_id, doctor_id, scheduled_at, status, payment_status,
        price_at_booking, appointment_type, notes, original_appointment_id
      ) VALUES (
        appt.patient_id, new_doctor_id, now() + interval '5 minutes',
        'confirmed', appt.payment_status,
        appt.price_at_booking, COALESCE(appt.appointment_type,'first_visit'),
        'Reatribuído automaticamente — médico anterior não compareceu',
        appt.id);

      INSERT INTO notifications (user_id, title, body, type, action_url)
      VALUES (appt.patient_id,'🔄 Consulta reatribuída',
        'O médico anterior não compareceu. Outro profissional foi designado para seu atendimento.',
        'urgent','/dashboard/consultation');

      IF new_doctor_user_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, title, body, type, action_url)
        VALUES (new_doctor_user_id,'🚨 Paciente aguardando — reatribuição',
          'Um paciente precisa de atendimento imediato.','urgent','/dashboard/waiting-room');
      END IF;
    ELSE
      IF appt.patient_id IS NOT NULL THEN
        UPDATE appointments
        SET payment_status='refund_pending',
            cancel_reason='Médico não compareceu — reembolso integral em processamento'
        WHERE id = appt.id;

        PERFORM public.invoke_edge_function('process-refund',
          jsonb_build_object('appointment_id', appt.id::text,'reason','doctor_no_show','refund_type','full'));

        INSERT INTO notifications (user_id, title, body, type, action_url)
        VALUES (appt.patient_id,'💸 Reembolso — Médico não compareceu',
          'Infelizmente o médico não compareceu. Seu reembolso integral será processado automaticamente.',
          'payment','/dashboard/appointments');
      END IF;
    END IF;

    INSERT INTO notifications (user_id, title, body, type, action_url)
    SELECT ur.user_id,'⚠️ Médico não compareceu',
      'O médico não compareceu à consulta ' || appt.id || '. Paciente ' ||
      CASE WHEN new_doctor_id IS NOT NULL THEN 'reatribuído.' ELSE 'reembolsado.' END,
      'warning','/dashboard?tab=appointments'
    FROM user_roles ur WHERE ur.role='admin' LIMIT 1;
  END LOOP;
END $$;
