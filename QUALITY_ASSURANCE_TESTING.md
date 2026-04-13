# 🧪 Plano de Testes de Qualidade Completo - AloClinica

## 📋 Estrutura de Testes

```
TESTES
├── Módulo Oftalmologia (7 páginas)
├── Autenticação & Autorização
├── Fluxos de Pagamento
├── Responsividade (Mobile/Tablet/Web)
├── Performance & PWA
├── Offline Mode
├── Banco de Dados
├── Edge Functions
└── Integração com Supabase
```

---

## 🔍 MÓDULO OFTALMOLOGIA - Testes por Página

### 1. OftalmologistDashboard ✅
**Funcionalidade**: Dashboard médico com estatísticas

**Testes Funcionais**:
- [ ] Load dashboard sem erros
- [ ] Stats cards mostram números corretos
  - [ ] "Próximas Consultas" = consultas com status 'scheduled'
  - [ ] "Completadas" = consultas com status 'completed'
  - [ ] "Prescrições Emitidas" = total prescriptions
- [ ] Tabs funcionam (Próximas/Histórico)
- [ ] Lista de próximas consultas carrega
- [ ] Cada consulta mostra: paciente, data/hora, botão "Abrir"
- [ ] Botão "Abrir" navega para OftalmologyConsultationDetail/:id
- [ ] Histórico mostra consultas completadas
- [ ] Botão "Ver Prescrição" funciona

**Testes de UI**:
- [ ] Gradient background visible
- [ ] Animations smooth (60fps)
- [ ] Hover effects em cards
- [ ] Mobile responsive (sm: 1 col → lg: 2-3 cols)
- [ ] Icons com cores corretas (blue, green, purple)
- [ ] Empty states mostram quando sem consultas

**Testes de Performance**:
- [ ] Carrega em < 2 segundos
- [ ] Animações sem lag
- [ ] Smooth scrolling
- [ ] No memory leaks

---

### 2. BookOftalmologyAppointment ✅
**Funcionalidade**: Agendamento de consultas

**Testes Funcionais**:
- [ ] Página carrega sem erros
- [ ] Dropdown médicos popula corretamente
- [ ] Mostra "CRM: XXXXX" para cada médico
- [ ] Date picker funciona
  - [ ] Min date = amanhã
  - [ ] Max date = 60 dias
  - [ ] Não permite datas passadas
- [ ] Time picker funciona
- [ ] Campo "Motivo" opcional e salva texto
- [ ] Botão "Agendar" desabilitado se campos obrigatórios vazios
- [ ] Agendamento salva em ophthalmology_prescriptions com status 'scheduled'
- [ ] Validação mostra toast de sucesso
- [ ] Erro mostra toast apropriado
- [ ] Redireciona para /meu-perfil/consultas após sucesso

**Testes de Validação**:
- [ ] Erro se médico não selecionado
- [ ] Erro se data não preenchida
- [ ] Erro se hora não preenchida
- [ ] Motivo opcional não causa erro

**Testes de UI**:
- [ ] Gradient background (purple, blue, green cards)
- [ ] Back button funciona
- [ ] Responsive layout mobile first
- [ ] Labels claros e legíveis
- [ ] Focused states visíveis

---

### 3. OftalmologyConsultationDetail ✅
**Funcionalidade**: Registro detalhado de exame

**Testes Funcionais**:
- [ ] Carrega exame existente se disponível
- [ ] Tabs funcionam (Refração/Tonometria/Achados)
- [ ] OD e OS respectivamente com cores blue/green
- [ ] Campos numéricos aceitam decimais (.25)
- [ ] OD/OS Axis 0-180 validado
- [ ] Visual Acuity salva texto livre
- [ ] Tonometria PIO em mmHg
- [ ] Método tonometria (Goldmann, Tonopen, etc)
- [ ] Findings textareas salvam observações
- [ ] Save button funciona
- [ ] Validação campos obrigatórios
- [ ] Toast sucesso/erro mostra
- [ ] Back button retorna

**Testes de Dados**:
- [ ] Esfera/Cilindro/Eixo salvos corretamente
- [ ] Valores NULL se campo vazio
- [ ] AV formatada corretamente (20/20, etc)
- [ ] Tonometria registrada para OD e OS

**Testes de UI**:
- [ ] Tabs com icons (Eye, Microscope, FileText)
- [ ] Color coding: OD blue, OS green, Tonometry red, AV purple
- [ ] Gradient backgrounds por seção
- [ ] Responsive grid (sm:grid-cols-3)
- [ ] Smooth transitions
- [ ] Input focus visible

