# 🧪 Teste Manual - Telemedicina AloClínica

## Preparação
- URL: **http://localhost:8090**
- Abra DevTools (F12) para monitorar Network e Console
- Tenha 2 abas abertas: uma para médico, outra para paciente

---

## 1️⃣ MELHORIA 1 — Realtime Puro (Pagamento PIX)

### Teste: Confirmação de Pagamento em Tempo Real

**Paciente:**
1. Vá para `/paciente` → Agendar Consulta
2. Selecione um médico
3. Escolha data/horário
4. Na tela de pagamento PIX:
   - ✅ QR Code deve aparecer
   - ✅ Contador regressivo mostrando tempo restante
   - Abra DevTools → Network → filtrar por "appointments" (XHR)

**Simulação de Pagamento (em outro terminal):**
```sql
-- Conecte ao Supabase e execute:
UPDATE appointments 
SET payment_status = 'confirmed' 
WHERE id = '[appointment_id]';
```

**Esperado:**
- ✅ Pagamento confirmado **sem delay** (realtime, não 8 segundos)
- ✅ Não há múltiplas requisições a cada 8s (polling removido)
- ✅ Redirecionado para dashboard automaticamente

---

## 2️⃣ MELHORIA 2 — Feedback Visual

### Teste A: SOAP Notes "Salvando..." → "✓ Salvo"

**Médico em Consulta:**
1. Clique em "Consultas" → Inicie consulta (ou use pre-gravada)
2. Vá para aba "Notas SOAP"
3. Digite algo em "Subjective" ou outro campo
4. Aguarde 30 segundos (auto-save)
5. **Esperado:**
   - ✅ Botão "Salvar SOAP" muda para "Salvando..." (com spinner)
   - ✅ Após salvar: muda para "✓ Salvo" (verde por 3s)
   - ✅ Volta para "Salvar SOAP" após 3s

### Teste B: Mensagens Progressivas de Espera

**Paciente (Pré-consulta):**
1. Vá para uma consulta agendada (status "scheduled")
2. Na tela de "Preparação da Chamada":
   - 0-30s: Vê mensagem `"Aguardando o médico entrar..."`
   - 30-60s: Muda para `"O médico está sendo notificado..."`
   - 60s+: Muda para `"Verificando disponibilidade do médico..."`
   - **Esperado:** Mensagem muda em tempo real, barra de progresso animada

---

## 3️⃣ MELHORIA 3 — Prescrição Offline-First

### Teste: Auto-save localStorage

**Médico:**
1. Vá para `/dashboard/prescribe/[appointmentId]`
2. Preencha os campos:
   - Diagnóstico
   - Observações
   - Adicione medicamentos
3. **Sem salvar**, espere 2-3 segundos
4. Abra DevTools → Application → LocalStorage
5. **Esperado:**
   - ✅ Key `prescription_draft_[appointmentId]` aparece
   - ✅ JSON contém diagnóstico, observações, medicamentos
   - ✅ Toast mostra "Rascunho salvo localmente"

### Teste B: Restaurar Rascunho

1. Saia da página (navegue para outra)
2. Volte para `/dashboard/prescribe/[appointmentId]`
3. **Esperado:**
   - ✅ Toast "Rascunho encontrado" com botão "Restaurar"
   - ✅ Clicar "Restaurar" preenche os campos automaticamente
   - ✅ Dados não perdidos se internet caiu

---

## 4️⃣ MELHORIA 4 — Gravação com Servidor

### Teste: Upload de Gravação

**Médico em Consulta:**
1. Na tela de vídeo, clique no botão de "Gravar" (vermelho pulsante `● REC`)
2. Fale algo por 10 segundos
3. Clique para parar gravação
4. **Esperado:**
   - ✅ Toast "✅ Gravação salva"
   - ✅ Link para download da gravação
   - ✅ Arquivo enviado para Supabase Storage (`recordings/` bucket)
5. Verifique no Supabase Dashboard → Storage → `recordings` bucket:
   - ✅ Pasta com `[appointmentId]`
   - ✅ Arquivo `.webm` dentro

**Console Check:**
- Abra DevTools → Network
- Procure por requisição POST para Supabase Storage
- **Esperado:** Status 200-201 (upload bem-sucedido)

---

## 5️⃣ MELHORIA 5 — Chat com Preview e Validação MIME

### Teste A: Preview de Imagem

**Durante Consulta:**
1. Abra aba "Chat"
2. Clique no ícone de anexo (📎)
3. Selecione uma imagem (PNG, JPG, GIF)
4. **Esperado:**
   - ✅ Thumbnail 80px aparece ANTES de enviar
   - ✅ Mostra nome do arquivo
   - ✅ Ícone dinâmico (ImageIcon para imagem)

### Teste B: Validação MIME Type

**Teste com arquivo inválido:**
1. Tente anexar arquivo `.exe` ou `.zip`
2. **Esperado:**
   - ✅ Toast de erro: "Tipo de arquivo não permitido. Use: imagem, PDF ou documento Word"
   - ✅ Arquivo não é anexado

**Teste com arquivo grande:**
1. Tente anexar arquivo > 10MB
2. **Esperado:**
   - ✅ Toast de erro: "Arquivo muito grande (máx. 10MB)"

### Teste C: Ícones Dinâmicos

Anexe diferentes tipos de arquivo:
- **Imagem (PNG/JPG)** → Mostra 🖼️ ImageIcon
- **PDF** → Mostra 📄 FileText
- **Word (.docx)** → Mostra ✅ FileCheck

**Esperado:** Ícone correto para cada tipo

---

## 📊 Fluxo Completo de Telemedicina

### Simulação End-to-End (30 min)

**Paciente:**
```
1. Fazer login → /paciente
2. Agendar Consulta
3. Confirmar pagamento (testar realtime PIX)
4. Entrar na sala de espera
5. Durante consulta:
   - Enviar mensagens no chat (com arquivo)
   - Ver médico digitando SOAP notes
   - Ver badge "✓ Salvo" aparecer
6. Após consulta: avaliar + receber prescrição
```

**Médico:**
```
1. Fazer login → /dashboard
2. Ir para "Consultas"
3. Iniciar video com paciente
4. Durante consulta:
   - Preencher SOAP notes (ver auto-save com feedback)
   - Enviar mensagens no chat
   - Gravar consulta (verificar upload)
5. Após consulta: emitir prescrição
6. Assinar prescrição (digital + QR code)
```

---

## ✅ Checklist de Sucesso

- [ ] Pagamento PIX realtime (sem polling delay)
- [ ] SOAP notes "Salvando..." → "✓ Salvo"
- [ ] Prescrição auto-save localStorage
- [ ] Restauração de rascunho funciona
- [ ] Gravação upload para servidor
- [ ] Preview de imagem em chat
- [ ] Validação MIME type funciona
- [ ] Ícones dinâmicos por tipo de arquivo
- [ ] Mensagens de espera progressivas
- [ ] Assinatura digital com QR code
- [ ] Sem erros no console (F12)
- [ ] Performance aceitável (< 3s load)

---

## 🐛 Problemas Encontrados?

Se encontrar bugs:
1. Abra DevTools (F12)
2. Console → procure por erros em vermelho
3. Network → verifique requisições falhadas
4. LocalStorage → verifique dados salvos

**Reporte:**
- O que você fez
- O que esperava ver
- O que viu realmente
- Print da tela + console errors
