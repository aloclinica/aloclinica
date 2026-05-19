# Checklist de Configuração — AloClínica

Ordem obrigatória para subir um ambiente do zero. Cada camada destrava a próxima.

## 1. Ambiente base
- [ ] Projeto Supabase criado
- [ ] `.env.local` com `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] `npm install` && `npm run dev` sobe sem erros

## 2. Banco
- [ ] Rodar `SUPABASE_SCHEMA.sql` no SQL Editor
- [ ] Aplicar migrations em ordem (`supabase/migrations/*.sql`)
- [ ] Validar: cadastrar paciente → login funciona

## 3. Secrets essenciais (Edge Functions)
- [ ] `MERCADOPAGO_ACCESS_TOKEN` + `MERCADOPAGO_WEBHOOK_SECRET`
- [ ] `RESEND_API_KEY` (e-mail transacional)
- [ ] TURN: credenciais Metered (`METERED_APP_NAME`, `METERED_SECRET_KEY`)
- [ ] URLs públicas: `VITE_APP_URL`, MiroTalk, WhatsApp gateway

## 4. Secrets opcionais (features avançadas)
- [ ] `VIDAAS_CLIENT_ID` / `VIDAAS_CLIENT_SECRET` (ICP-Brasil)
- [ ] `MEMED_API_KEY` / `MEMED_SECRET_KEY` (prescrição)
- [ ] `COMPREFACE_URL` / `COMPREFACE_API_KEY` (KYC biométrico)
- [ ] `ANTHROPIC_API_KEY` (Pingo IA)
- [ ] `EVOLUTION_API_URL` / `EVOLUTION_API_KEY` (WhatsApp)
- [ ] `VAPID_PRIVATE_KEY` (Push notifications)
- [ ] `DOCUSEAL_API_KEY`, `CONSULTA_CRM_API_KEY`

## Fluxo crítico de validação E2E
1. Cadastrar paciente (e-mail confirma)
2. Cadastrar médico → admin aprova
3. Paciente agenda consulta
4. Videochamada conecta (TURN + MiroTalk)
5. Médico emite receita
6. QR Code da receita valida em `/validate`

Ver também: `RUNBOOK.md` (incidentes), `ARCHITECTURE.md` (visão técnica), `LOVABLE_MASTER_SPEC.md` (regras de modificação).