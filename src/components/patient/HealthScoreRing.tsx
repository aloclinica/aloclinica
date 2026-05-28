/**
 * Anel circular do score de saúde do paciente.
 * Mostra total grande no centro + componentes detalhados ao lado.
 */
import { useEffect, useState } from "react";
import { computeHealthScore, type HealthScoreBreakdown } from "@/lib/healthScore";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, AlertCircle, Heart } from "lucide-react";

interface Props {
  patientUserId: string;
}

const BAND_COLOR: Record<HealthScoreBreakdown["band"], { stroke: string; fg: string; bg: string; label: string }> = {
  alto:  { stroke: "hsl(150 60% 45%)", fg: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", label: "Alto" },
  medio: { stroke: "hsl(40 85% 55%)",  fg: "text-amber-600 dark:text-amber-400",     bg: "bg-amber-500/10",  label: "Médio" },
  baixo: { stroke: "hsl(0 70% 55%)",   fg: "text-destructive",                       bg: "bg-destructive/10",label: "Pode melhorar" },
};

export default function HealthScoreRing({ patientUserId }: Props) {
  const [data, setData] = useState<HealthScoreBreakdown | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientUserId) return;
    setLoading(true);
    computeHealthScore(patientUserId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [patientUserId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-5">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }
  if (!data) return null;

  const r = 52;
  const C = 2 * Math.PI * r;
  const pct = data.total / 100;
  const offset = C * (1 - pct);
  const color = BAND_COLOR[data.band];

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-col md:flex-row items-center gap-5">
          {/* Anel */}
          <div className="relative w-32 h-32 shrink-0">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
              <circle
                cx="60" cy="60" r={r}
                fill="none" stroke={color.stroke} strokeWidth="10" strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 800ms ease-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-black tabular-nums ${color.fg}`}>{data.total}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">/ 100</span>
            </div>
          </div>

          {/* Lado direito: badge + detalhamento */}
          <div className="flex-1 w-full min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 rounded-lg ${color.bg} flex items-center justify-center`}>
                <Heart className={`w-4 h-4 ${color.fg}`} />
              </div>
              <p className="text-sm font-semibold text-foreground">Score de saúde</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${color.bg} ${color.fg}`}>{color.label}</span>
            </div>
            <ul className="space-y-1">
              {data.components.map((c) => {
                const ok = c.got >= c.max * 0.5;
                const Icon = ok ? CheckCircle2 : AlertCircle;
                return (
                  <li key={c.key} className="flex items-center gap-2 text-xs">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${ok ? "text-emerald-500" : "text-muted-foreground/50"}`} aria-hidden="true" />
                    <span className={`flex-1 truncate ${ok ? "text-foreground" : "text-muted-foreground"}`}>{c.label}</span>
                    <span className={`tabular-nums text-[10px] ${ok ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>{c.got}/{c.max}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-3 pt-3 border-t border-border/40">
          Quanto maior, mais protegido. Atualize seus dados para subir.
        </p>
      </CardContent>
    </Card>
  );
}
