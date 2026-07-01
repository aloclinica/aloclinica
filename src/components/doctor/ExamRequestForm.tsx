import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import { logError } from "@/lib/logger";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getDoctorNav } from "./doctorNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Stethoscope, Send, CheckCircle2 } from "lucide-react";

const EXAMES_COMUNS = [
  "Hemograma completo", "Glicemia de jejum", "Colesterol total e frações",
  "TSH / T4 livre", "Urina tipo I (EAS)", "Raio-X de tórax", "Eletrocardiograma (ECG)",
  "Ultrassom abdominal", "Beta-HCG", "PCR / VHS",
];

const ExamRequestForm = () => {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const appointmentId = params.get("appointment");

  const [patientId, setPatientId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState("");
  const [doctorProfileId, setDoctorProfileId] = useState<string | null>(null);
  const [examType, setExamType] = useState("");
  const [clinicalInfo, setClinicalInfo] = useState("");
  const [priority, setPriority] = useState<"normal" | "alta" | "urgente">("normal");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (user) {
      db.from("doctor_profiles").select("id").eq("user_id", user.id).maybeSingle()
        .then(({ data }: any) => { if (data) setDoctorProfileId(data.id); });
    }
  }, [user]);

  useEffect(() => {
    if (!appointmentId) return;
    db.from("appointments").select("patient_id").eq("id", appointmentId).maybeSingle()
      .then(async ({ data }: any) => {
        if (data?.patient_id) {
          setPatientId(data.patient_id);
          const { data: p } = await db.from("profiles").select("first_name, last_name").eq("user_id", data.patient_id).maybeSingle();
          if (p) setPatientName(`${p.first_name ?? ""} ${p.last_name ?? ""}`.trim());
        }
      });
  }, [appointmentId]);

  const toggleExame = (e: string) => {
    setExamType((prev) => {
      const linhas = prev.split("\n").map((l) => l.trim()).filter(Boolean);
      return linhas.includes(e) ? linhas.filter((l) => l !== e).join("\n") : [...linhas, e].join("\n");
    });
  };

  const submit = async () => {
    if (!doctorProfileId) { toast.error("Perfil médico não encontrado."); return; }
    if (!examType.trim()) { toast.error("Informe ao menos um exame."); return; }
    setSaving(true);
    try {
      const { error } = await db.from("exam_requests").insert({
        patient_id: patientId,
        requesting_doctor_id: doctorProfileId,
        exam_type: examType.trim(),
        clinical_info: clinicalInfo.trim() || null,
        priority,
        status: "pending",
      });
      if (error) throw error;
      setDone(true);
      toast.success("Pedido de exame registrado! ✅");
    } catch (e) {
      logError("exam_request insert", e);
      toast.error("Não foi possível salvar o pedido.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Solicitar Exame" nav={getDoctorNav("exam-request")} role="doctor">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary" /> Solicitar Exame
            </CardTitle>
            {patientName && <p className="text-sm text-muted-foreground">Paciente: <strong>{patientName}</strong></p>}
          </CardHeader>
          <CardContent className="space-y-4">
            {done ? (
              <div className="text-center py-8 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <p className="font-semibold">Pedido de exame registrado.</p>
                <p className="text-sm text-muted-foreground">O paciente verá a solicitação no painel dele.</p>
                <Button variant="outline" onClick={() => { setDone(false); setExamType(""); setClinicalInfo(""); }}>Novo pedido</Button>
              </div>
            ) : (
              <>
                <div>
                  <Label className="mb-2 block">Exames comuns (clique para adicionar)</Label>
                  <div className="flex flex-wrap gap-2">
                    {EXAMES_COMUNS.map((e) => {
                      const ativo = examType.split("\n").map((l) => l.trim()).includes(e);
                      return (
                        // UI: aria-pressed communicates toggle state to screen readers
                        <button key={e} type="button" onClick={() => toggleExame(e)} aria-pressed={ativo}
                          className={`text-xs px-3 py-1.5 rounded-full border transition ${ativo ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-input"}`}>
                          {e}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <Label htmlFor="exames">Exames solicitados (um por linha)</Label>
                  <Textarea id="exames" rows={5} value={examType} onChange={(e) => setExamType(e.target.value)} placeholder="Ex.: Hemograma completo&#10;Glicemia de jejum" className="mt-1 font-mono text-sm" />
                </div>
                <div>
                  <Label htmlFor="info">Informação clínica / indicação (opcional)</Label>
                  <Textarea id="info" rows={3} value={clinicalInfo} onChange={(e) => setClinicalInfo(e.target.value)} placeholder="Hipótese diagnóstica, sintomas relevantes..." className="mt-1" />
                </div>
                <div>
                  <Label>Prioridade</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={submit} disabled={saving} className="w-full gap-2">
                  <Send className="w-4 h-4" /> {saving ? "Salvando..." : "Registrar pedido de exame"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ExamRequestForm;
