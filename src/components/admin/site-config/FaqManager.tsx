/**
 * Gerenciador do FAQ exibido na landing.
 */
import { useMemo, useState } from "react";
import { db } from "@/integrations/supabase/untyped";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import {
  Save, RefreshCw, Plus, Trash2, Pencil, Search, EyeOff, GripVertical, HelpCircle,
} from "lucide-react";
import { MotionCard, EmptyState, type FaqItem, type DeleteTarget } from "./shared";

type Props = {
  faqItems: FaqItem[];
  reload: () => Promise<void> | void;
  onDelete: (target: DeleteTarget) => void;
};

export function FaqManager({ faqItems, reload, onDelete }: Props) {
  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [dialog, setDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const blank = (): FaqItem => ({
    id: "", question: "", answer: "", category: "geral", is_active: true, order_index: faqItems.length + 1,
  });

  const openNew = () => { setEditing(blank()); setDialog(true); };
  const openEdit = (f: FaqItem) => { setEditing({ ...f }); setDialog(true); };

  const save = async () => {
    if (!editing) return;
    if (!editing.question.trim() || !editing.answer.trim()) { toast.error("Pergunta e resposta são obrigatórias"); return; }
    setSaving(true);
    const payload = {
      question: editing.question,
      answer: editing.answer,
      category: editing.category || "geral",
      is_active: editing.is_active,
      order_index: editing.order_index,
    };
    let error;
    if (editing.id) {
      ({ error } = await db.from("faq_items").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await db.from("faq_items").insert(payload));
    }
    if (error) {
      toast.error("Erro ao salvar FAQ", { description: error.message });
    } else {
      toast.success(editing.id ? "FAQ atualizado!" : "FAQ criado!");
      setDialog(false);
      await reload();
    }
    setSaving(false);
  };

  const toggleActive = async (f: FaqItem) => {
    await db.from("faq_items").update({ is_active: !f.is_active }).eq("id", f.id);
    await reload();
  };

  const filteredFaq = useMemo(() => {
    if (!searchTerm.trim()) return faqItems;
    const term = searchTerm.toLowerCase();
    return faqItems.filter((f) =>
      f.question.toLowerCase().includes(term) ||
      f.answer.toLowerCase().includes(term) ||
      (f.category ?? "").toLowerCase().includes(term)
    );
  }, [faqItems, searchTerm]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{faqItems.length} pergunta{faqItems.length !== 1 ? "s" : ""} no FAQ</p>
          <p className="text-xs text-muted-foreground">
            {faqItems.filter(f => f.is_active).length} ativa{faqItems.filter(f => f.is_active).length !== 1 ? "s" : ""} na landing page
          </p>
        </div>
        <div className="flex gap-2">
          {faqItems.length > 3 && (
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar FAQ…"
                className="pl-8 h-8 text-xs w-48"
              />
            </div>
          )}
          <Button size="sm" onClick={openNew} className="gap-2"><Plus className="w-4 h-4" />Nova Pergunta</Button>
        </div>
      </div>

      {faqItems.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="Nenhuma pergunta no FAQ"
          description="Adicione perguntas frequentes para exibir na landing page."
          action={<Button size="sm" onClick={openNew} className="gap-2"><Plus className="w-4 h-4" />Criar primeira pergunta</Button>}
        />
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filteredFaq.map((f, i) => (
              <MotionCard
                key={f.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`${!f.is_active ? "opacity-50" : ""}`}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-start gap-3">
                    <GripVertical className="w-4 h-4 text-muted-foreground/40 mt-0.5 shrink-0 cursor-grab" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-sm font-medium">{f.question}</p>
                        {f.category && (
                          <Badge variant="outline" className="text-[10px] font-normal">{f.category}</Badge>
                        )}
                        {!f.is_active && (
                          <Badge variant="secondary" className="text-[10px] gap-0.5"><EyeOff className="w-2.5 h-2.5" />Oculto</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{f.answer}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Switch checked={f.is_active} onCheckedChange={() => toggleActive(f)} />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(f)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onDelete({ type: "faq", id: f.id, label: f.question })}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </MotionCard>
            ))}
          </AnimatePresence>
          {searchTerm && filteredFaq.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Nenhum resultado para "<span className="font-medium text-foreground">{searchTerm}</span>"
            </div>
          )}
        </div>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar Pergunta" : "Nova Pergunta"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Pergunta *</Label>
                <Input className="mt-1" value={editing.question} onChange={(e) => setEditing({ ...editing, question: e.target.value })} />
              </div>
              <div>
                <Label>Resposta *</Label>
                <Textarea className="mt-1 resize-none min-h-[100px]" value={editing.answer} onChange={(e) => setEditing({ ...editing, answer: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Categoria</Label>
                  <Input className="mt-1" value={editing.category ?? ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} placeholder="geral" />
                </div>
                <div>
                  <Label>Ordem</Label>
                  <Input className="mt-1" type="number" min={1} value={editing.order_index} onChange={(e) => setEditing({ ...editing, order_index: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex items-center gap-2 py-2 px-3 rounded-lg border border-border/50 bg-muted/30">
                <Label className="font-normal text-sm flex-1">Ativo na landing</Label>
                <Switch checked={editing.is_active} onCheckedChange={(c) => setEditing({ ...editing, is_active: c })} />
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
