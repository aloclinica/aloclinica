import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function checkRateLimit(identifier: string, endpoint: string, maxReqs: number, windowMin: number): Promise<boolean> {
  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const since = new Date(Date.now() - windowMin * 60000).toISOString();
    const { count } = await sb.from("rate_limits").select("id", { count: "exact", head: true })
      .eq("identifier", identifier).eq("endpoint", endpoint).gte("window_start", since);
    if ((count ?? 0) >= maxReqs) return false;
    await sb.from("rate_limits").insert({ identifier, endpoint, window_start: new Date().toISOString() });
    return true;
  } catch { return true; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // SECURITY (F1): endpoint DESATIVADO. Este fluxo legado (marca antiga "Alô Médico")
  // criava uma consulta SEM cobrança e sem payment_status — consulta avulsa grátis.
  // Não é usado pelo app atual. O agendamento passa por /book + mercadopago-create-payment
  // (preço autoritativo no servidor). Reabrir só com fluxo de pagamento do convidado.
  return new Response(
    JSON.stringify({ error: "Guest checkout desativado. Use o agendamento com pagamento." }),
    { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );

  // eslint-disable-next-line no-unreachable
  try {
    // Rate limit: 5 checkouts per 15 minutes per IP
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const allowed = await checkRateLimit(clientIP, "guest-checkout", 5, 15);
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Muitas tentativas. Aguarde." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { full_name, email, phone, cpf, date_of_birth, doctor_id, scheduled_at, specialty_name } = body;

    if (!full_name || !email || !phone || !cpf || !doctor_id || !scheduled_at) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios faltando" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Create guest patient
    const { data: guest, error: guestError } = await supabase
      .from("guest_patients")
      .insert({ full_name, email, phone, cpf, date_of_birth: date_of_birth || null })
      .select("id")
      .single();

    if (guestError) {
      console.error("Guest insert error:", guestError);
      return new Response(JSON.stringify({ error: "Erro ao registrar paciente", details: guestError }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Generate access token
    const accessToken = crypto.randomUUID() + "-" + crypto.randomUUID();

    // 3. Create appointment
    const { data: appointment, error: aptError } = await supabase
      .from("appointments")
      .insert({
        guest_patient_id: guest.id,
        doctor_id,
        scheduled_at,
        status: "scheduled",
        access_token: accessToken,
        patient_id: null,
      })
      .select("id")
      .single();

    if (aptError) {
      console.error("Appointment insert error:", aptError);
      return new Response(JSON.stringify({ error: "Erro ao criar consulta", details: aptError }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Get doctor info for notification
    const { data: doctorProfile } = await supabase
      .from("doctor_profiles")
      .select("user_id, crm, crm_state")
      .eq("id", doctor_id)
      .single();

    let doctorName = "Médico";
    let doctorEmail = "";
    if (doctorProfile) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", doctorProfile.user_id)
        .single();
      if (profile) doctorName = `Dr(a). ${profile.first_name} ${profile.last_name}`;

      // Get doctor email from auth
      const { data: authUser } = await supabase.auth.admin.getUserById(doctorProfile.user_id);
      if (authUser?.user?.email) doctorEmail = authUser.user.email;
    }

    const scheduledDate = new Date(scheduled_at);
    const dateStr = scheduledDate.toLocaleDateString("pt-BR");
    const timeStr = scheduledDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    // Build consultation URL
    const baseUrl = req.headers.get("origin") || "https://alomedico.com";
    const consultationUrl = `${baseUrl}/consulta?token=${accessToken}`;

    // 5. Send email to patient
    try {
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (RESEND_API_KEY) {
        const emailFrom = Deno.env.get("EMAIL_FROM") || "Alô Médico <noreply@alomedico.com>";

        // Email to patient
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
          body: JSON.stringify({
            from: emailFrom,
            to: [email],
            subject: "✅ Consulta Avulsa Confirmada — Alô Médico",
            html: `
              <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
                <h2 style="color:#1a6fc4;">Consulta Confirmada!</h2>
                <p>Olá <strong>${full_name}</strong>,</p>
                <p>Sua consulta avulsa foi agendada com sucesso.</p>
                <div style="background:white;padding:16px;border-radius:8px;margin:16px 0;">
                  <p><strong>🩺 Médico:</strong> ${doctorName}</p>
                  <p><strong>📋 Especialidade:</strong> ${specialty_name || "Clínica Geral"}</p>
                  <p><strong>📅 Data:</strong> ${dateStr}</p>
                  <p><strong>⏰ Horário:</strong> ${timeStr}</p>
                </div>
                <p><strong>Acesse sua consulta pelo link abaixo:</strong></p>
                <a href="${consultationUrl}" style="display:inline-block;background:#1a6fc4;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
                  Entrar na Consulta
                </a>
                <p style="color:#666;font-size:12px;">Acesse 5 minutos antes do horário agendado.</p>
                <p style="color:#666;font-size:12px;">Alô Médico — Telemedicina</p>
              </div>
            `,
          }),
        });

        // Email to doctor
        if (doctorEmail) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
            body: JSON.stringify({
              from: emailFrom,
              to: [doctorEmail],
              subject: "📋 Nova Consulta Avulsa Agendada — Alô Médico",
              html: `
                <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
                  <h2 style="color:#1a6fc4;">Nova Consulta Agendada</h2>
                  <p>Olá <strong>${doctorName}</strong>,</p>
                  <p>Um paciente agendou uma consulta avulsa com você.</p>
                  <div style="background:white;padding:16px;border-radius:8px;margin:16px 0;">
                    <p><strong>👤 Paciente:</strong> ${full_name}</p>
                    <p><strong>📋 Especialidade:</strong> ${specialty_name || "Clínica Geral"}</p>
                    <p><strong>📅 Data:</strong> ${dateStr}</p>
                    <p><strong>⏰ Horário:</strong> ${timeStr}</p>
                  </div>
                  <p>Acesse o painel para gerenciar a consulta.</p>
                  <p style="color:#666;font-size:12px;">Alô Médico — Telemedicina</p>
                </div>
              `,
            }),
          });
        }
      } else {
        console.info("[DEV] Guest checkout emails would be sent to:", email, doctorEmail);
      }
    } catch (emailErr) {
      console.error("Email sending error:", emailErr);
      // Don't fail the whole request if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        appointment_id: appointment.id,
        access_token: accessToken,
        consultation_url: consultationUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
