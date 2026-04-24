import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "servicosplenasaude@gmail.com";
const ADMIN_PASSWORD = "@Costagold2026";
const ADMIN_FIRST_NAME = "Plena";
const ADMIN_LAST_NAME = "Saúde";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const log: string[] = [];

    // 1. Procurar usuário existente
    const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const existing = (list?.users ?? []).find(
      (u: any) => (u.email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase(),
    );

    let userId: string;

    if (existing) {
      userId = (existing as any).id;
      log.push(`Usuário existente encontrado: ${userId}`);

      // Atualizar senha + confirmar email
      const { error: updErr } = await supabase.auth.admin.updateUserById(userId, {
        password: ADMIN_PASSWORD,
        email_confirm: true,
      });
      if (updErr) throw new Error(`Erro ao atualizar senha: ${updErr.message}`);
      log.push("Senha redefinida e email confirmado.");
    } else {
      // 2. Criar novo usuário
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: {
          first_name: ADMIN_FIRST_NAME,
          last_name: ADMIN_LAST_NAME,
        },
      });
      if (createErr || !created.user) {
        throw new Error(`Erro ao criar usuário: ${createErr?.message}`);
      }
      userId = created.user.id;
      log.push(`Usuário criado: ${userId}`);
    }

    // 3. Garantir profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profile) {
      const { error: profErr } = await supabase.from("profiles").insert({
        user_id: userId,
        first_name: ADMIN_FIRST_NAME,
        last_name: ADMIN_LAST_NAME,
      });
      if (profErr) log.push(`Aviso profile: ${profErr.message}`);
      else log.push("Profile criado.");
    } else {
      log.push("Profile já existe.");
    }

    // 4. Atribuir role admin (e manter patient como base)
    const rolesToEnsure = ["admin", "patient"];
    for (const role of rolesToEnsure) {
      const { error: roleErr } = await supabase
        .from("user_roles")
        .upsert(
          { user_id: userId, role },
          { onConflict: "user_id,role" },
        );
      if (roleErr) log.push(`Aviso role ${role}: ${roleErr.message}`);
      else log.push(`Role '${role}' garantida.`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        email: ADMIN_EMAIL,
        log,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
