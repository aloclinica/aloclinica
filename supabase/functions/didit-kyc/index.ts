import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callClaudeVision } from "../_shared/anthropic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const COMPREFACE_URL = "http://72.62.138.208:8000";
const COMPREFACE_VERIFY_KEY = "5f3c100e-0144-465d-87b3-86c34ba70a1e";
const COMPREFACE_DETECT_KEY = "a2d930ec-e3ee-46b4-b770-023524e41178";

// Strict anti-fraud thresholds
const MIN_SIMILARITY = 0.90;      // 90% face match required
const MIN_FACE_DETECT_PROB = 0.95;
const MAX_FACE_SIZE_VARIANCE = 0.5;

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.startsWith("data:") ? dataUrl.split(",") : ["data:image/jpeg;base64", dataUrl];
  const mime = meta.match(/data:([^;]+)/)?.[1] || "image/jpeg";
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: mime });
}

async function detectFaces(imageDataUrl: string) {
  const fd = new FormData();
  fd.append("file", dataUrlToBlob(imageDataUrl), "img.jpg");
  const res = await fetch(`${COMPREFACE_URL}/api/v1/detection/detect?face_plugins=age,gender,pose`, {
    method: "POST",
    headers: { "x-api-key": COMPREFACE_DETECT_KEY },
    body: fd,
  });
  if (!res.ok) throw new Error(`Compreface detect failed: ${res.status}`);
  return await res.json();
}

async function verifyFaces(sourceDataUrl: string, targetDataUrl: string) {
  const fd = new FormData();
  fd.append("source_image", dataUrlToBlob(sourceDataUrl), "source.jpg");
  fd.append("target_image", dataUrlToBlob(targetDataUrl), "target.jpg");
  const res = await fetch(`${COMPREFACE_URL}/api/v1/verification/verify`, {
    method: "POST",
    headers: { "x-api-key": COMPREFACE_VERIFY_KEY },
    body: fd,
  });
  if (!res.ok) throw new Error(`Compreface verify failed: ${res.status}`);
  return await res.json();
}

async function extractDocumentData(documentImageDataUrl: string): Promise<{ nome: string | null; cpf: string | null }> {
  if (!Deno.env.get("ANTHROPIC_API_KEY")) return { nome: null, cpf: null };
  try {
    const raw = (await callClaudeVision({
      prompt: 'Extraia o Nome completo e o CPF deste documento de identidade brasileiro. Responda APENAS JSON: {"nome":"...","cpf":"..."}. Se faltar algo, use null.',
      imageDataUrl: documentImageDataUrl,
      max_tokens: 250,
      temperature: 0,
    })).replace(/```json\s*|```/g, "").trim();
    const match = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : raw);
    return { nome: parsed?.nome ?? null, cpf: parsed?.cpf ?? null };
  } catch (e: any) {
    console.warn("[didit-kyc] OCR (Claude vision) failed:", e);
    return { nome: null, cpf: null };
  }
}

