import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Stethoscope, XCircle, UserX, BarChart3, Sparkles } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { format, startOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { getClinicNav } from "./clinicNav";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } };

const COLORS = ["hsl(210,90%,45%)", "hsl(160,55%,45%)", "hsl(40,90%,55%)", "hsl(0,84%,60%)", "hsl(270,60%,55%)"];

interface Affiliation {
  doctor_id: string;
  status: string;
  doctor_profiles?: { profiles?: { first_name?: string; last_name?: string } | null } | null;
}

interface Appt {
  id: string;
  doctor_id: string;
  status: string;
  scheduled_at: string;
  price_at_booking: number | null;
}

const getPrice = (a: Appt) => (a.price_at_booking != null ? Number(a.price_at_booking) : 0);

const ClinicReports = () => {
  const { user } = useAuth();
  const [clinicName, setClinicName] = useState<string>("");
  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
  const [appointments, setAppointments] = useState<Appt[]>([]);
  const [specByDoctor, setSpecByDoctor] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(true);

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const { data: clinic } = await db.from("clinic_profiles").select("id, name").eq("user_id", user!.id).maybeSingle();
    if (!clinic) { setHasProfile(false); setLoading(false); return; }
    setHasProfile(true);
    setClinicName(clinic.name ?? "");

    const { data: affs } = await db
      .from("clinic_affiliations")
      .select("doctor_id, status, doctor_profiles(profiles(first_name, last_name))")
      .eq("clinic_id", clinic.id);
    setAffiliations(affs ?? []);

    const doctorIds = (affs ?? []).map((a: Affiliation) => a.doctor_id);
    if (doctorIds.length > 0) {
      const { data: appts } = await db.from("appointments")
        .select("id, doctor_id, status, scheduled_at, price_at_booking")
        .in("doctor_id", doctorIds)
        .gte("scheduled_at", subMonths(new Date(), 6).toISOString())
        .order("scheduled_at", { ascending: false })
        .limit(2000);
      setAppointments(appts ?? []);

      // Especialidade por médico (mesmo padrão de AdminReports: doctor_specialties → specialties)
      const { data: docSpecs } = await db.from("doctor_specialties").select("doctor_id, specialties(name)").in("doctor_id", doctorIds);
      const map = new Map<string, string>();
      (docSpecs ?? []).forEach((ds: { doctor_id: string; specialties?: { name?: string } | null }) => {
        if (!map.has(ds.doctor_id)) map.set(ds.doctor_id, ds.specialties?.name ?? "Sem especialidade");
      });
      setSpecByDoctor(map);
    } else {
      setAppointments([]);
      setSpecByDoctor(new Map());
    }
    setLoading(false);
  };

  const now = new Date();

  const nameByDoctor = useMemo(() => {
    const m = new Map<string, string>();
    affiliations.forEach(a => {
      const p = a.doctor_profiles?.profiles;
      const nm = p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() : "";
      m.set(a.doctor_id, nm ? `Dr(a). ${nm}` : "Médico");
    });
    return m;
  }, [affiliations]);

  // KPIs gerais (janela de 6 meses carregada)
  const kpis = useMemo(() => {
    const total = appointments.length;
    const completed = appointments.filter(a => a.status === "completed").length;
    const cancelled = appointments.filter(a => a.status === "cancelled").length;
    const noShow = appointments.filter(a => a.status === "no_show").length;
    const revenue = appointments.filter(a => a.status === "completed").reduce((s, a) => s + getPrice(a), 0);
    return {
      total,
      completed,
      cancelled,
      noShow,
      revenue,
      cancelRate: total > 0 ? Math.round((cancelled / total) * 100) : 0,
      noShowRate: total > 0 ? Math.round((noShow / total) * 100) : 0,
    };
  }, [appointments]);

  // Consultas + receita por médico
  const perDoctor = useMemo(() => {
    const map = new Map<string, { name: string; consultas: number; completadas: number; receita: number }>();
    appointments.forEach(a => {
      const cur = map.get(a.doctor_id) ?? { name: nameByDoctor.get(a.doctor_id) ?? "Médico", consultas: 0, completadas: 0, receita: 0 };
      cur.consultas += 1;
      if (a.status === "completed") { cur.completadas += 1; cur.receita += getPrice(a); }
      map.set(a.doctor_id, cur);
    });
    return [...map.values()].sort((a, b) => b.receita - a.receita);
  }, [appointments, nameByDoctor]);

  // Tendência de 6 meses (consultas + receita concluída)
  const monthlyData = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(now, 5 - i);
    const ms = startOfMonth(month);
    const me = startOfMonth(subMonths(now, 4 - i));
    const ma = appointments.filter(a => { const d = new Date(a.scheduled_at); return d >= ms && (i < 5 ? d < me : true); });
    return {
      month: format(month, "MMM", { locale: ptBR }),
      consultas: ma.length,
      receita: ma.filter(a => a.status === "completed").reduce((s, a) => s + getPrice(a), 0),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [appointments]);

  // Receita por especialidade (consultas concluídas desta clínica)
  const specialtyData = useMemo(() => {
    const acc: Record<string, number> = {};
    appointments.filter(a => a.status === "completed").forEach(a => {
      const spec = specByDoctor.get(a.doctor_id) ?? "Sem especialidade";
      acc[spec] = (acc[spec] ?? 0) + getPrice(a);
    });
    return Object.entries(acc).map(([name, value]) => ({ name, value })).filter(s => s.value > 0).sort((a, b) => b.value - a.value);
  }, [appointments, specByDoctor]);

  const brl = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <DashboardLayout title="Relatórios" nav={getClinicNav("reports")} role="clinic">
      <motion.div variants={container} initial="hidden" animate="show" className="w-full mx-auto max-w-6xl space-y-5 pb-24 md:pb-8">
        <motion.div variants={fadeUp}>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" /> Relatórios
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Desempenho da {clinicName || "sua clínica"} nos últimos 6 meses
          </p>
        </motion.div>

        {loading ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">{[0, 1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
            <Skeleton className="h-72 rounded-2xl" />
          </div>
        ) : !hasProfile ? (
          <motion.div variants={fadeUp}>
            <Card className="border-dashed border-border/60">
              <CardContent className="p-8 text-center">
                <Sparkles className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="font-semibold text-foreground mb-1">Perfil da clínica não encontrado</p>
                <p className="text-sm text-muted-foreground">Complete o perfil da sua clínica para ver os relatórios.</p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* KPIs */}
            <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="text-center p-3 rounded-2xl bg-muted/50 border border-border/40">
                <Stethoscope className="w-4 h-4 mx-auto text-primary mb-1" />
                <p className="text-lg font-bold text-foreground tabular-nums">{kpis.total}</p>
                <p className="text-xs text-muted-foreground">Consultas</p>
              </div>
              <div className="text-center p-3 rounded-2xl bg-muted/50 border border-border/40">
                <TrendingUp className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
                <p className="text-lg font-bold text-foreground tabular-nums">R$ {brl(kpis.revenue)}</p>
                <p className="text-xs text-muted-foreground">Receita</p>
              </div>
              <div className="text-center p-3 rounded-2xl bg-muted/50 border border-border/40">
                <BarChart3 className="w-4 h-4 mx-auto text-primary mb-1" />
                <p className="text-lg font-bold text-foreground tabular-nums">{kpis.completed}</p>
                <p className="text-xs text-muted-foreground">Concluídas</p>
              </div>
              <div className="text-center p-3 rounded-2xl bg-destructive/5 border border-destructive/20">
                <XCircle className="w-4 h-4 mx-auto text-destructive mb-1" />
                <p className="text-lg font-bold text-destructive tabular-nums">{kpis.cancelRate}%</p>
                <p className="text-xs text-muted-foreground">Cancelamento</p>
              </div>
              <div className="text-center p-3 rounded-2xl bg-destructive/5 border border-destructive/20">
                <UserX className="w-4 h-4 mx-auto text-destructive mb-1" />
                <p className="text-lg font-bold text-destructive tabular-nums">{kpis.noShowRate}%</p>
                <p className="text-xs text-muted-foreground">Não comparecimento</p>
              </div>
            </motion.div>

            {/* Trend + specialty */}
            <div className="grid gap-5 lg:grid-cols-2">
              <motion.div variants={fadeUp}>
                <Card className="border-border/50 h-full">
                  <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Consultas & Receita (6 meses)</CardTitle></CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} tickFormatter={v => `R$${v}`} />
                        <Tooltip formatter={(v: number, n: string) => [n === "Receita" ? `R$ ${brl(v)}` : v, n]} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="consultas" name="Consultas" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                        <Bar yAxisId="right" dataKey="receita" name="Receita" fill="hsl(var(--secondary))" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={fadeUp}>
                <Card className="border-border/50 h-full">
                  <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><Stethoscope className="w-4 h-4 text-primary" /> Receita por Especialidade</CardTitle></CardHeader>
                  <CardContent className="h-[300px] flex items-center justify-center">
                    {specialtyData.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-8">Sem consultas concluídas no período.</p>
                    ) : (
                      <div className="flex flex-wrap items-center justify-center gap-6 w-full">
                        <ResponsiveContainer width={200} height={200}>
                          <PieChart>
                            <Pie data={specialtyData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                              {specialtyData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(v: number) => [`R$ ${brl(v)}`]} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-1.5">
                          {specialtyData.map((s, i) => (
                            <div key={s.name} className="flex items-center gap-2 text-sm">
                              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                              <span className="text-foreground">{s.name}</span>
                              <span className="text-muted-foreground tabular-nums">R$ {brl(s.value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Per-doctor table */}
            <motion.div variants={fadeUp}>
              <Card className="border-border/50">
                <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Desempenho por Médico</CardTitle></CardHeader>
                <CardContent>
                  {perDoctor.length === 0 ? (
                    <div className="text-center py-10">
                      <Stethoscope className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Nenhuma consulta registrada nos últimos 6 meses.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {perDoctor.map((d, i) => (
                        <div key={d.name} className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/40">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-sm font-bold text-primary w-6 text-center shrink-0">#{i + 1}</span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
                              <p className="text-xs text-muted-foreground">{d.completadas} concluídas de {d.consultas} total</p>
                            </div>
                          </div>
                          <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0">R$ {brl(d.receita)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default ClinicReports;
