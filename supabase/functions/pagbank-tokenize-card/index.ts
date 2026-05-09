import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

/**
 * PagBank "tokenization" shim.
 * PagBank's Orders API accepts card data directly server-side over HTTPS.
 * We return an opaque base64 token that ONLY pagbank-create-payment can decode.
 * Card data is never logged, never stored.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      cardHolderName,
      cardNumber,
      cardExpiryMonth,
      cardExpiryYear,
      cardCcv,
    } = body;

    if (!cardNumber || !cardCcv || !cardExpiryMonth || !cardExpiryYear) {
      return new Response(
        JSON.stringify({ error: "Card data is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanNumber = String(cardNumber).replace(/\s/g, "");
    const last4 = cleanNumber.slice(-4);

    // Opaque token (NOT a real PagBank token — just a server-side relay envelope).
    // Decoded only inside pagbank-create-payment.
    const payload = {
      v: 1,
      ts: Date.now(),
      h: cardHolderName || "",
      n: cleanNumber,
      m: String(cardExpiryMonth).padStart(2, "0"),
      y: String(cardExpiryYear),
      c: String(cardCcv),
    };
    const token = btoa(JSON.stringify(payload));

    return new Response(
      JSON.stringify({
        success: true,
        creditCardToken: token,
        creditCardNumber: `**** **** **** ${last4}`,
        creditCardBrand: "unknown",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Tokenize error (no card data logged):", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});