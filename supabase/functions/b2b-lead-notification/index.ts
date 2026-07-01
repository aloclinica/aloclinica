import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
// SECURITY: IP-based rate limiting for this public contact form
import { checkRateLimit } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type B2BLeadPayload = {
  company_name?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  company_type?: string;
  services_interested?: string[];
  message?: string;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // SECURITY: public contact form — rate limit by client IP (5 req / 10 min)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!await checkRateLimit(ip, "b2b-lead-notification", 5, 10)) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { company_name, contact_name, email, phone, company_type, services_interested, message } = (await req.json()) as B2BLeadPayload;

    if (!company_name || !contact_name || !email) {
      return new Response(JSON.stringify({ error: "company_name, contact_name and email are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY not configured");

    const servicesText = Array.isArray(services_interested) && services_interested.length > 0
      ? services_interested.map((service) => escapeHtml(String(service))).join(", ")
      : "Não especificado";

    const html = `
      <h2>Novo Lead B2B recebido!</h2>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Empresa</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(company_name)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Contato</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(contact_name)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Email</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(email)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Telefone</td><td style="padding:8px;border:1px solid #ddd">${phone ? escapeHtml(phone) : "N/A"}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Tipo</td><td style="padding:8px;border:1px solid #ddd">${company_type ? escapeHtml(company_type) : "N/A"}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Serviços</td><td style="padding:8px;border:1px solid #ddd">${servicesText}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Mensagem</td><td style="padding:8px;border:1px solid #ddd">${message ? escapeHtml(message) : "N/A"}</td></tr>
      </table>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "AloClinica <noreply@aloclinica.com.br>",
        to: ["plenasaudebv@gmail.com"],
        subject: `🏢 Novo Lead B2B: ${company_name}`,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const body = await resendResponse.text();
      throw new Error(`Resend API error (${resendResponse.status}): ${body}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("B2B notification error:", error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
