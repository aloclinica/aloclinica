# Nomeação de DPO (Encarregado pela Proteção de Dados) — LGPD

## Por que é obrigatório

A **Lei 13.709/2018 (LGPD), Art. 41**, exige que toda empresa que trate dados pessoais nomeie um **Encarregado pela Proteção de Dados** (Data Protection Officer — DPO).

Para a AloClínica, isso é **dobradamente crítico** porque tratamos **dados sensíveis de saúde** (Art. 5º, II) — categoria com penalidades agravadas pela ANPD.

## Quem pode ser o DPO

- ✅ **Pessoa física** vinculada à empresa (funcionário, sócio)
- ✅ **Pessoa jurídica terceirizada** (escritório de advocacia ou DPO-as-a-Service)

**Não precisa** ser advogado, mas deve ter:
- Conhecimento de LGPD e regulamentos ANPD
- Conhecimento básico de tecnologia
- Independência para reportar violações
- Capacidade de comunicar-se com titulares de dados

## Atribuições do DPO (Art. 41 §2º LGPD)

1. **Aceitar reclamações** e comunicações de titulares (no canal `dpo@aloclinica.com.br`)
2. **Receber comunicações da ANPD** e adotar providências
3. **Orientar funcionários** sobre práticas LGPD
4. **Executar atribuições** designadas pelo controlador
5. **Reportar incidentes de segurança** à ANPD em até **72 horas**

## Custos

| Modalidade | Custo médio |
|---|---|
| Funcionário interno (parcial) | R$ 0 - R$ 3.000/mês |
| Sócio assumindo | R$ 0 |
| Escritório terceirizado (DPO-as-a-Service) | R$ 800 - R$ 5.000/mês |
| Advogado especializado (consultoria pontual) | R$ 5.000 - R$ 20.000 (one-shot setup) |

**Recomendação para AloClínica em fase inicial:** sócio ou funcionário assume formalmente, contrata escritório especializado para consultoria pontual quando necessário.

---

## TERMO DE NOMEAÇÃO DE DPO (modelo)

**(Ajustar dados e formalizar via assinatura física ou eletrônica ICP-Brasil)**

```
TERMO DE NOMEAÇÃO DE ENCARREGADO PELA PROTEÇÃO DE DADOS PESSOAIS

A empresa [RAZÃO SOCIAL], inscrita no CNPJ nº [CNPJ], com sede em
[ENDEREÇO COMPLETO], doravante denominada "Controladora", neste ato
representada por seu(sua) sócio(a)/administrador(a) [NOME], CPF
[CPF], no uso de suas atribuições legais e

CONSIDERANDO:

a) a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018);

b) a obrigação legal de designar um Encarregado pelo Tratamento de
   Dados Pessoais (DPO), conforme Art. 41 da LGPD;

c) a natureza dos dados pessoais tratados pela empresa, incluindo
   dados sensíveis de saúde de pacientes da plataforma de telemedicina
   AloClínica;

RESOLVE:

Art. 1º - Fica nomeado(a) o(a) Sr(a). [NOME COMPLETO DO DPO], inscrito(a)
no CPF nº [CPF], como ENCARREGADO PELA PROTEÇÃO DE DADOS PESSOAIS (DPO)
da empresa.

Art. 2º - O DPO terá as seguintes atribuições:

I - Aceitar reclamações e comunicações dos titulares de dados;

II - Receber comunicações da Autoridade Nacional de Proteção de Dados
     (ANPD) e adotar providências;

III - Orientar funcionários e contratados sobre as práticas a serem
      tomadas em relação à proteção de dados pessoais;

IV - Executar as demais atribuições determinadas pela Controladora ou
     estabelecidas em normas complementares;

V - Reportar à ANPD, em até 72 (setenta e duas) horas, qualquer
    incidente de segurança que possa acarretar risco ou dano relevante
    aos titulares;

VI - Manter o canal de comunicação dpo@aloclinica.com.br ativo e
     monitorado em horário comercial.

Art. 3º - O DPO terá independência funcional para o exercício de suas
atribuições e acesso direto à mais alta administração da Controladora.

Art. 4º - As informações de contato do DPO são:

- Nome: [NOME COMPLETO]
- Email institucional: dpo@aloclinica.com.br
- Telefone: [TELEFONE]
- Endereço: [ENDEREÇO]

Estas informações serão divulgadas publicamente no website
https://aloclinica.com.br/privacy e no Termo de Uso da plataforma.

Art. 5º - Este Termo entra em vigor na data de sua assinatura e
permanecerá válido até revogação expressa ou destituição do DPO.

[CIDADE], [DATA].

___________________________________
[NOME DO REPRESENTANTE LEGAL]
[CARGO]
[RAZÃO SOCIAL]
CNPJ [CNPJ]

___________________________________
[NOME DO DPO]
ENCARREGADO PELA PROTEÇÃO DE DADOS
CPF [CPF]
```

---

## Próximos passos práticos

1. **Definir quem será o DPO** (você, sócio, funcionário ou terceirizado)
2. **Preencher o termo acima** com os dados reais
3. **Assinar fisicamente** OU via ICP-Brasil (Vidaas grátis para PJ)
4. **Criar email institucional** `dpo@aloclinica.com.br` (Brevo já tem o domínio autenticado, posso criar o forwarding)
5. **Publicar nome + contato do DPO** em `/privacy` e rodapé do site
6. **Comunicar à ANPD** (não obrigatório por enquanto, mas recomendado em incidentes)
7. **Treinar equipe** em LGPD básica
8. **Manter registro de tratamento** (RIPD — Relatório de Impacto à Proteção de Dados)

## Política de comunicação com titulares

O DPO deve responder em **até 15 dias** a qualquer solicitação de titular (Art. 19 LGPD). Para incidentes graves, **48-72h**.

Sugestão de fluxo:
- Titular envia email para `dpo@aloclinica.com.br`
- Auto-resposta confirma recebimento em até 1h
- DPO analisa e responde em 5-15 dias úteis
- Se incidente grave → comunicar ANPD via https://www.gov.br/anpd

## Auditoria e revisão

- Revisar política de privacidade **anualmente** (ou quando houver mudança regulatória)
- Auditar logs de acesso a dados sensíveis **trimestralmente**
- Realizar **DPIA** (Data Protection Impact Assessment) antes de lançar novas features que tratam dados sensíveis
- Manter **registro de operações de tratamento** atualizado (RIPD)
