import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ORTHANC_URL = "http://72.62.138.208:8042";
const ORTHANC_AUTH = btoa("admin:aloClinica2026");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    // Get the DICOM file from the request
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), { status: 400, headers: corsHeaders });
    }

    // Forward to Orthanc
    const fileBuffer = await file.arrayBuffer();
    const orthancResponse = await fetch(`${ORTHANC_URL}/instances`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${ORTHANC_AUTH}`,
        "Content-Type": "application/dicom",
      },
      body: fileBuffer,
    });

    if (!orthancResponse.ok) {
      const errorText = await orthancResponse.text();
      console.error("Orthanc upload failed:", errorText);
      return new Response(JSON.stringify({ error: "Orthanc upload failed", details: errorText }), {
        status: 502,
        headers: corsHeaders,
      });
    }

    const result = await orthancResponse.json();

    // Extract StudyInstanceUID from the Orthanc response
    let studyInstanceUID = result.ParentStudy || null;

    // If we got a parent study ID, fetch the actual StudyInstanceUID
    if (studyInstanceUID) {
      try {
        const studyRes = await fetch(`${ORTHANC_URL}/studies/${studyInstanceUID}`, {
          headers: { Authorization: `Basic ${ORTHANC_AUTH}` },
        });
        if (studyRes.ok) {
          const studyData = await studyRes.json();
          studyInstanceUID = studyData?.MainDicomTags?.StudyInstanceUID || studyInstanceUID;
        }
      } catch (e: any) {
        console.warn("Could not fetch StudyInstanceUID:", e);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        orthancId: result.ID,
        studyInstanceUID,
        parentStudy: result.ParentStudy,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("orthanc-proxy error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
