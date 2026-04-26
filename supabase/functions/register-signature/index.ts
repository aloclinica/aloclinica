import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * register-signature
 * Registra uma assinatura digital ICP-Brasil concluída no banco canônico.
 * Faz upload do PDF assinado para Storage e cria registro auditável.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validar JWT do médico
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const {
      document_id,
      document_type,
      related_record_id,
      doctor_name,
      doctor_crm,
      doctor_cpf,
      patient_name,
      document_hash,
      signature_data,
      certificate_alias,
      pdf_base64,
    } = body;

    // Validações obrigatórias
    if (!document_id || !document_type || !doctor_name || !doctor_crm || !doctor_cpf || !document_hash) {
      return new Response(
        JSON.stringify({
          error: "Campos obrigatórios faltando",
          required: ["document_id", "document_type", "doctor_name", "doctor_crm", "doctor_cpf", "document_hash"],
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upload do PDF assinado para Storage (se fornecido)
    let storagePath: string | null = null;
    let publicUrl: string | null = null;

    if (pdf_base64) {
      try {
        const cleanBase64 = pdf_base64.replace(/^data:application\/pdf;base64,/, "");
        const bytes = Uint8Array.from(atob(cleanBase64), (c) => c.charCodeAt(0));

        storagePath = `signed/${document_type}/${document_id}.pdf`;

        const { error: uploadErr } = await supabase.storage
          .from("prescriptions")
          .upload(storagePath, bytes, {
            contentType: "application/pdf",
            upsert: true,
          });

        if (uploadErr) {
          console.error("Storage upload error:", uploadErr);
        } else {
          const { data: urlData } = supabase.storage
            .from("prescriptions")
            .getPublicUrl(storagePath);
          publicUrl = urlData?.publicUrl ?? null;
        }
      } catch (e) {
        console.error("PDF upload failed:", e);
      }
    }

    // Registrar assinatura
    const { data: signature, error: sigErr } = await supabase
      .from("digital_signatures")
      .insert({
        document_id,
        document_type,
        related_record_id: related_record_id || null,
        user_id: userData.user.id,
        doctor_name,
        doctor_crm,
        doctor_cpf,
        patient_name: patient_name || null,
        document_hash,
        signature_data: signature_data || {},
        certificate_alias: certificate_alias || null,
        provider: "vidaas",
        storage_path: storagePath,
        public_url: publicUrl,
        is_valid: true,
        signed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (sigErr) {
      // Se já existe, retornar conflito mas não erro
      if (sigErr.code === "23505") {
        return new Response(
          JSON.stringify({ error: "Documento já assinado", document_id }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw sigErr;
    }

    return new Response(
      JSON.stringify({
        success: true,
        signature,
        verification_url: `${new URL(req.url).origin.replace("functions", "")}/validar-receita/${document_id}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("register-signature error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});