import { db } from "@/integrations/supabase/untyped";
import { logError } from "@/lib/logger";
import { triggerAppointmentConfirmed } from "@/lib/whatsapp";
import {
  notifyNewAppointment,
  notifyPaymentConfirmed,
  notifyAppointmentCancelled,
  notifyAppointmentRescheduled,
  notifyConsultationCompleted,
} from "@/lib/notifications";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DEFAULT_CONSULTATION_PRICE } from "@/lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BookAppointmentParams {
  patientId: string;
  doctorId: string;
  scheduledAt: Date;
  appointmentType?: string;
  notes?: string;
  priceAtBooking?: number;
  originalAppointmentId?: string;
}

export interface ProcessPaymentParams {
  appointmentId: string;
  doctorProfileId: string;
  patientId: string;
  paymentMethod: "pix" | "card" | "boleto";
  totalPrice: number;
  customerName: string;
  customerCpf: string;
  customerEmail: string;
  customerPhone: string;
  creditCardToken?: string;
}

export interface CancelAppointmentParams {
  appointmentId: string;
  cancelledBy: string;
  cancelledByName: string;
  reason: string;
  isLateCancel?: boolean;
}

export interface RescheduleParams {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  newScheduledAt: Date;
  isWithinReturnWindow: boolean;
  originalDate: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Creates a new appointment in the database.
 * Returns the appointment ID or null on failure.
 */
export const bookAppointment = async (params: BookAppointmentParams): Promise<string | null> => {
  try {
    const { data, error } = await db.from("appointments").insert({
      patient_id: params.patientId,
      doctor_id: params.doctorId,
      scheduled_at: params.scheduledAt.toISOString(),
      status: "scheduled",
      payment_status: "pending",
      appointment_type: params.appointmentType ?? "first_visit",
      notes: params.notes ?? null,
      price_at_booking: params.priceAtBooking ?? DEFAULT_CONSULTATION_PRICE,
      original_appointment_id: params.originalAppointmentId ?? null,
    }).select("id").single();

    if (error || !data) {
      logError("bookAppointment insert failed", error);
      return null;
    }
    return data.id;
  } catch (err) {
    logError("bookAppointment exception", err);
    return null;
  }
};

/**
 * Processes payment via Asaas edge function.
 * Handles PIX QR, boleto URL, and instant card confirmation.
 */
export const processPayment = async (params: ProcessPaymentParams) => {
  const billingTypeMap = { pix: "PIX", card: "CREDIT_CARD", boleto: "BOLETO" } as const;

  const payload: Record<string, any> = {
    customerName: params.customerName,
    customerCpf: params.customerCpf,
    customerEmail: params.customerEmail,
    customerMobilePhone: params.customerPhone,
    billingType: billingTypeMap[params.paymentMethod],
    value: params.totalPrice,
    description: "Consulta Médica - AloClinica",
    appointmentId: params.appointmentId,
    doctorProfileId: params.doctorProfileId,
  };

  if (params.creditCardToken) {
    payload.creditCardToken = params.creditCardToken;
  }

  const { data, error } = await db.functions.invoke("create-asaas-payment", { body: payload });

  if (error || !data?.success) {
    return { success: false, error: data?.error || "Falha no pagamento" };
  }

  return {
    success: true,
    pixQrCode: data.pixQrCode || null,
    pixCopyPaste: data.pixCopyPaste || null,
    boletoUrl: data.bankSlipUrl || data.invoiceUrl || null,
    status: data.status,
    fallbackUsed: data.fallbackUsed || false,
    billingType: data.billingType,
  };
};

/**
 * Called when card payment is instantly confirmed.
 * Updates appointment status and fires all notifications.
 */
export const confirmPaymentInstant = async (
  appointmentId: string,
  doctorProfileId: string,
  patientId: string,
  patientName: string,
  scheduledDate: Date,
  selectedTime: string,
) => {
  try {
    await db.from("appointments").update({
      payment_status: "approved",
      payment_confirmed_at: new Date().toISOString(),
      status: "confirmed",
    }).eq("id", appointmentId);

    // Fire all notifications in parallel
    const dateStr = format(scheduledDate, "dd/MM/yyyy", { locale: ptBR });

    // Get doctor name for WhatsApp
    let doctorDisplayName = "Médico";
    try {
      const { data: docProfile } = await db.from("doctor_profiles").select("user_id").eq("id", doctorProfileId).single();
      if (docProfile) {
        const { data: docP } = await db.from("profiles").select("first_name, last_name").eq("user_id", docProfile.user_id).single();
        if (docP) doctorDisplayName = `${docP.first_name} ${docP.last_name}`;
      }
    } catch {}

    await Promise.allSettled([
      triggerAppointmentConfirmed(appointmentId),
      notifyNewAppointment(appointmentId, doctorProfileId, patientName, dateStr, selectedTime),
      notifyPaymentConfirmed(patientId, "Médico", dateStr),
      sendPaymentConfirmationEmail(appointmentId),
      // WhatsApp: notify patient
      db.functions.invoke("whatsapp-notify", {
        body: {
          tipo: "consulta_agendada",
          user_id: patientId,
          dados: { nome_paciente: patientName, nome_medico: doctorDisplayName, data: dateStr, hora: selectedTime },
        },
      }),
      // WhatsApp: notify doctor
      db.functions.invoke("whatsapp-notify", {
        body: {
          tipo: "nova_consulta",
          user_id: (await db.from("doctor_profiles").select("user_id").eq("id", doctorProfileId).single()).data?.user_id || "",
          dados: { nome_paciente: patientName, data: dateStr, hora: selectedTime },
        },
      }),
    ]);
  } catch (err) {
    logError("confirmPaymentInstant failed", err, { appointmentId });
  }
};

/**
 * Cancel an appointment with proper notifications.
 */
export const cancelAppointment = async (params: CancelAppointmentParams): Promise<boolean> => {
  try {
    const reason = params.isLateCancel
      ? `${params.reason} [cancelamento tardio <2h]`
      : params.reason;

    // Fetch appointment to determine who is cancelling
    const { data: appt } = await db.from("appointments")
      .select("doctor_id, patient_id")
      .eq("id", params.appointmentId)
      .single();

    const { error } = await db.from("appointments").update({
      status: "cancelled",
      cancelled_by: params.cancelledBy,
      cancel_reason: reason,
    }).eq("id", params.appointmentId);

    if (error) return false;

    // Determine refund: only refund if DOCTOR cancels (or admin on behalf of doctor)
    const isDoctorCancel = appt?.doctor_id && (
      params.cancelledBy === appt.doctor_id ||
      // Check if the canceller's user_id matches the doctor's user_id
      params.cancelledBy !== appt.patient_id
    );

    if (isDoctorCancel) {
      // Doctor cancelled — full refund to patient
      db.functions.invoke("process-refund", {
        body: {
          appointmentId: params.appointmentId,
          reason: "Cancelamento pelo médico — reembolso integral",
          refundType: "full",
        },
      }).catch(err => logError("process-refund invocation", err));
    }
    // Patient cancels: NO refund (regardless of timing)

    notifyAppointmentCancelled(params.appointmentId, params.cancelledByName, params.reason)
      .catch(err => logError("notifyAppointmentCancelled", err));

    return true;
  } catch (err) {
    logError("cancelAppointment failed", err);
    return false;
  }
};

/**
 * Reschedule an appointment: cancel old, create new, notify.
 */
export const rescheduleAppointment = async (params: RescheduleParams): Promise<boolean> => {
  try {
    // Cancel old
    await db.from("appointments").update({
      status: "cancelled",
      cancelled_by: params.patientId,
      cancel_reason: "Reagendado pelo paciente",
    }).eq("id", params.appointmentId);

    // Create new
    const { error } = await db.from("appointments").insert({
      patient_id: params.patientId,
      doctor_id: params.doctorId,
      scheduled_at: params.newScheduledAt.toISOString(),
      status: "scheduled",
      appointment_type: params.isWithinReturnWindow ? "return" : "first_visit",
      notes: `Reagendado de ${params.originalDate}`,
      original_appointment_id: params.appointmentId,
    });

    if (error) return false;

    const dateStr = format(params.newScheduledAt, "dd/MM/yyyy", { locale: ptBR });
    const timeStr = format(params.newScheduledAt, "HH:mm");

    notifyAppointmentRescheduled(params.appointmentId, dateStr, timeStr)
      .catch(err => logError("notifyAppointmentRescheduled", err));

    return true;
  } catch (err) {
    logError("rescheduleAppointment failed", err);
    return false;
  }
};

/**
 * Mark appointment as completed and trigger post-consultation flow.
 */
export const completeAppointment = async (appointmentId: string, doctorName: string) => {
  try {
    await db.from("appointments").update({
      status: "completed",
      updated_at: new Date().toISOString(),
    }).eq("id", appointmentId);

    notifyConsultationCompleted(appointmentId, doctorName)
      .catch(err => logError("notifyConsultationCompleted", err));

    // Send post-consultation email with rate link
    sendPostConsultationEmail(appointmentId).catch(() => {});
  } catch (err) {
    logError("completeAppointment failed", err);
  }
};

/**
 * Calculate effective price with optional coupon.
 */
export const calculatePrice = async (
  basePrice: number,
  userId: string,
  couponCode?: string,
): Promise<{ totalPrice: number; cardDiscount: number; couponDiscount: number }> => {
  const cardDiscount = 0;
  let couponDiscount = 0;

  // Check coupon
  if (couponCode) {
    const { data: coupon } = await supabase
      .from("coupons")
      .select("discount_percentage, is_active, max_uses, times_used, expires_at")
      .eq("code", couponCode.toUpperCase())
      .eq("is_active", true)
      .maybeSingle();

    if (coupon) {
      const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
      const isMaxed = coupon.max_uses && coupon.times_used >= coupon.max_uses;
      if (!isExpired && !isMaxed) {
        couponDiscount = Number(coupon.discount_percentage);
      }
    }
  }

  const totalDiscount = Math.min(cardDiscount + couponDiscount, 100);
  const totalPrice = Math.max(basePrice * (1 - totalDiscount / 100), 0);

  return { totalPrice: Math.round(totalPrice * 100) / 100, cardDiscount, couponDiscount };
};

// ─── Internal email helpers ───────────────────────────────────────────────────

const sendPaymentConfirmationEmail = async (appointmentId: string) => {
  try {
    const { data: appt } = await supabase
      .from("appointments")
      .select("patient_id, doctor_id, scheduled_at, price_at_booking")
      .eq("id", appointmentId)
      .single();
    if (!appt?.patient_id) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("user_id", appt.patient_id)
      .single();

    const { data: docProfile } = await supabase
      .from("doctor_profiles")
      .select("user_id")
      .eq("id", appt.doctor_id)
      .single();

    let doctorName = "Médico";
    if (docProfile) {
      const { data: docP } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", docProfile.user_id)
        .single();
      if (docP) doctorName = `Dr(a). ${docP.first_name} ${docP.last_name}`;
    }

    const scheduled = new Date(appt.scheduled_at);
    const dateStr = format(scheduled, "dd/MM/yyyy", { locale: ptBR });
    const timeStr = format(scheduled, "HH:mm");
    const patientName = profile ? `${profile.first_name} ${profile.last_name}` : "Paciente";

    await db.functions.invoke("send-email", {
      body: {
        type: "payment_confirmed",
        to: "resolve-from-user",
        data: {
          patient_name: patientName,
          doctor_name: doctorName,
          date: dateStr,
          time: timeStr,
          amount: appt.price_at_booking?.toString() ?? "",
        },
      },
    });
  } catch (err) {
    logError("sendPaymentConfirmationEmail failed", err);
  }
};

const sendPostConsultationEmail = async (appointmentId: string) => {
  try {
    const { data: appt } = await supabase
      .from("appointments")
      .select("patient_id, doctor_id")
      .eq("id", appointmentId)
      .single();
    if (!appt?.patient_id) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name")
      .eq("user_id", appt.patient_id)
      .single();

    const { data: docProfile } = await supabase
      .from("doctor_profiles")
      .select("user_id")
      .eq("id", appt.doctor_id)
      .single();

    let doctorName = "Médico";
    if (docProfile) {
      const { data: docP } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", docProfile.user_id)
        .single();
      if (docP) doctorName = `Dr(a). ${docP.first_name} ${docP.last_name}`;
    }

    await db.functions.invoke("send-email", {
      body: {
        type: "consultation_completed",
        to: "resolve-from-user",
        data: {
          patient_name: profile?.first_name ?? "Paciente",
          doctor_name: doctorName,
          rate_link: `${window.location.origin}/dashboard/rate/${appointmentId}`,
        },
      },
    });
  } catch (err) {
    logError("sendPostConsultationEmail failed", err);
  }
};
