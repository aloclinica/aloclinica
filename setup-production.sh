#!/usr/bin/env bash
# =============================================================================
# AloClínica — Script de configuração de produção
# Execute: bash setup-production.sh
# =============================================================================
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC}   $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; }

PROJECT_REF="oaixgmuocuwhsabidpei"

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   AloClínica — Setup de Produção              ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════╝${NC}"
echo ""

# ─── Pre-flight checks ────────────────────────────────────────────────────────
info "Verificando pré-requisitos..."

command -v supabase >/dev/null 2>&1 || { error "supabase CLI não encontrado. Instale: https://supabase.com/docs/guides/cli"; exit 1; }
command -v gh >/dev/null 2>&1      || warn "gh (GitHub CLI) não encontrado — secrets do GitHub não serão configurados"
command -v openssl >/dev/null 2>&1 || { error "openssl não encontrado"; exit 1; }

# ─── Check supabase login ─────────────────────────────────────────────────────
info "Verificando login no Supabase..."
supabase projects list >/dev/null 2>&1 || { error "Faça login primeiro: supabase login"; exit 1; }
success "Supabase CLI autenticado"

# ─── Collect required values ─────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}━━━ Configuração dos Serviços Externos ━━━━━━━━━━━━━━━${NC}"
echo ""

prompt() {
  local var_name="$1"; local prompt_text="$2"; local default="$3"
  if [ -n "$default" ]; then
    read -rp "$(echo -e "${GREEN}${prompt_text}${NC} [${default}]: ")" val
    eval "${var_name}=\"${val:-$default}\""
  else
    read -rp "$(echo -e "${GREEN}${prompt_text}${NC}: ")" val
    while [ -z "$val" ]; do
      warn "Valor obrigatório."
      read -rp "$(echo -e "${GREEN}${prompt_text}${NC}: ")" val
    done
    eval "${var_name}=\"$val\""
  fi
}

# Email (Resend)
echo -e "\n${BLUE}📧 Email — Resend.com (https://resend.com)${NC}"
prompt RESEND_API_KEY         "RESEND_API_KEY (re_...)"
prompt EMAIL_FROM_ADDRESS     "EMAIL_FROM_ADDRESS (ex: noreply@aloclinica.com.br)" "noreply@aloclinica.com.br"
prompt EMAIL_FROM_NAME        "EMAIL_FROM_NAME" "AloClínica"
prompt SITE_DOMAIN            "SITE_DOMAIN (sem https://)" "aloclinica.com.br"
SITE_URL="https://${SITE_DOMAIN}"

# Payments (Asaas)
echo -e "\n${BLUE}💳 Pagamentos — Asaas (https://asaas.com)${NC}"
prompt ASAAS_API_KEY          "ASAAS_API_KEY (\$aact_...)"
prompt ASAAS_ENVIRONMENT      "ASAAS_ENVIRONMENT (production|sandbox)" "production"
ASAAS_WEBHOOK_TOKEN=$(openssl rand -hex 32)
info "ASAAS_WEBHOOK_TOKEN gerado automaticamente: ${ASAAS_WEBHOOK_TOKEN}"
info "Configure este token no painel Asaas: Integrações → Webhooks → Access Token"

# AI / DeepSeek
echo -e "\n${BLUE}🤖 IA — DeepSeek via OpenRouter (https://openrouter.ai)${NC}"
prompt DEEPSEEK_API_KEY       "DEEPSEEK_API_KEY (sk-or-...)"

# WhatsApp (Evolution API)
echo -e "\n${BLUE}📱 WhatsApp — Evolution API${NC}"
prompt EVOLUTION_API_URL      "EVOLUTION_API_URL (ex: http://72.62.138.208:8080)" "http://72.62.138.208:8080"
prompt EVOLUTION_API_KEY      "EVOLUTION_API_KEY"

# Video (Metered.ca)
echo -e "\n${BLUE}🎥 Vídeo — Metered.ca (https://www.metered.ca)${NC}"
prompt METERED_APP_NAME       "METERED_APP_NAME"
prompt METERED_SECRET_KEY     "METERED_SECRET_KEY"

