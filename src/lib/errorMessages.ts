/**
 * Mensagens de erro contextuais.
 *
 * Em vez de toast.error("Erro"), use:
 *   toast.error(...explainError(error, "agendamento"))
 *
 * Mapeia códigos/strings comuns → mensagem útil pro usuário leigo.
 */

type Context =
  | "agendamento"
  | "pagamento"
  | "kyc"
  | "login"
  | "signup"
  | "consulta"
  | "prescricao"
  | "geral";

type ExplainedError = {
  title: string;
  description: string;
  action?: string;
};

const PATTERNS: Array<{
  match: RegExp | string[];
  context?: Context[];
  result: ExplainedError;
}> = [
  // Conflitos de agendamento
  { match: /already.*booked|slot.*taken|horário.*indisponível|conflict/i,
    context: ["agendamento"],
    result: { title: "Esse horário acabou de ser ocupado",
              description: "Por favor, escolha outro horário disponível.",
              action: "Atualizar lista" } },

  // Pagamento — cartão
  { match: /card.*declined|insufficient_funds|cartão.*recusado/i,
    context: ["pagamento"],
    result: { title: "Cartão recusado",
              description: "Verifique o número, validade e CVV — ou tente outro método.",
              action: "Trocar pagamento" } },

  { match: /expired_card|cartão.*vencido/i,
    context: ["pagamento"],
    result: { title: "Cartão vencido",
              description: "A validade do cartão já passou. Use outro cartão." } },

  { match: /invalid_card|cartão.*inválido/i,
    context: ["pagamento"],
    result: { title: "Dados do cartão inválidos",
              description: "Confira o número e os dados do titular." } },

  // PagBank específico
  { match: /whitelist.*required|whitelist_unauthorized|access_denied/i,
    context: ["pagamento"],
    result: { title: "Pagamento temporariamente indisponível",
              description: "Estamos resolvendo um problema com a operadora. Tente em alguns minutos.",
              action: "Tentar de novo" } },

  // PIX
  { match: /pix.*expired|pix.*expirou/i,
    context: ["pagamento"],
    result: { title: "PIX expirou",
              description: "O QR Code tem validade de 30 minutos. Gere um novo." } },

  // KYC
  { match: /low.*similarity|score.*<.*\d+/i,
    context: ["kyc"],
    result: { title: "Selfie não bateu com o documento",
              description: "Tire a foto em local claro, sem máscara ou óculos escuros." } },

  { match: /no.*face.*detected/i,
    context: ["kyc"],
    result: { title: "Não conseguimos ver seu rosto",
              description: "Centralize seu rosto na câmera, com boa iluminação." } },

  { match: /document.*unreadable|illegible/i,
    context: ["kyc"],
    result: { title: "Documento ilegível",
              description: "Foto borrada ou com reflexo. Tente novamente em local com luz uniforme." } },

  // Auth
  { match: /invalid.*credentials|wrong.*password|invalid.*login/i,
    context: ["login"],
    result: { title: "Email ou senha incorretos",
              description: "Verifique seus dados ou clique em 'Esqueci minha senha'." } },

  { match: /user.*not.*found/i,
    context: ["login"],
    result: { title: "Usuário não encontrado",
              description: "Esse email não está cadastrado. Quer criar uma conta?" } },

  { match: /email.*already.*registered|already_exists|already.*confirmed/i,
    context: ["signup"],
    result: { title: "Email já cadastrado",
              description: "Use a opção de login ou recupere sua senha." } },

  { match: /weak_password|password.*short/i,
    context: ["signup"],
    result: { title: "Senha muito fraca",
              description: "Use no mínimo 6 caracteres com letras e números." } },

  { match: /rate.*limit|too.*many.*requests|over_email_send/i,
    result: { title: "Muitas tentativas",
              description: "Aguarde 1 minuto antes de tentar de novo." } },

  // Rede / sessão
  { match: /network|fetch.*failed|connection.*refused|offline/i,
    result: { title: "Sem conexão",
              description: "Verifique sua internet e tente de novo." } },

  { match: /session.*expired|jwt.*expired|invalid.*token|unauthorized/i,
    result: { title: "Sessão expirada",
              description: "Faça login novamente.",
              action: "Ir para login" } },

  // Vídeo
  { match: /webrtc|ice.*failed|getUserMedia|permission.*denied/i,
    context: ["consulta"],
    result: { title: "Não conseguimos acessar câmera/microfone",
              description: "Permita acesso nas configurações do navegador e recarregue." } },

  // PagBank/payment validation
  { match: /invalid.*cpf|tax_id.*invalid/i,
    context: ["pagamento", "kyc"],
    result: { title: "CPF inválido",
              description: "Confira o número informado." } },

  // Rate limit Supabase email
  { match: /over_email_send_rate_limit/i,
    result: { title: "Limite de emails atingido",
              description: "Tente novamente em alguns minutos.",
              action: "Aguardar" } },
];

const FALLBACK: Record<Context, ExplainedError> = {
  agendamento: { title: "Não foi possível agendar agora",
                 description: "Tente novamente. Se persistir, fale com o suporte." },
  pagamento:   { title: "Não foi possível processar o pagamento",
                 description: "Verifique seus dados ou tente outro método." },
  kyc:         { title: "Verificação não concluída",
                 description: "Refaça a foto com boa iluminação e rosto centralizado." },
  login:       { title: "Não foi possível entrar",
                 description: "Verifique email e senha." },
  signup:      { title: "Não foi possível criar conta",
                 description: "Tente novamente em instantes." },
  consulta:    { title: "Erro na consulta",
                 description: "Recarregue a página ou peça pra parte oposta tentar de novo." },
  prescricao:  { title: "Não foi possível salvar a prescrição",
                 description: "Tente novamente em alguns segundos." },
  geral:       { title: "Algo deu errado",
                 description: "Tente novamente ou recarregue a página." },
};

function matches(needle: string, pattern: RegExp | string[]): boolean {
  if (Array.isArray(pattern)) return pattern.some(p => needle.toLowerCase().includes(p.toLowerCase()));
  return pattern.test(needle);
}

export function explainError(error: unknown, context: Context = "geral"): ExplainedError {
  const msg = (() => {
    if (!error) return "";
    if (typeof error === "string") return error;
    if (error instanceof Error) return error.message;
    if (typeof error === "object") {
      const e = error as any;
      return e?.message || e?.error || e?.error_description || JSON.stringify(e);
    }
    return String(error);
  })();

  for (const p of PATTERNS) {
    if (p.context && !p.context.includes(context)) continue;
    if (matches(msg, p.match)) return p.result;
  }
  return FALLBACK[context];
}

/**
 * Helper pra usar com sonner toast:
 *   toastError(toast, error, "agendamento")
 */
export function toastError(toastFn: any, error: unknown, context: Context = "geral") {
  const e = explainError(error, context);
  toastFn.error(e.title, { description: e.description });
}
