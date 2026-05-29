# Guia rápido do médico — AloClínica

Bem-vindo(a). Este documento te ensina, em **15 minutos**, a usar as ferramentas
de IA e produtividade da plataforma. Se você sabe usar um e-mail, sabe usar isto.

---

## 1. Primeiro acesso

1. Você recebeu o link e a senha temporária. Acesse `/medico` e troque a senha.
2. Complete o KYC facial e verifique seu CRM. A aprovação é até 24h.
3. Configure sua agenda em **"Disponibilidade"** — dias da semana e horários.
4. Em **"Perfil"**, conecte sua **conta Mercado Pago** para receber direto na sua conta (split 90/10 automático). Sem isso, o repasse acontece via PIX configurado em **"Carteira"**.

---

## 2. Durante a teleconsulta

A sala tem uma barra superior com todas as ferramentas. Use **atalhos do teclado** para ganhar tempo:

| Tecla | Ação |
|---|---|
| **M** | Mutar / ativar microfone |
| **V** | Câmera on/off |
| **C** | Abrir chat com o paciente |
| **N** | Prontuário SOAP |
| **I** | **IA Clínica** ⭐ |
| **S** | Tela dividida (vídeo + prontuário) |
| **P** | Picture-in-Picture (vídeo flutuante) |
| **?** | Ver esta lista na tela |

### 2.1 IA Clínica (tecla **I**)

Painel lateral com 9 botões. Use o que precisar a qualquer momento:

- **Resumir exames** — cole o laudo ou anexe foto/PDF; ela destaca alterações.
- **Diagnóstico diferencial** — gera 3-6 hipóteses com CID-10 e ranking.
- **Interações** — cole a lista de medicamentos; ela analisa em segundos.
- **Sugerir conduta** — plano terapêutico, exames, encaminhamento.
- **Anamnese dirigida** — sugere perguntas específicas para a queixa.
- **Apoio posológico** — doses pediátricas e ajuste renal.
- **Resumo p/ paciente** — versão simplificada para o paciente entender.
- **Gerar SOAP** — preenche o prontuário automaticamente; você revisa e ajusta.
- **Pergunte à IA** — campo livre para qualquer dúvida clínica.

**Memória do paciente:** se já houve consultas anteriores na plataforma, a IA puxa automaticamente o histórico das últimas 3 (SOAP, prescrições, exames) e usa no contexto.

> ⚠️ A IA é **apoio à decisão**. A conduta final é sempre sua.

### 2.2 Receita digital

Botão **Receita** abre o formulário **dentro da chamada** (você não sai do vídeo).

- Enquanto você digita os medicamentos, um **banner de interações aparece automaticamente** se houver risco.
- **Templates**: salve textos que você usa com frequência (orientações pós-IVAS, dieta para hipertensos, etc.) com o botão "Salvar" ao lado de cada campo. Depois insira com 1 clique.
- **Memed integrado**: receita digital com assinatura ICP-Brasil válida juridicamente.

### 2.3 Atestado e Exames

Mesmo padrão: botões **Atestado** e **Exames** abrem o formulário sem sair da chamada. Templates também funcionam.

### 2.4 Gravação e captura

- **Gravar**: precisa do consentimento expresso do paciente (CFM 2.314/2022). A plataforma te lembra disso ao clicar. Arquivo gerado localmente — você baixa ao final.
- **Capturar**: salva uma foto do vídeo do paciente (útil para dermatologia, lesões visuais).

---

## 3. Após a teleconsulta

Na tela "Consulta Encerrada":

- **Gerar resumo clínico final (IA)** — briefing estruturado em 8 seções (Motivo / Hipóteses / Conduta / Pendências) que você copia ou anexa ao prontuário.
- **Enviar ao paciente** — gera versão simplificada e envia como notificação in-app.
- **Solicitar exames** e **Abrir prontuário** — atalhos.

---

## 4. Painel do dia

Quando você abre a home pela manhã:

- **Resumo do dia (IA)** — clique em "Gerar". A IA monta um briefing executivo dos pacientes do dia: queixas mais comuns, severidade média, sinais de atenção.
- **Live Queue** — pacientes aguardando na sala. O **badge "Alto risco"** indica probabilidade alta de no-show — vale confirmar presença por WhatsApp antes.
- **Cmd+K** (ou Ctrl+K) — busca instantânea por paciente, consulta ou receita.

---

## 5. Calendário e sincronização

Em **Calendário**, botão **Sincronizar** te dá um link de iCal para colar no:

- **Google Calendar**: "+" ao lado de "Outras agendas" → "Por URL"
- **Apple Calendar**: Arquivo → Nova assinatura de calendário
- **Outlook**: Adicionar calendário → Assinar da web

Sua agenda atualiza sozinha nos próximos dias.

---

## 6. Protocolos clínicos pessoais

Em **Protocolos** você cria regras "SE...ENTÃO" que a IA aplica automaticamente:

> **SE** queixa contém "dor de cabeça" **E** severidade ≥ 7
> **ENTÃO** sugerir Neurologia, urgência alta, observação "verificar sinais de meningite"

Útil para você padronizar conduta entre seus pacientes.

---

## 7. Renovação de receita 1-clique

Quando um paciente seu pede renovação:

- Notificação chega via push e in-app.
- Você abre `/dashboard/prescription-renewals`.
- Vê: receita original + 3 respostas do paciente (continua tomando? sintomas mudaram? efeitos colaterais?).
- Clica **"Renovar 1-clique"** — nova receita assinada com 30 dias gerada e enviada ao paciente.

Tempo médio do médico: **~30 segundos por renovação**.

---

## 8. Frequência de repasse

Em **Ganhos**, escolha quando você quer receber:

- **Diário** (D+1 útil)
- **Semanal** (toda segunda)
- **Mensal** (dia 5)

O sistema cria a solicitação de saque sozinho na data. Se você conectou o Mercado Pago, o dinheiro já cai direto na sua conta no momento do pagamento (split 90/10).

---

## 9. Boas práticas

- **TCLE registrado**: cada consulta exige o paciente confirmar o termo. Não há como pular.
- **Prontuário obrigatório**: salve o SOAP antes de encerrar — fica registrado por 20 anos (CFM 1.821/2007).
- **Em emergência**: a IA detecta sinais de risco (dor torácica grave, AVC, ideação suicida) e te alerta. Em todos os casos, oriente SAMU 192.
- **Não substitua exame físico** quando o quadro pedir. Encaminhe presencialmente se houver dúvida — a IA também ajuda a redigir o encaminhamento.

---

## 10. Suporte

- **Dúvida clínica sobre o sistema**: chat de suporte (botão no canto inferior).
- **Problema técnico** (vídeo travando, microfone): tente recarregar; se persistir, a sala troca automaticamente para o fallback. Conferir status em **status.aloclinica.com.br** (em breve em `/status`).
- **Emergência operacional**: ligue para o suporte (número no painel).

---

**Pronto.** Você está habilitado(a) para atender. A IA está aí para acelerar o seu raciocínio, não para substituí-lo. Use o quanto quiser — quanto mais usar, mais o sistema aprende com seu padrão de prescrição (via Templates e Protocolos).

Boa consulta!
