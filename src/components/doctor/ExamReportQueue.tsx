import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import { toast } from "sonner";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getDoctorNav } from "@/components/doctor/doctorNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Loader2, ClipboardList, Eye, UserCheck, Search, X, ThumbsUp, ChevronDown,
  FileEdit, Mic, Download, Share2, Send, Filter, Calendar, Sun, Moon, Cloud,
  ArrowLeft, CalendarDays, CalendarRange, User2, LayoutGrid, List, AlertTriangle,
  Clock, CheckCircle2, TrendingUp, TrendingDown, Minus, Radio
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, setHours, setMinutes, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { motion, AnimatePresence } from "framer-motion";

/* ── Status config ── */
const statusLabels: Record<string, string> = {
  pending: "PENDENTE",
  in_review: "DIGITANDO",
  reported: "PRONTO",
  delivered: "ASSINADO",
  unsigned: "NÃO ASSINADO",
};
const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-700 border-yellow-500/40",
  in_review: "bg-blue-500/15 text-blue-700 border-blue-500/40",
  reported: "bg-green-500/15 text-green-700 border-green-500/40",
  delivered: "bg-muted text-muted-foreground border-border",
  unsigned: "bg-orange-500/15 text-orange-700 border-orange-500/40",
};

const kanbanColors: Record<string, string> = {
  pending: "border-l-4 border-l-blue-500",
  in_review: "border-l-4 border-l-yellow-500",
  reported: "border-l-4 border-l-green-500",
  delivered: "border-l-4 border-l-muted-foreground",
};

const MODALITIES = ["RF", "CT", "CR", "DX", "US", "MG", "MR"] as const;
const LAUDO_STATUSES = ["pending", "in_review", "reported", "unsigned"] as const;

type DatePreset = "hoje" | "manha" | "tarde" | "noite" | "ontem" | "semana" | "mes" | "custom";
type ViewMode = "table" | "kanban";

/* ── SLA Countdown ── */
const SlaCountdown = ({ deadline }: { deadline: string | null }) => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  if (!deadline) return <span className="text-xs text-muted-foreground">—</span>;
  const mins = differenceInMinutes(new Date(deadline), now);
  const hrs = Math.floor(Math.abs(mins) / 60);
  const m = Math.abs(mins) % 60;
  const overdue = mins < 0;
  const color = overdue ? "text-destructive" : mins < 60 ? "text-yellow-500" : "text-green-500";

  return (
    <span className={`text-xs font-mono font-semibold ${color}`}>
      {overdue ? "-" : ""}{hrs}h{m.toString().padStart(2, "0")}m
    </span>
  );
};

