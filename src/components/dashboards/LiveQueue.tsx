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
  live:      { dot: "bg-emerald-400", label: "Ao vivo",    ring: "ring-emerald-400/40", glow: "from-emerald-400/20" },
  waiting:   { dot: "bg-amber-400",   label: "Aguardando", ring: "ring-amber-400/40",   glow: "from-amber-400/20" },
  scheduled: { dot: "bg-blue-400",    label: "Agendado",   ring: "ring-blue-400/30",    glow: "from-blue-400/10" },
  urgent:    { dot: "bg-red-500",     label: "Urgente",    ring: "ring-red-500/50",     glow: "from-red-500/25" },
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } } };

export function LiveQueue({ items, title, linkLabel, onLinkClick }: {
  items: QueueItem[];
  title?: string;
  linkLabel?: string;
  onLinkClick?: () => void;
}) {
  const liveCount = items.filter(i => i.status === "live" || i.status === "urgent").length;
  return (
    <div>
      {(title || linkLabel) && (
        <div className="mb-3 flex items-center justify-between px-1">
          {title && (
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <h3 className="text-[10.5px] font-black uppercase tracking-[0.18em] text-foreground/70">{title}</h3>
              {liveCount > 0 && (
                <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-[1px] text-[9px] font-bold">
                  {liveCount}
                </span>
              )}
            </div>
          )}
          {linkLabel && (
            <button onClick={onLinkClick} className="group flex items-center gap-1 text-[11px] font-bold text-primary hover:gap-1.5 transition-all">
              {linkLabel} →
            </button>
          )}
        </div>
      )}
      <div className="relative overflow-hidden rounded-3xl border border-border/30 bg-gradient-to-br from-card via-card to-card/60 backdrop-blur-xl shadow-[0_8px_28px_-12px_rgba(0,0,0,0.12)]">
        {/* ambient mesh glow */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-52 w-52 rounded-full bg-blue-400/8 blur-3xl" />
        <motion.div variants={container} initial="hidden" animate="show" className="relative divide-y divide-border/10">
          {items.map((qi) => {
            const sc = statusConfig[qi.status];
            return (
              <motion.div key={qi.id} variants={item}
                 className={cn(
                   "relative flex items-center gap-3 px-4 py-3.5 transition-all duration-300 hover:bg-white/40 dark:hover:bg-white/[0.03] group/item",
                   qi.status === "urgent" && "bg-gradient-to-r from-rose-50/40 to-transparent dark:from-rose-950/15"
                 )}
               >
                {/* status accent bar */}
                <span className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[3px] rounded-r-full opacity-0 group-hover/item:opacity-100 transition-opacity",
                  sc.dot
                )} />
                <div className="relative shrink-0">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-2xl text-[11.5px] font-extrabold transition-transform duration-300 group-hover/item:scale-110 ring-2",
                    qi.avatarBg, qi.avatarColor, sc.ring
                  )}>
                    {qi.initials}
                  </div>
                  {(qi.status === "live" || qi.status === "urgent") && (
                    <span className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card",
                      sc.dot,
                      "animate-pulse"
                    )} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-foreground truncate">{qi.name}</p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", sc.dot, qi.status === "live" && "animate-pulse")} />
                    <span className="text-[10.5px] font-medium text-muted-foreground truncate">{qi.subtitle}</span>
                  </div>
                </div>
                {qi.action && (
                  <div className="shrink-0 transition-transform duration-300 group-hover/item:scale-[1.04]">
                    {qi.action}
                  </div>
                )}
                {qi.tag && !qi.action && (
                  <span className={cn("shrink-0 rounded-lg px-2 py-0.5 text-[9.5px] font-bold", qi.tagBg, qi.tagColor)}>{qi.tag}</span>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
