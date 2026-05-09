import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * pagbank-charge-saved-card — Cobra um cartão previamente salvo (vault).
 *
 * Usado por:
 *   - Cron de assinaturas (process_recurring_subscriptions)
 *   - Front, quando paciente escolhe "usar cartão salvo" no checkout
 *
 * Body: {
 *   savedCardId: UUID,            -- referência ao saved_cards.id
 *   amountCents: number,
 *   description?: string,
 *   resourceType: 'subscription'|'appointment'|...,
 *   resourceId: string,
 *   subscriptionId?: UUID,        -- se for renovação, atualiza next_charge_at
 *   installments?: number,
 * }
 *
 * Cria payment_transactions e dispara cobrança via PagBank Orders API
 * usando { payment_method: { type: "CREDIT_CARD", card: { id: pagbank_card_id } } }
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PAGBANK_PROD = Deno.env.get("PAGBANK_API_URL") || "https://api.pagseguro.com";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const PAGBANK_TOKEN = Deno.env.get("PAGBANK_TOKEN");
    if (!PAGBANK_TOKEN) {
      return new Response(JSON.stringify({ error: "PagBank not configured" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json();
    const {
      savedCardId,
      amountCents,
      description,
      resourceType,
      resourceId,
      subscriptionId,
      installments,
    } = body;

    if (!savedCardId || !amountCents || !resourceType || !resourceId) {
      return new Response(JSON.stringify({
        error: "savedCardId, amountCents, resourceType and resourceId are required",
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Busca o cartão e perfil do dono
    const { data: card, error: cardErr } = await adminClient
      .from("saved_cards")
      .select("id, user_id, pagbank_card_id, holder_name, last4, brand, status")
      .eq("id", savedCardId)
      .maybeSingle();

    if (cardErr || !card) {
      return new Response(JSON.stringify({ error: "Cartão não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (card.status !== "active") {
      return new Response(JSON.stringify({ error: `Cartão ${card.status}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Busca perfil do user (cpf, email, phone) — necessário pelo PagBank
    const { data: profile } = await adminClient
      .from("profiles")
      .select("first_name, last_name, cpf, phone")
      .eq("user_id", card.user_id)
      .maybeSingle();

    const { data: { user: authUser } } = await adminClient.auth.admin.getUserById(card.user_id);
    const customerEmail = authUser?.email || "";
    const customerName = profile ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() : (card.holder_name ?? "Paciente");
    const customerCpf = (profile?.cpf || "").replace(/\D/g, "") || "00000000000";
    const phoneDigits = (profile?.phone || "").replace(/\D/g, "").replace(/^55/, "");

    const customer: Record<string, any> = {
      name: customerName,
      tax_id: customerCpf,
    };
    if (customerEmail) customer.email = customerEmail;
    if (phoneDigits.length >= 10) {
      customer.phones = [{
        country: "55",
        area: phoneDigits.slice(0, 2),
        number: phoneDigits.slice(2),
        type: "MOBILE",
      }];
    }

    const referenceId = subscriptionId ? `sub_${subscriptionId}` : `${resourceType}_${resourceId}`;
    const installmentN = Math.max(1, Math.min(12, Number(installments) || 1));

    const orderPayload = {
      reference_id: referenceId.slice(0, 64),
      customer,
      items: [{
        reference_id: referenceId,
        name: (description || "AloClinica").slice(0, 100),
        quantity: 1,
        unit_amount: amountCents,
      }],
      charges: [{
        reference_id: referenceId,
        description: (description || "AloClinica").slice(0, 100),
        amount: { value: amountCents, currency: "BRL" },
        payment_method: {
          type: "CREDIT_CARD",
          installments: installmentN,
          capture: true,
          card: { id: card.pagbank_card_id },
          holder: { name: card.holder_name ?? customerName },
        },
      }],
      notification_urls: [
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/pagbank-webhook`,
      ],
    };

    // Cria transação local em pending
    const { data: tx, error: txErr } = await adminClient
      .from("payment_transactions")
      .insert({
        user_id: card.user_id,
        resource_type: resourceType,
        resource_id: resourceId,
        amount_cents: amountCents,
        currency: "BRL",
        payment_method: "SAVED_CARD",
        saved_card_id: card.id,
        installments: installmentN,
        status: "pending",
        description,
      })
      .select()
      .single();

    if (txErr) {
      console.error("[pagbank-charge-saved-card] tx insert error", txErr);
    }

    // Dispara cobrança no PagBank
    const pagbankRes = await fetch(`${PAGBANK_PROD}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PAGBANK_TOKEN}`,
      },
      body: JSON.stringify(orderPayload),
    });
    const pagbankData = await pagbankRes.json();

    if (!pagbankRes.ok) {
      // Marca tx como failed
      if (tx?.id) {
        await adminClient
          .from("payment_transactions")
          .update({
            status: "failed",
            raw_response: pagbankData,
            metadata: { error: pagbankData?.error_messages || pagbankData },
          })
          .eq("id", tx.id);
      }
      return new Response(JSON.stringify({
        error: pagbankData?.error_messages?.[0]?.description || "Falha na cobrança",
        pagbank_response: pagbankData,
      }), { status: pagbankRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const charge = pagbankData?.charges?.[0];
    const chargeStatus: string = charge?.status || "pending";
    const mappedStatus = chargeStatus === "PAID" ? "paid"
                       : chargeStatus === "AUTHORIZED" ? "authorized"
                       : chargeStatus === "DECLINED" ? "declined"
                       : "pending";

    // Atualiza transação
    if (tx?.id) {
      const updates: Record<string, unknown> = {
        pagbank_order_id: pagbankData?.id,
        pagbank_charge_id: charge?.id,
        status: mappedStatus,
        raw_response: pagbankData,
      };
      if (mappedStatus === "paid") updates.paid_at = new Date().toISOString();
      else if (mappedStatus === "authorized") updates.authorized_at = new Date().toISOString();
      else if (mappedStatus === "declined") updates.declined_at = new Date().toISOString();

      await adminClient.from("payment_transactions").update(updates).eq("id", tx.id);
    }

    // Se foi renovação de assinatura e foi PAID, avança next_charge_at
    if (subscriptionId && mappedStatus === "paid") {
      const { data: sub } = await adminClient
        .from("subscriptions")
        .select("interval_days")
        .eq("id", subscriptionId)
        .maybeSingle();
      const days = sub?.interval_days ?? 30;

      await adminClient.from("subscriptions").update({
        last_charge_at: new Date().toISOString(),
        last_charge_status: "paid",
        next_charge_at: new Date(Date.now() + days * 86400000).toISOString(),
        retry_count: 0,
      }).eq("id", subscriptionId);
    } else if (subscriptionId && mappedStatus === "declined") {
      await adminClient.from("subscriptions").update({
        last_charge_at: new Date().toISOString(),
        last_charge_status: "declined",
      }).eq("id", subscriptionId);
    }

    return new Response(JSON.stringify({
      ok: true,
      transaction_id: tx?.id,
      pagbank_order_id: pagbankData?.id,
      pagbank_charge_id: charge?.id,
      status: mappedStatus,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[pagbank-charge-saved-card] error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
