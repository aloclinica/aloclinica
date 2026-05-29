# Criar contrato B2G/B2B real — checklist + template SQL

Para incluir um cliente real (prefeitura, secretaria, empresa) na plataforma.
Aplica-se a B2G (governo) e B2B (empresas privadas).

---

## 0. Antes de começar

- Você precisa do **e-mail do gestor** que vai administrar o contrato.
- Decida: **gratuito patrocinado** (cliente paga, paciente não) ou **copart** (paciente paga parcial).
- Especialidades cobertas (lista ou todas).
- Cota total (em consultas) e validade (data fim).

---

## 1. Convidar o gestor para criar conta

Envie por e-mail o link:

```
https://aloclinica.com.br/medico/cadastro
```

Ou crie a conta manualmente (admin) com role `contract_manager`:

```sql
-- (Admin) cria usuário gestor + role contract_manager
-- Use a Auth API do Supabase no Dashboard ou crie via signup público
-- e depois adicione a role:

INSERT INTO public.user_roles (user_id, role)
VALUES ('<UUID_DO_GESTOR>', 'contract_manager'::public.app_role)
ON CONFLICT DO NOTHING;
```

---

## 2. Criar o contrato

```sql
INSERT INTO public.contratos (
  nome,
  tipo,                       -- 'prefeitura' | 'secretaria' | 'ong' | 'empresa' | 'sindicato'
  status,                     -- 'ativo'
  cota_total,                 -- NULL = sem limite
  cota_utilizada,
  valor_consulta,             -- valor que a plataforma cobra do cliente por consulta consumida
  vigencia_inicio,
  vigencia_fim,               -- NULL = sem prazo
  modelo_cobranca,            -- 'gratuito_patrocinado' | 'copart_50_50' | 'voucher_avulso'
  especialidades_permitidas,  -- ARRAY['Clínica Geral','Cardiologia',...] ou NULL = todas
  subdominio,                 -- 'orgaos' | 'parceiros' | 'acoes' | 'empresas' | NULL
  managed_by_user_id,         -- UUID do gestor (passo 1)
  branding,                   -- jsonb com cores e logo do cliente (opcional)
  dominio_proprio             -- NULL ou ex.: 'saudecidadesp.gov.br'
) VALUES (
  'Prefeitura Municipal de Exemplo',
  'prefeitura',
  'ativo',
  5000,                       -- 5 mil consultas no total
  0,
  80.00,                      -- R$ 80 por consulta para a prefeitura
  '2026-06-01',
  '2027-05-31',               -- 1 ano de vigência
  'gratuito_patrocinado',
  ARRAY['Clínica Geral','Pediatria','Cardiologia','Psiquiatria'],
  'orgaos',
  '<UUID_DO_GESTOR>',
  '{"primary":"#0066CC","logo_url":"https://..."}'::jsonb,
  NULL
);
```

---

## 3. Cadastrar beneficiários

### 3.1. Por CPF (modelo prefeitura — cidadão se identifica)

```sql
INSERT INTO public.contrato_beneficiarios (contrato_id, cpf, nome, ativo)
VALUES
  ('<CONTRATO_ID>', '12345678900', 'João da Silva', true),
  ('<CONTRATO_ID>', '98765432100', 'Maria Souza', true);
-- ... ou via INSERT em batch a partir de CSV
```

Quando esses CPFs criarem conta na AloClínica, a função `meu_contrato_ativo()` reconhece automaticamente e libera o agendamento sem pagamento.

### 3.2. Por voucher (modelo campanha — qualquer um com o código)

Usar a **importação CSV** no painel do órgão (botão "Importar vouchers" em cada contrato). Formato:

```csv
codigo,usos_maximos,validade_fim,descricao
SAUDE2026A,1,2026-12-31,Campanha junho
SAUDE2026B,1,2026-12-31,Campanha junho
...
```

---

## 4. Criar departamentos (opcional, só B2B)

```sql
INSERT INTO public.contrato_departamentos (contrato_id, nome, cota_total, cota_utilizada, ativo)
VALUES
  ('<CONTRATO_ID>', 'Recursos Humanos', 500, 0, true),
  ('<CONTRATO_ID>', 'TI',                300, 0, true),
  ('<CONTRATO_ID>', 'Operações',         200, 0, true);
```

Cada beneficiário pode ser vinculado a um departamento; a cota do departamento decrementa automaticamente.

---

## 5. Conferir tudo

```sql
SELECT
  c.nome,
  c.tipo,
  c.modelo_cobranca,
  c.cota_total,
  c.cota_utilizada,
  (SELECT COUNT(*) FROM public.contrato_beneficiarios WHERE contrato_id = c.id AND ativo) AS beneficiarios_ativos,
  (SELECT COUNT(*) FROM public.vouchers WHERE contrato_id = c.id AND ativo) AS vouchers_ativos,
  (SELECT COUNT(*) FROM public.contrato_departamentos WHERE contrato_id = c.id AND ativo) AS departamentos
FROM public.contratos c
WHERE c.id = '<CONTRATO_ID>';
```

---

## 6. Acesso do gestor

Gestor entra em **https://orgaos.aloclinica.com.br** (ou outro subdomínio configurado) com o e-mail/senha cadastrado. Vai ver:

- **Tab Contratos** — KPIs (consultas, beneficiários, medição mensal, % cota).
- **Tab Saúde da população** — painel epidemiológico anonimizado com IA insights.
- **Tab Departamentos** — CRUD de subdivisões.
- **Botão Importar vouchers** em cada contrato.

---

## 7. Modelos de cobrança suportados

| Modelo | Como funciona |
|---|---|
| `gratuito_patrocinado` | Cliente paga 100% da consulta para a plataforma. Paciente não paga nada. |
| `copart_50_50` | Cliente paga 50%, paciente paga 50% via MP. Configurável por contrato. |
| `voucher_avulso` | Cliente compra X vouchers, cada um vale 1 consulta. Paciente usa o código. |

---

## 8. Faturamento

A plataforma gera **medição mensal** em `consulta_contrato` (cada linha = 1 consulta consumida com valor repassado). O admin emite NF para o cliente no dia 5 com o relatório do mês anterior.

```sql
-- Relatório mensal do contrato
SELECT
  c.nome AS contrato,
  COUNT(cc.id) AS consultas_mes,
  SUM(cc.valor_repassado) AS valor_a_receber
FROM public.consulta_contrato cc
JOIN public.contratos c ON c.id = cc.contrato_id
WHERE cc.created_at >= date_trunc('month', now() - interval '1 month')
  AND cc.created_at < date_trunc('month', now())
GROUP BY c.id, c.nome;
```

---

## 9. Encerrar um contrato

```sql
UPDATE public.contratos
SET status = 'encerrado', vigencia_fim = now()
WHERE id = '<CONTRATO_ID>';
```

Beneficiários permanecem no DB com `ativo=false` e os históricos de consultas já realizadas ficam preservados conforme CFM 1.821/2007 (retenção 20 anos).

---

**Última atualização:** 2026-05-29 — versão do código: `666b8907`.
