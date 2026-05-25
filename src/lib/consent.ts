/**
 * LGPD consent logger.
 *
 * Insere registros append-only em `public.consent_logs` para garantir prova
 * legal de cada aceite (termos, privacidade, cookies, biometria, TCLE).
 * Falhas são silenciadas para não bloquear o fluxo do usuário.
 */
import { db } from "@/integrations/supabase/untyped";

export type ConsentType =
  | "terms_of_use"
  | "privacy_policy"
  | "lgpd_data_processing"
  | "biometric_kyc"
  | "tcle_telemedicine"
  | "cookies_essential"
  | "cookies_analytics"
  | "cookies_marketing"
  | "cookies_all"
  | "cookies_rejected";

export interface LogConsentInput {
  type: ConsentType;
  accepted?: boolean;
  version?: string;
  documentUrl?: string;
  metadata?: Record<string, unknown>;
  userId?: string | null;
}

const DOC_VERSIONS: Partial<Record<ConsentType, string>> = {
  terms_of_use: "2026-02",
  privacy_policy: "2026-02",
  lgpd_data_processing: "2026-02",
  biometric_kyc: "2026-02",
  tcle_telemedicine: "2026-02",
};

async function getClientIp(): Promise<string | null> {
  try {
    const r = await fetch("https://api.ipify.org?format=json", { cache: "no-store" });
    if (!r.ok) return null;
    const j = await r.json();
    return typeof j?.ip === "string" ? j.ip : null;
  } catch {
    return null;
  }
}

/**
 * Registra um consentimento. Funciona para usuários autenticados (user_id
 * preenchido automaticamente) e para visitantes anônimos no caso de cookies.
 */
export async function logConsent(input: LogConsentInput): Promise<void> {
  try {
    let userId = input.userId;
    if (userId === undefined) {
      const { data } = await db.auth.getUser();
      userId = data?.user?.id ?? null;
    }
    const ip = await getClientIp();
    await db.from("consent_logs").insert({
      user_id: userId,
      consent_type: input.type,
      version: input.version ?? DOC_VERSIONS[input.type] ?? "1.0",
      accepted: input.accepted ?? true,
      document_url: input.documentUrl ?? null,
      ip_address: ip,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      metadata: input.metadata ?? {},
    });
  } catch (e) {
    // Audit best-effort: never block UX on logging failures.
    if (import.meta.env.DEV) console.warn("[consent] log failed", e);
  }
}

/**
 * Bulk: registra múltiplos consentimentos de uma vez (ex.: checklist de cadastro).
 */
export async function logConsents(items: LogConsentInput[]): Promise<void> {
  await Promise.all(items.map(logConsent));
}