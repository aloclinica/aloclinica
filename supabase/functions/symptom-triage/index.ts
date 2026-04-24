import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { symptoms } = await req.json();
    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    if (!DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY não configurada");

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
            content: `Você é um assistente de triagem médica da plataforma AloClínica. Com base nos sintomas descritos pelo paciente, sugira UMA especialidade médica adequada. Responda APENAS em JSON válido com este formato:
{"specialty": "nome da especialidade", "reason": "explicação curta de 1-2 frases", "urgency": "low|medium|high"}

Especialidades disponíveis: Clínico Geral, Dermatologia, Ortopedia, Neurologia, Cardiologia, Endocrinologia, Oftalmologia, Pediatria.
Se não conseguir determinar, sugira Clínico Geral.
NUNCA faça diagnóstico. Apenas sugira a especialidade mais adequada.`,
          },
          {
            role: "user",
            content: `Sintomas do paciente: ${symptoms}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("DeepSeek error:", response.status, t);
      throw new Error("DeepSeek API error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    let result;
    try {
      // Try to parse JSON from the response content
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { specialty: "Clínico Geral", reason: "Recomendamos uma avaliação geral.", urgency: "low" };
    } catch {
      result = { specialty: "Clínico Geral", reason: "Recomendamos uma avaliação geral.", urgency: "low" };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Triage error:", error);
    return new Response(JSON.stringify({ 
      specialty: "Clínico Geral", 
      reason: "Recomendamos uma avaliação geral com um clínico.", 
      urgency: "low" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
