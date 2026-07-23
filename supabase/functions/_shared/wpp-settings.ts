// Respeita os toggles/templates das automações de WhatsApp salvos em app_settings
// pelo painel admin (AdminWhatsApp). Sem isso, ligar/desligar uma automação e
// editar o texto no painel não tinham efeito nenhum no envio real.
//
// Formato salvo pelo painel:
//   app_settings["wpp_<chave>"]           = "true" | "false"   (liga/desliga)
//   app_settings["wpp_<chave>_template"]  = texto do template  (opcional)

// deno-lint-ignore no-explicit-any
type Sb = any;

/** Retorna se a automação de WhatsApp está ligada (default = ligado se nunca configurada). */
export async function wppAutomationEnabled(sb: Sb, key: string, def = true): Promise<boolean> {
  try {
    const { data } = await sb.from("app_settings").select("value").eq("key", key).maybeSingle();
    if (data?.value === undefined || data?.value === null) return def;
    return String(data.value) === "true";
  } catch {
    return def; // fail-open: nunca deixa a leitura de config derrubar o envio
  }
}

/** Retorna o template custom salvo (ou null pra usar o texto padrão da função). */
export async function wppTemplate(sb: Sb, key: string): Promise<string | null> {
  try {
    const { data } = await sb.from("app_settings").select("value").eq("key", `${key}_template`).maybeSingle();
    return data?.value ? String(data.value) : null;
  } catch {
    return null;
  }
}

/** Substitui {{variavel}} pelos valores do mapa. */
export function renderTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, k) => (vars[k] ?? ""));
}
