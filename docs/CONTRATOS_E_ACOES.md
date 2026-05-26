# Contratos e Ações Sociais

Como a AloClínica suporta **B2C** (paciente paga) + **B2B/B2G** (empresa/prefeitura paga) + **Ações sociais** (patrocinador paga, paciente usa voucher) em uma única plataforma.

## Arquitetura

Mesma base de código, mesmo banco. O que muda é **quem paga** e **como o paciente entra**:

| Subdomínio                       | Modo       | Quem paga       | Entrada do paciente            |
|----------------------------------|------------|-----------------|--------------------------------|
| `aloclinica.com.br`              | particular | Paciente        | Cadastro + MercadoPago         |
| `parceiros.aloclinica.com.br`    | contrato   | Contratante     | Login (CPF na lista de RH)     |
| `acoes.aloclinica.com.br`        | voucher    | Patrocinador    | Código de voucher              |

Subdomínios customizados por contratante (ex.: `prefeitura-x.aloclinica.com.br`) usam o mesmo modo `contrato` — o campo `contratos.subdominio` identifica qual contratante.

## Banco

- `contratos` — empresa/prefeitura/ONG/plano próprio, modelo de cobrança, vigência, cota.
- `contrato_beneficiarios` — CPF/e-mail autorizado a usar o contrato.
- `vouchers` — códigos únicos para ações sociais (validade + nº usos).
- `consulta_contrato` — liga `appointments` → `contratos` para relatório.

## Frontend

- `src/contexts/ContratoContext.tsx` — detecta subdomínio, carrega contrato ativo.
- `useContrato()` — hook usado por qualquer componente para saber se está em modo particular/contrato/voucher.
- `src/pages/ParceirosEntrar.tsx` — login do beneficiário.
- `src/pages/AcoesEntrar.tsx` — entrada de voucher.

## Edge function

- `validate-voucher` — valida código de voucher (validade, usos restantes, contrato ativo) sem consumi-lo.

## Admin

`/dashboard/admin/contratos` — CRUD de contratos, importação de beneficiários por CSV (`email,cpf,nome`), geração de vouchers, controle de status.

## Bypass de checkout (próximo passo)

Em `src/components/patient/BookAppointment.tsx`, antes de invocar MercadoPago:

```ts
const { isContratoMode, contratoAtivo } = useContrato();
if (isContratoMode && contratoAtivo) {
  // 1. cria appointment com status 'pago_por_contrato'
  // 2. cria registro em consulta_contrato { appointment_id, contrato_id, patient_user_id }
  // 3. incrementa contratos.cota_utilizada
  // 4. pula tela de pagamento
  return;
}

// fluxo MercadoPago padrão segue normalmente
```

Mesma lógica para vouchers, lendo `sessionStorage.getItem("aloclinica_voucher")`.

## DNS

No Vercel: apontar `parceiros.aloclinica.com.br` e `acoes.aloclinica.com.br` para o mesmo deploy. Subdomínios customizados por cliente podem ser adicionados conforme contratos forem fechados.

## Relatório (futuro)

Painel em Admin → Relatórios → "Por contrato" agregando `consulta_contrato` JOIN `appointments` para gerar fatura mensal/extrato pré-pago.