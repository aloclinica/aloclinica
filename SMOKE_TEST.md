# Smoke test pós-deploy de segurança — AloClínica

Rode em **staging** primeiro. Marque cada item. `REF=pwxvvimdtmvziynbspgx`.

## A. Verificações de que os bloqueios funcionam (devem FALHAR / 401/403)

- [ ] **create-admin-account sem secret** → 401/403
  ```
  curl -s -o /dev/null -w "%{http_code}\n" -X POST \
    https://$REF.supabase.co/functions/v1/create-admin-account -d '{}'
  ```
- [ ] **admin-reset-password sem JWT de admin** → 401/403
  ```
  curl -s -o /dev/null -w "%{http_code}\n" -X POST \
    https://$REF.supabase.co/functions/v1/admin-reset-password \
    -d '{"email":"x@x.com","newPassword":"y"}'
  ```
- [ ] **process-refund sem internal-secret nem admin** → 401
  ```
  curl -s -o /dev/null -w "%{http_code}\n" -X POST \
    https://$REF.supabase.co/functions/v1/process-refund -d '{"appointment_id":"x"}'
  ```
- [ ] **mercadopago-webhook sem assinatura válida** → 401 (ou 503 se secret não setado)
- [ ] **docuseal-webhook sem x-docuseal-secret** → 401
- [ ] **seed-test-doctors** (com ALLOW_TEST_SEED=false) → 403
- [ ] **document_verifications direto via anon** (PostgREST) → vazio/negado; só `verify_document_public(code)` retorna
  ```
  curl -s "https://$REF.supabase.co/rest/v1/document_verifications?select=patient_cpf" \
    -H "apikey: <ANON>" -H "Authorization: Bearer <ANON>"
  ```
- [ ] **send-whatsapp como usuário comum repetido** → após o limite, 429

## B. Fluxos legítimos (devem FUNCIONAR)

- [ ] **Cadastro de médico** (AuthMedico) → verify-crm lookup OK; assign-role com invite code válido OK; sem invite → 403
- [ ] **Agendamento → pagamento → webhook MP** → appointment marcado como pago (webhook com assinatura válida processa)
- [ ] **Consulta concluída** → `auto_trigger_post_consultation_survey` dispara (notificação in-app criada; e-mail/WhatsApp enviados)
- [ ] **Resumo clínico automático** (auto-clinical-summary) gerado após consulta com notas
- [ ] **Notificações**: e-mail de boas-vindas no signup; push/WhatsApp em fluxos normais OK (não-admin dentro do limite)
- [ ] **Assinatura DocuSeal** → webhook com `x-docuseal-secret` correto marca o laudo certo (e SÓ ele) como assinado
- [ ] **Validador de documento** (/validar/:code) → retorna dados (sem CPF) via RPC
- [ ] **Reset de senha pelo admin** (logado) → 200
- [ ] **Crons**: confirmar em `cron.job` que nenhum comando contém `oaixgmuocuwhsabidpei`
  ```sql
  SELECT jobname, schedule FROM cron.job WHERE command LIKE '%oaixgmuocuwhsabidpei%'; -- deve vir vazio
  ```
- [ ] **Vídeo/teleconsulta** (turn-credentials) → retorna iceServers com TURN (COTURN_PASS setado e batendo com a VPS)

## C. Auditoria final de RLS
- [ ] `SELECT * FROM pg_policies WHERE schemaname='public'` — nenhuma policy de tabela sensível com `qual = true` acessível a `anon`.
- [ ] Tabelas sensíveis (`profiles`, `appointments`, `prescriptions`, `medical_records`, `payment_transactions`, `document_verifications`) com RLS habilitado e policies por dono/admin.

> Se algum item de **A** passar (não bloquear) ou de **B** falhar, NÃO promover para produção — investigar antes.
