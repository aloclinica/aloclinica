/**
 * mercadopago-cancel-subscription
 *
 * Cancela uma assinatura (preapproval) no Mercado Pago e atualiza local.
 *
 * Body: { subscription_id: string }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { mpRequest, mpCorsHeaders } from "../_shared/mercadopago.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: mpCorsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // SECURITY: cancellation is ALWAYS keyed by a subscription row we own — a raw
    // body `mp_preapproval_id` is never trusted (was an IDOR: any user could
    // cancel another user's subscription). subscription_id is now required.
    const { subscription_id, table = "subscriptions" } = await req.json();
    if (!subscription_id) {
      return json({ error: "subscription_id obrigatório" }, 400);
    }

    const ALLOWED_TABLES = new Set(["subscriptions", "pingo_card_subscriptions"]);
    if (!ALLOWED_TABLES.has(table)) return json({ error: `table inválida: ${table}` }, 400);

    // SECURITY: resolve the subscription and require ownership (or admin) before
    // touching Mercado Pago. Admins can cancel any subscription; users only their own.
    const { data: sub } = await (admin as any)
      .from(table)
      .select("id, user_id, mp_preapproval_id, gateway")
      .eq("id", subscription_id)
      .maybeSingle();
    if (!sub) return json({ error: "Assinatura não encontrada" }, 404);

    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
    const isAdmin = (roles ?? []).some((r: any) => r.role === "admin");
    if (sub.user_id !== user.id && !isAdmin) {
      return json({ error: "Sem permissão" }, 403);
    }

    const preapprovalId = sub.mp_preapproval_id;
    const gateway = sub.gateway ?? "mercadopago";

    if (gateway === "mercadopago" && preapprovalId) {
      const cancel = await mpRequest("PUT", `/preapproval/${preapprovalId}`, { status: "cancelled" });
      if (!cancel.ok) {
        console.error("[mp-cancel-sub] falha ao cancelar no MP", cancel.data);
        // Continua atualizando local mesmo se MP falhou — pode estar já cancelado lá
      }
    }

    await (admin as any)
      .from(table)
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        next_charge_at: null,
      })
      .eq("id", subscription_id);

    return json({ ok: true });
  } catch (e) {
    console.error("[mp-cancel-sub] error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...mpCorsHeaders, "Content-Type": "application/json" },
  });
}
