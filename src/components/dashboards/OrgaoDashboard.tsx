import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Activity, FileText } from "lucide-react";

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

  useEffect(() => {
    if (!user) return;
    (async () => {
      // RLS já restringe contratos ao gestor (managed_by_user_id = auth.uid())
      const { data: cts } = await db.from("contratos")
        .select("id,nome,tipo,status,cota_total,cota_utilizada,valor_consulta,vigencia_inicio,vigencia_fim")
        .order("created_at", { ascending: false });
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
      setLoading(false);
    })();
  }, [user]);

  const nav = [
    { label: "Meu Contrato", href: "/dashboard/orgao?role=contract_manager", icon: <Building2 className="w-4 h-4" />, active: true, group: "Órgão" },
  ];

  return (
    <DashboardLayout title="Painel do Órgão" nav={nav} role="clinic">
      <div className="max-w-5xl mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> Meus Contratos</h1>
          <p className="text-sm text-muted-foreground">Acompanhe cota, beneficiários e medição das consultas custeadas.</p>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : contratos.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum contrato vinculado ao seu acesso. Fale com a AloClínica.</CardContent></Card>
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
                  <Kpi icon={<Activity className="w-4 h-4" />} label="Consultas usadas" value={`${c.cota_utilizada}${c.cota_total ? ` / ${c.cota_total}` : ""}`} />
                  <Kpi icon={<Users className="w-4 h-4" />} label="Beneficiários ativos" value={String(st.benef)} />
                  <Kpi icon={<FileText className="w-4 h-4" />} label="Consultas no mês" value={String(st.mesQtd)} />
                  <Kpi icon={<FileText className="w-4 h-4" />} label="Medição do mês" value={`R$ ${st.mesValor.toFixed(2).replace(".", ",")}`} />
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
