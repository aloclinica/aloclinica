/**
 * Score de saúde do paciente (0-100) — composto, transparente, sem ML.
 *
 * Cada componente tem peso fixo; o usuário entende exatamente o que
 * influencia. Inputs:
 *   - KYC aprovado            (10)
 *   - Perfil completo          (10) — telefone, CPF, data nasc, estado
 *   - Vitais recentes (90d)    (15)
 *   - Exame recente (12m)      (15)
 *   - Consulta recente (12m)   (15)
 *   - Sem faltas (6m)          (15)
 *   - Receita ativa renovada   (10)
 *   - Avaliação dada (NPS)     (10)
 */
import { db } from "@/integrations/supabase/untyped";

export interface HealthScoreBreakdown {
  total: number;
  band: "alto" | "medio" | "baixo";
  components: Array<{ key: string; label: string; max: number; got: number; hint: string }>;
}

const COMP = [
  { key: "kyc",        label: "Identidade verificada",   max: 10 },
  { key: "profile",    label: "Perfil completo",         max: 10 },
  { key: "vitals",     label: "Vitais recentes (90d)",   max: 15 },
  { key: "exam",       label: "Exame no último ano",     max: 15 },
  { key: "consult",    label: "Consulta no último ano",  max: 15 },
  { key: "no_no_show", label: "Sem faltas (6 meses)",    max: 15 },
  { key: "rx_active",  label: "Receita em dia",          max: 10 },
  { key: "nps",        label: "Avaliação enviada",       max: 10 },
] as const;

const DAY_MS = 86_400_000;

export async function computeHealthScore(patientUserId: string): Promise<HealthScoreBreakdown> {
  const now = Date.now();
  const since90 = new Date(now - 90 * DAY_MS).toISOString();
  const since180 = new Date(now - 180 * DAY_MS).toISOString();
  const since365 = new Date(now - 365 * DAY_MS).toISOString();

  const [profileRes, kycRes, vitalsRes, examsRes, apptsRes, missedRes, rxRes, npsRes] = await Promise.all([
    db.from("profiles").select("phone, cpf, date_of_birth, state, kyc_status").eq("user_id", patientUserId).maybeSingle(),
    db.from("kyc_verificacoes").select("status").eq("user_id", patientUserId).order("created_at", { ascending: false }).limit(1),
    db.from("health_metrics" as any).select("id").eq("user_id", patientUserId).gte("created_at", since90).limit(1),
    db.from("exam_requests").select("id, created_at").eq("patient_id", patientUserId).gte("created_at", since365).limit(1),
    db.from("appointments").select("id, status").eq("patient_id", patientUserId).gte("scheduled_at", since365).limit(50),
    db.from("appointments").select("id").eq("patient_id", patientUserId).eq("status", "no_show").gte("scheduled_at", since180).limit(1),
    db.from("prescriptions").select("id, valid_until, created_at").eq("patient_id", patientUserId).order("created_at", { ascending: false }).limit(3),
    db.from("satisfaction_surveys" as any).select("id").eq("patient_id", patientUserId).limit(1),
  ]);

  const got: Record<string, number> = {};
  const hints: Record<string, string> = {};

  // KYC
  const kycOk = profileRes.data?.kyc_status === "approved"
    || (kycRes.data?.[0]?.status === "approved" || kycRes.data?.[0]?.status === "aprovado");
  got.kyc = kycOk ? 10 : 0;
  hints.kyc = kycOk ? "Verificado" : "Conclua sua verificação biométrica";

  // Perfil completo
  const p: any = profileRes.data ?? {};
  const profileScore = [p.phone, p.cpf, p.date_of_birth, p.state].filter(Boolean).length;
  got.profile = Math.round((profileScore / 4) * 10);
  hints.profile = profileScore === 4 ? "100% preenchido" : `Falta(m) ${4 - profileScore} campo(s) no perfil`;

  // Vitais
  got.vitals = (vitalsRes.data && vitalsRes.data.length > 0) ? 15 : 0;
  hints.vitals = got.vitals ? "Atualizado" : "Registre pressão, peso ou glicemia nos últimos 90 dias";

  // Exame no último ano
  got.exam = (examsRes.data && examsRes.data.length > 0) ? 15 : 0;
  hints.exam = got.exam ? "OK" : "Faça check-up anual";

  // Consulta no último ano (qualquer status)
  const recentConsultations = apptsRes.data ?? [];
  got.consult = recentConsultations.length > 0 ? 15 : 0;
  hints.consult = got.consult ? "OK" : "Agende uma consulta de rotina";

  // Sem faltas (180d)
  got.no_no_show = (missedRes.data && missedRes.data.length > 0) ? 0 : 15;
  hints.no_no_show = got.no_no_show ? "OK" : "Sem faltas é importante — cancele com antecedência";

  // Receita em dia
  const rxValid = (rxRes.data ?? []).some((r: any) => {
    if (!r.valid_until) return false;
    return new Date(r.valid_until).getTime() >= now;
  });
  got.rx_active = rxValid ? 10 : 0;
  hints.rx_active = rxValid ? "Receita vigente" : "Renove sua receita se ainda usa";

  // NPS
  got.nps = (npsRes.data && npsRes.data.length > 0) ? 10 : 0;
  hints.nps = got.nps ? "Obrigado pela avaliação" : "Avalie uma consulta para nos ajudar";

  const components = COMP.map((c) => ({
    key: c.key,
    label: c.label,
    max: c.max,
    got: got[c.key] ?? 0,
    hint: hints[c.key] ?? "",
  }));
  const total = components.reduce((s, c) => s + c.got, 0);
  const band: HealthScoreBreakdown["band"] = total >= 75 ? "alto" : total >= 50 ? "medio" : "baixo";
  return { total, band, components };
}
