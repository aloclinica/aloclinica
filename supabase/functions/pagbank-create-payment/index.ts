import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Unified PagBank payment creation.
 * Handles PIX, CREDIT_CARD and BOLETO via PagBank Orders API.
 * Compatible with the previous create-asaas-payment frontend contract.
 *
 * Docs: https://developer.pagbank.com.br/reference/criar-pedido
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PAGBANK_PROD = "https://api.pagseguro.com";

function decodeCardToken(token: string): {
  holder: string; number: string; month: string; year: string; ccv: string;
} | null {
  try {
    const obj = JSON.parse(atob(token));
    if (obj.v !== 1 || !obj.n || !obj.c) return null;
    return { holder: obj.h, number: obj.n, month: obj.m, year: obj.y, ccv: obj.c };
  } catch { return null; }
}

function onlyDigits(s: string): string { return String(s || "").replace(/\D/g, ""); }

function brPhone(raw: string) {
  const d = onlyDigits(raw).replace(/^55/, "");
  if (d.length < 10 || d.length > 11) return null;
  return { country: "55", area: d.slice(0, 2), number: d.slice(2) };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const PAGBANK_TOKEN = Deno.env.get("PAGBANK_TOKEN");
    if (!PAGBANK_TOKEN) {
      return new Response(
        JSON.stringify({ error: "PagBank not configured (missing PAGBANK_TOKEN)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const {
      customerName,
      customerCpf,
      customerEmail,
      customerPhone,
      customerMobilePhone,
      billingType,            // PIX | CREDIT_CARD | BOLETO
      value,                  // BRL
      description,
      appointmentId,
      planId,
      creditCardToken,        // opaque token from pagbank-tokenize-card
      installmentCount,
      cycle,                  // if set → recurring (currently maps to single charge; subscription handled separately)
    } = body;

    if (!customerName || !customerCpf || !billingType || !value) {
      return new Response(
        JSON.stringify({ error: "customerName, customerCpf, billingType and value are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const valueCents = Math.round(Number(value) * 100);
    if (!Number.isFinite(valueCents) || valueCents <= 0) {
      return new Response(JSON.stringify({ error: "Invalid value" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const referenceId = appointmentId || planId || `order-${Date.now()}`;
    const phone = brPhone(customerMobilePhone || customerPhone || "");

    const customer: Record<string, any> = {
      name: customerName,
      tax_id: onlyDigits(customerCpf),
    };
    if (customerEmail) customer.email = customerEmail;
    if (phone) customer.phones = [{ ...phone, type: "MOBILE" }];

    const item = {
      reference_id: referenceId,
      name: (description || "AloClinica").slice(0, 100),
      quantity: 1,
      unit_amount: valueCents,
    };

    const notificationUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/pagbank-webhook`;

    const orderBody: Record<string, any> = {
      reference_id: referenceId,
      customer,
      items: [item],
      notification_urls: [notificationUrl],
    };

    if (billingType === "PIX") {
      const expiration = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      orderBody.qr_codes = [{
        amount: { value: valueCents },
        expiration_date: expiration,
      }];
    } else if (billingType === "BOLETO") {
      const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      orderBody.charges = [{
        reference_id: referenceId,
        description: description || "AloClinica",
        amount: { value: valueCents, currency: "BRL" },
        payment_method: {
          type: "BOLETO",
          boleto: {
            due_date: dueDate,
            instruction_lines: { line_1: "Pagamento AloClinica", line_2: "Pague até o vencimento" },
            holder: {
              name: customerName,
              tax_id: onlyDigits(customerCpf),
              email: customerEmail || "noreply@aloclinica.com",
              address: {
                country: "Brasil",
                region: "SP",
                region_code: "SP",
                city: "Sao Paulo",
                postal_code: "01001000",
                street: "Rua",
                number: "1",
                locality: "Centro",
              },
            },
          },
        },
      }];
    } else if (billingType === "CREDIT_CARD") {
      if (!creditCardToken) {
        return new Response(JSON.stringify({ error: "creditCardToken is required for CREDIT_CARD" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const card = decodeCardToken(creditCardToken);
      if (!card) {
        return new Response(JSON.stringify({ error: "Invalid creditCardToken" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      orderBody.charges = [{
        reference_id: referenceId,
        description: description || "AloClinica",
        amount: { value: valueCents, currency: "BRL" },
        payment_method: {
          type: "CREDIT_CARD",
          installments: Math.max(1, Number(installmentCount) || 1),
          capture: true,
          card: {
            number: card.number,
            exp_month: card.month,
            exp_year: card.year,
            security_code: card.ccv,
            holder: { name: card.holder || customerName },
            store: false,
          },
        },
      }];
    } else {
      return new Response(JSON.stringify({ error: `Unsupported billingType: ${billingType}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orderRes = await fetch(`${PAGBANK_PROD}/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAGBANK_TOKEN}`,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(orderBody),
    });

    const orderData = await orderRes.json();

    if (!orderRes.ok) {
      console.error("PagBank order error:", JSON.stringify(orderData));
      const errMsg = orderData?.error_messages?.[0]?.description
        || orderData?.message
        || "Erro ao criar pagamento no PagBank";
      return new Response(JSON.stringify({ error: errMsg, details: orderData }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize response to the previous shape used by the frontend
    const orderId = orderData.id;
    const charge = orderData.charges?.[0];
    const qr = orderData.qr_codes?.[0];

    const pixQrCode = qr?.links?.find((l: any) => l.media === "image/png")?.href || null;
    const pixCopyPaste = qr?.text || null;
    const bankSlipUrl = charge?.links?.find((l: any) => l.rel === "PAY")?.href
      || charge?.payment_method?.boleto?.barcode || null;

    let normalizedStatus = "WAITING";
    if (charge?.status === "PAID" || charge?.status === "AUTHORIZED") normalizedStatus = "CONFIRMED";
    else if (charge?.status === "DECLINED") normalizedStatus = "DECLINED";
    else if (charge?.status === "CANCELED") normalizedStatus = "CANCELED";
    else if (qr) normalizedStatus = "WAITING";

    // Persist mapping for webhook lookups
    try {
      await supabase.from("activity_logs").insert({
        action: "pagbank_order_created",
        entity_type: "payment",
        entity_id: orderId,
        details: {
          reference_id: referenceId,
          billing_type: billingType,
          value: valueCents,
          appointment_id: appointmentId || null,
          plan_id: planId || null,
          charge_id: charge?.id || null,
        },
      });
    } catch (logErr) {
      console.warn("activity_logs insert failed:", logErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        type: "payment",
        paymentId: orderId,
        chargeId: charge?.id || null,
        status: normalizedStatus,
        pagbankStatus: charge?.status || qr?.status || "WAITING",
        billingType,
        pixQrCode,
        pixCopyPaste,
        bankSlipUrl,
        invoiceUrl: bankSlipUrl,
        raw: orderData,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("pagbank-create-payment error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});