// Normaliza string para comparação: remove acentos, pontuação, espaços extras, lowercase
function normalizeName(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function onlyDigits(s: string | null | undefined): string {
  return (s ?? "").replace(/\D/g, "");
}

/**
 * Verifica se o nome extraído do documento bate com o nome de cadastro.
 * Critério: todos os "tokens" significativos (>=3 chars) do nome de cadastro
 * devem aparecer no nome do documento (e vice-versa para o primeiro nome).
 */
function nameMatches(profileFullName: string, docName: string): boolean {
  const a = normalizeName(profileFullName);
  const b = normalizeName(docName);
  if (!a || !b) return false;
  const aTokens = a.split(" ").filter((t) => t.length >= 3);
  const bTokens = b.split(" ").filter((t) => t.length >= 3);
  if (aTokens.length === 0 || bTokens.length === 0) return false;
  const bSet = new Set(bTokens);
  // pelo menos 2 tokens em comum (primeiro nome + 1 sobrenome) ou todos se tiver < 2
  const common = aTokens.filter((t) => bSet.has(t));
  const required = Math.min(2, aTokens.length);
  return common.length >= required;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const { document_image, selfie_image } = await req.json();
    if (!document_image || !selfie_image) {
      return new Response(JSON.stringify({ error: "document_image e selfie_image são obrigatórios (data URL base64)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // LAYER 1: Anti-spoof — detect faces in both, require real face + high probability
    let docDetect, selfieDetect;
    try {
      [docDetect, selfieDetect] = await Promise.all([
        detectFaces(document_image),
        detectFaces(selfie_image),
      ]);
    } catch (e: any) {
      console.error("[didit-kyc] detect failure:", e);
      return new Response(JSON.stringify({
        error: "Falha ao detectar faces. Tente novamente com fotos nítidas e bem iluminadas.",
        stage: "detect",
      }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const docFaces = docDetect?.result || [];
    const selfieFaces = selfieDetect?.result || [];

    const reasons: string[] = [];
    if (docFaces.length !== 1) reasons.push(`Documento precisa ter exatamente 1 rosto visível (encontrados: ${docFaces.length})`);
    if (selfieFaces.length !== 1) reasons.push(`Selfie precisa ter exatamente 1 rosto (encontrados: ${selfieFaces.length})`);
    const docProb = docFaces[0]?.box?.probability || 0;
    const selfieProb = selfieFaces[0]?.box?.probability || 0;
    if (docProb < MIN_FACE_DETECT_PROB) reasons.push("Rosto no documento com baixa confiança — use foto nítida do RG/CNH");
    if (selfieProb < MIN_FACE_DETECT_PROB) reasons.push("Selfie com baixa confiança — melhore a iluminação");

    // Anti-spoof: selfie pose must be frontal (yaw/pitch/roll within limits)
    const selfPose = selfieFaces[0]?.pose;
    if (selfPose) {
      if (Math.abs(selfPose.yaw || 0) > 25 || Math.abs(selfPose.pitch || 0) > 25) {
        reasons.push("Olhe diretamente para a câmera — sem inclinar ou virar o rosto");
      }
    }

    if (reasons.length > 0) {
      return new Response(JSON.stringify({
        match: false, score: 0, status: "rejected",
        error: reasons.join(". "), stage: "anti_spoof",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // LAYER 2: Biometric verification — Compreface face match
    let verifyResult;
    try {
      verifyResult = await verifyFaces(document_image, selfie_image);
    } catch (e: any) {
      console.error("[didit-kyc] verify failure:", e);
      return new Response(JSON.stringify({
        error: "Falha na verificação biométrica. Tente novamente.",
        stage: "verify",
      }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const similarity = verifyResult?.result?.[0]?.face_matches?.[0]?.similarity ?? 0;
    const score = Math.round(similarity * 100);
    const match = similarity >= MIN_SIMILARITY;

    // LAYER 3: OCR (best-effort, doesn't block approval)
    const { nome, cpf } = await extractDocumentData(document_image);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Audit log
    await supabaseAdmin.from("activity_logs").insert({
      action: match ? "kyc_approved" : "kyc_rejected",
      entity_type: "kyc", entity_id: userId, user_id: userId,
      details: {
        provider: "compreface+claude_ocr",
        similarity, score, match, nome, cpf,
        doc_face_prob: docProb, selfie_face_prob: selfieProb,
        thresholds: { min_similarity: MIN_SIMILARITY, min_face_prob: MIN_FACE_DETECT_PROB },
      },
    });

    const { data: doctorProfile } = await supabaseAdmin
      .from("doctor_profiles").select("id").eq("user_id", userId).maybeSingle();

    if (match) {
      if (doctorProfile) {
        await supabaseAdmin.from("doctor_profiles").update({
          kyc_status: "approved",
          kyc_verified_at: new Date().toISOString(),
          kyc_face_match_score: score,
        }).eq("user_id", userId);
      }
      await supabaseAdmin.from("kyc_verificacoes").insert({
        user_id: userId, status: "approved", similarity,
        tipo: doctorProfile ? "medico" : "paciente",
      });
      await supabaseAdmin.from("notifications").insert({
        user_id: userId,
        title: "✅ Identidade verificada!",
        message: `Verificação biométrica aprovada (similaridade ${score}%).`,
        type: "info", link: "/dashboard",
      });
    } else {
      if (doctorProfile) {
        await supabaseAdmin.from("doctor_profiles").update({ kyc_status: "rejected" }).eq("user_id", userId);
      }
      await supabaseAdmin.from("kyc_verificacoes").insert({
        user_id: userId, status: "rejected", similarity,
        tipo: doctorProfile ? "medico" : "paciente",
      });
      await supabaseAdmin.from("notifications").insert({
        user_id: userId,
        title: "❌ Verificação não aprovada",
        message: `A selfie não corresponde ao documento (similaridade ${score}%). Tente de novo com fotos nítidas.`,
        type: "warning", link: "/dashboard/profile?kyc=open",
      });
    }

    return new Response(JSON.stringify({
      match, score, similarity, nome, cpf,
      status: match ? "approved" : "rejected",
      error: match ? null : `Rostos não correspondem (similaridade ${score}%, mínimo ${MIN_SIMILARITY * 100}%)`,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("[didit-kyc] Error:", err);
    return new Response(JSON.stringify({ error: err?.message || "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
