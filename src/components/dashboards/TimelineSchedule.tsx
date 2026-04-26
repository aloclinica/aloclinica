import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export interface ScheduleItem {
  id: string;
  time: string;
  patientName: string;
  doctorName: string;
  specialty?: string;
  status: "live" | "waiting" | "scheduled" | "completed" | "no_show" | "cancelled";
}

const statusMap = {
  live:      { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400", timeBg: "bg-emerald-100 dark:bg-emerald-900/40", timeText: "text-emerald-700 dark:text-emerald-300", tag: "Na Sala", tagBg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400" },
  waiting:   { bg: "bg-amber-50 dark:bg-amber-950/20", text: "text-amber-700 dark:text-amber-400", timeBg: "bg-amber-100 dark:bg-amber-900/40", timeText: "text-amber-700 dark:text-amber-300", tag: "Na Fila", tagBg: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400" },
  scheduled: { bg: "bg-blue-50/50 dark:bg-blue-950/10", text: "text-blue-600 dark:text-blue-400", timeBg: "bg-blue-100 dark:bg-blue-900/40", timeText: "text-blue-700 dark:text-blue-300", tag: "Agendado", tagBg: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400" },
   completed: { bg: "bg-emerald-50/20 dark:bg-emerald-950/5", text: "text-emerald-600/70", timeBg: "bg-emerald-100/40", timeText: "text-emerald-700/60", tag: "Concluído", tagBg: "bg-emerald-100/50 text-emerald-700/70" },
   no_show:   { bg: "bg-rose-50 dark:bg-rose-950/20", text: "text-rose-700 dark:text-rose-400", timeBg: "bg-rose-100 dark:bg-rose-900/40", timeText: "text-rose-700 dark:text-rose-300", tag: "Faltou", tagBg: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400" },
   cancelled: { bg: "bg-slate-50/50 dark:bg-slate-900/10", text: "text-slate-500", timeBg: "bg-slate-100 dark:bg-slate-800/40", timeText: "text-slate-600 dark:text-slate-400", tag: "Cancelado", tagBg: "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400" },
};

export function TimelineSchedule({ items, onSeeAll }: { items: ScheduleItem[]; onSeeAll?: () => void }) {
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">Agenda por horário</p>
        {onSeeAll && <button onClick={onSeeAll} className="text-[11px] font-semibold text-primary hover:opacity-80">Ver completa →</button>}
      </div>
      <div className="overflow-hidden rounded-2xl border border-border/25 bg-card" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
        {items.map((item, i) => {
          const s = statusMap[item.status] ?? statusMap.scheduled;
          return (
            <motion.div key={item.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, ease: "easeOut" }}
               className={cn(
                 "flex items-center gap-3 px-4 py-3 transition-all duration-300 hover:bg-muted/10 group/item",
                 i < items.length - 1 && "border-b border-border/15",
                 s.bg,
                 item.status === "live" && "ring-1 ring-inset ring-emerald-500/20"
               )}
             >
               {/* Time block */}
               <div className={cn(
                 "flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl transition-transform duration-300 group-hover/item:scale-110 shadow-sm",
                 s.timeBg
               )}>
            >
              {/* Time block */}
              <div className={cn("flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl", s.timeBg)}>
                <span className={cn("text-[15px] font-black leading-none", s.timeText)}>{item.time.split(":")[0]}</span>
                <span className={cn("text-[8px] font-bold", s.timeText)}>:{item.time.split(":")[1]}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold text-foreground">{item.patientName}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{item.doctorName}{item.specialty ? ` · ${item.specialty}` : ""}</p>
              </div>
              <span className={cn("shrink-0 rounded-lg px-2 py-0.5 text-[9px] font-bold", s.tagBg)}>{s.tag}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
