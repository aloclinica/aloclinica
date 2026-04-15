import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getPatientNav } from "./patientNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { FirstAid, CheckCircle, Circle, CalendarCheck, Pill, Heartbeat,
         ChartLineUp, CaretRight, Clock } from "@phosphor-icons/react";
import { format, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CarePlan {
  id: string;
  title: string;
  description?: string;
  objectives: { title: string; completed: boolean; due_date?: string }[];
  medications: { name: string; dosage: string; frequency: string; duration: string }[];
  lifestyle: { category: string; instruction: string }[];
  follow_up_date?: string;
  follow_up_notes?: string;
  status: "active" | "completed" | "cancelled";
  created_at: string;
  doctor_id: string;
}

const statusConfig = {
  active: { label: "Ativo", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  completed: { label: "Concluído", className: "bg-blue-100 text-blue-700 border-blue-200" },
  cancelled: { label: "Cancelado", className: "bg-muted text-muted-foreground" },
};

export default function CarePlansPage() {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["care-plans", user?.id],
    queryFn: async () => {
      const { data } = await db
        .from("care_plans" as any)
        .select(`*, doctor_profiles!inner(user_id, profiles(first_name, last_name))`)
        .eq("patient_id", user!.id)
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as CarePlan[];
    },
    enabled: !!user,
  });

  const activePlans = plans.filter(p => p.status === "active");

  if (isLoading) {
    return (
      <DashboardLayout title="Paciente" nav={getPatientNav("care-plans")}>
        <div className="space-y-4 max-w-2xl mx-auto">
          {[1, 2].map(i => <div key={i} className="h-32 rounded-2xl bg-muted/50 animate-pulse" />)}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("care-plans")}>
      <div className="max-w-2xl mx-auto pb-24 md:pb-8 space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FirstAid size={24} weight="fill" className="text-rose-500" />
            Planos de Cuidado
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Programas de tratamento personalizados pelo seu médico
          </p>
        </div>

        {activePlans.length === 0 && plans.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-border bg-muted/20">
            <FirstAid size={48} weight="light" className="text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-sm font-semibold text-foreground">Nenhum plano de cuidado</p>
            <p className="text-xs text-muted-foreground mt-1">
              Seu médico criará um plano personalizado após a consulta.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan, idx) => {
              const totalObjs = plan.objectives?.length ?? 0;
              const completedObjs = plan.objectives?.filter(o => o.completed).length ?? 0;
              const progress = totalObjs > 0 ? Math.round((completedObjs / totalObjs) * 100) : 0;
              const isExpanded = expanded === plan.id;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="rounded-2xl border border-border bg-card overflow-hidden"
                >
                  {/* Header */}
                  <button
                    className="w-full p-5 text-left hover:bg-muted/30 transition-colors"
                    onClick={() => setExpanded(isExpanded ? null : plan.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge className={cn("text-[10px] font-bold border", statusConfig[plan.status].className)}>
                            {statusConfig[plan.status].label}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(plan.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        <h3 className="font-bold text-foreground text-base">{plan.title}</h3>
                        {plan.description && (
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{plan.description}</p>
                        )}
                      </div>
                      <CaretRight size={16} className={cn("text-muted-foreground mt-1 shrink-0 transition-transform", isExpanded && "rotate-90")} />
                    </div>

                    {totalObjs > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                          <span>Progresso dos objetivos</span>
                          <span className="font-semibold text-foreground">{completedObjs}/{totalObjs}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t border-border p-5 space-y-5 bg-muted/10">

                      {/* Objectives */}
                      {(plan.objectives?.length ?? 0) > 0 && (
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <ChartLineUp size={12} /> Objetivos
                          </p>
                          <div className="space-y-2">
                            {plan.objectives.map((obj, i) => (
                              <div key={i} className={cn(
                                "flex items-start gap-3 p-3 rounded-xl border",
                                obj.completed ? "bg-emerald-50/60 border-emerald-100 dark:bg-emerald-950/20" : "bg-card border-border"
                              )}>
                                {obj.completed
                                  ? <CheckCircle size={18} weight="fill" className="text-emerald-500 mt-0.5 shrink-0" />
                                  : <Circle size={18} weight="regular" className="text-muted-foreground mt-0.5 shrink-0" />
                                }
                                <div className="flex-1 min-w-0">
                                  <p className={cn("text-sm font-medium", obj.completed && "line-through text-muted-foreground")}>
                                    {obj.title}
                                  </p>
                                  {obj.due_date && (
                                    <p className={cn("text-xs mt-0.5", isPast(new Date(obj.due_date)) && !obj.completed ? "text-destructive" : "text-muted-foreground")}>
                                      <Clock size={10} className="inline mr-1" />
                                      {format(new Date(obj.due_date), "dd/MM/yyyy")}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Medications */}
                      {(plan.medications?.length ?? 0) > 0 && (
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <Pill size={12} /> Medicações
                          </p>
                          <div className="space-y-2">
                            {plan.medications.map((med, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
                                  <Pill size={14} weight="fill" className="text-blue-500" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-foreground">{med.name}</p>
                                  <p className="text-xs text-muted-foreground">{med.dosage} · {med.frequency} · {med.duration}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Lifestyle */}
                      {(plan.lifestyle?.length ?? 0) > 0 && (
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <Heartbeat size={12} /> Estilo de Vida
                          </p>
                          <div className="space-y-2">
                            {plan.lifestyle.map((item, i) => (
                              <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
                                <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">{item.category}</Badge>
                                <p className="text-sm text-foreground">{item.instruction}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Follow-up */}
                      {plan.follow_up_date && (
                        <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
                          <CalendarCheck size={18} weight="fill" className="text-emerald-500 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-foreground">Retorno agendado</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(plan.follow_up_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                              {plan.follow_up_notes && ` · ${plan.follow_up_notes}`}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
