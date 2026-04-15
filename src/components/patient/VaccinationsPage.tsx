import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getPatientNav } from "./patientNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Syringe, Plus, CalendarCheck, Warning, Check } from "@phosphor-icons/react";
import { format, isPast, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface VaccRecord {
  id: string;
  vaccine_name: string;
  dose?: string;
  date_given: string;
  next_dose_date?: string;
  lot_number?: string;
  location?: string;
  created_at: string;
}

const COMMON_VACCINES = [
  "COVID-19 (bivalente)", "Influenza (gripe)", "Tétano (dTpa)", "Febre Amarela",
  "Hepatite A", "Hepatite B", "HPV", "Pneumocócica 23-valente", "Varicela",
  "Sarampo/Rubéola/Caxumba (SCR)", "Dengue (Dengvaxia)", "Herpes Zóster (Shingrix)",
];

export default function VaccinationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ vaccine_name: "", dose: "", date_given: "", next_dose_date: "", lot_number: "", location: "" });
  const [saving, setSaving] = useState(false);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["vaccinations", user?.id],
    queryFn: async () => {
      const { data } = await db.from("vaccination_records" as any).select("*").eq("patient_id", user!.id).order("date_given", { ascending: false });
      return (data ?? []) as unknown as VaccRecord[];
    },
    enabled: !!user,
  });

  const upcoming = records.filter(r => r.next_dose_date && !isPast(new Date(r.next_dose_date)));
  const overdue = records.filter(r => r.next_dose_date && isPast(new Date(r.next_dose_date)));

  const save = async () => {
    if (!form.vaccine_name || !form.date_given) { toast.error("Preencha vacina e data"); return; }
    setSaving(true);
    const { error } = await db.from("vaccination_records" as any).insert({
      patient_id: user!.id,
      vaccine_name: form.vaccine_name,
      dose: form.dose || null,
      date_given: form.date_given,
      next_dose_date: form.next_dose_date || null,
      lot_number: form.lot_number || null,
      location: form.location || null,
    });
    if (error) { toast.error("Erro ao salvar"); } else {
      toast.success("Vacina registrada!");
      qc.invalidateQueries({ queryKey: ["vaccinations"] });
      setShowAdd(false);
      setForm({ vaccine_name: "", dose: "", date_given: "", next_dose_date: "", lot_number: "", location: "" });
    }
    setSaving(false);
  };

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("vaccinations")}>
      <div className="max-w-2xl mx-auto pb-24 md:pb-8 space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Syringe size={24} weight="fill" className="text-violet-500" /> Carteira de Vacinação
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Histórico e próximas doses</p>
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1.5">
            <Plus size={14} weight="bold" /> Adicionar
          </Button>
        </div>

        {/* Alerts */}
        {overdue.length > 0 && (
          <div className="rounded-2xl border border-red-200 bg-red-50/60 dark:bg-red-950/20 p-4 flex items-start gap-3">
            <Warning size={18} weight="fill" className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-700 dark:text-red-400">{overdue.length} dose(s) em atraso</p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {overdue.map(r => (
                  <Badge key={r.id} className="bg-red-100 text-red-700 border-red-200 text-[11px]">{r.vaccine_name}</Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 p-4 flex items-start gap-3">
            <CalendarCheck size={18} weight="fill" className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Próximas doses programadas</p>
              <div className="space-y-1 mt-1.5">
                {upcoming.map(r => (
                  <p key={r.id} className="text-xs text-amber-700 dark:text-amber-400">
                    {r.vaccine_name} · {format(new Date(r.next_dose_date!), "dd/MM/yyyy")}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl bg-muted/40 animate-pulse" />)}
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-border bg-muted/20">
            <Syringe size={48} weight="light" className="text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-sm font-semibold text-foreground">Nenhuma vacina registrada</p>
            <p className="text-xs text-muted-foreground mt-1">Adicione suas vacinas para manter o histórico atualizado.</p>
            <Button size="sm" className="mt-4" onClick={() => setShowAdd(true)}>
              <Plus size={14} className="mr-1.5" /> Adicionar vacina
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card"
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  r.next_dose_date && isPast(new Date(r.next_dose_date)) ? "bg-red-50 dark:bg-red-950/30" : "bg-violet-50 dark:bg-violet-950/30"
                )}>
                  <Syringe size={18} weight="fill" className={r.next_dose_date && isPast(new Date(r.next_dose_date)) ? "text-red-500" : "text-violet-500"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{r.vaccine_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.dose && `${r.dose} · `}
                    {format(new Date(r.date_given), "dd/MM/yyyy")}
                    {r.location && ` · ${r.location}`}
                  </p>
                </div>
                {r.next_dose_date && (
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-muted-foreground">Próxima dose</p>
                    <p className={cn("text-xs font-semibold", isPast(new Date(r.next_dose_date)) ? "text-red-500" : "text-foreground")}>
                      {format(new Date(r.next_dose_date), "dd/MM/yy")}
                    </p>
                  </div>
                )}
                {!r.next_dose_date && (
                  <Check size={16} weight="bold" className="text-emerald-500 shrink-0" />
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Syringe size={18} weight="fill" className="text-violet-500" /> Registrar Vacina
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Vacina *</Label>
              <Input
                list="vaccine-list"
                placeholder="Nome da vacina"
                value={form.vaccine_name}
                onChange={e => setForm(f => ({ ...f, vaccine_name: e.target.value }))}
              />
              <datalist id="vaccine-list">
                {COMMON_VACCINES.map(v => <option key={v} value={v} />)}
              </datalist>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Dose</Label>
                <Input placeholder="Ex: 1ª dose, Reforço" value={form.dose} onChange={e => setForm(f => ({ ...f, dose: e.target.value }))} />
              </div>
              <div>
                <Label>Data de aplicação *</Label>
                <Input type="date" value={form.date_given} onChange={e => setForm(f => ({ ...f, date_given: e.target.value }))} />
              </div>
              <div>
                <Label>Próxima dose</Label>
                <Input type="date" value={form.next_dose_date} onChange={e => setForm(f => ({ ...f, next_dose_date: e.target.value }))} />
              </div>
              <div>
                <Label>Lote</Label>
                <Input placeholder="Nº do lote" value={form.lot_number} onChange={e => setForm(f => ({ ...f, lot_number: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Local de aplicação</Label>
              <Input placeholder="Ex: UBS, Hospital, Clínica" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <Button onClick={save} disabled={saving} className="w-full">
              {saving ? "Salvando..." : "Registrar Vacina"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
