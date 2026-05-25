import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCaller, isInternalOrService, checkRateLimit } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Workaround: Evolution API server has an invalid TLS certificate.
// Try HTTPS first, if cert error, retry with HTTP.
const fetchEvo = async (url: string, opts: RequestInit = {}): Promise<Response> => {
  try {
    return await fetch(url, opts);
  } catch (error: any) {
    const errStr = String(error);
    if (errStr.includes("certificate") || errStr.includes("tls") || errStr.includes("CaUsedAsEndEntity")) {
      console.warn("TLS error, retrying with HTTP:", error);
      const httpUrl = url.replace(/^https:\/\//, "http://");
      return await fetch(httpUrl, opts);
    }
    throw error;
  }
};

interface WhatsAppRequest {
  phone: string;
  message: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Trigger/cron and cross-function calls (internal secret or service role)
    // bypass per-user limits. Everyone else must be an authenticated user and
    // is rate-limited to curb arbitrary-recipient spam.
    if (!isInternalOrService(req)) {
      const caller = await getCaller(req);
      if (!caller.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!caller.isAdmin) {
        const allowed = await checkRateLimit(`user:${caller.user.id}`, "send-whatsapp", 30, 10);
        if (!allowed) {
          return new Response(JSON.stringify({ error: "Muitas mensagens. Aguarde um momento." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
          });
        }
      }
    }

    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      console.info("[DEV] WhatsApp would be sent but Evolution API not configured");
      const body: WhatsAppRequest = await req.json();
      console.info("[DEV] Message:", JSON.stringify(body));
      return new Response(
        JSON.stringify({ success: true, dev: true, message: "WhatsApp logged (Evolution API not configured)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find first connected instance dynamically
    const baseUrl = EVOLUTION_API_URL.replace(/\/+$/, "");
    const apiHeaders = { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY };
    
    const instancesRes = await fetchEvo(`${baseUrl}/instance/fetchInstances`, { method: "GET", headers: apiHeaders });
    const allInstances = await instancesRes.json();
    const connectedInstance = Array.isArray(allInstances)
      ? allInstances.find((i: Record<string, Record<string, string>>) => i?.instance?.status === "open")
      : null;
    
    if (!connectedInstance) {
      console.error("No connected WhatsApp instance found");
      return new Response(
        JSON.stringify({ error: "Nenhuma instância WhatsApp conectada. Configure no painel admin." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const instanceName = connectedInstance.instance.instanceName;

    const body: WhatsAppRequest = await req.json();
    const { phone, message } = body;

    if (!phone || !message) {
      return new Response(JSON.stringify({ error: "phone and message are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Clean phone number - keep only digits
    const cleanPhone = phone.replace(/\D/g, "");
    // Add country code if not present
    const fullPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

    const apiUrl = `${baseUrl}/message/sendText/${instanceName}`;

    const res = await fetchEvo(apiUrl, {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify({
        number: fullPhone,
        text: message,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("Evolution API error:", result);
      return new Response(JSON.stringify({ error: "Failed to send WhatsApp", details: result }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