---

### 4. OftalmologyPrescription ✅
**Funcionalidade**: Emissão de prescrição

**Testes Funcionais**:
- [ ] Carrega dados do exame automaticamente
  - [ ] OD Esfera/Cilindro/Eixo prepopulado
  - [ ] OS Esfera/Cilindro/Eixo prepopulado
- [ ] Tipo prescrição: Óculos/Lente/Ambos funciona
- [ ] Adicionar campo: Distância Pupilar (mm)
- [ ] Recomendação uso: dropdown com opções
- [ ] Data vencimento: date picker
- [ ] Observações: textarea salva texto
- [ ] Emitir prescrição salva em table com doctor_id/patient_id
- [ ] Validação: obrigatórios vs opcionais
- [ ] Success/error toast mostra
- [ ] Redireciona após emissão

**Testes de Dados**:
- [ ] OD/OS dados salvos corretamente
- [ ] Prescrição linked ao exam_id
- [ ] Status prescrição = 'pending' inicialmente
- [ ] Timestamps: prescribed_at preenchido

**Testes de UI**:
- [ ] Color-coded: OD blue, OS green, Additional amber
- [ ] Gradient backgrounds
- [ ] Responsive grids
- [ ] Save icon no botão
- [ ] Back button funciona

---

### 5. PrescriptionDetail ✅
**Funcionalidade**: Visualizar e baixar prescrição

**Testes Funcionais**:
- [ ] Carrega prescrição corretamente
- [ ] Mostra dados do paciente e médico
- [ ] CRM do médico exibido
- [ ] Tipo prescrição: Óculos/Lente traduzido
- [ ] OD/OS refraction mostra valores formatados
  - [ ] Esfera com sinal +/-
  - [ ] Cilindro com sinal
  - [ ] Eixo em graus
  - [ ] Adição se presente
- [ ] Distância pupilar em mm
- [ ] Recomendação uso exibida
- [ ] Data validade mostra
- [ ] Badge "VENCIDA" se expirado
- [ ] Observações mostram se preenchidas
- [ ] Download PDF funciona
  - [ ] Arquivo salva com nome correto
  - [ ] PDF renderiza corretamente
  - [ ] Contém todos dados prescrição

**Testes de Status**:
- [ ] Prescrição válida: sem badge
- [ ] Prescrição vencida: badge vermelho "VENCIDA"
- [ ] Data expiração formatada pt-BR

**Testes de UI**:
- [ ] Color blocks: OD blue, OS green
- [ ] Status indica validade
- [ ] Responsive 2-column layout
- [ ] Download button funciona
- [ ] Back button retorna
- [ ] Loading state mostra spinner

---

### 6. PatientOftalmologyExams ✅
**Funcionalidade**: Histórico de exames e prescrições

**Testes Funcionais**:
- [ ] Tabs funcionam (Exames/Prescrições)
- [ ] Exames tab:
  - [ ] Lista todos exames do paciente
  - [ ] Ordem descending by date
  - [ ] Mostra data, doutor, valores refração
  - [ ] "Ver Detalhes" navega para detalhe
- [ ] Prescrições tab:
  - [ ] Lista todas prescrições
  - [ ] Badge "VENCIDA" se expirado
  - [ ] Opacity reduzida se vencida
  - [ ] "Ver/Baixar" funciona
  - [ ] Tipo prescrição mostra

**Testes de Empty States**:
- [ ] Exames vazio: dashed border blue, mensagem
- [ ] Prescrições vazio: dashed border green, mensagem

**Testes de UI**:
- [ ] Gradient background
- [ ] Tabs com icons
- [ ] Color-coded cards (blue OD, green OS, purple AV)
- [ ] Red vencimento badge
- [ ] Mobile responsive tabs
- [ ] Smooth animations
- [ ] Staggered card entrance

---

### 7. PrescriptionReviewerDashboard ✅
**Funcionalidade**: Aprovar/rejeitar prescrições

**Testes Funcionais**:
- [ ] Stats cards mostram contadores corretos
  - [ ] Pendentes = status NULL ou 'pending'
  - [ ] Aprovadas = status 'approved'
  - [ ] Rejeitadas = status 'rejected'
