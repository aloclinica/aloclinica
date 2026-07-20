/**
 * Dados institucionais de conformidade (CFM Resolução nº 2.314/2022, Art. 17).
 *
 * Fonte central única dos dados da Pessoa Jurídica e do Responsável Técnico
 * Médico exibidos publicamente (rodapé, página /responsavel-tecnico, documentos).
 *
 * Os valores abaixo refletem os dados reais já divulgados na página
 * /responsavel-tecnico. Substitua por placeholders "[PREENCHER ...]" apenas se
 * os dados oficiais ainda não estiverem disponíveis.
 */
export const COMPLIANCE = {
  razaoSocial: "ALO CLINICA MEDICA LTDA",
  cnpj: "66.474.468/0001-26",
  enderecoSede: "Boa Vista — Roraima, Brasil",
  diretorTecnicoMedico: "Dra. Tâmara Oliveira Vieira",
  diretorTecnicoCRM: "CRM 2352/RR",
  crmPessoaJuridica: "Em processo de inscrição — CRM/RR",
  contatoTecnico: "rt@aloclinica.com.br",
} as const;

export type ComplianceInfo = typeof COMPLIANCE;
