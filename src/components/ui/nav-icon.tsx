import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type NavIconColor = "blue" | "green" | "amber" | "rose" | "purple" | "cyan" | "emerald" | "orange" | "slate";

const colorMap: Record<NavIconColor, { bg: string; text: string; glow: string; border: string }> = {
  blue:    { bg: "bg-gradient-to-br from-primary/20 to-primary/8",       text: "text-primary",                          glow: "shadow-[0_2px_8px_-1px_hsl(var(--primary)/0.25)]", border: "border-primary/20" },
  green:   { bg: "bg-gradient-to-br from-success/20 to-success/8",       text: "text-success",                          glow: "shadow-[0_2px_8px_-1px_hsl(var(--success)/0.25)]", border: "border-success/20" },
  amber:   { bg: "bg-gradient-to-br from-warning/20 to-warning/8",       text: "text-warning",                          glow: "shadow-[0_2px_8px_-1px_hsl(var(--warning)/0.25)]", border: "border-warning/20" },
  rose:    { bg: "bg-gradient-to-br from-destructive/20 to-destructive/8", text: "text-destructive",                    glow: "shadow-[0_2px_8px_-1px_hsl(var(--destructive)/0.25)]", border: "border-destructive/20" },
  purple:  { bg: "bg-gradient-to-br from-[hsl(270_60%_55%/0.20)] to-[hsl(270_60%_55%/0.08)]", text: "text-[hsl(270_60%_55%)]", glow: "shadow-[0_2px_8px_-1px_hsl(270_60%_55%/0.25)]", border: "border-[hsl(270_60%_55%/0.2)]" },
  cyan:    { bg: "bg-gradient-to-br from-[hsl(195_80%_50%/0.20)] to-[hsl(195_80%_50%/0.08)]", text: "text-[hsl(195_80%_50%)]", glow: "shadow-[0_2px_8px_-1px_hsl(195_80%_50%/0.25)]", border: "border-[hsl(195_80%_50%/0.2)]" },
  emerald: { bg: "bg-gradient-to-br from-secondary/20 to-secondary/8",   text: "text-secondary",                        glow: "shadow-[0_2px_8px_-1px_hsl(var(--secondary)/0.25)]", border: "border-secondary/20" },
  orange:  { bg: "bg-gradient-to-br from-[hsl(25_95%_55%/0.20)] to-[hsl(25_95%_55%/0.08)]",  text: "text-[hsl(25_95%_55%)]",  glow: "shadow-[0_2px_8px_-1px_hsl(25_95%_55%/0.25)]", border: "border-[hsl(25_95%_55%/0.2)]" },
  slate:   { bg: "bg-gradient-to-br from-muted to-muted/60",             text: "text-muted-foreground",                 glow: "", border: "border-muted-foreground/10" },
};

interface NavIconProps {
  icon: ReactNode;
  color?: NavIconColor;
  active?: boolean;
  className?: string;
  size?: number;
}

export const NavIcon = ({ icon, color = "blue", active, className }: NavIconProps) => {
  const c = colorMap[color] ?? colorMap.blue;
  return (
    <span
      className={cn(
        "nav-icon-wrapper relative inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[14px] border transition-all duration-300 active:scale-95 [&_svg]:relative [&_svg]:z-10 [&_svg]:transition-transform [&_svg]:duration-300 group-hover:[&_svg]:-rotate-3 group-hover:[&_svg]:scale-110",
        active
          ? "scale-105 border-white/30 bg-white/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.30),0_8px_18px_-12px_rgba(0,0,0,.45)] before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.45),transparent_42%)]"
          : `${c.bg} ${c.text} ${c.glow} ${c.border} group-hover:-translate-y-0.5 group-hover:scale-105 before:absolute before:inset-y-0 before:left-[-120%] before:w-full before:skew-x-[-18deg] before:bg-gradient-to-r before:from-transparent before:via-white/45 before:to-transparent before:transition-transform before:duration-700 group-hover:before:translate-x-[250%]`,
        className
      )}
    >
      {icon}
    </span>
  );
};

export type { NavIconColor };
export default NavIcon;
