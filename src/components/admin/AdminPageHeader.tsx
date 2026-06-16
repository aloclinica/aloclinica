import { ReactNode } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface AdminPageHeaderProps {
  /** Lucide icon component */
  icon: LucideIcon;
  /** Page title */
  title: string;
  /** Optional short description below title */
  description?: string;
  /** Optional eyebrow label (e.g. "Operação") */
  eyebrow?: string;
  /** Tailwind gradient classes for the icon tile (e.g. "from-emerald-500 to-teal-600") */
  accent?: string;
  /** Optional badge (count, status, etc.) */
  badge?: { label: string; tone?: "default" | "success" | "warning" | "danger" | "info" };
  /** Action buttons / filters area on the right */
  actions?: ReactNode;
  /** Children rendered below header (KPIs, filter row, etc.) */
  children?: ReactNode;
  /** Optional breadcrumb trail rendered above the title */
  breadcrumbs?: { label: string; href?: string }[];
  /** Optional tab strip rendered just under the header divider */
  tabs?: ReactNode;
  /** Stick to top when scrolling. Default false. */
  sticky?: boolean;
  className?: string;
}

const TONE_CLASSES: Record<NonNullable<AdminPageHeaderProps["badge"]>["tone"] & string, string> = {
  default: "bg-muted text-muted-foreground border-border",
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  danger: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  info: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
};

/**
 * Standardized header for admin sub-pages.
 * Provides icon tile, title, optional eyebrow/description/badge and right-aligned actions.
 */
export const AdminPageHeader = ({
  icon: Icon,
  title,
  description,
  eyebrow,
  accent = "from-primary to-blue-700",
  badge,
  actions,
  children,
  breadcrumbs,
  tabs,
  sticky = false,
  className,
}: AdminPageHeaderProps) => {
  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/50 bg-card/85 backdrop-blur-xl shadow-[0_1px_0_0_hsl(var(--border)/0.4),0_8px_24px_-12px_hsl(var(--primary)/0.08)]",
        sticky && "sticky top-2 z-30",
        className
      )}
    >
      {/* Top accent line */}
      <div className={cn("h-[3px] bg-gradient-to-r", accent)} />

      {/* Subtle dot grid texture (Linear/Notion-style) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.08) 1px, transparent 0)",
          backgroundSize: "18px 18px",
          maskImage:
            "linear-gradient(180deg, rgba(0,0,0,0.9), rgba(0,0,0,0.0) 70%)",
          WebkitMaskImage:
            "linear-gradient(180deg, rgba(0,0,0,0.9), rgba(0,0,0,0.0) 70%)",
        }}
      />

      {/* Subtle radial glow */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full opacity-[0.10] blur-3xl bg-gradient-to-br",
          accent
        )}
      />

      <div className="relative flex flex-col gap-4 p-4 md:p-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: identity */}
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              "shrink-0 w-11 h-11 md:w-12 md:h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md ring-1 ring-white/10 ring-inset",
              accent
            )}
          >
            <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav
                aria-label="Breadcrumb"
                className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1 flex-wrap"
              >
                {breadcrumbs.map((crumb, i) => {
                  const isLast = i === breadcrumbs.length - 1;
                  return (
                    <span key={`${crumb.label}-${i}`} className="flex items-center gap-1">
                      {crumb.href && !isLast ? (
                        <Link
                          to={crumb.href}
                          className="hover:text-foreground transition-colors font-medium"
                        >
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className={cn("font-medium", isLast && "text-foreground/80")}>
                          {crumb.label}
                        </span>
                      )}
                      {!isLast && <ChevronRight className="w-3 h-3 opacity-60" />}
                    </span>
                  );
                })}
              </nav>
            )}
            {eyebrow && (
              <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-1">
                {eyebrow}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg md:text-[22px] font-bold text-foreground tracking-[-0.015em] leading-tight">
                {title}
              </h1>
              {badge && (
                <Badge
                  variant="outline"
                  className={cn("font-semibold text-[10.5px] h-5 px-1.5", TONE_CLASSES[badge.tone ?? "default"])}
                >
                  {badge.label}
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-xs md:text-[13px] text-muted-foreground mt-1 leading-snug max-w-2xl">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Right: actions */}
        {actions && (
          <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
            {actions}
          </div>
        )}
      </div>

      {tabs && (
        <div className="relative border-t border-border/40 px-2 md:px-3">
          <div className="overflow-x-auto scrollbar-hide">
            {tabs}
          </div>
        </div>
      )}

      {children && (
        <div className="relative border-t border-border/40 p-4 md:p-5">
          {children}
        </div>
      )}
    </motion.header>
  );
};

export default AdminPageHeader;
