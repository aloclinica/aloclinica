import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Copy, CheckCircle2, Server, FileText, AlertTriangle, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/integrations/supabase/untyped";
import { SUPABASE_FUNCTIONS_URL } from "@/lib/supabase-config";

const WEBHOOK_URL = `${SUPABASE_FUNCTIONS_URL}/pacs-integration`;

const LUA_SCRIPT = `-- Orthanc Lua Script: Auto-send DICOM studies to Allo Médico
function OnStableStudy(studyId, tags, metadata)
  local payload = {
    action = "orthanc_webhook",
    study_uid = tags["StudyInstanceUID"],
    patient_name = tags["PatientName"],
    modality = tags["Modality"],
    study_description = tags["StudyDescription"],
    priority = "normal",
    webhook_secret = "SEU_TOKEN_AQUI"
  }
  HttpPost("${WEBHOOK_URL}",
    DumpJson(payload),
    { ["Content-Type"] = "application/json" })
end`;

interface RecentExam {
  id: string;
  exam_type: string;
  status: string;
  priority: string;
  source: string | null;
  orthanc_study_uid: string | null;
  created_at: string;
}

const AdminPACSConfig = () => {
  const [recentExams, setRecentExams] = useState<RecentExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinging, setPinging] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchRecentExams = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("exam_requests")
      .select("id, exam_type, status, priority, source, orthanc_study_uid, created_at")
      .order("created_at", { ascending: false })
      .limit(10);
    setRecentExams((data as RecentExam[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchRecentExams(); }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copiado!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const pingWebhook = async () => {
    setPinging(true);
    try {
      const res = await db.functions.invoke("pacs-integration", {
        body: { action: "search_studies" },
      });
      if (res.error) throw res.error;
      toast.success(`Webhook respondeu — ${res.data?.studies?.length ?? 0} exames encontrados`);
    } catch {
      toast.error("Falha ao testar webhook. Verifique os logs.");
    } finally {
      setPinging(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "in_review": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "reported": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configuração PACS / DICOM</h2>
        <p className="text-muted-foreground">Conecte o servidor Orthanc da clínica para receber exames automaticamente.</p>
      </div>

      {/* Webhook URL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Server className="h-5 w-5 text-primary" />
            URL do Webhook
          </CardTitle>
          <CardDescription>Use esta URL no script Lua do Orthanc para enviar exames à plataforma.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm font-mono break-all">
              {WEBHOOK_URL}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(WEBHOOK_URL, "URL")}
            >
              {copied === "URL" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={pingWebhook} disabled={pinging}>
              <RefreshCw className={`h-4 w-4 mr-1 ${pinging ? "animate-spin" : ""}`} />
              Testar Conectividade
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lua Script */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Script Lua para Orthanc
          </CardTitle>
          <CardDescription>
            Cole este script no arquivo de configuração Lua do Orthanc. Substitua <code className="text-xs font-mono bg-muted px-1 rounded">SEU_TOKEN_AQUI</code> pelo token de segurança configurado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <pre className="rounded-md bg-muted p-4 text-xs font-mono overflow-x-auto max-h-72 whitespace-pre-wrap">
              {LUA_SCRIPT}
            </pre>
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => copyToClipboard(LUA_SCRIPT, "Script Lua")}
            >
              {copied === "Script Lua" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Setup Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Como Conectar seu PACS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-3 text-sm text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Instale o Orthanc</span> (gratuito e open-source)
              <br />
              <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded">docker run -p 4242:4242 -p 8042:8042 jodogne/orthanc</code>
            </li>
            <li>
              <span className="font-medium text-foreground">Configure o equipamento de imagem</span> (CR, CT, RM) para enviar exames via DICOM (porta 4242) ao Orthanc.
            </li>
            <li>
              <span className="font-medium text-foreground">Adicione o script Lua</span> acima ao arquivo de configuração do Orthanc para que os exames sejam enviados automaticamente à plataforma.
            </li>
            <li>
              <span className="font-medium text-foreground">Configure o token de segurança</span>: defina o secret <code className="text-xs font-mono bg-muted px-1 rounded">PACS_WEBHOOK_SECRET</code> nas Edge Functions do Supabase e use o mesmo valor no campo <code className="text-xs font-mono bg-muted px-1 rounded">webhook_secret</code> do script Lua.
            </li>
            <li>
              <span className="font-medium text-foreground">Teste</span>: envie um exame de teste pelo equipamento e verifique se aparece na lista abaixo.
            </li>
          </ol>
          <Separator />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ExternalLink className="h-3.5 w-3.5" />
            <a href="https://www.orthanc-server.com/static.php?page=documentation" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">
              Documentação oficial do Orthanc
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Recent Exams */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Últimos Exames Recebidos</CardTitle>
            <CardDescription>Exames recebidos via DICOM Router e upload manual.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchRecentExams} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {recentExams.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum exame recebido ainda.</p>
          ) : (
            <div className="space-y-2">
              {recentExams.map((exam) => (
                <div key={exam.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <div className="space-y-1">
                    <p className="font-medium">{exam.exam_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {exam.orthanc_study_uid ? `UID: ${exam.orthanc_study_uid.slice(0, 20)}…` : "Upload manual"}
                      {" · "}
                      {new Date(exam.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {exam.source === "orthanc" && (
                      <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">DICOM</Badge>
                    )}
                    <Badge variant="outline" className={`text-xs ${statusColor(exam.status)}`}>
                      {exam.status === "pending" ? "Pendente" : exam.status === "in_review" ? "Em análise" : exam.status === "reported" ? "Laudado" : exam.status}
                    </Badge>
                    {exam.priority === "urgent" && (
                      <Badge variant="destructive" className="text-xs">Urgente</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPACSConfig;
