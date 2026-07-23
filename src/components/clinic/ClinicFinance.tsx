import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, TrendingUp, Stethoscope, Download, Percent, Sparkles } from "lucide-react";
import { format, startOfMonth, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { getClinicNav } from "./clinicNav";
import { exportToCSV } from "@/lib/csv";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } };

// commission_percent é o percentual do MÉDICO (mesma semântica de DoctorEarnings
// e ClinicDoctorsManagement); a clínica retém o restante (100 - commission_percent).
// Sem valor configurado, adota 70 — igual ao default exibido em ClinicDoctorsManagement.
const DEFAULT_DOCTOR_PERCENT = 70;

type Period = "month" | "30" | "90";

const PERIODS: { key: Period; label: string }[] = [
  { key: "month", label: "Este mês" },
  { key: "30", label: "Últimos 30 dias" },
  { key: "90", label: "Últimos 90 dias" },
];

interface Affiliation {
  doctor_id: string;
  status: string;
  commission_percent: number | null;
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
const doctorPct = (a?: Affiliation) => (a?.commission_percent != null ? Number(a.commission_percent) : DEFAULT_DOCTOR_PERCENT);

const ClinicFinance = () => {
  const { user } = useAuth();
  const [clinicName, setClinicName] = useState<string>("");
  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
  const [appointments, setAppointments] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(true);
  const [period, setPeriod] = useState<Period>("month");

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const { data: clinic } = await db.from("clinic_profiles").select("id, name").eq("user_id", user!.id).maybeSingle();
    if (!clinic) { setHasProfile(false); setLoading(false); return; }
    setHasProfile(true);
    setClinicName(clinic.name ?? "");

    const { data: affs } = await db
      .from("clinic_affiliations")
      .select("doctor_id, status, commission_percent, doctor_profiles(profiles(first_name, last_name))")
      .eq("clinic_id", clinic.id);
    setAffiliations(affs ?? []);

    const doctorIds = (affs ?? []).map((a: Affiliation) => a.doctor_id);
    if (doctorIds.length > 0) {
      // Janela de 90 dias cobre o maior período do seletor; filtramos no cliente.
      const { data: appts } = await db.from("appointments")
        .select("id, doctor_id, status, scheduled_at, price_at_booking")
        .in("doctor_id", doctorIds)
        .gte("scheduled_at", subDays(new Date(), 90).toISOString())
        .order("scheduled_at", { ascending: false })
        .limit(2000);
      setAppointments(appts ?? []);
    } else {
      setAppointments([]);
    }
    setLoading(false);
  };

