import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCaller } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Name-ownership helpers: normalize to accent-free uppercase significant tokens and
// require >=2 tokens in common. Used to confirm a valid CRM actually belongs to the
// registrant (anti-impersonation), not just that the number exists and is regular.
const NAME_STOPWORDS = new Set(["DOS", "DAS", "DES", "JR", "FILHO", "NETO", "JUNIOR"]);
function nameTokens(s: string): string[] {
  return (s || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toUpperCase().replace(/[^A-Z\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !NAME_STOPWORDS.has(t));
}
function namesMatch(a: string, b: string): boolean {
  const ta = new Set(nameTokens(a));
  const tb = nameTokens(b);
  if (ta.size === 0 || tb.length === 0) return false;
  return tb.filter((t) => ta.has(t)).length >= 2;
}

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

    const { crm, uf, doctor_profile_id, tipo } = await req.json();

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

    // Query consultacrm.com.br API. `tipo` = conselho (crm, cro, crp, crn, crea,
    // cau, oab). Default crm (médico) para compatibilidade com chamadas antigas.
    const councilTipo = String(tipo || "crm").toLowerCase();
    const apiUrl = `https://www.consultacrm.com.br/api/index.php?tipo=${encodeURIComponent(councilTipo)}&uf=${encodeURIComponent(uf)}&q=${encodeURIComponent(crm)}&chave=${encodeURIComponent(apiKey)}&destino=json`;

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

    // name_match: null = não aplicável/não checado; true/false quando há doctor_profile_id.
    let nameMatch: boolean | null = null;

    // If doctor_profile_id is provided and CRM is valid, auto-update the DB.
    // This write marks a doctor as CRM-verified, so it requires an admin caller.
    // (The pre-signup lookup path omits doctor_profile_id and stays public.)
    if (doctor_profile_id && isValid) {
      const caller = await getCaller(req);
      if (!caller.isAdmin) {
        return new Response(
          JSON.stringify({ error: "Apenas administradores podem marcar CRM como verificado." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceKey);

      // OWNERSHIP: o nome do titular do CRM precisa bater com o nome do cadastro do
      // médico antes de marcar como verificado. Um CRM válido e regular que pertence
      // a OUTRA pessoa NÃO pode auto-verificar (impostor). Em divergência, retorna
      // aviso e deixa crm_verified intacto — o admin ainda pode confirmar por outros
      // meios e marcar manualmente.
      const { data: dp } = await supabase
        .from("doctor_profiles").select("user_id").eq("id", doctor_profile_id).maybeSingle();
      let profileName = "";
      if (dp?.user_id) {
        const { data: pr } = await supabase
          .from("profiles").select("first_name,last_name").eq("user_id", dp.user_id).maybeSingle();
        profileName = `${pr?.first_name ?? ""} ${pr?.last_name ?? ""}`.trim();
      }
      nameMatch = !!doctorInfo?.nome && !!profileName && namesMatch(doctorInfo.nome, profileName);

      if (!nameMatch) {
        return new Response(
          JSON.stringify({
            found,
            valid: isValid,
            doctor: doctorInfo,
            name_match: false,
            message: "O nome do titular do CRM não confere com o cadastro do médico. Verificação manual necessária: o CRM NÃO foi marcado como verificado.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

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
        name_match: nameMatch,
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
