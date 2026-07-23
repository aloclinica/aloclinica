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
import { Pill, Plus, Trash2, Clock, Check, X, Flame, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Reminder {
  id: string;
  medication_name: string;
  dosage: string | null;
  times: string[];
  active: boolean;
}

interface RxOption {
  id: string;
  diagnosis: string | null;
  medications: unknown;
  created_at: string;
}

// Registro de adesão por dose: "taken" | "skipped". Persistido em localStorage (não há tabela de adesão no schema).
type DayStatus = "taken" | "skipped";
type AdherenceMap = Record<string, Record<string, DayStatus>>; // reminderId -> { "YYYY-MM-DD": status }

const adherenceKey = (userId: string) => `aloclinica:med-adherence:${userId}`;
const todayStr = () => new Date().toISOString().slice(0, 10);

const parseTimes = (raw: string): string[] =>
  raw.split(/[,;\s]+/).map((t) => t.trim()).filter((t) => /^([01]?\d|2[0-3]):[0-5]\d$/.test(t));

// Deriva horários padrão a partir da posologia da receita (ex.: "8/8h", "2x ao dia").
const timesFromFrequency = (freq: string): string[] => {
  const f = (freq || "").toLowerCase();
  if (/6\s*\/\s*6|4\s*x/.test(f)) return ["06:00", "12:00", "18:00", "00:00"];
  if (/8\s*\/\s*8|3\s*x/.test(f)) return ["06:00", "14:00", "22:00"];
  if (/12\s*\/\s*12|2\s*x/.test(f)) return ["08:00", "20:00"];
  return ["08:00"];
};

// Streak = dias consecutivos com "taken" terminando hoje (ou ontem, se ainda não registrou hoje).
const computeStreak = (days: Record<string, DayStatus> | undefined): number => {
  if (!days) return 0;
  let streak = 0;
  const cursor = new Date();
  if (days[todayStr()] !== "taken") cursor.setDate(cursor.getDate() - 1);
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (days[key] === "taken") { streak++; cursor.setDate(cursor.getDate() - 1); } else break;
  }
  return streak;
};

