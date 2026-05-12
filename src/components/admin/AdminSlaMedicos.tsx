/**
 * AdminSlaMedicos — dashboard de SLA por médico (laudos atrasados).
 *
 * Lê de doctor_sla_dashboard view.
 * Destaca: médicos com >0 atrasados (vermelho), >0 próximos 24h (amarelo).
 */
import { useEffect, useMemo, useState } from "react";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getAdminNav } from "./adminNav";
import { AdminPageHeader } from "./AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Stethoscope, RefreshCw, AlertTriangle, Search, Clock, CheckCircle2, Activity,
} from "lucide-react";

type SlaRow = {
  doctor_id: string;
  doctor_user_id: string;
  doctor_name: string | null;
  crm: string | null;
  crm_state: string | null;
  pendentes: number;
  atrasados: number;
  proximos_24h: number;
  avg_resolution_hours: number | null;
  proximo_sla: string | null;
};

const adminNav = getAdminNav("sla-medicos");

const AdminSlaMedicos = () => {
  const [rows, setRows] = useState<SlaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchAll = async () => {
    setLoading(true);
    const { data, error } = await db.from("doctor_sla_dashboard").select("*");
    if (error) {
      console.error(error);
    }
    setRows(((data ?? []) as SlaRow[]).sort((a, b) => b.atrasados - a.atrasados || b.proximos_24h - a.proximos_24h));
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(r => {
      if (filterStatus === "atrasados" && r.atrasados === 0) return false;
      if (filterStatus === "proximos" && r.proximos_24h === 0) return false;
      if (filterStatus === "ok" && (r.atrasados > 0 || r.proximos_24h > 0)) return false;
      if (q && !`${r.doctor_name ?? ""} ${r.crm ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, search, filterStatus]);

  const totals = useMemo(() => ({
    medicos: rows.length,
    pendentes: rows.reduce((s, r) => s + (r.pendentes ?? 0), 0),
    atrasados: rows.reduce((s, r) => s + (r.atrasados ?? 0), 0),
    proximos: rows.reduce((s, r) => s + (r.proximos_24h ?? 0), 0),
    medicos_atrasados: rows.filter(r => r.atrasados > 0).length,
  }), [rows]);

  return (
    <DashboardLayout title="Admin" nav={adminNav}>
      <div className="space-y-5 pb-24 md:pb-8">
        <AdminPageHeader
          icon={Stethoscope}
          eyebrow="Operação"
          title="SLA dos médicos"
          description={`${totals.medicos} médicos · ${totals.pendentes} laudos pendentes · ${totals.atrasados} atrasados`}
          accent="from-orange-500 to-red-600"
          badge={
            totals.medicos_atrasados > 0
              ? { label: `${totals.medicos_atrasados} médico${totals.medicos_atrasados === 1 ? "" : "s"} fora do SLA`, tone: "danger" }
              : undefined
          }
          actions={
            <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading} className="gap-1.5">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
            </Button>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Activity className="w-4 h-4 text-blue-500" /> Pendentes
              </div>
              <p className="text-2xl font-bold tabular-nums">{totals.pendentes}</p>
            </CardContent>
          </Card>
          <Card className={totals.atrasados > 0 ? "border-destructive/40" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <AlertTriangle className="w-4 h-4 text-destructive" /> Atrasados
              </div>
              <p className="text-2xl font-bold tabular-nums">{totals.atrasados}</p>
            </CardContent>
          </Card>
          <Card className={totals.proximos > 0 ? "border-amber-300" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="w-4 h-4 text-amber-500" /> Próx 24h
              </div>
              <p className="text-2xl font-bold tabular-nums">{totals.proximos}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Stethoscope className="w-4 h-4 text-emerald-500" /> Médicos
              </div>
              <p className="text-2xl font-bold tabular-nums">{totals.medicos}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-3 flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou CRM..."
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="atrasados">Apenas atrasados</SelectItem>
                <SelectItem value="proximos">Próximos 24h</SelectItem>
                <SelectItem value="ok">Em dia (sem alertas)</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Médico</TableHead>
                  <TableHead>CRM</TableHead>
                  <TableHead className="text-right">Pendentes</TableHead>
                  <TableHead className="text-right">Atrasados</TableHead>
                  <TableHead className="text-right">Próx 24h</TableHead>
                  <TableHead className="text-right">Tempo médio</TableHead>
                  <TableHead>Próximo SLA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">Carregando...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    {filterStatus === "ok" ? "✅ Todos médicos estão dentro do SLA!" : "Nenhum médico no filtro atual"}
                  </TableCell></TableRow>
                ) : filtered.map(r => {
                  const initials = (r.doctor_name ?? "?").split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
                  const isOverdue = r.atrasados > 0;
                  const isNear = !isOverdue && r.proximos_24h > 0;
                  return (
                    <TableRow key={r.doctor_id} className={isOverdue ? "bg-destructive/5" : isNear ? "bg-amber-50/30 dark:bg-amber-950/10" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{r.doctor_name ?? "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.crm ? `${r.crm}/${r.crm_state ?? ""}` : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{r.pendentes}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.atrasados > 0 ? (
                          <Badge variant="destructive" className="font-mono">{r.atrasados}</Badge>
                        ) : <span className="text-emerald-600 text-xs">✓</span>}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.proximos_24h > 0 ? (
                          <Badge variant="outline" className="border-amber-300 text-amber-700 font-mono">{r.proximos_24h}</Badge>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-xs">
                        {r.avg_resolution_hours != null ? `${r.avg_resolution_hours.toFixed(1)}h` : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.proximo_sla ? formatDistanceToNow(new Date(r.proximo_sla), { addSuffix: true, locale: ptBR }) : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminSlaMedicos;
