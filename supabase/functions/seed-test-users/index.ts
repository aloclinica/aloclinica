import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEST_USERS = [
  { email: "paciente@teste.com", password: "Teste123!", role: "patient", first_name: "Ana", last_name: "Paciente" },
  { email: "medico@teste.com", password: "Teste123!", role: "doctor", first_name: "Carlos", last_name: "Médico" },
  { email: "clinica@teste.com", password: "Teste123!", role: "clinic", first_name: "Maria", last_name: "Clínica" },
  { email: "recepcao@teste.com", password: "Teste123!", role: "receptionist", first_name: "João", last_name: "Recepção" },
  { email: "suporte@teste.com", password: "Teste123!", role: "support", first_name: "Paula", last_name: "Suporte" },
  { email: "parceiro@teste.com", password: "Teste123!", role: "partner", first_name: "Pedro", last_name: "Parceiro" },
  { email: "afiliado@teste.com", password: "Teste123!", role: "affiliate", first_name: "Lucas", last_name: "Afiliado" },
  { email: "laudista@teste.com", password: "Teste123!", role: "laudista", first_name: "Fernanda", last_name: "Laudista" },
];

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

    const { data: existing } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const existingMap = new Map((existing?.users ?? []).map((u: any) => [u.email, u]));

    const results: Record<string, unknown>[] = [];

    for (const u of TEST_USERS) {
      const existingUser = existingMap.get(u.email);

      if (existingUser) {
        const userId = (existingUser as any).id;

        // Ensure profile exists
        const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", userId).maybeSingle();
        if (!profile) {
          await supabase.from("profiles").insert({
            user_id: userId,
            first_name: u.first_name,
            last_name: u.last_name,
          });
        }

        // Ensure role exists
        const mainRole = u.role === "affiliate" ? "partner" : u.role;
        await supabase.from("user_roles").upsert({
          user_id: userId,
          role: mainRole,
        }, { onConflict: "user_id,role" });
        // Laudista also gets doctor role
        if (u.role === "laudista") {
          await supabase.from("user_roles").upsert({
            user_id: userId,
            role: "doctor",
          }, { onConflict: "user_id,role" });
        }

        // Ensure patient role also exists (default)
        await supabase.from("user_roles").upsert({
          user_id: userId,
          role: "patient",
        }, { onConflict: "user_id,role" });

        // Ensure role-specific profiles exist
        if (u.role === "doctor" || u.role === "laudista") {
          const { data: dp } = await supabase.from("doctor_profiles").select("id").eq("user_id", userId).maybeSingle();
          if (!dp) {
            await supabase.from("doctor_profiles").insert({
              user_id: userId,
              crm: u.role === "laudista" ? "654321" : "123456",
              crm_state: "SP",
              bio: u.role === "laudista" ? "Médica laudista para validação do sistema." : "Médico de teste para validação do sistema.",
              consultation_price: 89,
              is_approved: true,
              crm_verified: true,
            });
          } else {
            // Ensure approved
            await supabase.from("doctor_profiles").update({
              is_approved: true,
              crm_verified: true,
              consultation_price: 89,
              bio: u.role === "laudista" ? "Médica laudista para validação do sistema." : "Médico de teste para validação do sistema.",
            }).eq("user_id", userId);
          }
        }

        if (u.role === "clinic") {
          const { data: cp } = await supabase.from("clinic_profiles").select("id").eq("user_id", userId).maybeSingle();
          if (!cp) {
            await supabase.from("clinic_profiles").insert({
              user_id: userId, name: "Clínica Teste", cnpj: "12.345.678/0001-00", phone: "(11) 99999-0000", is_approved: true,
            });
          }
        }

        if (u.role === "partner") {
          const { data: pp } = await supabase.from("partner_profiles").select("id").eq("user_id", userId).maybeSingle();
          if (!pp) {
            await supabase.from("partner_profiles").insert({
              user_id: userId, business_name: "Farmácia Teste", partner_type: "pharmacy", cnpj: "98.765.432/0001-00", is_approved: true,
            });
          }
        }

        results.push({ email: u.email, role: u.role, status: "repaired" });
        continue;
      }

      // Create new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { first_name: u.first_name, last_name: u.last_name },
      });

      if (createError) {
        results.push({ email: u.email, role: u.role, status: "error", error: createError.message });
        continue;
      }

      const userId = newUser.user.id;

      if (u.role !== "patient") {
        const mainRole = u.role === "affiliate" ? "partner" : u.role;
        await supabase.from("user_roles").insert({ user_id: userId, role: mainRole });
        if (u.role === "laudista") {
          await supabase.from("user_roles").insert({ user_id: userId, role: "doctor" });
        }
      }

      if (u.role === "doctor" || u.role === "laudista") {
        await supabase.from("doctor_profiles").insert({
          user_id: userId,
          crm: u.role === "laudista" ? "654321" : "123456",
          crm_state: "SP",
          bio: u.role === "laudista" ? "Médica laudista para validação do sistema." : "Médico de teste para validação do sistema.",
          consultation_price: 89,
          is_approved: true,
          crm_verified: true,
        });
      }

      if (u.role === "clinic") {
        await supabase.from("clinic_profiles").insert({
          user_id: userId, name: "Clínica Teste", cnpj: "12.345.678/0001-00", phone: "(11) 99999-0000", is_approved: true,
        });
      }

      if (u.role === "partner") {
        await supabase.from("partner_profiles").insert({
          user_id: userId, business_name: "Farmácia Teste", partner_type: "pharmacy", cnpj: "98.765.432/0001-00", is_approved: true,
        });
      }

      results.push({ email: u.email, password: u.password, role: u.role, status: "created" });
    }

    return new Response(JSON.stringify({ success: true, users: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
