/**
 * Admin → Leads de contratos (vindos do formulário público /contratos).
 * Lista por status, permite mudar status e iniciar criação de contrato.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getAdminNav } from "./adminNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Mail, Phone, Users, ArrowRight, Inbox } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Lead = {
  id: string;
  org_name: string;
  org_type: string;
  cnpj: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  contact_role: string | null;
  expected_beneficiaries: number | null;
  message: string | null;
  status: string;
  created_at: string;
};

const STATUS_STYLE: Record<string, string> = {
  new:       "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/40",
  contacted: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/40",
  qualified: "bg-primary/10 text-primary border-primary/40",
  won:       "bg-success/10 text-success border-success/40",
  lost:      "bg-destructive/10 text-destructive border-destructive/40",
};
const STATUS_LABEL: Record<string, string> = {
  new: "Novo", contacted: "Em contato", qualified: "Qualificado", won: "Ganho", lost: "Perdido",
};

const AdminLeads = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    const { data } = await db.from("contract_leads")
      .select("*").order("created_at", { ascending: false });
    setLeads((data ?? []) as Lead[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const patch: any = { status, updated_at: new Date().toISOString() };
    if (status === "contacted") patch.contacted_at = new Date().toISOString();
    const { error } = await db.from("contract_leads").update(patch).eq("id", id);
    if (error) { toast.error("Erro ao atualizar", { description: error.message }); return; }
    setLeads((l) => l.map((x) => x.id === id ? { ...x, status } : x));
    toast.success("Status atualizado");
  };

  const filtered = filter === "all" ? leads : leads.filter((l) => l.status === filter);

  return (
    <DashboardLayout title="Leads de contratos" nav={getAdminNav("leads")} role="admin">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2"><Inbox className="w-5 h-5 text-primary" /> Leads inbound</h1>
            <p className="text-sm text-muted-foreground">Organizações que solicitaram contato pelo formulário público <code>/contratos</code>.</p>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(STATUS_LABEL).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-2">{[1,2,3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Inbox} title="Nenhum lead ainda"
            description="Divulgue a URL https://aloclinica.com.br/contratos para receber solicitações." />
        ) : (
          <div className="space-y-2">
            {filtered.map((l) => (
              <Card key={l.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground">{l.org_name}</p>
                        <Badge variant="outline" className="text-[10px]">{l.org_type}</Badge>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLE[l.status] ?? STATUS_STYLE.new}`}>
                          {STATUS_LABEL[l.status] ?? l.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {l.cnpj ? `CNPJ ${l.cnpj} · ` : ""}{format(new Date(l.created_at), "dd 'de' MMM yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-foreground">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <a href={`mailto:${l.contact_email}`} className="hover:underline truncate">{l.contact_email}</a>
                        </div>
                        {l.contact_phone && (
                          <div className="flex items-center gap-1.5 text-foreground">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            <a href={`tel:${l.contact_phone}`} className="hover:underline">{l.contact_phone}</a>
                          </div>
                        )}
                        <div className="text-muted-foreground">
                          <strong className="text-foreground">{l.contact_name}</strong>{l.contact_role ? ` · ${l.contact_role}` : ""}
                        </div>
                        {l.expected_beneficiaries && (
                          <div className="flex items-center gap-1.5 text-foreground">
                            <Users className="w-3 h-3 text-muted-foreground" />
                            ~{l.expected_beneficiaries.toLocaleString("pt-BR")} beneficiários
                          </div>
                        )}
                      </div>
                      {l.message && (
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2 italic">"{l.message}"</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Select value={l.status} onValueChange={(v) => updateStatus(l.id, v)}>
                        <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_LABEL).map(([v, lab]) => <SelectItem key={v} value={v}>{lab}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button size="sm" className="h-8 rounded-xl gap-1.5 text-xs"
                        onClick={() => navigate(`/dashboard/admin/contracts/new?lead=${l.id}`)}>
                        <Building2 className="w-3.5 h-3.5" /> Criar contrato <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminLeads;
