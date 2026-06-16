/**
 * Helpers para contratos legais versionados (legal_documents) e
 * registro de aceite por consulta (consultation_consents).
 *
 * Tipos:
 *  - platform_terms     → Termos de Uso (aceito no signup / re-consent)
 *  - telemed_scheduled  → Consulta agendada (aceito antes do pagamento)
 *  - telemed_ondemand   → Pronto-atendimento (aceito antes de entrar na fila)
 *  - telemed_contract   → Consulta via B2B/B2G (aceito quando isContratoMode)
 */
import { db } from "@/integrations/supabase/untyped";

export type LegalKind =
  | "platform_terms"
  | "telemed_scheduled"
  | "telemed_ondemand"
  | "telemed_contract";

export interface LegalDoc {
  id: string;
  kind: LegalKind;
  version: number;
  title: string;
  body_md: string;
  effective_at: string;
}

/** Busca a versão ativa do documento. Cache simples em memória. */
const cache = new Map<LegalKind, { ts: number; doc: LegalDoc | null }>();
const TTL = 60_000;

export async function fetchActiveLegalDoc(kind: LegalKind): Promise<LegalDoc | null> {
  const hit = cache.get(kind);
  if (hit && Date.now() - hit.ts < TTL) return hit.doc;
  const { data, error } = await db
    .from("legal_documents")
    .select("id, kind, version, title, body_md, effective_at")
    .eq("kind", kind)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn("[legal-docs] fetch failed", kind, error.message);
    return null;
  }
  const doc = (data ?? null) as LegalDoc | null;
  cache.set(kind, { ts: Date.now(), doc });
  return doc;
}

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Registra aceite imutável. `appointmentId` é opcional (fila on-demand pode
 * não ter appointment ainda).
 */
export async function recordConsultationConsent(params: {
  userId: string;
  doc: LegalDoc;
  appointmentId?: string | null;
}): Promise<void> {
  const { userId, doc, appointmentId } = params;
  const body_sha256 = await sha256Hex(doc.body_md);
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : null;
  const { error } = await db.from("consultation_consents").insert({
    appointment_id: appointmentId ?? null,
    user_id: userId,
    kind: doc.kind,
    document_id: doc.id,
    document_version: doc.version,
    body_snapshot: doc.body_md,
    body_sha256,
    user_agent: ua,
  });
  if (error) throw error;
}

/** Já aceitou esta versão? Útil para evitar pedir 2x. */
export async function hasAcceptedVersion(
  userId: string,
  kind: LegalKind,
  documentId: string,
): Promise<boolean> {
  const { data } = await db
    .from("consultation_consents")
    .select("id")
    .eq("user_id", userId)
    .eq("kind", kind)
    .eq("document_id", documentId)
    .limit(1)
    .maybeSingle();
  return !!data;
}