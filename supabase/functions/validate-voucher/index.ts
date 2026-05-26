import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

/**
 * validate-voucher
 * Valida um código de voucher de ação social e retorna o contrato associado
 * + especialidades permitidas. Não consome o voucher — só valida.
 * O consumo (decremento de usos_atuais) acontece na criação do appointment.
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { codigo } = await req.json().catch(() => ({}));
    if (!codigo || typeof codigo !== "string" || codigo.length < 3 || codigo.length > 64) {
      return new Response(
        JSON.stringify({ valid: false, error: "Código inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const code = codigo.trim().toUpperCase();
    const { data: voucher } = await supabase
      .from("vouchers")
      .select("id, contrato_id, validade_inicio, validade_fim, usos_maximos, usos_atuais, especialidades_permitidas, ativo")
      .eq("codigo", code)
      .maybeSingle();

    if (!voucher || !voucher.ativo) {
      return new Response(
        JSON.stringify({ valid: false, error: "Voucher não encontrado ou inativo" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const today = new Date().toISOString().slice(0, 10);
    if (voucher.validade_inicio > today) {
      return new Response(
        JSON.stringify({ valid: false, error: "Voucher ainda não está válido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (voucher.validade_fim && voucher.validade_fim < today) {
      return new Response(
        JSON.stringify({ valid: false, error: "Voucher expirado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (voucher.usos_atuais >= voucher.usos_maximos) {
      return new Response(
        JSON.stringify({ valid: false, error: "Voucher já foi totalmente utilizado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: contrato } = await supabase
      .from("contratos")
      .select("id, nome, tipo, status, especialidades_permitidas, branding")
      .eq("id", voucher.contrato_id)
      .maybeSingle();

    if (!contrato || contrato.status !== "ativo") {
      return new Response(
        JSON.stringify({ valid: false, error: "Contrato vinculado não está ativo" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        valid: true,
        voucher: {
          id: voucher.id,
          codigo: code,
          especialidades_permitidas:
            voucher.especialidades_permitidas?.length
              ? voucher.especialidades_permitidas
              : contrato.especialidades_permitidas ?? [],
          usos_restantes: voucher.usos_maximos - voucher.usos_atuais,
        },
        contrato: {
          id: contrato.id,
          nome: contrato.nome,
          tipo: contrato.tipo,
          branding: contrato.branding ?? {},
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ valid: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});