- [ ] Tabs funcionam (Pendentes/Aprovadas/Rejeitadas)
- [ ] Pendentes tab:
  - [ ] Lista prescrições não revisadas
  - [ ] Mostra textarea notas
  - [ ] Botão "Rejeitar" + "Aprovar"
  - [ ] Rejeitar requer notas (validação)
  - [ ] Aprovar salva status + data revisão
- [ ] Aprovadas tab:
  - [ ] Mostra prescrições aprovadas
  - [ ] Sem botões de ação
- [ ] Rejeitadas tab:
  - [ ] Mostra prescrições rejeitadas
  - [ ] Sem botões de ação
- [ ] Update prescription com review_status/reviewed_by/reviewed_at

**Testes de Validação**:
- [ ] Erro se rejeitar sem notas
- [ ] Notas salvam para ambos (approve/reject)
- [ ] Toast sucesso/erro mostra

**Testes de UI**:
- [ ] Stat cards animados (color-coded)
- [ ] Gradient background
- [ ] Status badges (green/red/amber)
- [ ] Responsive tabs mobile
- [ ] Icon badges com contadores
- [ ] Smooth transitions

---

## 🔐 Autenticação & Autorização

### Login Tests
- [ ] Login paciente funciona
- [ ] Login médico funciona
- [ ] Login admin funciona
- [ ] Login revisor funciona
- [ ] Invalid credentials mostra erro
- [ ] Session persiste após refresh
- [ ] Logout funciona
- [ ] Protected routes redireciona se não autenticado

### Role-Based Access Control (RBAC)
- [ ] Paciente: acesso a /agendar/oftalmologia, /meu-perfil/exames-oftalmologicos
- [ ] Médico: acesso a /oftalmologista/dashboard, /oftalmologista/consulta/:id
- [ ] Revisor: acesso a /revisor/prescricoes
- [ ] Admin: acesso a todos painéis
- [ ] Rota protegida redireciona se role incorreta

### RLS Policies
- [ ] Paciente vê só seus exames/prescrições
- [ ] Médico vê só suas consultas
- [ ] Revisor vê prescrições de todos
- [ ] Dados sensíveis não expostos na API

---

## 💳 Fluxos de Pagamento

### Subscription Types
- [ ] Free tier: acesso limitado
- [ ] Premium: consultoria individual
- [ ] Clinic: múltiplos usuários

### Payment Gateway Tests

#### Stripe Integration
- [ ] Card payment aceita cards válidos
- [ ] Erro para card inválido
- [ ] 3D Secure flow funciona (se habilitado)
- [ ] Webhook recebe pagamento confirmado
- [ ] Subscription criada após pagamento
- [ ] Billing history salvo

#### PayPal Integration (se configurado)
- [ ] Redirect funciona
- [ ] Callback salva pagamento
- [ ] Erro handling se cancelado

### Invoice & Receipt
- [ ] Invoice gerada após pagamento
- [ ] Receita enviada por email
- [ ] PDF pode ser baixado
- [ ] Dados corretos (paciente, procedimento, valor)

### Refund Tests
- [ ] Refund solicitação funciona
- [ ] Status atualiza para 'refunded'
- [ ] Reembolso aparece em conta (se aplicável)
- [ ] Email notificação enviada

---

## 📱 Responsividade & Devices

### Mobile (< 640px)
- [ ] iPhone 12 (390x844)
  - [ ] OftalmologistDashboard responsive
  - [ ] BookOftalmologyAppointment single column
  - [ ] OftalmologyConsultationDetail stacked tabs
  - [ ] PatientOftalmologyExams tabs responsive
  - [ ] Touch buttons 48px min
  - [ ] No horizontal scroll
- [ ] iPhone SE (375x667)
  - [ ] Mesmos testes
  - [ ] Fonts legíveis
- [ ] Android (412x915)
  - [ ] OftalmologyPrescription responsive
  - [ ] Inputs acessíveis

### Tablet (640px - 1024px)
- [ ] iPad (768x1024)
  - [ ] 2-column grids
  - [ ] Cards dimensionadas bem
  - [ ] Landscape (1024x768)
- [ ] Tab S (600x960)

### Desktop (> 1024px)
- [ ] Laptop 1920x1080
  - [ ] 3-column grids
  - [ ] Full layout utilizado
- [ ] Ultra-wide 2560x1440
  - [ ] Spacing apropriado
  - [ ] Não stretches muito

### Orientação
- [ ] Portrait: layout otimizado
- [ ] Landscape: layout horizontal
- [ ] Rotate não quebra layout

---

