## Plano: Estrutura completa do Cartão Benefícios

Boa parte da fundação já existe (tabelas `pingo_card_plans`, `pingo_card_subscriptions`, `pingo_card_partners`, `pingo_card_transactions`, `pingo_ticket_accounts`, `pingo_ticket_transactions`, `dependents`, `AdminPingoCard.tsx`, `PingoCard.tsx`, edge functions MercadoPago). O plano abaixo conecta tudo, fecha o ciclo de venda recorrente e padroniza UX.

### 1. Banco de dados (migration única)
- Garantir colunas em `pingo_card_subscriptions`: `plan_id`, `status` (active/past_due/cancelled/trial), `billing_cycle` (monthly/yearly), `mp_subscription_id`, `mp_preapproval_id`, `next_charge_at`, `trial_ends_at`, `cancelled_at`, `card_holder_user_id`, `dependents_included int`.
- Garantir colunas em `pingo_card_plans`: `pingo_ticket_monthly_credit numeric default 0`, `trial_days int default 0`, `display_order int`, `features_included jsonb`, `is_active`, `is_highlighted`, `cta_label`.
- Nova tabela `pingo_card_invoices` (subscription_id, mp_payment_id, amount, status, due_date, paid_at, pdf_url).
- Nova tabela `pingo_card_benefit_usage` (subscription_id, type [consultation/exam/partner/ticket], reference_id, discount_applied, used_at) — auditoria para o titular ver economia acumulada.
- Triggers: `fn_credit_pingo_ticket_on_invoice_paid` (credita `pingo_ticket_accounts.balance` quando fatura paga e plano tem `pingo_ticket_monthly_credit > 0`); `fn_block_dependents_over_limit` (não permite cadastrar dependente além de `plan.max_dependents`).
- RPC `fn_get_cartao_summary(user_id)` retornando plano, status, próximo vencimento, saldo Pingo Ticket, dependentes ativos, economia do mês.
- RLS para tudo (titular vê seus dados; admin vê tudo via `has_role('admin')`).

### 2. Admin — editor de planos
- Estender `AdminPingoCard.tsx` (ou criar `AdminPingoCardPlans.tsx`) com CRUD completo de `pingo_card_plans`: nome, slug, preço mensal/anual, descontos (consulta/exame/parceiro), crédito mensal Pingo Ticket, max dependentes, lista de benefícios (jsonb editável), cor, ordem, destaque, dias de trial, CTA.
- Tab adicional "Assinaturas" com lista, filtros por status, ações (cancelar, marcar past_due, abrir fatura).
- Tab "Parceiros" já existe — só padronizar com `AdminPageHeader`.
- Adicionar item no `AdminSiteConfig`/Editor para alterar copy do hero do Pingo Card (título, subtítulo, badges).

### 3. Frontend público de vendas (`/pingo-card`)
- Refatorar `PingoCard.tsx` carregando planos ativos do banco (já parcial), mostrando: Hero, Como funciona, Cards de planos (mensal/anual toggle), Benefícios detalhados, Rede credenciada destaque (`pingo_card_partners` featured), FAQ específico, CTA "Assinar agora".
- Botão "Assinar" → se não logado, leva ao /auth com `?redirect=/checkout/pingo-card?plan=slug`; se logado, vai direto pro checkout.
- Nova página `CheckoutPingoCard.tsx`: resumo do plano, escolha mensal/anual, formulário de cartão (já temos `AddCardForm`), confirma assinatura.

### 4. Edge function — assinatura recorrente
- Reaproveitar `mercadopago-create-subscription` ajustando payload para passar `plan_id` do cartão benefícios e gravar `pingo_card_subscriptions` com `mp_preapproval_id`.
- Estender `mercadopago-webhook` para tratar evento `preapproval` + `authorized_payment`: atualiza status da assinatura, cria registro em `pingo_card_invoices`, dispara trigger de crédito Pingo Ticket.
- Nova edge function `pingo-card-cancel` (chama `mercadopago-cancel-subscription` e marca `cancelled_at`).

### 5. Painel do titular (`/dashboard/cartao/*`)
- `MeuPlano.tsx`: mostrar plano atual via RPC `fn_get_cartao_summary`, próxima cobrança, botão upgrade/downgrade/cancelar, histórico de economia.
- `CarteirinhaDigital.tsx`: já existe — padronizar branding com mascote Pingo + QR code com URL pública de validação.
- `FaturasCartao.tsx`: listar `pingo_card_invoices`, status, link PDF, botão "pagar agora" se past_due.
- `RedeCredenciada.tsx`: busca por categoria/cidade com `pingo_card_partners`, mapa opcional fase 2.
- `PingoTicket.tsx`: saldo, extrato de `pingo_ticket_transactions`, lista de estabelecimentos (categoria = restaurante/mercado dos parceiros), botão "como usar".
- `DependentesCartao.tsx`: validar contra `plan.max_dependents` antes de inserir.
- `LgpdCartao.tsx`: já ok.

### 6. Gating de acesso
- Hook `useCartaoSubscription()` retornando assinatura ativa do usuário.
- `KycRequiredGate`-style `ActiveCartaoGate` para `/dashboard/cartao/*` exceto carteirinha (sempre acessível em modo "sem plano" mostrando CTA de assinar).
- Ao agendar consulta, aplicar desconto automático se o paciente tem assinatura ativa e gravar `pingo_card_benefit_usage`.

### Stack técnico
- Cliente untyped `db` para todas as queries (regra do projeto).
- MercadoPago Preapproval API para recorrência.
- Sem PagBank/Asaas.
- Tailwind tokens semânticos; sem cores hardcoded.

### Ordem de entrega
1. Migration (schema + RPC + triggers + RLS).
2. Admin editor de planos + tab de assinaturas.
3. Página pública `/pingo-card` dinâmica + checkout.
4. Edge functions (criar/cancelar/webhook).
5. Painel do titular conectado.
6. Gating + desconto automático no agendamento.

### Riscos / decisões em aberto
- Aprovação da migration: vou disparar primeiro, aguardar OK do usuário, depois codar.
- Política de reembolso/proração no upgrade/downgrade — proposta: prorata simples no MP; confirmar com você.
- Pingo Ticket — saldo mensal expira? Proposta: acumula até 90 dias, depois zera. Confirmar.

Posso seguir nessa ordem?
