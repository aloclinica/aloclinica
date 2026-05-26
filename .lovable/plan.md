## Objetivo

Manter a plataforma AloClínica funcionando normalmente para pacientes particulares (B2C via MercadoPago) e adicionar um **subdomínio dedicado** para contratos B2B/B2G e ações sociais, onde beneficiários acessam consultas sem passar pelo checkout.

```text
aloclinica.com.br          → fluxo normal (paciente paga)
parceiros.aloclinica.com.br → contratos empresa/prefeitura (contratante paga)
acoes.aloclinica.com.br    → ações sociais (patrocinador paga, voucher)
```

Mesma base de código, mesmo banco, mesmos médicos. Muda só **quem paga** e **como o paciente entra**.

---

## Etapa 1 — Banco de dados

Novas tabelas (migration única):

- **`contratos`** — contratante (empresa/prefeitura/ONG), tipo (`empresa | prefeitura | ong | plano_proprio`), modelo de cobrança (`mensal | pacote_pre_pago | gratuito_patrocinado`), vigência, status, limite de consultas, especialidades permitidas, subdomínio vinculado.
- **`contrato_beneficiarios`** — vínculo CPF/e-mail → contrato. Opcional: cadastro prévio ou auto-cadastro via voucher.
- **`vouchers`** — código único, contrato_id, validade, usos restantes, especialidades permitidas. Usado em ações sociais.
- **`consulta_contrato`** — liga `appointments.id` a `contratos.id` para relatório de consumo.

RLS + GRANTs padrão. Admin vê tudo, beneficiário vê só o próprio voucher.

## Etapa 2 — Roteamento por subdomínio

Atualizar `src/hooks/use-subdomain-redirect.ts` adicionando:

```ts
parceiros: { authRoute: "/parceiros/entrar", dashboardRole: "patient", contratoMode: true },
acoes:     { authRoute: "/acoes/entrar",     dashboardRole: "patient", vouchersMode: true },
```

Criar um **contexto global** `ContratoContext` que detecta o subdomínio e expõe:
- `isContratoMode: boolean`
- `isVoucherMode: boolean`
- `contratoAtivo: Contrato | null`

## Etapa 3 — Fluxo do beneficiário (subdomínio `parceiros`)

1. Landing simples com logo do contratante (puxado de `contratos.branding`).
2. Login: CPF + senha (ou primeiro acesso valida contra `contrato_beneficiarios`).
3. KYC obrigatório (mesma regra atual).
4. Agendamento normal, **mas no checkout**:
   - Verifica se o usuário é beneficiário ativo → marca consulta como `paga_por_contrato`.
   - Pula MercadoPago.
   - Decrementa cota do contrato.

## Etapa 4 — Fluxo do voucher (subdomínio `acoes`)

1. Landing da campanha (ex: "Mutirão Saúde Mental — Prefeitura X").
2. Paciente insere **código do voucher** + dados básicos.
3. Cria conta automática, KYC, agenda na especialidade permitida pelo voucher.
4. Voucher decrementa `usos_restantes`.

## Etapa 5 — Admin (painel interno AloClínica)

Nova seção `Admin → Contratos`:
- CRUD de contratos e vouchers.
- Upload de lista de CPFs beneficiários (CSV).
- Relatório de consumo por contrato (consultas, valor, especialidades mais usadas).
- Export PDF/CSV para enviar ao contratante por e-mail.

**Sem painel para o contratante** — gestão 100% interna, conforme já decidido.

## Etapa 6 — Cobrança do contratante

Lógica interna no admin (não automatizada nesta fase):
- **Pacote pré-pago**: contratante paga X consultas antecipado (boleto/Pix manual).
- **Mensal pós-pago**: ao fim do mês, admin gera fatura no relatório e envia.
- **Gratuito patrocinado**: já pago — sem cobrança recorrente.

MercadoPago segue exclusivo para B2C (pacientes particulares). Contratos não passam por gateway nesta fase.

---

## Detalhes técnicos

- Subdomínios apontam pro mesmo deploy Vercel (já suportado pelo `vercel.json`).
- DNS: `CNAME parceiros → cname.vercel-dns.com` e `CNAME acoes → cname.vercel-dns.com`.
- Branding por subdomínio: ler `contratos` por host na primeira carga; cache em `localStorage`.
- Bypass de checkout: ajustar `src/components/patient/BookAppointment.tsx` para consultar `ContratoContext` antes de invocar MercadoPago.
- Edge function nova: `validate-voucher` (valida código, retorna especialidades permitidas).
- Auditoria: toda consulta paga por contrato grava em `audit_logs` com `source=contrato:{id}`.

## O que NÃO entra agora

- Painel self-service para contratante (futuro).
- Integração automática de cobrança recorrente do contratante.
- SSO corporativo (futuro, se cliente pedir).

---

## Entregáveis

1. Migration com 4 tabelas + RLS + GRANTs.
2. `ContratoContext` + atualização do `use-subdomain-redirect`.
3. Páginas `/parceiros/entrar` e `/acoes/entrar`.
4. Bypass de checkout no fluxo de agendamento.
5. Edge function `validate-voucher`.
6. Admin: CRUD contratos + vouchers + upload CSV + relatório.
7. Documentação atualizada (`docs/CONTRATOS_E_ACOES.md`).