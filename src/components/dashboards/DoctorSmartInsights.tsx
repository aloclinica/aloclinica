import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, AlertTriangle, TrendingUp, Coffee, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Insight {
  id: string;
  type: "alert" | "tip" | "celebration" | "info";
  icon: React.ReactNode;
  message: string;
}

interface Props {
  waitingCount: number;
  todayTotal: number;
  done: number;
  inProgress: number;
  rating?: number;
  hasNoCrm?: boolean;
}

const styleByType = {
  alert:       "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 border-amber-500/20",
  tip:         "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 border-blue-500/20",
  celebration: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 border-emerald-500/20",
  info:        "bg-muted/40 text-foreground border-border/30",
};

const DoctorSmartInsights = memo(({ waitingCount, todayTotal, done, inProgress, rating }: Props) => {
  const insights = useMemo<Insight[]>(() => {
    const list: Insight[] = [];
    const hour = new Date().getHours();

    if (waitingCount >= 3) {
      list.push({
        id: "queue-high",
        type: "alert",
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
        message: `Fila com ${waitingCount} pacientes — considere acelerar atendimentos`,
      });
    }

    if (todayTotal > 0 && done === todayTotal) {
      list.push({
        id: "all-done",
        type: "celebration",
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        message: "Todas as consultas de hoje concluídas. Excelente!",
      });
    } else if (todayTotal >= 8) {
      list.push({
        id: "busy-day",
        type: "tip",
        icon: <TrendingUp className="h-3.5 w-3.5" />,
        message: `Dia cheio: ${todayTotal} consultas. Lembre-se de pausar entre elas`,
      });
    }

    if (rating && rating >= 4.8) {
      list.push({
        id: "high-rating",
        type: "celebration",
        icon: <Sparkles className="h-3.5 w-3.5" />,
        message: `Avaliação ${rating.toFixed(1)}★ — pacientes adoram seu atendimento`,
      });
    }

    if (hour >= 12 && hour < 14 && inProgress === 0 && waitingCount === 0) {
      list.push({
        id: "lunch",
        type: "info",
        icon: <Coffee className="h-3.5 w-3.5" />,
        message: "Janela boa para almoço — sem consultas em andamento",
      });
    }

    if (list.length === 0) {
      list.push({
        id: "default",
        type: "tip",
        icon: <Sparkles className="h-3.5 w-3.5" />,
        message: "Mantenha o status online para receber consultas de pronto-atendimento",
      });
    }

    return list.slice(0, 3);
  }, [waitingCount, todayTotal, done, inProgress, rating]);

  return (
    <div className="flex flex-wrap gap-2">
      {insights.map((ins, i) => (
        <motion.div
          key={ins.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.06, duration: 0.3 }}
          className={cn(
            "flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11.5px] font-semibold",
            styleByType[ins.type]
          )}
        >
          {ins.icon}
          <span>{ins.message}</span>
        </motion.div>
      ))}
    </div>
  );
});

DoctorSmartInsights.displayName = "DoctorSmartInsights";
export default DoctorSmartInsights;