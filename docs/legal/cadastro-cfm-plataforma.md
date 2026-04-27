# Cadastro da Plataforma AloClínica no CFM

## Base legal

- **Resolução CFM 2.314/2022** (Telemedicina) — Art. 17: toda plataforma de telemedicina deve ser registrada no Conselho Federal de Medicina antes de iniciar operações.
- **Lei 14.510/2022** (Marco Legal Telemedicina)
- **Resolução CFM 2.299/2021** (Prescrição Eletrônica)

## Documentos exigidos

### 1. Pessoa jurídica responsável

- [ ] **Contrato Social** ou **CCMEI** (MEI) atualizado
- [ ] **CNPJ ativo** (consulta receita.fazenda.gov.br)
- [ ] **Certidão Negativa de Débitos** (federal, estadual, municipal)
- [ ] **Comprovante de endereço** da sede

### 2. Diretor Técnico Médico

A plataforma precisa designar **um médico Diretor Técnico** registrado no CRM do estado da sede. Esse médico assume responsabilidade técnica solidária.

- [ ] CRM ativo do médico (cópia carteira + certidão de regularidade do CRM estadual)
- [ ] **Termo de aceite de Direção Técnica** (modelo CRM estadual)
- [ ] CPF + RG do médico
- [ ] Currículo Lattes ou similar

### 3. Documentos técnicos da plataforma

- [ ] **Memorial descritivo** da plataforma (o que faz, como funciona, onde armazena dados)
- [ ] **Política de Segurança da Informação** (LGPD + ISO 27001 sugerido)
- [ ] **Política de Privacidade** (publicada em /privacy)
- [ ] **Termo de Uso** específico para profissionais de saúde
- [ ] **Termo de Consentimento Informado** para pacientes (ver `termo-consentimento-telemedicina.md`)
- [ ] **Diagrama de arquitetura** (servidores Brasil, criptografia, backup)
- [ ] **Plano de Continuidade de Negócio** (BCP) — o que acontece se sistema cair
- [ ] **Plano de Resposta a Incidentes** de segurança
- [ ] **Comprovante de hospedagem em território nacional** (Hostinger Brasil OK; Supabase São Paulo region OK)

### 4. Adequação técnica

- [ ] **Comprovante criptografia em trânsito** (HTTPS/TLS — OK Let's Encrypt)
- [ ] **Comprovante criptografia em repouso** (Supabase faz por padrão; backup também)
- [ ] **Certificado ICP-Brasil** do Diretor Técnico para assinar receitas controladas (Vidaas/Soluti)
- [ ] **Cadastro de software médico ANVISA** (SE for classificado como software como dispositivo médico — opcional para telemedicina simples)

## Procedimento

1. **Preparar dossiê completo** acima (geralmente ~30-50 páginas PDF)
2. **Protocolar no CRM estadual** da sede da empresa (CRM-SP, CRM-RJ, etc — onde está o CNPJ)
3. CRM estadual analisa em **30-60 dias**
4. **Se aprovado**, CRM emite **Certificado de Registro** que deve ser exibido no rodapé do site
5. CRM repassa ao **CFM federal** que indexa no cadastro nacional de plataformas

## Custos estimados

| Item | Custo |
|---|---|
| Taxa CRM estadual (varia) | R$ 500 - R$ 2.000 |
| Diretor Técnico (honorários iniciais) | A negociar |
| Certificado ICP-Brasil A1 | R$ 200 - 400 / ano |
| Advogado especialista (opcional) | R$ 3.000 - 8.000 honorário pacote |

## Onde buscar ajuda

- **CRM-SP** (se sede em SP): https://www.cremesp.org.br
- **CRM do seu estado**: https://www.portalmedico.org.br (seleciona UF)
- **Anadem** (Associação Nacional de Defesa Ética Médica) — orientação rápida
- **SBIS** (Sociedade Brasileira de Informática em Saúde) — selo de qualidade opcional

## Riscos de não fazer

- Multa CRM por exercício irregular (R$ 5k a R$ 50k por médico vinculado)
- Médicos da plataforma podem ter CRM cassado
- Processo civil + criminal (exercício irregular de medicina)
- Bloqueio judicial da plataforma
- Multa LGPD (até 2% faturamento, máx R$ 50 milhões)

## Próximos passos imediatos

1. Definir CNPJ que vai protocolar (qual entidade jurídica é a "AloClínica")
2. Encontrar/contratar Diretor Técnico Médico (médico que assume responsabilidade)
3. Reunir documentos da seção 1 e 2
4. Contratar advogado especialista em direito médico-digital (recomendado) OU usar Anadem
5. Protocolar no CRM estadual
6. **Enquanto aguarda aprovação**, NÃO oferecer telemedicina ao público geral. Pode operar em modo "demo/beta fechado" para tester convidados (sem cobrança).
