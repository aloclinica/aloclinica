/**
 * public-api — gateway das endpoints públicas para parceiros.
 *
 * Auth: header `Authorization: ApiKey <prefix>.<secret>`
 *   - prefix (8 chars) identifica a chave; secret é verificado por hash.
 * Rate-limit: api_keys.rate_limit_per_min, contado via api_request_log.
 * Logging: cada request entra em api_request_log.
 *
 * Endpoints suportados (MVP):
 *   GET /v1/me           → metadados da chave
 *   GET /v1/appointments → últimos 50 appointments do owner (scope appointments:read)
 *
 * Próximos: receitas, exames, webhook configurável.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// SECURITY: timing-safe comparison for the hashed-secret check.
import { safeEqual } from "../_shared/auth.ts";

function json(b: unknown, s = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(b), {
    status: s,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", ...headers },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
    });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/functions\/v1\/public-api/, "") || "/";

  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Auth
    const auth = req.headers.get("Authorization") || "";
    const m = auth.match(/^ApiKey\s+([a-z0-9_-]{8})\.(.+)$/i);
    if (!m) return json({ error: "Missing or invalid Authorization (expected: ApiKey <prefix>.<secret>)" }, 401);
    const [, prefix, secret] = m;

    const { data: key, error: keyErr } = await sb.from("api_keys")
      .select("id, owner_user_id, scopes, rate_limit_per_min, is_active, revoked_at, secret_hash")
      .eq("prefix", prefix).maybeSingle();
    if (keyErr || !key) return json({ error: "Invalid API key" }, 401);
    if (!(key as any).is_active || (key as any).revoked_at) return json({ error: "API key inactive or revoked" }, 401);

    // SECURITY: verify secret against the stored hash via crypt() (pgcrypto),
    // comparing timing-safely. FAIL CLOSED — if the RPC returns null/undefined
    // or errors, reject. NEVER accept a plaintext secret_hash === secret fallback.
    const { data: hashOk, error: hashErr } = await sb.rpc("crypt", {
      password: secret,
      salt: (key as any).secret_hash,
    });
    if (hashErr || !hashOk || !safeEqual(String(hashOk), (key as any).secret_hash)) {
      return json({ error: "Invalid API key" }, 401);
    }

    // Rate-limit (last minute)
    const since = new Date(Date.now() - 60_000).toISOString();
    const { count: usedThisMinute } = await sb.from("api_request_log")
      .select("id", { count: "exact", head: true })
      .eq("api_key_id", (key as any).id)
      .gte("created_at", since);
    if ((usedThisMinute ?? 0) >= ((key as any).rate_limit_per_min ?? 60)) {
      return json({ error: "Rate limit exceeded" }, 429, { "Retry-After": "60" });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

    let status = 200, body: unknown;
    if (path === "/v1/me" || path === "/") {
      body = {
        prefix, scopes: (key as any).scopes, rate_limit_per_min: (key as any).rate_limit_per_min,
        owner_user_id: (key as any).owner_user_id,
      };
    } else if (path === "/v1/appointments") {
      if (!((key as any).scopes ?? []).includes("appointments:read")) {
        status = 403; body = { error: "Missing scope: appointments:read" };
      } else {
        // Por padrão devolvemos consultas do owner da chave (compatível com médicos e parceiros).
        const ownerId = (key as any).owner_user_id;
        const { data: docProf } = await sb.from("doctor_profiles").select("id").eq("user_id", ownerId).maybeSingle();
        let q = sb.from("appointments").select("id, scheduled_at, status, payment_status, duration_minutes, patient_id, doctor_id").order("scheduled_at", { ascending: false }).limit(50);
        if (docProf) q = q.eq("doctor_id", (docProf as any).id);
        else q = q.eq("patient_id", ownerId);
        const { data, error } = await q;
        if (error) { status = 500; body = { error: error.message }; }
        else body = { appointments: data ?? [] };
      }
    } else {
      status = 404; body = { error: `Unknown endpoint: ${path}` };
    }

    await sb.from("api_request_log").insert({
      api_key_id: (key as any).id, endpoint: path, ip, status_code: status,
    });
    await sb.from("api_keys").update({ last_used_at: new Date().toISOString() } as any).eq("id", (key as any).id);

    return json(body, status);
  } catch (e: any) {
    console.error("public-api error:", e?.message);
    return json({ error: "internal" }, 500);
  }
});
