import { db } from "@/integrations/supabase/untyped";
import { warn } from "@/lib/logger";

export const sendWhatsApp = async (
  phone: string,
  message: string,
  // LGPD: informe o destinatário (userId) e a categoria para respeitar o opt-out
  // de WhatsApp. Sem userId, o envio não passa pela checagem de consentimento.
  opts?: { userId?: string; category?: string },
) => {
  try {
    const { data, error } = await db.functions.invoke("send-whatsapp", {
      body: { phone, message, user_id: opts?.userId, category: opts?.category },
    });
    if (error) {
      warn("WhatsApp send error:", error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    warn("WhatsApp send exception:", err);
    return { success: false, error: err };
  }
};

export const triggerAppointmentConfirmed = async (appointmentId: string) => {
  try {
    const { data, error } = await db.functions.invoke("appointment-confirmed", {
      body: { appointment_id: appointmentId },
    });
    if (error) {
      warn("Appointment confirmed trigger error:", error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    warn("Appointment confirmed exception:", err);
    return { success: false, error: err };
  }
};
