/**
 * Pacote família — titular gerencia dependentes (cônjuge, filhos, pais).
 *
 * Os dependentes vão poder, depois, usar o saldo/voucher do titular para
 * agendar consultas (vínculo já guardado via family_members.user_id).
 * Esta tela cobre o CRUD; a regra de cobrança/uso é evolução do payment.
 */
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getPatientNav } from "./patientNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Users, Trash2, UserPlus, Heart, Baby, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { logError } from "@/lib/logger";

type Member = {
  id: string;
  full_name: string;
  birth_date: string | null;
  cpf: string | null;
  relationship: string | null;
  phone: string | null;
  email: string | null;
};

const REL_OPTIONS = [
  { value: "conjuge", label: "Cônjuge", icon: Heart },
  { value: "filho", label: "Filho(a)", icon: Baby },
  { value: "pai", label: "Pai", icon: UserIcon },
  { value: "mae", label: "Mãe", icon: UserIcon },
  { value: "outro", label: "Outro", icon: UserIcon },
];

const FamilyMembers = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", birth_date: "", cpf: "", relationship: "", phone: "", email: "" });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await db.from("family_members")
        .select("id, full_name, birth_date, cpf, relationship, phone, email")
        .eq("holder_user_id", user.id)
        .order("created_at", { ascending: true });
      setMembers((data ?? []) as Member[]);
    } catch (e) {
      logError("FamilyMembers load", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.id]);

  const save = async () => {
    if (!user) return;
    if (!form.full_name.trim() || !form.relationship) {
      toast.info("Informe nome e parentesco."); return;
    }
    setSaving(true);
    try {
      const payload: any = {
        holder_user_id: user.id,
        full_name: form.full_name.trim(),
        relationship: form.relationship,
        birth_date: form.birth_date || null,
        cpf: form.cpf.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim().toLowerCase() || null,
      };
      const { error } = await db.from("family_members").insert(payload);
      if (error) throw error;
      toast.success("Dependente adicionado");
      setForm({ full_name: "", birth_date: "", cpf: "", relationship: "", phone: "", email: "" });
      setOpen(false);
      load();
    } catch (e: any) {
      toast.error("Erro ao salvar", { description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Remover este dependente? Esta ação não pode ser desfeita.")) return;
    try {
      const { error } = await db.from("family_members").delete().eq("id", id);
      if (error) throw error;
      toast.success("Dependente removido");
      setMembers((m) => m.filter((x) => x.id !== id));
    } catch (e: any) {
      toast.error("Erro ao remover", { description: e?.message });
    }
  };

  const ageOf = (bd: string | null) => {
    if (!bd) return null;
    const y = (Date.now() - new Date(bd).getTime()) / 3.156e10;
    return Math.floor(y);
  };
  const relIcon = (r: string | null) => {
    const o = REL_OPTIONS.find((x) => x.value === r);
    return o?.icon ?? UserIcon;
  };
  const relLabel = (r: string | null) => REL_OPTIONS.find((x) => x.value === r)?.label ?? "Dependente";

  return (
    <DashboardLayout title="Família" nav={getPatientNav("family")} role="patient">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Pacote família</h1>
            <p className="text-sm text-muted-foreground">Cadastre seus dependentes para agendar consultas em nome deles.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl gap-1.5"><Plus className="w-4 h-4" /> Adicionar</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo dependente</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Nome completo *</Label>
                  <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Ex.: Maria da Silva" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Parentesco *</Label>
                    <Select value={form.relationship} onValueChange={(v) => setForm({ ...form, relationship: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {REL_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Data de nascimento</Label>
                    <Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>CPF</Label>
                    <Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 90000-0000" />
                  </div>
                </div>
                <div>
                  <Label>E-mail (se já tem conta na plataforma)</Label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="dependente@email.com" />
                </div>
                <Button onClick={save} disabled={saving} className="w-full rounded-xl">
                  {saving ? "Salvando…" : "Adicionar dependente"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        ) : members.length === 0 ? (
          <EmptyState icon={UserPlus} title="Nenhum dependente ainda"
            description="Adicione cônjuge, filhos ou pais para agendar consultas e cuidar de todos por aqui."
            action={{ label: "Adicionar dependente", icon: Plus, onClick: () => setOpen(true) }} />
        ) : (
          <div className="space-y-2">
            {members.map((m) => {
              const Icon = relIcon(m.relationship);
              const age = ageOf(m.birth_date);
              return (
                <Card key={m.id}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{m.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {relLabel(m.relationship)}
                        {age !== null && ` · ${age} anos`}
                        {m.birth_date && ` · ${format(new Date(m.birth_date), "dd/MM/yyyy")}`}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" aria-label="Remover dependente" onClick={() => remove(m.id)}>
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
            <p className="text-[11px] text-muted-foreground text-center mt-3">
              Agendar para um dependente: ao marcar consulta, escolha o paciente na próxima atualização.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FamilyMembers;
