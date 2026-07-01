# 🔐 Guia de Deploy — Correções de Segurança (2026-07)

Este documento lista **tudo** que precisa ser feito para colocar as correções de
segurança em produção com segurança. Siga a ordem. Nada aqui é opcional para o
go-live.

> Contexto: auditoria encontrou ~12 falhas críticas + >10 altas nas edge functions.
> As correções estão na branch `security/go-live-hardening`. Elas dependem de
> alguns segredos/migrations abaixo — se você fizer deploy do código SEM esses
> passos, algumas funções (crons, invites, pagamentos de fila/renovação) vão
> **falhar de forma segura** (401/400), não abrir brechas.

## 🔑 Passo 0 — ROTACIONAR segredos expostos (fazer JÁ)
Estes vazaram (no chat com a IA e/ou commitados no código). Rotacione todos:
- [ ] **Supabase `service_role` key** — foi compartilhada no chat. Rotacionar no Supabase → Settings → API. Isso invalida a chave antiga; atualize onde ela é usada (GUC do passo 2, secrets).
- [ ] **CompreFace API keys** (`5f3c100e-…` verify, `a2d930ec-…` detect) — estavam hardcoded no `didit-kyc`. Gerar novas no CompreFace.
- [ ] **DocuSeal API key** — era enviada por HTTP puro. Rotacionar.
- [ ] Confirmar que **`MERCADOPAGO_ACCESS_TOKEN`** e tokens de WhatsApp não vazaram; rotacionar por precaução se houver dúvida.

## ⚙️ Passo 1 — Configurar Edge Function Secrets (Supabase → Functions → Secrets)
- [ ] `INTERNAL_FUNCTION_SECRET` — string aleatória forte (usada por `isInternalOrService` para autorizar crons/triggers). **Deve** bater com o `app.settings.internal_function_secret` do banco.
- [ ] `COMPREFACE_URL` = `https://face.aloclinica.com.br`
- [ ] `COMPREFACE_VERIFY_KEY`, `COMPREFACE_DETECT_KEY` = as novas chaves rotacionadas
- [ ] `DOCUSEAL_BASE` = URL **HTTPS** do DocuSeal (ver Passo 6). Se vazio, o proxy retorna 503 (seguro).
- [ ] Confirmar já existentes: `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `MERCADOPAGO_ACCESS_TOKEN`, `AUTO_PAYOUT_TICK_SECRET`, `RESEND_API_KEY`, etc.

## 🗄️ Passo 2 — Configurar o GUC do banco (para o pg_cron autenticar)
Os crons agora chamam as functions com o **service_role** (não mais a anon pública). O helper `invoke_edge_function()` lê a chave de um setting do banco:
```sql
ALTER DATABASE postgres SET app.settings.service_role_key = '<SUA_SERVICE_ROLE_JWT>';
ALTER DATABASE postgres SET app.settings.internal_function_secret = '<MESMO_VALOR_DO_SECRET>';
```
> O valor **deve** ser igual ao `SUPABASE_SERVICE_ROLE_KEY` / `INTERNAL_FUNCTION_SECRET` das functions. Se não configurar, os crons caem no fallback `x-internal-secret` (ainda autorizado) e logam WARNING — não voltam a usar a anon.

## 🧱 Passo 3 — Rodar as 4 migrations novas (na ordem)
```
20260701050000_security_drop_hardcoded_admin_trigger.sql      # remove backdoor admin (plenasaudebv@gmail.com)
20260701050100_security_tighten_doctor_invite_codes_rls.sql   # fecha leitura de invite codes
20260701050200_security_cron_service_role_auth.sql            # crons deixam de usar anon
20260701050300_security_payment_support_schema.sql            # mp_oauth_states + colunas de preço
```
Via `supabase db push` (CLI) ou colando no SQL Editor, em ordem.

## 🚀 Passo 4 — Deploy das Edge Functions + config.toml
- [ ] `supabase functions deploy` (todas) — o `supabase/config.toml` agora define `verify_jwt=false` só para as 6 funções externas (webhooks, oauth, robots, ical, public-api). O resto é protegido **em código** (getCaller/isInternalOrService).
- [ ] O deploy do GitHub Actions já honra o `config.toml` (não passa `--no-verify-jwt` global).

## ✅ Passo 5 — Validar pós-deploy
- [ ] **Crons ainda rodam:** checar logs de `daily-backup`, `scheduled-tasks` etc. (não podem voltar 401). Se 401 → o GUC/secret do Passo 2 não bate.
- [ ] **Pagamento (sandbox):** criar um pagamento de consulta e confirmar que o valor cobrado = `price_at_booking` (tentar mandar `amount` menor no body → deve ser ignorado).
- [ ] **Invite de médico:** gerar um código, validar e resgatar (`assign-role`) — deve consumir 1 uso (`current_uses`).
- [ ] **Webhook MP:** confirmar que notificações continuam sendo aceitas (assinatura válida).
- [ ] **KYC:** confirmar que `didit-kyc` chama `https://face.aloclinica.com.br` (não http://IP).

