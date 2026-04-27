import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CompanyCheckoutBody {
  cnpj: string;
  legal_name: string;
  trade_name?: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  address?: Record<string, unknown>;
  pingo_card_plan_slug: string;
  num_seats: number;
  billing_cycle: "monthly" | "yearly";
  employees?: { email: string; name?: string; cpf?: string }[];
}

const generateInviteToken = () =>
  crypto.randomUUID().replace(/-/g, "") + Date.now().toString(36);

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

    const body = (await req.json()) as CompanyCheckoutBody;
    if (!body.cnpj || !body.legal_name || !body.contact_email || !body.pingo_card_plan_slug || !body.num_seats) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (body.num_seats < 5) {
      return new Response(JSON.stringify({ error: "Mínimo de 5 cartões para venda corporativa" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: plan, error: perr } = await supabase
      .from("pingo_card_plans")
      .select("id, name, price_monthly, price_yearly")
      .eq("slug", body.pingo_card_plan_slug)
      .eq("is_active", true)
      .single();
    if (perr || !plan) {
      return new Response(JSON.stringify({ error: "Plano não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 15% B2B discount on per-seat pricing
    const basePrice = body.billing_cycle === "yearly" ? Number(plan.price_yearly) : Number(plan.price_monthly);
    const pricePerSeat = Math.round(basePrice * 0.85 * 100) / 100;
    const totalAmount = Math.round(pricePerSeat * body.num_seats * 100) / 100;

    // Upsert company
    const { data: company, error: cerr } = await supabase
      .from("companies")
      .upsert(
        {
          cnpj: body.cnpj.replace(/\D/g, ""),
          legal_name: body.legal_name,
          trade_name: body.trade_name ?? null,
          contact_name: body.contact_name,
          contact_email: body.contact_email,
          contact_phone: body.contact_phone ?? null,
          address: body.address ?? {},
          managed_by_user_id: userId,
          status: "active",
        },
        { onConflict: "cnpj" }
      )
      .select()
      .single();
    if (cerr || !company) {
      return new Response(JSON.stringify({ error: cerr?.message ?? "Falha ao criar empresa" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create card order
    const nextBilling = new Date();
    if (body.billing_cycle === "yearly") nextBilling.setFullYear(nextBilling.getFullYear() + 1);
    else nextBilling.setMonth(nextBilling.getMonth() + 1);

    const { data: order, error: oerr } = await supabase
      .from("company_card_orders")
      .insert({
        company_id: company.id,
        pingo_card_plan_id: plan.id,
        num_seats: body.num_seats,
        price_per_seat: pricePerSeat,
        total_amount: totalAmount,
        billing_cycle: body.billing_cycle,
        status: "pending_payment",
        next_billing_date: nextBilling.toISOString().slice(0, 10),
      })
      .select()
      .single();
    if (oerr || !order) {
      return new Response(JSON.stringify({ error: oerr?.message ?? "Falha ao criar pedido" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create employee invites if provided (otherwise empresa cadastra depois pelo painel)
    const invites = (body.employees ?? []).slice(0, body.num_seats).map((emp) => ({
      company_card_order_id: order.id,
      invite_token: generateInviteToken(),
      employee_email: emp.email,
      employee_name: emp.name ?? null,
      employee_cpf: emp.cpf ? emp.cpf.replace(/\D/g, "") : null,
      status: "sent",
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }));
    let createdInvites: any[] = [];
    if (invites.length) {
      const { data: ins, error: ierr } = await supabase
        .from("employee_invites")
        .insert(invites)
        .select("id, employee_email, invite_token");
      if (ierr) console.warn("invite insert failed", ierr);
      createdInvites = ins ?? [];

      // Email each invitee
      const siteUrl = Deno.env.get("SITE_URL") || "https://aloclinica.com.br";
      for (const inv of createdInvites) {
        try {
          await supabase.functions.invoke("send-email", {
            body: {
              type: "doctor_invite_code",
              to: inv.employee_email,
              data: {
                name: "Colaborador",
                invite_code: inv.invite_token.slice(0, 8).toUpperCase(),
                register_url: `${siteUrl}/funcionario/ativar/${inv.invite_token}`,
              },
            },
          });
        } catch { /* non-blocking */ }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        company,
        order,
        invites: createdInvites,
        next_step: "redirect to /empresas/pagamento/" + order.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
