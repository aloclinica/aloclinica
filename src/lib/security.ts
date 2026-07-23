import { db } from "@/integrations/supabase/untyped";

/**
 * Registra uma tentativa de login que falhou (alimenta o painel de Segurança).
 * Silencioso e à prova de erro — nunca atrapalha o fluxo de login.
 */
export async function reportFailedLogin(email: string, reason = "invalid_credentials"): Promise<void> {
  try {
    if (!email?.trim()) return;
    await db.functions.invoke("log-failed-login", { body: { email: email.trim(), reason } });
  } catch {
    /* silencioso */
  }
}
