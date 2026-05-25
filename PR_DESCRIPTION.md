# 🔒 security: hardening crítico para produção

Corrige falhas de segurança encontradas na auditoria da plataforma (Supabase edge functions + RLS + infra). Várias eram **exploráveis anonimamente** e impediam a liberação para produção.

> ⚠️ **Antes de mergear/deployar** — ver checklist no final. Há segredos a rotacionar e novos secrets a configurar.

## 🚨 Bloqueadores corrigidos

### Edge functions — autorização
| Função | Antes | Depois |
|--------|-------|--------|
| `create-admin-account` | senha admin **hardcoded** + sem auth → qualquer um virava admin | exige `ADMIN_BOOTSTRAP_SECRET`/`_EMAIL`/`_PASSWORD` via env; fail closed |
| `admin-reset-password` | secret estático no código resetava qualquer senha | exige **JWT de admin** (`is_admin()`) |
| `process-refund` | refund Mercado Pago disparável anonimamente | exige header `x-internal-secret` (`INTERNAL_FUNCTION_SECRET`) **ou** admin |
| `seed-test-doctors` / `seed-test-users` | criavam médicos "aprovados" com senha `Teste123!` | gated por `ALLOW_TEST_SEED` + `SEED_SECRET` |
| `docuseal-webhook` | sem assinatura + update em massa de `exam_reports` | exige `DOCUSEAL_WEBHOOK_SECRET`; update escopado por `external_id` |
| `mercadopago-webhook` | validação de assinatura **opcional** (bypass `!dataId`) | assinatura **obrigatória** (fail closed) + bypass corrigido |
| `assign-role` | usuário comum se auto-concedia role `doctor` | exige **admin** OU self + invite code validado no servidor |
| `turn-credentials` | senha do coturn hardcoded como fallback | só via env (sem fallback) |

### Banco de dados — RLS
Migration `supabase/migrations/20260526000000_security_hardening_prod.sql` (idempotente, aplicada por último):
- `document_verifications`: remove policies `USING(true)` e grants de `anon` → leitura de CPF/nome **só** via RPC `verify_document_public` (sem CPF/hash).
- Remove o **backdoor** `assign_admin_on_signup` (admin automático ao e-mail `plenasaudebv@gmail.com`) + drop do trigger.
- Escopa `prescription_signatures` e `prescription_validations` (dono/admin), removendo SELECT amplo.

### Infra / deploy
- `deploy.yml`: remove `--no-verify-jwt` **global** → o CLI honra `verify_jwt` por função.
- `config.toml`: reescrito e explícito — JWT obrigatório por padrão; `false` apenas para webhooks, cron, guest, callbacks OAuth, conteúdo público e funções gated por secret interno.
- `scripts/vps-setup.sh`: SSH **somente por chave** (remove `PasswordAuthentication yes`).
- `_shared/auth.ts` (novo): helper `getCaller` / `isAdmin` / `safeEqual` (comparação timing-safe).
- `.env.example`: documenta os novos secrets das edge functions.

## ✅ Checklist obrigatório antes do merge/deploy
- [ ] **Rotacionar segredos já vazados no histórico Git:** senha admin (`@Costagold2026`), secret de reset (`alo-admin-reset-2026`), senha coturn. Considerar reescrita de histórico.
- [ ] Configurar via `supabase secrets set`: `ADMIN_BOOTSTRAP_SECRET`, `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD`, `INTERNAL_FUNCTION_SECRET`, `MERCADOPAGO_WEBHOOK_SECRET`, `DOCUSEAL_WEBHOOK_SECRET`, `COTURN_PASS`. Manter `ALLOW_TEST_SEED=false` em produção.
- [ ] Rodar `SELECT * FROM pg_policies WHERE schemaname='public'` no banco real e comparar com o esperado (re-dumps reintroduziam `USING(true)`).
- [ ] Validar a lista de funções públicas do `config.toml` em **staging** antes de produção.
- [ ] Configurar a URL do webhook Mercado Pago e o secret do DocuSeal (header `x-docuseal-secret`).

## 🔁 Residuais MEDIUM + project ref dos triggers (corrigidos)
- `ai-ticket-triage`, `auto-clinical-summary`, `suggest-reschedule`: agora exigem header `x-internal-secret`.
- `verify-crm`: write de `crm_verified` exige JWT de admin; lookup segue público.
- `invoke_edge_function`: passa a enviar `Authorization: Bearer <anon>` (ref **correto** `pwxvvimdtmvziynbspgx`) + `x-internal-secret` → conserta todos os triggers/cron que apontavam para o ref **errado** (`oaixgmuocuwhsabidpei`).
- `fn_trigger_edge_email` e `auto_trigger_post_consultation_survey`: reapontadas para `invoke_edge_function` (estavam com URL/ref errado hardcoded + anon JWT antigo).
- Migration `20260526000100`: além do acima, desagenda defensivamente qualquer cron com o ref errado.

**Config adicional necessária:**
```sql
ALTER DATABASE postgres SET app.settings.internal_function_secret = '<segredo>';
```
```bash
supabase secrets set INTERNAL_FUNCTION_SECRET=<mesmo-segredo>
```

### Residual remanescente (não bloqueante)
`send-email` / `send-whatsapp` / `send-push-notification` são chamadas por qualquer usuário autenticado com destinatário/mensagem arbitrários (vetor de spam) — pré-existente. Requer regra de autorização por caso de uso; avaliar em follow-up.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
