// patient-nudges — disparado periodicamente por pg_cron (recomendado: 1x/dia, 12:00 UTC).
//
// Cria NUDGES PROATIVOS (notificações in-app) para o paciente, de forma IDEMPOTENTE
// (não re-notifica a mesma coisa em execuções seguintes):
//
//   1. Retorno grátis fechando  — appointments.return_deadline nos próximos 2 dias (ainda futuro).
//      Idempotência: usa a própria tabela `notifications` como ledger (link determinístico
//      por appointment). Se já existe um nudge com aquele link, pula.
//
//   2. Receita perto de vencer  — prescriptions.valid_until nos próximos 3 dias (não vencida).
//      Idempotência: campo dedicado `renewal_alerted_at` (compartilhado com o alerta de
//      renovação já existente no banco → nunca duplica com aquele fluxo). Marca após notificar.
//
//   3. Resultado de exame        — SKIPPED de propósito. A tabela `patient_documents` não tem
//      sinal limpo de "enviado pelo médico/clínica E ainda não visto pelo paciente":
//      não existe flag de visto/notificado, e o schema é ambíguo (o app insere
//      uploaded_by/category/file_type — inclusive uploads DO PRÓPRIO paciente com category='exam' —
//      enquanto os tipos gerados mostram doctor_id/document_type/mime_type). Sem idempotência
//      limpa, a regra do produto é NÃO fazer spam. Ver README/relatório para reativar com segurança.
//
// Segurança: cron/internal-only. Protegido em código por isInternalOrService() — um chamador
// público/anon é rejeitado com 401 mesmo que o gateway deixe passar (verify_jwt=false).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isInternalOrService } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

