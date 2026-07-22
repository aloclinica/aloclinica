// emit-nfse — emite a Nota Fiscal de Serviço (NFS-e) da teleconsulta e a ENVIA
// automaticamente por E-MAIL e WHATSAPP para o paciente.
//
// Provedor: Focus NFe (focusnfe.com.br) — API REST simples (token + JSON),
// suporta a NFS-e Nacional e 3.000+ prefeituras.
//
// GATE (fail-open): enquanto os secrets FOCUS_NFE_TOKEN / NFSE_* não estiverem
// definidos, a emissão é PULADA sem erro — nada quebra no fluxo de pagamento.
// Quando você cadastrar a empresa na Focus (CNPJ + inscrição municipal +
// certificado A1) e preencher os secrets, a emissão LIGA sozinha.
//
// Chamado internamente pelo mercadopago-webhook (pagamento aprovado).
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isInternalOrService } from "../_shared/auth.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

// ── Configuração (secrets). O contador confirma os campos fiscais. ──
const CFG = {
  token: Deno.env.get("FOCUS_NFE_TOKEN") ?? "",
  ambiente: (Deno.env.get("FOCUS_NFE_AMBIENTE") ?? "homologacao").toLowerCase(), // homologacao | producao
  cnpj: (Deno.env.get("NFSE_CNPJ") ?? "").replace(/\D/g, ""),
  inscricaoMunicipal: Deno.env.get("NFSE_INSCRICAO_MUNICIPAL") ?? "",
  cityIbge: Deno.env.get("NFSE_CITY_IBGE") ?? "",                 // código IBGE do município (7 díg.)
  itemListaServico: Deno.env.get("NFSE_ITEM_LISTA_SERVICO") ?? "",// item da lista LC 116 (ex.: 0405 = 4.05 saúde)
  codigoTributarioMunicipio: Deno.env.get("NFSE_CODIGO_TRIBUTARIO_MUNICIPIO") ?? "", // opcional (varia por município)
  issRate: Number(Deno.env.get("NFSE_ISS_RATE") ?? "0"),         // alíquota ISS (%)
  serviceDesc: Deno.env.get("NFSE_SERVICE_DESC") ?? "Teleconsulta médica (telemedicina) — prestação de serviço de saúde à distância.",
};
const baseUrl = () => (CFG.ambiente === "producao" ? "https://api.focusnfe.com.br" : "https://homologacao.focusnfe.com.br");
const isConfigured = () => Boolean(CFG.token && CFG.cnpj && CFG.cityIbge && CFG.itemListaServico);
const auth = () => "Basic " + btoa(`${CFG.token}:`); // Focus: token como usuário, senha vazia