const MedicationReminders = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [timesRaw, setTimesRaw] = useState("08:00, 20:00");
  const [saving, setSaving] = useState(false);
  const [adherence, setAdherence] = useState<AdherenceMap>({});
  const [prescriptions, setPrescriptions] = useState<RxOption[]>([]);
  const [rxPickerOpen, setRxPickerOpen] = useState(false);
  const [creatingFrom, setCreatingFrom] = useState<string | null>(null);

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

  const loadPrescriptions = useCallback(async () => {
    if (!user) return;
    const { data } = await (db as any)
      .from("prescriptions")
      .select("id, diagnosis, medications, created_at")
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false });
    const withMeds = (data ?? []).filter((p: any) => Array.isArray(p.medications) && p.medications.length > 0);
    setPrescriptions(withMeds);
  }, [user]);

  useEffect(() => { load(); loadPrescriptions(); }, [load, loadPrescriptions]);

  // Carrega o histórico de adesão do localStorage (sem tabela dedicada no schema).
  useEffect(() => {
    if (!user) return;
    try { setAdherence(JSON.parse(localStorage.getItem(adherenceKey(user.id)) || "{}")); }
    catch { setAdherence({}); }
  }, [user]);

  const logAdherence = (reminderId: string, status: DayStatus) => {
    if (!user) return;
    const date = todayStr();
    setAdherence((prev) => {
      const current = prev[reminderId]?.[date];
      const dayMap = { ...(prev[reminderId] || {}) };
      if (current === status) delete dayMap[date]; // toca de novo no mesmo status = desmarca
      else dayMap[date] = status;
      const next = { ...prev, [reminderId]: dayMap };
      try { localStorage.setItem(adherenceKey(user.id), JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

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

  const createFromPrescription = async (rx: RxOption) => {
    if (!user) return;
    const meds = Array.isArray(rx.medications) ? rx.medications : [];
    const rows = meds.map((m: any) => {
      const medName = (typeof m === "string" ? m : (m?.name || m?.medication || "")).trim();
      if (!medName) return null;
      const dosageParts = typeof m === "string" ? [] : [m?.dosage, m?.frequency].filter(Boolean);
      return {
        patient_id: user.id,
        medication_name: medName,
        dosage: dosageParts.join(" · ") || null,
        times: timesFromFrequency(typeof m === "string" ? "" : (m?.frequency || "")),
        active: true,
      };
    }).filter(Boolean);
    if (rows.length === 0) { toast.error("Esta receita não tem medicamentos para criar lembretes."); return; }
    setCreatingFrom(rx.id);
    try {
      const { error } = await (db as any).from("medication_reminders").insert(rows);
      if (error) throw error;
      toast.success(`${rows.length} lembrete(s) criado(s) a partir da receita`, { description: "Ajuste os horários se necessário." });
      setRxPickerOpen(false);
      load();
    } catch (e) {
      logError("create reminders from prescription", e);
      toast.error("Erro ao criar lembretes a partir da receita");
    } finally {
      setCreatingFrom(null);
    }
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

        {/* Criar lembretes a partir de uma receita emitida */}
        {prescriptions.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <Button
                variant="outline"
                onClick={() => setRxPickerOpen((v) => !v)}
                className="w-full justify-between rounded-xl"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Criar a partir de uma receita
                </span>
                {rxPickerOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
              {rxPickerOpen && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Escolha uma receita para gerar os lembretes automaticamente.</p>
                  {prescriptions.map((rx) => {
                    const meds = Array.isArray(rx.medications) ? rx.medications : [];
                    const medNames = meds
                      .map((m: any) => (typeof m === "string" ? m : (m?.name || m?.medication || "")))
                      .filter(Boolean);
                    return (
                      <div key={rx.id} className="flex items-center gap-3 p-3 border border-border rounded-xl">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{rx.diagnosis || "Receita médica"}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {format(new Date(rx.created_at), "dd/MM/yyyy", { locale: ptBR })} · {medNames.join(", ") || "sem medicamentos"}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => createFromPrescription(rx)}
                          disabled={creatingFrom === rx.id}
                          className="rounded-lg shrink-0"
                        >
                          {creatingFrom === rx.id ? "Criando…" : "Usar"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Carregando…</p>
          ) : reminders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum lembrete ainda. Adicione seus medicamentos acima.</p>
          ) : (
            reminders.map((r) => {
              const days = adherence[r.id];
              const todayStatus = days?.[todayStr()];
              const takenCount = Object.values(days || {}).filter((s) => s === "taken").length;
              const streak = computeStreak(days);
              return (
              <Card key={r.id} className={r.active ? "" : "opacity-60"}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
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
                  </div>

                  {r.active && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/60">
                      <Button
                        size="sm"
                        variant={todayStatus === "taken" ? "default" : "outline"}
                        onClick={() => logAdherence(r.id, "taken")}
                        className="rounded-lg gap-1 h-8"
                      >
                        <Check className="w-3.5 h-3.5" /> Tomei
                      </Button>
                      <Button
                        size="sm"
                        variant={todayStatus === "skipped" ? "secondary" : "outline"}
                        onClick={() => logAdherence(r.id, "skipped")}
                        className="rounded-lg gap-1 h-8"
                      >
                        <X className="w-3.5 h-3.5" /> Pulei
                      </Button>
                      {(streak > 0 || takenCount > 0) && (
                        <span className="text-[11px] text-muted-foreground ml-auto flex items-center gap-1">
                          {streak > 0 && <span className="flex items-center gap-0.5 text-orange-500 font-medium"><Flame className="w-3 h-3" />{streak}d</span>}
                          {streak > 0 && takenCount > 0 && "·"}
                          {takenCount > 0 && `${takenCount} ${takenCount === 1 ? "dose" : "doses"}`}
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              );
            })
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
