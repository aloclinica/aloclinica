/**
 * PingoBannerCard — Banner com imagem real da Dra. Lila
 * Mesmo padrão de renderização do Header.tsx ListItem
 */
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { BannerCTA } from "@/components/ui/banner-cta";

interface PingoBannerCardProps {
  pingImg: string;
  pingAlt?: string;
  pingSize?: number;
  bgClass?: string;
  borderClass?: string;
  label?: string;
  labelColor?: string;
  title: string;
  titleColor?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaBg?: string;
  onCta?: () => void;
  className?: string;
  animate?: boolean;
  children?: ReactNode;
}

export function PingoBannerCard({
  pingImg, pingAlt = "Dra. Lila", pingSize = 88,
  bgClass = "bg-blue-50 dark:bg-blue-950/30",
  borderClass = "border-blue-100 dark:border-blue-900/30",
  label, labelColor = "text-blue-600 dark:text-blue-400",
  title, titleColor = "text-foreground",
  subtitle, ctaLabel, ctaBg = "bg-[#2563EB] hover:bg-[#1D4ED8]",
  onCta, className, animate = true, children,
}: PingoBannerCardProps) {
  return (
    <div className={cn(
      "relative flex items-center gap-3 overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-card to-muted/30 p-4",
      borderClass, className
    )}
      style={{ boxShadow: "0 4px 20px rgba(0,0,0,.06)" }}
    >
      {/* Top shine line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

      {/* Pingo — real PNG */}
      <div
        className={cn("flex shrink-0 items-end justify-center", animate && "pingo-float-slow")}
        style={{ width: pingSize, height: pingSize }}
      >
        <img
          src={pingImg}
          alt={pingAlt}
          className="w-full h-full object-contain select-none"
          style={{ filter: "drop-shadow(0 8px 20px rgba(0,0,0,.18))" }}
          draggable={false}
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {label && (
          <p className={cn("mb-0.5 text-[9.5px] font-bold uppercase tracking-[0.12em]", labelColor)}>{label}</p>
        )}
        <p className={cn("text-[13.5px] font-extrabold leading-tight tracking-tight", titleColor)}>{title}</p>
        {subtitle && (
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{subtitle}</p>
        )}
        {children}
        {ctaLabel && onCta && (
          <BannerCTA
            tone="dark"
            size="sm"
            onClick={onCta}
            className={cn("mt-2.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200", ctaBg)}
          >
            {ctaLabel}
          </BannerCTA>
        )}
      </div>
    </div>
  );
}
