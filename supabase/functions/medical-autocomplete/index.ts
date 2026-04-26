import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { callClaude, FAST_CLAUDE_MODEL } from "../_shared/anthropic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, field } = await req.json();

    if (!text || text.length < 5) {
      return new Response(JSON.stringify({ suggestion: "" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = field === "diagnosis"
      ? "Você é um assistente médico. Complete o diagnóstico médico abaixo com a continuação mais provável em português brasileiro. Responda APENAS com a continuação do texto, sem repetir o que já foi escrito. Máximo 50 palavras. Inclua CID-10 quando possível."
      : "Você é um assistente médico. Complete a anotação clínica abaixo em português brasileiro. Responda APENAS com a continuação natural do texto. Máximo 80 palavras. Use termos médicos adequados.";

    let suggestion = "";
    try {
      suggestion = (await callClaude({
        model: FAST_CLAUDE_MODEL,
        system: systemPrompt,
        messages: [{ role: "user", content: text }],
        max_tokens: 200,
        temperature: 0.3,
      })).trim();
    } catch (err: any) {
      if (err?.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("Anthropic error:", err);
      return new Response(JSON.stringify({ suggestion: "" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ suggestion }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("medical-autocomplete error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
