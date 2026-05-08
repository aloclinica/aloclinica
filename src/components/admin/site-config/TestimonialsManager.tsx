/**
 * Gerenciador de Depoimentos exibidos na landing.
 */
import { useState } from "react";
import { db } from "@/integrations/supabase/untyped";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import {
  Save, RefreshCw, Plus, Trash2, Pencil, Star, MessageSquareQuote,
} from "lucide-react";
import { MotionCard, EmptyState, StarRating, type Testimonial, type DeleteTarget } from "./shared";

type Props = {
  testimonials: Testimonial[];
  reload: () => Promise<void> | void;
  onDelete: (target: DeleteTarget) => void;
};

export function TestimonialsManager({ testimonials, reload, onDelete }: Props) {
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [dialog, setDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const blank = (): Testimonial => ({
    id: "", name: "", role: "", company: "", avatar_url: "", text: "", rating: 5, is_active: true, order_index: testimonials.length + 1,
  });

  const openNew = () => { setEditing(blank()); setDialog(true); };
  const openEdit = (t: Testimonial) => { setEditing({ ...t }); setDialog(true); };

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim() || !editing.text.trim()) { toast.error("Nome e texto são obrigatórios"); return; }
    setSaving(true);
    const payload = {
      name: editing.name,
      role: editing.role || null,
      company: editing.company || null,
      avatar_url: editing.avatar_url || null,
      text: editing.text,
      rating: editing.rating,
      is_active: editing.is_active,
      order_index: editing.order_index,
    };
    let error;
    if (editing.id) {
      ({ error } = await db.from("testimonials").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await db.from("testimonials").insert(payload));
    }
    if (error) {
      toast.error("Erro ao salvar depoimento", { description: error.message });
    } else {
      toast.success(editing.id ? "Depoimento atualizado!" : "Depoimento criado!");
      setDialog(false);
      await reload();
    }
    setSaving(false);
  };

  const toggleActive = async (t: Testimonial) => {
    await db.from("testimonials").update({ is_active: !t.is_active }).eq("id", t.id);
    await reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">
            {testimonials.length} depoimento{testimonials.length !== 1 ? "s" : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            {testimonials.filter(t => t.is_active).length} ativo{testimonials.filter(t => t.is_active).length !== 1 ? "s" : ""} na landing page
          </p>
        </div>
        <Button size="sm" onClick={openNew} className="gap-2"><Plus className="w-4 h-4" />Novo Depoimento</Button>
      </div>

      {testimonials.length === 0 ? (
        <EmptyState
          icon={MessageSquareQuote}
          title="Nenhum depoimento"
          description="Adicione depoimentos de pacientes para exibir na landing page."
          action={<Button size="sm" onClick={openNew} className="gap-2"><Plus className="w-4 h-4" />Adicionar primeiro</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {testimonials.map((t, i) => (
              <MotionCard
                key={t.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`group ${!t.is_active ? "opacity-50" : ""}`}
              >
                <CardContent className="pt-4 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {t.avatar_url ? (
                        <img src={t.avatar_url} alt={t.name} className="w-9 h-9 rounded-full object-cover border-2 border-border" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-xs font-bold text-primary">{t.name[0]}</div>
                      )}
                      <div>
                        <p className="text-sm font-semibold leading-tight">{t.name}</p>
                        <p className="text-[11px] text-muted-foreground">{t.role ?? ""}{t.company ? ` · ${t.company}` : ""}</p>
                      </div>
                    </div>
                    <Switch checked={t.is_active} onCheckedChange={() => toggleActive(t)} />
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= t.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"}`} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-3 italic">"{t.text}"</p>
                  <div className="flex gap-2 pt-2 border-t border-border/30">
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => openEdit(t)}>
                      <Pencil className="w-3.5 h-3.5" />Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive h-8 w-8"
                      onClick={() => onDelete({ type: "testimonial", id: t.id, label: t.name })}
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

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar Depoimento" : "Novo Depoimento"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nome *</Label>
                  <Input className="mt-1" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div>
                  <Label>Cargo / Papel</Label>
                  <Input className="mt-1" value={editing.role ?? ""} onChange={(e) => setEditing({ ...editing, role: e.target.value })} placeholder="Paciente" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Empresa (opcional)</Label>
                  <Input className="mt-1" value={editing.company ?? ""} onChange={(e) => setEditing({ ...editing, company: e.target.value })} />
                </div>
                <div>
                  <Label>Foto (URL)</Label>
                  <Input className="mt-1" value={editing.avatar_url ?? ""} onChange={(e) => setEditing({ ...editing, avatar_url: e.target.value })} placeholder="https://..." />
                </div>
              </div>
              <div>
                <Label>Depoimento *</Label>
                <Textarea className="mt-1 resize-none min-h-[80px]" value={editing.text} onChange={(e) => setEditing({ ...editing, text: e.target.value })} />
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <Label className="text-sm mb-1.5 block">Avaliação</Label>
                  <StarRating value={editing.rating} onChange={(v) => setEditing({ ...editing, rating: v })} />
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <Label className="font-normal text-sm">Ativo</Label>
                  <Switch checked={editing.is_active} onCheckedChange={(c) => setEditing({ ...editing, is_active: c })} />
                </div>
              </div>
              <div>
                <Label>Ordem de exibição</Label>
                <Input className="mt-1 w-24" type="number" min={1} value={editing.order_index} onChange={(e) => setEditing({ ...editing, order_index: Number(e.target.value) })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
