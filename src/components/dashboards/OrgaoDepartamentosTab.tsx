/**
 * Aba "Departamentos" no painel do órgão — CRUD básico para subdividir o
 * contrato por unidade (RH, TI, etc.) com cota independente.
 *
 * O backend (tabela + trigger de incremento de cota) já existe na migration
 * 20260528005000_contrato_departamentos.sql. Esta tela é a operação visual.
 */
import { useEffect, useState } from "react";
import { db } from "@/integrations/supabase/untyped";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { logError } from "@/lib/logger";

interface Props {
  contratoIds: string[];
  contratosNomes: Record<string, string>;
}

type Departamento = {
  id: string;
  contrato_id: string;
  nome: string;
  cota_total: number | null;
  cota_utilizada: number;
  ativo: boolean;
};

export default function OrgaoDepartamentosTab({ contratoIds, contratosNomes }: Props) {
  const [loading, setLoading] = useState(true);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ contrato_id: "", nome: "", cota_total: "" });

  const load = async () => {
    if (!contratoIds.length) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data } = await db.from("contrato_departamentos")
        .select("id, contrato_id, nome, cota_total, cota_utilizada, ativo")
        .in("contrato_id", contratoIds)
        .order("created_at", { ascending: true });
      setDepartamentos((data ?? []) as Departamento[]);
    } catch (e) {
      logError("OrgaoDepartamentosTab load", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [contratoIds.join(",")]);

  const save = async () => {
    if (!form.contrato_id || !form.nome.trim()) {
      toast.info("Escolha o contrato e dê um nome ao departamento."); return;
    }
    setSaving(true);
    try {
      const { error } = await db.from("contrato_departamentos").insert({
        contrato_id: form.contrato_id,
        nome: form.nome.trim(),
        cota_total: form.cota_total ? Number(form.cota_total) : null,
        cota_utilizada: 0,
        ativo: true,
      } as any);
      if (error) throw error;
      toast.success("Departamento criado");
      setForm({ contrato_id: "", nome: "", cota_total: "" });
      setOpen(false);
      load();
    } catch (e: any) {
      toast.error("Erro ao salvar", { description: e?.message });
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Remover este departamento? Os beneficiários ficam sem departamento, mas as consultas já consumidas continuam registradas.")) return;
    try {
      const { error } = await db.from("contrato_departamentos").delete().eq("id", id);
      if (error) throw error;
      setDepartamentos((d) => d.filter((x) => x.id !== id));
      toast.success("Departamento removido");
    } catch (e: any) {
      toast.error("Erro ao remover", { description: e?.message });
    }
  };

  if (loading) {
    return <div className="space-y-2">{[1,2,3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Subdivida o contrato por unidade interna (RH, TI, Operações) para controle de cota por departamento.
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl gap-1.5"><Plus className="w-4 h-4" /> Novo departamento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo departamento</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Contrato *</Label>
                <Select value={form.contrato_id} onValueChange={(v) => setForm({ ...form, contrato_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o contrato" /></SelectTrigger>
                  <SelectContent>
                    {contratoIds.map((id) => (
                      <SelectItem key={id} value={id}>{contratosNomes[id] ?? id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nome do departamento *</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Recursos Humanos" />
              </div>
              <div>
                <Label>Cota de consultas (opcional)</Label>
                <Input type="number" min={0} value={form.cota_total}
                  onChange={(e) => setForm({ ...form, cota_total: e.target.value })} placeholder="Ex.: 200" />
                <p className="text-[10px] text-muted-foreground mt-1">Deixe vazio para sem limite. A cota é decrementada automaticamente conforme as consultas acontecem.</p>
              </div>
              <Button onClick={save} disabled={saving} className="w-full rounded-xl">{saving ? "Salvando…" : "Criar departamento"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {departamentos.length === 0 ? (
        <EmptyState icon={Building2}
          title="Nenhum departamento criado ainda"
          description="Crie unidades internas para controlar cota por equipe — útil em empresas com vários setores."
          action={{ label: "Novo departamento", icon: Plus, onClick: () => setOpen(true) }}
        />
      ) : (
        <div className="space-y-2">
          {departamentos.map((d) => {
            const pct = d.cota_total ? Math.min(100, Math.round((d.cota_utilizada / d.cota_total) * 100)) : null;
            return (
              <Card key={d.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{d.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        Contrato: {contratosNomes[d.contrato_id] ?? d.contrato_id}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" aria-label="Remover departamento" onClick={() => remove(d.id)}>
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Consultas</p>
                      <p className="text-sm font-bold text-foreground tabular-nums">
                        {d.cota_utilizada}{d.cota_total ? ` / ${d.cota_total}` : ""}
                      </p>
                    </div>
                    <div className="col-span-2">
                      {d.cota_total ? (
                        <div>
                          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                            <span>Cota utilizada</span><span>{pct}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className={`h-full ${pct! >= 90 ? "bg-destructive" : pct! >= 70 ? "bg-amber-500" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted-foreground">Sem limite definido</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground text-center">
        <Users className="w-3 h-3 inline mr-1" /> Vincule beneficiários a departamentos na tela de cadastro de beneficiários (em breve).
      </p>
    </div>
  );
}
