import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import { toast } from "sonner";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getLaudistaNav } from "@/components/laudista/laudistaNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Loader2, ClipboardList, Eye, UserCheck, AlertTriangle, Clock, Timer, Filter, Search, Radio, Flame, Zap, ArrowLeft } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNow, differenceInMinutes, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

const statusLabels: Record<string, string> = {
  pending: "Aguardando",
  in_review: "Em Análise",
  reported: "Laudado",
  delivered: "Entregue",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  in_review: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  reported: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  delivered: "bg-muted text-muted-foreground border-border",
};

function SlaCountdown({ deadline, priority }: { deadline: string; priority: string }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const deadlineDate = new Date(deadline);
  const isOverdue = isPast(deadlineDate);
  const totalMinutes = priority === "urgent" ? 120 : 1440;
  const minutesLeft = differenceInMinutes(deadlineDate, now);
  const progressPct = Math.max(0, Math.min(100, ((totalMinutes - minutesLeft) / totalMinutes) * 100));

  const timeText = isOverdue
    ? `Atrasado ${formatDistanceToNow(deadlineDate, { locale: ptBR })}`
    : formatDistanceToNow(deadlineDate, { addSuffix: false, locale: ptBR });

  return (
    <div className="space-y-1.5 min-w-[130px]">
      <div className="flex items-center gap-1.5">
        {isOverdue ? (
          <AlertTriangle className="w-3.5 h-3.5 text-destructive animate-pulse" />
        ) : progressPct > 75 ? (
          <Timer className="w-3.5 h-3.5 text-amber-500" />
        ) : (
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
        )}
        <span className={`text-xs font-semibold ${isOverdue ? "text-destructive" : progressPct > 75 ? "text-amber-500" : "text-muted-foreground"}`}>
          {timeText}
        </span>
      </div>
      <Progress
        value={progressPct}
        className={`h-1.5 rounded-full ${isOverdue ? "[&>div]:bg-destructive" : progressPct > 75 ? "[&>div]:bg-amber-500" : "[&>div]:bg-primary"}`}
      />
    </div>
  );
}

