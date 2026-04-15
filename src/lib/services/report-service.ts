import { db } from "@/integrations/supabase/untyped";
import { logError } from "@/lib/logger";
import { notifyExamReportReady, notifyDocumentUploaded } from "@/lib/notifications";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SignReportParams {
  examRequestId: string;
  reporterName: string;
  examType: string;
  verificationCode: string;
  patientId?: string;
  patientName?: string;
  requestingDoctorId?: string;
  requestingClinicId?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Called after an exam report is signed.
 * Sends email, WhatsApp, in-app notifications to all stakeholders.
 */
export const notifyReportSigned = async (params: SignReportParams) => {
  try {
    // 1. Use existing notification function for WhatsApp + in-app
    await notifyExamReportReady(
      params.examRequestId,
      params.reporterName,
      params.examType,
      params.verificationCode,
    );

    // 2. Send email to patient with report link
    if (params.patientId) {
      await sendReportReadyEmail(
        params.patientId,
        params.reporterName,
        params.examType,
        params.verificationCode,
      );
    }
  } catch (err) {
    logError("notifyReportSigned failed", err, { examRequestId: params.examRequestId });
  }
};

/**
 * Send email notification when exam report is ready.
 */
const sendReportReadyEmail = async (
  patientId: string,
  doctorName: string,
  examType: string,
  verificationCode: string,
) => {
  try {
    const { data: profile } = await db
      .from("profiles")
      .select("first_name, last_name")
      .eq("user_id", patientId)
      .single();

    const patientName = profile
      ? `${profile.first_name} ${profile.last_name}`
      : "Paciente";

    await db.functions.invoke("send-email", {
      body: {
        type: "exam_report_ready",
        to: "resolve-from-user",
        data: {
          patient_name: patientName,
          doctor_name: doctorName,
          exam_type: examType,
          verification_code: verificationCode,
          download_link: `${window.location.origin}/dashboard/health`,
          validate_link: `${window.location.origin}/validar/${verificationCode}`,
        },
      },
    });
  } catch (err) {
    logError("sendReportReadyEmail failed", err);
  }
};

/**
 * Upload a document and notify the patient.
 */
export const uploadDocumentAndNotify = async (
  file: File,
  patientId: string,
  doctorName: string,
  description?: string,
): Promise<{ success: boolean; path?: string }> => {
  try {
    const filePath = `documents/${patientId}/${crypto.randomUUID()}_${file.name}`;
    const { error: uploadError } = await db.storage
      .from("prescriptions")
      .upload(filePath, file);

    if (uploadError) {
      logError("uploadDocumentAndNotify upload failed", uploadError);
      return { success: false };
    }

    // Notify patient
    notifyDocumentUploaded(patientId, doctorName, file.name, description)
      .catch(err => logError("notifyDocumentUploaded", err));

    return { success: true, path: filePath };
  } catch (err) {
    logError("uploadDocumentAndNotify failed", err);
    return { success: false };
  }
};

/**
 * Generate a shareable temporary link for a report PDF.
 * Link expires after the specified duration.
 */
export const generateShareableLink = async (
  pdfPath: string,
  expiresInSeconds = 7 * 24 * 60 * 60, // 7 days default
): Promise<string | null> => {
  try {
    const { data } = await db.storage
      .from("prescriptions")
      .createSignedUrl(pdfPath, expiresInSeconds);
    return data?.signedUrl ?? null;
  } catch (err) {
    logError("generateShareableLink failed", err);
    return null;
  }
};
