import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiCard } from "@/components/ui/kpi-card";
import { Building2, Users, Activity, FileText, Mail, AlertCircle, BarChart3 } from "lucide-react";
import OrgaoSaudeTab from "./OrgaoSaudeTab";
import OrgaoDepartamentosTab from "./OrgaoDepartamentosTab";

type Contrato = {
  id: string; nome: string; tipo: string; status: string;
  cota_total: number | null; cota_utilizada: number; valor_consulta: number | null;
  vigencia_inicio: string; vigencia_fim: string | null;
};

const OrgaoDashboard = () => {
  const { user } = useAuth();
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [stats, setStats] = useState<Record<string, { benef: number; mesQtd: number; mesValor: number }>>({});
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        // RLS já restringe contratos ao gestor (managed_by_user_id = auth.uid())
        const { data: cts, error } = await db.from("contratos")
          .select("id,nome,tipo,status,cota_total,cota_utilizada,valor_consulta,vigencia_inicio,vigencia_fim")
          .order("created_at", { ascending: false });
        if (error) throw error;
        const lista = (cts ?? []) as Contrato[];
        setContratos(lista);

        const ini = new Date(); ini.setDate(1); ini.setHours(0, 0, 0, 0);
        const s: Record<string, { benef: number; mesQtd: number; mesValor: number }> = {};
        for (const c of lista) {
          const { count: benef } = await db.from("contrato_beneficiarios")
            .select("id", { count: "exact", head: true }).eq("contrato_id", c.id).eq("ativo", true);
          const { data: cons } = await db.from("consulta_contrato")
            .select("valor_repassado, created_at").eq("contrato_id", c.id).gte("created_at", ini.toISOString());
          const mesQtd = cons?.length ?? 0;
          const mesValor = (cons ?? []).reduce((sum: number, r: any) => sum + (Number(r.valor_repassado) || 0), 0);
          s[c.id] = { benef: benef ?? 0, mesQtd, mesValor };
        }
        setStats(s);
      } catch {
        setErro(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const nav = [
    { label: "Meu Contrato", href: "/dashboard/orgao?role=contract_manager", icon: <Building2 className="w-4 h-4" />, active: true, group: "Órgão" },
  ];

  const contratoIds = contratos.map((c) => c.id);

  return (
    <DashboardLayout title="Painel do Órgão" nav={nav} role="clinic">
      <div className="max-w-5xl mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> Painel do Órgão</h1>
          <p className="text-sm text-muted-foreground">Contratos, beneficiários e indicadores de saúde da população atendida.</p>
        </div>

        <Tabs defaultValue="contratos" className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-lg">
            <TabsTrigger value="contratos" className="gap-1.5"><FileText className="w-3.5 h-3.5" /> Contratos</TabsTrigger>
            <TabsTrigger value="saude" className="gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> Saúde</TabsTrigger>
            <TabsTrigger value="departamentos" className="gap-1.5"><Building2 className="w-3.5 h-3.5" /> Departamentos</TabsTrigger>
          </TabsList>
          <TabsContent value="saude" className="mt-4">
            <OrgaoSaudeTab contratoIds={contratoIds} />
          </TabsContent>
          <TabsContent value="departamentos" className="mt-4">
            <OrgaoDepartamentosTab contratoIds={contratoIds}
              contratosNomes={Object.fromEntries(contratos.map((c) => [c.id, c.nome]))} />
          </TabsContent>
          <TabsContent value="contratos" className="mt-4 space-y-4">

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i}><CardContent className="p-5 space-y-4">
                <Skeleton className="h-5 w-40" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((k) => <Skeleton key={k} className="h-16 rounded-xl" />)}
                </div>
              </CardContent></Card>
            ))}
          </div>
        ) : erro ? (
          <EmptyState
            variant="error"
            icon={AlertCircle}
            title="Não foi possível carregar seus contratos"
            description="Verifique sua conexão e tente novamente."
            action={{ label: "Recarregar", onClick: () => window.location.reload() }}
          />
        ) : contratos.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Nenhum contrato vinculado"
            description="Assim que seu contrato com a AloClínica for ativado, os dados de cota, beneficiários e medição aparecem aqui."
            action={{
              label: "Falar com a AloClínica",
              icon: Mail,
              onClick: () => { window.location.href = "mailto:contato@aloclinica.com.br?subject=Ativação%20de%20contrato%20(Órgão)"; },
            }}
          />
        ) : contratos.map((c) => {
          const st = stats[c.id] ?? { benef: 0, mesQtd: 0, mesValor: 0 };
          const pct = c.cota_total ? Math.min(100, Math.round((c.cota_utilizada / c.cota_total) * 100)) : null;
          return (
            <Card key={c.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{c.nome}</CardTitle>
                <Badge variant={c.status === "ativo" ? "default" : "secondary"}>{c.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <KpiCard icon={Activity} label="Consultas usadas" value={`${c.cota_utilizada}${c.cota_total ? ` / ${c.cota_total}` : ""}`} />
                  <KpiCard icon={Users} label="Beneficiários ativos" value={st.benef} />
                  <KpiCard icon={FileText} label="Consultas no mês" value={st.mesQtd} />
                  <KpiCard icon={FileText} label="Medição do mês" value={`R$ ${st.mesValor.toFixed(2).replace(".", ",")}`} />
                </div>
                {pct !== null && (
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Cota utilizada</span><span>{pct}%</span></div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Vigência: {new Date(c.vigencia_inicio).toLocaleDateString("pt-BR")}{c.vigencia_fim ? ` até ${new Date(c.vigencia_fim).toLocaleDateString("pt-BR")}` : " (sem fim)"}
                  {c.valor_consulta ? ` · Valor/consulta: R$ ${Number(c.valor_consulta).toFixed(2).replace(".", ",")}` : ""}
                </p>
              </CardContent>
            </Card>
          );
        })}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">{icon}{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}

export default OrgaoDashboard;
