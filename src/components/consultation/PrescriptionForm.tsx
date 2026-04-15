import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { warn, logError } from "@/lib/logger";
import { db } from "@/integrations/supabase/untyped";
import { useConsultationStore } from "@/stores/consultationStore";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, FileText, Download, Calendar, Clock, Users, Settings, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import MemedPrescription from "./MemedPrescription";
import CfmPrescription from "./CfmPrescription";
import { gerarHashDocumento, gerarCodigoVerificacao } from "@/lib/signature";
import { usePrescriptionData } from "@/hooks/usePrescriptionData";
import { useDigitalSignature } from "@/hooks/useDigitalSignature";
import type { Medication } from "@/hooks/usePrescriptionData";

const doctorNav = [
  { label: "Início", href: "/dashboard", icon: <Clock className="w-4 h-4" /> },
  { label: "Agenda", href: "/dashboard/schedule", icon: <Calendar className="w-4 h-4" /> },
  { label: "Pacientes", href: "/dashboard/patients", icon: <Users className="w-4 h-4" /> },
  { label: "Receitas", href: "/dashboard/prescriptions", icon: <FileText className="w-4 h-4" />, active: true },
  { label: "Disponibilidade", href: "/dashboard/availability", icon: <Settings className="w-4 h-4" /> },
];

