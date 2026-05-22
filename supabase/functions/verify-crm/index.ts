import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function checkRateLimit(identifier: string, endpoint: string, maxReqs: number, windowMin: number): Promise<boolean> {
  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const since = new Date(Date.now() - windowMin * 60000).toISOString();
    const { count } = await sb.from("rate_limits").select("id", { count: "exact", head: true })
      .eq("identifier", identifier).eq("endpoint", endpoint).gte("window_start", since);
    if ((count ?? 0) >= maxReqs) return false;
    await sb.from("rate_limits").insert({ identifier, endpoint, window_start: new Date().toISOString() });
    return true;
  } catch { return true; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limit: 10 verifications per 10 minutes per IP
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const allowed = await checkRateLimit(clientIP, "verify-crm", 10, 10);
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Muitas verificações. Aguarde." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { crm, uf, doctor_profile_id } = await req.json();

    if (!crm || !uf) {
      return new Response(
        JSON.stringify({ error: "CRM e UF são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("CONSULTA_CRM_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "CONSULTA_CRM_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Query consultacrm.com.br API
    const apiUrl = `https://www.consultacrm.com.br/api/index.php?tipo=crm&uf=${encodeURIComponent(uf)}&q=${encodeURIComponent(crm)}&chave=${encodeURIComponent(apiKey)}&destino=json`;

    const apiResponse = await fetch(apiUrl);
    const rawText = await apiResponse.text();
    let apiData: any = null;
    try {
      apiData = JSON.parse(rawText);
    } catch {
      // API externa retornou texto (ex.: "Chave API inválida") — degrada para análise manual
      console.warn("verify-crm: resposta não-JSON da API externa:", rawText.slice(0, 200));
      return new Response(
        JSON.stringify({
          found: false,
          valid: false,
          doctor: null,
          message: "Não foi possível verificar agora — análise manual será feita pela equipe.",
          upstream_error: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!apiResponse.ok) {
      return new Response(
        JSON.stringify({
          found: false,
          valid: false,
          doctor: null,
          message: "Não foi possível verificar agora — análise manual.",
          upstream_error: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // The API returns an object with "item" array
    const items = apiData?.item ?? apiData?.items ?? [];
    const found = Array.isArray(items) && items.length > 0;

    let doctorInfo = null;
    let isValid = false;

    if (found) {
      const doctor = items[0];
      doctorInfo = {
        nome: doctor.nome ?? doctor.name ?? null,
        crm: doctor.numero ?? doctor.crm ?? crm,
        uf: doctor.uf ?? uf,
        situacao: doctor.situacao ?? doctor.status ?? null,
        especialidades: doctor.especialidade ?? doctor.especialidades ?? null,
        tipo_inscricao: doctor.tipo ?? doctor.tipo_inscricao ?? null,
      };
      // CRM is valid if the situation is "Regular" or "Ativo"
      const situacao = (doctorInfo.situacao ?? "").toLowerCase();
      isValid = situacao.includes("regular") || situacao.includes("ativ");
    }

    // If doctor_profile_id is provided and CRM is valid, auto-update the DB
    if (doctor_profile_id && isValid) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceKey);

      await supabase.from("doctor_profiles").update({
        crm_verified: true,
        crm_verified_at: new Date().toISOString(),
      }).eq("id", doctor_profile_id);
    }

    return new Response(
      JSON.stringify({
        found,
        valid: isValid,
        doctor: doctorInfo,
        message: isValid
          ? "CRM válido e situação regular"
          : found
          ? "CRM encontrado mas situação irregular"
          : "CRM não encontrado na base de dados",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("verify-crm error:", error);
    return new Response(
      JSON.stringify({ error: error.message ?? "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
