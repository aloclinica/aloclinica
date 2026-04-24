import { ReactNode } from "react";
import { motion } from "framer-motion";
import { LucideIcon, Inbox, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

/* ─────────────────────────────────────────────────────────────────
   Standardized loading / empty / error blocks for admin subpages.
   Use these to replace ad-hoc shimmer divs and "Nenhum X" texts.
   ───────────────────────────────────────────────────────────────── */

// ─── Loading ──────────────────────────────────────────────────────

interface AdminLoadingProps {
  /** Variant of skeleton to render */
  variant?: "cards" | "table" | "list";
  /** Number of skeleton items */
  count?: number;
  className?: string;
}

export const AdminLoading = ({
  variant = "cards",
  count = 4,
  className,
}: AdminLoadingProps) => {
  if (variant === "table") {
    return (
      <div className={cn("rounded-xl border border-border/60 overflow-hidden bg-card/50", className)}>
        <Table>
          <TableBody>
            {Array.from({ length: count }).map((_, i) => (
              <TableRow key={i} className="border-b border-border/30">
                {Array.from({ length: 5 }).map((__, j) => (
                  <TableCell key={j} className="py-3">
                    <Skeleton className="h-4 w-full max-w-[160px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-card/40"
          >
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  // cards (default)
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-12 w-12 rounded-full shrink-0" />
              <div className="flex-1 space-y-2.5">
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="h-3 w-3/5" />
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Skeleton className="h-8 w-24 rounded-md" />
                <Skeleton className="h-8 w-24 rounded-md" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// ─── Empty ────────────────────────────────────────────────────────

interface AdminEmptyProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  /** Tailwind gradient classes for the icon tile */
  accent?: string;
  className?: string;
}

export const AdminEmpty = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  accent = "from-muted to-muted",
  className,
}: AdminEmptyProps) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
    className={cn(
      "flex flex-col items-center justify-center text-center px-6 py-14 rounded-2xl border border-dashed border-border/60 bg-card/40",
      className
    )}
  >
    <div
      className={cn(
        "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-sm",
        accent
      )}
    >
      <Icon className="w-6 h-6 text-muted-foreground" />
    </div>
    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    {description && (
      <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">
        {description}
      </p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </motion.div>
);

// ─── Error ────────────────────────────────────────────────────────

interface AdminErrorProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export const AdminError = ({
  title = "Não foi possível carregar",
  description = "Tente novamente em instantes. Se o problema persistir, contate o suporte.",
  onRetry,
  className,
}: AdminErrorProps) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
    className={cn(
      "flex flex-col items-center justify-center text-center px-6 py-12 rounded-2xl border border-rose-500/20 bg-rose-500/5",
      className
    )}
  >
    <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-4">
      <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
    </div>
    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">
      {description}
    </p>
    {onRetry && (
      <Button
        variant="outline"
        size="sm"
        className="mt-4 h-8 gap-1.5 border-rose-500/30 text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
        onClick={onRetry}
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Tentar novamente
      </Button>
    )}
  </motion.div>
);