const DAY_MS = 86_400_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  // SECURITY: cron/internal-only — reject public callers (anon key is public).
  if (!isInternalOrService(req)) return json({ error: "Unauthorized" }, 401);

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const now = Date.now();

  let returns_notified = 0;
  let rx_notified = 0;
  const exams_notified = 0; // nudge 3 intencionalmente desativado (ver cabeçalho)

  try {
    // ───────────────────────────────────────────────────────────────────────
    // 1. RETORNO GRÁTIS FECHANDO
    //    return_deadline nos próximos 2 dias e ainda no futuro.
    //    Idempotência via ledger: link determinístico por (doctor_id, appointment_id).
    // ───────────────────────────────────────────────────────────────────────
    try {
      const nowIso = new Date(now).toISOString();
      const in2dIso = new Date(now + 2 * DAY_MS).toISOString();

      const { data: appts, error: apptErr } = await sb
        .from("appointments")
        .select("id, patient_id, doctor_id, return_deadline")
        .eq("status", "completed")
        .not("return_deadline", "is", null)
        .gt("return_deadline", nowIso)
        .lte("return_deadline", in2dIso);
      if (apptErr) throw apptErr;

      const rows = (appts ?? []).filter((a: any) => a.patient_id && a.doctor_id);

      // Resolve nome do médico em lote (doctor_profiles.id → user_id → profiles).
      const docNameById = new Map<string, string>();
      const doctorIds = [...new Set(rows.map((a: any) => a.doctor_id))];
      if (doctorIds.length > 0) {
        const { data: dps } = await sb.from("doctor_profiles").select("id, user_id").in("id", doctorIds);
        const userIds = [...new Set((dps ?? []).map((d: any) => d.user_id).filter(Boolean))];
        const { data: profs } = userIds.length
          ? await sb.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds)
          : { data: [] as any[] };
        const nameByUser = new Map((profs ?? []).map((p: any) => [p.user_id, `Dr(a). ${p.first_name ?? ""} ${p.last_name ?? ""}`.trim()]));
        for (const d of dps ?? []) {
          const nm = nameByUser.get((d as any).user_id);
          if (nm) docNameById.set((d as any).id, nm);
        }
      }

      for (const a of rows as any[]) {
        const link = `/dashboard/schedule/${a.doctor_id}?return=true&original=${a.id}`;

        // Idempotência: já existe um nudge de retorno para este appointment?
        const { data: prior } = await sb
          .from("notifications")
          .select("id")
          .eq("user_id", a.patient_id)
          .eq("link", link)
          .limit(1);
        if (prior && prior.length > 0) continue;

        const daysLeft = Math.max(1, Math.ceil((new Date(a.return_deadline).getTime() - now) / DAY_MS));
        const drName = docNameById.get(a.doctor_id) ?? "seu médico";

        const { error: insErr } = await sb.from("notifications").insert({
          user_id: a.patient_id,
          type: "appointment",
          title: "🩺 Seu retorno com desconto está fechando",
          message: `O prazo do retorno com ${drName} expira em ${daysLeft} dia${daysLeft > 1 ? "s" : ""}. Reagende agora e garanta o desconto antes que ele expire.`,
          link,
        } as any);
        if (insErr) { console.warn("[patient-nudges] retorno insert falhou:", insErr.message); continue; }
        returns_notified++;
      }
    } catch (e) {
      console.error("[patient-nudges] bloco retorno:", (e as Error).message);
    }

    // ───────────────────────────────────────────────────────────────────────
    // 2. RECEITA PERTO DE VENCER
    //    valid_until nos próximos 3 dias e não vencida.
    //    Idempotência via campo dedicado renewal_alerted_at (compartilhado com o
    //    alerta de renovação de receita contínua já existente no banco).
    // ───────────────────────────────────────────────────────────────────────
    try {
      const nowIso = new Date(now).toISOString();
      const in3dIso = new Date(now + 3 * DAY_MS).toISOString();

      const { data: rxs, error: rxErr } = await sb
        .from("prescriptions")
        .select("id, patient_id, valid_until, renewal_alerted_at")
        .not("valid_until", "is", null)
        .is("renewal_alerted_at", null)
        .gt("valid_until", nowIso)
        .lte("valid_until", in3dIso);
      if (rxErr) throw rxErr;

      for (const r of (rxs ?? []) as any[]) {
        if (!r.patient_id) continue;

        const daysLeft = Math.max(1, Math.ceil((new Date(r.valid_until).getTime() - now) / DAY_MS));
        const link = `/dashboard/paciente/prescriptions?renew=${r.id}`;

        const { error: insErr } = await sb.from("notifications").insert({
          user_id: r.patient_id,
          type: "prescription",
          title: "💊 Sua receita está perto de vencer",
          message: `Sua receita vence em ${daysLeft} dia${daysLeft > 1 ? "s" : ""}. Solicite a renovação com 1 clique para não ficar sem o tratamento.`,
          link,
        } as any);
        if (insErr) { console.warn("[patient-nudges] receita insert falhou:", insErr.message); continue; }

        // Marca como alertada (idempotência). Guard renewal_alerted_at IS NULL evita corrida.
        await sb
          .from("prescriptions")
          .update({ renewal_alerted_at: new Date().toISOString() } as any)
          .eq("id", r.id)
          .is("renewal_alerted_at", null);
        rx_notified++;
      }
    } catch (e) {
      console.error("[patient-nudges] bloco receita:", (e as Error).message);
    }

    // ───────────────────────────────────────────────────────────────────────
    // 3. RESULTADO DE EXAME — SKIPPED (ver cabeçalho). Sem sinal de idempotência limpo.
    // ───────────────────────────────────────────────────────────────────────

    console.info(`[patient-nudges] returns=${returns_notified} rx=${rx_notified} exams=${exams_notified} (exams: skipped)`);
    return json({ ok: true, ran_at: new Date(now).toISOString(), returns_notified, rx_notified, exams_notified, exams_skipped: true });
  } catch (e) {
    console.error("[patient-nudges]", (e as Error).message);
    return json({ error: (e as Error).message, returns_notified, rx_notified, exams_notified }, 500);
  }
});
