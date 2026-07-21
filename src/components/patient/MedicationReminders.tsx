import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getPatientNav } from "./patientNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { logError } from "@/lib/logger";
import { Pill, Plus, Trash2, Clock } from "lucide-react";

interface Reminder {
  id: string;
  medication_name: string;
  dosage: string | null;
  times: string[];
  active: boolean;
}

const parseTimes = (raw: string): string[] =>
  raw.split(/[,;\s]+/).map((t) => t.trim()).filter((t) => /^([01]?\d|2[0-3]):[0-5]\d$/.test(t));

const MedicationReminders = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [timesRaw, setTimesRaw] = useState("08:00, 20:00");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await (db as any)
      .from("medication_reminders")
      .select("id, medication_name, dosage, times, active")
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false });
    setReminders((data ?? []).map((r: any) => ({ ...r, times: Array.isArray(r.times) ? r.times : [] })));
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!user) return;
    if (!name.trim()) { toast.error("Informe o nome do medicamento"); return; }
    const times = parseTimes(timesRaw);
    if (times.length === 0) { toast.error("Informe ao menos um horário (ex.: 08:00, 20:00)"); return; }
    setSaving(true);
    try {
      const { error } = await (db as any).from("medication_reminders").insert({
        patient_id: user.id, medication_name: name.trim(), dosage: dosage.trim() || null, times, active: true,
      });
      if (error) throw error;
      setName(""); setDosage(""); setTimesRaw("08:00, 20:00");
      toast.success("Lembrete criado! Você será avisado nos horários.");
      load();
    } catch (e) {
      logError("add medication reminder", e);
      toast.error("Erro ao criar lembrete");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (r: Reminder) => {
    await (db as any).from("medication_reminders").update({ active: !r.active, updated_at: new Date().toISOString() }).eq("id", r.id);
    setReminders((prev) => prev.map((x) => (x.id === r.id ? { ...x, active: !x.active } : x)));
  };

  const remove = async (id: string) => {
    await (db as any).from("medication_reminders").delete().eq("id", id);
    setReminders((prev) => prev.filter((x) => x.id !== id));
    toast.success("Lembrete removido");
  };

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("medication")}>
      <div className="w-full max-w-2xl mx-auto pb-24 md:pb-6 space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Pill className="w-5 h-5 text-primary" /> Lembretes de Medicação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Medicamento</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Losartana 50mg" className="mt-1" />
              </div>
              <div>
                <Label>Dose (opcional)</Label>
                <Input value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="Ex.: 1 comprimido" className="mt-1" />
              </div>
              <div>
                <Label>Horários</Label>
                <Input value={timesRaw} onChange={(e) => setTimesRaw(e.target.value)} placeholder="08:00, 20:00" className="mt-1" />
              </div>
            </div>
            <Button onClick={add} disabled={saving} className="w-full rounded-xl gap-2 font-bold">
              <Plus className="w-4 h-4" /> Adicionar lembrete
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Carregando…</p>
          ) : reminders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum lembrete ainda. Adicione seus medicamentos acima.</p>
          ) : (
            reminders.map((r) => (
              <Card key={r.id} className={r.active ? "" : "opacity-60"}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Pill className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{r.medication_name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> {r.times.join(" · ")}{r.dosage ? ` — ${r.dosage}` : ""}
                    </p>
                  </div>
                  <Switch checked={r.active} onCheckedChange={() => toggle(r)} aria-label="Ativar/desativar" />
                  <Button variant="ghost" size="icon" onClick={() => remove(r.id)} aria-label="Remover">
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        <p className="text-[11px] text-muted-foreground text-center">
          Os avisos chegam como notificação no app. Ative as notificações do navegador/app para não perder.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default MedicationReminders;
