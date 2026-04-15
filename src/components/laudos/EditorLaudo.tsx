import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchExamePorId,
  fetchLaudoPorExame,
  criarLaudo,
  salvarLaudo,
  assinarLaudo,
  buildOhifUrl,
  type AlocExame,
  type AlocLaudo,
} from "@/lib/services/laudos-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, CheckCircle, ExternalLink, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { useDigitalSignature } from "@/hooks/useDigitalSignature";
import { db } from "@/integrations/supabase/untyped";

export default function EditorLaudo() {
  const { exameId } = useParams<{ exameId: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { signPrescription, signing: signingDigital } = useDigitalSignature();

  const [exame, setExame] = useState<AlocExame | null>(null);
  const [laudo, setLaudo] = useState<AlocLaudo | null>(null);
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);
  const [isDigitallySignedNow, setIsDigitallySignedNow] = useState(false);
  const [doctorName, setDoctorName] = useState("");
  const [doctorCRM, setDoctorCRM] = useState("");

  useEffect(() => {
    if (!exameId || !user) return;
    (async () => {
      try {
        const e = await fetchExamePorId(exameId);
        if (!e) { toast.error("Exame não encontrado"); navigate("/laudos/fila"); return; }
        setExame(e);

        let l = await fetchLaudoPorExame(exameId);
        if (!l) l = await criarLaudo(exameId, user.id);
        setLaudo(l);
        setHtml(l.conteudo_html);

        // Load doctor info
        const { data: doctorData } = await db
          .from("doctor_profiles")
          .select("full_name, crm, crm_state")
          .eq("user_id", user.id)
          .single();

        if (doctorData) {
          setDoctorName(doctorData.full_name || "");
          setDoctorCRM(`${doctorData.crm}/${doctorData.crm_state}`);
        }
      } catch {
        toast.error("Erro ao carregar exame");
      } finally {
        setLoading(false);
      }
    })();
  }, [exameId, user, navigate]);

  const handleSave = useCallback(async () => {
    if (!laudo) return;
    setSaving(true);
    try {
      await salvarLaudo(laudo.id, html);
      toast.success("Laudo salvo!");
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }, [laudo, html]);

  const handleSign = useCallback(async () => {
    if (!laudo || !exame) return;
    if (!html.trim()) { toast.error("O laudo não pode estar vazio"); return; }
    setSigning(true);
    try {
      await salvarLaudo(laudo.id, html);
      await assinarLaudo(laudo.id, exame.id);
      toast.success("Laudo assinado com sucesso!");
      navigate("/laudos/fila");
    } catch {
      toast.error("Erro ao assinar");
    } finally {
      setSigning(false);
    }
  }, [laudo, exame, html, navigate]);

  const handleSignWithDigital = useCallback(async () => {
    if (!laudo || !exame || !user || !profile) return;
    if (!html.trim()) { toast.error("O laudo não pode estar vazio"); return; }
    setSigning(true);
    try {
      // 1. Salvar laudo
      await salvarLaudo(laudo.id, html);

      // 2. Assinar via sistema tradicional
      await assinarLaudo(laudo.id, exame.id);

      // 3. Assinar digitalmente com SHA256
      const laudoContent = JSON.stringify({
        tipo: "Laudo",
        exame: exame.tipo_exame,
        medico: doctorName,
        crm: doctorCRM,
        conteudo: html.substring(0, 500), // primeiros 500 chars
        timestamp: new Date().toISOString(),
      });

      const base64Content = btoa(laudoContent);

      const signedDoc = await signPrescription({
        fileName: `laudo-${exame.id}.pdf`,
        fileBase64: base64Content,
        doctorName,
        doctorCRM,
        doctorCPF: profile.cpf || "CPF_NAO_DISPONIVEL",
        prescriptionId: laudo.id,
        documentType: "report",
      });

      if (!signedDoc) {
        toast.error("Erro ao assinar digitalmente");
        return;
      }

      setIsDigitallySignedNow(true);
      toast.success("✅ Laudo assinado digitalmente com sucesso!");
      setTimeout(() => navigate("/laudos/fila"), 1500);
    } catch (err) {
      toast.error("Erro ao assinar laudo");
      console.error(err);
    } finally {
      setSigning(false);
    }
  }, [laudo, exame, html, user, profile, doctorName, doctorCRM, navigate, signPrescription]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  if (!exame || !laudo) return null;

  const isReadOnly = laudo.status === "assinado" || laudo.status === "entregue";

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/laudos/fila")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">
            Laudo — {exame.tipo_exame}
          </h1>
          <Badge variant={isReadOnly ? "default" : "secondary"}>
            {laudo.status}
          </Badge>
        </div>
        {exame.orthanc_study_uid && (
          <a
            href={buildOhifUrl(exame.orthanc_study_uid)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" /> Abrir no OHIF Viewer
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* OHIF Viewer iframe */}
        {exame.orthanc_study_uid && (
          <Card className="overflow-hidden">
            <CardHeader className="py-2 px-4">
              <CardTitle className="text-sm">Imagens DICOM</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <iframe
                src={buildOhifUrl(exame.orthanc_study_uid)}
                className="w-full h-[500px] border-0"
                title="OHIF Viewer"
                allow="fullscreen"
              />
            </CardContent>
          </Card>
        )}

        {/* Editor */}
        <Card className={exame.orthanc_study_uid ? "" : "lg:col-span-2"}>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">Conteúdo do Laudo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder="Digite o conteúdo do laudo aqui..."
              className="min-h-[400px] font-mono text-sm"
              disabled={isReadOnly}
            />

            {!isReadOnly && (
              <div className="flex gap-2 justify-end flex-wrap">
                <Button variant="outline" onClick={handleSave} disabled={saving || signingDigital || isDigitallySignedNow}>
                  <Save className="h-4 w-4 mr-1" />
                  {saving ? "Salvando…" : "Salvar Rascunho"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSign}
                  disabled={signing || signingDigital || isDigitallySignedNow}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {signing ? "Assinando…" : "Assinar"}
                </Button>
                <Button
                  onClick={handleSignWithDigital}
                  disabled={signing || signingDigital || isDigitallySignedNow}
                  className={`${
                    isDigitallySignedNow
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  } text-white`}
                >
                  {signingDigital || signing ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : isDigitallySignedNow ? (
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                  )}
                  {signingDigital || signing ? "Assinando…" : isDigitallySignedNow ? "✅ Assinado" : "🔐 Assinar com ICP-Brasil"}
                </Button>
              </div>
            )}

            {isReadOnly && laudo.qr_token && (
              <p className="text-xs text-muted-foreground">
                QR Token de validação: <code className="bg-muted px-1 rounded">{laudo.qr_token}</code>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
