import { motion } from "framer-motion";
import { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface KpiItem { label: string; value: string | number; }

interface HeroBannerProps {
  gradient: string;
  tag?: string;
  liveDot?: boolean;
  liveColor?: "green" | "red";
  name?: string;
  subtitle?: string;
  bubble?: { greeting?: string; name?: string; sub?: string };
  pingoSrc: string;
  pingoAlt?: string;
  kpis?: KpiItem[];
  loading?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  topRight?: ReactNode;
  className?: string;
}

export function HeroBanner({
  gradient, tag, liveDot = false, liveColor = "green",
  name, subtitle, bubble, pingoSrc, pingoAlt = "Pingo",
  kpis = [], loading = false, onRefresh, refreshing = false,
  topRight, className,
}: HeroBannerProps) {
  const LiveDotEl = () => (
    <span className={cn(
      "inline-block h-[6px] w-[6px] rounded-full animate-pulse shadow-sm",
      liveColor === "red" ? "bg-red-400 shadow-red-400/40" : "bg-emerald-400 shadow-emerald-400/40"
    )} />
  );

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-b-[28px] md:rounded-[28px]",
        gradient, className
      )}
      style={{ boxShadow: "0 12px 48px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.15)" }}
    >
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/[0.06] blur-[60px]" />
      <div className="pointer-events-none absolute left-1/4 -bottom-10 h-48 w-48 rounded-full bg-white/[0.04] blur-[40px]" />
      <div className="pointer-events-none absolute right-1/3 top-1/4 h-32 w-32 rounded-full bg-white/[0.03] blur-[30px]" />
      {/* Top shine */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      {/* Subtle grid pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "24px 24px"
        }} />

      <div className="relative z-10 px-5 pt-6 pb-1 md:px-7 md:pt-7">
        {/* Top actions row */}
        <div className="flex items-center justify-end gap-2 mb-1">
          {topRight}
          {onRefresh && (
            <Button size="icon" aria-label="Atualizar" variant="ghost" onClick={onRefresh} disabled={refreshing}
              className="h-9 w-9 rounded-xl border border-white/15 bg-white/5 text-white/70 hover:bg-white/15 hover:text-white transition-all backdrop-blur-sm">
              <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            </Button>
          )}
        </div>

        <div className="flex items-end gap-4 md:gap-6">
          {/* LEFT: greeting + content */}
          <div className="min-w-0 flex-1 pb-1">
            {bubble ? (
              <motion.div
                initial={{ opacity: 0, y: -12, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="relative mb-4 inline-block rounded-[20px] rounded-bl-[6px] border border-white/20 bg-white/95 dark:bg-white/90 backdrop-blur-md px-5 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,.18)]"
                style={{ maxWidth: "min(240px, 72vw)" }}
              >
                {bubble.greeting && (
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-primary leading-none">
                    {bubble.greeting}
                  </p>
                )}
                {bubble.name && (
                  <p className="mt-1 text-[15px] font-black tracking-tight text-foreground leading-tight md:text-[17px]">
                    {bubble.name}
                  </p>
                )}
                {bubble.sub && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-[10.5px] text-muted-foreground font-medium">
                    {liveDot && <LiveDotEl />}
                    {bubble.sub}
                  </p>
                )}
                {/* Speech bubble tail */}
                <div className="absolute -bottom-[9px] left-5 h-0 w-0 border-l-[9px] border-r-0 border-t-[10px] border-l-transparent border-t-white/95 dark:border-t-white/90" />
              </motion.div>
            ) : (
              <div className="mb-3">
                {tag && (
                  <p className="mb-1.5 flex items-center gap-1.5 text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-white/60">
                    {liveDot && <LiveDotEl />}{tag}
                  </p>
                )}
                {name && <h1 className="text-[22px] font-black leading-tight tracking-tight text-white drop-shadow-sm md:text-[26px]">{name}</h1>}
                {subtitle && <p className="mt-1.5 text-[11px] text-white/55 font-medium leading-relaxed">{subtitle}</p>}
              </div>
            )}
          </div>

          {/* RIGHT: Pingo mascot */}
          <motion.div className="shrink-0 -mb-1">
            <motion.img
              src={pingoSrc} alt={pingoAlt} draggable={false}
              className="select-none object-contain w-[100px] h-[100px] md:w-[130px] md:h-[130px]"
              style={{ filter: "drop-shadow(0 12px 28px rgba(0,0,0,.3))" }}
              initial={{ opacity: 0, scale: 0.6, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
              transition={{
                opacity: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                scale: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
                y: { duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: 0.6 },
              }}
            />
          </motion.div>
        </div>

        {/* KPI strip */}
        {kpis.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mt-2 -mx-1 flex overflow-x-auto rounded-2xl border border-black/8 dark:border-white/10 bg-white/92 dark:bg-white/10 backdrop-blur-xl scrollbar-none md:grid md:overflow-visible"
            style={{
              gridTemplateColumns: kpis.length > 3 ? `repeat(${kpis.length}, 1fr)` : undefined,
              boxShadow: "0 4px 20px rgba(0,0,0,.10), inset 0 1px 0 rgba(255,255,255,.5)"
            }}
          >
            {loading
              ? Array.from({ length: kpis.length }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 flex-1 animate-pulse px-4 py-3.5 min-w-[72px]">
                    <div className="mx-auto h-6 w-12 rounded-lg bg-muted/30" />
                    <div className="mx-auto mt-1.5 h-2 w-8 rounded bg-muted/20" />
                  </div>
                ))
              : kpis.map((k, i) => (
                  <motion.div
                    key={k.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
                    className={cn(
                      "flex flex-1 flex-col items-center px-4 py-3.5 flex-shrink-0 min-w-[72px] md:min-w-0",
                      i < kpis.length - 1 && "border-r border-black/6 dark:border-white/10"
                    )}
                  >
                    <p className="text-[20px] font-black leading-none tabular-nums text-[#1e3a8a] dark:text-white tracking-tight md:text-[22px]">
                      {k.value}
                    </p>
                    <p className="mt-1.5 text-[8px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70 dark:text-white/50 md:text-[8.5px]">
                      {k.label}
                    </p>
                  </motion.div>
                ))}
          </motion.div>
        )}

        <div className="h-4 md:h-5" />
      </div>
    </section>
  );
}
