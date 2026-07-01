# 🔐 Segurança de Dados (Google) / Privacidade do App (Apple)

App de **saúde** → declare com precisão, senão a loja reprova. Baseado nos dados
que a AloClínica realmente coleta (Supabase + Mercado Pago + WhatsApp + KYC).

## Dados coletados e finalidade
| Categoria | Dado | Finalidade | Compartilhado? |
|---|---|---|---|
| Identidade | Nome, CPF, foto (KYC), documento | Cadastro, verificação de identidade | Não (processado internamente) |
| Contato | E-mail, telefone/WhatsApp | Login, notificações, lembretes | Processadores (WhatsApp/WAHA, e-mail) |
| Saúde | Sintomas, prontuário, receitas, exames | Prestação da teleconsulta | Médico responsável |
| Financeiro | Dados de pagamento (via gateway) | Cobrança de consultas/planos | Mercado Pago (processador) |
| Localização | Não coletada (ou aproximada, se aplicável) | — | — |
| Identificadores | ID de usuário, token de push | Sessão e notificações | Firebase (push) |
| Diagnóstico | Logs de erro/crash | Estabilidade | Sentry (processador) |

## Práticas de segurança (marcar no formulário)
- ✅ Dados **criptografados em trânsito** (HTTPS/TLS) e **em repouso** (Supabase).
- ✅ Usuário pode **solicitar exclusão** dos dados (LGPD — função lgpd-export/exclusão + página /meus-dados).
- ✅ Controle de acesso por papéis (RBAC) e RLS no banco.
- ✅ Não vendemos dados pessoais.
- ✅ Conformidade **LGPD** (Lei 13.709/2018).

## Coleta de dados sensíveis de saúde (Apple — declarar "Health & Fitness")
- Sim, o app processa dados de saúde para prestação do serviço médico.
- **Não** usa dados de saúde para publicidade/marketing.

## Terceiros processadores (listar na política de privacidade)
Supabase (backend/BD), Mercado Pago (pagamentos), WhatsApp/Evolution/WAHA
(mensageria), Firebase (push), Sentry (erros), Memed (prescrição), VIDAAS/ICP
(assinatura digital), CompreFace (biometria KYC).

## Links obrigatórios
- Política de Privacidade: https://aloclinica.com.br/privacy
- LGPD / Portal do titular: https://aloclinica.com.br/privacidade/portal
- Exclusão de conta: https://aloclinica.com.br/meus-dados (documente o fluxo — Apple/Google exigem exclusão de conta acessível)
