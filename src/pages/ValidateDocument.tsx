import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Search, Shield, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ValidateDocument = () => {
  const { id: paramId } = useParams<{ id?: string }>();
  const [searchId, setSearchId] = useState(paramId || "");
  const [result, setResult] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (paramId) handleSearch(paramId);
  }, [paramId]);

  const handleSearch = async (id?: string) => {
    const docId = (id || searchId).trim();
    if (!docId) return;
    setLoading(true);
    setNotFound(false);
    setResult(null);
    setSearched(true);

    // PRIORIDADE 1: Validação canônica via digital_signatures (ICP-Brasil)
    const { data: sigRows } = await (db as any)
      .rpc("validate_signature_public", { p_document_id: docId });
    const signature = sigRows?.[0];
    if (signature) {
      setResult({
        type: signature.document_type,
        doctor_name: signature.doctor_name,
        crm: signature.doctor_crm,
        document_type: signature.document_type,
        patient_name: signature.patient_name,
        created_at: signature.signed_at,
        document_hash: signature.document_hash,
        certificate_alias: signature.certificate_alias,
        is_valid: signature.is_valid,
        revoked_at: signature.revoked_at,
        revoke_reason: signature.revoke_reason,
        code: signature.document_id,
        icp_brasil: true,
      });
      setLoading(false);
      return;
    }

    // PRIORIDADE 2: document_verifications (legado para atestados)
    const { data: verificationRows } = await db
      .rpc("verify_document_public", { p_code: docId });

    const verification = verificationRows?.[0];
    if (verification) {
      setResult({
        type: "certificate",
        doctor_name: verification.doctor_name,
        crm: verification.doctor_crm,
        document_type: verification.document_type,
        patient_name: verification.patient_name,
        created_at: verification.issued_at,
        details: verification.details,
        code: verification.verification_code,
      });
      setLoading(false);
      return;
    }

    // Fallback: receita pelo ID. Um VALIDADOR confirma AUTENTICIDADE (médico, CRM,
    // data), não conteúdo clínico — NÃO expomos diagnóstico/medicamentos aqui (dado
    // sensível LGPD). Terceiros (empregador, farmácia) validam via assinatura
    // ICP-Brasil (prioridade 1); o RLS de prescriptions só deixa o dono/médico ler.
    const { data: prescription } = await db
      .from("prescriptions")
      .select("id, created_at, doctor_id")
      .eq("id", docId)
      .maybeSingle();

    if (prescription) {
      const { data: docJson } = await (db as any)
        .rpc("get_public_doctor_profile", { p_doctor_id: prescription.doctor_id });
      const doc: any = docJson || null;
      const doctorName = doc?.display_name
        ? `Dr(a). ${doc.display_name}`
        : "Médico";

      setResult({
        type: "prescription",
        id: prescription.id,
        doctor_name: doctorName,
        crm: doc?.crm ? `${doc.crm}/${doc.crm_state ?? ""}` : null,
        created_at: prescription.created_at,
      });
      setLoading(false);
      return;
    }

    setNotFound(true);
    setLoading(false);
  };

  const DOC_TYPE_LABELS: Record<string, string> = {
    certificate: "Atestado Médico",
    absence: "Atestado de Afastamento",
    attendance: "Declaração de Comparecimento",
    fitness: "Atestado de Aptidão",
    prescription: "Receita Médica",
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4">
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[hsl(165,50%,97%)] via-[hsl(175,42%,93%)] to-[hsl(185,38%,88%)] dark:from-[hsl(165,25%,7%)] dark:via-[hsl(175,20%,9%)] dark:to-[hsl(185,18%,11%)]" />
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Validador de Documentos</h1>
          <p className="text-sm text-muted-foreground">
            Verifique a autenticidade de receitas, atestados e documentos emitidos pela AloClínica
          </p>
        </div>

        <Card className="border-border">
          <CardContent className="p-4 space-y-3">
            <label className="text-xs font-medium text-foreground">Código do documento</label>
            <div className="flex gap-2">
              <Input
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Ex: AC-M2X9K-AB3F ou UUID..."
                className="font-mono text-sm"
              />
              <Button onClick={() => handleSearch()} disabled={loading || !searchId.trim()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {searched && notFound && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-6 text-center space-y-2">
              <XCircle className="w-12 h-12 text-destructive mx-auto" />
              <p className="font-semibold text-destructive">Documento não encontrado</p>
              <p className="text-xs text-muted-foreground">
                Este código não corresponde a nenhum documento registrado.
              </p>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className={result.is_valid === false ? "border-destructive/30 bg-destructive/5" : "border-emerald-500/30 bg-emerald-500/5"}>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                {result.is_valid === false ? (
                  <XCircle className="w-10 h-10 text-destructive shrink-0" />
                ) : (
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 shrink-0" />
                )}
                <div>
                  <p className={`font-bold text-sm ${result.is_valid === false ? "text-destructive" : "text-emerald-600"}`}>
                    {result.is_valid === false ? "⚠ Assinatura Revogada" : "✅ Documento Autêntico"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {result.icp_brasil ? "Assinado digitalmente com certificado ICP-Brasil (PAdES)" : "Emitido pela plataforma AloClínica"}
                  </p>
                </div>
              </div>

              {result.icp_brasil && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Shield className="w-4 h-4 text-primary shrink-0" />
                  <div className="text-[10px] text-foreground">
                    <p className="font-semibold">ICP-Brasil • PAdES</p>
                    <p className="text-muted-foreground">Conforme Resolução CFM nº 2.299/2021 e MP 2.200-2/2001</p>
                  </div>
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 rounded-lg bg-background/60">
                  <span className="text-muted-foreground">Tipo</span>
                  <Badge variant="secondary">{DOC_TYPE_LABELS[result.document_type || result.type] || result.type}</Badge>
                </div>
                {result.patient_name && (
                  <div className="flex justify-between p-2 rounded-lg bg-background/60">
                    <span className="text-muted-foreground">Paciente</span>
                    <span className="font-medium text-foreground">{result.patient_name}</span>
                  </div>
                )}
                <div className="flex justify-between p-2 rounded-lg bg-background/60">
                  <span className="text-muted-foreground">Médico</span>
                  <span className="font-medium text-foreground">{result.doctor_name}</span>
                </div>
                {result.crm && (
                  <div className="flex justify-between p-2 rounded-lg bg-background/60">
                    <span className="text-muted-foreground">CRM</span>
                    <span className="font-medium text-foreground">{result.crm}</span>
                  </div>
                )}
                <div className="flex justify-between p-2 rounded-lg bg-background/60">
                  <span className="text-muted-foreground">Data de emissão</span>
                  <span className="font-medium text-foreground">
                    {format(new Date(result.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
                {result.certificate_alias && (
                  <div className="flex justify-between p-2 rounded-lg bg-background/60">
                    <span className="text-muted-foreground">Certificado</span>
                    <span className="font-medium text-foreground text-xs">{result.certificate_alias}</span>
                  </div>
                )}
                {result.document_hash && (
                  <div className="p-2 rounded-lg bg-background/60">
                    <p className="text-muted-foreground text-xs mb-1">Hash de integridade (SHA-256)</p>
                    <p className="font-mono text-[9px] text-foreground break-all">{result.document_hash}</p>
                  </div>
                )}
                {result.revoked_at && (
                  <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/30">
                    <p className="text-destructive text-xs font-semibold mb-1">Revogada em {format(new Date(result.revoked_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                    {result.revoke_reason && <p className="text-xs text-muted-foreground">{result.revoke_reason}</p>}
                  </div>
                )}
              </div>

              <div className="text-center pt-2">
                <p className="text-[10px] text-muted-foreground">
                  Código: {result.code || result.id}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <a href="/" className="text-xs text-primary hover:underline">← Voltar ao início</a>
        </div>
      </div>
    </div>
  );
};

export default ValidateDocument;
