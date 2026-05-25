/**
 * ai-ticket-triage — classifica ticket de suporte com Claude
 * Trigger: chamado por DB trigger ao criar support_ticket
 * Body: { ticket_id: string }
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
    const { ticket_id } = await req.json();
    if (!ticket_id) return new Response(JSON.stringify({ error: "ticket_id obrigatório" }), { status: 400, headers: corsHeaders });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: ticket } = await admin.from("support_tickets").select("subject, description").eq("id", ticket_id).single();
    if (!ticket) return new Response(JSON.stringify({ error: "ticket not found" }), { status: 404, headers: corsHeaders });

    const prompt = `Classifique o ticket de suporte abaixo. Responda APENAS em JSON válido com 3 chaves:
- summary: resumo de UMA linha (até 100 chars)
- category: uma de [pagamento, agendamento, tecnico, medico, conta, outro]
- priority: uma de [baixa, normal, alta, urgente]

Critérios de prioridade:
- urgente: dor, emergência médica, falha em consulta ao vivo
- alta: pagamento errado, médico não compareceu
- normal: dúvidas, agendamento futuro
- baixa: feedback, sugestões

Ticket:
Assunto: ${ticket.subject}
Descrição: ${ticket.description ?? ""}

JSON:`;

    let result = { summary: ticket.subject?.slice(0, 100) ?? "", category: "outro", priority: "normal" };
    try {
      const raw = await callClaude({ model: FAST_CLAUDE_MODEL, system: "Você é um classificador de tickets. Responda apenas JSON.", messages: [{ role: "user", content: prompt }], temperature: 0.1, max_tokens: 200 });
      const match = raw?.match(/\{[\s\S]*\}/);
      if (match) result = { ...result, ...JSON.parse(match[0]) };
    } catch (e) { console.warn("[ai-ticket-triage] LLM failed", e); }

    await admin.from("support_tickets").update({
      ai_summary: result.summary,
      ai_category_suggested: result.category,
      ai_priority_suggested: result.priority,
      ai_triaged_at: new Date().toISOString(),
      // Se prioridade vazia ou normal, aplica sugestão da IA
      priority: result.priority === "urgente" ? "high" : result.priority === "alta" ? "high" : result.priority === "baixa" ? "low" : "normal",
    }).eq("id", ticket_id);

    return new Response(JSON.stringify({ ok: true, ...result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[ai-ticket-triage]", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: corsHeaders });
  }
});