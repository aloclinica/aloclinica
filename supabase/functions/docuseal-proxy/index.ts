import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// SECURITY: authenticate + authorize callers of this privileged DocuSeal proxy.
import { getCaller } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// SECURITY: base URL comes from env (must be HTTPS in prod); no hardcoded plaintext IP.
const DOCUSEAL_BASE = Deno.env.get("DOCUSEAL_BASE") ?? "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("DOCUSEAL_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "DOCUSEAL_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // SECURITY: refuse to run (and thus forward the privileged key) if the
  // upstream integration is not configured — never fall back to a hardcoded host.
  if (!DOCUSEAL_BASE) {
    return new Response(JSON.stringify({ error: "DocuSeal integration not configured" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // SECURITY: require an authenticated caller (401 if none).
    const caller = await getCaller(req);
    if (!caller.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SECURITY: restrict to doctor / laudista / admin roles. Query user_roles
    // and doctor_profiles with the service-role client (bypasses RLS by design).
    let allowed = caller.isAdmin;
    if (!allowed) {
      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const { data: roles } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", caller.user.id);
      allowed = (roles ?? []).some((r: any) => ["doctor", "laudista", "admin"].includes(r.role));
      if (!allowed) {
        const { data: docProfile } = await admin
          .from("doctor_profiles")
          .select("id")
          .eq("user_id", caller.user.id)
          .maybeSingle();
        allowed = !!docProfile;
      }
    }
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "create_template") {
      const { pdf_base64, nome_doc } = body;
      if (!pdf_base64 || !nome_doc) {
        return new Response(JSON.stringify({ error: "pdf_base64 and nome_doc required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const res = await fetch(`${DOCUSEAL_BASE}/api/templates/pdf`, {
        method: "POST",
        headers: {
          "X-Auth-Token": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: nome_doc,
          documents: [
            {
              name: `${nome_doc}.pdf`,
              file: pdf_base64,
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return new Response(JSON.stringify({ error: "DocuSeal template error", details: data }), {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ template_id: data.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create_submission") {
      const { template_id, email, nome } = body;
      if (!template_id || !email || !nome) {
        return new Response(JSON.stringify({ error: "template_id, email, nome required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const res = await fetch(`${DOCUSEAL_BASE}/api/submissions`, {
        method: "POST",
        headers: {
          "X-Auth-Token": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template_id: Number(template_id),
          send_email: false,
          submitters: [
            {
              role: "Médico",
              email,
              name: nome,
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return new Response(JSON.stringify({ error: "DocuSeal submission error", details: data }), {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // data is an array of submitters
      const submitter = Array.isArray(data) ? data[0] : data;
      return new Response(
        JSON.stringify({
          submission_id: submitter.submission_id || submitter.id,
          signing_url: submitter.embed_src || submitter.signing_url,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "check_submission") {
      const { submission_id } = body;
      // SECURITY: submission_id must be a bare integer — prevents SSRF/path
      // traversal via string concatenation into the upstream URL.
      if (!/^\d+$/.test(String(submission_id))) {
        return new Response(JSON.stringify({ error: "Invalid submission_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const submissionId = String(Number(submission_id));

      const res = await fetch(`${DOCUSEAL_BASE}/api/submissions/${submissionId}`, {
        headers: { "X-Auth-Token": apiKey },
      });

      const data = await res.json();
      if (!res.ok) {
        return new Response(JSON.stringify({ error: "DocuSeal check error", details: data }), {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const completed = data.status === "completed" ||
        (data.submitters && data.submitters.every((s: any) => s.completed_at));

      const documents = data.documents || data.submitters?.flatMap((s: any) => s.documents || []) || [];

      return new Response(
        JSON.stringify({
          status: data.status,
          completed,
          documents,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use: create_template, create_submission, check_submission" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
