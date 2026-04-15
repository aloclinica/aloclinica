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

    // First try document_verifications via secure RPC (no direct table access)
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

    // Then try prescriptions by ID
    const { data: prescription } = await db
      .from("prescriptions")
      .select("id, created_at, diagnosis, medications, doctor_id, patient_id")
      .eq("id", docId)
      .maybeSingle();

    if (prescription) {
      const { data: doc } = await db
        .from("doctor_profiles")
        .select("crm, crm_state, user_id")
        .eq("id", prescription.doctor_id)
        .maybeSingle();

      let doctorName = "Médico";
      if (doc) {
        const { data: p } = await db
          .from("profiles")
          .select("first_name, last_name")
          .eq("user_id", doc.user_id)
          .maybeSingle();
        if (p) doctorName = `Dr(a). ${p.first_name} ${p.last_name}`;
      }

      setResult({
        type: "prescription",
        id: prescription.id,
        doctor_name: doctorName,
        crm: doc ? `${doc.crm}/${doc.crm_state}` : null,
        created_at: prescription.created_at,
        diagnosis: prescription.diagnosis,
        medications: prescription.medications,
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
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 shrink-0" />
                <div>
                  <p className="font-bold text-emerald-600 text-sm">✅ Documento Autêntico</p>
                  <p className="text-xs text-muted-foreground">Emitido pela plataforma AloClínica</p>
                </div>
              </div>

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
                {result.diagnosis && (
                  <div className="flex justify-between p-2 rounded-lg bg-background/60">
                    <span className="text-muted-foreground">Diagnóstico</span>
                    <span className="font-medium text-foreground">{result.diagnosis}</span>
                  </div>
                )}
                {result.medications && (
                  <div className="flex justify-between p-2 rounded-lg bg-background/60">
                    <span className="text-muted-foreground">Medicamentos</span>
                    <Badge variant="secondary">{Array.isArray(result.medications) ? result.medications.length : 0} item(s)</Badge>
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
