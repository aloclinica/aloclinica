import { useState, useEffect } from "react";
import type { DoctorWithProfile } from "@/types/domain";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getAdminNav } from "./adminNav";
import { Search, Eye, Edit, Check, X } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

const AdminDoctors = () => {
  
  const [doctors, setDoctors] = useState<DoctorWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState<DoctorWithProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ crm: "", crm_state: "", bio: "", consultation_price: "" });

  useEffect(() => { fetchDoctors(); }, []);

  const fetchDoctors = async () => {
    const { data } = await db.from("doctor_profiles")
      .select("id, user_id, crm, crm_state, is_approved, bio, consultation_price, experience_years, education, rating, total_reviews, created_at")
      .order("created_at", { ascending: false });
    if (!data) { setLoading(false); return; }
    const userIds = data.map(d => d.user_id);
    const { data: profiles } = await db.from("profiles").select("user_id, first_name, last_name, phone").in("user_id", userIds);
    const pMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);
    setDoctors(data.map(d => ({ ...d, ...pMap.get(d.user_id) })));
    setLoading(false);
  };

  const toggleApproval = async (id: string, current: boolean) => {
    await db.from("doctor_profiles").update({ is_approved: !current }).eq("id", id);
    toast.success(current ? "Médico desativado" : "Médico aprovado! ✅");
    fetchDoctors();
  };

  const openDetail = (doc: DoctorWithProfile) => {
    setSelected(doc);
    setEditForm({ crm: doc.crm, crm_state: doc.crm_state, bio: doc.bio || "", consultation_price: String(doc.consultation_price || "") });
  };

  const saveEdit = async () => {
    if (!selected) return;
    const { error } = await db.from("doctor_profiles").update({
      crm: editForm.crm,
      crm_state: editForm.crm_state,
      bio: editForm.bio || null,
      consultation_price: parseFloat(editForm.consultation_price) || null,
    }).eq("id", selected.id);
    if (error) {
      toast.error("Erro", { description: error.message });
    } else {
      toast.success("Médico atualizado!");
      setEditing(false); setSelected(null); fetchDoctors();
    }
  };

  const filtered = doctors.filter(d => {
    const matchSearch = `${d.first_name} ${d.last_name} ${d.crm}`.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchStatus = filterStatus === "all" || (filterStatus === "approved" && d.is_approved) || (filterStatus === "pending" && !d.is_approved);
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout title="Administração" nav={getAdminNav("doctors")}>
      <div className="w-full mx-auto max-w-5xl pb-24 md:pb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">Médicos</h1>
        <p className="text-muted-foreground text-sm mb-4">{filtered.length} médico(s)</p>

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou CRM..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="approved">Aprovados</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? <div className="shimmer-v2 h-5 rounded w-32 inline-block" aria-label="Carregando" /> : (
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto -mx-0.5 rounded-xl">

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Médico</TableHead>
                  <TableHead className="hidden sm:table-cell">CRM</TableHead>
                  <TableHead className="hidden md:table-cell">Preço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (

                  Array.from({ length: 5 }).map((_, i) => (

                    <tr key={i} className="border-b border-border/30">
                            <td className="px-4 py-3"><div className="shimmer-v2 h-4 rounded" /></td>
      <td className="px-4 py-3"><div className="shimmer-v2 h-4 rounded" /></td>
      <td className="px-4 py-3"><div className="shimmer-v2 h-4 rounded" /></td>
      <td className="px-4 py-3"><div className="shimmer-v2 h-4 rounded" /></td>
      <td className="px-4 py-3"><div className="shimmer-v2 h-4 rounded" /></td>

                    </tr>
                  ))

                ) : filtered.map(doc => (
                  <TableRow key={doc.id}>
                    <TableCell data-label="Médico">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">{doc.first_name?.[0]}{doc.last_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">Dr(a). {doc.first_name} {doc.last_name}</span>
                      </div>
                    </TableCell>
                    <TableCell data-label="CRM" className="hidden sm:table-cell text-muted-foreground">{doc.crm}/{doc.crm_state}</TableCell>
                    <TableCell data-label="Preço" className="hidden md:table-cell text-muted-foreground">R$ {doc.consultation_price || "—"}</TableCell>
                    <TableCell data-label="Status">
                      <Badge variant={doc.is_approved ? "default" : "outline"}>{doc.is_approved ? "Aprovado" : "Pendente"}</Badge>
                    </TableCell>
                    <TableCell data-label="">
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openDetail(doc)}><Eye className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => toggleApproval(doc.id, doc.is_approved === true)}>
                          {doc.is_approved ? <X className="w-4 h-4 text-destructive" /> : <Check className="w-4 h-4 text-secondary" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum médico encontrado.</TableCell></TableRow>}
              </TableBody>
            </Table>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={() => { setSelected(null); setEditing(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Editar Médico" : "Detalhes do Médico"}</DialogTitle></DialogHeader>
          {selected && !editing && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Nome:</span><p className="font-medium text-foreground">Dr(a). {selected.first_name} {selected.last_name}</p></div>
                <div><span className="text-muted-foreground">CRM:</span><p className="font-medium text-foreground">{selected.crm}/{selected.crm_state}</p></div>
                <div><span className="text-muted-foreground">Preço:</span><p className="font-medium text-foreground">R$ {selected.consultation_price || "—"}</p></div>
                <div><span className="text-muted-foreground">Experiência:</span><p className="font-medium text-foreground">{selected.experience_years || 0} anos</p></div>
                <div><span className="text-muted-foreground">Avaliação:</span><p className="font-medium text-foreground">{selected.rating ?? "—"} ({selected.total_reviews} avaliações)</p></div>
                <div><span className="text-muted-foreground">Formação:</span><p className="font-medium text-foreground">{selected.education || "—"}</p></div>
              </div>
              {selected.bio && <div><span className="text-muted-foreground">Bio:</span><p className="text-foreground">{selected.bio}</p></div>}
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Edit className="w-4 h-4 mr-1" /> Editar</Button>
            </div>
          )}
          {selected && editing && (
            <div className="space-y-3">
              <Input placeholder="CRM" value={editForm.crm} onChange={e => setEditForm({ ...editForm, crm: e.target.value })} />
              <Input placeholder="Estado CRM" value={editForm.crm_state} onChange={e => setEditForm({ ...editForm, crm_state: e.target.value })} />
              <Input placeholder="Preço consulta" type="number" value={editForm.consultation_price} onChange={e => setEditForm({ ...editForm, consultation_price: e.target.value })} />
              <Input placeholder="Bio" value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} />
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

export default AdminDoctors;
