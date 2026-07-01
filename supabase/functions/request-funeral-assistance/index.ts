import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface FuneralRequestBody {
  deceased_name: string;
  deceased_cpf?: string;
  relationship: string;
  death_date: string;
  death_certificate_url?: string;
  city: string;
  state: string;
  contact_phone: string;
  preferred_provider_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: userData, error: uerr } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
    if (uerr || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = (await req.json()) as FuneralRequestBody;
    const required = ["deceased_name", "relationship", "death_date", "city", "state", "contact_phone"] as const;
    for (const k of required) {
      if (!body[k]) {
        return new Response(JSON.stringify({ error: `Missing field: ${k}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // SECURITY: input validation.
    const bad = (msg: string) =>
      new Response(JSON.stringify({ error: msg }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    // Length-limit free-text fields.
    if (String(body.deceased_name).length > 200) return bad("deceased_name too long");
    if (String(body.relationship).length > 200) return bad("relationship too long");
    if (String(body.city).length > 200) return bad("city too long");
    if ((body as any).reason && String((body as any).reason).length > 2000) return bad("reason too long");

    // CPF must be exactly 11 digits after stripping non-digits (when provided).
    if (body.deceased_cpf) {
      const cpfDigits = String(body.deceased_cpf).replace(/\D/g, "");
      if (cpfDigits.length !== 11) return bad("Invalid deceased_cpf");
      body.deceased_cpf = cpfDigits;
    }

    // death_certificate_url (when provided) must be an https URL — reject
    // javascript:/data:/http: and any non-parseable value.
    if (body.death_certificate_url) {
      let parsed: URL | null = null;
      try { parsed = new URL(String(body.death_certificate_url)); } catch { parsed = null; }
      if (!parsed || parsed.protocol !== "https:") return bad("death_certificate_url must be an https URL");
    }

    // Active subscription with funeral coverage
    const { data: sub } = await supabase
      .from("pingo_card_subscriptions")
      .select("id, plan_id, pingo_card_plans(name, benefits)")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub) {
      return new Response(
        JSON.stringify({ error: "Sem assinatura Pingo Card ativa para acionar o benefício de assistência funeral" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const benefits: string[] = ((sub as any).pingo_card_plans?.benefits ?? []) as string[];
    const hasFuneral = benefits.some((b) => /funeral/i.test(b));
    if (!hasFuneral) {
      return new Response(
        JSON.stringify({ error: "Seu plano Pingo Card não inclui assistência funeral. Faça upgrade." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const coverageMatch = benefits.find((b) => /funeral.*r\$\s*([\d.]+)/i.exec(b));
    const coverageAmount = coverageMatch
      ? Number((coverageMatch.match(/r\$\s*([\d.]+)/i)?.[1] ?? "0").replace(/\./g, ""))
      : null;

    const { data: created, error: cerr } = await supabase
      .from("funeral_assistance_requests")
      .insert({
        user_id: userId,
        subscription_id: (sub as any).id,
        deceased_name: body.deceased_name,
        deceased_cpf: body.deceased_cpf ?? null,
        relationship: body.relationship,
        death_date: body.death_date,
        death_certificate_url: body.death_certificate_url ?? null,
        city: body.city,
        state: body.state,
        contact_phone: body.contact_phone,
        preferred_provider_id: body.preferred_provider_id ?? null,
        coverage_amount: coverageAmount,
        status: "pending",
      })
      .select()
      .single();

    if (cerr) {
      return new Response(JSON.stringify({ error: cerr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Notify admin via email (fire and forget)
    try {
      await supabase.functions.invoke("send-email", {
        body: {
          type: "default",
          to: Deno.env.get("ADMIN_NOTIFY_EMAIL") || "servicosplenasaude@gmail.com",
          data: {
            subject: "Novo pedido de assistência funeral",
            body: `Novo pedido aberto por ${userId}. Falecido: ${body.deceased_name} (${body.relationship}). Local: ${body.city}/${body.state}. Tel: ${body.contact_phone}. Cobertura: R$ ${coverageAmount ?? "—"}.`,
          },
        },
      });
    } catch { /* non-blocking */ }

    return new Response(JSON.stringify({ success: true, request: created }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
