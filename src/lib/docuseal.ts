import { db } from "@/integrations/supabase/untyped";

export async function criarDocumentoParaAssinar(
  pdfBase64: string,
  nomeDoc: string,
) {
  const { data, error } = await db.functions.invoke("docuseal-proxy", {
    body: {
      action: "create_template",
      pdf_base64: pdfBase64,
      nome_doc: nomeDoc,
    },
  });
  if (error) throw new Error(error.message || "Erro ao criar template DocuSeal");
  if (!data?.template_id) throw new Error("Template ID não retornado");
  return data.template_id as number;
}

export async function enviarParaAssinatura(
  templateId: number,
  medicoEmail: string,
  medicoNome: string,
) {
  const { data, error } = await db.functions.invoke("docuseal-proxy", {
    body: {
      action: "create_submission",
      template_id: templateId,
      email: medicoEmail,
      nome: medicoNome,
    },
  });
  if (error) throw new Error(error.message || "Erro ao criar submissão DocuSeal");
  return data as { submission_id: number; signing_url: string };
}

export async function verificarAssinatura(submissionId: number) {
  const { data, error } = await db.functions.invoke("docuseal-proxy", {
    body: {
      action: "check_submission",
      submission_id: submissionId,
    },
  });
  if (error) throw new Error(error.message || "Erro ao verificar assinatura");
  return data as {
    status: string;
    completed: boolean;
    documents: Array<{ url: string; filename: string }>;
  };
}
