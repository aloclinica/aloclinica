import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Rate limiter using Supabase rate_limits table.
 * Returns { allowed: boolean, remaining: number }
 */
async function checkRateLimit(
  identifier: string,
  endpoint: string,
  maxRequests: number,
  windowMinutes: number
): Promise<{ allowed: boolean; remaining: number }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

  // Count requests in current window
  const { count } = await supabase
    .from("rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("identifier", identifier)
    .eq("endpoint", endpoint)
    .gte("window_start", windowStart);

  const currentCount = count ?? 0;

  if (currentCount >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  // Record this request
  await supabase.from("rate_limits").insert({
    identifier,
    endpoint,
    window_start: new Date().toISOString(),
  });

  return { allowed: true, remaining: maxRequests - currentCount - 1 };
}

/**
 * Log an audit event for LGPD compliance.
 */
async function logAudit(params: {
  action: string;
  entityType: string;
  entityId?: string;
  userId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  consentReference?: string;
}) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    await supabase.from("activity_logs").insert({
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      user_id: params.userId ?? null,
      performed_by: params.userId ?? null,
      details: params.details ?? {},
      ip_address: params.ipAddress ?? null,
      user_agent: params.userAgent ?? null,
      consent_reference: params.consentReference ?? null,
    });
  } catch (error: any) {
    console.error("Audit log error:", error);
  }
}

/**
 * Extract client IP from request headers.
 */
function getClientIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Helper to return a 429 rate limit response.
 */
function rateLimitResponse(retryAfterSeconds = 60): Response {
  return new Response(
    JSON.stringify({
      error: "Muitas requisições. Aguarde um momento antes de tentar novamente.",
      retry_after: retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds),
      },
    }
  );
}

// This is a utility edge function — not meant to be called directly.
// It exports helpers for other edge functions.
// However, Supabase requires a serve() call, so we provide a health check.
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Cleanup old rate limit entries
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);
    await supabase.rpc("cleanup_rate_limits");
  } catch (error: any) {
    console.error("Cleanup error:", error);
  }

  return new Response(
    JSON.stringify({ status: "ok", message: "Rate limiter & audit utilities active" }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

export { checkRateLimit, logAudit, getClientIP, rateLimitResponse };
