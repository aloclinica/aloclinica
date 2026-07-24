/**
 * mercadopago-create-subscription
 *
 * Cria uma assinatura recorrente usando o Pre-Approval API do Mercado Pago.
 * MP cuida da cobrança recorrente automaticamente (não precisa cron).
 *
 * Body:
 *   {
 *     plan_id: string,                                  // UUID
 *     plan_table?: "plans" | "pingo_card_plans",        // default: "plans"
 *     billing_cycle?: "monthly" | "yearly",             // default: "monthly"
 *     card_token: string,                               // tokenizado client-side
 *     payer_email: string,                              // pode ser do user.email
 *     external_reference?: string,
 *     metadata?: Record<string, unknown>                // attach extra info
 *   }
 *
 * Retorna: { subscription_id, mp_preapproval_id, status, init_point }
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

    const {
      plan_id,
      plan_table = "plans",
      billing_cycle = "monthly",
      card_token,
      payer_email,
      external_reference,
      metadata,
      skip_db_insert = false,  // pra plan_table != "plans", frontend insere na tabela específica
      holder_name,
      card_last4,
      card_brand,
    } = await req.json();

    if (!plan_id) return json({ error: "plan_id obrigatório" }, 400);
    if (!card_token) return json({ error: "card_token obrigatório" }, 400);

    // Whitelist de tabelas pra evitar SQL injection no nome
    const ALLOWED_TABLES = new Set(["plans", "pingo_card_plans"]);
    if (!ALLOWED_TABLES.has(plan_table)) {
      return json({ error: `plan_table inválido: ${plan_table}` }, 400);
    }

    // Busca plano
    const { data: plan } = await (admin as any)
      .from(plan_table)
      .select("id, name, slug, price_monthly, price_yearly")
      .eq("id", plan_id)
      .single();
    if (!plan) return json({ error: "Plano não encontrado" }, 404);

    const isYearly = billing_cycle === "yearly";
    const amount = Number(isYearly ? plan.price_yearly : plan.price_monthly);
    if (!amount || amount <= 0) return json({ error: "Preço inválido no plano" }, 400);

    const email = payer_email || user.email || "";
    if (!email) return json({ error: "email obrigatório" }, 400);

    // TRAVA DE DUPLICIDADE: uma assinatura ativa por usuário (por tabela). Sem isto,
    // duplo clique / replay cria vários preapprovals 'authorized' que cobram em
    // paralelo (cobrança dobrada). A idempotencyKey abaixo cobre o replay de rede;
    // esta trava cobre o duplo submit com tokens diferentes.
    const subTable = plan_table === "pingo_card_plans" ? "pingo_card_subscriptions" : "subscriptions";
    const { data: existingActive } = await (admin as any)
      .from(subTable)
      .select("id, status")
      .eq("user_id", user.id)
      .in("status", ["active", "authorized", "pending"])
      .limit(1)
      .maybeSingle();
    if (existingActive) {
      return json({ error: "Você já possui uma assinatura ativa ou em processamento.", subscription_id: existingActive.id }, 409);
    }

    // Pre-approval body
    const startDate = new Date();
    startDate.setSeconds(0, 0);
    const preapprovalBody = {
      reason: `${plan.name} - AloClínica`,
      external_reference: external_reference || `sub_user_${user.id}_plan_${plan_id}_${billing_cycle}`,
      payer_email: email,
      card_token_id: card_token,
      auto_recurring: {
        frequency: 1,
        frequency_type: isYearly ? "months" : "months",
        // anual: 12 meses entre cobranças. mensal: 1 mês.
        // (Mercado Pago não tem "yearly" — usa frequency=12, frequency_type="months")
        ...(isYearly ? { frequency: 12 } : { frequency: 1 }),
        start_date: startDate.toISOString(),
        transaction_amount: amount,
        currency_id: "BRL",
      },
      back_url: `${Deno.env.get("APP_URL") || "https://aloclinica.com.br"}/dashboard/billing`,
      status: "authorized", // Cria já autorizado (com token)
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`,
    };

    // Idempotência: chave estável derivada do card_token (uso único por
    // tokenização) — retry de rede da MESMA requisição não cria 2º preapproval.
    const res = await mpRequest<any>("POST", "/preapproval", preapprovalBody, {
      idempotencyKey: `preapproval-${user.id}-${plan_id}-${billing_cycle}-${card_token}`.slice(0, 120),
    });

    if (!res.ok) {
      return json({
        error: res.data?.message || res.data?.error || "Falha ao criar assinatura MP",
        gateway: res.data,
      }, 400);
    }

    // Pingo Card → inserir na tabela específica (a não ser que o cliente peça pra pular)
    if (plan_table === "pingo_card_plans" && !skip_db_insert) {
      const cardNumber = (card_last4 || "0000").padStart(4, "0");
      const displayCard = `•••• •••• •••• ${cardNumber}`;
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + (isYearly ? 12 : 1));

      const { data: pcSub, error: pcErr } = await (admin as any)
        .from("pingo_card_subscriptions")
        .insert({
          user_id: user.id,
          plan_id,
          card_number: displayCard,
          card_holder_name: holder_name ?? user.email,
          status: res.data.status === "authorized" ? "active" : "pending",
          billing_cycle,
          gateway: "mercadopago",
          mp_preapproval_id: res.data.id,
          mp_subscription_id: res.data.id,
          mp_payer_id: res.data.payer_id ?? null,
          started_at: new Date().toISOString(),
          current_period_end: periodEnd.toISOString(),
          next_charge_at: res.data.next_payment_date || periodEnd.toISOString(),
        })
        .select("id")
        .single();

      if (pcErr) {
        await mpRequest("PUT", `/preapproval/${res.data.id}`, { status: "cancelled" });
        return json({ error: pcErr.message }, 500);
      }

      // Cria primeira fatura "pending" — webhook marca como paid quando MP confirmar
      await (admin as any).from("pingo_card_invoices").insert({
        subscription_id: pcSub.id,
        user_id: user.id,
        amount,
        status: res.data.status === "authorized" ? "paid" : "pending",
        due_date: new Date().toISOString(),
        paid_at: res.data.status === "authorized" ? new Date().toISOString() : null,
        description: `${plan.name} - ${isYearly ? "Anual" : "Mensal"}`,
      });

      return json({
        subscription_id: pcSub.id,
        mp_preapproval_id: res.data.id,
        status: res.data.status,
        init_point: res.data.init_point,
        next_payment_date: res.data.next_payment_date,
        amount,
        table: "pingo_card_subscriptions",
      });
    }

    if (skip_db_insert) {
      return json({
        subscription_id: null,
        mp_preapproval_id: res.data.id,
        status: res.data.status,
        init_point: res.data.init_point,
        next_payment_date: res.data.next_payment_date,
        amount,
      });
    }

    // Persiste em subscriptions
    const { data: sub, error } = await admin.from("subscriptions").insert({
      user_id: user.id,
      plan_id,
      gateway: "mercadopago",
      mp_preapproval_id: res.data.id,
      mp_payer_id: res.data.payer_id,
      amount_cents: Math.round(amount * 100),
      currency: "BRL",
      interval_days: isYearly ? 365 : 30,
      billing_cycle,
      status: res.data.status === "authorized" ? "active" : "pending",
      started_at: new Date().toISOString(),
      next_charge_at: res.data.next_payment_date || null,
      metadata: { ...res.data, ...(metadata ?? {}), plan_table },
    } as any).select("id").single();

    if (error) {
      // Rollback no MP se falhou local
      await mpRequest("PUT", `/preapproval/${res.data.id}`, { status: "cancelled" });
      return json({ error: error.message }, 500);
    }

    return json({
      subscription_id: sub!.id,
      mp_preapproval_id: res.data.id,
      status: res.data.status,
      init_point: res.data.init_point,
    });
  } catch (e) {
    console.error("[mp-create-subscription] error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...mpCorsHeaders, "Content-Type": "application/json" },
  });
}
