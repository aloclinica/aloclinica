import { useState, useEffect, useMemo } from "react";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAdminNav } from "./adminNav";
import { AdminPageHeader } from "./AdminPageHeader";
import { Search, History } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDebounce } from "@/hooks/use-debounce";
import type { AuditLog } from "@/types/domain";

const AdminLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [filterType, setFilterType] = useState("all");

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    const { data } = await db.from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setLogs(data ?? []);
    setLoading(false);
  };

  const filtered = useMemo(() => logs.filter(l => {
    const matchSearch = `${l.action} ${l.entity_type}`.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchType = filterType === "all" || l.entity_type === filterType;
    return matchSearch && matchType;
  }), [logs, debouncedSearch, filterType]);

  const entityColor: Record<string, string> = {
    patient: "bg-primary/10 text-primary",
    doctor: "bg-secondary/10 text-secondary",
    clinic: "bg-accent text-accent-foreground",
    appointment: "bg-destructive/10 text-destructive",
    plan: "bg-primary/10 text-primary",
    subscription: "bg-secondary/10 text-secondary",
  };

  return (
    <DashboardLayout title="Administração" nav={getAdminNav("logs")}>
      <div className="w-full mx-auto max-w-5xl space-y-5 pb-24 md:pb-6">
        <AdminPageHeader
          icon={History}
          eyebrow="Sistema"
          title="Histórico de Atividades"
          description="Logs de ações realizadas na plataforma para auditoria."
          accent="from-slate-500 to-slate-700"
        />

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar ação..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="patient">Paciente</SelectItem>
              <SelectItem value="doctor">Médico</SelectItem>
              <SelectItem value="clinic">Clínica</SelectItem>
              <SelectItem value="appointment">Consulta</SelectItem>
              <SelectItem value="plan">Plano</SelectItem>
              <SelectItem value="subscription">Assinatura</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? <div className="shimmer-v2 h-5 rounded w-32 inline-block" aria-label="Carregando" /> : (
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto -mx-0.5 rounded-xl">

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                Array.from({ length: 5 }).map((_, j) => (
                  <tr key={j} className="border-b border-border/30">
                                          <td key={j*6+0} className="px-4 py-3"><div className="shimmer-v2 h-4 rounded" /></td>
                      <td key={j*6+1} className="px-4 py-3"><div className="shimmer-v2 h-4 rounded" /></td>
                      <td key={j*6+2} className="px-4 py-3"><div className="shimmer-v2 h-4 rounded" /></td>
                      <td key={j*6+3} className="px-4 py-3"><div className="shimmer-v2 h-4 rounded" /></td>
                      <td key={j*6+4} className="px-4 py-3"><div className="shimmer-v2 h-4 rounded" /></td>
                      <td key={j*6+5} className="px-4 py-3"><div className="shimmer-v2 h-4 rounded" /></td>
                  </tr>
                ))
              ) : filtered.map(l => (
                  <TableRow key={l.id}>
                    <TableCell data-label="Data" className="text-muted-foreground text-xs whitespace-nowrap">
                      {format(new Date(l.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell data-label="Ação" className="font-medium text-foreground">{l.action}</TableCell>
                    <TableCell data-label="Tipo">
                      <Badge variant="outline" className={entityColor[l.entity_type] ?? ""}>
                        {l.entity_type}
                      </Badge>
                    </TableCell>
                    <TableCell data-label="Detalhes" className="text-xs text-muted-foreground max-w-xs truncate">
                      {l.details ? JSON.stringify(l.details) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nenhum log registrado. As atividades aparecerão aqui conforme são realizadas.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminLogs;
