import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { notes, diagnosis, medications } = await req.json();
    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    if (!DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY não configurada");

    const medsText = Array.isArray(medications)
      ? medications.map((m: Record<string, string>) => typeof m === "string" ? m : `${m.name || m.medication || ""} ${m.dosage || ""} ${m.instructions || ""}`).join("; ")
      : "";

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `Você é um assistente médico da plataforma AloClínica. Gere um resumo clínico em linguagem SIMPLES e acessível para o paciente (leigo). O resumo deve:
1. Explicar o que o médico encontrou (sem jargão)
2. Listar os medicamentos prescritos com orientações simples
3. Dar 2-3 recomendações gerais de cuidado
Seja empático, use linguagem acolhedora. Máximo 200 palavras. NÃO faça diagnósticos novos.`,
          },
          {
            role: "user",
            content: `Notas do médico: ${notes || "Não informado"}\nDiagnóstico: ${diagnosis || "Não informado"}\nMedicamentos: ${medsText || "Nenhum prescrito"}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("DeepSeek API error");
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || "Resumo indisponível no momento.";

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Clinical summary error:", error);
    return new Response(JSON.stringify({ error: "Não foi possível gerar o resumo." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
