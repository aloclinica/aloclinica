import { db } from "@/integrations/supabase/untyped";

const OHIF_URL = "http://72.62.138.208:3001";

/**
 * Upload a DICOM file via the orthanc-proxy edge function (keeps credentials server-side).
 * Returns the StudyInstanceUID.
 */
export async function uploadDICOM(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const { data, error } = await db.functions.invoke("orthanc-proxy", {
    body: formData,
  });

  if (error) throw new Error(error.message || "Erro ao enviar DICOM");
  if (!data?.success) throw new Error(data?.error || "Falha no upload DICOM");

  return data.studyInstanceUID ?? data.parentStudy ?? "";
}

/**
 * Generate the OHIF Viewer URL for a given study UID.
 */
export function getOHIFUrl(studyUID: string): string {
  return `${OHIF_URL}/viewer?StudyInstanceUIDs=${studyUID}`;
}
