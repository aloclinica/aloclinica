import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { CheckCircle2, Calendar, Clock, Video, ArrowRight, Stethoscope, Download, Home, ListChecks, Loader2, Copy, Wifi, Mic, Camera, FileText, Receipt } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getPatientNav } from "./patientNav";

interface ConfirmedAppointment {
  id: string;
  scheduled_at: string;
  appointment_type: string;
  price_at_booking: number | null;
  payment_status: string | null;
  status: string | null;
  doctor_id: string;
  doctor_name: string;
  doctor_specialty: string | null;
  doctor_crm: string | null;
  doctor_crm_state: string | null;
  duration_minutes: number;
}

const formatBRL = (v: number | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v ?? 0));

// Formata Date para horário local de São Paulo no formato ICS (YYYYMMDDTHHMMSS)
const fmtLocalSP = (d: Date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).formatToParts(d).reduce<Record<string, string>>((acc, p) => {
    if (p.type !== "literal") acc[p.type] = p.value;
    return acc;
  }, {});
  return `${parts.year}${parts.month}${parts.day}T${parts.hour}${parts.minute}${parts.second}`;
};

// UTC no formato ICS (YYYYMMDDTHHMMSSZ) — usado em DTSTAMP
const fmtUtc = (d: Date) =>
  d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

const escapeIcs = (s: string) =>
  String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

const buildIcsDataUri = (appt: ConfirmedAppointment, roomUrl: string) => {
  const start = new Date(appt.scheduled_at);
  const duration = Math.max(5, Number(appt.duration_minutes) || 30);
  const end = new Date(start.getTime() + duration * 60 * 1000);

  // Bloco VTIMEZONE para America/Sao_Paulo (UTC-3, sem DST desde 2019)
  const vtimezone = [
    "BEGIN:VTIMEZONE",
    "TZID:America/Sao_Paulo",
    "X-LIC-LOCATION:America/Sao_Paulo",
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:-0300",
    "TZOFFSETTO:-0300",
    "TZNAME:-03",
    "END:STANDARD",
    "END:VTIMEZONE",
  ];

  const description = escapeIcs(
    `Consulta online AloClínica com ${appt.doctor_name}.\n` +
    `Duração: ${duration} minutos.\n` +
    `Link da sala: ${roomUrl}\n` +
    `Entre 5 minutos antes para testar câmera e microfone.`
  );

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AloClinica//Telemedicina//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...vtimezone,
    "BEGIN:VEVENT",
    `UID:${appt.id}@aloclinica`,
    `DTSTAMP:${fmtUtc(new Date())}`,
    `DTSTART;TZID=America/Sao_Paulo:${fmtLocalSP(start)}`,
    `DTEND;TZID=America/Sao_Paulo:${fmtLocalSP(end)}`,
    `DURATION:PT${duration}M`,
    `SUMMARY:${escapeIcs(`Teleconsulta com ${appt.doctor_name}`)}`,
    `DESCRIPTION:${description}`,
    `URL:${roomUrl}`,
    `LOCATION:${escapeIcs(roomUrl)}`,
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Sua teleconsulta começa em 15 minutos",
    "TRIGGER:-PT15M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);
};

