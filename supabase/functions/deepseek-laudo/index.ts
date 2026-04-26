import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { callClaude } from "../_shared/anthropic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { raw_text, exam_type, mode } = await req.json();

    let systemPrompt = "";

    if (mode === "improve") {
      systemPrompt = `Você é um assistente de redação médica radiológica. Melhore o texto do laudo abaixo:
- Corrija erros gramaticais e de terminologia
- Melhore a clareza e a objetividade
- Mantenha a estrutura existente
- NÃO altere os achados clínicos
- NÃO invente informações novas
- Tipo de exame: ${exam_type || "Não especificado"}`;
    } else if (mode === "suggest_conclusion") {
      systemPrompt = `Você é um radiologista assistente. Com base nos achados descritos, sugira uma CONCLUSÃO concisa e profissional.
- Use terminologia radiológica padrão
- Seja objetivo e direto
- Inclua classificações padronizadas quando aplicável (BIRADS, TIRADS, etc.)
- Tipo de exame: ${exam_type || "Não especificado"}`;
    } else {
      // Default: structure mode
      systemPrompt = `Você é um radiologista assistente especializado em laudos médicos brasileiros.

Sua tarefa é receber uma transcrição bruta de voz de um médico laudista e transformá-la em um laudo médico estruturado e profissional.

FORMATO OBRIGATÓRIO DO LAUDO:
**TÉCNICA:**
[Descrição da técnica utilizada]

**ACHADOS:**
[Achados detalhados, organizados por sistema/região anatômica]

**CONCLUSÃO:**
[Impressão diagnóstica objetiva]

REGRAS:
1. Corrija erros de transcrição e terminologia médica
2. Use terminologia radiológica padrão (BIRADS, TIRADS, Fleischner, etc. quando aplicável)
3. Organize os achados de forma lógica por região anatômica
4. Mantenha as medidas e valores citados pelo médico
5. Adicione "Sem alterações" para estruturas normais mencionadas
6. Use linguagem técnica formal (terceira pessoa, tempo presente)
7. NÃO invente achados que o médico não mencionou
8. Tipo de exame: ${exam_type || "Não especificado"}`;
    }

    let structured = "";
    try {
      structured = await callClaude({
        system: systemPrompt,
        messages: [{ role: "user", content: raw_text }],
        temperature: 0.2,
        max_tokens: 3000,
      });
    } catch (err: any) {
      if (err?.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Aguarde um momento." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Erro no serviço de IA");
    }

    return new Response(JSON.stringify({ structured_text: structured }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("deepseek-laudo error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
