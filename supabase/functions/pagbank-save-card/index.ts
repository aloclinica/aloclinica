import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * pagbank-save-card — Tokeniza um cartão no PagBank e salva no vault local.
 *
 * Fluxo:
 *   1. Recebe dados do cartão (holder, number, expiry, cvv) via formulário do paciente
 *   2. Chama PagBank /public/payment-methods/cards (tokenization)
 *   3. PagBank retorna um card_id reutilizável (não-sensível)
 *   4. Salva em saved_cards: pagbank_card_id, last4, brand, holder_name, expiry_month/year
 *   5. Retorna saved_card_id para o front exibir na lista
 *
 * Body: { holder, number, expiryMonth, expiryYear, cvv, isDefault?, customerCpf?, customerEmail? }
 *
 * Compliance: número e CVV NUNCA são persistidos. Apenas last4 + brand exibíveis.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PAGBANK_PROD = Deno.env.get("PAGBANK_API_URL") || "https://api.pagseguro.com";

function detectBrand(num: string): string {
  const n = num.replace(/\D/g, "");
  if (/^4/.test(n)) return "VISA";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "MASTERCARD";
  if (/^3[47]/.test(n)) return "AMEX";
  if (/^(4011|4312|4389|4514|4576|5041|5066|5067|5090|6277|6362|6363|6504|6505|6506|6509|6516|6550)/.test(n)) return "ELO";
  if (/^(606282|3841)/.test(n)) return "HIPERCARD";
  return "UNKNOWN";
}

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

    // Cliente autenticado para descobrir o user_id
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service role para escrever em saved_cards
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json();
    const { holder, number, expiryMonth, expiryYear, cvv, isDefault, customerCpf, customerEmail } = body;

    if (!holder || !number || !expiryMonth || !expiryYear || !cvv) {
      return new Response(JSON.stringify({
        error: "holder, number, expiryMonth, expiryYear and cvv are required",
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const cleanNumber = String(number).replace(/\D/g, "");
    const last4 = cleanNumber.slice(-4);
    const brand = detectBrand(cleanNumber);
    const yearFull = String(expiryYear).length === 2 ? `20${expiryYear}` : String(expiryYear);

    // ── Chamada à PagBank Tokenization API ──────────────────────────────
    // Endpoint: POST /public/payment-methods/cards (sandbox e prod)
    const tokenizeRes = await fetch(`${PAGBANK_PROD}/public/payment-methods/cards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PAGBANK_TOKEN}`,
      },
      body: JSON.stringify({
        type: "CREDIT_CARD",
        card: {
          number: cleanNumber,
          exp_month: String(expiryMonth).padStart(2, "0"),
          exp_year: yearFull,
          security_code: String(cvv),
          holder: { name: holder },
        },
      }),
    });

    const tokenizeData = await tokenizeRes.json();

    if (!tokenizeRes.ok || !tokenizeData?.id) {
      return new Response(JSON.stringify({
        error: tokenizeData?.error_messages?.[0]?.description ||
               tokenizeData?.message ||
               "Falha ao tokenizar cartão no PagBank",
        pagbank_response: tokenizeData,
      }), { status: tokenizeRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const pagbankCardId: string = tokenizeData.id;

    // Se for default, desmarca os outros
    if (isDefault) {
      await adminClient
        .from("saved_cards")
        .update({ is_default: false })
        .eq("user_id", user.id);
    }

    // Insere no vault
    const { data: saved, error: saveErr } = await adminClient
      .from("saved_cards")
      .insert({
        user_id: user.id,
        pagbank_card_id: pagbankCardId,
        last4,
        brand,
        holder_name: holder,
        expiry_month: String(expiryMonth).padStart(2, "0"),
        expiry_year: yearFull,
        is_default: isDefault === true,
        status: "active",
      })
      .select()
      .single();

    if (saveErr) {
      return new Response(JSON.stringify({
        error: saveErr.message,
        hint: "Cartão tokenizado no PagBank mas não foi possível salvar no banco. Pode tentar de novo.",
      }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      ok: true,
      card: {
        id: saved.id,
        last4: saved.last4,
        brand: saved.brand,
        holder_name: saved.holder_name,
        expiry_month: saved.expiry_month,
        expiry_year: saved.expiry_year,
        is_default: saved.is_default,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[pagbank-save-card] error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
