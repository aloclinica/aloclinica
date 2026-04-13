# Oftalmologia - Setup & Deploy

## 1. Migrations
Execute as migrations no Supabase:
```
supabase db push
```

Migrations criadas:
- `20260413160000_ophthalmology_complete.sql` — tabelas principais
- `20260413170000_ophthalmology_notification_column.sql` — coluna para notificações

## 2. Edge Functions
Deploy as functions:
```
supabase functions deploy generate-ophthalmology-prescription
supabase functions deploy notify-expired-prescriptions
```

## 3. Cron Job para Notificações
Configure no console do Supabase (Database > Cron) ou via arquivo `supabase/cron_jobs.yaml`:

```yaml
- name: notify-expired-prescriptions
  function: notify-expired-prescriptions
  schedule: '0 9 * * *'  # Diariamente às 9am
```

Ou execute manualmente:
```bash
curl -X POST https://<SUPABASE_URL>/functions/v1/notify-expired-prescriptions \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json"
```

## 4. Dependencies Frontend
Instale html2pdf para gerar PDFs:
```bash
npm install html2pdf.js
npm install --save-dev @types/html2pdf.js
```

## 5. Rotas Disponíveis

### Médico Oftalmologista
- `/oftalmologista/dashboard` — dashboard com consultas
- `/oftalmologista/consulta/:appointmentId` — detalhes da consulta e exame
- `/oftalmologista/consulta/:appointmentId/prescricao` — emitir prescrição

### Paciente
- `/agendar/oftalmologia` — agendar consulta
- `/meu-perfil/exames-oftalmologicos` — histórico de exames e prescrições
- `/meu-perfil/prescricao/:prescriptionId` — visualizar/baixar prescrição

## 6. Email Templates
Adicione template `prescription_expiring` em `send-email` function:
```json
{
  "type": "prescription_expiring",
  "to": "patient@email.com",
  "data": {
    "doctor_name": "Dr. Silva",
    "expiry_date": "15/05/2026"
  }
}
```

## 7. Fluxo Completo

**Médico:**
1. Acessa `/oftalmologista/dashboard`
2. Clica em consulta agendada
3. Preenche exame oftalmológico (refração, tonometria, achados)
4. Clica "Emitir Prescrição"
5. Preenche prescrição (óculos/lentes)
6. Sistema salva prescrição

**Paciente:**
1. Clica "Agendar Consulta Oftalmológica"
2. Seleciona médico, data, horário
3. Após consulta, recebe notificação
4. Acessa `/meu-perfil/exames-oftalmologicos`
5. Visualiza exame e prescrição
6. Baixa PDF da prescrição

**Automação:**
- Cron job diário verifica prescrições vencendo em 7 dias
- Envia notificação in-app + email
- Marca prescrição como notificada

## 8. Customizações Futuras

- [ ] Integrar com sistema de pagamento para marcação de lentes
- [ ] Dashboard para revisor - validar prescrições
- [ ] Relatórios de saúde oftalmológica
- [ ] Integração com óticas parceiras
- [ ] Agendamento automático de check-ups (30 dias após prescrição)
- [ ] OCR para validar documento ao agendamento (KYC)

## 9. Troubleshooting

**PDF não gera:**
- Verifique se html2pdf está instalado
- Confira se edge function está deployed
- Verifique CORS headers

**Notificações não chegam:**
- Verifique se cron job está ativo
- Confira coluna `notified` foi criada
- Verifique logs da edge function

**Prescrição com dados incorretos:**
- Verifique se refração foi salva no exame
- Confira se doctor_id está correto
