# Patient Dashboard Service Type Configuration

## Overview

O painel de paciente (PatientDashboard) é configurado para exibir apenas as seções relevantes baseado no tipo de serviço que o paciente está usando.

## Service Types

### 1. **Telemedicina** (`telemedicina`)
Pacientes que fazem consultas por vídeo chamada.

**Seções visíveis:**
- ✅ Hero com ações
- ✅ Consulta pendente/em andamento
- ✅ Próxima consulta agendada
- ✅ Ações rápidas: Agendar, Urgência, Receitas, Docs
- ✅ KPIs (Resumo): Consultas, Receitas, Documentos, Próximo Retorno
- ✅ Retorno agendado
- ✅ Métricas de saúde (pressão, frequência cardíaca, etc)
- ✅ Dica de saúde diária
- ✅ Receitas ativas com countdown de validade
- ❌ Cartão de benefícios

**Acesso:**
```
/dashboard/patient                          # Auto-detecta se tem histórico
/dashboard/patient?service=telemedicina    # Force explícito
```

---

### 2. **Oftalmologia** (`oftalmologia`)
Pacientes que fazem exames e consultas oftalmológicas.

**Seções visíveis:**
- ✅ Hero com ações
- ✅ Consulta pendente/em andamento
- ✅ Próxima consulta
- ✅ Ações rápidas: Agendar, Exames, Docs
- ✅ KPIs (Resumo)
- ✅ Retorno agendado
- ❌ Métricas de saúde
- ❌ Dica de saúde
- ❌ Receitas ativas
- ❌ Cartão de benefícios

**Acesso:**
```
/dashboard/patient                          # Auto-detecta se tem histórico oftalmologia
/dashboard/patient?service=oftalmologia    # Force explícito
```

---

### 3. **Cartão de Benefícios** (`cartao`)
Pacientes que acessam apenas via cartão de benefícios.

**Seções visíveis:**
- ✅ Hero com ações (minimizado)
- ✅ Cartão de benefícios (DESTAQUE)
  - Status: Ativo/Inativo
  - Preço mensal
  - Desconto aplicável (30%)
  - Link para detalhes
- ✅ Ações rápidas: Agendar
- ❌ Consultas pendentes
- ❌ Próxima consulta
- ❌ KPIs
- ❌ Métricas
- ❌ Receitas
- ❌ Dica de saúde

**Acesso:**
```
/dashboard/patient                          # Auto-detecta se é só cartão
/dashboard/patient?service=cartao          # Force explícito
```

---

### 4. **Todos os serviços** (`all`)
Mostra tudo - sem filtro (experiência completa).

**Seções visíveis:** Todas as seções

**Acesso:**
```
/dashboard/patient?service=all             # Force mostrar tudo
```

---

## Auto-Detection Logic

Quando o usuário acessa `/dashboard/patient` **sem** especificar `?service=`, o sistema:

1. Consulta os últimos 10 agendamentos do paciente (em qualquer status)
2. Analisa o campo `appointment_type` para cada um
3. Detecta o tipo dominante:
   - Se maioria é "telemedicina" ou "video" → `telemedicina`
   - Se maioria é "oftalmologia" → `oftalmologia`
   - Se maioria é "cartao" ou "benefit" → `cartao`
   - Se nenhum dos anteriores → `all` (mostra tudo)

**Cache:** 5 minutos (para evitar múltiplas consultas)

---

## Implementation Details

### Service Detection Hook
```typescript
useDetectPatientService() // Hook no usePatientDashboard.ts
```

### Service Sections Configuration
Definido em `SERVICE_SECTIONS` com as seções para cada tipo:
```typescript
const SERVICE_SECTIONS = {
  telemedicina: { heroActions, pendingAppt, nextAppt, ... },
  oftalmologia: { heroActions, pendingAppt, nextAppt, ... },
  cartao: { heroActions, benefitsCard, ... },
  all: { heroActions, pendingAppt, ..., benefitsCard, ... }
}
```

### Dynamic Quick Actions
```typescript
getQuickActions(serviceType) // Retorna ações específicas por serviço
```

---

## URL Examples

### Paciente de Telemedicina
```
https://aloclinica.com/dashboard/patient
→ Auto-detecta se tem consultas de telemedicina

https://aloclinica.com/dashboard/patient?service=telemedicina
→ Force telemedicina (ignorar auto-detecção)
```

### Paciente de Oftalmologia
```
https://aloclinica.com/dashboard/patient?service=oftalmologia
→ Mostra apenas seções de oftalmologia
```

### Paciente de Cartão
```
https://aloclinica.com/dashboard/patient?service=cartao
→ Destaca cartão de benefícios
```

### Navegação Programática
```typescript
// Ir para telemedicina
navigate("/dashboard/patient?service=telemedicina");

// Ir para oftalmologia
navigate("/dashboard/patient?service=oftalmologia");

// Auto-detectar
navigate("/dashboard/patient");
```

---

## Database Field Requirements

O auto-detection usa:
- `appointments.appointment_type` — deve conter valores como:
  - "telemedicina", "video", "video_call", "consultation"
  - "oftalmologia", "ophthalmology", "eye_exam"
  - "cartao", "benefit", "benefits_card"

---

## Testing

### Test Case 1: Telemedicina
1. Criar múltiplos appointments com `appointment_type = "telemedicina"`
2. Visitar `/dashboard/patient` (sem query param)
3. Verificar se mostra apenas seções de telemedicina

### Test Case 2: Oftalmologia
1. Criar múltiplos appointments com `appointment_type = "oftalmologia"`
2. Visitar `/dashboard/patient` (sem query param)
3. Verificar se mostra apenas seções de oftalmologia

### Test Case 3: Force Override
1. Criar appointments telemedicina
2. Visitar `/dashboard/patient?service=cartao`
3. Verificar se mostra apenas cartão (ignora histórico)

### Test Case 4: Mixed Services
1. Criar appointments: 5x telemedicina, 3x oftalmologia
2. Visitar `/dashboard/patient` (sem query param)
3. Verificar se detecta "telemedicina" (maioria)

---

## Customization

### Adicionar novo serviço
1. Adicionar tipo em `ServiceType`: `export type ServiceType = "... | novoservico"`
2. Adicionar configuração em `SERVICE_SECTIONS`
3. Adicionar lógica de detecção em `useDetectPatientService()`
4. Atualizar `getQuickActions()` se necessário

### Mudar lógica de detecção
Editar em `usePatientDashboard.ts`:
```typescript
export const useDetectPatientService = () => {
  // Modificar lógica aqui
}
```

---

## Performance Notes

- **Cache de detecção:** 5 minutos (configurável em `staleTime`)
- **Limite de appointments analisados:** 10 últimos (configurável em `.limit()`)
- **Renderização condicional:** Usa `{sections.* && <Component />}` para evitar renderizar seções ocultas

---

## Troubleshooting

**Problema:** Paciente vê tudo em vez de só uma seção
- Solução: Verificar se `appointment_type` está preenchido na base de dados

**Problema:** Auto-detection não funciona
- Solução: Verificar se paciente tem appointments recentes no status correto

**Problema:** Query param ignorado
- Solução: Verificar se está em lowercase (`?service=telemedicina` não `?service=Telemedicina`)
