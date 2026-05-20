import { describe, it, expect, vi, beforeEach } from "vitest";

// Capture all db calls
const invokeCalls: Array<{ name: string; body: any }> = [];
const insertedNotifications: any[] = [];

vi.mock("@/integrations/supabase/untyped", () => {
  const appointment = {
    id: "appt-1",
    scheduled_at: "2030-01-15T14:00:00Z",
    patient_id: "patient-user-1",
    doctor_id: "doctor-profile-1",
    guest_patient_id: null,
  };
  const doctorProfile = { user_id: "doctor-user-1" };
  const profiles: Record<string, any> = {
    "patient-user-1": { first_name: "João", last_name: "Silva", phone: "11999990000", user_id: "patient-user-1" },
    "doctor-user-1":  { first_name: "Ana",  last_name: "Costa", phone: "11888880000", user_id: "doctor-user-1" },
  };

  const makeSingle = (data: any) => ({
    select: () => ({
      eq: () => ({ single: async () => ({ data }) }),
    }),
  });

  const db: any = {
    from: (table: string) => {
      if (table === "appointments")   return makeSingle(appointment);
      if (table === "doctor_profiles") return makeSingle(doctorProfile);
      if (table === "profiles") {
        return {
          select: () => ({
            eq: (_col: string, val: string) => ({ single: async () => ({ data: profiles[val] ?? null }) }),
          }),
        };
      }
      if (table === "notifications") {
        return { insert: async (row: any) => { insertedNotifications.push(row); return { error: null }; } };
      }
      return makeSingle(null);
    },
    functions: {
      invoke: async (name: string, opts: any) => {
        invokeCalls.push({ name, body: opts?.body });
        return { data: null, error: null };
      },
    },
  };
  return { db };
});

vi.mock("@/lib/logger", () => ({ logError: vi.fn() }));

import { notifyAppointmentCancelled } from "@/lib/notifications";

describe("notifyAppointmentCancelled — motivo do cancelamento", () => {
  beforeEach(() => { invokeCalls.length = 0; insertedNotifications.length = 0; });

  it("inclui o motivo no e-mail do paciente", async () => {
    await notifyAppointmentCancelled("appt-1", "Paciente", "Imprevisto de trabalho");
    const emails = invokeCalls.filter(c => c.name === "send-email" && c.body?.type === "appointment_cancelled");
    expect(emails.length).toBeGreaterThanOrEqual(1);
    expect(emails[0].body.data.reason).toBe("Imprevisto de trabalho");
  });

  it("envia e-mail separado para o médico com o motivo", async () => {
    await notifyAppointmentCancelled("appt-1", "Paciente", "Imprevisto de trabalho");
    const doctorEmail = invokeCalls.find(
      c => c.name === "send-email"
        && c.body?.type === "appointment_cancelled"
        && c.body?.data?.recipient_user_id === "doctor-user-1",
    );
    expect(doctorEmail).toBeDefined();
    expect(doctorEmail!.body.data.reason).toBe("Imprevisto de trabalho");
  });

  it("inclui o motivo na notificação in-app do paciente e do médico", async () => {
    await notifyAppointmentCancelled("appt-1", "Paciente", "Imprevisto de trabalho");
    const patientNotif = insertedNotifications.find(n => n.user_id === "patient-user-1");
    const doctorNotif  = insertedNotifications.find(n => n.user_id === "doctor-user-1");
    expect(patientNotif?.message).toMatch(/Motivo: Imprevisto de trabalho/);
    expect(doctorNotif?.message).toMatch(/Motivo: Imprevisto de trabalho/);
  });

  it("inclui o motivo no WhatsApp do paciente e do médico", async () => {
    await notifyAppointmentCancelled("appt-1", "Paciente", "Imprevisto de trabalho");
    const wpps = invokeCalls.filter(c => c.name === "send-whatsapp");
    expect(wpps.length).toBe(2);
    for (const w of wpps) expect(w.body.message).toMatch(/Imprevisto de trabalho/);
  });

  it("não quebra quando o motivo está ausente", async () => {
    await notifyAppointmentCancelled("appt-1", "Paciente");
    const patientNotif = insertedNotifications.find(n => n.user_id === "patient-user-1");
    const doctorNotif  = insertedNotifications.find(n => n.user_id === "doctor-user-1");
    expect(patientNotif?.message).not.toMatch(/Motivo:/);
    expect(doctorNotif?.message).not.toMatch(/Motivo:/);
  });
});