## ⚡ Performance & PWA

### Lighthouse Audit
```bash
npm install -g lighthouse
lighthouse https://aloclinica.vercel.app --view
```

**Target Scores**:
- [ ] Performance: 85+
- [ ] Accessibility: 90+
- [ ] Best Practices: 90+
- [ ] SEO: 95+

### Core Web Vitals
- [ ] LCP < 2.5s (Largest Contentful Paint)
- [ ] FID < 100ms (First Input Delay)
- [ ] CLS < 0.1 (Cumulative Layout Shift)

### PWA Features
- [ ] Installable no Chrome/Firefox
- [ ] Manifest válido
- [ ] Icons show ao instalar
- [ ] Standalone mode funciona
- [ ] Splash screen mostra

### Caching Strategy
- [ ] Google Fonts cached (1 ano)
- [ ] Images cached (30 dias)
- [ ] API responses cached (5 min)
- [ ] Service worker ativo
- [ ] Cache versioning funciona

### Bundle Size
- [ ] Total gzipped < 500 KB
- [ ] Initial JS < 200 KB
- [ ] CSS < 50 KB
- [ ] Lazy chunks carregam on-demand

---

## 🔌 Offline Mode

### PWA Offline
- [ ] App funciona offline (já carregado)
- [ ] Data cached acessível
- [ ] Forms trabalham offline (queue pendente)
- [ ] Sync quando volta online
- [ ] Offline indicator mostra status

### Offline Scenarios
- [ ] Network desligada: app funciona com dados cached
- [ ] Slow 3G: app responsivo
- [ ] Airplane mode: app não trava

---

## 🗄️ Banco de Dados - Testes

### Oftalmology Tables
```sql
-- ophthalmology_exams
SELECT COUNT(*) FROM ophthalmology_exams;
-- Should have test records

-- ophthalmology_prescriptions  
SELECT COUNT(*) FROM ophthalmology_prescriptions;
-- Should have test records

-- ophthalmology_prescription_documents
SELECT COUNT(*) FROM ophthalmology_prescription_documents;
-- Should have test records
```

### RLS Policies
- [ ] ophthalmology_exams: paciente vê só seus
- [ ] ophthalmology_prescriptions: paciente vê seus + médicos veem seu
- [ ] ophthalmology_prescription_documents: seguro com policies

### Migrations Successful
- [ ] 20260413160000_ophthalmology_complete.sql
- [ ] 20260413170000_ophthalmology_notification_column.sql
- [ ] 20260413180000_ophthalmology_prescription_review.sql

---

## 🔧 Edge Functions

### generate-ophthalmology-prescription
```bash
# Test
curl -X POST https://aloclinica.vercel.app/functions/v1/generate-ophthalmology-prescription \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"prescription_id": "xxx"}'
```

- [ ] Retorna HTML válido
- [ ] PDF renderiza corretamente
- [ ] Contém todos dados prescrição
- [ ] Error handling funciona

### notify-expired-prescriptions
- [ ] Cron job roda diariamente
- [ ] Identifica prescrições que expiram em 7 dias
- [ ] Envia notificação via email
- [ ] Marca como notificado
- [ ] Logs registram execução

---

## 🔗 Integração com Supabase

### Authentication
- [ ] Supabase Auth funciona
- [ ] Session gerenciada corretamente
- [ ] Refresh token válido
- [ ] Logout limpa session

### Real-time
- [ ] Subscription para exames funciona
- [ ] Atualizações appear em tempo real
- [ ] Múltiplos clientes sincronizam

### Storage
- [ ] PDFs salvam em storage
- [ ] Prescrições documents vinculados
- [ ] URLs públicas funcionam
- [ ] Cleanup de arquivos antigos

---

## 📊 Teste de Carga (Load Testing)

### Simular Usuários Simultâneos
```bash
npm install -g k6
# Load test script needed
```

- [ ] 10 usuários simultâneos: response < 2s
- [ ] 50 usuários: server responde
- [ ] 100 usuários: sem timeouts
- [ ] Database queries otimizadas

---

## 🌐 Testes de Browser

### Chrome/Chromium
- [ ] Latest version
- [ ] Console sem errors
- [ ] Network tab sem failed requests
- [ ] DevTools responsive design funciona

### Firefox
- [ ] Latest version
- [ ] Sem console errors
- [ ] Performance similar

### Safari (macOS/iOS)
- [ ] Latest version
- [ ] CSS renders corretamente
- [ ] Animations smooth
- [ ] Touch eventos funcionam

