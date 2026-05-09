import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * pagbank-create-subscription — ativa assinatura recorrente.
 *
 * Estratégia: NÃO usamos PagBank Subscriptions API (complexa). Usamos:
 *   - Tabela subscriptions com next_charge_at + saved_card_id
 *   - Cron diário (process_recurring_subscriptions) que cobra via pagbank-charge-saved-card
 *   - Primeira cobrança imediata é OPCIONAL (parâmetro chargeNow)
 *
 * Body: {
 *   planId: UUID,
 *   savedCardId: UUID,
 *   amountCents: number,
 *   intervalDays?: number = 30,
 *   chargeNow?: boolean = true,    -- cobra a 1ª parcela agora
 *   metadata?: object,
 * }
 *
 * Retorna: { subscription_id, first_charge?: { transaction_id, status } }
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json();
    const {
      planId,
      savedCardId,
      amountCents,
      intervalDays = 30,
      chargeNow = true,
      metadata = {},
    } = body;

    if (!planId || !savedCardId || !amountCents) {
      return new Response(JSON.stringify({
        error: "planId, savedCardId and amountCents are required",
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Validar cartão
    const { data: card } = await adminClient
      .from("saved_cards")
      .select("id, user_id, status")
      .eq("id", savedCardId)
      .maybeSingle();
    if (!card || card.user_id !== user.id || card.status !== "active") {
      return new Response(JSON.stringify({ error: "Cartão inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validar plano
    const { data: plan } = await adminClient
      .from("plans")
      .select("id, name, is_active")
      .eq("id", planId)
      .maybeSingle();
    if (!plan || !plan.is_active) {
      return new Response(JSON.stringify({ error: "Plano indisponível" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const nextCharge = chargeNow
      ? new Date(now.getTime() + intervalDays * 86400000) // próxima cobrança em N dias
      : now;

    // Cria assinatura
    const { data: sub, error: subErr } = await (adminClient as any)
      .from("subscriptions")
      .insert({
        user_id: user.id,
        plan_id: planId,
        saved_card_id: savedCardId,
        amount_cents: amountCents,
        interval_days: intervalDays,
        status: "active",
        starts_at: now.toISOString(),
        next_charge_at: nextCharge.toISOString(),
        currency: "BRL",
        payment_method: "credit_card",
        metadata,
      })
      .select()
      .single();

    if (subErr) {
      return new Response(JSON.stringify({ error: subErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let firstCharge: any = null;

    // Cobra a 1ª parcela agora
    if (chargeNow) {
      const chargeRes = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/pagbank-charge-saved-card`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            savedCardId,
            amountCents,
            description: `Assinatura: ${plan.name}`,
            resourceType: "subscription",
            resourceId: sub.id,
            subscriptionId: sub.id,
          }),
        }
      );
      firstCharge = await chargeRes.json();

      // Se a 1ª cobrança falhou, suspende a assinatura
      if (firstCharge?.status !== "paid" && firstCharge?.status !== "authorized") {
        await adminClient
          .from("subscriptions")
          .update({ status: "suspended", last_charge_status: firstCharge?.status || "failed" })
          .eq("id", sub.id);
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      subscription_id: sub.id,
      next_charge_at: sub.next_charge_at,
      first_charge: firstCharge,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[pagbank-create-subscription] error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
