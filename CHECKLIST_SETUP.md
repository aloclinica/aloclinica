# ✅ Checklist de Setup - Telemedicina AloClínica

## 📌 Status do Projeto

| Item | Status | Responsabilidade |
|------|--------|------------------|
| 5 Melhorias Core | ✅ FEITO | Sistema |
| Bugs Visuais | ✅ CORRIGIDO | Sistema |
| Build TypeScript | ✅ SUCESSO | Sistema |
| Servidor Local | ✅ RODANDO | Sistema |
| Documentação | ✅ COMPLETA | Sistema |
| Dados de Teste | ⏳ PENDENTE | **Você** |
| Testes Manuais | ⏳ PENDENTE | **Você** |

---

## 🎯 Seu Checklist (Agora)

### ☐ Passo 1: Setup Supabase (5 min)
```bash
1. Abra: https://app.supabase.com/project/[seu-project-id]/sql/new
2. Copie tudo de: SETUP_DADOS_TESTE.sql (neste projeto)
3. Cole no Supabase SQL Editor
4. Clique "Run"
5. Verifique resultado ✓
```

**O que será criado:**
- 3 Médicos (com especialidades)
- 3 Pacientes
- 9 Slots de disponibilidade
- 3 Agendamentos de exemplo
- Tabelas necessárias (messages, recordings)
- Realtime habilitado

---

### ☐ Passo 2: Abrir Servidor (já rodando)
```bash
http://localhost:8090
```

**Verificação:**
- [ ] Página carrega (título: "Consultas Médicas Online 24h")
- [ ] DevTools (F12) → Console sem erros críticos
- [ ] Network ativo

---

### ☐ Passo 3: Teste Paciente - Agendamento
```bash
Login:
  Email: joao.silva@email.com
  Senha: (qualquer uma)

Fluxo:
  1. Home → "Agendar Consulta"
  2. Selecionar médico
  3. Escolher data/horário
  4. Ir para pagamento PIX
  
Verificar:
  [ ] QR Code aparece
  [ ] Contador regressivo mostra tempo
  [ ] DevTools → Network → procure por "appointments" (XHR)
  [ ] Abra DevTools → Offline mode
  [ ] Execute no Supabase:
      UPDATE appointments SET payment_status = 'confirmed' 
      WHERE id = '[appointment_id]';
  [ ] Volta online → deve redirecionar SEM DELAY (realtime!)
```

---

### ☐ Passo 4: Teste Paciente - Sala de Espera
```bash
Fluxo:
  1. Estar na tela "Pré-Consulta"
  2. Observar por 2 minutos
  
Verificar:
  [ ] Mensagem começa com: "Aguardando o médico entrar..."
  [ ] Após 30 segundos: "O médico está sendo notificado..."
  [ ] Após 60 segundos: "Verificando disponibilidade..."
  [ ] Contador de segundos está visible
  [ ] Mensagens mudam em tempo real
```

---

### ☐ Passo 5: Teste Médico - SOAP Notes
```bash
Login:
  Email: dr.carlos@aloclinica.com
  Senha: (qualquer uma)

Fluxo:
  1. Dashboard → "Consultas"
  2. Iniciar consulta (pré-gravada ou nova)
  3. Aba "Notas SOAP"
  4. Digite em "Subjective"
  
Verificar:
  [ ] Button muda para "Salvando..." (com spinner girando)
  [ ] Após 2-3s: "✓ Salvo" em verde com checkmark
  [ ] Mostra shadow glow verde
  [ ] Após 3s: volta para "Salvar SOAP"
  [ ] DevTools → localStorage → ver "soap_*" key
```

---

### ☐ Passo 6: Teste Chat - Preview Arquivo
```bash
Fluxo:
  1. Consulta ativa
  2. Aba "Chat"
  3. Clique 📎 (anexo)
  4. Selecione imagem (PNG ou JPG)
  
Verificar (Imagem):
  [ ] Preview aparece (100px de tamanho)
  [ ] Mostra tamanho em MB (ex: "2.54 MB")
  [ ] Ícone correto (🖼️ imagem)
  [ ] Animação suave ao aparecer
  [ ] Pode clicar X para remover
  
Verificar (Inválido):
  [ ] Tente anexar .exe → toast erro
  [ ] Tente anexar >10MB → toast erro
```

---

### ☐ Passo 7: Teste Prescrição - Offline
```bash
Fluxo:
  1. Aba "Prescrição"
  2. Preencha campos:
     - Diagnóstico: "Hipertensão"
     - Observações: "Acompanhamento"
  3. Não clique salvar
  4. DevTools → Offline mode (Network → Offline)
  5. Veja toast "Rascunho salvo localmente"
  6. DevTools → Application → LocalStorage
  7. Procure por "prescription_draft_*"
  8. Verifique JSON com seus dados
  9. DevTools → Volte Online
  10. Recarregue página (F5)
  11. Volte para prescrição
  
Verificar:
  [ ] Toast "Rascunho encontrado" com "Restaurar"
  [ ] Clique "Restaurar"
  [ ] Campos são preenchidos automaticamente
  [ ] Seus dados não foram perdidos!
```

---

### ☐ Passo 8: Build Final
```bash
npm run build
```

Verificar:
- [ ] ✅ built in XX.XXs
- [ ] ✅ Sem erros críticos
- [ ] ✅ PWA gerado
- [ ] ✅ dist/ criado

---

## 🎯 Resultado Esperado

Se tudo passou ✅:
```
✅ Realtime PIX funciona (sem polling)
✅ Mensagens progressivas mudam
✅ SOAP feedback é claro (spinner + checkmark)
✅ Preview arquivo melhorado
✅ Offline-first prescrição funciona
✅ Gravações upload (se testado)
✅ Chat validação MIME OK
✅ Build sem erros
✅ Servidor rodando
```

---

## 🐛 Se Encontrar Problemas

### Realtime não funciona?
```
1. DevTools (F12) → Console
2. Procure por "channel" erro
3. Verifique Supabase realtime habilitado
4. Teste fallback polling (se houver)
```

### Mensagens não mudam?
```
1. Esperar >30s (contador deve passar)
2. Refresh página
3. Verificar waitingSeconds state
4. Ver console para erros
```

### Preview não aparece?
```
1. Refresh (F5)
2. Limpar cache: DevTools → Storage → Clear all
3. Tentar imagem diferente
4. Ver console F12
```

---

## 📚 Documentação Adicional

- **GUIA_RAPIDO_COMECO.md** — Instruções simples
- **CORRECOES_VISUAIS_COMPLETAS.md** — Detalhes técnicos
- **TESTES_COMPLETOS.md** — Relatório final
- **TESTE_TELEMEDICINA.md** — Testes detalhados

---

## ✨ Status Final

| Componente | Status | Data |
|-----------|--------|------|
| Code | ✅ PRONTO | 2026-04-13 |
| Build | ✅ PRONTO | 2026-04-13 |
| Servidor | ✅ PRONTO | 2026-04-13 |
| Docs | ✅ PRONTO | 2026-04-13 |
| **Seu Setup** | ⏳ AGUARDANDO | **Agora** |
| **Seus Testes** | ⏳ AGUARDANDO | **Agora** |

---

**Próximo:** Comece pelo Passo 1 (Setup Supabase) ⬆️
