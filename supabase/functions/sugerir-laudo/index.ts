import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callClaude } from "../_shared/anthropic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tipo_exame, contexto } = await req.json();
    if (!tipo_exame) {
      return new Response(JSON.stringify({ error: "tipo_exame é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Você é um médico radiologista experiente. Gere um modelo de laudo médico em HTML formatado para o tipo de exame solicitado. 
O laudo deve conter as seguintes seções em tags HTML (h2, p, ul/li):
1. <h2>INDICAÇÃO CLÍNICA</h2>
2. <h2>TÉCNICA</h2>  
3. <h2>ACHADOS</h2> — com descrição detalhada dos achados normais esperados
4. <h2>IMPRESSÃO DIAGNÓSTICA</h2>
Use formatação HTML limpa (h2, h3, p, ul, li, strong, em). Não use tags html/head/body. Retorne APENAS o HTML do laudo, sem explicações.`;

    const userPrompt = contexto
      ? `Gere um laudo modelo para: ${tipo_exame}. Contexto clínico: ${contexto}`
      : `Gere um laudo modelo para: ${tipo_exame}`;

    let sugestao = "";
    try {
      sugestao = await callClaude({
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        temperature: 0.3,
        max_tokens: 2000,
      });
    } catch (err: any) {
      if (err?.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido. Tente novamente em alguns instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("Anthropic error:", err);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ sugestao }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("sugerir-laudo error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
