import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import mascotWave     from "@/assets/mascot-wave.png";
import mascotWelcome  from "@/assets/mascot-welcome.png";
import mascotThumbsup from "@/assets/mascot-thumbsup.png";
import mascotReading  from "@/assets/mascot-reading.png";
import mascotDefault  from "@/assets/mascot.png";
import pingoAdmin     from "@/assets/pingo-admin.png";
import pingoReception from "@/assets/pingo-reception.png";
import pingoPartner   from "@/assets/pingo-partner.png";
import pingoSupport   from "@/assets/pingo-support.png";

import pingoSolitario from "@/assets/pingo-solitario.png";
import logo           from "@/assets/logo.png";

export type PingoVariant =
  | "wave" | "welcome" | "thumbsup" | "reading"
  | "admin" | "reception" | "partner" | "support"
  | "solitario" | "logo" | "default";

const SOURCES: Record<PingoVariant, string> = {
  wave: mascotWave, welcome: mascotWelcome, thumbsup: mascotThumbsup,
  reading: mascotReading, admin: pingoAdmin, reception: pingoReception,
  partner: pingoPartner, support: pingoSupport,
  solitario: pingoSolitario, logo, default: mascotDefault,
};

interface PingoMascotProps {
  variant?: PingoVariant;
  size?: number;
  className?: string;
  animate?: boolean;
  bounce?: boolean;
  alt?: string;
  onClick?: () => void;
}

export function PingoMascot({
  variant = "wave", size = 120, className, animate = false, bounce = true,
  alt = "Pingo mascote AloClínica", onClick,
}: PingoMascotProps) {
  const src = SOURCES[variant] ?? SOURCES.default;
  return (
    <motion.img
      src={src} alt={alt} draggable={false}
      style={{ width: size, height: size }}
      className={cn("select-none object-contain drop-shadow-xl", onClick && "cursor-pointer", className)}
      initial={bounce ? { opacity: 0, scale: 0.7, y: 12 } : undefined}
      animate={bounce ? { opacity: 1, scale: 1, y: animate ? [0, -8, 0] : 0 } : animate ? { y: [0, -8, 0] } : undefined}
      transition={bounce ? { duration: 0.55, ease: [0.22, 1, 0.36, 1] } : animate ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : undefined}
      whileHover={onClick ? { scale: 1.06 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
      onClick={onClick}
    />
  );
}

interface PingoBannerProps {
  variant?: PingoVariant;
  mascotSize?: number;
  bgClass?: string;
  accentColor?: string;
  label?: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
  className?: string;
  animateMascot?: boolean;
}

export function PingoBanner({
  variant = "wave", mascotSize = 90, bgClass = "bg-blue-50 dark:bg-blue-950/30",
  accentColor = "text-blue-600 dark:text-blue-400", label, title, subtitle, ctaLabel, onCta, className, animateMascot = true,
}: PingoBannerProps) {
  return (
    <div className={cn(
      "relative flex items-center gap-3 rounded-2xl overflow-hidden px-4 py-3 border border-white/60 dark:border-white/5",
      bgClass, className
    )}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      <div className="shrink-0 flex items-end justify-center" style={{ width: mascotSize, height: mascotSize }}>
        <PingoMascot variant={variant} size={mascotSize} animate={animateMascot} bounce />
      </div>
      <div className="min-w-0 flex-1">
        {label && <p className={cn("text-[9.5px] font-bold uppercase tracking-[0.12em] mb-0.5", accentColor)}>{label}</p>}
        <p className="text-[13px] font-extrabold text-foreground leading-tight tracking-tight">{title}</p>
        {subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">{subtitle}</p>}
        {ctaLabel && onCta && (
          <button onClick={onCta} className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10.5px] font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-95 transition-all shadow-[0_3px_10px_rgba(37,99,235,.3)]">
            {ctaLabel} →
          </button>
        )}
      </div>
    </div>
  );
}

interface PingoEmptyProps {
  variant?: PingoVariant;
  size?: number;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function PingoEmpty({ variant = "welcome", size = 120, title, subtitle, ctaLabel, onCta }: PingoEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
      <PingoMascot variant={variant} size={size} animate bounce />
      <div>
        <p className="text-[15px] font-bold text-foreground">{title}</p>
        {subtitle && <p className="mt-1 text-[12px] text-muted-foreground max-w-[220px] mx-auto leading-relaxed">{subtitle}</p>}
      </div>
      {ctaLabel && onCta && (
        <button onClick={onCta} className="mt-1 px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-[12px] font-bold shadow-[0_4px_14px_rgba(37,99,235,.3)] hover:bg-[#1D4ED8] active:scale-95 transition-all">
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
