/**
 * auto-clinical-summary — gera resumo SOAP via IA após consulta concluída
 * Trigger: DB trigger trg_clinical_summary
 * Body: { appointment_id: string }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callClaude, FAST_CLAUDE_MODEL } from "../_shared/anthropic.ts";
import { safeEqual } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

/** Only the DB trigger (via invoke_edge_function) may call this. */
function internalAuthorized(req: Request): boolean {
  const secret = Deno.env.get("INTERNAL_FUNCTION_SECRET");
  return !!secret && safeEqual(req.headers.get("x-internal-secret"), secret);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (!internalAuthorized(req)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const { appointment_id } = await req.json();
    if (!appointment_id) return new Response(JSON.stringify({ error: "appointment_id obrigatório" }), { status: 400, headers: corsHeaders });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: appt } = await admin.from("appointments").select("id, notes, doctor_id, patient_id").eq("id", appointment_id).single();

    // O SOAP e gravado em appointment_notes (JSON). Fallback: appointments.notes (texto legado).
    let notesText = "";
    const { data: soap } = await admin.from("appointment_notes").select("content").eq("appointment_id", appointment_id).eq("type", "soap").maybeSingle();
    const c: any = (soap as any)?.content;
    if (c) {
      notesText = [
        c.subjective ? `Subjetivo: ${c.subjective}` : "",
        c.objective ? `Objetivo: ${c.objective}` : "",
        c.assessment ? `Avaliacao: ${c.assessment}` : "",
        c.plan ? `Plano: ${c.plan}` : "",
      ].filter(Boolean).join("\n");
    }
    if (!notesText && appt?.notes) notesText = String(appt.notes);
    if (!notesText) {
      return new Response(JSON.stringify({ ok: false, reason: "no_notes" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const summary = await callClaude({
      model: FAST_CLAUDE_MODEL,
      system: "Você é um assistente médico. Gere um resumo SOAP estruturado (Subjetivo, Objetivo, Avaliação, Plano) a partir das notas. Seja conciso e técnico — destinado ao médico para arquivo. Máximo 300 palavras.",
      messages: [{ role: "user", content: `Notas da consulta:\n${notesText}` }],
      temperature: 0.2,
      max_tokens: 800,
    });

    await admin.from("appointments").update({
      ai_clinical_summary: summary ?? null,
      ai_summary_generated_at: new Date().toISOString(),
    }).eq("id", appointment_id);

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[auto-clinical-summary]", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: corsHeaders });
  }
});