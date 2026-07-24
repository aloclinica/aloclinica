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
  /** Se informado, respeita o consentimento/opt-out de WhatsApp do usuário (LGPD). */
  user_id?: string;
  /** Categoria (appointment/document/payment/...) para o opt-out por categoria. */
  category?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: esta função envia {phone, message} ARBITRÁRIOS pelo número oficial
    // da AloClínica. Se qualquer usuário autenticado pudesse chamá-la, teria um
    // vetor de phishing/impersonação (mandar texto livre de um número confiável
    // para qualquer telefone). Os fluxos legítimos de usuário passam por funções
    // dedicadas (que resolvem o destinatário internamente e mandam via service
    // role); o único chamador de front é o painel admin. Logo: só admin ou
    // chamadas internas/serviço (cron, outras edge functions) podem enviar texto livre.
    if (!isInternalOrService(req)) {
      const caller = await getCaller(req);
      if (!caller.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!caller.isAdmin) {
        return new Response(JSON.stringify({ error: "Acesso restrito a administradores" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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
    const { phone, message, user_id, category } = body;

    if (!phone || !message) {
      return new Response(JSON.stringify({ error: "phone and message are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // LGPD: se o destinatário é um usuário conhecido e ele desligou o WhatsApp
    // (canal ou categoria), NÃO envia. Sem user_id (broadcast admin, número avulso
    // de convidado), mantém o comportamento atual. Fail-open em erro de checagem
    // para não derrubar avisos transacionais por uma falha transitória.
    if (user_id) {
      try {
        const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        const { data: allowed } = await sb.rpc("fn_whatsapp_allowed", { p_user_id: user_id, p_category: category ?? null });
        if (allowed === false) {
          return new Response(JSON.stringify({ success: true, skipped: "user_opt_out" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (_e) { /* fail-open */ }
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
