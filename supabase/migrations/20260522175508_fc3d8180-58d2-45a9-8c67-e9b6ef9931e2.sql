
DO $$
DECLARE
  v_admin_id uuid;
BEGIN
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'plenasaudebv@gmail.com' LIMIT 1;

  TRUNCATE TABLE
    public.activity_logs,
    public.activity_logs_archive,
    public.aloc_exames,
    public.aloc_laudos,
    public.appointment_reminder_log,
    public.appointment_reminders_sent,
    public.appointment_waitlist,
    public.appointments,
    public.availability_slots,
    public.b2b_leads,
    public.clinic_affiliations,
    public.clinic_profiles,
    public.companies,
    public.company_card_orders,
    public.consultation_notes,
    public.dependents,
    public.doctor_absences,
    public.doctor_care_areas,
    public.doctor_invite_codes,
    public.doctor_payouts,
    public.doctor_profiles,
    public.doctor_signup_invites,
    public.doctor_specialties,
    public.document_verifications,
    public.employee_invites,
    public.exam_reports,
    public.exam_requests,
    public.exames,
    public.failed_login_attempts,
    public.favorite_doctors,
    public.funeral_assistance_requests,
    public.guest_patients,
    public.health_metrics,
    public.kyc_sessions,
    public.kyc_verificacoes,
    public.lgpd_export_jobs,
    public.medical_certificates,
    public.medical_records,
    public.messages,
    public.newsletter_subscribers,
    public.notification_log,
    public.notification_logs,
    public.notifications,
    public.on_demand_queue,
    public.ophthalmology_exams,
    public.ophthalmology_prescriptions,
    public.optical_orders,
    public.optical_production,
    public.optical_stock_movements,
    public.optical_transactions,
    public.partner_profiles,
    public.patient_consents,
    public.patient_documents,
    public.payment_transactions,
    public.pingo_card_benefit_usage,
    public.pingo_card_invoices,
    public.pingo_card_partners,
    public.pingo_card_subscriptions,
    public.pingo_card_transactions,
    public.pingo_ticket_accounts,
    public.pingo_ticket_transactions,
    public.pre_consultation_symptoms,
    public.prescription_renewals,
    public.prescription_signatures,
    public.prescription_validations,
    public.prescriptions,
    public.push_subscriptions,
    public.rate_limits,
    public.refund_requests,
    public.satisfaction_surveys,
    public.saved_cards,
    public.subscriptions,
    public.support_chat_messages,
    public.support_messages,
    public.support_tickets,
    public.sweepstake_tickets,
    public.sweepstake_winners,
    public.sweepstakes,
    public.symptom_diary,
    public.user_consent_log,
    public.user_consents,
    public.user_presence,
    public.video_presence_logs,
    public.wallet_transactions,
    public.withdrawal_requests
  RESTART IDENTITY CASCADE;

  IF v_admin_id IS NOT NULL THEN
    DELETE FROM public.profiles WHERE user_id <> v_admin_id;
    DELETE FROM public.user_roles WHERE user_id <> v_admin_id;
    DELETE FROM auth.users WHERE id <> v_admin_id;
  ELSE
    DELETE FROM public.profiles;
    DELETE FROM public.user_roles;
    DELETE FROM auth.users;
  END IF;
END $$;
