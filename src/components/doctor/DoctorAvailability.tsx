import { useState, useEffect } from "react";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getDoctorNav } from "./doctorNav";
import { Plus, Trash2, Clock, CalendarOff, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
    const { data } = await supabase
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
      toast.error("Perfil médico não encontrado", { description: "Atualize a página e tente novamente." });
      return;
    }
    setTogglingAvailability(true);
    try {
      const newVal = !availableNow;
      const { error } = await db.from("doctor_profiles").update({
        available_now: newVal,
        available_now_since: newVal ? new Date().toISOString() : null,
      }).eq("id", doctorProfileId);
      if (error) {
        toast.error("Erro ao atualizar disponibilidade", { description: error.message });
      } else {
        setAvailableNow(newVal);
        toast.success(newVal ? "🟢 Você está disponível para consultas imediatas!" : "Modo plantão desativado.");
      }
    } catch {
      toast.error("Erro inesperado");
    } finally {
      setTogglingAvailability(false);
    }
  };

  const fetchSlots = async (profileId: string) => {
    const { data } = await supabase
      .from("availability_slots")
      .select("*")
      .eq("doctor_id", profileId)
      .order("day_of_week")
      .order("start_time");
    if (data) setSlots(data.map(s => ({ ...s, is_active: s.is_active ?? true })));
  };

  const fetchAbsences = async (profileId: string) => {
    const { data } = await supabase
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

    // Check for overlapping slots
    const overlapping = slots.filter(s =>
      s.day_of_week === dayNum &&
      s.is_active &&
      newStart < s.end_time &&
      newEnd > s.start_time
    );
    if (overlapping.length > 0) {
      toast.error("Conflito de horário", { description: "Você já tem um slot neste período. Remova-o primeiro." });
      return;
    }

    const { error } = await db.from("availability_slots").insert({
      doctor_id: doctorProfileId,
      day_of_week: dayNum,
      start_time: newStart,
      end_time: newEnd,
    });
    if (error) {
      toast.error("Erro", { description: error.message });
    } else {
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
    if (error) {
      if (error.code === "23505") toast.error("Essa data já está marcada como folga");
      else toast.error("Erro", { description: error.message });
    } else {
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
      <div className="w-full mx-auto max-w-3xl pb-24 md:pb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">Disponibilidade</h1>
        <p className="text-muted-foreground mb-4">Configure os horários em que você atende</p>

        {/* On-duty toggle */}
        <Card className={`border-border mb-6 ${availableNow ? "ring-2 ring-secondary/30 bg-secondary/5" : ""}`}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${availableNow ? "bg-secondary/20" : "bg-muted"}`}>
                <Zap className={`w-5 h-5 ${availableNow ? "text-secondary" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">Disponível para Agora</p>
                <p className="text-xs text-muted-foreground">
                  {availableNow ? "Pacientes podem te encontrar para consulta imediata" : "Ative para aparecer em destaque"}
                </p>
              </div>
            </div>
            <Switch
              checked={availableNow}
              onCheckedChange={toggleAvailableNow}
              disabled={togglingAvailability}
            />
          </CardContent>
        </Card>

        {/* Add slot */}
        <Card className="border-border mb-6">
          <CardHeader><CardTitle className="text-base">Adicionar Horário</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs text-muted-foreground mb-1">Dia</p>
                <Select value={newDay} onValueChange={setNewDay}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map((d, i) => (
                      <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Início</p>
                <Select value={newStart} onValueChange={setNewStart}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {timeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Fim</p>
                <Select value={newEnd} onValueChange={setNewEnd}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {timeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addSlot} className="bg-gradient-hero text-primary-foreground h-11 col-span-2 sm:col-span-1">
                <Plus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Day-off / Absence management */}
        <Card className="border-border mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarOff className="w-4 h-4 text-destructive" /> Folgas e Ausências
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-3 items-end mb-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Data</p>
                <Input
                  type="date"
                  value={absenceDate}
                  onChange={e => setAbsenceDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="h-11"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Motivo (opcional)</p>
                <Input
                  placeholder="Ex: Feriado, Congresso..."
                  value={absenceReason}
                  onChange={e => setAbsenceReason(e.target.value)}
                  className="h-11"
                />
              </div>
              <Button onClick={addAbsence} variant="outline" className="gap-1 h-11 border-destructive/30 text-destructive hover:bg-destructive/10">
                <CalendarOff className="w-4 h-4" /> Marcar Folga
              </Button>
            </div>

            {absences.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {absences.map(a => (
                  <Badge key={a.id} variant="outline" className="flex items-center gap-2 py-1.5 px-3 border-destructive/20 text-destructive">
                    <CalendarOff className="w-3 h-3" />
                    {format(parseISO(a.absence_date), "dd/MM/yyyy", { locale: ptBR })}
                    {a.reason && <span className="text-muted-foreground font-normal">({a.reason})</span>}
                    <button onClick={() => removeAbsence(a.id)} className="ml-1 hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            {absences.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhuma folga registrada.</p>
            )}
          </CardContent>
        </Card>

        {/* Slots list */}
        <div className="space-y-4">
          {grouped.filter(g => g.slots.length > 0).map(g => (
            <Card key={g.index} className="border-border">
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground mb-3">{g.day}</h3>
                <div className="flex flex-wrap gap-2">
                  {g.slots.map(s => (
                    <Badge key={s.id} variant="secondary" className="flex items-center gap-2 py-1.5 px-3">
                      <Clock className="w-3 h-3" />
                      {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                      <button onClick={() => removeSlot(s.id)} className="ml-1 hover:text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {slots.length === 0 && !loading && (
            <Card className="border-border">
              <CardContent className="py-8 text-center">
                <Clock className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">Nenhum horário configurado ainda.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorAvailability;
