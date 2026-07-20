import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
// SECURITY: this endpoint proxies to the CompreFace engine. It must NOT be an
// open oracle — require an authenticated caller (or a trusted service) and rate
// limit per user. The real KYC flow (didit-kyc) talks to CompreFace server-side.
import { getCaller, isInternalOrService, checkRateLimit } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const COMPREFACE_URL = Deno.env.get("COMPREFACE_URL") || "https://face.aloclinica.com.br";
const COMPREFACE_API_KEY = Deno.env.get("COMPREFACE_API_KEY") || "";
const VERIFY_API_KEY = Deno.env.get("COMPREFACE_VERIFY_KEY") || COMPREFACE_API_KEY;
const DETECT_API_KEY = Deno.env.get("COMPREFACE_DETECT_KEY") || COMPREFACE_API_KEY;

const json = (obj: unknown, status: number) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // AuthN + rate limit (trusted server-to-server calls bypass both).
    if (!isInternalOrService(req)) {
      const caller = await getCaller(req);
      if (!caller.user) {
        return json({ error: "Unauthorized" }, 401);
      }
      const allowed = await checkRateLimit(caller.user.id, "compreface-proxy", 40, 10);
      if (!allowed) {
        return json({ error: "Muitas tentativas. Aguarde alguns minutos." }, 429);
      }
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action"); // "detect" or "verify"

    if (!action || !["detect", "verify"].includes(action)) {
      return json({ error: "Missing or invalid action param (detect|verify)" }, 400);
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
    return json({ error: err.message || "Proxy error" }, 500);
  }
});
