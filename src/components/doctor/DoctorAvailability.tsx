import { useState, useEffect } from "react";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getDoctorNav } from "./doctorNav";
import { Plus, Trash2, Clock, CalendarOff, Zap, CalendarDays } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const daysOfWeek = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const timeOptions = Array.from({ length: 28 }, (_, i) => {
  const h = Math.floor(i / 2) + 7;
  const m = (i % 2) * 30;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

interface Slot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface Absence {
  id: string;
  absence_date: string;
  reason: string | null;
}

const DoctorAvailability = () => {
  const { user } = useAuth();
  const [doctorProfileId, setDoctorProfileId] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [newDay, setNewDay] = useState("1");
  const [newStart, setNewStart] = useState("08:00");
  const [newEnd, setNewEnd] = useState("12:00");
  const [absenceDate, setAbsenceDate] = useState("");
  const [absenceReason, setAbsenceReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [availableNow, setAvailableNow] = useState(false);
  const [togglingAvailability, setTogglingAvailability] = useState(false);

  useEffect(() => { if (user) fetchDoctorProfile(); }, [user]);

  const fetchDoctorProfile = async () => {
    const { data } = await db
      .from("doctor_profiles")
      .select("id, available_now")
      .eq("user_id", user!.id)
      .single();

    if (data) {
      setDoctorProfileId(data.id);
      setAvailableNow(data.available_now ?? false);
      fetchSlots(data.id);
      fetchAbsences(data.id);
    }
    setLoading(false);
  };

  const toggleAvailableNow = async () => {
    if (!doctorProfileId) {
      toast.error("Perfil médico não encontrado");
      return;
    }
    setTogglingAvailability(true);
    try {
      const newVal = !availableNow;
      const { error } = await db.from("doctor_profiles").update({
        available_now: newVal,
        available_now_since: newVal ? new Date().toISOString() : null,
      } as any).eq("id", doctorProfileId);
      if (error) {
        toast.error("Erro ao atualizar disponibilidade");
      } else {
        setAvailableNow(newVal);
        toast.success(newVal ? "🟢 Online para consultas imediatas!" : "Modo plantão desativado.");
      }
    } catch {
      toast.error("Erro inesperado");
    } finally {
      setTogglingAvailability(false);
    }
  };

  const fetchSlots = async (profileId: string) => {
    const { data } = await db
      .from("availability_slots")
      .select("*")
      .eq("doctor_id", profileId)
      .order("day_of_week")
      .order("start_time");
    if (data) setSlots(data.map(s => ({ ...s, is_active: s.is_active ?? true })));
  };

  const fetchAbsences = async (profileId: string) => {
    const { data } = await db
      .from("doctor_absences")
      .select("*")
      .eq("doctor_id", profileId)
      .gte("absence_date", new Date().toISOString().split("T")[0])
      .order("absence_date");
    if (data) setAbsences(data);
  };

  const addSlot = async () => {
    if (!doctorProfileId) return;
    const dayNum = parseInt(newDay);
    const overlapping = slots.filter(s =>
      s.day_of_week === dayNum &&
      s.is_active &&
      newStart < s.end_time &&
      newEnd > s.start_time
    );
    if (overlapping.length > 0) {
      toast.error("Conflito de horário");
      return;
    }
    const { error } = await db.from("availability_slots").insert({
      doctor_id: doctorProfileId,
      day_of_week: dayNum,
      start_time: newStart,
      end_time: newEnd,
    });
    if (error) toast.error("Erro ao adicionar");
    else {
      toast.success("Horário adicionado!");
      fetchSlots(doctorProfileId);
    }
  };

  const removeSlot = async (id: string) => {
    await db.from("availability_slots").delete().eq("id", id);
    if (doctorProfileId) fetchSlots(doctorProfileId);
  };

  const addAbsence = async () => {
    if (!doctorProfileId || !absenceDate) return;
    const { error } = await db.from("doctor_absences").insert({
      doctor_id: doctorProfileId,
      absence_date: absenceDate,
      reason: absenceReason.trim() || null,
    });
    if (error) toast.error("Erro ao registrar folga");
    else {
      toast.success("Folga registrada!");
      setAbsenceDate("");
      setAbsenceReason("");
      fetchAbsences(doctorProfileId);
    }
  };

  const removeAbsence = async (id: string) => {
    await db.from("doctor_absences").delete().eq("id", id);
    if (doctorProfileId) fetchAbsences(doctorProfileId);
  };

  const grouped = daysOfWeek.map((day, i) => ({
    day,
    index: i,
    slots: slots.filter(s => s.day_of_week === i),
  }));

  return (
    <DashboardLayout title="Médico" nav={getDoctorNav("availability")}>
      <div className="w-full mx-auto max-w-4xl space-y-6 pb-24 md:pb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black tracking-tight text-foreground">Disponibilidade</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-0.5">Gestão de Agenda</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden rounded-[28px] border p-6 transition-all ${availableNow ? "border-emerald-500/20 bg-emerald-500/5 shadow-[0_8px_30px_rgba(16,185,129,0.1)]" : "border-border/40 bg-card/60"}`}
        >
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-transform ${availableNow ? "bg-emerald-100 border-emerald-200 text-emerald-600 scale-110" : "bg-muted border-border/50 text-muted-foreground"}`}>
                <Zap className={`w-6 h-6 ${availableNow ? "fill-current" : ""}`} />
              </div>
              <div>
                <p className="font-black text-foreground text-[15px]">Disponível para Agora</p>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-[240px]">
                  {availableNow ? "Você está visível para consultas imediatas." : "Ative para ser listado no plantão 24h."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-black uppercase tracking-widest ${availableNow ? "text-emerald-600" : "text-muted-foreground"}`}>
                {availableNow ? "ATIVO" : "OFFLINE"}
              </span>
              <Switch checked={availableNow} onCheckedChange={toggleAvailableNow} disabled={togglingAvailability} className="data-[state=checked]:bg-emerald-500" />
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-border/40 bg-card/60 backdrop-blur-sm p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 mb-5 px-1 flex items-center gap-2">
                <Clock className="w-3 h-3" /> Adicionar Horário Semanal
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-end">
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-[11px] font-bold text-muted-foreground px-1 mb-1.5 block">DIA</label>
                  <Select value={newDay} onValueChange={setNewDay}>
                    <SelectTrigger className="h-12 rounded-2xl border-border/50 bg-muted/30"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {daysOfWeek.map((d, i) => (
                        <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground px-1 mb-1.5 block">INÍCIO</label>
                  <Select value={newStart} onValueChange={setNewStart}>
                    <SelectTrigger className="h-12 rounded-2xl border-border/50 bg-muted/30"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-2xl">{timeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground px-1 mb-1.5 block">FIM</label>
                  <Select value={newEnd} onValueChange={setNewEnd}>
                    <SelectTrigger className="h-12 rounded-2xl border-border/50 bg-muted/30"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-2xl">{timeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button onClick={addSlot} className="h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] col-span-2 sm:col-span-1 shadow-lg shadow-emerald-500/20">
                  <Plus className="w-4 h-4 mr-1" /> ADICIONAR
                </Button>
              </div>
            </div>

            <div className="rounded-[28px] border border-border/40 bg-card/60 backdrop-blur-sm p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 mb-5 px-1 flex items-center gap-2">
                <CalendarOff className="w-3 h-3 text-destructive" /> Folgas e Ausências
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-4 items-end mb-6">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground px-1 mb-1.5 block uppercase">DATA</label>
                  <Input type="date" value={absenceDate} onChange={e => setAbsenceDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="h-12 rounded-2xl border-border/50 bg-muted/30" />
                </div>
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-muted-foreground px-1 mb-1.5 block uppercase">MOTIVO</label>
                  <Input placeholder="Ex: Feriado..." value={absenceReason} onChange={e => setAbsenceReason(e.target.value)} className="h-12 rounded-2xl border-border/50 bg-muted/30" />
                </div>
                <Button onClick={addAbsence} variant="outline" className="h-12 rounded-2xl border-destructive/30 text-destructive hover:bg-destructive/10 font-bold text-[11px] px-6 gap-2">
                  <CalendarOff className="w-4 h-4" /> MARCAR FOLGA
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {absences.map((a) => (
                    <motion.div key={a.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex items-center gap-2 py-1.5 px-3.5 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive text-[11px] font-bold">
                      <CalendarOff className="w-3 h-3" />
                      {format(parseISO(a.absence_date), "dd MMM", { locale: ptBR })}
                      <button onClick={() => removeAbsence(a.id)} className="ml-1 hover:scale-125 transition-transform"><Trash2 className="w-3 h-3" /></button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 px-1 flex items-center gap-2"><CalendarDays className="w-3 h-3" /> Horários Ativos</p>
            <AnimatePresence mode="popLayout">
              {grouped.filter(g => g.slots.length > 0).map((g, gi) => (
                <motion.div key={g.index} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: gi * 0.05 }} className="rounded-[24px] border border-border/40 bg-card/60 backdrop-blur-sm p-5 shadow-sm">
                  <h3 className="text-[12px] font-black text-foreground uppercase tracking-widest mb-4 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{g.day}</h3>
                  <div className="flex flex-wrap gap-2">
                    {g.slots.map(s => (
                      <div key={s.id} className="group flex items-center gap-2 py-1.5 px-3.5 rounded-xl border border-emerald-500/10 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 text-[11px] font-black shadow-sm">
                        <Clock className="w-3 h-3 opacity-60" />{s.start_time.slice(0, 5)} — {s.end_time.slice(0, 5)}
                        <button onClick={() => removeSlot(s.id)} className="ml-1 opacity-0 group-hover:opacity-100 hover:text-destructive hover:scale-125 transition-all"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorAvailability;