const ExamReportQueue = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [newExamIds, setNewExamIds] = useState<Set<string>>(new Set());

  /* ── Filter state ── */
  const [datePreset, setDatePreset] = useState<DatePreset>("hoje");
  const [dateStart, setDateStart] = useState(format(new Date(), "yyyy-MM-dd'T'00:00:00"));
  const [dateEnd, setDateEnd] = useState(format(new Date(), "yyyy-MM-dd'T'23:59:59"));
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([...LAUDO_STATUSES]);
  const [selectedModalities, setSelectedModalities] = useState<string[]>([...MODALITIES]);
  const [priorityFilter, setPriorityFilter] = useState("all");

  /* Apply date preset */
  const applyPreset = (preset: DatePreset) => {
    setDatePreset(preset);
    const now = new Date();
    const today = startOfDay(now);
    const todayEnd = endOfDay(now);

    switch (preset) {
      case "hoje":
        setDateStart(format(today, "yyyy-MM-dd'T'HH:mm:ss"));
        setDateEnd(format(todayEnd, "yyyy-MM-dd'T'HH:mm:ss"));
        break;
      case "manha":
        setDateStart(format(today, "yyyy-MM-dd'T'HH:mm:ss"));
        setDateEnd(format(setMinutes(setHours(today, 12), 0), "yyyy-MM-dd'T'HH:mm:ss"));
        break;
      case "tarde":
        setDateStart(format(setHours(today, 12), "yyyy-MM-dd'T'HH:mm:ss"));
        setDateEnd(format(setHours(today, 18), "yyyy-MM-dd'T'HH:mm:ss"));
        break;
      case "noite":
        setDateStart(format(setHours(today, 18), "yyyy-MM-dd'T'HH:mm:ss"));
        setDateEnd(format(todayEnd, "yyyy-MM-dd'T'HH:mm:ss"));
        break;
      case "ontem": {
        const yesterday = subDays(today, 1);
        setDateStart(format(yesterday, "yyyy-MM-dd'T'HH:mm:ss"));
        setDateEnd(format(endOfDay(yesterday), "yyyy-MM-dd'T'HH:mm:ss"));
        break;
      }
      case "semana":
        setDateStart(format(startOfWeek(now, { locale: ptBR }), "yyyy-MM-dd'T'HH:mm:ss"));
        setDateEnd(format(endOfWeek(now, { locale: ptBR }), "yyyy-MM-dd'T'HH:mm:ss"));
        break;
      case "mes":
        setDateStart(format(startOfMonth(now), "yyyy-MM-dd'T'HH:mm:ss"));
        setDateEnd(format(endOfMonth(now), "yyyy-MM-dd'T'HH:mm:ss"));
        break;
      case "custom":
        break;
    }
  };

  const toggleStatus = (s: string) => {
    setSelectedStatuses(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };
  const toggleModality = (m: string) => {
    setSelectedModalities(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    );
  };
  const clearFilters = () => {
    setPatientSearch("");
    setSelectedStatuses([...LAUDO_STATUSES]);
    setSelectedModalities([...MODALITIES]);
    setPriorityFilter("all");
    applyPreset("hoje");
  };

  /* ── Queries ── */
  const { data: doctorProfile } = useQuery({
    queryKey: ["doctor-profile-queue", user?.id],
    queryFn: async () => {
      const { data } = await db
        .from("doctor_profiles")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: examRequests, isLoading } = useQuery({
    queryKey: ["exam-requests-queue", dateStart, dateEnd, selectedStatuses, selectedModalities, priorityFilter],
    queryFn: async () => {
      let query = db
        .from("exam_requests" as never)
        .select("*")
        .gte("created_at", dateStart)
        .lte("created_at", dateEnd)
        .order("created_at", { ascending: false });

      if (selectedStatuses.length > 0 && selectedStatuses.length < LAUDO_STATUSES.length) {
        query = query.in("status", selectedStatuses);
      }
      if (priorityFilter !== "all") {
        query = query.eq("priority", priorityFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const patientIds = [...new Set((data || []).filter((e: any) => e.patient_id).map((e: any) => e.patient_id))];
      const patientMap: Record<string, string> = {};
      if (patientIds.length > 0) {
        const { data: profiles } = await db
          .from("profiles")
          .select("user_id, first_name, last_name")
          .in("user_id", patientIds);
        if (profiles) {
          profiles.forEach((p: any) => {
            patientMap[p.user_id] = `${p.first_name} ${p.last_name}`.trim();
          });
        }
      }

      return (data || []).map((e: any) => ({
        ...e,
        patient_name: e.patient_id ? patientMap[e.patient_id] || "Paciente" : (e.patient_name || "—"),
      }));
    },
    enabled: !!user,
  });

  /* ── Realtime subscription ── */
  useEffect(() => {
    const channel = db
      .channel("exam-requests-realtime")
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "exam_requests" },
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            const newExam = payload.new;
            setNewExamIds(prev => new Set(prev).add(newExam.id));
            setTimeout(() => {
              setNewExamIds(prev => {
                const next = new Set(prev);
                next.delete(newExam.id);
                return next;
              });
            }, 3000);

            if (newExam.priority === "urgent") {
              toast.error("🚨 Exame URGENTE recebido!", {
                description: `${newExam.exam_type} — Prioridade máxima`,
                duration: 8000,
              });
              try {
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 880;
                gain.gain.value = 0.15;
                osc.start();
                osc.stop(ctx.currentTime + 0.15);
              } catch {}
            } else {
              toast.info("Novo exame na fila", {
                description: newExam.exam_type,
              });
            }
          }
          queryClient.invalidateQueries({ queryKey: ["exam-requests-queue"] });
        }
      )
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
  }, [queryClient]);

  /* ── Client-side filters ── */
  const filtered = useMemo(() => {
    if (!examRequests) return [];
    let list = examRequests;
    if (patientSearch.trim()) {
      const q = patientSearch.toLowerCase();
      list = list.filter((e: any) =>
        e.patient_name?.toLowerCase().includes(q) ||
        e.id?.toLowerCase().includes(q)
      );
    }
    if (selectedModalities.length < MODALITIES.length) {
      list = list.filter((e: any) => {
        const type = (e.exam_type || "").toUpperCase();
        return selectedModalities.some(m => type.includes(m));
      });
    }
    return list;
  }, [examRequests, patientSearch, selectedModalities]);

  /* ── Stats ── */
  const stats = useMemo(() => {
    if (!examRequests) return { pending: 0, inReview: 0, reported: 0, slaRisk: 0 };
    const now = new Date();
    return {
      pending: examRequests.filter((e: any) => e.status === "pending").length,
      inReview: examRequests.filter((e: any) => e.status === "in_review").length,
      reported: examRequests.filter((e: any) => e.status === "reported" || e.status === "delivered").length,
      slaRisk: examRequests.filter((e: any) => {
        if (!e.sla_deadline || e.status === "reported" || e.status === "delivered") return false;
        return differenceInMinutes(new Date(e.sla_deadline), now) < 60;
      }).length,
    };
  }, [examRequests]);

  /* ── Kanban groups ── */
  const kanbanGroups = useMemo(() => {
    const groups: Record<string, any[]> = {
      pending: [],
      in_review: [],
      reported: [],
      delivered: [],
    };
    (filtered || []).forEach((e: any) => {
      const key = groups[e.status] ? e.status : "pending";
      groups[key].push(e);
    });
    return groups;
  }, [filtered]);

  const handleClaim = async (examId: string) => {
    if (!doctorProfile?.id) return;
    setClaimingId(examId);
    try {
      const { error } = await db
        .from("exam_requests" as any)
        .update({ assigned_to: doctorProfile.id, status: "in_review" } as any)
        .eq("id", examId);
      if (error) throw error;
      toast.success("Exame assumido!", { description: "Você pode iniciar o laudo agora." });
      queryClient.invalidateQueries({ queryKey: ["exam-requests-queue"] });
    } catch (err: unknown) {
      toast.error("Erro", { description: err instanceof Error ? err.message : "Erro desconhecido" });
    } finally {
      setClaimingId(null);
    }
  };

  const presetBtns: { key: DatePreset; label: string; icon: React.ReactNode }[] = [
    { key: "hoje", label: "Hoje", icon: <Calendar className="w-4 h-4" /> },
    { key: "manha", label: "Manhã", icon: <Sun className="w-4 h-4" /> },
    { key: "tarde", label: "Tarde", icon: <Cloud className="w-4 h-4" /> },
    { key: "noite", label: "Noite", icon: <Moon className="w-4 h-4" /> },
    { key: "ontem", label: "Ontem", icon: <ArrowLeft className="w-4 h-4" /> },
    { key: "semana", label: "Semana", icon: <CalendarDays className="w-4 h-4" /> },
    { key: "mes", label: "Mês", icon: <CalendarRange className="w-4 h-4" /> },
    { key: "custom", label: "Personalizado", icon: <User2 className="w-4 h-4" /> },
  ];

  const statCards = [
    {
      label: "Pendentes",
      value: stats.pending,
      icon: <Clock className="w-5 h-5" />,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10 border-yellow-500/20",
    },
    {
      label: "Em Digitação",
      value: stats.inReview,
      icon: <FileEdit className="w-5 h-5" />,
      color: "text-blue-500",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Laudados Hoje",
      value: stats.reported,
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: "text-green-500",
      bg: "bg-green-500/10 border-green-500/20",
    },
    {
      label: "SLA em Risco",
      value: stats.slaRisk,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: "text-destructive",
      bg: "bg-destructive/10 border-destructive/20",
    },
  ];

  return (
    <DashboardLayout nav={getDoctorNav("report-queue")} title="Fila de Laudos">
      {/* ── Stats Dashboard ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {statCards.map((s) => (
          <Card key={s.label} className={`border ${s.bg}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Filters Panel ── */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen} className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <CollapsibleTrigger asChild>
            <Button variant="default" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filtros
              <ChevronDown className={`w-4 h-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>

          {/* View Mode Toggle */}
          <div className="ml-auto flex items-center gap-1 bg-muted rounded-lg p-0.5">
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-2 gap-1"
              onClick={() => setViewMode("table")}
            >
              <List className="w-4 h-4" />
              Tabela
            </Button>
            <Button
              variant={viewMode === "kanban" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-2 gap-1"
              onClick={() => setViewMode("kanban")}
            >
              <LayoutGrid className="w-4 h-4" />
              Kanban
            </Button>
          </div>

          {/* Realtime indicator */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Radio className="w-3.5 h-3.5 text-green-500 animate-pulse" />
            Ao vivo
          </div>
        </div>

        <CollapsibleContent>
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Date Presets */}
              <div className="flex flex-wrap gap-2 justify-center">
                {presetBtns.map(p => (
                  <Button
                    key={p.key}
                    variant={datePreset === p.key ? "default" : "outline"}
                    size="sm"
                    className="gap-1.5"
                    onClick={() => applyPreset(p.key)}
                  >
                    {p.icon}
                    {p.label}
                  </Button>
                ))}
              </div>

              {/* Date Range + Patient */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data Início</label>
                  <Input
                    type="datetime-local"
                    value={dateStart}
                    onChange={e => { setDateStart(e.target.value); setDatePreset("custom"); }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data Fim</label>
                  <Input
                    type="datetime-local"
                    value={dateEnd}
                    onChange={e => { setDateEnd(e.target.value); setDatePreset("custom"); }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Paciente</label>
                  <Input
                    placeholder="Id ou Nome"
                    value={patientSearch}
                    onChange={e => setPatientSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Laudo Status + Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Laudo</label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {LAUDO_STATUSES.map(s => (
                      <Badge
                        key={s}
                        variant={selectedStatuses.includes(s) ? "default" : "outline"}
                        className="cursor-pointer gap-1 select-none"
                        onClick={() => toggleStatus(s)}
                      >
                        {statusLabels[s]}
                        {selectedStatuses.includes(s) && <X className="w-3 h-3" />}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Prioridade</label>
                  <div className="flex gap-2 mt-1">
                    {[
                      { value: "all", label: "Todas" },
                      { value: "urgent", label: "Urgente" },
                      { value: "normal", label: "Normal" },
                    ].map(p => (
                      <Badge
                        key={p.value}
                        variant={priorityFilter === p.value ? "default" : "outline"}
                        className="cursor-pointer select-none"
                        onClick={() => setPriorityFilter(p.value)}
                      >
                        {p.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modalities */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Modalidades</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {MODALITIES.map(m => (
                    <Badge
                      key={m}
                      variant={selectedModalities.includes(m) ? "default" : "outline"}
                      className="cursor-pointer gap-1 select-none"
                      onClick={() => toggleModality(m)}
                    >
                      {m}
                      {selectedModalities.includes(m) && <X className="w-3 h-3" />}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["exam-requests-queue"] })} className="gap-2">
                  <Search className="w-4 h-4" /> Pesquisar
                </Button>
                <Button variant="secondary" onClick={clearFilters} className="gap-2">
                  <FileEdit className="w-4 h-4" /> Limpar
                </Button>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* ── KANBAN VIEW ── */}
      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(["pending", "in_review", "reported", "delivered"] as const).map(status => (
            <div key={status} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <Badge className={`${statusColors[status]} text-xs`} variant="outline">
                  {statusLabels[status]}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  ({kanbanGroups[status]?.length || 0})
                </span>
              </div>
              <div className="space-y-2 min-h-[200px] pb-24 md:pb-6">
                <AnimatePresence>
                  {(kanbanGroups[status] || []).map((exam: any) => (
                    <motion.div
                      key={exam.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        boxShadow: newExamIds.has(exam.id) ? "0 0 12px hsl(142 70% 48% / 0.5)" : "none",
                      }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.25 }}
                    >
                      <Card className={`${kanbanColors[status] || ""} hover:shadow-md transition-shadow cursor-pointer ${
                        exam.status === "in_review" ? "animate-pulse-subtle" : ""
                      }`}>
                        <CardContent className="p-3 space-y-2">
                          {/* Header */}
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sm truncate">{exam.exam_type}</h3>
                            {exam.priority === "urgent" && (
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 animate-pulse">
                                URGENTE
                              </Badge>
                            )}
                          </div>

                          {/* Patient */}
                          <p className="text-xs text-muted-foreground truncate">
                            {exam.patient_name}
                          </p>

                          {/* Clinic */}
                          {exam.requesting_clinic_id && (
                            <p className="text-[10px] text-muted-foreground">
                              Clínica: {exam.requesting_clinic_id.substring(0, 8)}...
                            </p>
                          )}

                          {/* SLA */}
                          <div className="flex items-center justify-between">
                            <SlaCountdown deadline={exam.sla_deadline} />
                            <span className="text-[10px] text-muted-foreground">
                              {format(new Date(exam.created_at), "HH:mm", { locale: ptBR })}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1 pt-1">
                            {exam.status === "pending" && (
                              <Button
                                size="sm"
                                className="h-7 text-xs flex-1 gap-1"
                                onClick={() => handleClaim(exam.id)}
                                disabled={claimingId === exam.id}
                              >
                                {claimingId === exam.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <UserCheck className="w-3 h-3" />
                                )}
                                Laudar
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1"
                              onClick={() => navigate(`/dashboard/doctor/report-editor/${exam.id}?role=doctor`)}
                            >
                              <Eye className="w-3 h-3" />
                              {exam.status === "pending" ? "Ver" : "Abrir"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {(!kanbanGroups[status] || kanbanGroups[status].length === 0) && (
                  <div className="flex items-center justify-center h-24 text-xs text-muted-foreground border border-dashed rounded-lg">
                    Nenhum exame
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── TABLE VIEW ── */
        <Card>
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="w-5 h-5 text-primary" />
              Exames ({filtered?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : !filtered?.length ? (
              <p className="text-center text-muted-foreground py-8">Nenhum exame encontrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary/5">
                      <TableHead className="font-semibold">Prioridade</TableHead>
                      <TableHead className="font-semibold">Paciente</TableHead>
                      <TableHead className="font-semibold">Procedimento</TableHead>
                      <TableHead className="font-semibold">Data/Hora</TableHead>
                      <TableHead className="font-semibold">SLA</TableHead>
                      <TableHead className="font-semibold">Laudo</TableHead>
                      <TableHead className="text-right font-semibold">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {filtered.map((exam: any) => (
                        <motion.tr
                          key={exam.id}
                          initial={newExamIds.has(exam.id) ? { backgroundColor: "hsl(142 70% 48% / 0.15)" } : {}}
                          animate={{ backgroundColor: "transparent" }}
                          transition={{ duration: 3 }}
                          className="group hover:bg-muted/50 border-b"
                        >
                          {/* Priority */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {exam.priority === "urgent" ? (
                                <AlertTriangle className="w-5 h-5 text-destructive animate-pulse" />
                              ) : (
                                <ThumbsUp className="w-5 h-5 text-green-500" />
                              )}
                            </div>
                          </TableCell>

                          {/* Patient */}
                          <TableCell>
                            <div className="space-y-0.5">
                              <p className="font-semibold text-sm">{exam.patient_name}</p>
                              <p className="text-xs text-muted-foreground">
                                Id: {exam.id?.substring(0, 12)}...
                              </p>
                            </div>
                          </TableCell>

                          {/* Procedure */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs font-mono">
                                {(exam.exam_type || "DX").substring(0, 2).toUpperCase()}
                              </Badge>
                              <p className="font-medium text-sm">{exam.exam_type}</p>
                            </div>
                          </TableCell>

                          {/* Date */}
                          <TableCell>
                            <div className="text-sm">
                              <p>{format(new Date(exam.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(exam.created_at), "HH:mm:ss", { locale: ptBR })}</p>
                            </div>
                          </TableCell>

                          {/* SLA */}
                          <TableCell>
                            <SlaCountdown deadline={exam.sla_deadline} />
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <Badge className={`${statusColors[exam.status] || ""} gap-1`} variant="outline">
                              {statusLabels[exam.status] || exam.status}
                            </Badge>
                          </TableCell>

                          {/* Actions */}
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                title="Visualizar"
                                onClick={() => navigate(`/dashboard/doctor/report-editor/${exam.id}?role=doctor`)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {(exam.status === "in_review" || exam.status === "pending") && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  title={exam.status === "pending" ? "Assumir" : "Editar Laudo"}
                                  onClick={() => {
                                    if (exam.status === "pending") {
                                      handleClaim(exam.id);
                                    } else {
                                      navigate(`/dashboard/doctor/report-editor/${exam.id}?role=doctor`);
                                    }
                                  }}
                                >
                                  {claimingId === exam.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileEdit className="w-4 h-4" />}
                                </Button>
                              )}
                              <Button size="icon" aria-label="Baixar" variant="ghost" className="h-8 w-8" title="Download">
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
};

export default ExamReportQueue;
