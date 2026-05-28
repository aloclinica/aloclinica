/**
 * Risco de no-show heurístico (0–1) — sem ML.
 *
 * Composto explicável: histórico de faltas, antecedência do agendamento,
 * pagamento pendente, horário, recência de login. Cada componente tem
 * peso fixo; output é normalizado.
 */
import { db } from "@/integrations/supabase/untyped";

export interface NoShowFactors {
  past_no_show_rate: number;       // 0..1 (peso 0.4)
  long_lead_days: number;          // dias desde agendamento; >14 dias = penaliza (peso 0.2)
  payment_pending: boolean;        // (peso 0.2)
  off_hour: boolean;               // antes 8h ou depois 20h (peso 0.1)
  recent_login_days_ago: number;   // se >14 dias sem login = penaliza (peso 0.1)
}

export interface NoShowRisk {
  score: number;        // 0..1
  band: "alto" | "medio" | "baixo";
  factors: NoShowFactors;
  reasons: string[];
}

interface ApptInput {
  id: string;
  patient_id: string;
  scheduled_at: string;
  payment_status?: string | null;
  created_at?: string | null;
}

const DAY_MS = 86_400_000;

export async function computeNoShowRisk(appt: ApptInput): Promise<NoShowRisk> {
  // Histórico (últimos 12 meses)
  const since = new Date(Date.now() - 365 * DAY_MS).toISOString();
  const { data: history } = await db.from("appointments")
    .select("status")
    .eq("patient_id", appt.patient_id)
    .lt("scheduled_at", appt.scheduled_at)
    .gte("scheduled_at", since)
    .neq("id", appt.id)
    .limit(40);
  const total = (history ?? []).length;
  const noShows = (history ?? []).filter((a: any) => a.status === "no_show").length;
  const rate = total > 0 ? noShows / total : 0;

  // Lead time
  const leadDays = appt.created_at
    ? Math.max(0, (new Date(appt.scheduled_at).getTime() - new Date(appt.created_at).getTime()) / DAY_MS)
    : 0;
  const longLead = leadDays > 14;

  // Pagamento pendente
  const pending = ["pending", "failed", "expired", null, undefined, ""].includes(appt.payment_status as any);

  // Horário fora do confortável (8h–20h)
  const h = new Date(appt.scheduled_at).getHours();
  const offHour = h < 8 || h >= 20;

  // Última sessão do paciente (proxy: ainda não temos last_seen; uso created_at do user)
  const { data: u } = await db.from("profiles").select("updated_at").eq("user_id", appt.patient_id).maybeSingle();
  const lastTouch = (u as any)?.updated_at ? new Date((u as any).updated_at).getTime() : 0;
  const loginAgo = lastTouch ? Math.floor((Date.now() - lastTouch) / DAY_MS) : 60;

  const reasons: string[] = [];
  let score = 0;
  // Pesos
  score += rate * 0.4;
  if (total >= 3 && rate >= 0.34) reasons.push(`${Math.round(rate * 100)}% de faltas no histórico`);

  if (longLead) { score += 0.2; reasons.push(`Agendado com ${Math.round(leadDays)} dias de antecedência`); }
  if (pending)  { score += 0.2; reasons.push("Pagamento ainda pendente"); }
  if (offHour)  { score += 0.1; reasons.push("Horário fora do padrão (antes 8h ou depois 20h)"); }
  if (loginAgo > 14) { score += 0.1; reasons.push(`Sem atividade há ${loginAgo} dias`); }

  score = Math.min(1, Math.max(0, score));
  const band: NoShowRisk["band"] = score >= 0.6 ? "alto" : score >= 0.3 ? "medio" : "baixo";

  return {
    score,
    band,
    factors: { past_no_show_rate: rate, long_lead_days: leadDays, payment_pending: pending, off_hour: offHour, recent_login_days_ago: loginAgo },
    reasons,
  };
}
