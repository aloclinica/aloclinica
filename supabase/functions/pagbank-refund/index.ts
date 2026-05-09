import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * pagbank-refund — estorna uma cobrança via PagBank.
 *
 * Apenas admin pode executar (ou owner em casos auto-refund <24h).
 *
 * Body: {
 *   transactionId?: UUID,        -- payment_transactions.id (preferível)
 *   pagbankChargeId?: string,    -- alternativa
 *   amountCents?: number,        -- omit = full refund
 *   reason?: string,
 * }
 *
 * PagBank API: POST /charges/{chargeId}/cancel
 *   Body: { amount: { value, currency } } (omit para full refund)
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

    const { transactionId, pagbankChargeId, amountCents, reason } = await req.json();

    // Busca a transação
    let tx: any = null;
    if (transactionId) {
      const { data } = await adminClient
        .from("payment_transactions")
        .select("*")
        .eq("id", transactionId)
        .maybeSingle();
      tx = data;
    } else if (pagbankChargeId) {
      const { data } = await adminClient
        .from("payment_transactions")
        .select("*")
        .eq("pagbank_charge_id", pagbankChargeId)
        .maybeSingle();
      tx = data;
    }

    if (!tx) {
      return new Response(JSON.stringify({ error: "Transação não encontrada" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Permissão: admin OU dono da transação dentro de 24h após pagamento
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const isAdmin = (roles ?? []).some((r: any) => r.role === "admin");
    const isOwner = tx.user_id === user.id;
    const within24h = tx.paid_at && (Date.now() - new Date(tx.paid_at).getTime()) < 86400000;

    if (!isAdmin && !(isOwner && within24h)) {
      return new Response(JSON.stringify({
        error: "Sem permissão. Estornos automáticos só dentro de 24h após pagamento.",
      }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!tx.pagbank_charge_id) {
      return new Response(JSON.stringify({ error: "Transação sem charge_id PagBank" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (tx.status === "refunded") {
      return new Response(JSON.stringify({ ok: true, already_refunded: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const refundAmountCents = amountCents && amountCents < tx.amount_cents
      ? amountCents
      : tx.amount_cents;

    // Chama PagBank Refund API
    const refundPayload: any = {};
    if (refundAmountCents !== tx.amount_cents) {
      refundPayload.amount = { value: refundAmountCents };
    }

    const pagbankRes = await fetch(
      `${PAGBANK_PROD}/charges/${tx.pagbank_charge_id}/cancel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${PAGBANK_TOKEN}`,
        },
        body: JSON.stringify(refundPayload),
      }
    );
    const pagbankData = await pagbankRes.json();

    if (!pagbankRes.ok) {
      return new Response(JSON.stringify({
        error: pagbankData?.error_messages?.[0]?.description || "Falha no estorno",
        pagbank_response: pagbankData,
      }), { status: pagbankRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Atualiza transação
    const isFull = refundAmountCents >= tx.amount_cents;
    await adminClient
      .from("payment_transactions")
      .update({
        status: isFull ? "refunded" : "partial_refund",
        refund_amount_cents: refundAmountCents,
        refunded_at: new Date().toISOString(),
        refund_reason: reason || null,
        raw_response: pagbankData,
      })
      .eq("id", tx.id);

    // Reflete no recurso
    if (tx.resource_type === "appointment") {
      await adminClient
        .from("appointments")
        .update({
          payment_status: isFull ? "refunded" : "partial_refund",
          status: isFull ? "cancelled" : undefined,
        })
        .eq("id", tx.resource_id);
    } else if (tx.resource_type === "subscription") {
      // Refund de uma cobrança recorrente — cancela próxima
      await (adminClient as any).from("subscriptions").update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        next_charge_at: null,
      }).eq("id", tx.resource_id);
    }

    // Email de notificação (template existente)
    if (tx.user_id) {
      const { data: { user: target } } = await adminClient.auth.admin.getUserById(tx.user_id);
      const email = target?.email;
      if (email) {
        await adminClient.functions.invoke("send-email", {
          body: {
            type: "refund_processed",
            to: email,
            data: {
              amount: (refundAmountCents / 100).toFixed(2),
              full: isFull,
              reason: reason || "",
            },
          },
        }).catch(() => {});
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      refund_amount_cents: refundAmountCents,
      full: isFull,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[pagbank-refund] error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
