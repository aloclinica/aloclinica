## Escopo total selecionado

Você marcou os 3 focos + "outro". Como é trabalho grande, vou executar em **3 ondas sequenciais**, validando ao fim de cada uma antes de seguir. Isso evita commits gigantes que quebram coisas.

---

## Onda 1 — Fluxo Contratos B2B/B2G (maior peça que falta)

Seguindo `.lovable/plan.md`. Status atual: tabelas já existem (`contratos`, `contrato_beneficiarios`, `vouchers`, `consulta_contrato`), `ContratoContext` e páginas `/parceiros/entrar` + `/acoes/entrar` já existem. **Falta o miolo**:

1. **Edge function `validate-voucher`** — valida código, retorna especialidades permitidas e contrato.
2. **Bypass de checkout no agendamento** (`src/components/patient/BookAppointment.tsx`):
   - Se `ContratoContext.isContratoMode` e usuário é beneficiário ativo → marca `appointments.paga_por_contrato=true`, grava em `consulta_contrato`, pula MercadoPago, decrementa cota.
   - Se `isVoucherMode` com voucher válido → mesmo caminho + decrementa `vouchers.usos_restantes`.
3. **Admin → Contratos** (`src/components/admin/`):
   - CRUD de contratos (form + lista).
   - CRUD de vouchers (gerar código, validade, usos, especialidades).
   - Upload CSV de beneficiários (parser + insert em `contrato_beneficiarios`).
   - Relatório de consumo por contrato (consultas, valor, especialidades mais usadas, export CSV).
4. **Branding por subdomínio** — landing `/parceiros/entrar` e `/acoes/entrar` puxam logo/cor do `contratos.branding` baseado no host.
5. **Auditoria** — `audit_logs` com `source=contrato:{id}` em toda consulta paga por contrato.

---

## Onda 2 — Refinar PDFs médicos

1. **`src/lib/pdf-brand.ts` / `src/lib/pdf-layout.ts`** — revisar margens, hierarquia tipográfica, espaçamento entre blocos.
2. **Receita digital** — bloco legal CFM + QR de validação mais visíveis; assinatura ICP-Brasil em destaque.
3. **Atestado** — header com Pingo, dados do médico/CRM, rodapé com URL de validação.
4. **Laudo** (mesmo oculto do público, existe internamente) — mesma identidade.
5. QA visual com `pdftoppm` (skill PDF) antes de fechar.

---

## Onda 3 — Polimento final dos dashboards

1. **DoctorDashboard** — refinar Hero (KPI grande no mobile), comando-rápido, fila do dia, cards de pendências.
2. **PatientDashboard** — card "próxima consulta" mais protagonista, atalhos visuais para receita/atestado, histórico de saúde.
3. **ClinicDashboard** — tabela de médicos responsiva (scroll horizontal controlado), KPIs financeiros, agenda semanal.
4. Garantir que `min-w-0`, `grid-cols` responsivas e tipografia estejam consistentes nos 3.

---

## Detalhes técnicos

- Cliente DB: usar **`db`** (`@/integrations/supabase/untyped`) — regra do projeto.
- Edge function CORS via `npm:@supabase/supabase-js@2/cors`.
- Migrations apenas se faltar coluna/tabela; tabelas já estão criadas.
- `contratos.branding` é JSONB — assumir formato `{ logoUrl, primaryColor, nomeContratante }`.
- CSV de beneficiários: parser simples com `papaparse` (já presente) ou split manual.
- Bypass checkout: hook novo `useContratoBypass(userId)` retorna `{ ativo, contratoId, cotaRestante }` para o BookAppointment ler antes de chamar MercadoPago.

---

## Ordem de entrega

Vou começar pela **Onda 1** agora. Quando terminar, te aviso e sigo automaticamente para Onda 2 e Onda 3, a menos que você peça pausa.

## Fora de escopo (não entra agora)

- Painel self-service para contratante (futuro).
- Cobrança recorrente automatizada do contratante (manual no admin).
- SSO corporativo.