# Push Notifications (VAPID)
echo -e "\n${BLUE}🔔 Push Notifications — VAPID${NC}"
info "Gerando par de chaves VAPID..."
if command -v node >/dev/null 2>&1; then
  VAPID_KEYS=$(node -e "
    const crypto = require('crypto');
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const pub = publicKey.export({ type: 'spki', format: 'der' });
    const priv = privateKey.export({ type: 'pkcs8', format: 'der' });
    console.log(pub.slice(27).toString('base64url') + '|' + priv.slice(36).toString('base64url'));
  " 2>/dev/null || echo "")
  if [ -n "$VAPID_KEYS" ]; then
    VAPID_PUBLIC_KEY="${VAPID_KEYS%%|*}"
    VAPID_PRIVATE_KEY="${VAPID_KEYS##*|}"
    info "VAPID_PUBLIC_KEY (para frontend): ${VAPID_PUBLIC_KEY}"
    info "VAPID_PRIVATE_KEY (para Supabase secret): gerado"
  else
    warn "Não foi possível gerar VAPID keys automaticamente"
    prompt VAPID_PRIVATE_KEY "VAPID_PRIVATE_KEY (gere em: https://web-push-codelab.glitch.me)"
  fi
else
  warn "Node.js não encontrado — VAPID keys não geradas"
  prompt VAPID_PRIVATE_KEY "VAPID_PRIVATE_KEY"
fi

# DocuSeal
echo -e "\n${BLUE}📄 Assinaturas Digitais — DocuSeal${NC}"
prompt DOCUSEAL_API_KEY       "DOCUSEAL_API_KEY" "${DOCUSEAL_API_KEY:-}"

# Optional
echo -e "\n${BLUE}🔧 Serviços opcionais (pressione Enter para pular)${NC}"
read -rp "$(echo -e "${GREEN}MEMED_API_KEY (prescriptions)${NC} [pular]: ")" MEMED_API_KEY
read -rp "$(echo -e "${GREEN}MEMED_SECRET_KEY${NC} [pular]: ")"               MEMED_SECRET_KEY

read -rp "$(echo -e "${GREEN}VITE_SENTRY_DSN (monitoramento)${NC} [pular]: ")" VITE_SENTRY_DSN

# ─── Apply Supabase Secrets ───────────────────────────────────────────────────
echo ""
info "Configurando secrets no Supabase..."

SECRETS_ARGS=(
  "RESEND_API_KEY=${RESEND_API_KEY}"
  "EMAIL_FROM_ADDRESS=${EMAIL_FROM_ADDRESS}"
  "EMAIL_FROM_NAME=${EMAIL_FROM_NAME}"
  "SITE_DOMAIN=${SITE_DOMAIN}"
  "SITE_URL=${SITE_URL}"
  "ASAAS_API_KEY=${ASAAS_API_KEY}"
  "ASAAS_ENVIRONMENT=${ASAAS_ENVIRONMENT}"
  "ASAAS_WEBHOOK_TOKEN=${ASAAS_WEBHOOK_TOKEN}"
  "DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}"
  "EVOLUTION_API_URL=${EVOLUTION_API_URL}"
  "EVOLUTION_API_KEY=${EVOLUTION_API_KEY}"
  "METERED_APP_NAME=${METERED_APP_NAME}"
  "METERED_SECRET_KEY=${METERED_SECRET_KEY}"
  "VAPID_PRIVATE_KEY=${VAPID_PRIVATE_KEY}"
)

[ -n "$DOCUSEAL_API_KEY"    ] && SECRETS_ARGS+=("DOCUSEAL_API_KEY=${DOCUSEAL_API_KEY}")
[ -n "$MEMED_API_KEY"       ] && SECRETS_ARGS+=("MEMED_API_KEY=${MEMED_API_KEY}")
[ -n "$MEMED_SECRET_KEY"    ] && SECRETS_ARGS+=("MEMED_SECRET_KEY=${MEMED_SECRET_KEY}")


supabase secrets set --project-ref "${PROJECT_REF}" "${SECRETS_ARGS[@]}" && success "Secrets configurados no Supabase" || error "Falha ao configurar secrets"

# ─── Apply DB Migrations ──────────────────────────────────────────────────────
echo ""
info "Aplicando migrations pendentes..."
supabase db push --project-ref "${PROJECT_REF}" && success "Migrations aplicadas" || warn "Verifique as migrations manualmente"

# ─── Deploy Edge Functions ────────────────────────────────────────────────────
echo ""
info "Fazendo deploy de todas as edge functions..."
supabase functions deploy --project-ref "${PROJECT_REF}" --no-verify-jwt 2>&1 | tail -5
success "Edge functions deployadas"

# ─── GitHub Secrets ───────────────────────────────────────────────────────────
if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  echo ""
  info "Configurando secrets no GitHub Actions..."

  REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")
  if [ -n "$REPO" ]; then
    SUPABASE_URL=$(supabase projects show --project-ref "${PROJECT_REF}" --json 2>/dev/null | grep '"api_url"' | sed 's/.*"api_url": *"\([^"]*\)".*/\1/' || echo "https://${PROJECT_REF}.supabase.co")
    SUPABASE_ANON_KEY=$(supabase projects api-keys --project-ref "${PROJECT_REF}" --json 2>/dev/null | python3 -c "import sys,json; keys=json.load(sys.stdin); print(next(k['api_key'] for k in keys if k['name']=='anon'))" 2>/dev/null || echo "")

    gh secret set VITE_SUPABASE_URL            --repo "${REPO}" --body "${SUPABASE_URL}"         2>/dev/null && info "✓ VITE_SUPABASE_URL"
    gh secret set VITE_SUPABASE_PUBLISHABLE_KEY --repo "${REPO}" --body "${SUPABASE_ANON_KEY}"   2>/dev/null && info "✓ VITE_SUPABASE_PUBLISHABLE_KEY"
    [ -n "$VITE_SENTRY_DSN" ] && gh secret set VITE_SENTRY_DSN --repo "${REPO}" --body "${VITE_SENTRY_DSN}" 2>/dev/null && info "✓ VITE_SENTRY_DSN"

    echo ""
    warn "IMPORTANTE: Adicione manualmente o secret VPS_SSH_PRIVATE_KEY no GitHub:"
    warn "  gh secret set VPS_SSH_PRIVATE_KEY --repo ${REPO} < ~/.ssh/id_rsa"
    warn "  (ou cole a chave privada do servidor VPS)"
  else
    warn "Não foi possível detectar o repositório GitHub. Configure os secrets manualmente."
  fi
fi

# ─── Asaas Webhook URL ────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}━━━ Configure estes webhooks no Asaas ━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "URL:   ${GREEN}https://${PROJECT_REF}.supabase.co/functions/v1/asaas-webhook${NC}"
echo -e "Token: ${GREEN}${ASAAS_WEBHOOK_TOKEN}${NC}"
echo -e "Eventos: PAYMENT_CONFIRMED, PAYMENT_RECEIVED, PAYMENT_OVERDUE,"
echo -e "         PAYMENT_DELETED, PAYMENT_REFUNDED, PAYMENT_CHARGEBACK_*"
echo ""

# ─── Summary ──────────────────────────────────────────────────────────────────
echo -e "${GREEN}━━━ Setup Concluído! ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Próximos passos:"
echo "  1. Configure o webhook no Asaas (URL e token acima)"
echo "  2. Adicione VPS_SSH_PRIVATE_KEY no GitHub"
echo "  3. Faça push para main para acionar o deploy automático"
echo "  4. Verifique os logs: supabase functions logs appointment-reminders"
echo ""
echo "  supabase db pull --project-ref ${PROJECT_REF}  (sincronizar schema local)"
echo ""
