import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * validate-council — wrapper genérico de validação de conselho profissional.
 *
 * Hoje só CRM tem API automatizada (consultacrm via edge `verify-crm`).
 * Para os demais conselhos retornamos `manual_review` — a equipe AloClínica
 * confere o documento enviado no upload de cadastro.
 */

type CouncilType =
  | "CRM" | "CRP" | "CRN" | "CRFa" | "CREFITO" | "COREN"
  | "CRO" | "CRBM" | "CRF" | "CREF" | "CRESS" | "CRTR" | "OUTRO";

const COUNCIL_NAMES: Record<CouncilType, string> = {
  CRM: "Conselho Federal de Medicina",
  CRP: "Conselho Federal de Psicologia",
  CRN: "Conselho Federal de Nutricionistas",
  CRFa: "Conselho Federal de Fonoaudiologia",
  CREFITO: "Conselho Federal de Fisioterapia e Terapia Ocupacional",
  COREN: "Conselho Federal de Enfermagem",
  CRO: "Conselho Federal de Odontologia",
  CRBM: "Conselho Federal de Biomedicina",
  CRF: "Conselho Federal de Farmácia",
  CREF: "Conselho Federal de Educação Física",
  CRESS: "Conselho Federal de Serviço Social",
  CRTR: "Conselho Federal de Terapia",
  OUTRO: "Outro conselho",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { council_type, number, uf } = await req.json();

    if (!council_type || !number || !uf) {
      return new Response(
        JSON.stringify({ error: "council_type, number e uf são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const type = String(council_type).toUpperCase() as CouncilType;
    const cleanNumber = String(number).replace(/\D/g, "");
    const cleanUf = String(uf).toUpperCase();

    // CRM → delega para verify-crm (consultacrm)
    if (type === "CRM") {
      const projectRef = Deno.env.get("SUPABASE_URL")?.match(/https?:\/\/([^.]+)/)?.[1];
      const verifyUrl = `https://${projectRef}.functions.supabase.co/verify-crm`;
      const r = await fetch(verifyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: req.headers.get("Authorization") ?? "",
          apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        },
        body: JSON.stringify({ crm: cleanNumber, uf: cleanUf }),
      });
      const data = await r.json().catch(() => ({}));
      return new Response(JSON.stringify({
        council_type: type,
        council_name: COUNCIL_NAMES[type],
        ...data,
        mode: "automatic",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Outros conselhos → validação manual pela equipe
    return new Response(JSON.stringify({
      council_type: type,
      council_name: COUNCIL_NAMES[type] ?? "Conselho profissional",
      found: false,
      valid: false,
      mode: "manual_review",
      message: `Validação automática indisponível para ${type}. A equipe AloClínica fará a conferência manual em até 24h após o envio dos documentos.`,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("validate-council error:", err);
    return new Response(
      JSON.stringify({ error: err.message ?? "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});