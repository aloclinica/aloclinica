import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getDoctorNav } from "@/components/doctor/doctorNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Download, ExternalLink, Pill, User, Hash, CalendarIcon, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";

const formatCPF = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const SimplePrescription = () => {
  const { user, profile } = useAuth();

  const [patientName, setPatientName] = useState("");
  const [patientCPF, setPatientCPF] = useState("");
  const [prescriptionDate, setPrescriptionDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [medications, setMedications] = useState("");
  const [generated, setGenerated] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  // Fetch doctor profile for CRM
  const { data: doctorProfile } = useQuery({
    queryKey: ["doctor-profile-prescription", user?.id],
    queryFn: async () => {
      const { data } = await db
        .from("doctor_profiles")
        .select("crm, crm_state")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const doctorName = profile
    ? `Dr(a). ${profile.first_name} ${profile.last_name}`.trim()
    : "Médico";

  const crmText = doctorProfile
    ? `CRM ${doctorProfile.crm}/${doctorProfile.crm_state}`
    : "";

  const generatePDF = useCallback(() => {
    if (!patientName.trim()) {
      toast.error("Informe o nome do paciente.");
      return null;
    }
    if (!medications.trim()) {
      toast.error("Informe os medicamentos e posologia.");
      return null;
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const marginX = 20;
    const contentW = pageW - marginX * 2;

    // ─── Colors ───
    const primary = [22, 163, 74]; // green-600
    const dark = [30, 30, 30];
    const muted = [107, 114, 128];
    const line = [209, 213, 219];

    // ─── Top border bar ───
    doc.setFillColor(primary[0], primary[1], primary[2]);
    doc.rect(0, 0, pageW, 4, "F");

    // ─── Header ───
    let y = 18;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.text("RECEITUÁRIO MÉDICO", pageW / 2, y, { align: "center" });
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(muted[0], muted[1], muted[2]);
    doc.text("Allo Médico — Telemedicina Digital", pageW / 2, y, { align: "center" });
    y += 10;

    // ─── Divider ───
    doc.setDrawColor(line[0], line[1], line[2]);
    doc.setLineWidth(0.5);
    doc.line(marginX, y, pageW - marginX, y);
    y += 10;

    // ─── Doctor info ───
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text(doctorName, marginX, y);
    if (crmText) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(muted[0], muted[1], muted[2]);
      doc.text(crmText, marginX + doc.getTextWidth(doctorName + "  ") + 4, y);
    }
    y += 10;

    // ─── Patient info section ───
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(marginX, y - 4, contentW, 28, 3, 3, "F");

    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(muted[0], muted[1], muted[2]);
    doc.text("PACIENTE", marginX + 6, y);

    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text(patientName.trim(), marginX + 6, y);

    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(muted[0], muted[1], muted[2]);
    const cpfLabel = patientCPF ? `CPF: ${patientCPF}` : "";
    const dateLabel = `Data: ${format(new Date(prescriptionDate + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}`;
    const infoLine = [cpfLabel, dateLabel].filter(Boolean).join("     •     ");
    doc.text(infoLine, marginX + 6, y);

    y += 14;

    // ─── Medications header ───
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.text("Medicamentos e Posologia", marginX, y);
    y += 2;
    doc.setDrawColor(primary[0], primary[1], primary[2]);
    doc.setLineWidth(0.6);
    doc.line(marginX, y, marginX + 55, y);
    y += 8;

    // ─── Medications body ───
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(dark[0], dark[1], dark[2]);

    const lines = doc.splitTextToSize(medications.trim(), contentW - 4);
    const lineHeight = 6;
    const maxYForMeds = pageH - 50;

    for (const textLine of lines) {
      if (y + lineHeight > maxYForMeds) {
        doc.addPage();
        y = 20;
        // Re-draw top bar on new page
        doc.setFillColor(primary[0], primary[1], primary[2]);
        doc.rect(0, 0, pageW, 4, "F");
      }
      doc.text(textLine, marginX + 2, y);
      y += lineHeight;
    }

    // ─── Signature area ───
    const sigY = Math.max(y + 25, pageH - 60);
    doc.setDrawColor(line[0], line[1], line[2]);
    doc.setLineWidth(0.3);
    doc.line(pageW / 2 - 40, sigY, pageW / 2 + 40, sigY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text(doctorName, pageW / 2, sigY + 5, { align: "center" });
    if (crmText) {
      doc.setFontSize(9);
      doc.setTextColor(muted[0], muted[1], muted[2]);
      doc.text(crmText, pageW / 2, sigY + 10, { align: "center" });
    }

    // ─── Footer ───
    const footerY = pageH - 12;
    doc.setDrawColor(line[0], line[1], line[2]);
    doc.setLineWidth(0.3);
    doc.line(marginX, footerY - 6, pageW - marginX, footerY - 6);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(muted[0], muted[1], muted[2]);
    doc.text(
      "Documento assinado digitalmente. Valide a autenticidade em assinaturadigital.iti.gov.br",
      pageW / 2,
      footerY,
      { align: "center" }
    );

    // ─── Bottom border bar ───
    doc.setFillColor(primary[0], primary[1], primary[2]);
    doc.rect(0, pageH - 4, pageW, 4, "F");

    return doc;
  }, [patientName, patientCPF, prescriptionDate, medications, doctorName, crmText]);

  const handleGenerate = () => {
    const doc = generatePDF();
    if (!doc) return;
    const blob = doc.output("blob");
    setPdfBlob(blob);
    setGenerated(true);
    toast.success("Receita gerada com sucesso!");
  };

  const handleDownload = () => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receita-${patientName.trim().replace(/\s+/g, "-").toLowerCase()}-${prescriptionDate}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setPatientName("");
    setPatientCPF("");
    setPrescriptionDate(format(new Date(), "yyyy-MM-dd"));
    setMedications("");
    setGenerated(false);
    setPdfBlob(null);
  };

  return (
    <DashboardLayout nav={getDoctorNav("simple-prescription")} title="Receituário Digital">
      <div className="max-w-2xl mx-auto space-y-6 pb-24 md:pb-6">
        {/* Header Card */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
                <Pill className="w-5 h-5 text-white" />
              </div>
              Receituário Digital
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Preencha os dados, gere o PDF e assine digitalmente com certificado ICP-Brasil — <strong>100% gratuito</strong>.
            </p>
          </CardHeader>
        </Card>

        {!generated ? (
          /* ─── FORM ─── */
          <Card>
            <CardContent className="pt-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="patientName" className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  Nome do Paciente *
                </Label>
                <Input
                  id="patientName"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Nome completo do paciente"
                  maxLength={120}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patientCPF" className="flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                    CPF
                  </Label>
                  <Input
                    id="patientCPF"
                    value={patientCPF}
                    onChange={(e) => setPatientCPF(formatCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prescDate" className="flex items-center gap-2">
                    <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    Data
                  </Label>
                  <Input
                    id="prescDate"
                    type="date"
                    value={prescriptionDate}
                    onChange={(e) => setPrescriptionDate(e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="medications" className="flex items-center gap-2">
                  <Pill className="w-3.5 h-3.5 text-muted-foreground" />
                  Medicamentos e Posologia *
                </Label>
                <Textarea
                  id="medications"
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                  placeholder={`1) Amoxicilina 500mg — Tomar 1 cápsula de 8 em 8 horas por 7 dias.\n\n2) Ibuprofeno 400mg — Tomar 1 comprimido de 12 em 12 horas se dor ou febre.\n\n3) Omeprazol 20mg — Tomar 1 cápsula em jejum por 14 dias.`}
                  rows={10}
                  className="font-mono text-sm"
                  maxLength={3000}
                />
                <p className="text-[11px] text-muted-foreground text-right">
                  {medications.length}/3000 caracteres
                </p>
              </div>

              <Button onClick={handleGenerate} className="w-full h-11 text-base gap-2">
                <FileText className="w-4 h-4" />
                Gerar Receita
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* ─── RESULT ─── */
          <Card className="border-success/30">
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-success/5 border border-success/20">
                <CheckCircle2 className="w-6 h-6 text-success mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Receita gerada com sucesso!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Baixe o PDF e, em seguida, assine digitalmente no portal do Governo Federal (gratuito com certificado ICP-Brasil).
                  </p>
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground text-xs block mb-1">Paciente</span>
                  <span className="font-medium text-foreground">{patientName}</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground text-xs block mb-1">Data</span>
                  <span className="font-medium text-foreground">
                    {format(new Date(prescriptionDate + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
                {patientCPF && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground text-xs block mb-1">CPF</span>
                    <span className="font-medium text-foreground">{patientCPF}</span>
                  </div>
                )}
                <div className="p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground text-xs block mb-1">Médico</span>
                  <span className="font-medium text-foreground">{doctorName}</span>
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="space-y-3">
                <Button onClick={handleDownload} variant="outline" className="w-full h-11 gap-2">
                  <Download className="w-4 h-4" />
                  Baixar Receita PDF
                </Button>

                <Button
                  onClick={() => window.open("https://assinaturadigital.iti.gov.br/", "_blank")}
                  className="w-full h-12 text-base gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
                >
                  <ExternalLink className="w-5 h-5" />
                  Ir para Assinador Digital (Grátis)
                </Button>

                <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
                  O assinador digital do ITI utiliza certificado ICP-Brasil (e-CPF) para dar validade jurídica ao documento.
                  Após assinar, envie o PDF assinado ao paciente.
                </p>
              </div>

              <Separator />

              <Button variant="ghost" onClick={handleReset} className="w-full text-muted-foreground">
                Nova Receita
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Info card */}
        <Card className="border-border/50 bg-muted/20">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px]">DICA</Badge>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Para prescrições de <strong>medicamentos controlados</strong>, utilize receituário carbonado ou digital com certificado ICP-Brasil obrigatório. 
                O assinador do ITI é gratuito e aceito nacionalmente.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SimplePrescription;
