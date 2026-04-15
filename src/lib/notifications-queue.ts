import { db } from "@/integrations/supabase/untyped";
import { logError } from "@/lib/logger";

// ─── Shared helpers (local to this module) ────────────────────────────────────

const DUTY_LINK = "/dashboard/doctor/on-duty?role=doctor";
const RENEWAL_LINK = "/dashboard/prescription-renewal?role=patient";

const sendPush = (user_id: string, title: string, message: string, link?: string) =>
  db.functions
    .invoke("send-push-notification", { body: { user_id, title, message, link } })
    .catch(err => logError("sendPush (queue) failed", err, { user_id }));

const sendWhatsApp = (phone: string, message: string) =>
  db.functions
    .invoke("send-whatsapp", { body: { phone, message } })
    .catch(err => logError("sendWhatsApp (queue) failed", err));

const sendEmail = (type: string, to: string, data: Record<string, string>) =>
  db.functions
    .invoke("send-email", { body: { type, to, data } })
    .catch(err => logError("sendEmail (queue) failed", err, { type }));

const insertNotification = (
  user_id: string,
  title: string,
  message: string,
  type: string,
  link?: string,
) =>
  db
    .from("notifications")
    .insert({ user_id, title, message, type, link })
    .then(() => {});

// ─── Exported functions ───────────────────────────────────────────────────────

/**
 * Notify ALL on-duty doctors via Push + In-App when a patient joins the urgent care queue.
 * Notifications are sent in parallel for all doctors instead of sequentially.
 */
export const notifyDoctorsNewQueueEntry = async (
  patientName: string,
  shift: string,
  price: number,
) => {
  try {
    const shiftLabels: Record<string, string> = {
      day: "Diurno", night: "Noturno", dawn: "Madrugada",
    };
    const shiftLabel = shiftLabels[shift] ?? shift;
    const priceStr = price.toFixed(2);

    const { data: doctorRoles } = await db
      .from("user_roles")
      .select("user_id")
      .eq("role", "doctor");

    if (!doctorRoles?.length) return;

    // Send all notifications in parallel — avoids sequential loop bottleneck
    await Promise.all(
      doctorRoles.map(dr =>
        Promise.all([
          insertNotification(
            dr.user_id,
            "🚨 Novo paciente no Plantão 24h",
            `${patientName} entrou na fila do plantão ${shiftLabel} (R$ ${priceStr}). Atenda agora!`,
            "urgent",
            DUTY_LINK,
          ),
          sendPush(
            dr.user_id,
            "🚨 Novo paciente no Plantão!",
            `${patientName} está aguardando atendimento (${shiftLabel}). Acesse o painel de plantão.`,
            DUTY_LINK,
          ),
        ])
      )
    );
  } catch (err) {
    logError("notifyDoctorsNewQueueEntry failed", err, { shift });
  }
};

/**
 * Notify patient via Email + WhatsApp + Push + In-App when prescription renewal is approved.
 */
export const notifyRenewalApproved = async (
  patientId: string,
  doctorName: string,
) => {
  try {
    const { data: profile } = await db
      .from("profiles")
      .select("first_name, phone")
      .eq("user_id", patientId)
      .single();

    const patientName = profile?.first_name ?? "Paciente";
    const title = "✅ Receita Renovada!";
    const message = `${doctorName} aprovou a renovação da sua receita. Acesse para baixar.`;

    // All channels in parallel
    await Promise.all([
      sendEmail("renewal_approved", "resolve-from-user", {
        patient_name: patientName,
        doctor_name: doctorName,
      }),
      profile?.phone
        ? sendWhatsApp(profile.phone,
            `✅ *Receita Renovada!*\n\nOlá ${patientName},\n${doctorName} aprovou a renovação da sua receita.\n\nAcesse a plataforma para baixar a nova receita. 💚`)
        : Promise.resolve(),
      insertNotification(patientId, title, message, "prescription", RENEWAL_LINK),
      sendPush(patientId, title, `${doctorName} aprovou sua renovação de receita.`, RENEWAL_LINK),
    ]);
  } catch (err) {
    logError("notifyRenewalApproved failed", err, { patientId });
  }
};

/**
 * Notify patient via WhatsApp + In-App when prescription renewal is rejected.
 */
export const notifyRenewalRejected = async (
  patientId: string,
  doctorName: string,
  reason: string,
) => {
  try {
    const { data: profile } = await db
      .from("profiles")
      .select("first_name, phone")
      .eq("user_id", patientId)
      .single();

    const patientName = profile?.first_name ?? "Paciente";
    const title = "❌ Renovação Não Aprovada";
    const notifMessage = `Sua renovação não foi aprovada. Motivo: ${reason}`;

    await Promise.all([
      profile?.phone
        ? sendWhatsApp(profile.phone,
            `❌ *Renovação Não Aprovada*\n\nOlá ${patientName},\nInfelizmente sua renovação de receita não foi aprovada.\n\n📝 Motivo: ${reason}\n\nRecomendamos agendar uma teleconsulta. 💚`)
        : Promise.resolve(),
      insertNotification(patientId, title, notifMessage, "warning", RENEWAL_LINK),
    ]);
  } catch (err) {
    logError("notifyRenewalRejected failed", err, { patientId });
  }
};
