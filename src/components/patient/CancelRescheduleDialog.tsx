import { useState, useEffect } from "react";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import { notifyAppointmentCancelled, notifyAppointmentRescheduled } from "@/lib/notifications";
import { logError } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, X, RefreshCw, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";
import { format, setHours, setMinutes, differenceInHours, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CancelRescheduleDialogProps {
  appointmentId: string;
  doctorId?: string;
  currentDate: string;
  scheduledAt?: string;
  doctorName: string;
  onSuccess: () => void;
}

const CANCEL_REASONS = [
  "Problema de saúde imprevisto",
  "Conflito de agenda",
  "Problema financeiro",
  "Médico não disponível",
  "Outro motivo",
];

const CancelRescheduleDialog = ({ appointmentId, doctorId, currentDate, scheduledAt, doctorName, onSuccess }: CancelRescheduleDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"cancel" | "reschedule">("cancel");
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reschedule state
  const [newDate, setNewDate] = useState<Date | undefined>();
  const [newTime, setNewTime] = useState<string | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [slots, setSlots] = useState<{ day_of_week: number; start_time: string; end_time: string }[]>([]);

  // Calculate hours until appointment for cancellation window check
  const hoursUntil = scheduledAt ? differenceInHours(new Date(scheduledAt), new Date()) : 999;
  const isLateCancel = hoursUntil < 2;
  const isVeryLateCancel = hoursUntil < 1;

  // Check if within 15-day return window (free reschedule)
  const isWithinReturnWindow = scheduledAt ? differenceInHours(new Date(), new Date(scheduledAt)) < 15 * 24 : false;

  useEffect(() => {
    if (mode === "reschedule" && doctorId) {
      db.from("availability_slots").select("day_of_week, start_time, end_time")
        .eq("doctor_id", doctorId).eq("is_active", true)
        .then(({ data }) => setSlots(data ?? []));
    }
  }, [mode, doctorId]);

  useEffect(() => {
    if (!newDate || !doctorId) { setAvailableTimes([]); return; }
    const dayOfWeek = newDate.getDay();
    const daySlots = slots.filter(s => s.day_of_week === dayOfWeek);

    const fetchBooked = async () => {
      const dayStart = new Date(newDate); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(newDate); dayEnd.setHours(23, 59, 59, 999);
      const { data } = await db.from("appointments").select("scheduled_at")
        .eq("doctor_id", doctorId).gte("scheduled_at", dayStart.toISOString())
        .lte("scheduled_at", dayEnd.toISOString()).neq("status", "cancelled");
      const booked = data?.map(a => format(new Date(a.scheduled_at), "HH:mm")) ?? [];

      const times: string[] = [];
      daySlots.forEach(slot => {
        const [startH, startM] = slot.start_time.split(":").map(Number);
        const [endH, endM] = slot.end_time.split(":").map(Number);
        let h = startH, m = startM;
        while (h < endH || (h === endH && m < endM)) {
          const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          const slotDT = setMinutes(setHours(new Date(newDate), h), m);
          if (!booked.includes(timeStr) && !isBefore(slotDT, new Date())) times.push(timeStr);
          m += 30;
          if (m >= 60) { h++; m = 0; }
        }
      });
      setAvailableTimes(times);
    };
    fetchBooked();
  }, [newDate, doctorId, slots]);

  const handleCancel = async () => {
    const finalReason = reason === "Outro motivo" ? customReason.trim() : reason;
    if (!finalReason) { toast.error("Informe o motivo do cancelamento"); return; }

    if (isVeryLateCancel) {
      const confirmed = window.confirm("Cancelamentos com menos de 1h não são reembolsáveis. Deseja continuar?");
      if (!confirmed) return;
    }

    setSubmitting(true);
    const { error } = await db.from("appointments").update({
      status: "cancelled",
      cancelled_by: user!.id,
      cancel_reason: finalReason + (isLateCancel ? " [cancelamento tardio <2h]" : ""),
    }).eq("id", appointmentId);

    if (error) {
      toast.error("Erro ao cancelar consulta");
    } else {
      notifyAppointmentCancelled(appointmentId, "Paciente", finalReason).catch(err => logError("notifyAppointmentCancelled failed", err));
      toast.success("Consulta cancelada com sucesso");
      setOpen(false);
      onSuccess();
    }
    setSubmitting(false);
  };

  const handleReschedule = async () => {
    if (!newDate || !newTime || !doctorId || !user) return;
    setSubmitting(true);

    const [h, m] = newTime.split(":").map(Number);
    const newScheduledAt = setMinutes(setHours(new Date(newDate), h), m);

    // Cancel current appointment
    await db.from("appointments").update({
      status: "cancelled",
      cancelled_by: user.id,
      cancel_reason: "Reagendado pelo paciente",
    }).eq("id", appointmentId);

    // Create new appointment
    const { error } = await db.from("appointments").insert({
      patient_id: user.id,
      doctor_id: doctorId,
      scheduled_at: newScheduledAt.toISOString(),
      status: "scheduled",
      appointment_type: isWithinReturnWindow ? "return" : "first_visit",
      notes: `Reagendado de ${currentDate}`,
      original_appointment_id: appointmentId,
    });

    if (error) {
      toast.error("Erro ao reagendar consulta");
    } else {
      const newDateStr = format(newScheduledAt, "dd/MM/yyyy", { locale: ptBR });
      const newTimeStr = format(newScheduledAt, "HH:mm");
      notifyAppointmentRescheduled(appointmentId, newDateStr, newTimeStr)
        .catch(err => logError("notifyAppointmentRescheduled failed", err));
      toast.success(`Consulta reagendada para ${format(newScheduledAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`);
      setOpen(false);
      onSuccess();
    }
    setSubmitting(false);
  };

  const isDayAvailable = (date: Date): boolean => {
    if (isBefore(date, new Date()) && date.toDateString() !== new Date().toDateString()) return false;
    return slots.some(s => s.day_of_week === date.getDay());
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setMode("cancel"); setNewDate(undefined); setNewTime(null); } }}>
      <DialogTrigger asChild>
        <div className="flex gap-1.5">
          <Button size="sm" variant="ghost" className="text-xs h-7 text-destructive hover:bg-destructive/10 gap-1">
            <X className="w-3 h-3" /> Cancelar
          </Button>
          {doctorId && (
            <Button size="sm" variant="ghost" className="text-xs h-7 text-primary hover:bg-primary/10 gap-1" onClick={(e) => { e.stopPropagation(); setMode("reschedule"); setOpen(true); }}>
              <RefreshCw className="w-3 h-3" /> Reagendar
            </Button>
          )}
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "cancel" ? "Cancelar Consulta" : "Reagendar Consulta"}</DialogTitle>
        </DialogHeader>

        {/* Mode tabs */}
        {doctorId && (
          <div className="flex gap-2 mb-2">
            <Button size="sm" variant={mode === "cancel" ? "destructive" : "outline"} className="flex-1 text-xs" onClick={() => setMode("cancel")}>
              <X className="w-3 h-3 mr-1" /> Cancelar
            </Button>
            <Button size="sm" variant={mode === "reschedule" ? "default" : "outline"} className="flex-1 text-xs" onClick={() => setMode("reschedule")}>
              <RefreshCw className="w-3 h-3 mr-1" /> Reagendar
            </Button>
          </div>
        )}

        <div className="space-y-4 pt-2 pb-24 md:pb-6">
          <div className="p-3 rounded-lg bg-muted/50 text-sm">
            <p className="font-medium text-foreground">{doctorName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{currentDate}</p>
          </div>

          {mode === "cancel" ? (
            <>
              {isLateCancel && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <p className="text-xs text-warning">
                    {isVeryLateCancel
                      ? "Cancelamento com menos de 1h de antecedência. Este cancelamento NÃO é reembolsável."
                      : "Cancelamento com menos de 2h de antecedência pode estar sujeito a cobrança."}
                  </p>
                </div>
              )}

              <div>
                <Label className="text-sm">Motivo do cancelamento *</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecione o motivo" /></SelectTrigger>
                  <SelectContent>
                    {CANCEL_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {reason === "Outro motivo" && (
                <div>
                  <Label className="text-sm">Descreva o motivo</Label>
                  <Textarea value={customReason} onChange={e => setCustomReason(e.target.value)} placeholder="Descreva o motivo..." rows={3} className="mt-1.5" />
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Voltar</Button>
                <Button variant="destructive" className="flex-1" onClick={handleCancel} disabled={submitting || !reason}>
                  {submitting ? "Cancelando..." : "Confirmar Cancelamento"}
                </Button>
              </div>
            </>
          ) : (
            <>
              {isWithinReturnWindow && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/10 border border-secondary/20">
                  <Clock className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                  <p className="text-xs text-secondary">Reagendamento dentro do período de retorno (15 dias) — sem custo adicional.</p>
                </div>
              )}

              <div>
                <Label className="text-sm mb-2 block">Nova data</Label>
                <Calendar
                  mode="single"
                  selected={newDate}
                  onSelect={(d) => { setNewDate(d); setNewTime(null); }}
                  disabled={(date) => !isDayAvailable(date)}
                  fromDate={new Date()}
                  toDate={addDays(new Date(), 60)}
                  locale={ptBR}
                  className="pointer-events-auto mx-auto"
                />
              </div>

              {newDate && (
                <div>
                  <Label className="text-sm mb-2 block">Novo horário</Label>
                  {availableTimes.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Sem horários disponíveis nesta data</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {availableTimes.map(t => (
                        <Button key={t} size="sm" variant={newTime === t ? "default" : "outline"} className="text-xs" onClick={() => setNewTime(t)}>
                          {t}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Voltar</Button>
                <Button className="flex-1 bg-gradient-hero text-primary-foreground" onClick={handleReschedule} disabled={submitting || !newDate || !newTime}>
                  {submitting ? "Reagendando..." : "Confirmar Reagendamento"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CancelRescheduleDialog;
