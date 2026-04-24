import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Evolution API not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { action, instanceName } = body;

    const baseUrl = EVOLUTION_API_URL.replace(/\/+$/, "");
    const headers = {
      "Content-Type": "application/json",
      apikey: EVOLUTION_API_KEY,
    };

    // Create instance
    if (action === "create") {
      const name = instanceName || `allo-medico-${Date.now()}`;
      const res = await fetchEvo(`${baseUrl}/instance/create`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          instanceName: name,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("Create instance error:", data);
        return new Response(JSON.stringify({ error: "Failed to create instance", details: data }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true, data, instanceName: name }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get QR code
    if (action === "qrcode") {
      if (!instanceName) {
        return new Response(JSON.stringify({ error: "instanceName is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const res = await fetchEvo(`${baseUrl}/instance/connect/${instanceName}`, {
        method: "GET",
        headers,
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("QR code error:", data);
        return new Response(JSON.stringify({ error: "Failed to get QR code", details: data }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check connection status
    if (action === "status") {
      if (!instanceName) {
        return new Response(JSON.stringify({ error: "instanceName is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const res = await fetchEvo(`${baseUrl}/instance/connectionState/${instanceName}`, {
        method: "GET",
        headers,
      });
      const data = await res.json();
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // List instances
    if (action === "list") {
      const res = await fetchEvo(`${baseUrl}/instance/fetchInstances`, {
        method: "GET",
        headers,
      });
      const data = await res.json();
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Delete instance
    if (action === "delete") {
      if (!instanceName) {
        return new Response(JSON.stringify({ error: "instanceName is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const res = await fetchEvo(`${baseUrl}/instance/delete/${instanceName}`, {
        method: "DELETE",
        headers,
      });
      const data = await res.json();
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use: create, qrcode, status, list, delete" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
