import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const COMPREFACE_URL = "http://72.62.138.208:8000";
const VERIFY_API_KEY = "5f3c100e-0144-465d-87b3-86c34ba70a1e";
const DETECT_API_KEY = "a2d930ec-e3ee-46b4-b770-023524e41178";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action"); // "detect" or "verify"

    if (!action || !["detect", "verify"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid action param (detect|verify)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Forward the multipart form data as-is
    const formData = await req.formData();

    const targetPath =
      action === "detect"
        ? "/api/v1/detection/detect"
        : "/api/v1/verification/verify";

    const apiKey = action === "detect" ? DETECT_API_KEY : VERIFY_API_KEY;

    const proxyRes = await fetch(`${COMPREFACE_URL}${targetPath}`, {
      method: "POST",
      headers: { "x-api-key": apiKey },
      body: formData,
    });

    const body = await proxyRes.text();

    return new Response(body, {
      status: proxyRes.status,
      headers: {
        ...corsHeaders,
        "Content-Type": proxyRes.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (err: any) {
    console.error("[compreface-proxy]", err);
    return new Response(
      JSON.stringify({ error: err.message || "Proxy error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
