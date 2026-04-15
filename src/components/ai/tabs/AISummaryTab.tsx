import { logError } from "@/lib/logger";
import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClipboardList, Loader2, Search, FileText, AlertCircle, Copy, Check, Download, User, Calendar, Pill, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import jsPDF from "jspdf";

import { AI_URL } from "@/lib/ai";
import { SUPABASE_PUBLISHABLE_KEY } from "@/lib/supabase-config";

interface Props {
  primaryRole: string;
}

const AISummaryTab = ({ primaryRole }: Props) => {
  const { user } = useAuth();
  
  const [patientSearch, setPatientSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [result, setResult] = useState("");
  const [patientData, setPatientData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const fetchPatientData = useCallback(async () => {
    if (!patientSearch.trim() || !user) return;
    setIsFetching(true);
    setPatientData(null);
    setResult("");

    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, date_of_birth, blood_type, allergies, chronic_conditions, phone")
        .or(`first_name.ilike.%${patientSearch}%,last_name.ilike.%${patientSearch}%`)
        .limit(5);

      if (!profiles || profiles.length === 0) {
        setPatientData(null);
        setIsFetching(false);
        return;
      }

      // If multiple results, show list; otherwise auto-select
      if (profiles.length === 1) {
        await loadPatientDetails(profiles[0]);
      } else {
        setPatientData({ multiple: profiles });
      }
    } catch (e) {
      logError("AI tab error", e);
      setPatientData({ error: "Erro ao buscar dados" });
    }
    setIsFetching(false);
  }, [patientSearch, user]);

  const loadPatientDetails = async (patient: any) => {
    setIsFetching(true);
    const [recordsRes, appointmentsRes, prescriptionsRes, metricsRes] = await Promise.all([
      db.from("medical_records")
        .select("title, record_type, description, cid_code, severity, start_date, is_active")
        .eq("patient_id", patient.user_id)
        .order("created_at", { ascending: false })
        .limit(20),
      db.from("appointments")
        .select("scheduled_at, status, notes, duration_minutes")
        .eq("patient_id", patient.user_id)
        .order("scheduled_at", { ascending: false })
        .limit(10),
      db.from("prescriptions")
        .select("diagnosis, medications, observations, created_at")
        .eq("patient_id", patient.user_id)
        .order("created_at", { ascending: false })
        .limit(5),
      db.from("health_metrics")
        .select("type, value, unit, measured_at")
        .eq("patient_id", patient.user_id)
        .order("measured_at", { ascending: false })
        .limit(10),
    ]);

    setPatientData({
      patient,
      records: recordsRes.data || [],
      appointments: appointmentsRes.data || [],
      prescriptions: prescriptionsRes.data || [],
      metrics: metricsRes.data || [],
    });
    setIsFetching(false);
  };

  const generateSummary = useCallback(async () => {
    if (!patientData || patientData.error || patientData.multiple) return;
    setIsLoading(true);
    setResult("");

    const { patient, records, appointments, prescriptions, metrics } = patientData;

    const prompt = `Gere um resumo clínico completo e estruturado:

**Paciente:** ${patient.first_name} ${patient.last_name}
**Data de Nascimento:** ${patient.date_of_birth || "Não informada"}
**Tipo Sanguíneo:** ${patient.blood_type || "Não informado"}
**Alergias:** ${patient.allergies?.join(", ") || "Nenhuma registrada"}
**Condições Crônicas:** ${patient.chronic_conditions?.join(", ") || "Nenhuma registrada"}

**Registros Médicos (${records.length}):**
${records.map((r: { record_type?: string; title?: string; cid_code?: string; severity?: string; is_active?: boolean }) => `- ${r.record_type}: ${r.title} ${r.cid_code ? `(CID: ${r.cid_code})` : ""} - ${r.severity || ""} - ${r.is_active ? "Ativo" : "Inativo"}`).join("\n") || "Nenhum registro"}

**Últimas Consultas (${appointments.length}):**
${appointments.map((a: { scheduled_at: string; status: string; notes?: string }) => `- ${a.scheduled_at}: ${a.status} ${a.notes ? `- ${a.notes}` : ""}`).join("\n") || "Nenhuma consulta"}

**Prescrições Recentes (${prescriptions.length}):**
${prescriptions.map((p: { created_at: string; diagnosis?: string; medications?: unknown }) => `- ${p.created_at}: ${p.diagnosis || "Sem diagnóstico"} - Meds: ${JSON.stringify(p.medications)}`).join("\n") || "Nenhuma"}

**Métricas de Saúde (${metrics.length}):**
${metrics.map((m: { type: string; value: number | string; unit?: string; measured_at: string }) => `- ${m.type}: ${m.value} ${m.unit} (${m.measured_at})`).join("\n") || "Nenhuma"}

Estruture em:
1. 📊 **Dados Demográficos e Perfil**
2. 🏥 **Histórico Médico Ativo** (com CIDs)
3. 💊 **Medicamentos em Uso**
4. 📈 **Métricas de Saúde Recentes**
5. 📅 **Consultas Recentes e Evolução**
6. ⚠️ **Alertas e Pontos de Atenção**
7. 📋 **Recomendações para Próxima Consulta**`;

    try {
      const resp = await fetch(AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          role: primaryRole,
          context: "Resumo de prontuário médico",
        }),
      });

      if (!resp.ok) throw new Error("Erro no resumo");
      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              setResult(fullContent);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      logError("AI tab error", e);
      setResult("😕 Erro ao gerar resumo. Tente novamente.");
    }
    setIsLoading(false);
  }, [patientData, primaryRole]);

  const copyResult = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Resumo copiado!");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("ALLO MÉDICO — Resumo Clínico", 105, 15, { align: "center" });
    doc.line(20, 18, 190, 18);

    const patient = patientData?.patient;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Paciente: ${patient?.first_name || ""} ${patient?.last_name || ""}`, 20, 28);
    
    doc.setFontSize(9);
    doc.setTextColor(80);
    const clean = result.replace(/\*\*/g, "").replace(/#{1,6}\s/g, "").replace(/---/g, "");
    const lines = doc.splitTextToSize(clean, 170);
    doc.text(lines, 20, 36);

    doc.save(`resumo-${patient?.first_name || "paciente"}-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("PDF exportado!");
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary" />
            Resumo Inteligente de Prontuário
          </CardTitle>
          <CardDescription className="text-xs">
            Busque um paciente para gerar resumo com dados clínicos, métricas e recomendações.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchPatientData()}
              placeholder="Buscar paciente pelo nome..."
              className="text-sm flex-1"
              disabled={isFetching || isLoading}
            />
            <Button onClick={fetchPatientData} disabled={!patientSearch.trim() || isFetching} className="gap-1.5">
              {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Buscar
            </Button>
          </div>

          {patientData?.error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-xl">
              <AlertCircle className="w-4 h-4" />
              {patientData.error}
            </div>
          )}

          {/* Multiple results */}
          {patientData?.multiple && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Múltiplos pacientes encontrados. Selecione:</p>
              {patientData.multiple.map((p: any) => (
                <button
                  key={p.user_id}
                  onClick={() => loadPatientDetails(p)}
                  className="w-full text-left p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/50 transition-all flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{p.first_name} {p.last_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.date_of_birth ? `Nascimento: ${p.date_of_birth}` : "Sem data de nascimento"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {patientData && !patientData.error && !patientData.multiple && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {patientData.patient.first_name} {patientData.patient.last_name}
                    </p>
                    {patientData.patient.date_of_birth && (
                      <p className="text-xs text-muted-foreground">
                        Nascimento: {new Date(patientData.patient.date_of_birth).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="flex items-center gap-1.5 text-xs p-2 rounded-lg bg-background border border-border/50">
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    <span className="font-medium">{patientData.records.length}</span>
                    <span className="text-muted-foreground">registros</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs p-2 rounded-lg bg-background border border-border/50">
                    <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="font-medium">{patientData.appointments.length}</span>
                    <span className="text-muted-foreground">consultas</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs p-2 rounded-lg bg-background border border-border/50">
                    <Pill className="w-3.5 h-3.5 text-purple-500" />
                    <span className="font-medium">{patientData.prescriptions.length}</span>
                    <span className="text-muted-foreground">prescrições</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs p-2 rounded-lg bg-background border border-border/50">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span className="font-medium">{patientData.metrics.length}</span>
                    <span className="text-muted-foreground">métricas</span>
                  </div>
                </div>
              </div>

              <Button onClick={generateSummary} disabled={isLoading} className="gap-1.5" size="lg">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Gerar Resumo com IA
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base">📋 Resumo do Prontuário</CardTitle>
                  <div className="flex gap-1.5">
                    <Button variant="ghost" size="sm" onClick={copyResult} className="gap-1 text-xs h-8">
                      {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                      Copiar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={exportPDF} className="gap-1 text-xs h-8">
                      <Download className="w-3.5 h-3.5" /> PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AISummaryTab;
