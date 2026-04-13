# 🔐 Assinatura Digital ICP-Brasil - Guia de Implementação

**Data:** 13/04/2026  
**Status:** ✅ Integração Parcial Concluída  
**Provider Recomendado:** Soluti (Doutor Prescreve)  

---

## 📚 Índice

1. [O que foi implementado](#o-que-foi-implementado)
2. [Como funciona](#como-funciona)
3. [Integração com Soluti (próximos passos)](#integração-com-soluti-próximos-passos)
4. [Arquitetura de Segurança](#arquitetura-de-segurança)
5. [Testes](#testes)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 O que foi Implementado

### ✅ Fase 1 - Infraestrutura Pronta

1. **Hook `useDigitalSignature`** (`src/hooks/useDigitalSignature.ts`)
   - Gerencia assinatura de prescrições
   - Integração com Supabase Storage (armazenar PDFs assinados)
   - Metadata de assinatura em banco de dados

2. **Tabela `prescription_signatures`** no Supabase
   ```sql
   - prescription_id (FK)
   - signed_by (nome do médico)
   - signed_at (timestamp)
   - certificate_chain (ICP-Brasil info)
   - status (pending/signed/failed/revoked)
   - soluti_request_id (para rastreamento)
   ```

3. **UI/UX Melhorado em PrescriptionForm**
   - Botão "🔐 Assinar com ICP-Brasil e Salvar"
   - Status visual de assinatura (loading/sucesso/erro)
   - Badge verde confirmando assinatura

4. **Arquitetura Segura**
   - RLS (Row Level Security) no Supabase
   - Médicos só podem assinar suas próprias prescrições
   - Histórico de auditoria completo

---

## 🔄 Como Funciona

### Fluxo Atual (Simulado)

```
1. Médico preenche prescrição
   ↓
2. Clica "🔐 Assinar com ICP-Brasil e Salvar"
   ↓
3. Sistema gera PDF com QR Code real
   ↓
4. Converte PDF para Base64
   ↓
5. Envia para assinatura digital (Soluti simula)
   ↓
6. Recebe PDF assinado com certificado ICP-Brasil
   ↓
7. Salva em Supabase Storage
   ↓
8. Registra metadata em prescription_signatures
   ↓
9. ✅ Prescrição com validade legal
```

### Fluxo de Validação

```
Paciente/Farmácia recebe prescrição
   ↓
Acessa: https://alomedico.com/verificar/{prescriptionId}
   ↓
Sistema valida:
  - ✓ QR Code escaneável
  - ✓ Assinado com certificado ICP-Brasil
  - ✓ Médico é ativo e credenciado
  - ✓ Não foi revogado
   ↓
✅ Prescrição válida para farmácia dispensar
```

---

## 🚀 Integração com Soluti (Próximos Passos)

### Passo 1: Configurar Ambiente

```bash
# .env.local
VITE_SOLUTI_API_KEY=sua_api_key_aqui
VITE_SOLUTI_API_ENDPOINT=https://api.soluti.com.br/v1/sign
VITE_SOLUTI_WEBHOOK_URL=https://seu_backend.com/webhooks/soluti
```

### Passo 2: Implementar Chamada Real à API Soluti

**Arquivo:** `src/hooks/useDigitalSignature.ts` (linha ~110)

```typescript
// Substituir seção TODO por:
const solutiResponse = await fetch(
  import.meta.env.VITE_SOLUTI_API_ENDPOINT,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SOLUTI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      document: req.fileBase64,
      signer: {
        name: req.doctorName,
        crm: req.doctorCRM,
        cpf: doctorProfile?.cpf, // Adicionar CPF do médico
      },
      signatureType: 'ICP_BRASIL_QUALIFIED',
      timestamp: new Date().toISOString(),
    }),
  }
);

if (!solutiResponse.ok) {
  throw new Error(`Soluti API error: ${solutiResponse.statusText}`);
}

const solutiData = await solutiResponse.json();

// solutiData.signed_document (Base64)
// solutiData.certificate_chain (certificado ICP)
// solutiData.request_id (ID para rastreamento)
```

### Passo 3: Criar Edge Function para Webhook

**Arquivo:** `supabase/functions/soluti-webhook/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

serve(async (req) => {
  // Validar assinatura do webhook
  const signature = req.headers.get("x-soluti-signature");
  // Verificar se assinatura é válida...

  const { request_id, status, signed_document } = await req.json();

  const supabase = createClient(...);
  
  // Atualizar status na tabela
  await supabase
    .from("prescription_signatures")
    .update({ 
      status,
      soluti_timestamp: new Date().toISOString(),
    })
    .eq("soluti_request_id", request_id);

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});
```

### Passo 4: Testar com Sandbox Soluti

1. Acesse: https://www.soluti.com.br/doutor-prescreve/
2. Registre seu médico com Bird ID ativo
3. Use as credenciais sandbox para testar

---

## 🔒 Arquitetura de Segurança

### Certificados ICP-Brasil

```
A3 (Qualificado)
├─ CN: Médico Nome
├─ OU: CRM 123456/SP
├─ O: Clínica/Hospital
├─ C: BR
└─ Válido por 1-3 anos

Assinado por:
├─ AC Raiz (Autoridade Certificadora Raiz)
├─ AC-Médicos (subCA especializada)
└─ Verificável em: http://www.iti.gov.br/
```

### RLS Policies

```sql
-- Médicos só assinam suas prescrições
CREATE POLICY "sign_own_prescriptions"
  ON prescription_signatures
  FOR INSERT
  WITH CHECK (
    auth.uid() = (
      SELECT doctor_id FROM prescriptions WHERE id = prescription_id
    )
  );

-- Todos podem ler (verificação pública)
CREATE POLICY "public_read"
  ON prescription_signatures
  FOR SELECT
  USING (true);
```

---

## 🧪 Testes

### Teste 1: Gerar Prescrição Assinada

```bash
# 1. Acessar: http://localhost:5173/dashboard/prescriptions/criar
# 2. Preencher prescrição
# 3. Clicar "🔐 Assinar com ICP-Brasil e Salvar"
# 4. Esperar 2-3 segundos
# 5. ✅ Badge verde deve aparecer: "Assinada com ICP-Brasil"
```

### Teste 2: Verificar Prescrição

```bash
# 1. Copiar URL: https://alomedico.com/verificar/{prescriptionId}
# 2. Compartilhar com paciente
# 3. Paciente acessa URL
# 4. Vê: ✅ Prescrição válida
#        - Médico responsável
#        - Data/hora de assinatura
#        - QR Code verificável
```

### Teste 3: Download de PDF Assinado

```bash
# 1. Clicar "Baixar PDF" após assinar
# 2. Abrir em leitor PDF (Adobe Reader ou Foxit)
# 3. Procurar por: "Signature" ou "Digital Signature"
# 4. ✅ Deve conter certificado ICP-Brasil
```

---

## 🐛 Troubleshooting

### Erro: "Falha ao salvar prescrição assinada"

**Causa:** Permissões de storage no Supabase

**Solução:**
```sql
-- Execute no Supabase SQL Editor:
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;

-- Criar política para prescrições assinadas
CREATE POLICY "allow_sign_prescriptions"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'prescriptions');
```

---

### Erro: "Certificado ICP-Brasil inválido"

**Causa:** Médico não tem Bird ID cadastrado

**Solução:**
1. Acesse: https://www.soluti.com.br/doutor-prescreve/
2. Cadastre-se com seu CRM
3. Ative sua assinatura digital A3
4. Tente novamente

---

### Erro: "Timeout ao assinar"

**Causa:** API Soluti lenta ou offline

**Solução:**
- Implementar retry automático (máx 3 tentativas)
- Aumentar timeout de 30s para 60s
- Implementar fila para re-tentar após 5 minutos

---

## 📊 Métricas para Monitorar

| Métrica | Meta | Observação |
|---------|------|-----------|
| Tempo de assinatura | < 3s | Se > 5s, revisar API Soluti |
| Taxa de sucesso | > 99% | Cada falha gera log para debug |
| Tempo de download | < 500ms | PDFs pré-cache no browser |
| Rejeição de prescrições | < 0.1% | Verificar certificado |

---

## ✅ Checklist Final

- [ ] Variáveis de ambiente Soluti configuradas
- [ ] Tabela `prescription_signatures` criada no Supabase
- [ ] RLS policies implementadas
- [ ] Edge function de webhook criada
- [ ] Testes manuais completados
- [ ] QR Code validado com scanner real
- [ ] Prescrição aceita em farmácia piloto
- [ ] Logs de auditoria funcionando
- [ ] Documentação no CFM atualizada

---

## 🎓 Recursos Adicionais

- [CFM Resolução 2.299/2021 - Telemedicina](https://portal.cfm.org.br/images/PDF/resolucao_2314_2022.pdf)
- [Soluti API Docs](https://www.soluti.com.br/doutor-prescreve/)
- [ICP-Brasil - ITI](http://www.iti.gov.br/)
- [Prescrição Eletrônica CFM](https://prescricaoeletronica.cfm.org.br/)

---

**Próximo Passo:** Integração com Soluti API real (~3-4 horas de trabalho)  
**Impacto:** 🎯 Prescrições com validade legal em todas as farmácias brasileiras

