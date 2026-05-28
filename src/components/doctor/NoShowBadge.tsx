/**
 * Badge de risco de no-show ao lado do horário do paciente.
 * Acende um tooltip com os motivos quando o score é médio/alto.
 */
import { useEffect, useState } from "react";
import { computeNoShowRisk, type NoShowRisk } from "@/lib/noShowRisk";
import { AlertTriangle, Loader2 } from "lucide-react";

interface Props {
  appointmentId: string;
  patientId: string;
  scheduledAt: string;
  paymentStatus?: string | null;
  createdAt?: string | null;
}

export default function NoShowBadge({ appointmentId, patientId, scheduledAt, paymentStatus, createdAt }: Props) {
  const [risk, setRisk] = useState<NoShowRisk | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let off = false;
    setLoading(true);
    computeNoShowRisk({ id: appointmentId, patient_id: patientId, scheduled_at: scheduledAt, payment_status: paymentStatus, created_at: createdAt })
      .then((r) => { if (!off) setRisk(r); })
      .finally(() => { if (!off) setLoading(false); });
    return () => { off = true; };
  }, [appointmentId, patientId, scheduledAt, paymentStatus, createdAt]);

  if (loading) return <Loader2 className="w-3 h-3 animate-spin text-muted-foreground/70" aria-label="Calculando risco de no-show" />;
  if (!risk || risk.band === "baixo") return null;

  const style = risk.band === "alto"
    ? { wrap: "bg-destructive/15 text-destructive", label: "Alto risco" }
    : { wrap: "bg-amber-500/15 text-amber-700 dark:text-amber-400", label: "Médio risco" };

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${style.wrap}`}
      title={`Risco de não comparecimento ${Math.round(risk.score * 100)}%${risk.reasons.length ? `\n• ${risk.reasons.join("\n• ")}` : ""}`}
      aria-label={`${style.label} de no-show (${Math.round(risk.score * 100)}%)`}
    >
      <AlertTriangle className="w-2.5 h-2.5" /> {style.label}
    </span>
  );
}