## 🩹 Passo 6 — Pendências que precisam de ação de produto/infra
- [ ] **DocuSeal não está implantado** (nenhum container, porta 3200 morta). Ou implante o DocuSeal **sob HTTPS** (ex.: `sign.aloclinica.com.br`) e configure `DOCUSEAL_BASE`, ou remova o recurso de assinatura via DocuSeal. Enquanto isso, `docuseal-proxy` retorna 503 (seguro).
- [ ] **OAuth marketplace do Mercado Pago:** criei a tabela `mp_oauth_states`, mas falta a função **iniciadora** que gera o `state` aleatório e monta a URL de autorização do MP. Sem ela, o `mp-oauth-callback` falha fechado (seguro) e médicos não conectam conta MP. (Peça que eu implemente essa função quando quiser.)
- [ ] **`prescription_renewals.price`:** o fluxo que cria uma renovação deve **gravar o preço** (default 0 = falha segura, não cobra errado).
- [ ] **Cobrança recorrente de cartão salvo:** `charge-saved-card` agora exige JWT de usuário. Migrar recorrência para **preapproval do MP** (o webhook já trata `authorized_payment`).
- [ ] **Criptografar `doctor_profiles.mp_access_token`** em repouso (Vault/pgsodium).
- [ ] **`metered-room`:** tornar as salas **privadas/por-participante** (hoje `privacy: public`).
- [ ] **`public-api`:** garantir que a função `crypt`/`verify_api_key` existe no banco, senão parceiros tomam 401 (fecha seguro).
- [ ] **`doctor-ical-feed`:** adicionar rotação/revogação de `ical_token`.

## 🧹 Passo 7 — Limpeza de dados (LGPD / integridade)
- [ ] **Scrub de PII:** apagar CPF/nome de paciente que o `didit-kyc` antigo gravava em `activity_logs` (agora só grava boolean + hash).
- [ ] **Auditar documentos forjados:** receitas marcadas `is_signed=true` pelo `generate-prescription-pdf` antigo (e seus `document_verifications` com `is_valid=true`) podem ser fraudulentas — revisar/invalidar.

## 📌 Como levar as mudanças ao seu GitHub / Lovable
As correções estão em commits na branch `security/go-live-hardening` (repo clonado localmente). Como o app foi feito via **Lovable**, você tem 2 caminhos:
1. **Git direto:** dar push da branch pro seu GitHub e abrir PR → merge. ⚠️ Se o Lovable sincroniza o repo, ele pode sobrescrever — faça o merge e re-sincronize com cuidado.
2. **Via Lovable:** aplicar as mudanças pelo próprio Lovable (ele edita o repo). Peça que eu gere um `git diff`/patch por arquivo se preferir colar manualmente.
