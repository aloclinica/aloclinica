/**
 * Sticky imminent-consultation strip.
 * Mostra-se quando há consulta nos próximos 60 min.
 * Funciona para paciente (CTA "Entrar na sala") e médico ("Atender paciente").
 * Countdown ao vivo, cor escala de calma → urgente conforme proximidade.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { differenceInSeconds } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Appt {
  id: string;
  scheduled_at: string;
  doctor_name?: string;
  patient_name?: string;
  status?: string;
  specialty?: string;
}

interface Props {
  appt: Appt | null | undefined;
  role: "patient" | "doctor";
  /** Mostrar somente quando faltarem ≤ N min. Default 60. */
  thresholdMin?: number;
}

function formatRemaining(secs: number) {
  if (secs <= 0) return "agora";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}h ${rm.toString().padStart(2, "0")}m`;
  }
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

const ImminentConsultationBar = ({ appt, role, thresholdMin = 60 }: Props) => {
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!appt?.scheduled_at) return null;

  const scheduled = new Date(appt.scheduled_at);
  const diffSec = differenceInSeconds(scheduled, now);
  const diffMin = Math.ceil(diffSec / 60);
  const isWaiting = appt.status === "waiting" || appt.status === "in_progress";

  // Mostrar somente perto do horário ou quando paciente já está na sala
  if (!isWaiting && (diffMin > thresholdMin || diffSec < -900)) return null;

  // Tier de urgência: verde > 15min · âmbar 5–15min · vermelho < 5min ou em andamento
  const tier =
    isWaiting || diffSec <= 0 ? "live" : diffMin <= 5 ? "hot" : diffMin <= 15 ? "warm" : "calm";

  const palette = {
    calm: { bg: "bg-emerald-500", text: "text-white", btn: "bg-white text-emerald-700 hover:bg-white/90" },
    warm: { bg: "bg-amber-500", text: "text-white", btn: "bg-white text-amber-700 hover:bg-white/90" },
    hot: { bg: "bg-rose-500", text: "text-white", btn: "bg-white text-rose-700 hover:bg-white/90" },
    live: { bg: "bg-emerald-600", text: "text-white", btn: "bg-white text-emerald-700 hover:bg-white/90" },
  }[tier];

  const counterpart =
    role === "patient"
      ? appt.doctor_name || "Seu médico"
      : appt.patient_name || "Próximo paciente";

  const ctaLabel = isWaiting || diffSec <= 60 ? "Entrar na sala" : "Ver detalhes";
  const ctaHref =
    role === "patient"
      ? `/dashboard/consultation/${appt.id}`
      : `/dashboard/doctor/waiting-room?appt=${appt.id}`;

  const headline =
    isWaiting
      ? role === "patient"
        ? "Sua consulta está pronta — entre agora"
        : "Paciente aguardando você"
      : diffSec <= 0
      ? "Sua consulta começa agora"
      : role === "patient"
      ? "Sua consulta começa em"
      : "Próximo paciente em";

  return (
    <AnimatePresence>
      <motion.div
        key={appt.id}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        className={cn(
          "sticky top-0 z-40 -mx-4 md:-mx-6 lg:-mx-8 mb-4 md:mb-5 rounded-none md:rounded-2xl px-4 py-3 md:px-5 md:py-3.5 shadow-lg backdrop-blur-sm flex items-center gap-3",
          palette.bg,
          palette.text,
        )}
      >
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 border border-white/20",
            tier === "hot" && "animate-pulse",
          )}
        >
          {tier === "live" || isWaiting ? (
            <Video className="w-5 h-5" />
          ) : (
            <Clock className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[11px] md:text-[12px] font-bold uppercase tracking-wider opacity-90">
            {headline}
          </p>
          <p className="text-[14px] md:text-[15px] font-extrabold leading-tight truncate">
            {isWaiting || diffSec <= 0 ? counterpart : (
              <>
                <span className="font-mono tabular-nums">{formatRemaining(Math.max(0, diffSec))}</span>
                <span className="opacity-90 font-bold"> · {counterpart}</span>
              </>
            )}
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => navigate(ctaHref)}
          className={cn(
            "shrink-0 h-9 rounded-full px-4 font-bold text-[12px] md:text-[13px] shadow-md",
            palette.btn,
          )}
        >
          {ctaLabel}
        </Button>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImminentConsultationBar;