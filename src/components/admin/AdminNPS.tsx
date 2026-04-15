import { useState, useEffect } from "react";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getAdminNav } from "@/components/admin/adminNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, ThumbsUp, MessageSquare } from "lucide-react";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { SurveyRow, DoctorPerformanceRow, ChartDataPoint } from "@/types/domain";

const NPS_COLORS = { detractor: "hsl(0,84%,60%)", passive: "hsl(40,90%,55%)", promoter: "hsl(140,60%,45%)" };

const AdminNPS = () => {
  const [surveys, setSurveys] = useState<SurveyRow[]>([]);
  const [npsScore, setNpsScore] = useState(0);
  const [npsDistribution, setNpsDistribution] = useState<ChartDataPoint[]>([]);
  const [npsTrend, setNpsTrend] = useState<ChartDataPoint[]>([]);
  const [avgEase, setAvgEase] = useState(0);
  const [avgQuality, setAvgQuality] = useState(0);
  const [recommendRate, setRecommendRate] = useState(0);
  const [topDoctors, setTopDoctors] = useState<DoctorPerformanceRow[]>([]);
  const [recentComments, setRecentComments] = useState<SurveyRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data } = await db.from("satisfaction_surveys")
      .select("*")
      .order("created_at", { ascending: false });

    const all = (data as unknown as SurveyRow[]) ?? [];
    setSurveys(all);

    if (all.length === 0) { setLoading(false); return; }

    // NPS calculation
    const promoters = all.filter(s => s.nps_score >= 9).length;
    const detractors = all.filter(s => s.nps_score <= 6).length;
    const passives = all.length - promoters - detractors;
    const nps = Math.round(((promoters - detractors) / all.length) * 100);
    setNpsScore(nps);
    setNpsDistribution([
      { name: "Promotores (9-10)", value: promoters, fill: NPS_COLORS.promoter },
      { name: "Neutros (7-8)", value: passives, fill: NPS_COLORS.passive },
      { name: "Detratores (0-6)", value: detractors, fill: NPS_COLORS.detractor },
    ]);

    // NPS trend by month
    const now = new Date();
    const trend: ChartDataPoint[] = [];
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(now, i);
      const mStart = startOfMonth(m);
      const mEnd = endOfMonth(m);
      const monthSurveys = all.filter(s => {
        const d = new Date(s.created_at);
        return d >= mStart && d <= mEnd;
      });
      if (monthSurveys.length > 0) {
        const mp = monthSurveys.filter(s => s.nps_score >= 9).length;
        const md = monthSurveys.filter(s => s.nps_score <= 6).length;
        trend.push({
          month: format(m, "MMM/yy", { locale: ptBR }),
          nps: Math.round(((mp - md) / monthSurveys.length) * 100),
          respostas: monthSurveys.length,
        });
      } else {
        trend.push({ month: format(m, "MMM/yy", { locale: ptBR }), nps: 0, respostas: 0 });
      }
    }
    setNpsTrend(trend);

    // Averages
    const easeScores = all.filter(s => s.ease_score != null).map(s => Number(s.ease_score));
    const qualityScores = all.filter(s => s.quality_score != null).map(s => Number(s.quality_score));
    setAvgEase(easeScores.length > 0 ? easeScores.reduce((a, b) => a + b, 0) / easeScores.length : 0);
    setAvgQuality(qualityScores.length > 0 ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length : 0);

    const recommends = all.filter(s => s.would_recommend !== null);
    setRecommendRate(recommends.length > 0 ? (recommends.filter(s => s.would_recommend).length / recommends.length) * 100 : 0);

    // Top doctors by NPS
    const byDoctor = new Map<string, SurveyRow[]>();
    all.forEach(s => {
      const key = s.doctor_id ?? '';
      const arr = byDoctor.get(key) ?? [];
      arr.push(s);
      byDoctor.set(key, arr);
    });

    const doctorIds = [...byDoctor.keys()].filter(Boolean);
    const { data: docs } = doctorIds.length > 0
      ? await db.from("doctor_profiles").select("id, user_id").in("id", doctorIds)
      : { data: [] };
    const userIds = docs?.map(d => d.user_id) ?? [];
    const { data: profiles } = userIds.length > 0
      ? await db.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds)
      : { data: [] };

    const docNameMap = new Map<string, string>();
    docs?.forEach(d => {
      const p = profiles?.find(pr => pr.user_id === d.user_id);
      if (p) docNameMap.set(d.id, `Dr(a). ${p.first_name} ${p.last_name}`);
    });

    const doctorStats = Array.from(byDoctor.entries()).map(([docId, docSurveys]) => {
      const p = docSurveys.filter(s => s.nps_score >= 9).length;
      const d = docSurveys.filter(s => s.nps_score <= 6).length;
      const qualScores = docSurveys.filter(s => s.quality_score != null).map(s => Number(s.quality_score));
      return {
        id: docId,
        name: docNameMap.get(docId) ?? "Médico",
        nps: Math.round(((p - d) / docSurveys.length) * 100),
        responses: docSurveys.length,
        avgQuality: qualScores.length > 0 ? qualScores.reduce((a, b) => a + b, 0) / qualScores.length : 0,
      };
    }).sort((a, b) => b.nps - a.nps).slice(0, 5);
    setTopDoctors(doctorStats);

    // Recent comments
    setRecentComments(all.filter(s => s.comment).slice(0, 10));

    setLoading(false);
  };

  const npsLabel = npsScore >= 50 ? "Excelente" : npsScore >= 0 ? "Bom" : "Precisa melhorar";
  const npsColor = npsScore >= 50 ? "text-green-600" : npsScore >= 0 ? "text-yellow-600" : "text-destructive";

  if (loading) return (
    <DashboardLayout title="NPS" nav={getAdminNav("nps")} role="admin">
      <div className="space-y-4 p-4">
        {[1,2,3,4].map(i => <div key={i} className="shimmer-v2 h-32 rounded-2xl" />)}
      </div>
    </DashboardLayout>
  );
  return (
    <DashboardLayout title="Administração" nav={getAdminNav("nps")}>
      <div className="w-full mx-auto max-w-6xl pb-24 md:pb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">NPS & Satisfação</h1>
        <p className="text-muted-foreground mb-6">Análise de satisfação dos pacientes</p>

        {surveys.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-12 text-center">
              <Star className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Nenhuma avaliação recebida ainda.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className={`text-3xl font-bold ${npsColor}`}>{npsScore}</p>
                <p className="text-xs text-muted-foreground">NPS Score</p>
                <Badge variant="outline" className="text-[10px] mt-1">{npsLabel}</Badge>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-foreground tabular-nums">{surveys.length}</p>
                <p className="text-xs text-muted-foreground">Respostas</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <p className="text-2xl font-bold text-foreground tabular-nums">{avgEase.toFixed(1)}</p>
                </div>
                <p className="text-xs text-muted-foreground">Facilidade</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <p className="text-2xl font-bold text-foreground tabular-nums">{avgQuality.toFixed(1)}</p>
                </div>
                <p className="text-xs text-muted-foreground">Qualidade</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center gap-1">
                  <ThumbsUp className="w-4 h-4 text-green-500" />
                  <p className="text-2xl font-bold text-foreground tabular-nums">{recommendRate.toFixed(0)}%</p>
                </div>
                <p className="text-xs text-muted-foreground">Recomendariam</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              {/* NPS Distribution */}
              <Card className="border-border">
                <CardHeader><CardTitle className="text-lg">Distribuição NPS</CardTitle></CardHeader>
                <CardContent className="flex items-center justify-center">
                  <div className="flex items-center gap-6">
                    <ResponsiveContainer width={200} height={200}>
                      <PieChart>
                        <Pie data={npsDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ percent }: { percent: number }) => `${(percent * 100).toFixed(0)}%`}>
                          {npsDistribution.map((entry, i) => <Cell key={i} fill={entry.fill as string} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      {npsDistribution.map(d => (
                        <div key={d.name} className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 rounded-full" style={{ background: d.fill as string }} />
                          <span className="text-foreground">{d.name}: {d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* NPS Trend */}
              <Card className="border-border">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Evolução do NPS</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={npsTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} domain={[-100, 100]} />
                      <Tooltip formatter={(v: number, name: string) => [name === "nps" ? v : v, name === "nps" ? "NPS" : "Respostas"]} />
                      <Line type="monotone" dataKey="nps" stroke="hsl(var(--primary))" strokeWidth={3} name="NPS" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Top doctors + comments */}
            <div className="grid lg:grid-cols-2 gap-6">
              {topDoctors.length > 0 && (
                <Card className="border-border">
                  <CardHeader><CardTitle className="text-lg">Top Médicos por NPS</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {topDoctors.map((d, i) => (
                      <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                          <div>
                            <p className="text-sm font-medium text-foreground">{d.name}</p>
                            <p className="text-xs text-muted-foreground">{d.responses} respostas · ⭐ {(d.avgQuality ?? 0).toFixed(1)}</p>
                          </div>
                        </div>
                        <Badge className={(d.nps ?? 0) >= 50 ? "bg-green-100 text-green-800" : (d.nps ?? 0) >= 0 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}>
                          NPS {d.nps ?? 0}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {recentComments.length > 0 && (
                <Card className="border-border">
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Comentários Recentes</CardTitle></CardHeader>
                  <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
                    {recentComments.map(c => (
                      <div key={c.id} className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={`text-[10px] ${c.nps_score >= 9 ? "border-green-500 text-green-600" : c.nps_score <= 6 ? "border-red-500 text-red-600" : "border-yellow-500 text-yellow-600"}`}>
                            NPS {c.nps_score}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{format(new Date(c.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                        </div>
                        <p className="text-sm text-foreground">{c.comment}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminNPS;