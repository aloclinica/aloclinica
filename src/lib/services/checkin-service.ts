import { db } from "@/integrations/supabase/untyped";
import { logError } from "@/lib/logger";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CheckinResult {
  success: boolean;
  message: string;
  appointmentId?: string;
}

export interface AppointmentCheckinStatus {
  id: string;
  checkedIn: boolean;
  checkedInAt: string | null;
  scheduledAt: string;
  doctorName: string;
  canCheckIn: boolean;
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Digital check-in for a patient. Validates the appointment exists,
 * belongs to the patient, is within the 1h check-in window, and
 * marks it as checked in.
 */
export const performCheckin = async (
  appointmentId: string,
  patientId: string,
): Promise<CheckinResult> => {
  try {
    const { data: appt, error } = await supabase
      .from("appointments")
      .select("id, patient_id, scheduled_at, status, notes")
      .eq("id", appointmentId)
      .single();

    if (error || !appt) {
      return { success: false, message: "Consulta não encontrada." };
    }

    if (appt.patient_id !== patientId) {
      return { success: false, message: "Esta consulta não pertence a você." };
    }

    if (!["scheduled", "confirmed"].includes(appt.status)) {
      return { success: false, message: `Consulta com status "${appt.status}" não permite check-in.` };
    }

    // Check-in window: 1h before to 15min after
    const scheduled = new Date(appt.scheduled_at);
    const now = new Date();
    const diffMin = (scheduled.getTime() - now.getTime()) / 60_000;

    if (diffMin > 60) {
      return { success: false, message: "O check-in abre 1 hora antes da consulta." };
    }
    if (diffMin < -15) {
      return { success: false, message: "O prazo para check-in expirou." };
    }

    // Already checked in?
    if (appt.notes?.includes("[CHECKIN:")) {
      return { success: true, message: "Você já fez check-in nesta consulta.", appointmentId };
    }

    // Mark check-in in notes and update status
    const checkinNote = `[CHECKIN:${new Date().toISOString()}]`;
    const updatedNotes = appt.notes ? `${appt.notes}\n${checkinNote}` : checkinNote;

    await db.from("appointments").update({
      notes: updatedNotes,
      status: "confirmed",
    }).eq("id", appointmentId);

    // Notify doctor about patient check-in
    const { data: docProfile } = await supabase
      .from("doctor_profiles")
      .select("user_id")
      .eq("id", (await db.from("appointments").select("doctor_id").eq("id", appointmentId).single()).data?.doctor_id ?? "")
      .single();

    if (docProfile?.user_id) {
      const { data: patientProfile } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("user_id", patientId)
        .single();

      await db.from("notifications").insert({
        user_id: docProfile.user_id,
        title: "✅ Paciente fez check-in",
        message: `${patientProfile?.first_name || "Paciente"} confirmou presença para a consulta.`,
        type: "appointment",
        link: `/dashboard/consultation/${appointmentId}`,
      });
    }

    return { success: true, message: "Check-in realizado com sucesso!", appointmentId };
  } catch (err) {
    logError("performCheckin failed", err);
    return { success: false, message: "Erro ao realizar check-in. Tente novamente." };
  }
};

/**
 * Get check-in status for upcoming appointments of a patient.
 */
export const getUpcomingCheckins = async (patientId: string): Promise<AppointmentCheckinStatus[]> => {
  try {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60_000);

    const { data: appointments } = await supabase
      .from("appointments")
      .select("id, scheduled_at, status, notes, doctor_id")
      .eq("patient_id", patientId)
      .in("status", ["scheduled", "confirmed"])
      .gte("scheduled_at", new Date(now.getTime() - 15 * 60_000).toISOString())
      .lte("scheduled_at", new Date(now.getTime() + 24 * 60 * 60_000).toISOString())
      .order("scheduled_at", { ascending: true });

    if (!appointments?.length) return [];

    const doctorIds = [...new Set(appointments.map(a => a.doctor_id))];
    const { data: doctorProfiles } = await supabase
      .from("doctor_profiles")
      .select("id, user_id")
      .in("id", doctorIds);

    const docUserIds = doctorProfiles?.map(d => d.user_id) ?? [];
    const { data: profiles } = docUserIds.length
      ? await db.from("profiles").select("user_id, first_name, last_name").in("user_id", docUserIds)
      : { data: [] };

    const nameMap = new Map<string, string>();
    doctorProfiles?.forEach(d => {
      const p = profiles?.find(pr => pr.user_id === d.user_id);
      if (p) nameMap.set(d.id, `Dr(a). ${p.first_name} ${p.last_name}`);
    });

    return appointments.map(appt => {
      const scheduled = new Date(appt.scheduled_at);
      const diffMin = (scheduled.getTime() - now.getTime()) / 60_000;
      const checkedIn = appt.notes?.includes("[CHECKIN:") ?? false;
      const checkinMatch = appt.notes?.match(/\[CHECKIN:(.+?)\]/);

      return {
        id: appt.id,
        checkedIn,
        checkedInAt: checkinMatch ? checkinMatch[1] : null,
        scheduledAt: appt.scheduled_at,
        doctorName: nameMap.get(appt.doctor_id) ?? "Médico",
        canCheckIn: !checkedIn && diffMin <= 60 && diffMin >= -15,
      };
    });
  } catch (err) {
    logError("getUpcomingCheckins failed", err);
    return [];
  }
};

/**
 * Generate a check-in token (QR code data) for an appointment.
 * The QR simply encodes the appointment ID + patient ID for scanning.
 */
export const generateCheckinQRData = (appointmentId: string, patientId: string): string => {
  return JSON.stringify({
    type: "aloclinica_checkin",
    appointmentId,
    patientId,
    ts: Date.now(),
  });
};