### Edge
- [ ] Latest version
- [ ] Compatibilidade similar a Chrome

---

## ♿ Acessibilidade (WCAG 2.1)

### Keyboard Navigation
- [ ] Tab order lógico
- [ ] Focus visible em todos elementos
- [ ] Enter/Space funcionam em buttons
- [ ] Escape fecha modals

### Screen Reader (NVDA/JAWS)
- [ ] Labels linked com inputs
- [ ] ARIA labels presentes
- [ ] Role attributes corretos
- [ ] Live regions para updates

### Color Contrast
- [ ] Text: 4.5:1 (normal), 3:1 (large)
- [ ] UI components: 3:1
- [ ] Links: distinguíveis por cor + underline

### Images & Icons
- [ ] Alt text presente
- [ ] Decorative images hidden (aria-hidden)
- [ ] Icons com aria-label

---

## 📧 Email Notifications

### Prescription Notifications
- [ ] Email enviado após emissão
- [ ] Template correto
- [ ] Links funcionam
- [ ] Pode baixar PDF do email

### Expiration Reminders
- [ ] 7 dias antes: notificação enviada
- [ ] Email contém data expiração
- [ ] CTA para renovar/agendar

### System Notifications
- [ ] Aprovação prescrição: notificação enviada
- [ ] Rejeição: notas incluídas no email
- [ ] Delivery confirmado

---

## 🚨 Error Handling

### Validation Errors
- [ ] Form validation mostra mensagens claras
- [ ] Toast alerts appropriate
- [ ] Error estado visual

### Network Errors
- [ ] Timeout handling
- [ ] Retry logic
- [ ] Offline indicator
- [ ] Fallback UI

### Server Errors
- [ ] 500 error page mostrada
- [ ] Error logged
- [ ] User informed
- [ ] Recovery options offered

### Edge Cases
- [ ] Prescrição não encontrada: 404 handled
- [ ] User não autorizado: 403 handled
- [ ] Expired session: redirect to login
- [ ] Invalid data: validation + error message

---

## 📝 Checklist Resumido de Testes

### ANTES DE DEPLOYMENT

- [ ] Build sem erros: `npm run build`
- [ ] Lint passa: `npm run lint`
- [ ] Testes unitários passam (se houver)
- [ ] Preview funciona: `npm run preview`

### TESTES SMOKE (5 min)

- [ ] Página inicial carrega
- [ ] Login funciona (patient/doctor/admin)
- [ ] OftalmologistDashboard carrega
- [ ] BookOftalmologyAppointment funciona
- [ ] PrescriptionDetail mostra prescrição
- [ ] Download PDF funciona
- [ ] Logout funciona

### TESTES COMPLETOS (30 min)

- [ ] Todos os 7 modules funcionam
- [ ] Mobile responsivo
- [ ] Pagamentos (se aplicável)
- [ ] Offline mode
- [ ] Performance (< 2s load)
- [ ] Sem console errors
- [ ] PWA installable

### TESTES PRODUÇÃO (após deploy)

- [ ] URL em produção carrega
- [ ] Lighthouse audit 85+
- [ ] Teste em múltiplos devices
- [ ] Email notifications enviam
- [ ] Error tracking funciona
- [ ] Analytics trackando

---

## 📋 Resultado de Testes

### Template de Report

```markdown
# QA Report - AloClinica Oftalmology Module
**Data**: 2026-04-13
**Tester**: [Nome]
**Status**: ✅ PASS / ⚠️ NEEDS FIXES / ❌ FAILED

## Resumo
- Testes Passed: X/Y
- Bugs Encontrados: Z
- Performance: OK/SLOW

## Módulo Oftalmologia
- OftalmologistDashboard: ✅
- BookOftalmologyAppointment: ✅
- OftalmologyConsultationDetail: ✅
- OftalmologyPrescription: ✅
- PrescriptionDetail: ✅
- PatientOftalmologyExams: ✅
- PrescriptionReviewerDashboard: ✅

## Issues

### Critical 🔴
(Nenhum encontrado)

### Major 🟠
(Listar se houver)

### Minor 🟡
(Listar se houver)

## Recomendações
- ...

## Sign-off
[✅ Aprovado] ou [❌ Rejeitado]
```

---

**Status Geral**: 🚀 **PRONTO PARA TESTES COMPLETOS**

Próximo: Executar testes conforme checklist acima

