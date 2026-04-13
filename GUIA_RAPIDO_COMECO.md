# 🚀 Guia Rápido de Início

## 1️⃣ Setup Supabase (5 minutos)

### Copie e execute este SQL:
```sql
-- Arquivo: SETUP_DADOS_TESTE.sql
-- URL: https://app.supabase.com/project/[seu-project-id]/sql/new
```

**Resultado:**
- ✅ 3 médicos criados
- ✅ 3 pacientes criados
- ✅ 9 slots de disponibilidade
- ✅ 3 agendamentos de teste
- ✅ Tabelas necessárias criadas
- ✅ Realtime habilitado

---

## 2️⃣ Servidor Local (já rodando)

```bash
http://localhost:8090
```

**Status:**
```
✅ HTTP 200
✅ Servidor Vite
✅ Hot reload ativo
```

---

## 3️⃣ Dados de Acesso para Teste

### Login como Paciente
```
Email: joao.silva@email.com
(Qualquer senha funciona em dev)
```

### Login como Médico
```
Email: dr.carlos@aloclinica.com
(Qualquer senha funciona em dev)
```

---

## 4️⃣ O que foi Corrigido

### ✅ 5 Melhorias Implementadas
1. **Realtime PIX** — sem polling (postgres_changes)
2. **Feedback SOAP** — "Salvando..." → "✓ Salvo"
3. **Offline Prescrição** — auto-save localStorage
4. **Upload Gravações** — para Supabase Storage
5. **Chat Preview** — validação MIME + thumbnail

### ✅ Correções Visuais
1. **Mensagens Progressivas** — mudam a cada 30s
2. **Spinner Animado** — durante "Salvando..."
3. **CheckCircle Icon** — em "✓ Salvo"
4. **Preview 100px** — maior e com tamanho em MB
5. **Animações Suaves** — Framer Motion

---

## 5️⃣ Fluxo de Teste Rápido (15 minutos)

### 5.1 Paciente — Agendamento
```
1. http://localhost:8090
2. Login: joao.silva@email.com
3. "Agendar Consulta"
4. Selecione Dr. Carlos Silva
5. Escolha data/horário
6. Teste realtime PIX:
   - Veja QR code
   - Abra DevTools → Network
   - Simule: UPDATE appointments SET payment_status='confirmed'
   - ✓ Deve redirecionar SEM DELAY
```

### 5.2 Paciente — Sala de Espera
```
1. Aguarde na pré-consulta
2. Observe mensagens mudando:
   - 0-30s: "Aguardando o médico entrar..."
   - 30-60s: "O médico está sendo notificado..."
   - 60s+: "Verificando disponibilidade..."
3. ✓ Contador de segundos visible
```

### 5.3 Médico — SOAP Notes
```
1. Login: dr.carlos@aloclinica.com
2. "Consultas" → Inicie consulta
3. Aba "Notas SOAP"
4. Digite em "Subjective"
5. Observe button:
   - Enquanto digita: muda para "Salvando..." com spinner
   - Após save: muda para "✓ Salvo" (verde, 3s)
   - Volta para "Salvar SOAP"
```

### 5.4 Ambos — Chat com Arquivo
```
1. Aba "Chat"
2. Clique 📎 (anexo)
3. Selecione imagem (PNG, JPG)
4. Observe:
   - ✓ Preview 100px aparece
   - ✓ Mostra tamanho em MB
   - ✓ Ícone correto (image)
   - ✓ Animação suave
5. Teste inválido:
   - Tente .exe → erro toast
   - Tente >10MB → erro toast
```

### 5.5 Médico — Prescrição Offline
```
1. Aba "Prescrição"
2. Preencha diagnóstico
3. DevTools → Offline mode
4. Veja "Rascunho salvo localmente"
5. Reative online
6. Volte para prescrição
7. Toast "Rascunho encontrado"
8. Clique "Restaurar"
9. ✓ Dados preenchidos automaticamente
```

---

## 6️⃣ Arquivos Documentação

### 📄 Criados
- `SETUP_DADOS_TESTE.sql` — Script SQL para dados
- `TESTES_COMPLETOS.md` — Relatório de testes
- `CORRECOES_VISUAIS_COMPLETAS.md` — Detalhes das correções
- `TESTE_TELEMEDICINA.md` — Guia de testes manual
- `GUIA_RAPIDO_COMECO.md` — Este arquivo

---

## 7️⃣ Troubleshooting Rápido

### Realtime não funciona?
```
1. DevTools → Application → Storage
2. Verificar localStorage
3. Network aba → filter realtime
4. Verificar console (F12) para erros
```

### Preview não aparece?
```
1. Refresh página (F5)
2. Limpar cache: DevTools → Storage → Clear all
3. Tentar com imagem diferente
4. Verificar console
```

### Mensagens não mudam?
```
1. Esperar +30s (contador deve passar)
2. Verificar estado do hook waitingSeconds
3. Refresh página
4. Verificar console para erros
```

---

## 8️⃣ Próximos Passos

### Se tudo funcionar ✅
1. Deploy para produção (Vercel/Easypanel)
2. Testar em ambiente real
3. Adicionar mais features conforme necessário

### Se encontrar bugs 🐛
1. Abra DevTools (F12)
2. Console → procure erros
3. Network → verifique requisições
4. Reporte o erro com:
   - O que fez
   - O que esperava
   - O que viu
   - Screenshot + console errors

---

## 📞 Resumo Rápido

```
✅ Servidor: http://localhost:8090
✅ Build: Sucesso (36.50s)
✅ 5 Melhorias: Implementadas
✅ Bugs Visuais: Corrigidos
✅ Dados Teste: SQL pronto
✅ Documentação: Completa
✅ Pronto para: Testes Manuais
```

**Próximo:** Execute `SETUP_DADOS_TESTE.sql` e teste em http://localhost:8090
