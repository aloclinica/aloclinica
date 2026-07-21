// medication-reminder-tick — disparado periodicamente (pg_cron, ex.: a cada 10 min).
// Para cada lembrete ativo, se algum horario (BRT) caiu na ultima janela e ainda
// nao foi enviado hoje, cria uma notificacao no app (idempotente por last_sent_slot).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isInternalOrService } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (!isInternalOrService(req)) return json({ error: "Unauthorized" }, 401);

  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Hora atual em BRT (UTC-3).
    const brt = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const y = brt.getUTCFullYear();
    const mo = String(brt.getUTCMonth() + 1).padStart(2, "0");
    const d = String(brt.getUTCDate()).padStart(2, "0");
    const nowMin = brt.getUTCHours() * 60 + brt.getUTCMinutes();
    const WINDOW = 15; // minutos

    const { data: reminders } = await sb
      .from("medication_reminders")
      .select("id, patient_id, medication_name, dosage, times, last_sent_slot")
      .eq("active", true);

    let sent = 0;
    for (const r of reminders ?? []) {
      const times: string[] = Array.isArray((r as any).times) ? (r as any).times : [];
      for (const t of times) {
        const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(t);
        if (!m) continue;
        const tMin = Number(m[1]) * 60 + Number(m[2]);
        const slot = `${y}-${mo}-${d}T${t}`;
        if (nowMin >= tMin && nowMin < tMin + WINDOW && (r as any).last_sent_slot !== slot) {
          const dosage = (r as any).dosage ? ` (${(r as any).dosage})` : "";
          await sb.from("notifications").insert({
            user_id: (r as any).patient_id,
            type: "health",
            title: "💊 Hora do seu medicamento",
            message: `Está na hora de tomar ${(r as any).medication_name}${dosage}.`,
          } as any);
          await sb.from("medication_reminders").update({ last_sent_slot: slot, updated_at: new Date().toISOString() }).eq("id", (r as any).id);
          sent++;
          break; // um envio por lembrete por ciclo
        }
      }
    }

    return json({ ok: true, ran_at: new Date().toISOString(), sent });
  } catch (e) {
    console.error("[medication-reminder-tick]", e);
    return json({ error: (e as Error).message }, 500);
  }
});
