import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * lgpd-export-user — gera JSON com TODOS os dados de um usuário (LGPD).
 *
 * Compliance LGPD Art. 18 (direito do titular dos dados pessoais).
 *
 * Body: { user_id?: UUID }  (admin pode pedir; user comum só os seus)
 *
 * Cria registro em lgpd_export_jobs (status pending → processing → completed).
 * Retorna URL assinada do JSON em Storage (expira em 7 dias).
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// SECURITY: explicit { table: ownerColumn } map. Each table is filtered ONLY on
// its correct owner column — no cross-column guessing/fallback that could leak
// another user's rows. Tables not listed here are skipped (see REQUIRES notes).
const TABLE_OWNER_COLUMN: Record<string, string> = {
  profiles: "user_id",
  user_roles: "user_id",
  user_consents: "user_id",
  user_consent_log: "user_id",
  kyc_verificacoes: "user_id",
  appointments: "patient_id",
  prescriptions: "patient_id",
  messages: "user_id",
  notifications: "user_id",
  payment_transactions: "user_id",
  subscriptions: "user_id",
  saved_cards: "user_id",
  withdrawal_requests: "user_id",
  patient_consents: "patient_id",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user: requester } } = await userClient.auth.getUser();
    if (!requester) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { user_id: targetId } = await req.json();
    let targetUserId = requester.id;

    // Se admin pediu pra outro user
    if (targetId && targetId !== requester.id) {
      const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", requester.id);
      if (!(roles ?? []).some((r: any) => r.role === "admin")) {
        return new Response(JSON.stringify({ error: "Forbidden — only admin can export other users" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      targetUserId = targetId;
    }

    // Cria job em pending
    const { data: job, error: jobErr } = await admin
      .from("lgpd_export_jobs")
      .insert({
        user_id: targetUserId,
        requested_by: requester.id,
        status: "processing",
      })
      .select()
      .single();

    if (jobErr || !job) {
      return new Response(JSON.stringify({ error: "Falha ao criar job", details: jobErr?.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Coleta dados de todas as tabelas
    const exported: Record<string, any[]> = {};
    const exportedNames: string[] = [];

    // Auth user (sem senha)
    try {
      const { data: { user: targetUser } } = await admin.auth.admin.getUserById(targetUserId);
      if (targetUser) {
        exported["auth_user"] = [{
          id: targetUser.id,
          email: targetUser.email,
          phone: targetUser.phone,
          created_at: targetUser.created_at,
          last_sign_in_at: targetUser.last_sign_in_at,
          email_confirmed_at: targetUser.email_confirmed_at,
          user_metadata: targetUser.user_metadata,
        }];
        exportedNames.push("auth_user");
      }
    } catch { /* skip */ }

    // SECURITY: filter each table on its single correct owner column only.
    for (const [table, ownerColumn] of Object.entries(TABLE_OWNER_COLUMN)) {
      try {
        const { data, error } = await admin.from(table).select("*").eq(ownerColumn, targetUserId);
        if (!error && data) {
          exported[table] = data;
          exportedNames.push(table);
        }
      } catch { /* tabela pode não existir, skip */ }
    }

    // Build JSON
    const jsonContent = JSON.stringify({
      _meta: {
        exported_at: new Date().toISOString(),
        export_job_id: job.id,
        user_id: targetUserId,
        requested_by: requester.id,
        tables_count: exportedNames.length,
        compliance: "LGPD Art. 18 - Right to data portability",
      },
      data: exported,
    }, null, 2);

    const sizeBytes = new TextEncoder().encode(jsonContent).length;
    const fileName = `lgpd-${targetUserId}-${Date.now()}.json`;
    const filePath = `lgpd-exports/${fileName}`;

    // Upload para Storage (bucket privado 'lgpd-exports' — criar se não existir)
    const { error: upErr } = await admin.storage.from("lgpd-exports").upload(filePath, jsonContent, {
      contentType: "application/json",
      upsert: true,
    });

    if (upErr) {
      // Bucket pode não existir — tenta criar
      await (admin.storage as any).createBucket("lgpd-exports", { public: false }).catch(() => {});
      const retry = await admin.storage.from("lgpd-exports").upload(filePath, jsonContent, {
        contentType: "application/json",
        upsert: true,
      });
      if (retry.error) {
        await admin.from("lgpd_export_jobs").update({
          status: "failed",
          error: retry.error.message,
        }).eq("id", job.id);
        return new Response(JSON.stringify({ error: "Upload falhou", details: retry.error.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // SECURITY: short-lived signed URL (600s) instead of 7 days. See REQUIRES
    // note — the persisted download_url in lgpd_export_jobs should be dropped in
    // favour of an authenticated, re-signed-on-demand download endpoint.
    const SIGNED_URL_TTL_SECONDS = 600;
    const { data: signed } = await admin.storage.from("lgpd-exports").createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS);

    const expiresAt = new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000).toISOString();

    await admin.from("lgpd_export_jobs").update({
      status: "completed",
      download_url: signed?.signedUrl ?? null,
      expires_at: expiresAt,
      size_bytes: sizeBytes,
      tables_exported: exportedNames,
      completed_at: new Date().toISOString(),
    }).eq("id", job.id);

    return new Response(JSON.stringify({
      ok: true,
      job_id: job.id,
      download_url: signed?.signedUrl,
      expires_at: expiresAt,
      size_bytes: sizeBytes,
      tables_count: exportedNames.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[lgpd-export-user] error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
