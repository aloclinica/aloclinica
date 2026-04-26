import { memo } from "react";
import { motion } from "framer-motion";
import { Clock, Video, Radio, Users, ChevronRight, Power } from "lucide-react";
import { format, differenceInMinutes, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NextAppt {
  id: string;
  patient_name: string;
  scheduled_at: string;
  duration_minutes: number | null;
}

interface Props {
  isOnline: boolean;
  onlineLoading: boolean;
  onToggleOnline: () => void;
  waitingCount: number;
  nextAppt?: NextAppt;
  onEnterRoom: (id: string) => void;
  onSeeQueue: () => void;
}

const DoctorCommandCenter = memo(({
  isOnline, onlineLoading, onToggleOnline,
  waitingCount, nextAppt, onEnterRoom, onSeeQueue,
}: Props) => {
  const minutesUntil = nextAppt ? differenceInMinutes(new Date(nextAppt.scheduled_at), new Date()) : 0;
  const hoursUntil = nextAppt ? differenceInHours(new Date(nextAppt.scheduled_at), new Date()) : 0;
  const countdown = nextAppt
    ? minutesUntil < 0 ? "Agora" : minutesUntil < 60 ? `${minutesUntil}min` : `${hoursUntil}h`
    : "—";
  const imminent = minutesUntil >= 0 && minutesUntil <= 15;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-border/30 bg-card shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)]"
    >
      {/* Animated background accent */}
      <div className={cn(
        "absolute inset-0 opacity-[0.04] pointer-events-none",
        isOnline ? "bg-emerald-500" : "bg-muted-foreground"
      )} />
      <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="relative grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/20">

        {/* Plantão Status */}
        <div className="p-4 md:p-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors",
              isOnline
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-muted text-muted-foreground"
            )}>
              <Power className="h-4 w-4" />
              {isOnline && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-500 animate-pulse ring-2 ring-card" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Plantão</p>
              <p className="font-bold text-sm text-foreground truncate">
                {isOnline ? "Online — recebendo" : "Offline"}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={onToggleOnline}
            disabled={onlineLoading}
            variant={isOnline ? "default" : "outline"}
            className={cn(
              "h-8 rounded-full px-3 text-[11px] font-bold shrink-0",
              isOnline && "bg-emerald-600 hover:bg-emerald-700 text-white"
            )}
          >
            {onlineLoading ? "..." : isOnline ? "Ativo" : "Ativar"}
          </Button>
        </div>

        {/* Próxima Consulta */}
        <div className="p-4 md:p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className={cn(
              "h-7 w-7 rounded-lg flex items-center justify-center",
              imminent ? "bg-amber-500/15 text-amber-600" : "bg-primary/10 text-primary"
            )}>
              <Clock className="h-3.5 w-3.5" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {imminent ? "Em breve" : "Próxima"}
            </p>
          </div>
          {nextAppt ? (
            <>
              <p className="font-bold text-sm text-foreground truncate">{nextAppt.patient_name}</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className={cn(
                  "text-lg font-extrabold tabular-nums leading-none",
                  imminent ? "text-amber-600 dark:text-amber-400" : "text-primary"
                )}>{countdown}</span>
                <span className="text-[11px] text-muted-foreground">
                  · {format(new Date(nextAppt.scheduled_at), "HH:mm", { locale: ptBR })}
                </span>
              </div>
              <Button
                size="sm"
                onClick={() => onEnterRoom(nextAppt.id)}
                className={cn(
                  "mt-2.5 h-8 rounded-xl px-3 text-[11px] font-bold w-full md:w-auto",
                  imminent
                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                )}
              >
                <Video className="h-3.5 w-3.5 mr-1.5" /> Sala
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-foreground">Sem próximas</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Agenda livre por enquanto</p>
            </>
          )}
        </div>

        {/* Fila ao vivo */}
        <button
          onClick={onSeeQueue}
          className={cn(
            "p-4 md:p-5 text-left transition-colors group",
            waitingCount > 0 ? "hover:bg-emerald-500/5" : "hover:bg-muted/30"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={cn(
              "h-7 w-7 rounded-lg flex items-center justify-center",
              waitingCount > 0
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-muted text-muted-foreground"
            )}>
              <Radio className={cn("h-3.5 w-3.5", waitingCount > 0 && "animate-pulse")} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Fila ao vivo</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className={cn(
                  "text-2xl font-extrabold tabular-nums leading-none",
                  waitingCount > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                )}>{waitingCount}</span>
                <span className="text-[11px] text-muted-foreground">aguardando</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {waitingCount > 0 ? "Toque para chamar" : "Tudo em dia"}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>
      </div>
    </motion.div>
  );
});

DoctorCommandCenter.displayName = "DoctorCommandCenter";
export default DoctorCommandCenter;