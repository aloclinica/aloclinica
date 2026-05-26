// contrato-checkout
// Finaliza uma consulta custeada por contrato (órgão público / ação social /
// empresa) sem cobrança ao paciente: valida elegibilidade, registra o consumo
// (consulta_contrato) e marca o appointment como coberto.
//
// Body: { appointment_id, contrato_id, voucher_codigo? }
// Auth: JWT do paciente (o próprio dono da consulta).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ ok: false, error: "Unauthorized" }, 401);

    // Cliente no contexto do chamador (resolve o usuário a partir do JWT)
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: auth, error: authErr } = await userClient.auth.getUser();
    if (authErr || !auth?.user) return json({ ok: false, error: "Unauthorized" }, 401);
    const user = auth.user;

    const body = await req.json().catch(() => ({}));
    const appointmentId: string | undefined = body.appointment_id;
    const contratoId: string | undefined = body.contrato_id;
    const voucherCodigo: string | null = body.voucher_codigo ?? null;
    if (!appointmentId || !contratoId) return json({ ok: false, error: "appointment_id e contrato_id são obrigatórios" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // A consulta precisa pertencer ao chamador
    const { data: appt } = await admin
      .from("appointments")
      .select("id, patient_id, payment_status")
      .eq("id", appointmentId)
      .maybeSingle();
    if (!appt || appt.patient_id !== user.id) return json({ ok: false, error: "Consulta não encontrada" }, 404);

    // CPF do paciente (para elegibilidade por lista de CPF)
    const { data: profile } = await admin
      .from("profiles").select("cpf").eq("user_id", user.id).maybeSingle();

    // Consumo idempotente + débito de cota (SECURITY DEFINER, service_role)
    const { data: result, error: rpcErr } = await admin.rpc("fn_consumir_contrato", {
      p_contrato_id: contratoId,
      p_appointment_id: appointmentId,
      p_patient_user_id: user.id,
      p_cpf: profile?.cpf ?? null,
      p_voucher_codigo: voucherCodigo,
    });
    if (rpcErr) return json({ ok: false, error: rpcErr.message }, 500);
    if (!result?.ok) return json({ ok: false, reason: result?.reason ?? "nao_elegivel" }, 200);

    // Marca a consulta como coberta pelo contrato (sem pagamento)
    await admin.from("appointments")
      .update({ payment_status: "paid" })
      .eq("id", appointmentId);

    return json({ ok: true, reason: result.reason });
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, 500);
  }
});
