import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * PagBank webhook receiver.
 * Configure this URL in PagBank panel:
 *   https://<project>.supabase.co/functions/v1/pagbank-webhook
 *
 * Auth: PagBank sends an "x-authenticity-token" header containing
 * sha256(account_token + body). We verify it against PAGBANK_TOKEN.
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

  // Verify signature when token configured
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
    const referenceId = payload.reference_id || charge?.reference_id || "";
    const pagStatus: string = charge?.status || payload.status || "";

    console.info(`[PagBank Webhook] order=${orderId} ref=${referenceId} status=${pagStatus}`);

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

    if (!newStatus) {
      return new Response(JSON.stringify({ received: true, ignored: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try to resolve appointment via reference_id
    const isQueue = referenceId.startsWith("queue_");
    const isRenewal = referenceId.startsWith("renewal_");
    const appointmentId = !isQueue && !isRenewal ? referenceId : null;

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

    if (appointmentId) {
      const update: Record<string, any> = { payment_status: newStatus };
      if (newStatus === "approved") {
        update.payment_confirmed_at = new Date().toISOString();
        update.status = "confirmed";
      }
      if (["refunded", "cancelled"].includes(newStatus)) {
        update.status = "cancelled";
        update.cancel_reason = `Pagamento ${newStatus} via PagBank`;
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
      details: { reference_id: referenceId, status: pagStatus, mapped: newStatus },
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