/**
 * mp-oauth-callback — recebe o `code` do OAuth do Mercado Pago,
 * troca por {access_token, refresh_token, user_id} e salva em
 * doctor_profiles.mp_*. Em seguida redireciona o médico para o painel
 * com `?mp=ok` (ou `?mp=err` em caso de falha).
 *
 * Configurado como Redirect URI no painel MP:
 *   https://pwxvvimdtmvziynbspgx.supabase.co/functions/v1/mp-oauth-callback
 *
 * Requer env:
 *   MERCADOPAGO_APP_ID, MERCADOPAGO_CLIENT_SECRET (no painel Supabase)
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCaller } from "../_shared/auth.ts";

const REDIRECT_URI = "https://pwxvvimdtmvziynbspgx.supabase.co/functions/v1/mp-oauth-callback";
const FINAL_REDIRECT = "https://aloclinica.com.br/dashboard/profile";

function html(body: string) {
  return new Response(body, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
function redirect(url: string) {
  return new Response(null, { status: 302, headers: { Location: url } });
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    // SECURITY: `state` is an OPAQUE CSRF token — NOT a user id. It must never be
    // trusted as identity; the linked user is resolved from a server-side record.
    const state = url.searchParams.get("state");
    const err = url.searchParams.get("error");

    if (err) return redirect(`${FINAL_REDIRECT}?mp=err&reason=${encodeURIComponent(err)}`);
    if (!code || !state) {
      return html('<h1>Parâmetros faltando</h1><p>Volte ao painel e tente novamente.</p>');
    }

    const appId = Deno.env.get("MERCADOPAGO_APP_ID");
    const clientSecret = Deno.env.get("MERCADOPAGO_CLIENT_SECRET");
    if (!appId || !clientSecret) {
      return html('<h1>Marketplace não configurado</h1><p>O administrador da plataforma precisa cadastrar MERCADOPAGO_APP_ID e MERCADOPAGO_CLIENT_SECRET.</p>');
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // SECURITY: resolve WHICH user this OAuth grant belongs to WITHOUT trusting
    // `state` (or any query/body value) as identity.
    //
    // Primary: consume a server-side `mp_oauth_states` row created when the user
    // STARTED the OAuth flow (state, user_id, expires_at). It binds this exact
    // state token to the initiating user and expires quickly. We look it up,
    // reject if missing/expired, and DELETE it (single-use, anti-replay).
    //
    // Fallback (until the initiator/table exists): require an authenticated
    // caller whose id we use directly — never `state`.
    let linkedUserId: string | null = null;
    let stateConsumed = false;

    const { data: stateRow, error: stateErr } = await sb
      .from("mp_oauth_states")
      .select("user_id, expires_at")
      .eq("state", state)
      .maybeSingle();

    if (!stateErr && stateRow) {
      const expired = stateRow.expires_at ? new Date(stateRow.expires_at).getTime() < Date.now() : false;
      // Single-use: delete regardless so it cannot be replayed.
      await sb.from("mp_oauth_states").delete().eq("state", state);
      if (expired) {
        return redirect(`${FINAL_REDIRECT}?mp=err&reason=state_expired`);
      }
      linkedUserId = stateRow.user_id;
      stateConsumed = true;
    }

    if (!stateConsumed) {
      // Table/flow not present (or unknown state) → fall back to authenticated caller.
      const caller = await getCaller(req);
      if (!caller.user) {
        console.warn("[mp-oauth-callback] no mp_oauth_states row and no authenticated caller — refusing to link");
        return redirect(`${FINAL_REDIRECT}?mp=err&reason=state_unverified`);
      }
      linkedUserId = caller.user.id;
    }

    if (!linkedUserId) {
      return redirect(`${FINAL_REDIRECT}?mp=err&reason=state_unverified`);
    }

    // Troca code por tokens
    const tokenRes = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }).toString(),
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || !tokenJson?.access_token) {
      console.error("MP oauth error:", tokenRes.status, tokenJson);
      return redirect(`${FINAL_REDIRECT}?mp=err&reason=token_exchange`);
    }

    const expiresAt = new Date(Date.now() + Number(tokenJson.expires_in ?? 0) * 1000).toISOString();

    // SECURITY: link the MP account to the server-verified user id — NOT `state`.
    const { error: upErr } = await sb.from("doctor_profiles").update({
      mp_user_id: String(tokenJson.user_id),
      mp_access_token: tokenJson.access_token,
      mp_refresh_token: tokenJson.refresh_token ?? null,
      mp_token_expires_at: expiresAt,
      mp_connected_at: new Date().toISOString(),
    } as any).eq("user_id", linkedUserId);

    if (upErr) {
      console.error("doctor_profiles update error:", upErr);
      return redirect(`${FINAL_REDIRECT}?mp=err&reason=db_update`);
    }

    return redirect(`${FINAL_REDIRECT}?mp=ok`);
  } catch (e: any) {
    console.error("mp-oauth-callback fatal:", e?.message);
    return redirect(`${FINAL_REDIRECT}?mp=err&reason=internal`);
  }
});
