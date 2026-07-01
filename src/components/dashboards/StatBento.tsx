import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export interface BentoItem {
  label: string;
  value: string | number;
  icon: ReactNode;
  iconBg: string;
  valueClass: string;
  accentClass?: string;
  trend?: number;
  sub?: string;
  wide?: boolean;
  children?: ReactNode;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export function StatBento({ stats, loading = false }: { stats: BentoItem[]; loading?: boolean }) {
  if (loading) return (
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-[110px] animate-pulse rounded-2xl bg-muted/50 border border-border/10" />
      ))}
    </div>
  );

  return (
    <motion.div
      variants={container} initial="hidden" animate="show"
      className="grid grid-cols-2 gap-2.5 md:grid-cols-4"
    >
      {stats.map((s) => (
        <motion.div
          key={s.label}
          variants={item}
          whileHover={{ y: -3, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "app-card group relative overflow-hidden rounded-[24px]",
            "cursor-default",
            s.wide && "col-span-2"
          )}
        >
          {/* Accent top bar with gradient */}
          {s.accentClass && (
            <div className={cn("h-[3px] w-full", s.accentClass, "opacity-80 group-hover:opacity-100 transition-opacity")} />
          )}
          {!s.accentClass && <div className="h-[3px] w-full bg-border/20" />}

          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-primary/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="p-3.5 md:p-4">
            <div className="flex items-start justify-between">
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-[14px] text-[16px] md:h-11 md:w-11 md:text-[20px]",
                "transition-all duration-300 group-hover:scale-110 group-hover:shadow-sm group-hover:rotate-[-2deg]",
                s.iconBg
              )}>
                {s.icon}
              </div>
              {s.trend !== undefined && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "rounded-[8px] px-1.5 py-0.5 text-[8.5px] font-bold tabular-nums",
                    s.trend >= 0
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  )}>
                  {s.trend >= 0 ? "↑" : "↓"} {Math.abs(s.trend)}%
                </motion.span>
              )}
            </div>
            <p className={cn(
              "mt-2.5 text-[22px] font-black leading-none tracking-tight tabular-nums md:text-[24px]",
              "transition-colors duration-200",
              s.valueClass
            )}>
              {s.value}
            </p>
            <p className="mt-1.5 text-[10px] font-semibold text-muted-foreground/80 md:text-[10.5px] uppercase tracking-[0.05em]">{s.label}</p>
            {s.sub && <p className="mt-0.5 text-[9px] text-muted-foreground/55">{s.sub}</p>}
            {s.children}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
