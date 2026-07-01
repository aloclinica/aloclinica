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
      className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-[0_28px_72px_-34px_rgba(15,23,42,0.86),inset_0_1px_1px_rgba(255,255,255,0.08)] text-white"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className={cn(
          "absolute inset-0 transition-colors duration-700",
          isOnline
            ? "bg-[linear-gradient(120deg,rgba(16,185,129,0.16)_0%,transparent_36%,rgba(34,211,238,0.12)_100%)]"
            : "bg-[linear-gradient(120deg,rgba(148,163,184,0.12)_0%,transparent_44%,rgba(51,65,85,0.16)_100%)]"
        )} />
        <motion.div
          className="absolute inset-y-0 -left-1/3 w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/8 to-transparent blur-sm"
          animate={{ x: ["0%", "285%"] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
      </div>
      {/* grid overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
      {/* top live bar */}
      <div className="relative flex items-center gap-2 px-4 py-2.5 border-b border-white/10 bg-white/[0.03] md:px-5">
        <span className="relative flex h-2 w-2">
          <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", isOnline ? "bg-emerald-400" : "bg-slate-500")} />
          <span className={cn("relative inline-flex h-2 w-2 rounded-full", isOnline ? "bg-emerald-400" : "bg-slate-400")} />
        </span>
        <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/80">Command Center</span>
        <span className="ml-auto text-[10px] font-bold text-white/60 tabular-nums">{format(new Date(), "HH:mm")}</span>
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">

        {/* Plantão Status */}
        <div className="p-4 md:p-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all backdrop-blur-md ring-1 md:h-12 md:w-12",
              isOnline
                ? "bg-emerald-500/20 text-emerald-300 ring-emerald-400/30 shadow-[0_0_24px_-4px_rgba(16,185,129,0.6)]"
                : "bg-white/5 text-white/60 ring-white/10"
            )}>
              <Power className="h-5 w-5" />
              {isOnline && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-400 animate-pulse ring-2 ring-slate-900" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/50">Plantão</p>
              <p className="font-extrabold text-sm text-white truncate">
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
              "h-8 rounded-full px-3.5 text-[11px] font-bold shrink-0 transition-all",
              isOnline
                ? "bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-[0_0_18px_-2px_rgba(16,185,129,0.7)]"
                : "bg-white/5 hover:bg-white/15 text-white border-white/15"
            )}
          >
            {onlineLoading ? "..." : isOnline ? "Ativo" : "Ativar"}
          </Button>
        </div>

        {/* Próxima Consulta */}
        <div className="p-4 md:p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className={cn(
              "h-7 w-7 rounded-lg flex items-center justify-center ring-1",
              imminent ? "bg-amber-400/20 text-amber-300 ring-amber-400/30" : "bg-cyan-400/15 text-cyan-300 ring-cyan-400/20"
            )}>
              <Clock className="h-3.5 w-3.5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/50">
              {imminent ? "Em breve" : "Próxima"}
            </p>
          </div>
          {nextAppt ? (
            <>
              <p className="font-extrabold text-sm text-white truncate">{nextAppt.patient_name}</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className={cn(
                  "text-xl font-black tabular-nums leading-none tracking-tight md:text-2xl",
                  imminent ? "text-amber-300" : "text-cyan-300"
                )}>{countdown}</span>
                <span className="text-[11px] text-white/60 font-medium">
                  · {format(new Date(nextAppt.scheduled_at), "HH:mm", { locale: ptBR })}
                </span>
              </div>
              <Button
                size="sm"
                onClick={() => onEnterRoom(nextAppt.id)}
                className={cn(
                  "mt-3 h-9 rounded-xl px-3.5 text-[11.5px] font-bold w-full md:w-auto transition-all shadow-lg",
                  imminent
                    ? "bg-amber-400 hover:bg-amber-300 text-slate-900 shadow-amber-400/40"
                    : "bg-cyan-400 hover:bg-cyan-300 text-slate-900 shadow-cyan-400/40"
                )}
              >
                <Video className="h-3.5 w-3.5 mr-1.5" /> Entrar na sala
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-white">Sem próximas</p>
              <p className="text-[11px] text-white/60 mt-0.5">Agenda livre por enquanto</p>
            </>
          )}
        </div>

        {/* Fila ao vivo */}
        <button
          onClick={onSeeQueue}
          className={cn(
            "p-4 md:p-5 text-left transition-colors group",
            waitingCount > 0 ? "hover:bg-emerald-500/10" : "hover:bg-white/[0.03]"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={cn(
              "h-7 w-7 rounded-lg flex items-center justify-center ring-1",
              waitingCount > 0
                ? "bg-emerald-400/20 text-emerald-300 ring-emerald-400/30"
                : "bg-white/5 text-white/60 ring-white/10"
            )}>
              <Radio className={cn("h-3.5 w-3.5", waitingCount > 0 && "animate-pulse")} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/50">Fila ao vivo</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className={cn(
                  "text-2xl font-black tabular-nums leading-none tracking-tight md:text-3xl",
                  waitingCount > 0 ? "text-emerald-300" : "text-white/40"
                )}>{waitingCount}</span>
                <span className="text-[11px] text-white/60 font-medium">aguardando</span>
              </div>
              <p className="text-[11px] text-white/60 mt-1">
                {waitingCount > 0 ? "Toque para chamar" : "Tudo em dia"}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
        </button>
      </div>
    </motion.div>
  );
});

DoctorCommandCenter.displayName = "DoctorCommandCenter";
export default DoctorCommandCenter;
