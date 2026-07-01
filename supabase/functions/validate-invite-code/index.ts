import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, user_id } = await req.json();

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return new Response(JSON.stringify({ valid: false, error: "Código inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // SECURITY/SCHEMA: live doctor_invite_codes uses max_uses/current_uses/is_active.
    // This endpoint ONLY validates — it does NOT consume the code. The single source
    // of truth for consumption is the atomic claim in `assign-role` (compare-and-swap
    // on current_uses), so a code can't be double-spent between validate and redeem.
    const { data, error } = await supabase
      .from("doctor_invite_codes")
      .select("id, code, max_uses, current_uses, is_active")
      .eq("code", code.trim().toUpperCase())
      .maybeSingle();

    if (error || !data || data.is_active !== true) {
      return new Response(JSON.stringify({ valid: false, error: "Código não encontrado ou inativo" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (data.max_uses != null && (data.current_uses ?? 0) >= data.max_uses) {
      return new Response(JSON.stringify({ valid: false, error: "Código esgotado" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Do NOT mark as used here (consumption happens atomically at redemption).
    return new Response(JSON.stringify({ valid: true, code_id: data.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ valid: false, error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
