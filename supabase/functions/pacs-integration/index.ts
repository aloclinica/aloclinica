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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action } = body;

    // ── orthanc_webhook: Receives DICOM study from Orthanc DICOM Router ──
    if (action === "orthanc_webhook") {
      // Validate webhook secret if configured
      const webhookSecret = Deno.env.get("PACS_WEBHOOK_SECRET");
      if (webhookSecret) {
        const providedSecret = req.headers.get("x-pacs-secret") || body.webhook_secret;
        if (providedSecret !== webhookSecret) {
          return new Response(JSON.stringify({ error: "Webhook secret inválido" }), {
            status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      const {
        study_uid, patient_name, patient_id: orthancPatientId,
        modality, study_description, exam_type,
        priority, requesting_doctor_id, specialty_required,
        files // array of { file_name, file_base64, content_type }
      } = body;

      if (!study_uid) {
        return new Response(JSON.stringify({ error: "study_uid é obrigatório" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if study already exists
      const { data: existing } = await supabase
        .from("exam_requests")
        .select("id")
        .eq("orthanc_study_uid", study_uid)
        .maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({ success: true, exam_request_id: existing.id, message: "Estudo já registrado" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find or use requesting doctor
      let doctorId = requesting_doctor_id;
      if (!doctorId) {
        // Use first approved doctor as fallback
        const { data: doc } = await supabase
          .from("doctor_profiles")
          .select("id")
          .eq("is_approved", true)
          .limit(1)
          .maybeSingle();
        doctorId = doc?.id;
      }

      if (!doctorId) {
        return new Response(JSON.stringify({ error: "Nenhum médico solicitante encontrado" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create exam request
      const examType = exam_type || study_description || `${modality || "DICOM"} - ${patient_name || "Anônimo"}`;
      const { data: examReq, error: examErr } = await supabase
        .from("exam_requests")
        .insert({
          requesting_doctor_id: doctorId,
          exam_type: examType,
          clinical_info: `Paciente: ${patient_name || "Anônimo"}\nModalidade: ${modality || "N/A"}\nStudy UID: ${study_uid}`,
          priority: priority || "normal",
          status: "pending",
          source: "orthanc",
          orthanc_study_uid: study_uid,
          specialty_required: specialty_required || null,
        })
        .select("id")
        .single();

      if (examErr) throw new Error("Erro ao criar exame: " + examErr.message);

      // Upload files if provided
      const uploadedPaths: string[] = [];
      if (files && Array.isArray(files)) {
        for (const file of files) {
          if (!file.file_name || !file.file_base64) continue;
          const binaryStr = atob(file.file_base64);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

          const filePath = `exams/${examReq.id}/${file.file_name}`;
          await supabase.storage.from("exam-files").upload(filePath, bytes, {
            contentType: file.content_type || "application/dicom",
            upsert: true,
          });
          uploadedPaths.push(filePath);
        }

        if (uploadedPaths.length > 0) {
          await supabase.from("exam_requests").update({ file_urls: uploadedPaths }).eq("id", examReq.id);
        }
      }

      // Notify admins
      const { data: admins } = await supabase.from("user_roles").select("user_id").eq("role", "admin").limit(3);
      if (admins) {
        for (const admin of admins) {
          await supabase.from("notifications").insert({
            user_id: admin.user_id,
            title: priority === "urgent" ? "🚨 Exame URGENTE via DICOM" : "🔬 Novo exame via DICOM Router",
            message: `${examType} recebido do gateway. ${uploadedPaths.length} arquivo(s).`,
            type: priority === "urgent" ? "urgent" : "exam",
            link: "/dashboard?tab=exams",
          });
        }
      }

      return new Response(JSON.stringify({
        success: true,
        exam_request_id: examReq.id,
        files_uploaded: uploadedPaths.length,
        message: "Estudo DICOM registrado com sucesso",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── search_studies ──
    if (action === "search_studies") {
      const { search_query } = body;
      const { data: exams, error } = await supabase
        .from("exam_requests")
        .select("id, exam_type, status, priority, clinical_info, created_at, file_urls, requesting_doctor_id, assigned_to, sla_deadline, sla_hours, specialty_required, source, orthanc_study_uid, started_at, completed_at")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      let filtered = exams || [];
      if (search_query) {
        const q = search_query.toLowerCase();
        filtered = filtered.filter((e: { exam_type?: string; clinical_info?: string; id?: string }) => e.exam_type?.toLowerCase().includes(q) || e.clinical_info?.toLowerCase().includes(q) || e.id?.toLowerCase().includes(q));
      }

      return new Response(JSON.stringify({ studies: filtered, configured: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── get_files ──
    if (action === "get_files") {
      const { exam_request_id } = body;
      if (!exam_request_id) return new Response(JSON.stringify({ error: "exam_request_id obrigatório" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const folder = `exams/${exam_request_id}`;
      const { data: files, error } = await supabase.storage.from("exam-files").list(folder, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const withUrls = await Promise.all(
        (files || []).map(async (f: any) => {
          const filePath = `${folder}/${f.name}`;
          const { data: signedData } = await supabase.storage.from("exam-files").createSignedUrl(filePath, 3600);
          return { name: f.name, size: f.metadata?.size || 0, type: f.metadata?.mimetype || "application/octet-stream", created_at: f.created_at, path: filePath, url: signedData?.signedUrl || null };
        })
      );

      return new Response(JSON.stringify({ files: withUrls }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── upload_file ──
    if (action === "upload_file") {
      const { exam_request_id, file_name, file_base64, content_type } = body;
      if (!exam_request_id || !file_name || !file_base64) return new Response(JSON.stringify({ error: "exam_request_id, file_name e file_base64 obrigatórios" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const binaryStr = atob(file_base64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

      const filePath = `exams/${exam_request_id}/${file_name}`;
      const { error: uploadError } = await supabase.storage.from("exam-files").upload(filePath, bytes, { contentType: content_type || "application/dicom", upsert: true });
      if (uploadError) return new Response(JSON.stringify({ error: uploadError.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const { data: existing } = await supabase.from("exam_requests").select("file_urls").eq("id", exam_request_id).single();
      const currentFiles = (existing?.file_urls as string[]) || [];
      if (!currentFiles.includes(filePath)) {
        await supabase.from("exam_requests").update({ file_urls: [...currentFiles, filePath] }).eq("id", exam_request_id);
      }

      return new Response(JSON.stringify({ success: true, path: filePath }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── delete_file ──
    if (action === "delete_file") {
      const { file_path } = body;
      if (!file_path) return new Response(JSON.stringify({ error: "file_path obrigatório" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { error } = await supabase.storage.from("exam-files").remove([file_path]);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── get_signed_url ──
    if (action === "get_signed_url") {
      const { file_path, expires_in } = body;
      if (!file_path) return new Response(JSON.stringify({ error: "file_path obrigatório" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data, error } = await supabase.storage.from("exam-files").createSignedUrl(file_path, expires_in || 3600);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ url: data.signedUrl }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      error: "Ação inválida. Use: orthanc_webhook, search_studies, get_files, upload_file, delete_file, get_signed_url",
    }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error("PACS integration error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