// Emite (POST) e busca (GET) até autorizar. Idempotente por `ref` (appointment_id).
async function emitFocus(ref: string, body: unknown) {
  const post = await fetch(`${baseUrl()}/v2/nfse?ref=${encodeURIComponent(ref)}`, {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const posted = await post.json().catch(() => ({}));
  // 422 com codigo "nfse_ja_existe" = já emitida antes (idempotência) → seguimos p/ o GET.
  if (post.status >= 400 && posted?.codigo !== "nfse_ja_existe") {
    throw new Error(`focus emit ${post.status}: ${JSON.stringify(posted).slice(0, 400)}`);
  }
  // A autorização é assíncrona — buscamos o status até "autorizado".
  let last: Record<string, unknown> = posted;
  for (let i = 0; i < 6; i++) {
    const g = await fetch(`${baseUrl()}/v2/nfse/${encodeURIComponent(ref)}`, { headers: { Authorization: auth() } });
    last = await g.json().catch(() => ({}));
    const st = String(last?.status ?? "");
    if (st === "autorizado") return last;
    if (st === "erro_autorizacao" || st === "cancelado") {
      throw new Error(`focus status ${st}: ${JSON.stringify(last?.erros ?? last).slice(0, 400)}`);
    }
    await new Promise((r) => setTimeout(r, 2500));
  }
  return last; // ainda processando — devolvemos o que temos
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  // SECURITY: só chamadas internas/serviço (o webhook chama). Nunca anônimo.
  if (!isInternalOrService(req)) return json({ error: "forbidden" }, 403);

  try {
    const { appointment_id } = await req.json();
    if (!appointment_id) return json({ error: "appointment_id required" }, 400);

    if (!isConfigured()) {
      return json({ skipped: true, reason: "NFS-e não configurada (defina FOCUS_NFE_TOKEN e NFSE_*)" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: appt } = await supabase
      .from("appointments")
      .select("id, patient_id, price_at_booking, payment_status")
      .eq("id", appointment_id).single();
    if (!appt) return json({ error: "appointment not found" }, 404);

    const valor = Number(appt.price_at_booking ?? 0);
    const isPaid = ["approved", "confirmed", "received", "paid"].includes(String(appt.payment_status));
    if (!isPaid || valor <= 0) return json({ skipped: true, reason: "sem pagamento aprovado / valor zero" });

    const { data: patient } = appt.patient_id
      ? await supabase.from("profiles").select("first_name, last_name, phone, cpf").eq("user_id", appt.patient_id).single()
      : { data: null } as any;

    let patientEmail = "";
    if (appt.patient_id) {
      const { data: au } = await supabase.auth.admin.getUserById(appt.patient_id);
      patientEmail = au?.user?.email ?? "";
    }

    const patientName = patient ? `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim() : "Paciente";
    const amountBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

    // 1) Emitir a NFS-e via Focus NFe
    const dpsBody: Record<string, unknown> = {
      data_emissao: new Date().toISOString().slice(0, 19),
      prestador: {
        cnpj: CFG.cnpj,
        inscricao_municipal: CFG.inscricaoMunicipal || undefined,
        codigo_municipio: CFG.cityIbge,
      },
      tomador: {
        cpf: (patient?.cpf ?? "").replace(/\D/g, "") || undefined,
        razao_social: patientName,
        email: patientEmail || undefined,
      },
      servico: {
        aliquota: CFG.issRate,
        discriminacao: CFG.serviceDesc,
        iss_retido: false,
        item_lista_servico: CFG.itemListaServico,
        codigo_tributario_municipio: CFG.codigoTributarioMunicipio || undefined,
        valor_servicos: Number(valor.toFixed(2)),
      },
    };
    const nfse = await emitFocus(String(appt.id), dpsBody);
    const st = String(nfse?.status ?? "");
    const pdfPath = (nfse?.caminho_danfse as string) || (nfse?.caminho_xml_nota_fiscal as string) || "";
    const pdfUrl = pdfPath ? `${baseUrl()}${pdfPath}` : ((nfse?.url as string) || "");

    const results: string[] = [`nfse: ${st || "processando"}${pdfUrl ? " (pdf ok)" : ""}`];

    // Só envia se temos um link (autorizada). Se ainda processando, o webhook do
    // Focus/reprocesso cobre depois — não enviamos link quebrado.
    if (pdfUrl) {
      // 2) E-MAIL
      if (patientEmail) {
        try {
          const r = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
              "x-internal-secret": Deno.env.get("INTERNAL_FUNCTION_SECRET") ?? "",
            },
            body: JSON.stringify({
              type: "nfse_invoice",
              to: patientEmail,
              data: { patient_name: patientName, amount: amountBRL, nfse_url: pdfUrl, appointment_id: String(appt.id) },
            }),
          });
          results.push(`email: ${r.ok ? "sent" : "failed"}`);
        } catch (e) { results.push(`email: error ${(e as Error).message}`); }
      }
      // 3) WHATSAPP
      if (patient?.phone) {
        try {
          const msg = `🧾 *Nota Fiscal — AloClínica*\n\nOlá ${patientName}, a nota fiscal da sua teleconsulta foi emitida.\n\nValor: *${amountBRL}*\n\n📄 Baixar a NFS-e:\n${pdfUrl}\n\n_Documento fiscal oficial. Guarde para reembolso junto ao seu plano de saúde._`;
          const r = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
              "x-internal-secret": Deno.env.get("INTERNAL_FUNCTION_SECRET") ?? "",
            },
            body: JSON.stringify({ phone: patient.phone, message: msg }),
          });
          results.push(`whatsapp: ${r.ok ? "sent" : "failed"}`);
        } catch (e) { results.push(`whatsapp: error ${(e as Error).message}`); }
      }
    }

    return json({ success: true, status: st, pdf_url: pdfUrl || null, results });
  } catch (e) {
    // Falha na emissão NUNCA deve derrubar o fluxo do pagamento — loga e retorna 200.
    console.error("[emit-nfse]", e);
    return json({ success: false, error: (e as Error).message });
  }
});
