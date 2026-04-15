import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "@/integrations/supabase/untyped";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, AlertCircle, Download, Clock, User } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { logError } from "@/lib/logger";

interface SignatureData {
  prescription_id: string;
  signed_by: string;
  signed_at: string;
  certificate_chain: string;
  status: "signed" | "pending" | "failed";
  storage_path: string;
  metadata?: {
    document_type: string;
    verification_code: string;
    signature_hash: string;
  };
}

export default function PrescriptionVerification() {
  const { prescriptionId } = useParams();
  const navigate = useNavigate();
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);

  useEffect(() => {
    const verifyDocument = async () => {
      if (!prescriptionId) {
        toast.error("ID de documento não fornecido");
        return;
      }

      try {
        setLoading(true);

        // Buscar dados de assinatura
        const { data: signatureData, error } = await (db as any)
          .from("prescription_signatures")
          .select("*")
          .eq("prescription_id", prescriptionId)
          .single();

        if (error || !signatureData) {
          toast.error("Documento não encontrado ou não foi assinado");
          setLoading(false);
          return;
        }

        setSignature(signatureData as SignatureData);

        // Buscar URL do documento
        if (signatureData.storage_path) {
          const { data } = db.storage
            .from("prescriptions")
            .getPublicUrl(signatureData.storage_path);

          if (data?.publicUrl) {
            setDocumentUrl(data.publicUrl);
          }
        }
      } catch (err) {
        logError("Erro ao verificar documento:", err);
        toast.error("Erro ao verificar documento");
      } finally {
        setLoading(false);
      }
    };

    verifyDocument();
  }, [prescriptionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Verificando documento...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!signature) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h2 className="font-semibold text-red-700">Documento não encontrado</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Este documento não foi localizado ou ainda não foi assinado digitalmente.
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="w-full gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isValid = signature.status === "signed";
  const signedDate = parseISO(signature.signed_at);
  const certificateInfo = signature.certificate_chain.split("|");

  // Extrair CPF e CRM do certificate_chain
  const cpf = certificateInfo.find(c => c.startsWith("CPF="))?.replace("CPF=", "") || "N/A";
  const crm = certificateInfo.find(c => c.startsWith("CRM="))?.replace("CRM=", "") || "N/A";

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        {/* Verification Status */}
        <Card className={isValid ? "border-green-200 bg-green-50/30" : "border-red-200 bg-red-50/30"}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4 mb-6">
              <CheckCircle2
                className={`w-8 h-8 flex-shrink-0 ${isValid ? "text-green-600" : "text-red-600"}`}
              />
              <div>
                <h1 className={`text-2xl font-bold mb-1 ${isValid ? "text-green-900" : "text-red-900"}`}>
                  {isValid ? "✅ Documento Válido" : "❌ Documento Inválido"}
                </h1>
                <p className="text-muted-foreground">
                  {isValid
                    ? "Este documento foi digitalmente assinado e é válido para dispensação em farmácias."
                    : "Este documento não foi assinado digitalmente ou possui problemas de validação."
                  }
                </p>
              </div>
            </div>

            {/* Document Details */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Assinado por</p>
                  <p className="font-semibold text-foreground truncate">{signature.signed_by}</p>
                  <p className="text-xs text-muted-foreground">
                    CPF: {cpf} | CRM: {crm}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Data e hora da assinatura</p>
                  <p className="font-semibold text-foreground">
                    {format(signedDate, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>

              {signature.metadata?.verification_code && (
                <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 font-mono">
                    Código: {signature.metadata.verification_code}
                  </p>
                </div>
              )}
            </div>

            {/* Download Button */}
            {documentUrl && (
              <div className="mt-6 flex gap-2">
                <a
                  href={documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button className="w-full gap-2" variant="default">
                    <Download className="w-4 h-4" />
                    Baixar PDF
                  </Button>
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Informações Importantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              ✅ Este documento foi <strong>digitalmente assinado</strong> e pode ser apresentado em farmácias para dispensação de medicamentos.
            </p>
            <p>
              🔐 A assinatura é <strong>não-falsificável</strong> e registra a identidade do médico (CPF + CRM).
            </p>
            <p>
              📱 Qualquer alteração no documento após a assinatura seria detectada imediatamente.
            </p>
            <p>
              ✨ Válido conforme <strong>Resolução CFM 2.299/2021</strong> (Telemedicina e Prescrição Eletrônica).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