const LaudistaReportQueue = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const { data: doctorProfile } = useQuery({
    queryKey: ["laudista-doctor-profile", user?.id],
    queryFn: async () => {
      const { data } = await db.from("doctor_profiles").select("id").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: examRequests, isLoading } = useQuery({
    queryKey: ["laudista-exam-queue", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("exam_requests")
        .select("*")
        .order("priority", { ascending: true })
        .order("created_at", { ascending: true });

      if (statusFilter === "active") {
        query = query.in("status", ["pending", "in_review"]);
      } else if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const patientIds = [...new Set((data || []).filter((e: any) => e.patient_id).map((e: any) => e.patient_id))];
      const patientMap: Record<string, string> = {};
      if (patientIds.length > 0) {
        const { data: profiles } = await db.from("profiles").select("user_id, first_name, last_name").in("user_id", patientIds);
        if (profiles) profiles.forEach((p: any) => { patientMap[p.user_id] = `${p.first_name} ${p.last_name}`.trim(); });
      }

      const clinicIds = [...new Set((data || []).filter((e: any) => e.requesting_clinic_id).map((e: any) => e.requesting_clinic_id))];
      const clinicMap: Record<string, string> = {};
      if (clinicIds.length > 0) {
        const { data: clinics } = await db.from("clinic_profiles").select("id, name").in("id", clinicIds);
        if (clinics) clinics.forEach((c: any) => { clinicMap[c.id] = c.name; });
      }

      return (data || []).map((e: any) => ({
        ...e,
        patient_display: e.patient_name || (e.patient_id ? patientMap[e.patient_id] || "Paciente" : "—"),
        origin: e.requesting_clinic_id ? clinicMap[e.requesting_clinic_id] || "Clínica" : "Direto",
      }));
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  useEffect(() => {
    const channel = supabase
      .channel("laudista-exam-queue-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "exam_requests" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["laudista-exam-queue"] });
          queryClient.invalidateQueries({ queryKey: ["laudista-stats"] });
        }
      )
      .subscribe((status) => {
        setRealtimeConnected(status === "SUBSCRIBED");
      });

    return () => { db.removeChannel(channel); };
  }, [queryClient]);

  const filteredExams = examRequests?.filter((exam: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      exam.exam_type?.toLowerCase().includes(q) ||
      exam.patient_display?.toLowerCase().includes(q) ||
      exam.origin?.toLowerCase().includes(q)
    );
  }) ?? [];

  const handleClaim = async (examId: string) => {
    if (!doctorProfile?.id) {
      toast.error("Erro", { description: "Perfil de médico não encontrado." });
      return;
    }
    setClaimingId(examId);
    try {
      const { error } = await supabase
        .from("exam_requests")
        .update({ assigned_to: doctorProfile.id, status: "in_review" })
        .eq("id", examId);
      if (error) throw error;
      toast.success("Exame assumido!", { description: "Você pode iniciar o laudo agora." });
      queryClient.invalidateQueries({ queryKey: ["laudista-exam-queue"] });
    } catch (err: unknown) {
      toast.error("Erro", { description: err instanceof Error ? err.message : "Erro desconhecido" });
    } finally {
      setClaimingId(null);
    }
  };

  const stats = {
    pending: examRequests?.filter((e: any) => e.status === "pending").length || 0,
    inReview: examRequests?.filter((e: any) => e.status === "in_review").length || 0,
    urgent: examRequests?.filter((e: any) => e.priority === "urgent" && e.status !== "reported").length || 0,
    overdue: examRequests?.filter((e: any) => e.sla_deadline && isPast(new Date(e.sla_deadline)) && e.status !== "reported").length || 0,
  };

  return (
    <DashboardLayout nav={getLaudistaNav("queue")} title="Worklist" role="laudista">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-5 pb-24 md:pb-8"
      >
        {/* Back + Title */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="rounded-xl h-9 w-9 p-0" onClick={() => navigate("/dashboard?role=laudista")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              Worklist de Laudos
              {realtimeConnected && (
                <Badge variant="outline" className="text-[9px] h-4 px-1.5 gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                  <Radio className="w-2.5 h-2.5 animate-pulse" /> Ao vivo
                </Badge>
              )}
            </h1>
            <p className="text-xs text-muted-foreground">Gerencie e laude exames em tempo real</p>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Aguardando", value: stats.pending, icon: ClipboardList, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30", border: "" },
            { label: "Em Análise", value: stats.inReview, icon: Eye, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30", border: "" },
            { label: "Urgentes", value: stats.urgent, icon: Flame, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30", border: stats.urgent > 0 ? "border-destructive/40 ring-1 ring-destructive/20" : "" },
            { label: "SLA Estourado", value: stats.overdue, icon: AlertTriangle, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/30", border: stats.overdue > 0 ? "border-orange-500/40 ring-1 ring-orange-500/20" : "" },
          ].map((s) => (
            <Card key={s.label} className={`border-border/50 overflow-hidden ${s.border}`}>
              <CardContent className="p-3.5">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                    <s.icon className={`w-4.5 h-4.5 ${s.color}`} />
                  </div>
                  <div>
                    <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar paciente, tipo de exame..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 h-10 rounded-xl text-sm">
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Aguardando</SelectItem>
              <SelectItem value="in_review">Em Análise</SelectItem>
              <SelectItem value="reported">Laudados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Exam Cards */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Card key={i} className="border-border/30">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-40 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-28 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="h-9 w-24 bg-muted animate-pulse rounded-xl" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredExams.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-16 text-center">
              <ClipboardList className="w-14 h-14 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-base font-bold text-foreground mb-1">
                {searchQuery ? "Nenhum resultado" : "Fila vazia"}
              </p>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "Tente alterar os filtros" : "Os exames aparecerão aqui quando enviados."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {filteredExams.map((exam: any, idx: number) => {
              const isOverdue = exam.sla_deadline && isPast(new Date(exam.sla_deadline)) && exam.status !== "reported";
              const isUrgent = exam.priority === "urgent" && exam.status !== "reported";

              return (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <Card className={`border transition-all hover:shadow-md group ${
                    isUrgent
                      ? "border-destructive/30 bg-destructive/[0.02]"
                      : isOverdue
                      ? "border-orange-500/30 bg-orange-500/[0.02]"
                      : "border-border/40 hover:border-primary/20"
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                          isUrgent
                            ? "bg-gradient-to-br from-red-500 to-rose-600"
                            : exam.status === "reported"
                            ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                            : "bg-gradient-to-br from-primary to-blue-700"
                        }`}>
                          <ClipboardList className="w-5.5 h-5.5 text-white" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-foreground truncate">{exam.exam_type}</p>
                            {isUrgent && (
                              <Badge variant="destructive" className="text-[10px] h-[18px] px-1.5 gap-0.5">
                                <Flame className="w-2.5 h-2.5" /> Urgente
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="outline" className={`text-[10px] h-[18px] px-1.5 font-medium ${statusColors[exam.status] || ""}`}>
                              {statusLabels[exam.status] || exam.status}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">{exam.patient_display}</span>
                            <span className="text-[10px] text-muted-foreground/60">·</span>
                            <span className="text-[10px] text-muted-foreground">{exam.origin}</span>
                            <span className="text-[10px] text-muted-foreground/60">·</span>
                            <span className="text-[10px] text-muted-foreground">
                              {format(new Date(exam.created_at), "dd/MM HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          {exam.specialty_required && (
                            <Badge variant="outline" className="text-[9px] mt-1.5 h-[16px]">{exam.specialty_required}</Badge>
                          )}
                        </div>

                        {/* SLA */}
                        <div className="hidden md:block">
                          {exam.sla_deadline && exam.status !== "reported" ? (
                            <SlaCountdown deadline={exam.sla_deadline} priority={exam.priority} />
                          ) : exam.status === "reported" ? (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✅ Concluído</span>
                          ) : null}
                        </div>

                        {/* Action */}
                        <div className="shrink-0">
                          {exam.status === "pending" && (
                            <Button
                              size="sm"
                              className={`rounded-xl h-10 px-5 text-xs gap-1.5 font-bold shadow-md transition-shadow ${
                                isUrgent
                                  ? "bg-gradient-to-r from-red-500 to-rose-600 text-white hover:shadow-lg"
                                  : "bg-gradient-to-r from-primary to-blue-700 text-white hover:shadow-lg"
                              }`}
                              onClick={() => handleClaim(exam.id)}
                              disabled={claimingId === exam.id}
                            >
                              {claimingId === exam.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                              Assumir
                            </Button>
                          )}
                          {exam.status === "in_review" && (
                            <Button
                              size="sm"
                              className="rounded-xl h-10 px-5 text-xs gap-1.5 font-bold shadow-md bg-gradient-to-r from-teal-600 to-emerald-700 text-white hover:shadow-lg transition-shadow"
                              onClick={() => navigate(`/dashboard/laudista/report-editor/${exam.id}?role=laudista`)}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Laudar
                            </Button>
                          )}
                          {exam.status === "reported" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl h-10 px-5 text-xs gap-1.5 font-medium"
                              onClick={() => navigate(`/dashboard/laudista/report-editor/${exam.id}?role=laudista`)}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Ver
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Mobile SLA */}
                      {exam.sla_deadline && exam.status !== "reported" && (
                        <div className="md:hidden mt-3 pt-3 border-t border-border/30">
                          <SlaCountdown deadline={exam.sla_deadline} priority={exam.priority} />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default LaudistaReportQueue;
