import { useEffect, useState } from "react";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useOphthalmologistStats } from "@/hooks/useOphthalmologistStats";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Calendar, CheckCircle2, AlertCircle, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { HeroBanner } from "@/components/dashboards/HeroBanner";
import { StatBento } from "@/components/dashboards/StatBento";
import { ActionPills } from "@/components/dashboards/ActionPills";
import { getOphthalmologyNav } from "@/components/ophthalmology/ophthalmologyNav";
import pingoOftalmologia from "@/assets/pingo-admin.png";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } };

export default function OftalmologistDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { examsToSign, signedToday, signedTotal, successRate, loading, refetch } = useOphthalmologistStats(user?.id);

  const pendingCount = examsToSign.length;

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgente":
        return { text: "Urgente", bg: "bg-red-500/15 text-red-600 border-red-200/30", icon: "🔴" };
      case "normal":
        return { text: "Normal", bg: "bg-amber-500/15 text-amber-600 border-amber-200/30", icon: "🟡" };
      case "baixa":
        return { text: "Baixa", bg: "bg-emerald-500/15 text-emerald-600 border-emerald-200/30", icon: "🟢" };
      default:
        return { text: "Normal", bg: "bg-blue-500/15 text-blue-600 border-blue-200/30", icon: "🔵" };
    }
  };

  if (!user) return null;

  return (
    <DashboardLayout title="Oftalmologista" nav={getOphthalmologyNav("home")} role="ophthalmologist">
      <motion.div variants={container} initial="hidden" animate="show">

        {/* Hero Banner */}
        <div className="-mx-4 -mt-5 md:-mx-6 md:-mt-5 lg:-mx-8 lg:-mt-6">
          <HeroBanner
            gradient="from-[#1a0d2e] via-[#2d1b4e] to-[#502080]"
            pingoSrc={pingoOftalmologia}
            pingoAlt="Pingo Oftalmologia"
            liveDot={pendingCount > 0}
            liveColor={"green"}
            bubble={{
              greeting: "👁️ Fila de Exames",
              name: `Dr(a). ${profile?.first_name || "Oftalmologista"}`,
              sub: `${pendingCount} exame${pendingCount !== 1 ? "s" : ""} aguardando assinatura`,
            }}
            kpis={[
              { label: "A Assinar", value: pendingCount },
              { label: "Hoje", value: signedToday },
              { label: "Total", value: signedTotal },
              { label: "Taxa", value: `${successRate}%` },
            ]}
            loading={loading}
          />
        </div>

        <motion.div variants={fadeUp} className="mt-5 md:mt-5 space-y-5 pb-24 md:pb-8">

          {/* Action Pills */}
          <ActionPills title="Ações" actions={[
            { label: "Fila", icon: "👁️", iconBg: "bg-purple-50 dark:bg-purple-950/30", path: "/dashboard/ophthalmology/queue", badge: pendingCount },
            { label: "Prescrições", icon: "📋", iconBg: "bg-pink-50 dark:bg-pink-950/30", path: "/dashboard/ophthalmology/prescriptions" },
            { label: "Pacientes", icon: "👤", iconBg: "bg-indigo-50 dark:bg-indigo-950/30", path: "/dashboard/ophthalmology/patients" },
            { label: "Relatórios", icon: "📊", iconBg: "bg-violet-50 dark:bg-violet-950/30", path: "/dashboard/ophthalmology/reports" },
            { label: "Perfil", icon: "⚙️", iconBg: "bg-gray-50 dark:bg-gray-950/30", path: "/dashboard/profile?role=ophthalmologist" },
          ]} />

          {/* Stats */}
          <StatBento loading={loading} stats={[
            { label: "A Assinar", value: pendingCount, icon: "👁️", iconBg: "bg-purple-50 dark:bg-purple-950/30", valueClass: "text-purple-700 dark:text-purple-400", accentClass: "bg-purple-500", trend: undefined },
            { label: "Hoje", value: signedToday, icon: "✅", iconBg: "bg-emerald-50 dark:bg-emerald-950/30", valueClass: "text-emerald-700 dark:text-emerald-400", accentClass: "bg-emerald-500", trend: undefined },
            { label: "Mês", value: signedTotal, icon: "📈", iconBg: "bg-blue-50 dark:bg-blue-950/30", valueClass: "text-blue-700 dark:text-blue-400", accentClass: "bg-blue-500", trend: undefined },
            { label: "Taxa", value: `${successRate}%`, icon: "⭐", iconBg: "bg-amber-50 dark:bg-amber-950/30", valueClass: "text-amber-700 dark:text-amber-400", accentClass: "bg-amber-500", trend: undefined },
          ]} />

          {/* Exam Queue to Sign */}
          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-border/10 bg-card shadow-sm overflow-hidden"
          >
            <div className="border-b border-border/10 px-5 py-4 flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span className="font-bold text-foreground">Exames para Assinatura</span>
                <Badge variant="secondary" className="ml-2">{examsToSign.length}</Badge>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate("/dashboard/ophthalmology/queue")}
                className="text-xs font-semibold"
              >
                Ver tudo <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>

            <div className="space-y-2 p-4">
              {examsToSign.length > 0 ? (
                examsToSign.slice(0, 5).map((exam, idx) => {
                  const priorityInfo = getPriorityBadge(exam.priority);
                  return (
                    <motion.div
                      key={exam.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + idx * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border/5 bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <div className={`flex items-center justify-center h-10 w-10 rounded-lg font-bold text-sm border ${priorityInfo.bg}`}>
                        {priorityInfo.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground">{exam.patient_name}</p>
                        <p className="text-xs text-muted-foreground">{exam.exam_type}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-foreground">{format(new Date(exam.created_at), "HH:mm")}</p>
                        <Badge variant="outline" className="text-[10px] mt-1">{priorityInfo.text}</Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/dashboard/ophthalmology/exam/${exam.id}`)}
                        className="h-8 rounded-lg text-xs font-bold shrink-0"
                      >
                        Assinar
                      </Button>
                    </motion.div>
                  );
                })
              ) : (
                <div className="py-8 text-center">
                  <Sparkles className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-40" />
                  <p className="text-sm font-medium text-foreground">Fila limpa! 🎉</p>
                  <p className="text-xs text-muted-foreground mt-1">Nenhum exame aguardando assinatura</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Recently Signed Grid */}
          {signedTotal > 0 && (
            <motion.div
              variants={fadeUp}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <Card className="border-emerald-200/30 bg-gradient-to-br from-emerald-50/30 to-teal-50/20 dark:from-emerald-950/20 dark:to-teal-950/10 overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-muted-foreground">Assinados Hoje</p>
                      <p className="font-bold text-foreground">{signedToday}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Progresso diário</p>
                </CardContent>
              </Card>

              <Card className="border-blue-200/30 bg-gradient-to-br from-blue-50/30 to-cyan-50/20 dark:from-blue-950/20 dark:to-cyan-950/10 overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-muted-foreground">Este Mês</p>
                      <p className="font-bold text-foreground">{signedTotal}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Meta: 150</p>
                </CardContent>
              </Card>

              <Card className="border-purple-200/30 bg-gradient-to-br from-purple-50/30 to-pink-50/20 dark:from-purple-950/20 dark:to-pink-950/10 overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-muted-foreground">Taxa</p>
                      <p className="font-bold text-foreground">98%</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Precisão diagnóstica</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
