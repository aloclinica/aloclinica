import { useState, useEffect } from "react";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { getAdminNav } from "./adminNav";
import { AdminPageHeader } from "./AdminPageHeader";
import { Search, Eye, Edit, Building2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

interface ClinicItem {
  id: string;
  user_id: string;
  name: string;
  cnpj: string | null;
  phone: string | null;
  address: string | null;
  is_approved: boolean | null;
  created_at: string;
}

const AdminClinics = () => {
  
  const [clinics, setClinics] = useState<ClinicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selected, setSelected] = useState<ClinicItem | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", cnpj: "", phone: "", address: "" });

  useEffect(() => { fetchClinics(); }, []);

  const fetchClinics = async () => {
    const { data } = await db.from("clinic_profiles")
      .select("id, user_id, name, cnpj, phone, address, is_approved, created_at")
      .order("created_at", { ascending: false });
    setClinics(data ?? []);
    setLoading(false);
  };

  const toggleApproval = async (id: string, current: boolean) => {
    await db.from("clinic_profiles").update({ is_approved: !current }).eq("id", id);
    toast.success(current ? "Clínica desativada" : "Clínica aprovada!");
    fetchClinics();
  };

  const openDetail = (c: ClinicItem) => {
    setSelected(c);
    setEditForm({ name: c.name, cnpj: c.cnpj || "", phone: c.phone || "", address: c.address || "" });
  };

  const saveEdit = async () => {
    if (!selected) return;
    const { error } = await db.from("clinic_profiles").update({
      name: editForm.name, cnpj: editForm.cnpj || null, phone: editForm.phone || null, address: editForm.address || null,
    }).eq("id", selected.id);
    if (error) toast.error("Erro", { description: error.message });
    else { toast.success("Clínica atualizada!"); setEditing(false); setSelected(null); fetchClinics(); }
  };

  const filtered = clinics.filter(c => `${c.name} ${c.cnpj || ""}`.toLowerCase().includes(debouncedSearch.toLowerCase()));

  return (
    <DashboardLayout title="Administração" nav={getAdminNav("clinics")}>
      <div className="w-full mx-auto max-w-5xl space-y-5 pb-24 md:pb-6">
        <AdminPageHeader
          icon={Building2}
          eyebrow="Pessoas"
          title="Clínicas"
          description="Clínicas parceiras cadastradas e seus dados de operação."
          accent="from-orange-500 to-amber-600"
          badge={{ label: `${filtered.length} ${filtered.length === 1 ? "clínica" : "clínicas"}`, tone: "warning" }}
        />

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou CNPJ..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        {loading ? <div className="shimmer-v2 h-5 rounded w-32 inline-block" aria-label="Carregando" /> : (
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto -mx-0.5 rounded-xl">

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Clínica</TableHead>
                  <TableHead scope="col">CNPJ</TableHead>
                  <TableHead scope="col">Telefone</TableHead>
                  <TableHead scope="col">Status</TableHead>
                  <TableHead scope="col" className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // UI: skeleton rows use TableRow/TableCell for semantic + responsive consistency
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-b border-border/30">
                      <TableCell className="px-4 py-3"><div className="shimmer-v2 h-4 rounded" /></TableCell>
                      <TableCell className="px-4 py-3"><div className="shimmer-v2 h-4 rounded" /></TableCell>
                      <TableCell className="px-4 py-3"><div className="shimmer-v2 h-4 rounded" /></TableCell>
                      <TableCell className="px-4 py-3"><div className="shimmer-v2 h-4 rounded" /></TableCell>
                      <TableCell className="px-4 py-3"><div className="shimmer-v2 h-4 rounded" /></TableCell>
                    </TableRow>
                  ))
                ) : filtered.map(c => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8"><AvatarFallback className="bg-accent text-accent-foreground text-xs">{c.name?.[0]}</AvatarFallback></Avatar>
                        <span className="font-medium text-foreground">{c.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.cnpj || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.phone || "—"}</TableCell>
                    <TableCell><Badge variant={c.is_approved ? "default" : "outline"}>{c.is_approved ? "Aprovada" : "Pendente"}</Badge></TableCell>
                    <TableCell className="text-right space-x-1">
                      {/* UI: aria-label for icon-only action */}
                      <Button size="sm" variant="ghost" aria-label="Ver detalhes da clínica" onClick={() => openDetail(c)}><Eye className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleApproval(c.id, c.is_approved === true)}>
                        <span className={`text-xs font-medium ${c.is_approved ? "text-destructive" : "text-secondary"}`}>{c.is_approved ? "Desativar" : "Aprovar"}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma clínica.</TableCell></TableRow>}
              </TableBody>
            </Table>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={() => { setSelected(null); setEditing(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Editar Clínica" : "Detalhes da Clínica"}</DialogTitle></DialogHeader>
          {selected && !editing && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Nome:</span><p className="font-medium text-foreground">{selected.name}</p></div>
                <div><span className="text-muted-foreground">CNPJ:</span><p className="font-medium text-foreground">{selected.cnpj || "—"}</p></div>
                <div><span className="text-muted-foreground">Telefone:</span><p className="font-medium text-foreground">{selected.phone || "—"}</p></div>
                <div><span className="text-muted-foreground">Endereço:</span><p className="font-medium text-foreground">{selected.address || "—"}</p></div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Edit className="w-4 h-4 mr-1" /> Editar</Button>
            </div>
          )}
          {selected && editing && (
            <div className="space-y-3">
              <Input placeholder="Nome" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              <Input placeholder="CNPJ" value={editForm.cnpj} onChange={e => setEditForm({ ...editForm, cnpj: e.target.value })} />
              <Input placeholder="Telefone" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
              <Input placeholder="Endereço" value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} />
              <div className="flex gap-2">
                <Button onClick={saveEdit} className="bg-gradient-hero text-primary-foreground">Salvar</Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminClinics;
