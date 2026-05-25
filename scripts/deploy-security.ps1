<#
=============================================================================
 AloClínica — aplica a configuração de segurança em produção (Windows).

 NÃO contém segredos. Defina as variáveis de ambiente antes de rodar
 (valores em aloclinica-DEPLOY-SECRETS.txt):

   $env:SUPABASE_ACCESS_TOKEN = "..."        # ou: supabase login
   $env:ADMIN_BOOTSTRAP_SECRET = "..."
   $env:ADMIN_BOOTSTRAP_EMAIL = "..."
   $env:ADMIN_BOOTSTRAP_PASSWORD = "..."
   $env:INTERNAL_FUNCTION_SECRET = "..."
   $env:DOCUSEAL_WEBHOOK_SECRET = "..."
   $env:COTURN_PASS = "..."
   $env:MERCADOPAGO_WEBHOOK_SECRET = "..."   # do painel Mercado Pago

 Uso:  powershell -ExecutionPolicy Bypass -File scripts\deploy-security.ps1
=============================================================================
#>
$ErrorActionPreference = "Stop"
$REF = "pwxvvimdtmvziynbspgx"

$required = @(
  "ADMIN_BOOTSTRAP_SECRET","ADMIN_BOOTSTRAP_EMAIL","ADMIN_BOOTSTRAP_PASSWORD",
  "INTERNAL_FUNCTION_SECRET","DOCUSEAL_WEBHOOK_SECRET","COTURN_PASS","MERCADOPAGO_WEBHOOK_SECRET"
)
foreach ($v in $required) {
  if (-not [Environment]::GetEnvironmentVariable($v)) { Write-Error "Falta definir `$env:$v"; exit 1 }
}

Write-Host "==> 1/4 Definindo secrets das edge functions"
supabase secrets set --project-ref $REF `
  ADMIN_BOOTSTRAP_SECRET="$env:ADMIN_BOOTSTRAP_SECRET" `
  ADMIN_BOOTSTRAP_EMAIL="$env:ADMIN_BOOTSTRAP_EMAIL" `
  ADMIN_BOOTSTRAP_PASSWORD="$env:ADMIN_BOOTSTRAP_PASSWORD" `
  INTERNAL_FUNCTION_SECRET="$env:INTERNAL_FUNCTION_SECRET" `
  DOCUSEAL_WEBHOOK_SECRET="$env:DOCUSEAL_WEBHOOK_SECRET" `
  COTURN_PASS="$env:COTURN_PASS" `
  MERCADOPAGO_WEBHOOK_SECRET="$env:MERCADOPAGO_WEBHOOK_SECRET" `
  ALLOW_TEST_SEED=false

Write-Host "==> 2/4 Aplicando migrations (RLS + invoke_edge_function)"
supabase link --project-ref $REF
supabase db push

Write-Host "==> 3/4 Configure no SQL editor (precisa de superuser):"
Write-Host "    ALTER DATABASE postgres SET app.settings.internal_function_secret = '<INTERNAL_FUNCTION_SECRET>';"

Write-Host "==> 4/4 Deploy das edge functions (honra verify_jwt do config.toml)"
supabase functions deploy --project-ref $REF

Write-Host ""
Write-Host "==> Pos-deploy: rotacionar admin (define a nova senha):"
Write-Host "Invoke-RestMethod -Method Post -Uri https://$REF.supabase.co/functions/v1/create-admin-account ``"
Write-Host "  -ContentType 'application/json' -Body (@{secret=`$env:ADMIN_BOOTSTRAP_SECRET}|ConvertTo-Json)"
Write-Host ""
Write-Host "Lembre: coturn na VPS com a MESMA COTURN_PASS; configurar webhooks MP/DocuSeal."
Write-Host "Concluido."