  const now = new Date();
  const periodStart = useMemo(() => {
    if (period === "month") return startOfMonth(now);
    return subDays(now, period === "30" ? 30 : 90);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  // Nome do médico por doctor_id
  const nameByDoctor = useMemo(() => {
    const m = new Map<string, string>();
    affiliations.forEach(a => {
      const p = a.doctor_profiles?.profiles;
      const nm = p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() : "";
      m.set(a.doctor_id, nm ? `Dr(a). ${nm}` : "Médico");
    });
    return m;
  }, [affiliations]);

  const affByDoctor = useMemo(() => {
    const m = new Map<string, Affiliation>();
    affiliations.forEach(a => m.set(a.doctor_id, a));
    return m;
  }, [affiliations]);

  // Consultas concluídas no período = receita realizada
  const completedInPeriod = useMemo(
    () => appointments.filter(a => a.status === "completed" && new Date(a.scheduled_at) >= periodStart),
    [appointments, periodStart],
  );

  const totals = useMemo(() => {
    let gross = 0, doctorShare = 0, clinicShare = 0;
    completedInPeriod.forEach(a => {
      const price = getPrice(a);
      const dp = doctorPct(affByDoctor.get(a.doctor_id));
      gross += price;
      doctorShare += price * (dp / 100);
      clinicShare += price * ((100 - dp) / 100);
    });
    return { gross, doctorShare, clinicShare, count: completedInPeriod.length };
  }, [completedInPeriod, affByDoctor]);

  // Quebra por médico
  const perDoctor = useMemo(() => {
    const map = new Map<string, { name: string; consultas: number; gross: number; doctorShare: number; clinicShare: number; pct: number }>();
    completedInPeriod.forEach(a => {
      const price = getPrice(a);
      const dp = doctorPct(affByDoctor.get(a.doctor_id));
      const cur = map.get(a.doctor_id) ?? { name: nameByDoctor.get(a.doctor_id) ?? "Médico", consultas: 0, gross: 0, doctorShare: 0, clinicShare: 0, pct: dp };
      cur.consultas += 1;
      cur.gross += price;
      cur.doctorShare += price * (dp / 100);
      cur.clinicShare += price * ((100 - dp) / 100);
      cur.pct = dp;
      map.set(a.doctor_id, cur);
    });
    return [...map.values()].sort((a, b) => b.gross - a.gross);
  }, [completedInPeriod, affByDoctor, nameByDoctor]);

  const brl = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const exportCSV = () => {
    if (completedInPeriod.length === 0) return;
    const rows = completedInPeriod
      .slice()
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
      .map(a => {
        const price = getPrice(a);
        const dp = doctorPct(affByDoctor.get(a.doctor_id));
        return {
          data: format(new Date(a.scheduled_at), "dd/MM/yyyy", { locale: ptBR }),
          medico: nameByDoctor.get(a.doctor_id) ?? "Médico",
          bruto: price.toFixed(2).replace(".", ","),
          repasse: (price * (dp / 100)).toFixed(2).replace(".", ","),
          retido: (price * ((100 - dp) / 100)).toFixed(2).replace(".", ","),
        };
      });
    const periodLabel = PERIODS.find(p => p.key === period)?.label ?? period;
    exportToCSV(`financeiro-clinica-${format(now, "yyyy-MM-dd")}.csv`, rows, [
      { key: "data", label: "Data" },
      { key: "medico", label: "Médico" },
      { key: "bruto", label: `Valor bruto (R$) — ${periodLabel}` },
      { key: "repasse", label: "Repasse médico (R$)" },
      { key: "retido", label: "Retido clínica (R$)" },
    ]);
  };

  return (
    <DashboardLayout title="Financeiro" nav={getClinicNav("finance")} role="clinic">
      <motion.div variants={container} initial="hidden" animate="show" className="w-full mx-auto max-w-5xl space-y-5 pb-24 md:pb-8">
        {/* Header */}
        <motion.div variants={fadeUp} className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <Wallet className="w-6 h-6 text-primary" /> Financeiro
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Receita da {clinicName || "sua clínica"} — consultas concluídas dos médicos vinculados
            </p>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={exportCSV} disabled={completedInPeriod.length === 0}>
            <Download className="w-4 h-4" /> Exportar CSV
          </Button>
        </motion.div>

        {/* Period selector */}
        <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
          {PERIODS.map(p => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              aria-pressed={period === p.key}
              className={`rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                period === p.key ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:border-primary/40"
              }`}
            >
              {p.label}
            </button>
          ))}
        </motion.div>

        {loading ? (
          <div className="grid gap-3 md:grid-cols-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
        ) : !hasProfile ? (
          <motion.div variants={fadeUp}>
            <Card className="border-dashed border-border/60">
              <CardContent className="p-8 text-center">
                <Sparkles className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="font-semibold text-foreground mb-1">Perfil da clínica não encontrado</p>
                <p className="text-sm text-muted-foreground">Complete o perfil da sua clínica para ver o financeiro.</p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Totals */}
            <motion.div variants={fadeUp} className="grid gap-3 md:grid-cols-3">
              {[
                { label: "Faturamento bruto", value: `R$ ${brl(totals.gross)}`, help: `${totals.count} consulta${totals.count === 1 ? "" : "s"} concluída${totals.count === 1 ? "" : "s"}`, icon: "💰", color: "text-emerald-700 dark:text-emerald-400" },
                { label: "Retido pela clínica", value: `R$ ${brl(totals.clinicShare)}`, help: "Sua parte após repasses", icon: "🏥", color: "text-indigo-700 dark:text-indigo-400" },
                { label: "Repasse aos médicos", value: `R$ ${brl(totals.doctorShare)}`, help: "Total devido aos médicos", icon: "🩺", color: "text-blue-700 dark:text-blue-400" },
              ].map(item => (
                <Card key={item.label} className="border-border/40">
                  <CardContent className="p-5">
                    <span className="text-2xl mb-2 block">{item.icon}</span>
                    <p className={`text-2xl font-black tabular-nums ${item.color}`}>{item.value}</p>
                    <p className="text-xs font-semibold text-foreground mt-1">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.help}</p>
                  </CardContent>
                </Card>
              ))}
            </motion.div>

            {/* Per-doctor breakdown */}
            <motion.div variants={fadeUp}>
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" /> Repasse por médico
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {perDoctor.length === 0 ? (
                    <div className="text-center py-10">
                      <Stethoscope className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Nenhuma consulta concluída no período.</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">A receita aparece aqui conforme as consultas dos médicos vinculados forem concluídas.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {perDoctor.map(d => (
                        <div key={d.name} className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/40">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Percent className="w-3 h-3" /> {d.pct}% médico / {100 - d.pct}% clínica · {d.consultas} consulta{d.consultas === 1 ? "" : "s"}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 shrink-0 text-right">
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Bruto</p>
                              <p className="text-sm font-bold text-foreground tabular-nums">R$ {brl(d.gross)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Médico</p>
                              <p className="text-sm font-bold text-blue-600 dark:text-blue-400 tabular-nums">R$ {brl(d.doctorShare)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Clínica</p>
                              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">R$ {brl(d.clinicShare)}</p>
                            </div>
                          </div>
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

export default ClinicFinance;
