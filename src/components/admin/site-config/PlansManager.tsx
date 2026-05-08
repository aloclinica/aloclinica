/**
 * Gerenciador de Planos de Assinatura.
 * CRUD com diálogo modal para criar/editar planos.
 */
import { useState } from "react";
import { db } from "@/integrations/supabase/untyped";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import {
  Save, RefreshCw, Plus, Trash2, Pencil, X, EyeOff, Check, CircleDollarSign,
} from "lucide-react";
import { MotionCard, EmptyState, type Plan, type DeleteTarget } from "./shared";

type Props = {
  plans: Plan[];
  reload: () => Promise<void> | void;
  onDelete: (target: DeleteTarget) => void;
};

const blankPlan = (): Plan => ({
  id: "", name: "", description: "", price: 0, interval: "monthly",
  max_appointments: null, is_active: true, features: [], stripe_price_id: null,
});

export function PlansManager({ plans, reload, onDelete }: Props) {
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planDialog, setPlanDialog] = useState(false);
  const [planFeatureInput, setPlanFeatureInput] = useState("");
  const [savingPlan, setSavingPlan] = useState(false);

  const openNewPlan = () => { setEditingPlan(blankPlan()); setPlanFeatureInput(""); setPlanDialog(true); };
  const openEditPlan = (p: Plan) => { setEditingPlan({ ...p, features: [...p.features] }); setPlanFeatureInput(""); setPlanDialog(true); };

  const addFeature = () => {
    if (!planFeatureInput.trim() || !editingPlan) return;
    setEditingPlan({ ...editingPlan, features: [...editingPlan.features, planFeatureInput.trim()] });
    setPlanFeatureInput("");
  };

  const removeFeature = (i: number) => {
    if (!editingPlan) return;
    setEditingPlan({ ...editingPlan, features: editingPlan.features.filter((_, idx) => idx !== i) });
  };

  const savePlan = async () => {
    if (!editingPlan) return;
    if (!editingPlan.name.trim()) { toast.error("Nome do plano é obrigatório"); return; }
    setSavingPlan(true);
    const payload = {
      name: editingPlan.name,
      description: editingPlan.description || null,
      price: Number(editingPlan.price),
      interval: editingPlan.interval,
      max_appointments: editingPlan.max_appointments ? Number(editingPlan.max_appointments) : null,
      is_active: editingPlan.is_active,
      features: editingPlan.features,
      stripe_price_id: editingPlan.stripe_price_id || null,
    };
    let error;
    if (editingPlan.id) {
      ({ error } = await db.from("plans").update(payload).eq("id", editingPlan.id));
    } else {
      ({ error } = await db.from("plans").insert(payload));
    }
    if (error) {
      toast.error("Erro ao salvar plano", { description: error.message });
    } else {
      toast.success(editingPlan.id ? "Plano atualizado!" : "Plano criado!");
      setPlanDialog(false);
      await reload();
    }
    setSavingPlan(false);
  };

  const togglePlanActive = async (p: Plan) => {
    await db.from("plans").update({ is_active: !p.is_active }).eq("id", p.id);
    await reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">
            {plans.length} plano{plans.length !== 1 ? "s" : ""} cadastrado{plans.length !== 1 ? "s" : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            {plans.filter(p => p.is_active).length} ativo{plans.filter(p => p.is_active).length !== 1 ? "s" : ""}
            {plans.filter(p => !p.is_active).length > 0 && ` · ${plans.filter(p => !p.is_active).length} inativo${plans.filter(p => !p.is_active).length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button onClick={openNewPlan} size="sm" className="gap-2"><Plus className="w-4 h-4" />Novo Plano</Button>
      </div>

      {plans.length === 0 ? (
        <EmptyState
          icon={CircleDollarSign}
          title="Nenhum plano cadastrado"
          description="Crie planos de assinatura para seus pacientes."
          action={<Button size="sm" onClick={openNewPlan} className="gap-2"><Plus className="w-4 h-4" />Criar primeiro plano</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {plans.map((p, i) => (
              <MotionCard
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`relative group overflow-hidden ${!p.is_active ? "opacity-50 grayscale-[30%]" : ""}`}
              >
                {!p.is_active && (
                  <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center pointer-events-none">
                    <Badge variant="outline" className="text-xs"><EyeOff className="w-3 h-3 mr-1" />Inativo</Badge>
                  </div>
                )}
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="font-semibold text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{p.description ?? "Sem descrição"}</p>
                    </div>
                    <Switch checked={p.is_active} onCheckedChange={() => togglePlanActive(p)} className="shrink-0" />
                  </div>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-2xl font-bold tracking-tight">R$ {Number(p.price).toFixed(2).replace(".", ",")}</span>
                    <span className="text-xs text-muted-foreground">/{p.interval === "monthly" ? "mês" : p.interval === "annual" ? "ano" : "único"}</span>
                  </div>
                  {p.features.length > 0 && (
                    <ul className="mb-3 space-y-1">
                      {p.features.slice(0, 4).map((f, idx) => (
                        <li key={idx} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />{f}
                        </li>
                      ))}
                      {p.features.length > 4 && (
                        <li className="text-xs text-muted-foreground/60 pl-5">+{p.features.length - 4} mais…</li>
                      )}
                    </ul>
                  )}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border/30">
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => openEditPlan(p)}>
                      <Pencil className="w-3.5 h-3.5" />Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive h-8 w-8"
                      onClick={() => onDelete({ type: "plan", id: p.id, label: p.name })}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </MotionCard>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Plan dialog */}
      <Dialog open={planDialog} onOpenChange={setPlanDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan?.id ? "Editar Plano" : "Novo Plano"}</DialogTitle>
          </DialogHeader>
          {editingPlan && (
            <div className="space-y-4">
              <div>
                <Label>Nome do plano *</Label>
                <Input className="mt-1" value={editingPlan.name} onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })} placeholder="Plano Básico" />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea className="mt-1 resize-none min-h-[60px]" value={editingPlan.description ?? ""} onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Preço (R$)</Label>
                  <Input className="mt-1" type="number" min={0} step={0.01} value={editingPlan.price} onChange={(e) => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Intervalo</Label>
                  <Select value={editingPlan.interval} onValueChange={(v) => setEditingPlan({ ...editingPlan, interval: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="annual">Anual</SelectItem>
                      <SelectItem value="single">Avulso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Máx. consultas (vazio = ilimitado)</Label>
                  <Input className="mt-1" type="number" min={1} value={editingPlan.max_appointments ?? ""} onChange={(e) => setEditingPlan({ ...editingPlan, max_appointments: e.target.value ? Number(e.target.value) : null })} placeholder="∞" />
                </div>
                <div>
                  <Label>Stripe Price ID</Label>
                  <Input className="mt-1 font-mono text-xs" value={editingPlan.stripe_price_id ?? ""} onChange={(e) => setEditingPlan({ ...editingPlan, stripe_price_id: e.target.value || null })} placeholder="price_xxx" />
                </div>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-border/50 bg-muted/30">
                <Label className="font-normal">Plano ativo</Label>
                <Switch checked={editingPlan.is_active} onCheckedChange={(c) => setEditingPlan({ ...editingPlan, is_active: c })} />
              </div>
              <div>
                <Label>Funcionalidades incluídas</Label>
                <div className="flex flex-wrap gap-1.5 mt-2 min-h-[32px] p-2 rounded-lg border border-dashed border-border/50 bg-muted/20">
                  {editingPlan.features.length === 0 && (
                    <span className="text-xs text-muted-foreground/50 italic">Nenhuma funcionalidade adicionada</span>
                  )}
                  {editingPlan.features.map((f, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 pr-1">
                      {f}
                      <button type="button" onClick={() => removeFeature(i)} className="ml-0.5 text-muted-foreground hover:text-foreground transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={planFeatureInput}
                    onChange={(e) => setPlanFeatureInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFeature(); } }}
                    placeholder="Ex: Consultas ilimitadas"
                    className="flex-1 text-sm"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addFeature} className="gap-1"><Plus className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialog(false)}>Cancelar</Button>
            <Button onClick={savePlan} disabled={savingPlan} className="gap-2">
              {savingPlan ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar Plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
