import { logError } from "@/lib/logger";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { notifyCertificateSent } from "@/lib/notifications";
import { db } from "@/integrations/supabase/untyped";
import { gerarHashDocumento } from "@/lib/signature";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import CpfInput from "@/components/ui/cpf-input";
import { getDoctorNav } from "./doctorNav";
import { FileBadge, Download, History } from "lucide-react";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { drawSafeText, safeQrBox } from "@/lib/pdf-layout";
import { drawBrandFooter } from "@/lib/pdf-brand";
import { TemplateControls } from "@/components/consultation/DoctorTemplates";

// CID-10 mais comuns em telemedicina — datalist leve; o campo continua livre.
// (MedicalAutocomplete só faz sugestão de texto por IA para diagnosis/notes, não códigos CID.)
const COMMON_CID10: { code: string; label: string }[] = [
  { code: "J06", label: "Infecção aguda das vias aéreas superiores" },
  { code: "J11", label: "Influenza (gripe)" },
  { code: "J00", label: "Nasofaringite aguda (resfriado comum)" },
  { code: "A09", label: "Diarreia e gastroenterite" },
  { code: "B34.9", label: "Infecção viral não especificada" },
  { code: "I10", label: "Hipertensão essencial" },
  { code: "E11", label: "Diabetes mellitus tipo 2" },
  { code: "R51", label: "Cefaleia" },
  { code: "M54.5", label: "Dor lombar baixa" },
  { code: "N39.0", label: "Infecção do trato urinário" },
  { code: "F41.1", label: "Ansiedade generalizada" },
  { code: "F32", label: "Episódio depressivo" },
  { code: "K29", label: "Gastrite e duodenite" },
  { code: "J45", label: "Asma" },
  { code: "Z00.0", label: "Exame médico geral" },
];

// Modelos rápidos de atestado/declaração (pt-BR). Clicar preenche tipo + texto
// (e dias/CID quando aplicável); tudo continua editável.
type CertType = "absence" | "attendance" | "fitness";
const CERT_PRESETS: {
  label: string;
  emoji: string;
  type: CertType;
  days?: number;
  cid?: string;
  text: string;
}[] = [
  {
    label: "Comparecimento",
    emoji: "🕐",
    type: "attendance",
    text: "Compareceu à consulta médica por telemedicina nesta data, permanecendo em atendimento pelo período necessário.",
  },
  {
    label: "Repouso 1 dia",
    emoji: "🛌",
    type: "absence",
    days: 1,
    text: "Paciente necessita de afastamento de suas atividades habituais por 1 (um) dia, por motivo de saúde.",
  },
  {
    label: "Repouso 3 dias",
    emoji: "🛌",
    type: "absence",
    days: 3,
    text: "Paciente necessita de afastamento de suas atividades habituais por motivo de saúde.",
  },
  {
    label: "Apto p/ atividade física",
    emoji: "🏃",
    type: "fitness",
    text: "Após avaliação clínica, encontra-se apto(a) para a prática de atividades físicas, sem restrições identificadas nesta avaliação.",
  },
  {
    label: "Acompanhante",
    emoji: "🤝",
    type: "attendance",
    text: "Declara-se, para os devidos fins, que o(a) paciente necessita de acompanhante durante o atendimento e o deslocamento.",
  },
  {
    label: "Comparecimento de acompanhante",
    emoji: "👥",
    type: "attendance",
    text: "Declara-se que o(a) acompanhante do(a) paciente compareceu à consulta médica nesta data, durante o período do atendimento.",
  },
];

