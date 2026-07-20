# Conformidade CFM — Resolução nº 2.314/2022 (Telemedicina)

Mapa da plataforma frente ao **Roteiro de Vistoria para Telemedicina** do CFM.
PJ: **ALO CLINICA MEDICA LTDA** · CNPJ 66.474.468/0001-26 · Boa Vista/RR ·
Responsável Técnica: **Dra. Tâmara Oliveira Vieira (CRM 2352/RR)**.

| Artigo | Requisito | Status | Onde |
|---|---|---|---|
| **Art. 3** | Prontuário: guarda, integridade, sigilo, **irrefutabilidade** | ✅ | RLS por perfil; logs de auditoria; **imutabilidade** (bloqueio de DELETE em tabelas clínicas — migração `20260719010000`) |
| **Art. 3** | Retenção de dados | ✅ (política) | Ver "Retenção" abaixo — guarda mínima 20 anos; DELETE bloqueado |
| **Art. 3 §4** | Terceirização de arquivamento: responsabilidade compartilhada | 🏢 | DPA contratual com o Supabase (provedor) — **pendência jurídica** |
| **Art. 13 a** | Documento: médico nome + CRM + **endereço profissional** | ✅ | `generate-prescription-pdf` / `generate-certificate-pdf`; coluna `doctor_profiles.professional_address` (migração `20260720000000`) |
| **Art. 13 b** | Documento: paciente id + **endereço + local do atendimento** | ✅ | PDFs: endereço de `profiles` + "Local: Telemedicina (remoto)" |
| **Art. 13 c** | Documento: **data e hora** | ✅ | PDFs: "Data e hora de emissão" (fuso America/Sao_Paulo) |
| **Art. 13 d** | Documento: **assinatura ICP-Brasil** | ⚠️ Pendente | Integração **Memed** — requer chaves de produção Memed (ação do cliente). Hoje o PDF declara honestamente que NÃO é assinatura qualificada. |
| **Art. 13 e** | Documento: consta **"modalidade telemedicina"** | ✅ | PDFs: "Documento emitido em modalidade de Telemedicina — Res. CFM 2.314/2022" |
| **Art. 14** | Vídeo síncrono: autorização + identificação | ✅ | TCLE antes da sala; consulta 1:1 (só médico identificado por nome/CRM) |
| **Art. 15** | **TCLE**: telemedicina + transmissão de dados, no prontuário | ✅ | `ConsentTCLE` v2.0, gravado em `patient_consents` |
| **Art. 15 §ún** | Consentimento de compartilhamento + **direito de negar** | ✅ | Texto do TCLE (seção 3) |
| **Art. 17** | PJ Brasil + inscrição CRM + responsável técnico médico | ⚠️ | Dados exibidos (rodapé + /responsavel-tecnico). **CRM-PJ em inscrição** — finalizar registro (ação do cliente) |
| **Art. 19** | Garantia de **atendimento presencial** | ✅ | TCLE (seção 2) informa o direito ao presencial |

## Retenção de dados (Art. 3 / CFM 1.821/2007)
- **Guarda mínima: 20 anos** para prontuário, receitas, atestados e registros clínicos.
- Registros clínicos são **imutáveis** (DELETE bloqueado por RLS RESTRICTIVE para `authenticated`); correções administrativas apenas via `service_role` com trilha de auditoria.
- Recomendação operacional: backup **offsite** (PITR do Supabase) e rotina de verificação de restore.

## Pendências (ação do cliente — não são código)
1. **Assinatura ICP-Brasil (Art. 13 d):** contratar/configurar **Memed** (chaves de produção) — sem isso, receitas não têm assinatura qualificada.
2. **CRM-PJ (Art. 17):** concluir a inscrição da pessoa jurídica no CRM-RR.
3. **DPA (Art. 3 §4):** contrato de tratamento de dados com o Supabase (responsabilidade compartilhada pela guarda).
4. **Endereço profissional dos médicos:** preencher `doctor_profiles.professional_address` de cada médico (ou definir `DOCTOR_PROFESSIONAL_ADDRESS`).
5. **Termo de Uso / Política de Privacidade** revisados por advogado.
