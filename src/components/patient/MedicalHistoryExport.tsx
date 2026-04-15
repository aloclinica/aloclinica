import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

const MedicalHistoryExport = () => {
  const { user, profile } = useAuth();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);

    try {
      // Fetch all data in parallel
      const [appointmentsRes, prescriptionsRes, recordsRes, documentsRes, diaryRes] = await Promise.all([
        db.from("appointments").select("id, scheduled_at, status, appointment_type, notes, doctor_id").eq("patient_id", user.id).order("scheduled_at", { ascending: false }),
        db.from("prescriptions").select("id, created_at, diagnosis, medications, observations, doctor_id").eq("patient_id", user.id).order("created_at", { ascending: false }),
        db.from("medical_records").select("*").eq("patient_id", user.id).order("created_at", { ascending: false }),
        db.from("patient_documents").select("file_name, description, created_at").eq("patient_id", user.id).order("created_at", { ascending: false }),
        db.from("symptom_diary").select("*").eq("patient_id", user.id).order("entry_date", { ascending: false }).limit(30),
      ]);

      // Fetch doctor names
      const doctorIds = [...new Set([
        ...(appointmentsRes.data?.map(a => a.doctor_id) ?? []),
        ...(prescriptionsRes.data?.map(p => p.doctor_id) ?? []),
      ])];

      const doctorNames: Record<string, string> = {};
      if (doctorIds.length > 0) {
        const { data: docs } = await db.from("doctor_profiles").select("id, user_id").in("id", doctorIds);
        if (docs && docs.length > 0) {
          const { data: profs } = await db.from("profiles").select("user_id, first_name, last_name").in("user_id", docs.map(d => d.user_id));
          docs.forEach(d => {
            const p = profs?.find(pr => pr.user_id === d.user_id);
            if (p) doctorNames[d.id] = `Dr(a). ${p.first_name} ${p.last_name}`;
          });
        }
      }

      // Generate PDF
      const doc = new jsPDF();
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      let y = 0;

      const addPage = () => { doc.addPage(); y = 20; };
      const checkPage = (needed: number) => { if (y + needed > ph - 20) addPage(); };

      // Header
      doc.setFillColor(26, 111, 196);
      doc.rect(0, 0, pw, 30, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text("Prontuário Médico Completo", 15, 14);
      doc.setFontSize(9);
      doc.text(`${profile?.first_name} ${profile?.last_name} · Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 15, 22);
      y = 38;

      // Patient info
      doc.setFillColor(240, 246, 255);
      doc.roundedRect(15, y, pw - 30, 20, 3, 3, "F");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("DADOS DO PACIENTE", 19, y + 6);
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      doc.text(`Nome: ${profile?.first_name} ${profile?.last_name} · CPF: ${profile?.cpf || "Não informado"}`, 19, y + 14);
      y += 28;

      // Section helper
      const sectionTitle = (title: string) => {
        checkPage(20);
        doc.setFillColor(26, 111, 196);
        doc.rect(15, y, pw - 30, 8, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text(title, 19, y + 6);
        y += 14;
      };

      // Appointments
      const appts = appointmentsRes.data ?? [];
      sectionTitle(`CONSULTAS (${appts.length})`);
      appts.forEach(a => {
        checkPage(14);
        doc.setFontSize(9);
        doc.setTextColor(30, 30, 30);
        doc.text(`${format(new Date(a.scheduled_at), "dd/MM/yyyy HH:mm")} · ${a.status} · ${doctorNames[a.doctor_id] || "Médico"}`, 19, y);
        if (a.notes) { doc.setTextColor(100, 100, 100); doc.text(`  ↳ ${a.notes.substring(0, 80)}`, 19, y + 5); y += 5; }
        y += 7;
      });

      // Prescriptions
      const rxs = prescriptionsRes.data ?? [];
      sectionTitle(`RECEITAS (${rxs.length})`);
      rxs.forEach(rx => {
        checkPage(18);
        doc.setFontSize(9);
        doc.setTextColor(30, 30, 30);
        doc.text(`${format(new Date(rx.created_at), "dd/MM/yyyy")} · ${doctorNames[rx.doctor_id] || "Médico"} · ${rx.diagnosis || "Sem diagnóstico"}`, 19, y);
        y += 5;
        const meds = Array.isArray(rx.medications) ? rx.medications : [];
        meds.forEach((m: unknown) => {
          checkPage(6);
          doc.setTextColor(80, 80, 80);
          const med = m as Record<string, string>;
          doc.text(`  💊 ${typeof m === "string" ? m : med.name || "Medicamento"} ${med.dosage ? `- ${med.dosage}` : ""}`, 19, y);
          y += 5;
        });
        y += 3;
      });

      // Medical Records
      const recs = recordsRes.data ?? [];
      if (recs.length > 0) {
        sectionTitle(`PRONTUÁRIO (${recs.length})`);
        recs.forEach(r => {
          checkPage(10);
          doc.setFontSize(9);
          doc.setTextColor(30, 30, 30);
          doc.text(`${r.record_type} · ${r.title} ${r.cid_code ? `(${r.cid_code})` : ""} · ${r.is_active ? "Ativo" : "Resolvido"}`, 19, y);
          if (r.description) { y += 5; doc.setTextColor(100, 100, 100); doc.text(`  ${r.description.substring(0, 90)}`, 19, y); }
          y += 7;
        });
      }

      // Symptom Diary
      const diary = diaryRes.data ?? [];
      if (diary.length > 0) {
        sectionTitle(`DIÁRIO DE SINTOMAS (últimos 30 registros)`);
        diary.forEach((d: Record<string, unknown>) => {
          checkPage(8);
          doc.setFontSize(8);
          doc.setTextColor(30, 30, 30);
          const syms = Array.isArray(d.symptoms) ? d.symptoms.join(", ") : "";
          doc.text(`${d.entry_date} · ${d.mood} · ${syms || "Sem sintomas"}`, 19, y);
          y += 5;
        });
      }

      // Footer
      checkPage(20);
      y += 5;
      doc.setDrawColor(200, 200, 200);
      doc.line(15, y, pw - 15, y);
      y += 8;
      doc.setFontSize(7);
      doc.setTextColor(140, 140, 140);
      doc.text("Documento gerado pela plataforma Aloclinica · Dados protegidos pela LGPD · Uso exclusivo do paciente", pw / 2, y, { align: "center" });

      doc.save(`prontuario-${profile?.first_name}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("Prontuário exportado com sucesso!");
    } catch {
      toast.error("Erro ao exportar prontuário");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={exporting}
      className="gap-2 text-xs h-9 px-2.5 sm:px-3"
      title="Exportar Prontuário"
    >
      {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
      <span className="hidden sm:inline">{exporting ? "Exportando..." : "Exportar Prontuário"}</span>
    </Button>
  );
};

export default MedicalHistoryExport;