const MedicalCertificate = () => {
  const { profile, user } = useAuth();
  const { appointmentId } = useParams<{ appointmentId?: string }>();

  const [patientName, setPatientName] = useState("");
  const [patientCpf, setPatientCpf] = useState("");
  const [days, setDays] = useState(1);
  const [reason, setReason] = useState("");
  const [cid, setCid] = useState("");
  const [certType, setCertType] = useState<"absence" | "attendance" | "fitness">("absence");
  const [generating, setGenerating] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState<{ id: string; crm: string; crm_state: string; specialties: string[] } | null>(null);
  const [history, setHistory] = useState<{ name: string; date: string; type: string }[]>([]);

  useEffect(() => {
    if (user) {
      db.from("doctor_profiles").select("id, crm, crm_state").eq("user_id", user.id).single().then(async ({ data }) => {
        if (data) {
          // BUGFIX: buscar especialidades pelo id do perfil (não pelo número do CRM).
          const { data: specs } = await db.from("doctor_specialties").select("specialties(name)").eq("doctor_id", data.id);
          const specialties = (specs ?? []).map((s: any) => s.specialties?.name).filter(Boolean);
          setDoctorInfo({ id: data.id, crm: data.crm, crm_state: data.crm_state, specialties });
        }
      });
    }
  }, [user]);

  // Prefill do paciente a partir da consulta (patient_id → profiles, ou guest_patient_id → guest_patients),
  // pra o médico não precisar redigitar nome/CPF quando vem de uma consulta.
  useEffect(() => {
    if (!appointmentId) return;
    let cancelled = false;
    (async () => {
      const { data: appt } = await db
        .from("appointments")
        .select("patient_id, guest_patient_id")
        .eq("id", appointmentId)
        .single();
      if (cancelled || !appt) return;

      if (appt.patient_id) {
        const { data: p } = await db
          .from("profiles")
          .select("first_name, last_name, cpf")
          .eq("user_id", appt.patient_id)
          .single();
        if (cancelled || !p) return;
        const fullName = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim();
        if (fullName) setPatientName(prev => prev || fullName);
        if (p.cpf) setPatientCpf(prev => prev || p.cpf);
      } else if (appt.guest_patient_id) {
        const { data: g } = await db
          .from("guest_patients")
          .select("full_name, cpf")
          .eq("id", appt.guest_patient_id)
          .single();
        if (cancelled || !g) return;
        if (g.full_name) setPatientName(prev => prev || g.full_name);
        if (g.cpf) setPatientCpf(prev => prev || g.cpf);
      }
    })();
    return () => { cancelled = true; };
  }, [appointmentId]);

  const CERT_TYPES = {
    absence: { label: "Atestado de Afastamento", title: "ATESTADO MÉDICO" },
    attendance: { label: "Declaração de Comparecimento", title: "DECLARAÇÃO DE COMPARECIMENTO" },
    fitness: { label: "Atestado de Aptidão", title: "ATESTADO DE APTIDÃO FÍSICA" },
  };

  // Aplica um modelo rápido: preenche tipo + texto (e dias/CID quando houver),
  // mantendo tudo editável e sem sobrescrever nome/CPF já prefilados.
  const applyPreset = (p: (typeof CERT_PRESETS)[number]) => {
    setCertType(p.type);
    if (p.days) setDays(p.days);
    if (p.cid) setCid(p.cid);
    setReason(p.text);
  };

  const generateCertificate = async () => {
    if (!patientName) {
      toast.error("Informe o nome do paciente");
      return;
    }
    if (!doctorInfo?.id) {
      toast.error("Carregando seus dados de médico — tente novamente em instantes.");
      return;
    }
    setGenerating(true);

    const doc = new jsPDF();
    const PAGE_W = doc.internal.pageSize.getWidth();
    const PAGE_H = doc.internal.pageSize.getHeight();
    const MARGIN = 15;
    const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    const now = format(new Date(), "HH:mm");
    const doctorName = `Dr(a). ${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`;
    const crmText = doctorInfo ? `CRM ${doctorInfo.crm}/${doctorInfo.crm_state}` : "";
    const certConfig = CERT_TYPES[certType];
    const verificationCode = `AC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Header with gradient bar
    doc.setFillColor(0, 105, 146);
    doc.rect(0, 0, 210, 4, "F");
    doc.setFillColor(46, 204, 113);
    doc.rect(0, 4, 210, 2, "F");

    // Logo area
    doc.setFontSize(22);
    doc.setTextColor(0, 105, 146);
    doc.text("AloClínica", 20, 22);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text("Plataforma de Telemedicina", 20, 28);

    // QR code top-right — QR REAL escaneável apontando para a validação pública.
    const qr = safeQrBox(doc, { x: 165, y: 12, size: 25 }, MARGIN);
    try {
      const verifyUrl = `${window.location.origin}/validar/${verificationCode}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 200, margin: 1, errorCorrectionLevel: "M",
        color: { dark: "#15234B", light: "#ffffff" },
      });
      doc.addImage(qrDataUrl, "PNG", qr.x, qr.y, qr.size, qr.size);
    } catch (e) {
      logError("QR do atestado falhou", e);
    }
    doc.setTextColor(100, 100, 100);
    drawSafeText(doc, `Verificação: ${verificationCode}`, {
      x: qr.x + qr.size / 2,
      y: qr.y + qr.size + 4,
      maxWidth: qr.size + 10,
      fontSize: 6,
      minFontSize: 5,
      align: "center",
      maxLines: 2,
      lineHeight: 2.5,
    });

    // Separator
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 45, 190, 45);

    // Title (com encolhimento se o título for muito longo)
    doc.setTextColor(30, 30, 30);
    drawSafeText(doc, certConfig.title, {
      x: PAGE_W / 2, y: 58, maxWidth: PAGE_W - 2 * MARGIN, fontSize: 18, minFontSize: 13, align: "center", maxLines: 1, lineHeight: 8,
    });

    // Content based on type
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);

    let bodyText = "";
    if (certType === "absence") {
      bodyText = `Atesto para os devidos fins que o(a) Sr(a). ${patientName}${patientCpf ? `, portador(a) do CPF nº ${patientCpf}` : ""}, foi atendido(a) nesta data, em consulta médica por telemedicina, e necessita de ${days} (${days === 1 ? "um" : days <= 10 ? ["dois","três","quatro","cinco","seis","sete","oito","nove","dez"][days-2] : days}) dia(s) de afastamento de suas atividades habituais, a partir desta data${reason ? `.\n\nMotivo: ${reason}` : ""}${cid ? `.\n\nCID-10: ${cid}` : ""}.`;
    } else if (certType === "attendance") {
      bodyText = `Declaro para os devidos fins que o(a) Sr(a). ${patientName}${patientCpf ? `, portador(a) do CPF nº ${patientCpf}` : ""}, compareceu a consulta médica por telemedicina nesta data, no horário de ${now}, permanecendo em atendimento pelo período necessário${reason ? `.\n\nObservações: ${reason}` : ""}.`;
    } else {
      bodyText = `Atesto para os devidos fins que o(a) Sr(a). ${patientName}${patientCpf ? `, portador(a) do CPF nº ${patientCpf}` : ""}, após avaliação médica realizada por telemedicina, encontra-se APTO(A) para exercer suas atividades${reason ? `, com as seguintes observações: ${reason}` : ""}${cid ? `.\n\nCID-10: ${cid}` : ""}.`;
    }

    // Corpo do atestado — largura derivada das margens reais
    const bodyMaxWidth = PAGE_W - 2 * 27;
    doc.setFontSize(12);
    const bodyEndY = drawSafeText(doc, bodyText, {
      x: 27, y: 75, maxWidth: bodyMaxWidth, fontSize: 12, minFontSize: 9.5, lineHeight: 7,
    });

    // Legal note
    const noteY = Math.min(bodyEndY + 15, PAGE_H - 50);
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    drawSafeText(doc, "Este documento foi emitido via plataforma AloClínica de telemedicina, em conformidade com a Resolução CFM nº 2.314/2022 que regulamenta a telemedicina no Brasil.", {
      x: PAGE_W / 2, y: noteY, maxWidth: PAGE_W - 2 * MARGIN, fontSize: 8, minFontSize: 6.5, align: "center", maxLines: 2, lineHeight: 4,
    });

    // Signature area — sempre acima do rodapé (max 270)
    const signY = Math.min(Math.max(noteY + 25, 180), 250);
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(11);
    doc.text(today, 105, signY, { align: "center" });

    doc.setDrawColor(80, 80, 80);
    doc.line(55, signY + 25, 155, signY + 25);

    doc.setTextColor(50, 50, 50);
    drawSafeText(doc, doctorName, {
      x: 105, y: signY + 32, maxWidth: PAGE_W - 2 * 30, fontSize: 12, minFontSize: 9, align: "center", maxLines: 1, lineHeight: 5,
    });
    doc.setTextColor(80, 80, 80);
    drawSafeText(doc, crmText, {
      x: 105, y: signY + 38, maxWidth: PAGE_W - 2 * 30, fontSize: 10, minFontSize: 8, align: "center", maxLines: 1, lineHeight: 4,
    });

    // Branded compliance footer (corporate identity + CFM 2.314/2022)
    drawBrandFooter(doc, {
      complianceNote: "Documento emitido via telemedicina · Resolução CFM 2.314/2022 · Lei 14.510/2022",
    });

    // Download local pro médico imediato
    doc.save(`${certType}-${patientName.replace(/\s/g, "-").toLowerCase()}.pdf`);

    // Hash de integridade
    const docContent = JSON.stringify({
      type: certType,
      patient: patientName,
      patient_cpf: patientCpf,
      doctor: doctorName,
      crm: crmText,
      days: certType === "absence" ? days : null,
      cid: cid || null,
      reason: reason || null,
      verification_code: verificationCode,
      timestamp: new Date().toISOString(),
    });
    const documentHash = await gerarHashDocumento(docContent);

    // Persist verification code (pra /validar/<codigo> público)
    db.from("document_verifications").insert({
      verification_code: verificationCode,
      document_type: certType,
      patient_name: patientName,
      patient_cpf: patientCpf || null,
      doctor_name: doctorName,
      doctor_crm: crmText,
      document_hash: documentHash,
      details: { days: certType === "absence" ? days : null, cid: cid || null, reason: reason || null },
    }).then(({ error }) => {
      if (error) logError("Failed to persist certificate verification", error);
    });

    // Upload PDF pra storage + insert em medical_certificates (pra paciente ver depois)
    if (user && profile) {
      try {
        const pdfBlob = doc.output("blob");
        const fileName = `${verificationCode}.pdf`;
        const storagePath = `certificates/${user.id}/${fileName}`;

        const { error: upErr } = await db.storage
          .from("patient-documents")
          .upload(storagePath, pdfBlob, { contentType: "application/pdf", upsert: false });

        let pdfUrl: string | null = null;
        if (!upErr) {
          // patient-documents é um bucket PRIVADO (PHI). URL assinada, não pública.
          const { data: urlData } = await db.storage
            .from("patient-documents")
            .createSignedUrl(storagePath, 60 * 60 * 24 * 365);
          pdfUrl = urlData?.signedUrl ?? null;
        }

        // Resolve patient_id se temos appointmentId
        let patientUserId: string | null = null;
        if (appointmentId) {
          const { data: appt } = await db.from("appointments").select("patient_id").eq("id", appointmentId).single();
          patientUserId = appt?.patient_id ?? null;
        }

        const { error: insertErr } = await (db as any).from("medical_certificates").insert({
          appointment_id: appointmentId ?? null,
          doctor_id: doctorInfo.id,
          patient_id: patientUserId,
          type: certType,
          patient_name: patientName,
          patient_cpf: patientCpf || null,
          doctor_name: doctorName,
          doctor_crm: crmText,
          days: certType === "absence" ? days : null,
          reason: reason || null,
          cid: cid || null,
          pdf_url: pdfUrl,
          storage_path: upErr ? null : storagePath,
          verification_code: verificationCode,
          document_hash: documentHash,
        });
        if (insertErr) logError("Failed to persist medical_certificate", insertErr);
      } catch (e) {
        logError("Certificate persistence error", e);
      }
    }

    setGenerating(false);
    setHistory(prev => [{ name: patientName, date: today, type: certConfig.label }, ...prev.slice(0, 9)]);
    toast.success("Documento gerado! ✅", { description: `Código de verificação: ${verificationCode}` });

    // Notify patient about certificate
    notifyCertificateSent(
      patientName, patientCpf, doctorName, certConfig.label, verificationCode,
      certType === "absence" ? days : undefined
    ).catch(err => logError("MedicalCertificate notify failed", err));
  };

  return (
    <DashboardLayout title="Médico" nav={getDoctorNav("certificates")}>
      <div className="w-full mx-auto max-w-3xl pb-24 md:pb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">Atestados e Declarações</h1>
        <p className="text-muted-foreground mb-6">Gere documentos médicos profissionais em PDF com QR Code de verificação</p>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card className="border-border">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileBadge className="w-5 h-5 text-primary" /> Novo Documento</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {/* CID-10 sugeridos — compartilhado pelos campos de CID (afastamento e aptidão) */}
                <datalist id="cid10-options">
                  {COMMON_CID10.map(c => (
                    <option key={c.code} value={c.code}>{c.code} — {c.label}</option>
                  ))}
                </datalist>
                <div>
                  {/* UI: associate label with the select trigger for a11y */}
                  <Label htmlFor="cert-type">Tipo de Documento</Label>
                  <Select value={certType} onValueChange={(v: any) => setCertType(v)}>
                    <SelectTrigger id="cert-type" className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="absence">📋 Atestado de Afastamento</SelectItem>
                      <SelectItem value="attendance">🕐 Declaração de Comparecimento</SelectItem>
                      <SelectItem value="fitness">✅ Atestado de Aptidão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Modelos rápidos pt-BR — preenchem tipo/texto (e dias/CID), tudo editável */}
                <div>
                  <Label className="text-xs text-muted-foreground">Modelos rápidos</Label>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {CERT_PRESETS.map(p => (
                      <Button
                        key={p.label}
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 rounded-full px-3 text-[11px] font-medium"
                        onClick={() => applyPreset(p)}
                      >
                        <span className="mr-1">{p.emoji}</span>{p.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    {/* UI: associate label with input for a11y */}
                    <Label htmlFor="cert-patient-name">Nome do Paciente *</Label>
                    <Input id="cert-patient-name" value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="Nome completo" className="mt-1" required />
                  </div>
                  <div>
                    <Label>CPF (opcional)</Label>
                    <CpfInput value={patientCpf} onChange={v => setPatientCpf(v)} optional className="mt-1" />
                  </div>
                </div>

                {certType === "absence" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      {/* UI: associate label with input for a11y */}
                      <Label htmlFor="cert-days">Dias de Afastamento</Label>
                      <Input id="cert-days" type="number" value={days} onChange={e => setDays(Number(e.target.value))} min={1} className="mt-1" />
                    </div>
                    <div>
                      {/* UI: associate label with input for a11y */}
                      <Label htmlFor="cert-cid-absence">CID-10 (opcional)</Label>
                      <Input id="cert-cid-absence" list="cid10-options" value={cid} onChange={e => setCid(e.target.value)} placeholder="Ex: J06, I10" className="mt-1" />
                    </div>
                  </div>
                )}

                {certType === "fitness" && (
                  <div>
                    {/* UI: associate label with input for a11y */}
                    <Label htmlFor="cert-cid-fitness">CID-10 (opcional)</Label>
                    <Input id="cert-cid-fitness" list="cid10-options" value={cid} onChange={e => setCid(e.target.value)} placeholder="Ex: Z00.0" className="mt-1" />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    {/* UI: associate label with textarea for a11y */}
                    <Label htmlFor="cert-reason">{certType === "attendance" ? "Observações" : "Motivo / Observação"}</Label>
                    <TemplateControls
                      type="generic"
                      currentText={reason}
                      onInsert={(t) => setReason(reason ? `${reason}\n${t}` : t)}
                    />
                  </div>
                  <Textarea id="cert-reason" value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Detalhes adicionais..." className="mt-1" />
                </div>

                <Button onClick={generateCertificate} disabled={generating} className="bg-gradient-hero text-primary-foreground w-full" size="lg">
                  <Download className="w-4 h-4 mr-2" />
                  {generating ? "Gerando..." : "Gerar PDF Profissional"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar: Recent */}
          <div>
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><History className="w-4 h-4" /> Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhum documento gerado nesta sessão.</p>
                ) : (
                  <div className="space-y-2">
                    {history.map((h, i) => (
                      <div key={i} className="text-xs border-b border-border pb-2 last:border-0">
                        <p className="font-medium text-foreground">{h.name}</p>
                        <p className="text-muted-foreground">{h.type}</p>
                        <p className="text-muted-foreground">{h.date}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border mt-4">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">📌 Nota Legal:</strong> Documentos emitidos conforme Resolução CFM nº 2.314/2022. Cada documento contém QR Code para verificação de autenticidade.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MedicalCertificate;
