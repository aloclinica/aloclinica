import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface QueueItem {
  id: string;
  initials: string;
  name: string;
  subtitle: string;
  status: "live" | "waiting" | "scheduled" | "urgent";
  avatarBg: string;
  avatarColor: string;
  action?: ReactNode;
  tag?: string;
  tagBg?: string;
  tagColor?: string;
}

const statusConfig = {
  live: { dot: "bg-emerald-400", label: "Ao vivo" },
  waiting: { dot: "bg-amber-400", label: "Aguardando" },
  scheduled: { dot: "bg-blue-400", label: "Agendado" },
  urgent: { dot: "bg-red-500", label: "Urgente" },
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0, 0, 0.2, 1] as [number, number, number, number] } } };

export function LiveQueue({ items, title, linkLabel, onLinkClick }: {
  items: QueueItem[];
  title?: string;
  linkLabel?: string;
  onLinkClick?: () => void;
}) {
  return (
    <div>
      {(title || linkLabel) && (
        <div className="mb-2.5 flex items-center justify-between px-0.5">
          {title && <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">{title}</h3>}
          {linkLabel && (
            <button onClick={onLinkClick} className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:opacity-80">
              {linkLabel} →
            </button>
          )}
        </div>
      )}
      <div className="overflow-hidden rounded-2xl border border-border/25 bg-card" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
        <motion.div variants={container} initial="hidden" animate="show" className="divide-y divide-border/15">
          {items.map((qi) => {
            const sc = statusConfig[qi.status];
            return (
              <motion.div key={qi.id} variants={item}
                 className={cn(
                   "flex items-center gap-3 px-4 py-3 transition-all duration-300 hover:bg-muted/20 group/item",
                   qi.status === "urgent" && "bg-rose-50/30 dark:bg-rose-950/10"
                 )}
               >
                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-transform duration-300 group-hover/item:scale-110 shadow-sm",
                    qi.avatarBg, qi.avatarColor
                  )}>
                  {qi.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-foreground">{qi.name}</p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", sc.dot, qi.status === "live" && "animate-pulse")} />
                    <span className="text-[10px] text-muted-foreground">{qi.subtitle}</span>
                  </div>
                </div>
                {qi.action && <div className="shrink-0">{qi.action}</div>}
                {qi.tag && !qi.action && (
                  <span className={cn("shrink-0 rounded-lg px-2 py-0.5 text-[9px] font-bold", qi.tagBg, qi.tagColor)}>{qi.tag}</span>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
