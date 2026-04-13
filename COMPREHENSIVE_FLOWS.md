# 🏥 AloClínica - Fluxos Completos por Tipo de Usuário

## 📋 Índice de Fluxos

1. [PACIENTE](#paciente)
2. [MÉDICO](#médico)
3. [CLÍNICA](#clínica)
4. [LAUDISTA](#laudista)
5. [OFTALMOLOGISTA](#oftalmologista)
6. [ADMIN](#admin)
7. [SUPORTE](#suporte)
8. [RECEPÇÃO](#recepção)
9. [PARCEIRO](#parceiro)

---

## 🧑‍🤝 PACIENTE

### Tipos de Pacientes
- **Telemedicina**: Consultas por vídeo
- **Oftalmologia**: Exames e prescrições oftalmológicas
- **Cartão de Benefícios**: Acesso apenas via cartão

### Fluxo Principal

```
LOGIN (Auth)
    ↓
ONBOARDING (KYC - CPF, Data Nascimento, Telefone)
    ↓
PAINEL PACIENTE (/dashboard/patient)
    ├─ Auto-detecta tipo (telemedicina/oftalmologia/cartao)
    ├─ Mostra seções relevantes
    └─ Ações: Agendar, Urgência, Exames, Receitas, Docs
    ↓
AGENDAR CONSULTA
    ├─ Buscar Médico (/dashboard/doctors)
    ├─ Selecionar Data/Horário
    ├─ Confirmar Detalhes
    ├─ Pagar (PIX/Boleto/Cartão)
    └─ Receber Confirmação
    ↓
SALA DE ESPERA
    ├─ Aguardar Médico
    ├─ Entrada em Vídeo
    └─ Consulta em Tempo Real
    ↓
PÓS-CONSULTA
    ├─ Avaliar Médico (⭐)
    ├─ Baixar Prescrição
    ├─ Histórico de Consultas
    └─ Próxima Consulta (retorno)
```

### Componentes

| Componente | Arquivo | Funcionalidade |
|-----------|---------|-----------------|
| Dashboard | `PatientDashboard.tsx` | Painel principal |
| Buscar Médicos | `DoctorSearch.tsx` | Filtrar por especialidade |
| Agendar | `BookAppointment.tsx` | Booking + pagamento |
| Sala de Espera | `PatientWaitingCard.tsx` | Aguardar consulta |
| Histórico | `AppointmentsList.tsx` | Consultas passadas |
| Saúde | `PatientHealth.tsx` | Métricas de saúde |
| Perfil | `UserProfile.tsx` | Editar dados |

### Rotas Principais

```
/dashboard/patient                    → Painel principal
/dashboard/patient?service=telemedicina   → Força telemedicina
/dashboard/patient?service=oftalmologia   → Força oftalmologia
/dashboard/patient?service=cartao         → Força cartão
/dashboard/schedule                   → Buscar e agendar
/dashboard/schedule/:doctorId         → Booking específico
/dashboard/appointments               → Histórico
/dashboard/appointments/:id           → Detalhe
/dashboard/doctor/:id                 → Perfil do médico
/dashboard/patient/health             → Saúde
/dashboard/patient/documents          → Documentos
/dashboard/patient/dependents         → Dependentes
```

### Estados/Fluxos

```
PROFILE STATES:
├─ incomplete        → Onboarding necessário
├─ pending_kyc       → Verificação em andamento
├─ verified          → Pronto para agendar
└─ active            → Usando plataforma

APPOINTMENT STATES:
├─ scheduled         → Agendado
├─ waiting           → Aguardando em sala
├─ in_progress       → Em consulta
├─ completed         → Finalizado
├─ cancelled         → Cancelado
└─ no_show          → Não compareceu
```

---

## 👨‍⚕️ MÉDICO

### Tipos de Médicos
- **Telemedicina**: Consultas por vídeo
- **Oftalmologia**: Exames
- **Laudista**: Análise de laudos

### Fluxo Principal

```
LOGIN (Auth)
    ↓
KYC (CRM, Especialidade, Preço)
    ↓
ONBOARDING
    ├─ Configurar Disponibilidade
    ├─ Definir Preço
    └─ Submeter para Aprovação
    ↓
PAINEL MÉDICO (/dashboard/doctor)
    ├─ Fila de Espera (pacientes aguardando)
    ├─ Próxima Consulta
    ├─ Status Online/Offline
    └─ Ações: Sala, Receitas, Agenda, Ganhos
    ↓
RECEBER CONSULTAS
    ├─ Notificação de Novo Agendamento
    ├─ Ver Fila em Tempo Real
    └─ Aceitar/Recusar Consulta
    ↓
CONSULTA ATIVA
    ├─ Entrar na Sala de Vídeo
    ├─ Chat com Paciente
    ├─ Compartilhar Tela
    ├─ Fazer Prescrição (Memed)
    └─ Finalizar Consulta
    ↓
PÓS-CONSULTA
    ├─ Receber Pagamento
    ├─ Visualizar Ganhos
    └─ Relatório de Desempenho
```

### Componentes

| Componente | Arquivo | Funcionalidade |
|-----------|---------|-----------------|
| Dashboard | `DoctorDashboard.tsx` | Painel principal |
| Fila Ao Vivo | `LiveQueue.tsx` | Pacientes aguardando |
| Sala de Vídeo | `VideoRoom.tsx` | Consulta ao vivo |
| Agenda | `DoctorCalendar.tsx` | Horários disponíveis |
| Disponibilidade | `DoctorAvailability.tsx` | Configurar slots |
| Receitas | `DoctorPrescriptions.tsx` | Prescrever Memed |
| Ganhos | `DoctorEarnings.tsx` | Faturamento |
| Meus Pacientes | `DoctorPatients.tsx` | Histórico |
| Análises | `DoctorAnalyticsCharts.tsx` | Estatísticas |

### Rotas Principais

```
/dashboard/doctor                     → Painel principal
/dashboard/doctor/waiting-room        → Sala de espera virtual
/dashboard/doctor/waiting-room?appt=ID → Entrar em consulta
/dashboard/doctor/calendar            → Agenda
/dashboard/doctor/availability        → Configurar horários
/dashboard/prescriptions              → Prescrever
/dashboard/earnings                   → Ganhos
/dashboard/doctor/analytics           → Análises
/dashboard/patients                   → Meus pacientes
/dashboard/patients/:id/emr           → Prontuário eletrônico
```

### Estados/Fluxos

```
DOCTOR PROFILE:
├─ pending_approval   → Aguardando aprovação admin
├─ approved           → Ativo na plataforma
├─ inactive           → Inativo/pausado
└─ suspended          → Suspenso por admin

DOCTOR STATUS:
├─ online             → Disponível para consultas
└─ offline            → Não disponível

CONSULTATION STATES:
├─ pending            → Aguardando aceitação
├─ accepted           → Aceita, aguardando hora
├─ waiting            → Paciente na sala
├─ active             → Em andamento
├─ completed          → Finalizada
└─ no_show           → Não compareceu
```

---

## 🏥 CLÍNICA

### Fluxo Principal

```
LOGIN (Auth)
    ↓
CADASTRO CLÍNICA
    ├─ CNPJ/Razão Social
    ├─ Endereço
    └─ Contato
    ↓
PAINEL CLÍNICA (/dashboard/clinic)
    ├─ Exames Enviados
    ├─ Fila de Laudos
    ├─ Meus Pacientes
    └─ Ações: Enviar Exame, Ver Fila
    ↓
ENVIAR EXAME
    ├─ Upload de Imagens/Arquivos
    ├─ Inserir Dados do Paciente
    ├─ Selecionar Tipo de Exame
    └─ Submeter para Laudista
    ↓
ACOMPANHAR LAUDO
    ├─ Ver Status em Tempo Real
    ├─ Receber Notificação
    └─ Baixar Laudo Finalizado
    ↓
GESTÃO
    ├─ Meus Pacientes (CRUD)
    ├─ Horários (Agendamentos)
    ├─ Médicos (Cadastro)
    └─ Relatórios
```

### Componentes

| Componente | Arquivo | Funcionalidade |
|-----------|---------|-----------------|
| Dashboard | `ClinicDashboard.tsx` | Painel principal |
| Enviar Exame | `ClinicExamUpload.tsx` | Upload de exames |
| Fila de Laudos | `LaudistaReportQueue.tsx` | Acompanhar |
| Meus Exames | `ClinicMyExams.tsx` | Histórico |
| Pacientes | `ClinicPatients.tsx` | Gestão de pacientes |
| Horários | `ClinicSchedules.tsx` | Agendamentos |
| Médicos | `ClinicDoctorsManagement.tsx` | Cadastro de médicos |
| Sala de Espera | `ClinicWaitingRoom.tsx` | Pacientes esperando |

### Rotas Principais

```
/dashboard/clinic                     → Painel principal
/clinica/enviar-exame                 → Upload de exames
/clinica/exames                       → Meus exames
/dashboard/clinic/patients            → Pacientes
/dashboard/clinic/schedules           → Horários
/dashboard/clinic/doctors             → Médicos
```

---

## 📋 LAUDISTA

### Fluxo Principal

```
LOGIN (Auth)
    ↓
PAINEL LAUDISTA (/dashboard/laudista)
    ├─ Fila de Exames
    │  ├─ Urgentes (vermelho)
    │  ├─ Normais (azul)
    │  └─ Baixa Prioridade (verde)
    ├─ Ganhos do Mês (com meta)
    ├─ SLA Tracker (prazo)
    └─ Ações: Abrir Exame, Análise
    ↓
RECEBER EXAME
    ├─ Notificação
    ├─ Ver Fila em Tempo Real
    └─ Priorizar por urgência
    ↓
ANALISAR EXAME
    ├─ Visualizar Imagens
    ├─ Editor de Laudo
    ├─ Escrever Análise
    ├─ Descartar/Aprovar
    └─ Assinar Digitalmente
    ↓
LAUDO PRONTO
    ├─ Enviado para Clínica
    ├─ Clínica Notificada
    └─ Contabilizar Ganho
    ↓
RELATÓRIOS
    ├─ Ganhos do Mês
    ├─ Laudos Assinados
    ├─ Tempo Médio
    └─ Avaliação SLA
```

### Componentes

| Componente | Arquivo | Funcionalidade |
|-----------|---------|-----------------|
| Dashboard | `LaudistaDashboard.tsx` | Painel principal |
| Fila | `LaudistaReportQueue.tsx` | Exames aguardando |
| Editor | `LaudistaReportEditor.tsx` | Análise + assinatura |
| Meus Laudos | `LaudistaMyReports.tsx` | Histórico |
| Financeiro | `LaudistaFinanceiro.tsx` | Ganhos |

### Rotas Principais

```
/dashboard/laudista                   → Painel principal
/dashboard/laudista/queue             → Fila de exames
/dashboard/laudista/report-editor/:id → Editar laudo
/dashboard/laudista/my-reports        → Meus laudos
/dashboard/laudista/financeiro        → Ganhos
```

---

## 👀 OFTALMOLOGISTA

### Fluxo Principal

```
LOGIN (Auth)
    ↓
PAINEL OFTALMOLOGISTA (/oftalmologista/dashboard)
    ├─ Fila de Exames para Assinar
    ├─ Stats (Exames Hoje/Mês)
    ├─ Taxa de Acerto
    └─ Ações: Assinar Exame
    ↓
ASSINAR EXAME
    ├─ Visualizar Exame
    ├─ Editor de Prescrição
    ├─ Assinatura Digital
    └─ Enviar
    ↓
CONSULTA
    ├─ Agendar com Paciente
    ├─ Realizar Exame
    ├─ Prescrever
    └─ Gerar Relatório
```

### Componentes

| Componente | Arquivo | Funcionalidade |
|-----------|---------|-----------------|
| Dashboard | `OftalmologistDashboard.tsx` | Painel principal |
| Exames | `OftalmologyExamQueue.tsx` | Fila para assinar |
| Prescrição | `OftalmologyPrescription.tsx` | Editor de RX |

### Rotas Principais

```
/oftalmologista/dashboard             → Painel principal
/oftalmologista/consulta/:id          → Detalhe da consulta
/oftalmologista/consulta/:id/prescricao → Prescrição
```

---

## 🛡️ ADMIN

### Fluxo Principal

```
LOGIN (Auth - Admin Only)
    ↓
PAINEL ADMIN (/dashboard/admin/panel-center)
    ├─ 4 Cartões de Serviço
    │  ├─ Telemedicina (usuários online, stats)
    │  ├─ Oftalmologia (exames, prescrições)
    │  ├─ Telelaudo (fila, ganhos)
    │  └─ Cartão de Benefícios (ativo, desativo)
    ├─ Timeline de Eventos
    ├─ System Health Bar
    └─ Quick Actions
    ↓
CONTROLE CENTRALIZADO
    ├─ Dashboard com KPIs Gerais
    ├─ Aprovações Pendentes
    │  ├─ Médicos (aprovação CRM)
    │  ├─ Clínicas
    │  └─ Laudistas
    ├─ Alertas de Anomalia
    │  ├─ Nenhum médico disponível
    │  ├─ Laudos atrasados >24h
    │  └─ Pacientes com problema
    └─ Ações: Aprovar, Banir, Impersonate
    ↓
GESTÃO DE USUÁRIOS
    ├─ Médicos (Listar, Aprovar, Banir)
    ├─ Pacientes (Listar, Banir)
    ├─ Clínicas (Listar, Aprovar)
    ├─ Laudistas (Listar, Aprovar)
    └─ Suporte (Listar)
    ↓
FINANCEIRO
    ├─ Receita Total
    ├─ Pagamentos a Médicos
    ├─ Inadimplentes
    └─ Relatórios
    ↓
CONFIGURAÇÕES
    ├─ Site (Layout, Cores)
    ├─ Especialidades
    ├─ Cupons
    ├─ PACS
    ├─ Health Check
    └─ WhatsApp
```

### Componentes

| Componente | Arquivo | Funcionalidade |
|-----------|---------|-----------------|
| Dashboard | `AdminDashboard.tsx` | Painel com KPIs |
| Panel Center | `PanelCenter.tsx` | Controle centralizado |
| Médicos | `AdminDoctors.tsx` | Gestão de médicos |
| Pacientes | `AdminPatients.tsx` | Gestão de pacientes |
| Clínicas | `AdminClinics.tsx` | Gestão de clínicas |
| Aprovações | `AdminApprovals.tsx` | Pendências |
| Financeiro | `AdminFinancial.tsx` | Faturamento |
| Saúde | `SystemHealth.tsx` | Status do sistema |

### Rotas Principais

```
/dashboard/admin                      → Painel principal
/dashboard/admin/panel-center         → Controle centralizado
/dashboard/admin/approvals            → Aprovações pendentes
/dashboard/admin/doctors              → Gestão de médicos
/dashboard/admin/patients             → Gestão de pacientes
/dashboard/admin/clinics              → Gestão de clínicas
/dashboard/admin/financial            → Financeiro
/dashboard/admin/health               → Health check
/dashboard/admin/site-config          → Configurações
```

---

## 💬 SUPORTE

### Fluxo Principal

```
LOGIN (Auth)
    ↓
PAINEL SUPORTE (/dashboard/support)
    ├─ Inbox (Chats/Tickets)
    ├─ Usuários Online Agora
    ├─ Alertas de Sistema
    └─ Ações: Responder, Escalate
    ↓
ATENDER PACIENTE/MÉDICO
    ├─ Ver Histórico de Conversas
    ├─ Responder em Tempo Real
    ├─ Enviar Arquivo
    └─ Resolver Ticket
    ↓
CHATBOT SETUP
    ├─ Configurar Respostas Automáticas
    ├─ Palavras-chave
    ├─ Fluxos de Conversa
    └─ Escalonamento
    ↓
RELATÓRIOS
    ├─ Tempo Médio de Resposta
    ├─ Satisfação do Cliente
    ├─ Tickets Resolvidos
    └─ Tickets Abertos
```

### Componentes

| Componente | Arquivo | Funcionalidade |
|-----------|---------|-----------------|
| Dashboard | `SupportDashboard.tsx` | Painel principal |
| Inbox | `SupportInbox.tsx` | Chats/tickets |
| Chat | `ChatComponent.tsx` | Conversa ao vivo |
| Chatbot | `ChatbotConfig.tsx` | Configurar bot |

---

## 📞 RECEPÇÃO

### Fluxo Principal

```
LOGIN (Auth)
    ↓
PAINEL RECEPÇÃO (/dashboard/receptionist)
    ├─ Pacientes para Hoje
    ├─ Agendamentos
    ├─ Fila de Espera
    └─ Ações: Check-in, Call, Finalizar
    ↓
CHECK-IN PACIENTE
    ├─ Buscar Paciente
    ├─ Confirmar Presença
    └─ Enviar para Sala
    ↓
GERENCIAR SALA
    ├─ Fila de Espera
    ├─ Chamar Próximo
    ├─ Tempo de Espera
    └─ Atraso
    ↓
FINALIZAR ATENDIMENTO
    ├─ Marcar como Completado
    ├─ Coletar Avaliação
    └─ Próxima Consulta
```

### Rotas Principais

```
/dashboard/receptionist               → Painel principal
/dashboard/receptionist/patients      → Pacientes hoje
/dashboard/receptionist/queue         → Fila
```

---

## 🤝 PARCEIRO

### Fluxo Principal

```
LOGIN (Auth)
    ↓
PAINEL PARCEIRO (/dashboard/partner)
    ├─ Comissões
    ├─ Usuários Referenciados
    ├─ Relatórios
    └─ Ações: Compartilhar Link, Withdrawal
    ↓
GANHAR COMISSÃO
    ├─ Referir Médico/Clínica
    ├─ Receber Comissão por Signup
    ├─ Rastrear Performance
    └─ Sacar Ganhos
```

---

## 🔄 Fluxos Integrados

### 1. AGENDAMENTO (Paciente → Médico)
```
Paciente Agenda
    ↓
Médico Notificado
    ↓
Médico Aceita/Recusa
    ↓
Paciente Aguarda
    ↓
Consulta ao Vivo
    ↓
Prescrição (se aplicável)
    ↓
Pagamento Processado
    ↓
Avaliação
```

### 2. LAUDO (Clínica → Laudista → Clínica)
```
Clínica Envia Exame
    ↓
Laudista Notificado
    ↓
Laudista Analisa
    ↓
Laudista Assina Digitalmente
    ↓
Clínica Recebe Laudo
    ↓
Paciente Acessa Resultado
```

### 3. PRESCRIÇÃO (Médico → Paciente → Farmácia)
```
Médico Prescreve
    ↓
Paciente Recebe (Email + SMS)
    ↓
Paciente Visualiza
    ↓
Paciente Renova (se return)
    ↓
Farmácia Acessa (opcional)
```

### 4. PAGAMENTO (Paciente → Tesouro)
```
Paciente Inicia Booking
    ↓
Escolhe Método (PIX/Boleto/Cartão)
    ↓
Processamento
    ↓
Confirmação
    ↓
Médico Recebe Notificação
    ↓
Pagamento Diário para Médico
```

---

## 📊 Matriz de Permissões

| Recurso | Paciente | Médico | Clínica | Laudista | Oftalmologista | Admin | Suporte |
|---------|----------|--------|---------|----------|-----------------|--------|---------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Agendar | ✅ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ⚠️ |
| Consulta | ✅ | ✅ | ⚠️ | ❌ | ✅ | ❌ | ❌ |
| Prescrição | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Exame | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Laudo | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Ganhos | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Usuários | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ⚠️ |
| Financeiro | ❌ | ⚠️ | ⚠️ | ⚠️ | ❌ | ✅ | ❌ |

Legend: ✅ Acesso Completo | ⚠️ Acesso Limitado | ❌ Sem Acesso

---

## 🚀 Checklist de Implementação

### Paciente
- ✅ Dashboard com filtro por serviço
- ✅ Auto-detecção de tipo
- ✅ Booking com integração de pagamento
- ✅ Histórico de consultas
- [ ] Chat com médico (pós-consulta)
- [ ] Renovação de receitas automatizada
- [ ] App mobile

### Médico
- ✅ Dashboard com fila ao vivo
- ✅ Sala de vídeo
- ✅ Prescrição (Memed)
- ✅ Ganhos em tempo real
- [ ] Agendamento automático de próximos retornos
- [ ] Integração com PRE/HIS
- [ ] App mobile

### Clínica
- ✅ Upload de exames
- ✅ Acompanhamento de laudo
- ✅ Gestão de pacientes
- [ ] Integração com PACS
- [ ] Relatórios automáticos
- [ ] Portal de pacientes

### Laudista
- ✅ Fila com prioridade
- ✅ Editor de laudo
- ✅ Assinatura digital
- [ ] IA para sugestão de laudo
- [ ] Integração com HIS

### Admin
- ✅ Panel Center centralizado
- ✅ KPIs por serviço
- [ ] BI avançado
- [ ] Alertas automáticos
- [ ] Relatórios agendados

### Suporte
- ✅ Painel de tickets
- [ ] Chatbot com IA
- [ ] Base de conhecimento
- [ ] Automação de respostas

---

## 🔐 Segurança & Compliance

- ✅ LGPD - Proteção de dados
- ✅ Criptografia de senhas (bcrypt)
- ✅ Autenticação 2FA (opcional)
- [ ] Assinatura digital (certificado A1)
- [ ] Histórico de auditoria completo
- [ ] Backup automático

---

## 📈 Próximos Passos

1. **Integração Total**: Conectar todos os fluxos em um único orquestrador
2. **Notificações**: Sistema de notificações em tempo real (WebSocket)
3. **Relatórios**: BI com gráficos e exportação
4. **Mobile**: Apps nativas iOS/Android
5. **IA/ML**: Sugestões inteligentes para médicos e clínicas
6. **Analytics**: Tracking de comportamento do usuário
7. **Marketplace**: Permitir médicos independentes
