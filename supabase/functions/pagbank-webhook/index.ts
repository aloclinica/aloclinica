import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * PagBank webhook receiver.
 * Configure no painel PagBank:
 *   https://pwxvvimdtmvziynbspgx.supabase.co/functions/v1/pagbank-webhook
 *
 * Auth: PagBank envia "x-authenticity-token" = sha256(PAGBANK_TOKEN + body).
 *
 * Atualiza:
 *   - payment_transactions (sempre, se pagbank_charge_id ou pagbank_order_id bate)
 *   - appointments / on_demand_queue / prescription_renewals (legado por reference_id)
 *   - subscriptions (se reference_id começa com sub_)
 *   - notifications + activity_logs
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-authenticity-token",
};

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const PAGBANK_TOKEN = Deno.env.get("PAGBANK_TOKEN") || "";
  const rawBody = await req.text();

  // Verify signature
  const sig = req.headers.get("x-authenticity-token");
  if (PAGBANK_TOKEN && sig) {
    const expected = await sha256Hex(PAGBANK_TOKEN + rawBody);
    if (expected !== sig) {
      console.warn("[PagBank Webhook] invalid signature");
      return new Response(JSON.stringify({ error: "invalid signature" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  let payload: any = {};
  try { payload = JSON.parse(rawBody); } catch { /* tolerate empty */ }

  try {
    const orderId = payload.id || payload.order_id || payload.charges?.[0]?.order_id;
    const charge = payload.charges?.[0] || payload;
    const chargeId = charge?.id;
    const referenceId: string = payload.reference_id || charge?.reference_id || "";
    const pagStatus: string = (charge?.status || payload.status || "").toUpperCase();

    console.info(`[PagBank Webhook] order=${orderId} charge=${chargeId} ref=${referenceId} status=${pagStatus}`);

    const map: Record<string, string> = {
      PAID: "approved",
      AUTHORIZED: "approved",
      AVAILABLE: "approved",
      IN_ANALYSIS: "analyzing",
      WAITING: "pending",
      DECLINED: "refused",
      CANCELED: "cancelled",
      REFUNDED: "refunded",
      PARTIALLY_REFUNDED: "partially_refunded",
    };
    const newStatus = map[pagStatus] || null;

    // ── Atualizar payment_transactions sempre que possível ──────────
    const txStatus = newStatus === "approved" ? "paid"
                   : newStatus === "refunded" ? "refunded"
                   : newStatus === "partially_refunded" ? "partial_refund"
                   : newStatus === "refused" ? "declined"
                   : newStatus === "cancelled" ? "cancelled"
                   : null;

    if (txStatus && (chargeId || orderId)) {
      const txUpdate: Record<string, unknown> = {
        status: txStatus,
        raw_response: payload,
      };
      if (txStatus === "paid") txUpdate.paid_at = new Date().toISOString();
      if (txStatus === "declined") txUpdate.declined_at = new Date().toISOString();
      if (txStatus === "refunded" || txStatus === "partial_refund") {
        txUpdate.refunded_at = new Date().toISOString();
      }

      // Tenta por charge_id primeiro, depois order_id
      let matched = false;
      if (chargeId) {
        const { data } = await supabase
          .from("payment_transactions")
          .update(txUpdate)
          .eq("pagbank_charge_id", chargeId)
          .select("id");
        matched = !!(data && data.length);
      }
      if (!matched && orderId) {
        await supabase
          .from("payment_transactions")
          .update(txUpdate)
          .eq("pagbank_order_id", orderId);
      }
    }

    if (!newStatus) {
      return new Response(JSON.stringify({ received: true, ignored: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Roteamento por prefixo do reference_id ──────────────────────
    const isQueue = referenceId.startsWith("queue_");
    const isRenewal = referenceId.startsWith("renewal_");
    const isSubscription = referenceId.startsWith("sub_");
    const isPlainAppointment = !isQueue && !isRenewal && !isSubscription;
    const appointmentId = isPlainAppointment ? referenceId : null;

    if (isQueue && newStatus === "approved") {
      const queueId = referenceId.replace("queue_", "");
      await supabase.from("on_demand_queue")
        .update({ status: "waiting", payment_id: orderId })
        .eq("id", queueId).eq("status", "pending_payment");
    }

    if (isRenewal && newStatus === "approved") {
      const renewalId = referenceId.replace("renewal_", "");
      await supabase.from("prescription_renewals")
        .update({ paid_at: new Date().toISOString(), status: "pending_review", payment_id: orderId })
        .eq("id", renewalId);
    }

    if (isSubscription) {
      const subId = referenceId.replace("sub_", "");
      const subUpdate: Record<string, unknown> = {
        last_charge_at: new Date().toISOString(),
        last_charge_status: txStatus,
      };
      if (newStatus === "approved") {
        // Avança next_charge_at
        const { data: sub } = await (supabase as any)
          .from("subscriptions")
          .select("interval_days")
          .eq("id", subId)
          .maybeSingle();
        const days = sub?.interval_days ?? 30;
        subUpdate.next_charge_at = new Date(Date.now() + days * 86400000).toISOString();
        subUpdate.retry_count = 0;
      }
      if (newStatus === "refused") {
        // Falhou — incrementa retry; cron tentará 3x antes de suspender
        subUpdate.retry_count = (await (supabase as any)
          .from("subscriptions")
          .select("retry_count")
          .eq("id", subId)
          .maybeSingle()).data?.retry_count + 1 || 1;
        if (subUpdate.retry_count >= 3) {
          subUpdate.status = "suspended";
        }
      }
      if (newStatus === "refunded" || newStatus === "cancelled") {
        subUpdate.status = "cancelled";
        subUpdate.cancelled_at = new Date().toISOString();
      }
      await (supabase as any).from("subscriptions").update(subUpdate).eq("id", subId);
    }

    if (appointmentId) {
      const update: Record<string, any> = { payment_status: newStatus };
      if (newStatus === "approved") {
        update.payment_confirmed_at = new Date().toISOString();
        update.status = "confirmed";
      }
      if (["refunded", "cancelled"].includes(newStatus)) {
        update.status = "cancelled";
        update.cancellation_reason = `Pagamento ${newStatus} via PagBank`;
      }

      const { data: appt } = await supabase
        .from("appointments")
        .update(update)
        .eq("id", appointmentId)
        .select("id, patient_id, doctor_id, scheduled_at")
        .maybeSingle();

      if (appt && newStatus === "approved" && appt.patient_id) {
        const scheduledDate = new Date(appt.scheduled_at).toLocaleString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
        });
        await supabase.from("notifications").insert({
          user_id: appt.patient_id,
          title: "✅ Pagamento Confirmado!",
          message: `Seu pagamento foi aprovado. Consulta em ${scheduledDate}.`,
          type: "payment", link: "/dashboard/appointments",
        });
      }
    }

    await supabase.from("activity_logs").insert({
      action: `pagbank_${pagStatus.toLowerCase()}`,
      entity_type: "payment",
      entity_id: orderId,
      details: { reference_id: referenceId, status: pagStatus, mapped: newStatus, charge_id: chargeId },
    });

    return new Response(JSON.stringify({ received: true, status: newStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("[PagBank Webhook] error:", msg);
    // Always 200 so PagBank doesn't retry forever on bugs
    return new Response(JSON.stringify({ received: true, error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
