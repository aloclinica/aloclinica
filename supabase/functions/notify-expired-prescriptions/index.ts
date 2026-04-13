import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find prescriptions expiring in 7 days or less
    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const { data: expiringPrescriptions } = await supabase
      .from("ophthalmology_prescriptions")
      .select("id, patient_id, expiry_date, doctor:doctor_id(full_name)")
      .lte("expiry_date", sevenDaysFromNow.toISOString().split("T")[0])
      .gt("expiry_date", today.toISOString().split("T")[0])
      .eq("notified", false);

    if (!expiringPrescriptions || expiringPrescriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, notified: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let notified = 0;

    for (const prescription of expiringPrescriptions) {
      const daysUntilExpiry = Math.ceil(
        (new Date(prescription.expiry_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Insert notification
      await supabase.from("notifications").insert({
        user_id: prescription.patient_id,
        title: "Prescrição Oftalmológica em Vencimento",
        message: `Sua prescrição vence em ${daysUntilExpiry} dia(s). Solicite uma nova consulta com ${prescription.doctor?.full_name} para renovar.`,
        type: "warning",
        link: `/meu-perfil/exames-oftalmologicos`,
      });

      // Mark as notified
      await supabase
        .from("ophthalmology_prescriptions")
        .update({ notified: true })
        .eq("id", prescription.id);

      notified++;
    }

    // Send emails (non-blocking)
    try {
      const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

      for (const prescription of expiringPrescriptions) {
        const { data: user } = await supabase.auth.admin.getUserById(prescription.patient_id);
        if (user?.user?.email) {
          fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_KEY}` },
            body: JSON.stringify({
              type: "prescription_expiring",
              to: user.user.email,
              data: {
                doctor_name: prescription.doctor?.full_name || "Oftalmologista",
                expiry_date: new Date(prescription.expiry_date).toLocaleDateString("pt-BR"),
              },
            }),
          }).catch((e) => console.warn("Email failed:", e));
        }
      }
    } catch (e) {
      console.warn("Email send failed:", e);
    }

    return new Response(
      JSON.stringify({ success: true, notified }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
