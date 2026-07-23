import { useState, useEffect, useMemo } from "react";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getAdminNav } from "@/components/admin/adminNav";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import {
  Activity, Stethoscope, Users, ClipboardList, AlertTriangle,
  UserX, ArrowUpDown, ArrowUp, ArrowDown, Clock,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

type Risk = "critical" | "high" | "healthy" | "idle";

interface CapacityRow {
  id: string;
  name: string;
  doctors: number;   // médicos ativos + aprovados na especialidade
  appts: number;     // consultas agendadas nos últimos 30 dias
  waitlist: number;  // entradas na lista de espera para a especialidade
  slots: number;     // blocos de horário recorrentes ativos (sinal de oferta)
  demand: number;    // appts + waitlist (pressão de demanda)
  gapScore: number;  // heurística de risco de cobertura
  risk: Risk;
}

type SortKey = "name" | "doctors" | "appts" | "waitlist" | "gapScore";

const RISK_META: Record<Risk, { label: string; className: string }> = {
  critical: { label: "Cobertura crítica", className: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20" },
  high: { label: "Alta demanda", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  healthy: { label: "Saudável", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  idle: { label: "Sem demanda", className: "bg-muted text-muted-foreground border-border" },
};

const AdminCapacity = () => {
  const [rows, setRows] = useState<CapacityRow[]>([]);
  const [totalWaitlist, setTotalWaitlist] = useState(0);
  const [totalAppts, setTotalAppts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("gapScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Um conjunto de queries em lote — nada de N+1 por especialidade.
    const [specRes, dsRes, dpRes, apptRes, wlRes, slotRes] = await Promise.all([
      db.from("specialties").select("id, name, is_active").order("name"),
      db.from("doctor_specialties").select("doctor_id, specialty_id"),
      db.from("doctor_profiles").select("id, is_active, is_approved"),
      db.from("appointments").select("doctor_id, created_at").gte("created_at", since30),
      db.from("appointment_waitlist").select("specialty_id"),
      db.from("availability_slots").select("doctor_id, is_active"),
    ]);

    const specialties = ((specRes.data as { id: string; name: string; is_active: boolean | null }[]) ?? [])
      .filter(s => s.is_active !== false); // inclui ativas e nulas, exclui explicitamente inativas
    const doctorSpecs = (dsRes.data as { doctor_id: string; specialty_id: string }[]) ?? [];
    const doctorProfiles = (dpRes.data as { id: string; is_active: boolean | null; is_approved: boolean | null }[]) ?? [];
    const appts = (apptRes.data as { doctor_id: string; created_at: string }[]) ?? [];
    const waitlist = (wlRes.data as { specialty_id: string | null }[]) ?? [];
    const slots = (slotRes.data as { doctor_id: string; is_active: boolean | null }[]) ?? [];

    // Oferta: apenas médicos aprovados E ativos.
    const activeDoctorIds = new Set(
      doctorProfiles.filter(d => d.is_approved === true && d.is_active === true).map(d => d.id)
    );

    // doctor_id -> especialidades (todas, para atribuir demanda mesmo de médicos inativos)
    const specsByDoctor = new Map<string, string[]>();
    doctorSpecs.forEach(ds => {
      const arr = specsByDoctor.get(ds.doctor_id) ?? [];
      arr.push(ds.specialty_id);
      specsByDoctor.set(ds.doctor_id, arr);
    });

    // Blocos de horário ativos por médico (sinal de oferta).
    const activeSlotsByDoctor = new Map<string, number>();
    slots.forEach(s => {
      if (s.is_active === false) return;
      activeSlotsByDoctor.set(s.doctor_id, (activeSlotsByDoctor.get(s.doctor_id) ?? 0) + 1);
    });

    // Agregadores por especialidade.
    const supply = new Map<string, number>();   // médicos ativos
    const slotSupply = new Map<string, number>();
    const demandAppts = new Map<string, number>();
    const demandWait = new Map<string, number>();

    // Oferta: percorre apenas vínculos de médicos ativos.
    doctorSpecs.forEach(ds => {
      if (!activeDoctorIds.has(ds.doctor_id)) return;
      supply.set(ds.specialty_id, (supply.get(ds.specialty_id) ?? 0) + 1);
      const sl = activeSlotsByDoctor.get(ds.doctor_id) ?? 0;
      if (sl > 0) slotSupply.set(ds.specialty_id, (slotSupply.get(ds.specialty_id) ?? 0) + sl);
    });

    // Demanda — consultas: atribuídas a cada especialidade do médico responsável.
    appts.forEach(a => {
      const specs = specsByDoctor.get(a.doctor_id);
      if (!specs) return;
      specs.forEach(sid => demandAppts.set(sid, (demandAppts.get(sid) ?? 0) + 1));
    });

    // Demanda — lista de espera: vínculo direto por specialty_id.
    waitlist.forEach(w => {
      if (!w.specialty_id) return;
      demandWait.set(w.specialty_id, (demandWait.get(w.specialty_id) ?? 0) + 1);
    });

    const computed: CapacityRow[] = specialties.map(s => {
      const doctors = supply.get(s.id) ?? 0;
      const apptCount = demandAppts.get(s.id) ?? 0;
      const wait = demandWait.get(s.id) ?? 0;
      const slotCount = slotSupply.get(s.id) ?? 0;
      const demand = apptCount + wait;
      const hasDemand = apptCount > 0 || wait > 0;
      // Heurística de gap: espera pesa 3x (demanda não atendida), dividido por (médicos + 1).
      const gapScore = (wait * 3 + apptCount) / (doctors + 1);

      let risk: Risk;
      if (!hasDemand) risk = "idle";
      else if (doctors <= 1) risk = "critical";
      else if (wait >= 5 || demand / doctors >= 12) risk = "high";
      else risk = "healthy";

      return { id: s.id, name: s.name, doctors, appts: apptCount, waitlist: wait, slots: slotCount, demand, gapScore, risk };
    });

    setRows(computed);
    setTotalWaitlist(waitlist.length);            // total honesto: inclui entradas sem specialty_id
    setTotalAppts(appts.length);
    setLoading(false);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  };

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let cmp: number;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name, "pt-BR");
      else cmp = (a[sortKey] as number) - (b[sortKey] as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const noDoctorCount = useMemo(() => rows.filter(r => r.doctors === 0).length, [rows]);
  const criticalCount = useMemo(() => rows.filter(r => r.risk === "critical").length, [rows]);

  // Top gap para o gráfico: apenas especialidades com alguma demanda.
  const chartData = useMemo(
    () =>
      [...rows]
        .filter(r => r.demand > 0)
        .sort((a, b) => b.gapScore - a.gapScore)
        .slice(0, 8)
        .map(r => ({ name: r.name, "Consultas 30d": r.appts, "Na espera": r.waitlist, medicos: r.doctors })),
    [rows]
  );

  const SortHeader = ({ label, k, className }: { label: string; k: SortKey; className?: string }) => (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => toggleSort(k)}
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {label}
        {sortKey === k
          ? (sortDir === "desc" ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />)
          : <ArrowUpDown className="w-3 h-3 opacity-40" />}
      </button>
    </TableHead>
  );

  if (loading) {
    return (
      <DashboardLayout title="Administração" nav={getAdminNav("capacity")} role="admin">
        <div className="w-full mx-auto max-w-6xl space-y-4 p-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="shimmer-v2 h-28 rounded-2xl" />)}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Administração" nav={getAdminNav("capacity")} role="admin">
      <div className="w-full mx-auto max-w-6xl space-y-5 pb-24 md:pb-6">
        <AdminPageHeader
          icon={Activity}
          eyebrow="Visão Geral"
          title="Capacidade & Demanda"
          description="Cobertura por especialidade: onde a demanda supera a oferta de médicos ativos — para orientar o recrutamento."
          accent="from-violet-500 to-fuchsia-600"
          badge={criticalCount > 0 ? { label: `${criticalCount} crítica${criticalCount > 1 ? "s" : ""}`, tone: "danger" } : undefined}
        />

        {rows.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-12 text-center">
              <Stethoscope className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Nenhuma especialidade cadastrada ainda.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className={`p-4 rounded-2xl border ${
                noDoctorCount > 0
                  ? "bg-gradient-to-br from-rose-500/10 to-rose-500/[0.02] border-rose-500/20"
                  : "bg-gradient-to-br from-emerald-500/10 to-emerald-500/[0.02] border-emerald-500/20"
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${noDoctorCount > 0 ? "bg-rose-500/15" : "bg-emerald-500/15"}`}>
                    <UserX className={`w-4 h-4 ${noDoctorCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`} />
                  </div>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${noDoctorCount > 0 ? "text-rose-700 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-400"}`}>Sem médico</p>
                </div>
                <p className="text-2xl font-extrabold text-foreground tabular-nums">{noDoctorCount}</p>
                <p className="text-[11px] text-muted-foreground">Especialidades sem médico ativo</p>
              </div>

              <div className={`p-4 rounded-2xl border ${
                criticalCount > 0
                  ? "bg-gradient-to-br from-amber-500/10 to-amber-500/[0.02] border-amber-500/20"
                  : "bg-gradient-to-br from-blue-500/10 to-blue-500/[0.02] border-blue-500/20"
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${criticalCount > 0 ? "bg-amber-500/15" : "bg-blue-500/15"}`}>
                    <AlertTriangle className={`w-4 h-4 ${criticalCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"}`} />
                  </div>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${criticalCount > 0 ? "text-amber-700 dark:text-amber-400" : "text-blue-700 dark:text-blue-400"}`}>Cobertura crítica</p>
                </div>
                <p className="text-2xl font-extrabold text-foreground tabular-nums">{criticalCount}</p>
                <p className="text-[11px] text-muted-foreground">Demanda com 0–1 médico ativo</p>
              </div>

              <div className="p-4 rounded-2xl border bg-gradient-to-br from-violet-500/10 to-violet-500/[0.02] border-violet-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
                    <ClipboardList className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-400">Lista de espera</p>
                </div>
                <p className="text-2xl font-extrabold text-foreground tabular-nums">{totalWaitlist}</p>
                <p className="text-[11px] text-muted-foreground">Pacientes aguardando (total)</p>
              </div>

              <div className="p-4 rounded-2xl border bg-gradient-to-br from-cyan-500/10 to-cyan-500/[0.02] border-cyan-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                    <Stethoscope className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">Consultas 30d</p>
                </div>
                <p className="text-2xl font-extrabold text-foreground tabular-nums">{totalAppts}</p>
                <p className="text-[11px] text-muted-foreground">Agendadas nos últimos 30 dias</p>
              </div>
            </div>

            {/* Top-gap bar chart */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" /> Especialidades com maior gap de cobertura
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center text-sm">
                    Nenhuma demanda registrada nos últimos 30 dias nem lista de espera ativa.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(220, chartData.length * 42)}>
                    <BarChart data={chartData} layout="vertical" margin={{ left: 12, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={130} />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="Consultas 30d" stackId="d" fill="hsl(210,90%,55%)" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Na espera" stackId="d" fill="hsl(0,84%,60%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Ranked / sortable table */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" /> Oferta x Demanda por especialidade
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortHeader label="Especialidade" k="name" />
                        <SortHeader label="Médicos ativos" k="doctors" className="text-right" />
                        <TableHead className="text-right hidden sm:table-cell">
                          <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Horários</span>
                        </TableHead>
                        <SortHeader label="Consultas 30d" k="appts" className="text-right" />
                        <SortHeader label="Na espera" k="waitlist" className="text-right" />
                        <SortHeader label="Gap / risco" k="gapScore" className="text-right" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedRows.map(r => {
                        const meta = RISK_META[r.risk];
                        return (
                          <TableRow key={r.id} className={r.risk === "critical" ? "bg-rose-500/[0.04]" : undefined}>
                            <TableCell className="font-medium text-foreground">{r.name}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {r.doctors === 0
                                ? <span className="text-rose-600 dark:text-rose-400 font-semibold">0</span>
                                : r.doctors}
                            </TableCell>
                            <TableCell className="text-right tabular-nums hidden sm:table-cell text-muted-foreground">
                              {r.slots > 0 ? r.slots : "—"}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{r.appts > 0 ? r.appts : "—"}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {r.waitlist > 0
                                ? <span className="font-semibold text-foreground">{r.waitlist}</span>
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-[11px] text-muted-foreground tabular-nums hidden md:inline">
                                  {r.gapScore > 0 ? r.gapScore.toFixed(1) : "—"}
                                </span>
                                <Badge variant="outline" className={`font-semibold text-[10.5px] ${meta.className}`}>
                                  {meta.label}
                                </Badge>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <p className="text-[11px] text-muted-foreground px-1 leading-relaxed">
              Gap = (lista de espera × 3 + consultas 30d) ÷ (médicos ativos + 1). Quanto maior, maior o risco de
              cobertura. "Cobertura crítica" sinaliza especialidades com demanda e apenas 0–1 médico ativo.
              Consultas atribuídas à especialidade do médico responsável; oferta considera apenas médicos aprovados e ativos.
            </p>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminCapacity;
