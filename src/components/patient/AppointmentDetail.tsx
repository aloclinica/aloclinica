import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getPatientNav } from "./patientNav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Share2, Calendar, Clock, MapPin, AlertTriangle, Check, RotateCcw, X, Star, Video, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface AppointmentData {
  id: string;
  scheduled_at: string;
  status: string;
  duration_minutes: number | null;
  notes: string | null;
  doctor_name: string;
  doctor_crm: string;
  specialties: string[];
  rating: number | null;
}

const AppointmentDetail = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appt, setAppt] = useState<AppointmentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && appointmentId) fetchAppointment();
  }, [user, appointmentId]);

  const fetchAppointment = async () => {
    const { data } = await db
      .from("appointments")
      .select("id, scheduled_at, status, duration_minutes, notes, doctor_id")
      .eq("id", appointmentId!)
      .single();

    if (!data) { setLoading(false); return; }

    const { data: doc } = await db
      .from("doctor_profiles")
      .select("id, crm, rating, user_id")
      .eq("id", data.doctor_id)
      .single();

    let doctorName = "Médico";
    let specialties: string[] = [];

    if (doc) {
      const { data: profile } = await db
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", doc.user_id)
        .single();
      if (profile) doctorName = `Dr(a). ${profile.first_name} ${profile.last_name}`;

      const { data: specs } = await db
        .from("doctor_specialties")
        .select("specialty_id")
        .eq("doctor_id", doc.id);
      if (specs?.length) {
        const { data: specNames } = await db
          .from("specialties")
          .select("name")
          .in("id", specs.map(s => s.specialty_id));
        specialties = specNames?.map(s => s.name) ?? [];
      }
    }

    setAppt({
      id: data.id,
      scheduled_at: data.scheduled_at,
      status: data.status,
      duration_minutes: data.duration_minutes,
      notes: data.notes,
      doctor_name: doctorName,
      doctor_crm: doc?.crm ?? "",
      specialties,
      rating: doc?.rating ?? null,
    });
    setLoading(false);
  };

  const prepInstructions = [
    "Esteja em jejum de 8 horas (se aplicável)",
    "Leve seus exames recentes",
    "Anote suas dúvidas e sintomas",
    "Tenha seus documentos em mãos",
  ];

  if (loading) {
    return (
      <DashboardLayout title="Paciente" nav={getPatientNav("appointments")} role="patient">
        <div className="max-w-2xl mx-auto space-y-4 pb-24">
          <Skeleton className="h-52 rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!appt) {
    return (
      <DashboardLayout title="Paciente" nav={getPatientNav("appointments")} role="patient">
        <div className="text-center py-20">
          <p className="text-muted-foreground">Consulta não encontrada.</p>
          <Button variant="outline" className="mt-4 rounded-full" onClick={() => navigate("/dashboard/appointments?role=patient")}>
            Voltar
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const date = new Date(appt.scheduled_at);
  const initials = appt.doctor_name.replace("Dr(a). ", "").split(" ").map(n => n[0]).join("").slice(0, 2);

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("appointments")} role="patient">
      <div className="max-w-2xl mx-auto pb-24 md:pb-6">
        {/* Top nav */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <button className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-primary via-[hsl(215_70%_38%)] to-[hsl(215_55%_48%)] p-6 text-center mb-5"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/[0.06] blur-[40px]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="relative z-10">
            <Avatar className="w-20 h-20 mx-auto border-4 border-white/20 mb-3 shadow-[0_8px_24px_rgba(0,0,0,0.2)]">
              <AvatarFallback className="bg-white/20 text-primary-foreground text-xl font-bold backdrop-blur-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            {appt.specialties.length > 0 && (
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary-foreground/60 mb-1">
                {appt.specialties[0]} Especialista
              </p>
            )}
            <h2 className="font-[Manrope] text-[22px] font-extrabold text-primary-foreground">
              {appt.doctor_name}
            </h2>
            {appt.rating && (
              <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm">
                <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                <span className="text-sm font-bold text-primary-foreground">{appt.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Date + Time Grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden bg-card rounded-2xl p-4 border border-border/20 shadow-sm"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary/30" />
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-2">Data</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[15px] font-bold text-foreground">
                {format(date, "dd 'de' MMMM", { locale: ptBR })}
              </span>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative overflow-hidden bg-card rounded-2xl p-4 border border-border/20 shadow-sm"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-secondary/30" />
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-2">Horário</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-secondary/8 flex items-center justify-center">
                <Clock className="w-4 h-4 text-secondary" />
              </div>
              <span className="text-[15px] font-bold text-foreground">
                {format(date, "HH:mm")}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Location */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl p-4 border border-border/20 shadow-sm mb-3"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center">
                <Video className="w-4 h-4 text-primary" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Modalidade</p>
            </div>
          </div>
          <p className="text-[15px] font-bold text-foreground mt-1">Teleconsulta Online</p>
          <p className="text-[13px] text-muted-foreground">Acesse pela plataforma AloClínica</p>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl p-5 mb-6 bg-gradient-to-br from-warning/[0.06] to-warning/[0.02] border border-warning/15"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-warning/15 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-warning" />
            </div>
            <span className="text-[14px] font-bold text-foreground">Instruções de Preparo</span>
          </div>
          <ul className="space-y-2.5">
            {prepInstructions.map((inst, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[13px] text-muted-foreground">
                <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-success" />
                </div>
                {inst}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Actions */}
        {appt.status === "scheduled" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <Button
              className="w-full h-[52px] rounded-full bg-primary text-primary-foreground font-[Manrope] font-bold text-[15px] shadow-[0_4px_16px_hsl(215_75%_32%/0.3)]"
              onClick={() => toast.info("Check-in disponível 15 min antes da consulta")}
            >
              <ShieldCheck className="w-5 h-5 mr-2" /> Realizar Check-in Agora
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-12 rounded-full gap-2 border-border/30 hover:bg-muted/30"
                onClick={() => toast.info("Em breve: reagendamento")}
              >
                <RotateCcw className="w-4 h-4" /> Reagendar
              </Button>
              <Button
                variant="outline"
                className="h-12 rounded-full gap-2 bg-destructive/[0.04] border-destructive/15 text-destructive hover:bg-destructive/10"
                onClick={() => toast.info("Em breve: cancelamento")}
              >
                <X className="w-4 h-4" /> Cancelar
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AppointmentDetail;
