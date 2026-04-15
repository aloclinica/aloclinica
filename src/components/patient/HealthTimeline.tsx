import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Video, FileText, Pill, Upload, ArrowLeft, Activity, Smile, TrendingUp, Filter, Download } from "lucide-react";
import { getPatientNav } from "./patientNav";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";

interface TimelineEvent {
  id: string;
  date: string;
  type: "consultation" | "prescription" | "document" | "record" | "metric" | "symptom";
  title: string;
  subtitle: string;
  icon: typeof Video;
  color: string;
  details?: string;
}

const TYPE_LABELS: Record<string, string> = {
  all: "Todos",
  consultation: "Consultas",
  prescription: "Receitas",
  document: "Documentos",
  record: "Prontuário",
  metric: "Métricas",
  symptom: "Sintomas",
};

const TYPE_ICONS: Record<string, typeof Video> = {
  consultation: Video,
  prescription: Pill,
  document: Upload,
  record: FileText,
  metric: TrendingUp,
  symptom: Smile,
};

const TYPE_COLORS: Record<string, string> = {
  consultation: "text-primary bg-primary/10",
  prescription: "text-warning bg-warning/10",
  document: "text-secondary bg-secondary/10",
  record: "text-accent-foreground bg-accent/50",
  metric: "text-success bg-success/10",
  symptom: "text-destructive bg-destructive/10",
};

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