const PrescriptionForm = () => {
  const { appointmentId } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const store = useConsultationStore();

  // Centralizado: usePrescriptionData hook
  const prescription = usePrescriptionData(appointmentId);
  const { signPrescription, signing: signingDigital, error: signError } = useDigitalSignature();

  const [saving, setSaving] = useState(false);
  const [isSigned, setIsSigned] = useState(false);

  // Persist draft to Zustand (para compatibilidade com store existente)
  useEffect(() => {
    if (appointmentId && prescription.data.patientName) {
      store.setAppointmentId(appointmentId);
      store.setDiagnosis(prescription.data.diagnosis);
      store.setObservations(prescription.data.observations);
      store.setMedications(prescription.data.medications);
    }
  }, [prescription.data, appointmentId]);

  // Auto-save draft to localStorage with debounce (2s)
  useEffect(() => {
    if (!appointmentId) return;
    const timer = setTimeout(() => {
      const draftData = {
        patientName: prescription.data.patientName,
        diagnosis: prescription.data.diagnosis,
        observations: prescription.data.observations,
        medications: prescription.data.medications,
        savedAt: Date.now(),
      };
      localStorage.setItem(`prescription_draft_${appointmentId}`, JSON.stringify(draftData));
      // Show brief indicator
      toast.success("Rascunho salvo localmente", { duration: 2 });
    }, 2000);
    return () => clearTimeout(timer);
  }, [prescription.data, appointmentId]);

  // Load draft on mount if available
  useEffect(() => {
    if (!appointmentId) return;
    const draft = localStorage.getItem(`prescription_draft_${appointmentId}`);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        // Only restore if draft is less than 24 hours old
        if (Date.now() - parsed.savedAt < 86400000) {
          toast("Rascunho encontrado", {
            action: { label: "Restaurar", onClick: () => {
              prescription.updateField("patientName", parsed.patientName);
              prescription.updateField("diagnosis", parsed.diagnosis);
              prescription.updateField("observations", parsed.observations);
              prescription.updateField("medications", parsed.medications);
            }},
            duration: 5000,
          });
        }
      } catch (e) {
        logError("Failed to parse prescription draft", e);
      }
    }
  }, []);


  const generatePDF = async () => {
    const { data } = prescription;
    const { patientName, patientCpf, diagnosis, observations, medications: meds, doctorInfo } = data;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const now = new Date();
    const prescriptionId = `RX-${format(now, "yyyyMMdd")}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // ─── Header ───
    doc.setFillColor(26, 111, 196);
    doc.rect(0, 0, pageWidth, 28, "F");

    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("Alô Médico", 15, 14);
    doc.setFontSize(9);
    doc.text("Plataforma de Telemedicina", 15, 21);

    doc.setFontSize(8);
    doc.text(`Receita Nº: ${prescriptionId}`, pageWidth - 15, 14, { align: "right" });
    doc.text(`Data: ${format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth - 15, 21, { align: "right" });

    // ─── Doctor & Patient info boxes ───
    let y = 36;

    // Doctor box
    doc.setFillColor(240, 246, 255);
    doc.roundedRect(15, y, pageWidth / 2 - 20, 28, 3, 3, "F");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("MÉDICO RESPONSÁVEL", 19, y + 6);
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text(`Dr(a). ${doctorInfo?.first_name} ${doctorInfo?.last_name}`, 19, y + 14);
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`CRM: ${doctorInfo?.crm}/${doctorInfo?.crm_state}`, 19, y + 21);

    // Patient box
    const patientBoxX = pageWidth / 2 + 5;
    doc.setFillColor(240, 255, 240);
    doc.roundedRect(patientBoxX, y, pageWidth / 2 - 20, 28, 3, 3, "F");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("PACIENTE", patientBoxX + 4, y + 6);
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text(patientName, patientBoxX + 4, y + 14);
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`CPF: ${patientCpf || "Não informado"}`, patientBoxX + 4, y + 21);

    // ─── Diagnosis ───
    y += 36;
    if (diagnosis) {
      doc.setFillColor(255, 248, 240);
      doc.roundedRect(15, y, pageWidth - 30, 14, 3, 3, "F");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("DIAGNÓSTICO", 19, y + 5);
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      doc.text(diagnosis, 19, y + 11);
      y += 20;
    }

    // ─── Separator ───
    doc.setDrawColor(26, 111, 196);
    doc.setLineWidth(1.5);
    doc.line(15, y, pageWidth - 15, y);
    y += 4;

    // ─── Section title ───
    doc.setFontSize(13);
    doc.setTextColor(26, 111, 196);
    doc.text("PRESCRIÇÃO MÉDICA", pageWidth / 2, y + 6, { align: "center" });
    y += 14;

    // ─── Medications ───
    meds.forEach((med, i) => {
      if (!med.name) return;

      // Check if we need a new page
      if (y > pageHeight - 60) {
        doc.addPage();
        y = 20;
      }

      // Medication card
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, y, pageWidth - 30, med.instructions ? 38 : 30, 3, 3, "F");

      // Number circle
      doc.setFillColor(26, 111, 196);
      doc.circle(23, y + 8, 5, "F");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text(String(i + 1), 23, y + 9.5, { align: "center" });

      // Name
      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);
      doc.text(med.name, 32, y + 10);

      // Details
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      let detailY = y + 18;
      const details: string[] = [];
      if (med.dosage) details.push(`💊 ${med.dosage}`);
      if (med.frequency) details.push(`⏰ ${med.frequency}`);
      if (med.duration) details.push(`📅 ${med.duration}`);

      if (details.length > 0) {
        doc.text(details.join("   •   "), 32, detailY);
        detailY += 7;
      }

      if (med.instructions) {
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Obs: ${med.instructions}`, 32, detailY);
      }

      y += med.instructions ? 44 : 36;
    });

    // ─── Observations ───
    if (observations) {
      if (y > pageHeight - 60) {
        doc.addPage();
        y = 20;
      }

      y += 4;
      doc.setFillColor(255, 250, 240);
      const obsLines = doc.splitTextToSize(observations, pageWidth - 40);
      const obsHeight = Math.max(18, obsLines.length * 5 + 12);
      doc.roundedRect(15, y, pageWidth - 30, obsHeight, 3, 3, "F");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("OBSERVAÇÕES", 19, y + 6);
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(obsLines, 19, y + 13);
      y += obsHeight + 6;
    }

    // ─── QR Code & Footer ───
    const footerY = pageHeight - 45;

    // QR Code — Real scannable QR code
    try {
      const verificationUrl = `${window.location.origin}/validar-receita/${prescriptionId}`;
      const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 150,
        margin: 1,
        color: {
          dark: "#1a6fc4",
          light: "#ffffff"
        }
      });
      doc.addImage(qrDataUrl, "PNG", 15, footerY - 5, 25, 25);
      doc.setFontSize(6);
      doc.setTextColor(130, 130, 130);
      doc.text("Verificação digital", 27.5, footerY + 23, { align: "center" });
      doc.text(prescriptionId, 27.5, footerY + 27, { align: "center" });
    } catch (error) {
      logError("QR Code generation failed:", error);
      // QR generation failed - non-critical, continue without it
    }

    // Digital signature line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - 40, footerY + 12, pageWidth / 2 + 40, footerY + 12);
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(`Dr(a). ${doctorInfo?.first_name} ${doctorInfo?.last_name}`, pageWidth / 2, footerY + 18, { align: "center" });
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(`CRM ${doctorInfo?.crm}/${doctorInfo?.crm_state}`, pageWidth / 2, footerY + 23, { align: "center" });

    // Bottom bar
    doc.setFillColor(240, 243, 247);
    doc.rect(0, pageHeight - 12, pageWidth, 12, "F");
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text(
      "Receita médica digital emitida pela plataforma Alô Médico • Válida conforme Resolução CFM 2.299/2021 • Telemedicina",
      pageWidth / 2, pageHeight - 5, { align: "center" }
    );

    return { doc, prescriptionId };
  };

  const handleSave = async () => {
    // Validação centralizada no hook
    if (!prescription.validate()) {
      prescription.errors.forEach(err => {
        toast.error(err.message);
      });
      return;
    }

    if (!prescription.data.doctorInfo) {
      toast.error("Dados do médico não carregados. Aguarde.");
      return;
    }

    setSaving(true);
    const { data } = prescription;
    const validMeds = prescription.validMedications;

    try {
      // Generate digital hash for document integrity
      const docContent = JSON.stringify({
        appointment_id: appointmentId,
        doctor: `${data.doctorInfo?.first_name} ${data.doctorInfo?.last_name}`,
        crm: `${data.doctorInfo?.crm}/${data.doctorInfo?.crm_state}`,
        patient: data.patientName,
        patient_cpf: data.patientCpf,
        medications: validMeds,
        diagnosis: data.diagnosis,
        observations: data.observations,
        timestamp: new Date().toISOString(),
      });
      const documentHash = await gerarHashDocumento(docContent);
      const verificationCode = gerarCodigoVerificacao();

      const { error } = await db.from("prescriptions").insert({
        appointment_id: appointmentId!,
        doctor_id: data.doctorId,
        patient_id: data.patientId,
        medications: validMeds as unknown as Parameters<typeof supabase.from>[0],
        diagnosis: data.diagnosis || null,
        observations: data.observations || null,
        document_hash: documentHash,
      });

      // Also persist verification record
      await db.from("document_verifications").insert({
        verification_code: verificationCode,
        document_type: "prescription",
        patient_name: data.patientName,
        patient_cpf: data.patientCpf || null,
        doctor_name: `Dr(a). ${data.doctorInfo?.first_name} ${data.doctorInfo?.last_name}`,
        doctor_crm: `CRM ${data.doctorInfo?.crm}/${data.doctorInfo?.crm_state}`,
        document_hash: documentHash,
        details: { medications: validMeds.length, diagnosis: data.diagnosis || null },
      });

      if (error) {
        toast.error("Erro ao salvar receita", { description: error.message });
        return;
      }

      // Send prescription via email + WhatsApp
      const doctorFullName = `Dr(a). ${data.doctorInfo?.first_name} ${data.doctorInfo?.last_name}`;
      supabase.functions
        .invoke("send-prescription", {
          body: {
            appointment_id: appointmentId,
            doctor_name: doctorFullName,
            patient_name: data.patientName,
            medications: validMeds.map(m => ({
              name: m.name,
              dosage: m.dosage,
              frequency: m.frequency,
            })),
            diagnosis: data.diagnosis || undefined,
          },
        })
        .then(({ data: respData, error: sendErr }) => {
          if (sendErr) {
            warn("Send prescription notification error:", sendErr);
          } else {
            const sentEmail = respData?.sent_to?.email;
            const sentWhatsapp = respData?.sent_to?.whatsapp;
            const channels = [sentEmail && "e-mail", sentWhatsapp && "WhatsApp"]
              .filter(Boolean)
              .join(" e ");
            if (channels) {
              toast.success(`📩 Receita enviada por ${channels}`);
            }
          }
        })
        .catch((err) => {
          logError("[PrescriptionForm] send-prescription edge function failed", err);
        });

      // In-app + Push notification for prescription
      if (data.patientId) {
        const { notifyPrescriptionSent } = await import("@/lib/notifications");
        const medsSummary = validMeds.map(m => `${m.name} ${m.dosage}`).join(", ");
        notifyPrescriptionSent(data.patientId, doctorFullName, data.diagnosis || undefined, medsSummary).catch(
          (err) => {
            logError("[PrescriptionForm] notifyPrescriptionSent failed", err);
          }
        );
      }

      store.clearDraft();
      toast.success("Receita salva com sucesso! ✅");
      navigate("/dashboard/prescriptions");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const { doc } = await generatePDF();
      doc.save(`receita-${prescription.data.patientName.replace(/\s/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("PDF baixado com sucesso! 📄");
    } catch (error) {
      logError("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar o PDF. Tente novamente.");
    }
  };

  const handleSignAndSave = async () => {
    // Validação
    if (!prescription.validate()) {
      prescription.errors.forEach(err => {
        toast.error(err.message);
      });
      return;
    }

    if (!prescription.data.doctorInfo) {
      toast.error("Dados do médico não carregados. Aguarde.");
      return;
    }

    if (!appointmentId) {
      toast.error("ID da consulta não encontrado.");
      return;
    }

    setSaving(true);
    try {
      // Gerar PDF
      const { doc, prescriptionId } = await generatePDF();

      // Converter PDF para Base64
      const pdfBlob = doc.output("blob");
      const reader = new FileReader();

      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];

        // Assinar digitalmente (sem configuração externa necessária)
        const signedDoc = await signPrescription({
          fileName: `receita-${prescriptionId}.pdf`,
          fileBase64: base64,
          doctorName: `Dr(a). ${prescription.data.doctorInfo?.first_name} ${prescription.data.doctorInfo?.last_name}`,
          doctorCRM: `${prescription.data.doctorInfo?.crm}/${prescription.data.doctorInfo?.crm_state}`,
          doctorCPF: profile?.cpf || "CPF_NAO_DISPONIVEL",
          prescriptionId,
          documentType: "prescription",
        });

        if (!signedDoc) {
          toast.error(`Erro ao assinar digitalmente: ${signError || "Erro desconhecido"}`);
          setSaving(false);
          return;
        }

        // Salvar prescrição (já feito no hook de assinatura e em handleSave)
        toast.success("✅ Prescrição assinada digitalmente com ICP-Brasil! \n📋 Agora salvando nos registros...");

        // Chamar handleSave para completar o processo
        await handleSave();

        setIsSigned(true);
        setSaving(false);
      };

      reader.readAsDataURL(pdfBlob);
    } catch (error) {
      logError("Erro ao assinar e salvar prescrição:", error);
      toast.error("Erro ao processar assinatura digital. Tente novamente.");
      setSaving(false);
    }
  };

  const { data } = prescription;

  return (
    <DashboardLayout title="Médico" nav={doctorNav}>
      <div className="max-w-3xl pb-24 md:pb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-1">Receita Médica</h1>
        <p className="text-muted-foreground mb-6">Prescreva medicamentos para o paciente</p>

        {/* CFM Official Prescription */}
        {data.doctorInfo && (
          <div className="mb-4">
            <CfmPrescription
              doctorCrm={data.doctorInfo.crm}
              doctorCrmState={data.doctorInfo.crm_state}
              doctorName={`${data.doctorInfo.first_name} ${data.doctorInfo.last_name}`}
              patientName={data.patientName}
              patientCpf={data.patientCpf}
              onDocumentCreated={(docType) => {
                toast.success("Documento CFM emitido! ✅", { description: `${docType} criado na plataforma oficial do CFM.` });
              }}
            />
          </div>
        )}

        {/* Memed Digital Prescription */}
        {appointmentId && data.patientId && (
          <div className="mb-6">
            <MemedPrescription
              appointmentId={appointmentId}
              patientName={data.patientName}
              patientCpf={data.patientCpf}
              patientId={data.patientId}
              onPrescriptionCreated={(data) => {
                toast.success("Receita Memed salva! ✅", { description: "A receita digital foi emitida e registrada." });
              }}
            />
          </div>
        )}

        {/* Patient info */}
        <Card variant="flat" className="mb-6">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Paciente</p>
            <p className="font-semibold text-foreground">{data.patientName || "Carregando..."}</p>
          </CardContent>
        </Card>

        {/* Diagnosis */}
        <Card variant="elevated" className="mb-6">
          <CardHeader><CardTitle className="text-base">Diagnóstico</CardTitle></CardHeader>
          <CardContent>
            <Input
              value={data.diagnosis}
              onChange={e => prescription.updateField("diagnosis", e.target.value)}
              placeholder="Ex: Infecção respiratória aguda (J06.9)"
            />
          </CardContent>
        </Card>

        {/* Medications */}
        <Card variant="elevated" className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Medicamentos</CardTitle>
              <Button variant="outline" size="sm" onClick={() => prescription.addMedication()}>
                <Plus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {data.medications.map((med, i) => (
              <div key={i} className="relative border border-border rounded-xl p-4">
                {data.medications.length > 1 && (
                  <button
                    onClick={() => prescription.removeMedication(i)}
                    className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <p className="text-xs font-semibold text-muted-foreground mb-3">Medicamento {i + 1}</p>
                <div className="grid gap-3">
                  <div>
                    <Label className="text-xs">Nome do medicamento</Label>
                    <Input
                      value={med.name}
                      onChange={e => prescription.updateMedication(i, { ...med, name: e.target.value })}
                      placeholder="Ex: Amoxicilina 500mg"
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Dosagem</Label>
                      <Input
                        value={med.dosage}
                        onChange={e => prescription.updateMedication(i, { ...med, dosage: e.target.value })}
                        placeholder="Ex: 1 comprimido"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Frequência</Label>
                      <Input
                        value={med.frequency}
                        onChange={e => prescription.updateMedication(i, { ...med, frequency: e.target.value })}
                        placeholder="Ex: 8 em 8 horas"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Duração</Label>
                      <Input
                        value={med.duration}
                        onChange={e => prescription.updateMedication(i, { ...med, duration: e.target.value })}
                        placeholder="Ex: 7 dias"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Instruções</Label>
                      <Input
                        value={med.instructions}
                        onChange={e => prescription.updateMedication(i, { ...med, instructions: e.target.value })}
                        placeholder="Ex: Tomar após refeições"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Observations */}
        <Card variant="elevated" className="mb-6">
          <CardHeader><CardTitle className="text-base">Observações</CardTitle></CardHeader>
          <CardContent>
            <Textarea
              value={data.observations}
              onChange={e => prescription.updateField("observations", e.target.value)}
              placeholder="Orientações adicionais, restrições, retorno..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 flex-col md:flex-row">
          <Button
            onClick={handleSignAndSave}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
            disabled={saving || signingDigital}
          >
            {isSigned ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                ✅ Assinado Digitalmente
              </>
            ) : signingDigital || saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {signingDigital ? "Assinando digitalmente..." : "Salvando..."}
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                🔐 Assinar com ICP-Brasil e Salvar
              </>
            )}
          </Button>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleDownloadPDF} disabled={saving || signingDigital}>
              <Download className="w-4 h-4 mr-2" />
              Baixar PDF
            </Button>
          </div>
        </div>

        {/* Status de Assinatura Digital */}
        {isSigned && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-emerald-900 dark:text-emerald-100">
                  ✅ Assinatura Digital Validada com ICP-Brasil
                </p>
                <p className="text-emerald-700 dark:text-emerald-300 text-xs mt-1">
                  Esta prescrição foi assinada digitalmente com certificado qualificado ICP-Brasil.
                  Válida para todas as farmácias, válida legalmente conforme CFM Resolução 2.299/2021.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PrescriptionForm;
