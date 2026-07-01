import { motion } from "framer-motion";
import { ReactNode } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
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
        "relative overflow-hidden rounded-b-[34px] md:rounded-[34px] bg-gradient-to-br ring-1 ring-white/10",
        gradient, className
      )}
      style={{ boxShadow: "0 22px 54px -28px rgba(15, 42, 90, 0.45), inset 0 1px 0 rgba(255,255,255,.22)" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0.18)_0%,transparent_38%,rgba(255,255,255,0.08)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/14 to-transparent" />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent blur-sm"
        animate={{ x: ["0%", "280%"] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
      />
      {/* Top shine */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      {/* Soft bottom fade for legibility */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/15 to-transparent" />
      {/* Subtle dot grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "28px 28px"
        }} />

      <div className="relative z-10 px-5 pt-5 pb-1 md:px-8 md:pt-7">
        {/* Top actions row */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/90 shadow-sm">
            <Sparkles className="h-3 w-3" /> AloClínica
          </span>
          <div className="flex items-center gap-2">
          {topRight}
          {onRefresh && (
            <Button size="icon" aria-label="Atualizar" variant="ghost" onClick={onRefresh} disabled={refreshing}
              className="h-9 w-9 rounded-xl border border-white/15 bg-white/5 text-white/70 hover:bg-white/15 hover:text-white transition-all backdrop-blur-sm">
              <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            </Button>
          )}
          </div>
        </div>

        <div className="flex items-end gap-4 md:gap-6">
          {/* LEFT: greeting + content */}
          <div className="min-w-0 flex-1 pb-2">
            {bubble ? (
              <motion.div
                initial={{ opacity: 0, y: -12, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="relative mb-4 inline-block rounded-[22px] rounded-bl-[8px] border border-white/45 bg-white/95 dark:bg-white/95 backdrop-blur-xl px-4 py-3 shadow-[0_16px_42px_-20px_rgba(0,0,0,0.38)]"
                style={{ maxWidth: "min(340px, 74vw)" }}
              >
                {bubble.greeting && (
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[hsl(215,75%,32%)] leading-none">
                    {bubble.greeting}
                  </p>
                )}
                {bubble.name && (
                  <p className="mt-1.5 text-[17px] font-black tracking-[-0.01em] text-[hsl(215,80%,16%)] leading-[1.15] md:text-[21px]">
                    {bubble.name}
                  </p>
                )}
                {bubble.sub && (
                  <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-slate-600/90 font-bold">
                    {liveDot && <LiveDotEl />}
                    {bubble.sub}
                  </p>
                )}
                {/* Speech bubble tail */}
                <div className="absolute -bottom-[10px] left-6 h-0 w-0 border-l-[10px] border-r-0 border-t-[11px] border-l-transparent border-t-white/95" />
              </motion.div>
            ) : (
              <div className="mb-4">
                {tag && (
                  <p className="mb-2 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/70">
                    {liveDot && <LiveDotEl />}{tag}
                  </p>
                )}
                {name && <h1 className="text-[28px] font-black leading-[1.05] tracking-tight text-white drop-shadow-sm md:text-[36px]">{name}</h1>}
                {subtitle && <p className="mt-2 text-[13px] text-white/70 font-medium leading-relaxed md:text-[14px]">{subtitle}</p>}
              </div>
            )}
          </div>

          {/* RIGHT: Pingo mascot */}
          <motion.div className="relative shrink-0 -mb-2">
            <div className="pointer-events-none absolute inset-x-3 bottom-3 h-px bg-white/40" />
            <motion.img
              src={pingoSrc} alt={pingoAlt} draggable={false}
              className="relative select-none object-contain w-[96px] h-[96px] md:w-[138px] md:h-[138px]"
              style={{ filter: "drop-shadow(0 14px 28px rgba(0,0,0,.32))" }}
              initial={{ opacity: 0, scale: 0.6, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
              transition={{
                opacity: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                scale: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
                y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.6 },
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
            className="mt-3 -mx-1 flex overflow-x-auto rounded-[22px] border border-white/28 bg-white/[0.14] backdrop-blur-2xl scrollbar-none md:grid md:overflow-visible"
            style={{
              gridTemplateColumns: kpis.length > 3 ? `repeat(${kpis.length}, 1fr)` : undefined,
              boxShadow: "0 20px 48px -12px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.4), inset 0 -1px 0 rgba(0,0,0,.05)"
            }}
          >
            {loading
              ? kpis.map((k, i) => (
                  <div
                    key={k.label}
                    className={cn(
                      "flex flex-shrink-0 flex-1 flex-col items-center px-4 py-3.5 min-w-[78px] md:min-w-0",
                      i < kpis.length - 1 && "border-r border-white/20"
                    )}
                  >
                    <div className="h-6 min-w-8 rounded-lg bg-white/18 px-2 text-center text-[18px] font-black leading-6 text-white/70">--</div>
                    <p className="mt-2 text-[9px] font-extrabold uppercase tracking-[0.22em] text-white/65 md:text-[10px]">
                      {k.label}
                    </p>
                  </div>
                ))
              : kpis.map((k, i) => (
                  <motion.div
                    key={k.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
                    className={cn(
                      "flex flex-1 flex-col items-center px-4 py-3.5 flex-shrink-0 min-w-[78px] md:min-w-0 transition-colors hover:bg-white/10 group/kpi",
                      i < kpis.length - 1 && "border-r border-white/20"
                    )}
                  >
                    <p className="text-[20px] font-black leading-none tabular-nums text-white tracking-[-0.02em] md:text-[26px] drop-shadow-[0_2px_12px_rgba(0,0,0,0.3)] transition-transform duration-300 group-hover/kpi:scale-110">
                      {k.value}
                    </p>
                    <p className="mt-2 text-[9px] font-extrabold uppercase tracking-[0.22em] text-white/75 md:text-[10px]">
                      {k.label}
                    </p>
                  </motion.div>
                ))}
          </motion.div>
        )}

        <div className="h-4 md:h-6" />
      </div>
    </section>
  );
}
