/**
 * SOAP notes — o prontuário estruturado do médico é gravado em
 * `appointment_notes` (type='soap') como JSON { subjective, objective,
 * assessment, plan }. A tabela `consultation_notes` é legada e nunca é escrita.
 *
 * formatSoapNotes() converte esse JSON num texto legível para o histórico do
 * paciente (aceita também string legada, por segurança).
 */
export interface SOAPNotes {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

const SOAP_LABELS: Array<[keyof SOAPNotes, string]> = [
  ["subjective", "Relato"],
  ["objective", "Exame clínico"],
  ["assessment", "Avaliação"],
  ["plan", "Conduta"],
];

export function formatSoapNotes(content: unknown): string | null {
  if (!content) return null;
  if (typeof content === "string") return content.trim() || null;
  if (typeof content === "object") {
    const n = content as Partial<SOAPNotes>;
    const parts = SOAP_LABELS
      .filter(([k]) => typeof n[k] === "string" && (n[k] as string).trim())
      .map(([k, label]) => `${label}: ${(n[k] as string).trim()}`);
    return parts.length ? parts.join("\n") : null;
  }
  return null;
}
