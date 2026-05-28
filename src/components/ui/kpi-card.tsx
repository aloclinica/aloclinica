/**
 * KpiCard — bloco padrão de KPI (ícone, label, valor, opcional delta/help).
 * Garante consistência visual e acessibilidade em paciente/médico/órgão/cartão.
 *
 * <KpiCard icon={Users} label="Beneficiários" value={120} />
 * <KpiCard icon={DollarSign} label="Receita do mês" value="R$ 4.320" delta="+12%" deltaTone="up" />
 */
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  delta?: string;
  deltaTone?: "up" | "down" | "neutral";
  help?: string;
  loading?: boolean;
  className?: string;
}

const deltaColor: Record<NonNullable<KpiCardProps["deltaTone"]>, string> = {
  up: "text-emerald-600 dark:text-emerald-400",
  down: "text-rose-600 dark:text-rose-400",
  neutral: "text-muted-foreground",
};

export function KpiCard({ icon: Icon, label, value, delta, deltaTone = "neutral", help, loading, className }: KpiCardProps) {
  return (
    <div
      role="group"
      aria-label={`${label}: ${loading ? "carregando" : value}`}
      className={cn(
        "rounded-2xl border border-border/40 bg-card p-3.5 transition-colors hover:border-border/70",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        {Icon && <Icon className="w-3.5 h-3.5" aria-hidden="true" />}
        <span className="truncate">{label}</span>
      </div>
      {loading ? (
        <div className="h-7 w-20 rounded bg-muted animate-pulse" aria-hidden="true" />
      ) : (
        <div className="flex items-baseline gap-2">
          <p className="text-xl font-bold tabular-nums text-foreground leading-none">{value}</p>
          {delta && <span className={cn("text-[11px] font-semibold tabular-nums", deltaColor[deltaTone])}>{delta}</span>}
        </div>
      )}
      {help && !loading && <p className="text-[10px] text-muted-foreground/70 mt-1 leading-tight">{help}</p>}
    </div>
  );
}

export default KpiCard;
