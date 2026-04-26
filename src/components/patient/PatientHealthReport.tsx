import { useState } from "react";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import { toast } from "sonner";
import { FileText, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { logError } from "@/lib/logger";

interface PatientHealthReportProps {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
  label?: string;
}

const BRAND = { r: 0, g: 52, b: 127 }; // AloClínica primary

/**
 * Botão que gera um relatório consolidado em PDF para o paciente:
 * dados do perfil, últimas consultas, receitas e exames.
 * Usa apenas leituras já permitidas pelo RLS.
 */
const PatientHealthReport = ({
  variant = "outline",
  size = "sm",
  className,
  label = "Relatório completo (PDF)",
}: PatientHealthReportProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!user) {
      toast.error("Faça login para gerar o relatório");
      return;
    }
    setLoading(true);
    try {
      // Fetch in parallel — all under user's RLS scope
      const [{ data: profile }, { data: appts }, { data: prescriptions }, { data: exams }] = await Promise.all([
        db.from("profiles").select("first_name, last_name, cpf, birth_date, phone, blood_type").eq("user_id", user.id).maybeSingle(),
        db
          .from("appointments")
          .select("id, scheduled_at, status, appointment_type, doctor_id, notes, price_at_booking")
          .eq("patient_id", user.id)
          .order("scheduled_at", { ascending: false })
          .limit(20),
        db
          .from("prescriptions")
          .select("id, created_at, medication_name, dosage, frequency, doctor_id")
          .eq("patient_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
        db
          .from("patient_documents")
          .select("id, document_type, file_name, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      // Resolve doctor names
      const doctorIds = Array.from(
        new Set([
          ...((appts ?? []).map((a: any) => a.doctor_id).filter(Boolean)),
          ...((prescriptions ?? []).map((p: any) => p.doctor_id).filter(Boolean)),
        ])
      );
      const doctorMap = new Map<string, string>();
      if (doctorIds.length > 0) {
        const { data: docs } = await db
          .from("doctors")
          .select("id, user_id, crm, crm_state")
          .in("id", doctorIds);
        const userIds = (docs ?? []).map((d: any) => d.user_id).filter(Boolean);
        const { data: profs } = userIds.length
          ? await db.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds)
          : { data: [] };
        const profByUser = new Map<string, string>(
          (profs ?? []).map((p: any) => [p.user_id, `Dr(a). ${p.first_name ?? ""} ${p.last_name ?? ""}`.trim()])
        );
        (docs ?? []).forEach((d: any) => {
          const name = profByUser.get(d.user_id) ?? "Médico(a)";
          doctorMap.set(d.id, `${name} • CRM ${d.crm}/${d.crm_state}`);
        });
      }

      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      let y = 0;

      // Header band
      doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
      doc.rect(0, 0, pageW, 28, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("AloClínica", 14, 14);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Relatório consolidado de saúde", 14, 21);
      doc.setFontSize(9);
      doc.text(format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }), pageW - 14, 21, { align: "right" });

      y = 38;
      doc.setTextColor(20, 20, 20);

      // Patient block
      doc.setFillColor(245, 248, 252);
      doc.roundedRect(10, y, pageW - 20, 28, 3, 3, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Paciente", 14, y + 7);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const fullName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || "Paciente";
      doc.text(`Nome: ${fullName}`, 14, y + 14);
      const cpfMasked = profile?.cpf ? String(profile.cpf).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : "—";
      doc.text(`CPF: ${cpfMasked}`, 14, y + 20);
      const dob = profile?.birth_date ? format(new Date(profile.birth_date), "dd/MM/yyyy") : "—";
      doc.text(`Nascimento: ${dob}`, pageW / 2, y + 14);
      doc.text(`Tipo sanguíneo: ${profile?.blood_type ?? "—"}`, pageW / 2, y + 20);
      y += 36;

      const ensureSpace = (needed: number) => {
        if (y + needed > pageH - 15) {
          doc.addPage();
          y = 18;
        }
      };

      const sectionTitle = (title: string, count: number) => {
        ensureSpace(12);
        doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
        doc.rect(10, y, 4, 6, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(20, 20, 20);
        doc.text(`${title}`, 18, y + 5);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text(`${count} ${count === 1 ? "registro" : "registros"}`, pageW - 14, y + 5, { align: "right" });
        y += 10;
        doc.setTextColor(20, 20, 20);
      };

      // Appointments
      sectionTitle("Consultas recentes", appts?.length ?? 0);
      if (!appts || appts.length === 0) {
        doc.setFontSize(9);
        doc.setTextColor(140, 140, 140);
        doc.text("Nenhuma consulta registrada.", 14, y + 4);
        y += 10;
      } else {
        doc.setFontSize(9);
        appts.forEach((a: any) => {
          ensureSpace(12);
          const when = format(new Date(a.scheduled_at), "dd/MM/yyyy HH:mm");
          const med = doctorMap.get(a.doctor_id) ?? "Médico(a)";
          const status = String(a.status ?? "—");
          doc.setFont("helvetica", "bold");
          doc.text(when, 14, y + 4);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(80, 80, 80);
          doc.text(med, 50, y + 4);
          doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
          doc.text(status, pageW - 14, y + 4, { align: "right" });
          doc.setTextColor(20, 20, 20);
          y += 7;
          // separator
          doc.setDrawColor(232, 236, 244);
          doc.line(14, y, pageW - 14, y);
          y += 2;
        });
        y += 4;
      }

      // Prescriptions
      sectionTitle("Receitas", prescriptions?.length ?? 0);
      if (!prescriptions || prescriptions.length === 0) {
        doc.setFontSize(9);
        doc.setTextColor(140, 140, 140);
        doc.text("Nenhuma receita registrada.", 14, y + 4);
        y += 10;
      } else {
        doc.setFontSize(9);
        prescriptions.forEach((p: any) => {
          ensureSpace(14);
          const when = format(new Date(p.created_at), "dd/MM/yyyy");
          const med = doctorMap.get(p.doctor_id) ?? "—";
          doc.setFont("helvetica", "bold");
          doc.text(String(p.medication_name ?? "Receita"), 14, y + 4);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(80, 80, 80);
          doc.text(`${p.dosage ?? ""} · ${p.frequency ?? ""}`, 14, y + 9);
          doc.text(`${med} • ${when}`, pageW - 14, y + 4, { align: "right" });
          doc.setTextColor(20, 20, 20);
          y += 11;
          doc.setDrawColor(232, 236, 244);
          doc.line(14, y, pageW - 14, y);
          y += 2;
        });
        y += 4;
      }

      // Documents / Exams
      sectionTitle("Exames & Documentos", exams?.length ?? 0);
      if (!exams || exams.length === 0) {
        doc.setFontSize(9);
        doc.setTextColor(140, 140, 140);
        doc.text("Nenhum documento registrado.", 14, y + 4);
        y += 10;
      } else {
        doc.setFontSize(9);
        exams.forEach((e: any) => {
          ensureSpace(10);
          const when = format(new Date(e.created_at), "dd/MM/yyyy");
          doc.setFont("helvetica", "bold");
          doc.text(String(e.document_type ?? "Documento"), 14, y + 4);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(80, 80, 80);
          doc.text(String(e.file_name ?? ""), 60, y + 4);
          doc.text(when, pageW - 14, y + 4, { align: "right" });
          doc.setTextColor(20, 20, 20);
          y += 7;
          doc.setDrawColor(232, 236, 244);
          doc.line(14, y, pageW - 14, y);
          y += 2;
        });
      }

      // Footer on every page
      const pages = (doc as any).getNumberOfPages?.() ?? 1;
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(140, 140, 140);
        doc.text(
          "Documento gerado pela plataforma AloClínica · uso pessoal do paciente",
          pageW / 2,
          pageH - 8,
          { align: "center" }
        );
        doc.text(`Página ${i} de ${pages}`, pageW - 14, pageH - 8, { align: "right" });
      }

      const fileName = `aloclinica-relatorio-${fullName.replace(/\s+/g, "-").toLowerCase()}-${format(new Date(), "yyyy-MM-dd")}.pdf`;
      doc.save(fileName);
      toast.success("Relatório gerado!", { description: "Verifique seus downloads." });
    } catch (err) {
      logError("PatientHealthReport error", err);
      toast.error("Não foi possível gerar o relatório", { description: "Tente novamente em instantes." });
    }
    setLoading(false);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleGenerate}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <>
          <FileText className="w-4 h-4 mr-2 animate-pulse" />
          Gerando...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          {label}
        </>
      )}
    </Button>
  );
};

export default PatientHealthReport;