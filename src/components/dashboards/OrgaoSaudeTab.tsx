/**
 * Painel epidemiológico para gestores de contrato (órgãos públicos / empresas).
 *
 * Diferencial em licitação: o cliente não compra "consultas baratas" (commodity),
 * compra inteligência epidemiológica — top queixas, sazonalidade, severidade
 * média, distribuição por mês — derivada dos dados já existentes na plataforma.
 *
 * Dados:
 *   - consulta_contrato (apenas dos contratos que o usuário gerencia, via RLS)
 *   - pre_consultation_symptoms (queixa principal + severidade + sintomas)
 *   - appointments (datas, status)
 */
import { useEffect, useState } from "react";
import { db } from "@/integrations/supabase/untyped";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/ui/kpi-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Activity, Stethoscope, TrendingUp, TrendingDown, AlertCircle, BarChart3, Sparkles, Loader2, Users } from "lucide-react";
import { logError } from "@/lib/logger";

interface Props {
  contratoIds: string[];
}

type SymRow = { main_complaint: string | null; severity: number | null; symptoms: string[] | null; created_at: string; appointment_id: string; patient_id?: string };
type Demo = { age: number | null; gender: string | null; state: string | null };

function topN(items: string[], n = 10) {
  const map = new Map<string, number>();
  for (const it of items) {
    const k = (it || "").trim().toLowerCase();
    if (!k) continue;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const MONTH_LABEL: Record<string, string> = {
  "01": "Jan", "02": "Fev", "03": "Mar", "04": "Abr", "05": "Mai", "06": "Jun",
  "07": "Jul", "08": "Ago", "09": "Set", "10": "Out", "11": "Nov", "12": "Dez",
};

export default function OrgaoSaudeTab({ contratoIds }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [rows, setRows] = useState<SymRow[]>([]);
  const [demos, setDemos] = useState<Demo[]>([]);
  const [totalConsultas, setTotalConsultas] = useState(0);
  const [aiInsights, setAiInsights] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!contratoIds.length) { setLoading(false); return; }
    (async () => {
      setLoading(true); setError(false);
      try {
        const seisMeses = new Date(); seisMeses.setMonth(seisMeses.getMonth() - 6);
        // 1) Consultas custeadas pelos contratos nos últimos 6 meses
        const { data: cc, error: ccErr } = await db.from("consulta_contrato")
          .select("appointment_id, created_at")
          .in("contrato_id", contratoIds)
          .gte("created_at", seisMeses.toISOString())
          .limit(2000);
        if (ccErr) throw ccErr;
        const apptIds = [...new Set((cc ?? []).map((r: any) => r.appointment_id).filter(Boolean))] as string[];
        setTotalConsultas(apptIds.length);
        if (!apptIds.length) { setRows([]); setDemos([]); setLoading(false); return; }
        // 2) Sintomas/queixas + patient_id para juntar demografia
        const { data: sym, error: symErr } = await db.from("pre_consultation_symptoms")
          .select("main_complaint, severity, symptoms, created_at, appointment_id, patient_id")
          .in("appointment_id", apptIds);
        if (symErr) throw symErr;
        const list = (sym ?? []) as SymRow[];
        setRows(list);
        // 3) Demografia agregada (idade/gênero) dos pacientes envolvidos
        const patientIds = [...new Set(list.map((r) => r.patient_id).filter(Boolean))] as string[];
        if (patientIds.length) {
          const { data: profs } = await db.from("profiles")
            .select("birth_date, gender, state")
            .in("user_id", patientIds);
          const today = new Date();
          setDemos((profs ?? []).map((p: any) => {
            let age: number | null = null;
            if (p.birth_date) {
              const d = new Date(p.birth_date);
              age = Math.floor((today.getTime() - d.getTime()) / 3.156e10);
            }
            return { age, gender: p.gender ?? null, state: p.state ?? null };
          }));
        } else {
          setDemos([]);
        }
      } catch (e) {
        logError("OrgaoSaudeTab load", e);
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [contratoIds.join(",")]);

  const runInsights = async () => {
    setAiLoading(true);
    setAiInsights("");
    try {
      // Monta resumo agregado dos dados em texto (compacto) para a IA
      const compl = topN(rows.map((r) => r.main_complaint || ""), 8).map(([n, c]) => `${n}: ${c}`).join("; ");
      const sympsAll: string[] = [];
      rows.forEach((r) => Array.isArray(r.symptoms) && sympsAll.push(...r.symptoms));
      const sympsTop = topN(sympsAll, 8).map(([n, c]) => `${n}: ${c}`).join("; ");
      const sevValid = rows.map((r) => r.severity).filter((s): s is number => typeof s === "number");
      const sevAvg = sevValid.length ? (sevValid.reduce((a, b) => a + b, 0) / sevValid.length).toFixed(1) : "—";

      // Distribuição mensal
      const byMonth = new Map<string, number>();
      rows.forEach((r) => {
        const k = monthKey(new Date(r.created_at));
        byMonth.set(k, (byMonth.get(k) ?? 0) + 1);
      });
      const meses = [...byMonth.entries()].sort(([a],[b]) => a < b ? -1 : 1).map(([k, v]) => `${k}: ${v}`).join("; ");

      // Demografia
      const ageBuckets = { "0-12": 0, "13-17": 0, "18-29": 0, "30-44": 0, "45-59": 0, "60+": 0 } as Record<string, number>;
      const genderBuckets: Record<string, number> = {};
      demos.forEach((d) => {
        if (typeof d.age === "number") {
          const k = d.age <= 12 ? "0-12" : d.age <= 17 ? "13-17" : d.age <= 29 ? "18-29" : d.age <= 44 ? "30-44" : d.age <= 59 ? "45-59" : "60+";
          ageBuckets[k] += 1;
        }
        if (d.gender) genderBuckets[d.gender] = (genderBuckets[d.gender] ?? 0) + 1;
      });

      const ctx = [
        `Total de consultas (6m): ${totalConsultas}`,
        `Severidade média (0-10): ${sevAvg} | casos severos (≥7): ${sevValid.filter((s) => s >= 7).length}`,
        `Top queixas: ${compl || "—"}`,
        `Top sintomas: ${sympsTop || "—"}`,
        `Volume mensal: ${meses}`,
        `Faixa etária: ${Object.entries(ageBuckets).map(([k, v]) => `${k}: ${v}`).join("; ")}`,
        `Gênero: ${Object.entries(genderBuckets).map(([k, v]) => `${k}: ${v}`).join("; ") || "—"}`,
      ].join("\n");

      const { data, error } = await db.functions.invoke("clinical-ai", {
        body: { task: "epi_insights", payload: { context: ctx } },
      });
      if (error) throw error;
      setAiInsights((data as any)?.result || "");
    } catch (e: any) {
      logError("OrgaoSaudeTab AI insights", e);
      setAiInsights("");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
    );
  }
  if (error) {
    return <EmptyState variant="error" icon={AlertCircle} title="Não foi possível carregar os indicadores"
      description="Tente novamente em alguns instantes." action={{ label: "Recarregar", onClick: () => window.location.reload() }} />;
  }
  if (!contratoIds.length || totalConsultas === 0) {
    return <EmptyState icon={BarChart3} title="Sem dados ainda"
      description="Os indicadores de saúde da população aparecem aqui após as primeiras consultas custeadas pelo contrato." />;
  }

  // Agregações
  const complaints = topN(rows.map((r) => r.main_complaint || ""));
  const symptomsAll: string[] = [];
  rows.forEach((r) => Array.isArray(r.symptoms) && symptomsAll.push(...r.symptoms));
  const topSymptoms = topN(symptomsAll, 8);
  const sevValid = rows.map((r) => r.severity).filter((s): s is number => typeof s === "number");
  const sevAvg = sevValid.length ? (sevValid.reduce((a, b) => a + b, 0) / sevValid.length) : 0;
  const sevHigh = sevValid.filter((s) => s >= 7).length;

  // Distribuição por mês (últimos 6 meses)
  const byMonth = new Map<string, number>();
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    byMonth.set(monthKey(d), 0);
  }
  rows.forEach((r) => {
    const k = monthKey(new Date(r.created_at));
    if (byMonth.has(k)) byMonth.set(k, (byMonth.get(k) ?? 0) + 1);
  });
  const monthly = [...byMonth.entries()];
  const maxMonth = Math.max(1, ...monthly.map(([, v]) => v));

  // Comparativo mês atual vs anterior
  const lastIdx = monthly.length - 1;
  const curr = monthly[lastIdx]?.[1] ?? 0;
  const prev = monthly[lastIdx - 1]?.[1] ?? 0;
  const deltaPct = prev > 0 ? Math.round(((curr - prev) / prev) * 100) : null;
  const deltaUp = (deltaPct ?? 0) >= 0;

  // Distribuição etária
  const ageGroups = [
    { k: "0-12",  label: "Crianças (0-12)",     test: (a: number) => a <= 12 },
    { k: "13-17", label: "Adolescentes (13-17)",test: (a: number) => a >= 13 && a <= 17 },
    { k: "18-29", label: "Jovens (18-29)",      test: (a: number) => a >= 18 && a <= 29 },
    { k: "30-44", label: "Adultos (30-44)",     test: (a: number) => a >= 30 && a <= 44 },
    { k: "45-59", label: "Adultos+ (45-59)",    test: (a: number) => a >= 45 && a <= 59 },
    { k: "60+",   label: "Idosos (60+)",        test: (a: number) => a >= 60 },
  ];
  const ageCounts = ageGroups.map((g) => ({
    ...g,
    count: demos.filter((d) => typeof d.age === "number" && g.test(d.age)).length,
  }));
  const maxAge = Math.max(1, ...ageCounts.map((a) => a.count));
  const demosWithAge = demos.filter((d) => typeof d.age === "number").length;

  // Distribuição por gênero
  const genderCount = new Map<string, number>();
  demos.forEach((d) => { if (d.gender) genderCount.set(d.gender, (genderCount.get(d.gender) ?? 0) + 1); });
  const totalGender = [...genderCount.values()].reduce((a, b) => a + b, 0);

  // Distribuição por estado (top 8)
  const stateCount = new Map<string, number>();
  demos.forEach((d) => { if (d.state) stateCount.set(d.state.toUpperCase().slice(0, 2), (stateCount.get(d.state.toUpperCase().slice(0, 2)) ?? 0) + 1); });
  const topStates = [...stateCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxState = Math.max(1, ...topStates.map(([, v]) => v));
  const totalState = [...stateCount.values()].reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-5">
      {/* KPIs principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={Activity} label="Consultas (6m)" value={totalConsultas} />
        <KpiCard
          icon={deltaUp ? TrendingUp : TrendingDown}
          label="Variação no mês"
          value={deltaPct === null ? "—" : `${deltaPct >= 0 ? "+" : ""}${deltaPct}%`}
          delta={deltaPct === null ? undefined : `${prev}→${curr}`}
          deltaTone={deltaPct === null ? "neutral" : deltaUp ? "up" : "down"}
          help="vs mês anterior"
        />
        <KpiCard icon={Stethoscope} label="Severidade média" value={sevAvg ? sevAvg.toFixed(1) : "—"} help="0–10" />
        <KpiCard icon={AlertCircle} label="Casos severos" value={sevHigh} help="severidade ≥ 7" />
      </div>

      {/* Distribuição mensal */}
      <Card>
        <CardContent className="p-5">
          <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">Volume de consultas por mês</p>
          <div className="flex items-end gap-2 h-32">
            {monthly.map(([k, v]) => {
              const month = k.split("-")[1];
              const pct = (v / maxMonth) * 100;
              return (
                <div key={k} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <div className="flex-1 w-full flex items-end">
                    <div className="w-full rounded-t-md bg-primary/80 transition-all hover:bg-primary"
                      style={{ height: `${pct}%`, minHeight: v > 0 ? 4 : 0 }}
                      role="img"
                      aria-label={`${MONTH_LABEL[month] || month}: ${v} consultas`} />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">{MONTH_LABEL[month] || month}</span>
                  <span className="text-[10px] tabular-nums text-foreground font-bold">{v}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top queixas e sintomas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">Top 10 queixas principais</p>
            {complaints.length === 0 ? (
              <p className="text-sm text-muted-foreground">Os pacientes ainda não preencheram a pré-consulta nessas consultas.</p>
            ) : (
              <ol className="space-y-2">
                {complaints.map(([name, count], i) => {
                  const pct = Math.round((count / complaints[0][1]) * 100);
                  return (
                    <li key={name} className="flex items-center gap-3">
                      <span className="w-6 text-xs font-bold text-muted-foreground tabular-nums">{i + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground capitalize truncate pr-2">{name}</span>
                          <span className="text-muted-foreground tabular-nums">{count}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                          <div className="h-full bg-primary/70" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">Sintomas mais relatados</p>
            {topSymptoms.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem sintomas estruturados registrados.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {topSymptoms.map(([s, c]) => (
                  <span key={s} className="text-xs px-2.5 py-1 rounded-full border border-border bg-card text-foreground">
                    {s} <span className="text-muted-foreground tabular-nums ml-1">·{c}</span>
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Demografia: idade + gênero */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Faixa etária dos atendidos
            </p>
            {demosWithAge === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados de idade dos pacientes.</p>
            ) : (
              <div className="space-y-2">
                {ageCounts.map((g) => {
                  const pct = Math.round((g.count / maxAge) * 100);
                  return (
                    <div key={g.k} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-32 shrink-0">{g.label}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary/70" style={{ width: g.count > 0 ? `${pct}%` : 0 }} />
                      </div>
                      <span className="text-xs tabular-nums text-foreground font-bold w-8 text-right">{g.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">Distribuição por gênero</p>
            {totalGender === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados de gênero registrados.</p>
            ) : (
              <div className="space-y-2.5">
                {[...genderCount.entries()].sort((a, b) => b[1] - a[1]).map(([g, c]) => {
                  const pct = Math.round((c / totalGender) * 100);
                  return (
                    <div key={g}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-foreground capitalize">{g}</span>
                        <span className="text-muted-foreground tabular-nums">{c} · {pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary/70" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por estado */}
      <Card>
        <CardContent className="p-5">
          <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" /> Distribuição por estado
          </p>
          {totalState === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sem dados geográficos ainda — os pacientes precisam informar o estado no perfil para aparecer aqui.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {topStates.map(([uf, count]) => {
                const pct = Math.round((count / maxState) * 100);
                const sharePct = Math.round((count / totalState) * 100);
                return (
                  <div key={uf} className="flex items-center gap-3">
                    <span className="w-8 text-xs font-bold text-foreground shrink-0 text-center">{uf}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary/70" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground w-16 text-right">{count} · {sharePct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights da IA */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> Insights da IA
            </p>
            <Button size="sm" variant={aiInsights ? "outline" : "default"} className="h-8 rounded-xl gap-1.5" onClick={runInsights} disabled={aiLoading}>
              {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {aiLoading ? "Analisando…" : aiInsights ? "Refazer" : "Gerar insights"}
            </Button>
          </div>
          {aiInsights ? (
            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground font-sans">{aiInsights}</pre>
          ) : (
            <p className="text-sm text-muted-foreground">
              Gere uma análise executiva dos indicadores: tendências, sinais de atenção e recomendações operacionais para o seu contrato.
            </p>
          )}
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground text-center">
        Dados agregados, sem identificação individual — em conformidade com a LGPD.
      </p>
    </div>
  );
}
