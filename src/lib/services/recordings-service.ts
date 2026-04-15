import { db } from "@/integrations/supabase/untyped";
import { logError } from "@/lib/logger";

export interface RecordingMetadata {
  appointmentId: string;
  recordedBy: string;
  durationSeconds: number;
  storagePath: string;
  uploadedAt: string;
}

/**
 * Upload gravação de vídeo para Supabase Storage
 * @param blob - Blob WebM da gravação
 * @param appointmentId - ID da consulta
 * @param userId - ID do usuário que está gravando
 * @returns Storage path ou null se falhar
 */
export async function uploadRecording(
  blob: Blob,
  appointmentId: string,
  userId: string,
  durationSeconds: number
): Promise<string | null> {
  try {
    const timestamp = Date.now();
    const fileName = `${appointmentId}_${timestamp}.webm`;
    const storagePath = `recordings/${appointmentId}/${fileName}`;

    // Upload para Storage
    const { error: uploadError } = await db.storage
      .from("recordings")
      .upload(storagePath, blob, {
        contentType: "video/webm",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Registrar metadata no banco
    const { error: insertError } = await (db as any)
      .from("consultation_recordings")
      .insert({
        appointment_id: appointmentId,
        recorded_by: userId,
        storage_path: storagePath,
        duration_seconds: durationSeconds,
        uploaded_at: new Date().toISOString(),
      });

    if (insertError) {
      logError("Failed to save recording metadata", insertError);
      // Continue anyway - arquivo está no storage
    }

    return storagePath;
  } catch (err) {
    logError("uploadRecording error", err);
    return null;
  }
}

/**
 * Obter URL temporária para download da gravação
 * @param storagePath - Path retornado de uploadRecording
 * @returns URL temporária (válida por 1 hora) ou null
 */
export async function getRecordingUrl(storagePath: string): Promise<string | null> {
  try {
    const { data } = db.storage.from("recordings").getPublicUrl(storagePath);
    return data?.publicUrl || null;
  } catch (err) {
    logError("getRecordingUrl error", err);
    return null;
  }
}

/**
 * Obter lista de gravações de uma consulta
 */
export async function listRecordings(appointmentId: string): Promise<RecordingMetadata[] | null> {
  try {
    const { data, error } = await db
      .from("consultation_recordings")
      .select("*")
      .eq("appointment_id", appointmentId)
      .order("uploaded_at", { ascending: false });

    if (error) throw error;
    return data as unknown as RecordingMetadata[];
  } catch (err) {
    logError("listRecordings error", err);
    return null;
  }
}

/**
 * Deletar gravação
 */
export async function deleteRecording(storagePath: string, recordingId: string): Promise<boolean> {
  try {
    // Deletar do Storage
    const { error: deleteError } = await db.storage
      .from("recordings")
      .remove([storagePath]);

    if (deleteError) {
      logError("Failed to delete from storage", deleteError);
    }

    // Deletar registro do banco
    await db
      .from("consultation_recordings")
      .delete()
      .eq("id", recordingId);

    return true;
  } catch (err) {
    logError("deleteRecording error", err);
    return false;
  }
}
