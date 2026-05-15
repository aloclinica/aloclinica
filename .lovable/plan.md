## Plano: melhorias nos apps Paciente + Médico

Escopo é amplo (40+ componentes nos dois painéis). Para entregar com qualidade sem quebrar nada, proponho 3 fases focadas. **Confirme a fase 1** e eu já implemento — depois seguimos para a 2 e a 3.

---

### Fase 1 — Visual unificado (impacto imediato, baixo risco)

Aplicar a mesma linguagem visual nos dois dashboards: hero limpo, cards com hierarquia clara, tipografia consistente, motion sutil.

**Paciente (`/dashboard?role=patient`)**
- Hero compacto com saudação + próxima consulta destacada (countdown se < 24h)
- Grid 4 KPIs: consultas, receitas ativas, exames pendentes, dependentes
- Quick actions em "pílulas" maiores (Agendar, Urgência, Pingo IA, Chat, Exames)
- Card de "Próxima consulta" com botão grande "Entrar na sala" quando estiver próximo
- Linha do tempo de saúde colapsável

**Médico (`/dashboard?role=doctor`)**
- Hero com toggle "Disponível agora" em destaque + resumo do dia (consultas, ganhos, NPS)
- Command center: fila ao vivo + próximos horários lado a lado
- Cards de receita, prescrições, pacientes recentes
- Insights da semana (gráfico mini sparkline)

**Padrões compartilhados**
- Espaçamento `gap-6`, raios `rounded-2xl`, sombras suaves `shadow-sm hover:shadow-md`
- Estados vazios ilustrados com Pingo
- Skeletons coerentes em todos os cards
- Mobile: stack vertical com sticky bottom nav

---

### Fase 2 — UX/Fluxo (reduzir cliques)

**Paciente**
- "Continue de onde parou" (consulta em andamento, formulário pré-consulta pendente, receita para renovar)
- Atalho 1-clique para repetir última consulta (mesmo médico/horário)
- Notificações empilhadas no topo com ações inline (Confirmar / Reagendar)
- Onboarding progressivo (barra de % completude do perfil)

**Médico**
- "Próximo paciente" sempre visível no topo durante expediente
- Atalhos de teclado: `n` próximo paciente, `p` prescrição, `r` relatório
- Templates de prescrição/atestado em 1 clique a partir do prontuário
- Agenda: drag-to-reschedule

---

### Fase 3 — Features novas

**Paciente**
- Diário de sintomas com Pingo IA (já existe `SymptomDiary` — integrar ao dashboard)
- Lembretes de medicação com push notification
- Compartilhar prontuário com familiar via link assinado

**Médico**
- Painel de retornos elegíveis (60 dias) com CTA "Convidar para retorno"
- Resumo automático do prontuário antes da consulta (via Claude)
- Indicadores de SLA: tempo médio de resposta, taxa de no-show

---

### Detalhes técnicos

- Sem mudanças de schema (usa tabelas existentes: `appointments`, `prescriptions`, `exam_requests`, `notifications`)
- Reuso dos hooks já prontos: `usePatientDashboard`, `useDoctorDashboard`
- Cliente `db` (untyped) mantido conforme regra do projeto
- Mascote Pingo integrado nos estados vazios e onboarding
- Tokens semânticos do `index.css` — sem cores hardcoded

---

**Posso começar pela Fase 1?** Ou prefere ajustar o escopo (ex: só paciente primeiro, ou pular features novas)?