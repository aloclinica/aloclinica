import { logError } from "@/lib/logger";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getDoctorNav } from "./doctorNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import CpfInput from "@/components/ui/cpf-input";
import { Send, Download } from "lucide-react";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const SPECIALTIES = [
  "Cardiologia", "Dermatologia", "Endocrinologia", "Gastroenterologia", "Ginecologia",
  "Neurologia", "Oftalmologia", "Ortopedia", "Otorrinolaringologia", "Pediatria",
  "Pneumologia", "Psiquiatria", "Reumatologia", "Urologia", "Nutrição", "Fisioterapia",
  "Cirurgia Geral", "Oncologia", "Nefrologia", "Infectologia", "Outra",
];

const URGENCY = {
  rotina: "Rotina",
  prioritario: "Prioritário",
  urgente: "Urgente",
} as const;

const ClinicalReferral = () => {
  const { profile, user } = useAuth();
  const { appointmentId } = useParams<{ appointmentId?: string }>();

  const [patientName, setPatientName] = useState("");
  const [patientCpf, setPatientCpf] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [reason, setReason] = useState("");
  const [clinicalSummary, setClinicalSummary] = useState("");
  const [urgency, setUrgency] = useState<keyof typeof URGENCY>("rotina");
  const [generating, setGenerating] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState<{ id: string; crm: string; crm_state: string } | null>(null);

  useEffect(() => {
    if (user) {
      db.from("doctor_profiles").select("id, crm, crm_state").eq("user_id", user.id).single().then(({ data }) => {
        if (data) setDoctorInfo({ id: data.id, crm: data.crm, crm_state: data.crm_state });
      });
    }
  }, [user]);

  const generateReferral = async () => {
    if (!patientName.trim()) { toast.error("Informe o nome do paciente"); return; }
    if (!specialty) { toast.error("Escolha a especialidade de destino"); return; }
    if (!reason.trim()) { toast.error("Descreva o motivo do encaminhamento"); return; }
    if (!doctorInfo?.id) { toast.error("Carregando seus dados de médico — tente novamente."); return; }
    setGenerating(true);

    try {
      const doctorName = `Dr(a). ${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();
      const crmText = `CRM ${doctorInfo.crm}/${doctorInfo.crm_state}`;
      const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      const verificationCode = `EN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // Resolve patient_id via appointment (quando houver).
      let patientUserId: string | null = null;
      if (appointmentId) {
        const { data: appt } = await db.from("appointments").select("patient_id").eq("id", appointmentId).maybeSingle();
        patientUserId = (appt as any)?.patient_id ?? null;
      }

      // ── PDF ──
      const doc = new jsPDF();
      const W = doc.internal.pageSize.getWidth();
      let y = 22;
      doc.setFillColor(31, 95, 219); doc.rect(0, 0, W, 4, "F");
      doc.setTextColor(20, 35, 75); doc.setFontSize(20); doc.setFont("helvetica", "bold");
      doc.text("AloClínica", 15, y);
      doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(120, 120, 120);
      doc.text("Encaminhamento Médico", 15, y + 6);

      try {
        const qrUrl = `${window.location.origin}/validar/${verificationCode}`;
        const qrData = await QRCode.toDataURL(qrUrl, { width: 200, margin: 1, errorCorrectionLevel: "M", color: { dark: "#15234B", light: "#ffffff" } });
        doc.addImage(qrData, "PNG", W - 40, 10, 25, 25);
      } catch (e) { logError("QR encaminhamento", e); }

      y = 50;
      doc.setDrawColor(225, 232, 243); doc.line(15, y, W - 15, y); y += 10;
      doc.setTextColor(30, 30, 40); doc.setFontSize(11); doc.setFont("helvetica", "bold");
      doc.text("ENCAMINHAMENTO MÉDICO", 15, y); y += 9;
      doc.setFont("helvetica", "normal"); doc.setFontSize(11);
      const line = (label: string, value: string) => {
        doc.setFont("helvetica", "bold"); doc.text(`${label} `, 15, y);
        const lw = doc.getTextWidth(`${label} `);
        doc.setFont("helvetica", "normal");
        const wrapped = doc.splitTextToSize(value || "—", W - 30 - lw);
        doc.text(wrapped, 15 + lw, y);
        y += (Array.isArray(wrapped) ? wrapped.length : 1) * 6 + 3;
      };
      line("Paciente:", patientName + (patientCpf ? `  (CPF ${patientCpf})` : ""));
      line("Encaminhar para:", `${specialty}  —  Prioridade: ${URGENCY[urgency]}`);
      line("Motivo:", reason);
      if (clinicalSummary.trim()) line("Resumo clínico:", clinicalSummary);
      line("Modalidade:", "Emitido em Telemedicina — Resolução CFM nº 2.314/2022");

      y += 12;
      doc.setDrawColor(180, 180, 180); doc.line(15, y, 90, y); y += 5;
      doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text(doctorName, 15, y); y += 6;
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text(crmText, 15, y); y += 6;
      doc.setTextColor(120, 120, 120); doc.setFontSize(9);
      doc.text(`Data: ${today}`, 15, y); y += 5;
      doc.text(`Código de verificação: ${verificationCode} — valide em aloclinica.com.br/validar/${verificationCode}`, 15, y);
      doc.text("Documento emitido eletronicamente — sem assinatura ICP-Brasil.", 15, y + 5);

      const blob = doc.output("blob");
      const storagePath = `referrals/${doctorInfo.id}/${verificationCode}.pdf`;

      // Upload (bucket privado) + URL assinada.
      let pdfUrl: string | null = null;
      const { error: upErr } = await db.storage.from("patient-documents").upload(storagePath, blob, { contentType: "application/pdf", upsert: false });
      if (!upErr) {
        const { data: signed } = await db.storage.from("patient-documents").createSignedUrl(storagePath, 60 * 60 * 24 * 365);
        pdfUrl = signed?.signedUrl ?? null;
      }

      // Persiste o encaminhamento.
      const { error: insErr } = await (db as any).from("clinical_referrals").insert({
        appointment_id: appointmentId ?? null,
        doctor_id: doctorInfo.id,
        patient_id: patientUserId,
        patient_name: patientName,
        patient_cpf: patientCpf || null,
        specialty, reason, clinical_summary: clinicalSummary || null,
        urgency, pdf_url: pdfUrl, storage_path: upErr ? null : storagePath,
        verification_code: verificationCode,
      });
      if (insErr) { logError("Falha ao salvar encaminhamento", insErr); throw insErr; }

      // Notifica o paciente (se identificado).
      if (patientUserId) {
        await db.from("notifications").insert({
          user_id: patientUserId, type: "document",
          title: "🩺 Encaminhamento médico disponível",
          message: `Você foi encaminhado para ${specialty} (${URGENCY[urgency]}).`,
          link: pdfUrl,
        } as any);
      }

      // Download local para o médico.
      doc.save(`encaminhamento-${verificationCode}.pdf`);
      toast.success("Encaminhamento emitido!", { description: patientUserId ? "O paciente foi notificado." : "PDF gerado." });

      setReason(""); setClinicalSummary("");
    } catch (e) {
      logError("Erro ao gerar encaminhamento", e);
      toast.error("Erro ao gerar encaminhamento", { description: (e as Error)?.message });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <DashboardLayout title="Médico" nav={getDoctorNav("referrals")}>
      <div className="w-full max-w-2xl mx-auto pb-24 md:pb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Send className="w-5 h-5 text-primary" /> Encaminhamento Médico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Paciente</Label>
              <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Nome completo do paciente" className="mt-1" />
            </div>
            <div>
              <Label>CPF (opcional)</Label>
              <CpfInput value={patientCpf} onChange={setPatientCpf} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Encaminhar para</Label>
                <Select value={specialty} onValueChange={setSpecialty}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Especialidade" /></SelectTrigger>
                  <SelectContent>{SPECIALTIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select value={urgency} onValueChange={(v) => setUrgency(v as keyof typeof URGENCY)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(URGENCY).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Motivo do encaminhamento</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: avaliação de sopro cardíaco detectado na ausculta" className="mt-1" rows={3} />
            </div>
            <div>
              <Label>Resumo clínico (opcional)</Label>
              <Textarea value={clinicalSummary} onChange={(e) => setClinicalSummary(e.target.value)} placeholder="História, exames relevantes, medicações em uso…" className="mt-1" rows={4} />
            </div>
            <Button onClick={generateReferral} disabled={generating} className="w-full h-12 rounded-xl gap-2 font-bold">
              {generating ? "Gerando…" : (<><Download className="w-4 h-4" /> Emitir encaminhamento (PDF)</>)}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ClinicalReferral;