const AppointmentConfirmed = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appt, setAppt] = useState<ConfirmedAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const nav = getPatientNav("appointments");

  // Tick a cada 30s para reavaliar a janela de entrada na sala
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchAppt = async () => {
      if (!appointmentId) return;
      const { data } = await db
        .from("appointments")
        .select("id, scheduled_at, appointment_type, price_at_booking, payment_status, status, doctor_id")
        .eq("id", appointmentId)
        .maybeSingle();

      if (!data) {
        setLoading(false);
        return;
      }

      // Buscar médico via view pública
      const { data: doc } = await db
        .from("doctor_profiles_public" as any)
        .select("display_name, full_name, crm, crm_state, specialty_names, consultation_duration")
        .eq("id", data.doctor_id)
        .maybeSingle();

      const docAny = doc as any;
      setAppt({
        ...data,
        doctor_name: docAny?.display_name || docAny?.full_name || "Médico AloClínica",
        doctor_specialty: docAny?.specialty_names?.[0] ?? null,
        doctor_crm: docAny?.crm ?? null,
        doctor_crm_state: docAny?.crm_state ?? null,
        duration_minutes: Number(docAny?.consultation_duration) || 30,
      });
      setLoading(false);
    };
    fetchAppt();
  }, [appointmentId]);

  if (loading) {
    return (
      <DashboardLayout title="Confirmação" nav={nav}>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!appt) {
    return (
      <DashboardLayout title="Confirmação" nav={nav}>
        <div className="text-center py-20">
          <Stethoscope className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <h2 className="text-lg font-bold mb-1">Consulta não encontrada</h2>
          <p className="text-sm text-muted-foreground mb-6">Verifique seus agendamentos.</p>
          <Button onClick={() => navigate("/dashboard/appointments")} className="rounded-xl">
            <ListChecks className="w-4 h-4 mr-2" /> Ver minhas consultas
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const date = new Date(appt.scheduled_at);
  const isPaid = ["approved", "confirmed", "received", "paid"].includes(String(appt.payment_status));
  const minutesUntil = Math.round((date.getTime() - now) / 60000);
  const canJoinSoon = minutesUntil <= 15 && minutesUntil >= -120;
  const joinLabel = canJoinSoon
    ? "Entrar na sala da consulta"
    : minutesUntil > 15
      ? `Sala abre em ${
          minutesUntil >= 60
            ? `${Math.floor(minutesUntil / 60)}h ${minutesUntil % 60}min`
            : `${minutesUntil} min`
        }`
      : "Consulta encerrada";
  const roomUrl = `${window.location.origin}/dashboard/consultation/${appt.id}`;

  const copyRoomLink = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      toast.success("Link da consulta copiado!");
    } catch {
      toast.error("Não foi possível copiar o link");
    }
  };

  return (
    <DashboardLayout title="Consulta confirmada" nav={nav}>
      <div className="w-full max-w-xl mx-auto pb-24 md:pb-6">
        {/* Hero check */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 240, damping: 18 }}
          className="flex flex-col items-center text-center py-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 260 }}
            className="relative mb-5"
          >
            <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/30">
              <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2.5} />
            </div>
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-2">
            {isPaid ? "Consulta confirmada!" : "Reserva criada!"}
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            {isPaid
              ? "Seu pagamento foi aprovado. Você receberá um lembrete antes do horário."
              : "Finalize o pagamento em até 30 minutos para garantir sua vaga."}
          </p>
        </motion.div>

        {/* Appointment summary card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card variant="elevated" className="overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-5 border-b border-border/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-primary mb-1">Sua teleconsulta</p>
                    <h2 className="font-bold text-foreground text-lg leading-tight">{appt.doctor_name}</h2>
                    {appt.doctor_specialty && (
                      <p className="text-xs text-muted-foreground mt-0.5">{appt.doctor_specialty}</p>
                    )}
                    {appt.doctor_crm && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">CRM {appt.doctor_crm_state} {appt.doctor_crm}</p>
                    )}
                  </div>
                  <Badge className={isPaid
                    ? "bg-emerald-500/15 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                    : "bg-amber-500/15 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                  }>
                    {isPaid ? "Pago" : "Aguardando pagamento"}
                  </Badge>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">Data</p>
                    <p className="text-sm font-semibold text-foreground capitalize">
                      {format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">Horário</p>
                    <p className="text-sm font-semibold text-foreground">{format(date, "HH:mm", { locale: ptBR })}h</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Video className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">Modalidade</p>
                    <p className="text-sm font-semibold text-foreground">Vídeo · criptografado</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/40 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Valor</span>
                  <span className="text-lg font-black text-foreground tabular-nums">
                    {formatBRL(appt.price_at_booking)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 space-y-2.5"
        >
          {isPaid && (
            <Button
              className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold shadow-md"
              onClick={() => navigate(`/dashboard/consultation/${appt.id}`)}
              disabled={!canJoinSoon}
            >
              <Video className="w-4 h-4 mr-2" />
              {joinLabel}
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Button>
          )}

          <Button
            variant={isPaid ? "outline" : "default"}
            className={`w-full h-12 rounded-xl font-bold ${isPaid ? "" : "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-md"}`}
            onClick={() => navigate(`/dashboard/appointments`)}
          >
            <ListChecks className="w-4 h-4 mr-2" /> Ver minhas consultas
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Button>

          <div className="grid grid-cols-3 gap-2.5">
            <Button asChild variant="outline" className="h-11 rounded-xl">
              <a href={buildIcsDataUri(appt, roomUrl)} download={`consulta-${appt.id}.ics`}>
                <Download className="w-4 h-4 mr-1.5" /> Agenda
              </a>
            </Button>
            <Button variant="outline" className="h-11 rounded-xl" onClick={copyRoomLink}>
              <Copy className="w-4 h-4 mr-1.5" /> Copiar link
            </Button>
            <Button variant="outline" className="h-11 rounded-xl" onClick={() => navigate("/dashboard")}>
              <Home className="w-4 h-4 mr-1.5" /> Início
            </Button>
          </div>

          {isPaid && (
            <Button
              variant="outline"
              className="w-full h-11 rounded-xl border-primary/30 text-primary hover:bg-primary/5"
              onClick={() => navigate(`/dashboard/appointments/${appt.id}/recibo`)}
            >
              <Receipt className="w-4 h-4 mr-2" /> Baixar recibo da consulta
            </Button>
          )}
        </motion.div>

        {/* Preparation checklist */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6"
        >
          <Card className="border-border/60">
            <CardContent className="p-5">
              <p className="text-[11px] uppercase tracking-wider font-bold text-primary mb-3">
                Como se preparar
              </p>
              <ul className="space-y-2.5 text-sm text-foreground">
                <li className="flex items-start gap-2.5">
                  <Wifi className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  Conexão estável de internet (Wi-Fi ou 4G).
                </li>
                <li className="flex items-start gap-2.5">
                  <Camera className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  Câmera e microfone funcionando — testaremos antes de entrar.
                </li>
                <li className="flex items-start gap-2.5">
                  <Mic className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  Ambiente silencioso e privado para a conversa.
                </li>
                <li className="flex items-start gap-2.5">
                  <FileText className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  Tenha em mãos exames recentes, receitas e lista de medicamentos.
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* Trust strip */}
        <p className="text-center text-[11px] text-muted-foreground mt-8">
          Você receberá uma confirmação por WhatsApp e e-mail. Em caso de imprevisto, é possível remarcar gratuitamente até 2h antes.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default AppointmentConfirmed;