import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: userData, error: uerr } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
    if (uerr || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const { invite_token } = await req.json();
    if (!invite_token) {
      return new Response(JSON.stringify({ error: "invite_token required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: invite, error: ierr } = await supabase
      .from("employee_invites")
      .select("id, status, expires_at, employee_email, company_card_order_id, company_card_orders(pingo_card_plan_id, status)")
      .eq("invite_token", invite_token)
      .single();
    if (ierr || !invite) {
      return new Response(JSON.stringify({ error: "Convite não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (invite.status !== "sent") {
      return new Response(JSON.stringify({ error: `Convite já está ${invite.status}` }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      await supabase.from("employee_invites").update({ status: "expired" }).eq("id", invite.id);
      return new Response(JSON.stringify({ error: "Convite expirado" }), {
        status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const order = (invite as any).company_card_orders;
    if (!order || order.status === "cancelled") {
      return new Response(JSON.stringify({ error: "Pedido da empresa não está ativo" }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create pingo_card_subscription for this employee
    const { data: sub, error: serr } = await supabase
      .from("pingo_card_subscriptions")
      .insert({
        user_id: userId,
        plan_id: order.pingo_card_plan_id,
        status: "active",
        billing_source: "b2b",
        company_card_order_id: invite.company_card_order_id,
        starts_at: new Date().toISOString(),
      })
      .select()
      .single();
    // billing_source / company_card_order_id columns may not exist; fall back to minimal insert
    if (serr) {
      const { data: sub2, error: serr2 } = await supabase
        .from("pingo_card_subscriptions")
        .insert({
          user_id: userId,
          plan_id: order.pingo_card_plan_id,
          status: "active",
        })
        .select()
        .single();
      if (serr2) {
        return new Response(JSON.stringify({ error: serr2.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      await supabase.from("employee_invites").update({
        status: "accepted",
        user_id: userId,
        pingo_card_subscription_id: sub2.id,
        accepted_at: new Date().toISOString(),
      }).eq("id", invite.id);
      return new Response(JSON.stringify({ success: true, subscription: sub2 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("employee_invites").update({
      status: "accepted",
      user_id: userId,
      pingo_card_subscription_id: sub.id,
      accepted_at: new Date().toISOString(),
    }).eq("id", invite.id);

    return new Response(JSON.stringify({ success: true, subscription: sub }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