const HealthTimeline = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");

  useEffect(() => {
    if (user) fetchTimeline();
  }, [user]);

  const fetchTimeline = async () => {
    const [apptsRes, prescsRes, docsRes, recordsRes, metricsRes, diaryRes] = await Promise.all([
      db.from("appointments").select("id, scheduled_at, status, doctor_id").eq("patient_id", user!.id).eq("status", "completed").order("scheduled_at", { ascending: false }).limit(100),
      db.from("prescriptions").select("id, created_at, diagnosis, doctor_id").eq("patient_id", user!.id).order("created_at", { ascending: false }).limit(100),
      db.from("patient_documents").select("id, created_at, file_name, description").eq("patient_id", user!.id).order("created_at", { ascending: false }).limit(100),
      db.from("medical_records").select("id, created_at, title, record_type, cid_code").eq("patient_id", user!.id).order("created_at", { ascending: false }).limit(100),
      db.from("health_metrics").select("id, measured_at, type, value, unit, notes").eq("patient_id", user!.id).order("measured_at", { ascending: false }).limit(100),
      db.from("symptom_diary").select("id, entry_date, mood, symptoms, notes").eq("patient_id", user!.id).order("entry_date", { ascending: false }).limit(100),
    ]);

    // Fetch doctor names
    const allDoctorIds = [
      ...new Set([
        ...(apptsRes.data?.map(a => a.doctor_id) ?? []),
        ...(prescsRes.data?.map(p => p.doctor_id) ?? []),
      ]),
    ];
    const docNames = new Map<string, string>();
    if (allDoctorIds.length > 0) {
      const { data: docs } = await db.from("doctor_profiles").select("id, user_id").in("id", allDoctorIds);
      if (docs && docs.length > 0) {
        const userIds = docs.map(d => d.user_id);
        const { data: profiles } = await db.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds);
        docs.forEach(d => {
          const p = profiles?.find(pr => pr.user_id === d.user_id);
          if (p) docNames.set(d.id, `Dr(a). ${p.first_name} ${p.last_name}`);
        });
      }
    }

    const timeline: TimelineEvent[] = [
      ...(apptsRes.data?.map(a => ({
        id: `appt-${a.id}`, date: a.scheduled_at, type: "consultation" as const,
        title: "Consulta Realizada", subtitle: docNames.get(a.doctor_id) ?? "Médico",
        icon: Video, color: TYPE_COLORS.consultation,
      })) ?? []),
      ...(prescsRes.data?.map(p => ({
        id: `presc-${p.id}`, date: p.created_at, type: "prescription" as const,
        title: p.diagnosis || "Receita Médica", subtitle: docNames.get(p.doctor_id) ?? "Médico",
        icon: Pill, color: TYPE_COLORS.prescription,
      })) ?? []),
      ...(docsRes.data?.map(d => ({
        id: `doc-${d.id}`, date: d.created_at, type: "document" as const,
        title: d.file_name, subtitle: d.description || "Documento anexado",
        icon: Upload, color: TYPE_COLORS.document,
      })) ?? []),
      ...(recordsRes.data?.map(r => ({
        id: `rec-${r.id}`, date: r.created_at, type: "record" as const,
        title: r.title, subtitle: `${r.record_type}${r.cid_code ? ` · ${r.cid_code}` : ""}`,
        icon: FileText, color: TYPE_COLORS.record,
      })) ?? []),
      ...(metricsRes.data?.map(m => ({
        id: `met-${m.id}`, date: m.measured_at!, type: "metric" as const,
        title: `${m.type}: ${m.value} ${m.unit}`, subtitle: m.notes || "Métrica registrada",
        icon: TrendingUp, color: TYPE_COLORS.metric, details: `${m.value} ${m.unit}`,
      })) ?? []),
      ...(diaryRes.data?.map(d => ({
        id: `diary-${d.id}`, date: d.entry_date, type: "symptom" as const,
        title: `Humor: ${d.mood}`, subtitle: (d.symptoms as string[] | null)?.join(", ") || d.notes || "Registro do dia",
        icon: Smile, color: TYPE_COLORS.symptom,
      })) ?? []),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setEvents(timeline);
    setLoading(false);
  };

  // Apply filters
  const now = new Date();
  const filtered = events.filter(ev => {
    if (typeFilter !== "all" && ev.type !== typeFilter) return false;
    if (periodFilter !== "all") {
      const evDate = new Date(ev.date);
      if (periodFilter === "7d" && now.getTime() - evDate.getTime() > 7 * 86400000) return false;
      if (periodFilter === "30d" && now.getTime() - evDate.getTime() > 30 * 86400000) return false;
      if (periodFilter === "90d" && now.getTime() - evDate.getTime() > 90 * 86400000) return false;
      if (periodFilter === "1y" && now.getTime() - evDate.getTime() > 365 * 86400000) return false;
    }
    return true;
  });

  // Group by month
  const grouped = filtered.reduce<Record<string, TimelineEvent[]>>((acc, ev) => {
    const key = format(new Date(ev.date), "MMMM yyyy", { locale: ptBR });
    (acc[key] = acc[key] || []).push(ev);
    return acc;
  }, {});

  // Export PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Linha do Tempo de Saúde", 20, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${format(now, "dd/MM/yyyy HH:mm")}`, 20, 28);

    let y = 40;
    filtered.forEach(ev => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFontSize(9);
      doc.text(format(new Date(ev.date), "dd/MM/yyyy HH:mm"), 20, y);
      doc.setFontSize(10);
      doc.text(`[${TYPE_LABELS[ev.type] || ev.type}] ${ev.title}`, 55, y);
      doc.setFontSize(8);
      doc.text(ev.subtitle, 55, y + 4);
      y += 12;
    });
    doc.save("timeline-saude.pdf");
  };

  // Type counts for filter badges
  const typeCounts = events.reduce<Record<string, number>>((acc, ev) => {
    acc[ev.type] = (acc[ev.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("health")}>
      <div className="w-full mx-auto max-w-2xl pb-24 md:pb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Linha do Tempo</h1>
            {!loading && <Badge variant="outline" className="text-[10px] h-5">{filtered.length} eventos</Badge>}
          </div>
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={exportPDF} disabled={filtered.length === 0}>
            <Download className="w-3.5 h-3.5" /> PDF
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 w-[140px] text-xs">
              <Filter className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {Object.entries(TYPE_LABELS).filter(([k]) => k !== "all").map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label} {typeCounts[key] ? `(${typeCounts[key]})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="h-9 w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo período</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Último mês</SelectItem>
              <SelectItem value="90d">Últimos 3 meses</SelectItem>
              <SelectItem value="1y">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Type chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-hide">
          {Object.entries(TYPE_LABELS).filter(([k]) => k !== "all").map(([key, label]) => {
            const Icon = TYPE_ICONS[key];
            const count = typeCounts[key] || 0;
            if (count === 0) return null;
            return (
              <Badge
                key={key}
                variant={typeFilter === key ? "default" : "outline"}
                className="cursor-pointer shrink-0 h-7 px-2.5 text-[11px] rounded-full gap-1 active:scale-95 transition-transform"
                onClick={() => setTypeFilter(typeFilter === key ? "all" : key)}
              >
                <Icon className="w-3 h-3" /> {label} ({count})
              </Badge>
            );
          })}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Activity className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm font-medium">Nenhum evento encontrado.</p>
              <p className="text-xs mt-1">
                {typeFilter !== "all" || periodFilter !== "all"
                  ? "Ajuste os filtros para ver mais resultados."
                  : "Após sua primeira consulta, sua linha do tempo aparecerá aqui."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            <AnimatePresence mode="popLayout">
              {Object.entries(grouped).map(([month, evts]) => (
                <motion.div key={month} variants={fadeUp} initial="hidden" animate="show" exit="exit">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-xs capitalize font-semibold">{month}</Badge>
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] text-muted-foreground">{evts.length} evento{evts.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="relative pl-6 border-l-2 border-border/50 space-y-3">
                    {evts.map(ev => {
                      const Icon = ev.icon;
                      return (
                        <motion.div key={ev.id} variants={fadeUp} className="relative">
                          <div className={`absolute -left-[calc(0.75rem+1px)] top-2 w-6 h-6 rounded-full flex items-center justify-center ${ev.color}`}>
                            <Icon className="w-3 h-3" />
                          </div>
                          <Card className="border-border/50 hover:shadow-sm transition-shadow">
                            <CardContent className="p-3 flex items-center justify-between">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-sm font-medium text-foreground truncate">{ev.title}</p>
                                  <Badge variant="outline" className="text-[9px] h-4 px-1 shrink-0">
                                    {TYPE_LABELS[ev.type]}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{ev.subtitle}</p>
                              </div>
                              <p className="text-[10px] text-muted-foreground shrink-0 ml-2">
                                {format(new Date(ev.date), "dd/MM · HH:mm")}
                              </p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default HealthTimeline;
