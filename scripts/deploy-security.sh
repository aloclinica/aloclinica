#!/usr/bin/env bash
# =============================================================================
# AloClínica — aplica a configuração de segurança em produção.
#
# NÃO contém segredos. Exporte as variáveis abaixo antes de rodar (pegue os
# valores no seu gerenciador de senhas — ver aloclinica-DEPLOY-SECRETS.txt).
#
#   export SUPABASE_ACCESS_TOKEN=...        # supabase login
#   export ADMIN_BOOTSTRAP_SECRET=...
#   export ADMIN_BOOTSTRAP_EMAIL=...
#   export ADMIN_BOOTSTRAP_PASSWORD=...
#   export INTERNAL_FUNCTION_SECRET=...
#   export DOCUSEAL_WEBHOOK_SECRET=...
#   export COTURN_PASS=...
#   export MERCADOPAGO_WEBHOOK_SECRET=...   # do painel Mercado Pago
#
# Uso:  bash scripts/deploy-security.sh
# =============================================================================
set -euo pipefail

REF="pwxvvimdtmvziynbspgx"

require() { [ -n "${!1:-}" ] || { echo "ERRO: falta exportar \$$1"; exit 1; }; }
for v in ADMIN_BOOTSTRAP_SECRET ADMIN_BOOTSTRAP_EMAIL ADMIN_BOOTSTRAP_PASSWORD \
         INTERNAL_FUNCTION_SECRET DOCUSEAL_WEBHOOK_SECRET COTURN_PASS \
         MERCADOPAGO_WEBHOOK_SECRET; do require "$v"; done

echo "==> 1/4 Definindo secrets das edge functions"
supabase secrets set --project-ref "$REF" \
  ADMIN_BOOTSTRAP_SECRET="$ADMIN_BOOTSTRAP_SECRET" \
  ADMIN_BOOTSTRAP_EMAIL="$ADMIN_BOOTSTRAP_EMAIL" \
  ADMIN_BOOTSTRAP_PASSWORD="$ADMIN_BOOTSTRAP_PASSWORD" \
  INTERNAL_FUNCTION_SECRET="$INTERNAL_FUNCTION_SECRET" \
  DOCUSEAL_WEBHOOK_SECRET="$DOCUSEAL_WEBHOOK_SECRET" \
  COTURN_PASS="$COTURN_PASS" \
  MERCADOPAGO_WEBHOOK_SECRET="$MERCADOPAGO_WEBHOOK_SECRET" \
  ALLOW_TEST_SEED=false

echo "==> 2/4 Aplicando migrations (RLS + invoke_edge_function)"
supabase link --project-ref "$REF"
supabase db push

echo "==> 3/4 Configurando app.settings.internal_function_secret no banco"
echo "    Rode no SQL editor (precisa de superuser):"
echo "    ALTER DATABASE postgres SET app.settings.internal_function_secret = '<INTERNAL_FUNCTION_SECRET>';"

echo "==> 4/4 Deploy das edge functions (honra verify_jwt do config.toml)"
supabase functions deploy --project-ref "$REF"

echo
echo "==> Pós-deploy: rotacionar admin (define a nova senha):"
echo "curl -X POST https://$REF.supabase.co/functions/v1/create-admin-account \\"
echo "  -H 'Content-Type: application/json' -d '{\"secret\":\"\$ADMIN_BOOTSTRAP_SECRET\"}'"
echo
echo "Lembre: coturn na VPS deve usar a MESMA COTURN_PASS; configurar webhooks MP/DocuSeal."
echo "Concluído."
