// admin-user-lookup — resolve dados de usuário (email <-> id) do lado SERVIDOR.
//
// Antes o painel chamava db.auth.admin.listUsers / getUserById direto do NAVEGADOR,
// que exige a service_role key (não existe no client) — então sempre falhava
// silenciosamente. Aqui roda no servidor com service role e é restrita a admins.
//
// Entrada: { email }  -> retorna { id, email } do usuário com aquele e-mail
//          { user_id } -> retorna { id, email } daquele usuário
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCaller } from "../_shared/auth.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    // SECURITY: só usuário autenticado E com papel admin.
    const caller = await getCaller(req);
    if (!caller.user) return json({ error: "forbidden" }, 403);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: isAdmin } = await admin
      .from("user_roles").select("id")
      .eq("user_id", caller.user.id).eq("role", "admin").maybeSingle();
    if (!isAdmin) return json({ error: "forbidden — admin only" }, 403);

    const { email, user_id } = await req.json().catch(() => ({}));

    if (user_id) {
      const { data } = await admin.auth.admin.getUserById(String(user_id));
      return json({ id: data?.user?.id ?? null, email: data?.user?.email ?? null });
    }

    if (email) {
      const target = String(email).toLowerCase().trim();
      // A Admin API não filtra por e-mail no client JS — paginamos e procuramos.
      for (let page = 1; page <= 40; page++) {
        const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
        const list = data?.users ?? [];
        const u = list.find((x) => (x.email ?? "").toLowerCase() === target);
        if (u) return json({ id: u.id, email: u.email });
        if (list.length < 200) break; // última página
      }
      return json({ id: null, email: null });
    }

    return json({ error: "email or user_id required" }, 400);
  } catch (e) {
    console.error("[admin-user-lookup]", e);
    return json({ error: (e as Error).message }, 500);
  }
});
