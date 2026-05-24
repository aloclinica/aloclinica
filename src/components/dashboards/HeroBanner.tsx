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
        "relative overflow-hidden rounded-b-[36px] md:rounded-[40px] bg-gradient-to-br",
        gradient, className
      )}
      style={{ boxShadow: "0 24px 60px -16px rgba(15, 42, 90, 0.35), inset 0 1px 0 rgba(255,255,255,.18)" }}
    >
      {/* Mesh light orbs */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-[hsl(168,80%,60%)]/25 blur-[120px]" />
      <div className="pointer-events-none absolute -left-16 -bottom-24 h-[320px] w-[320px] rounded-full bg-white/10 blur-[100px]" />
      <div className="pointer-events-none absolute right-1/3 top-1/4 h-40 w-40 rounded-full bg-white/[0.06] blur-[40px]" />
      {/* Top shine */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      {/* Subtle dot grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "28px 28px"
        }} />

      <div className="relative z-10 px-6 pt-7 pb-1 md:px-9 md:pt-9">
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
                className="relative mb-5 inline-block rounded-[24px] rounded-bl-[8px] border border-white/30 bg-white/95 dark:bg-white/95 backdrop-blur-xl px-6 py-4 shadow-[0_16px_40px_rgba(0,0,0,.22)]"
                style={{ maxWidth: "min(280px, 72vw)" }}
              >
                {bubble.greeting && (
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[hsl(215,75%,32%)] leading-none">
                    {bubble.greeting}
                  </p>
                )}
                {bubble.name && (
                  <p className="mt-1.5 text-[17px] font-black tracking-tight text-[hsl(215,80%,18%)] leading-tight md:text-[20px]">
                    {bubble.name}
                  </p>
                )}
                {bubble.sub && (
                  <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-slate-500 font-semibold">
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

          {/* RIGHT: Pingo mascot with halo */}
          <motion.div className="relative shrink-0 -mb-2">
            <div className="pointer-events-none absolute inset-0 -z-0 m-auto h-[140px] w-[140px] rounded-full bg-white/15 blur-2xl md:h-[180px] md:w-[180px]" />
            <motion.img
              src={pingoSrc} alt={pingoAlt} draggable={false}
              className="relative select-none object-contain w-[120px] h-[120px] md:w-[160px] md:h-[160px]"
              style={{ filter: "drop-shadow(0 18px 36px rgba(0,0,0,.35))" }}
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
            className="mt-3 -mx-1 flex overflow-x-auto rounded-3xl border border-white/25 bg-white/15 backdrop-blur-2xl scrollbar-none md:grid md:overflow-visible"
            style={{
              gridTemplateColumns: kpis.length > 3 ? `repeat(${kpis.length}, 1fr)` : undefined,
              boxShadow: "0 12px 32px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.35)"
            }}
          >
            {loading
              ? Array.from({ length: kpis.length }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 flex-1 animate-pulse px-4 py-4 min-w-[78px]">
                    <div className="mx-auto h-6 w-12 rounded-lg bg-white/20" />
                    <div className="mx-auto mt-1.5 h-2 w-10 rounded bg-white/15" />
                  </div>
                ))
              : kpis.map((k, i) => (
                  <motion.div
                    key={k.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
                    className={cn(
                      "flex flex-1 flex-col items-center px-4 py-4 flex-shrink-0 min-w-[78px] md:min-w-0 transition-colors hover:bg-white/10",
                      i < kpis.length - 1 && "border-r border-white/15"
                    )}
                  >
                    <p className="text-[22px] font-black leading-none tabular-nums text-white tracking-tight md:text-[26px] drop-shadow-sm">
                      {k.value}
                    </p>
                    <p className="mt-2 text-[9px] font-extrabold uppercase tracking-[0.18em] text-white/70 md:text-[9.5px]">
                      {k.label}
                    </p>
                  </motion.div>
                ))}
          </motion.div>
        )}

        <div className="h-5 md:h-7" />
      </div>
    </section>
  );
}
