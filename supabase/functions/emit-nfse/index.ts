// emit-nfse — emite a Nota Fiscal de Serviço (NFS-e) da teleconsulta e a ENVIA
// automaticamente por E-MAIL e WHATSAPP para o paciente.
//
// Provedor: Nuvem Fiscal (nuvemfiscal.com.br) — o mais barato p/ automatizar
// (faixa gratuita + centavos por nota). OAuth2 client_credentials.
//
// GATE (fail-open): enquanto os secrets NUVEMFISCAL_* / NFSE_* não estiverem
// definidos, a emissão é PULADA sem erro — nada quebra no fluxo de pagamento.
// Quando você abrir a conta na Nuvem Fiscal (com o CNPJ + certificado + os
// parâmetros que o seu contador definir) e preencher os secrets, a emissão
// LIGA sozinha e a nota passa a sair + ser enviada a cada pagamento aprovado.
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
  authUrl: Deno.env.get("NUVEMFISCAL_AUTH_URL") ?? "https://auth.nuvemfiscal.com.br/oauth/token",
  apiBase: Deno.env.get("NUVEMFISCAL_API_BASE") ?? "https://api.nuvemfiscal.com.br",
  clientId: Deno.env.get("NUVEMFISCAL_CLIENT_ID") ?? "",
  clientSecret: Deno.env.get("NUVEMFISCAL_CLIENT_SECRET") ?? "",
  cnpj: (Deno.env.get("NFSE_CNPJ") ?? "").replace(/\D/g, ""),
  ambiente: (Deno.env.get("NFSE_AMBIENTE") ?? "homologacao").toLowerCase(), // homologacao | producao
  cityIbge: Deno.env.get("NFSE_CITY_IBGE") ?? "",       // código IBGE do município (7 díg.)
  serviceCode: Deno.env.get("NFSE_SERVICE_CODE") ?? "", // código do serviço (lista municipal/nacional)
  issRate: Number(Deno.env.get("NFSE_ISS_RATE") ?? "0"),// alíquota ISS (%) — ex.: 2
  serviceDesc: Deno.env.get("NFSE_SERVICE_DESC") ?? "Teleconsulta médica (telemedicina) — prestação de serviço de saúde à distância.",
};
const isConfigured = () => Boolean(CFG.clientId && CFG.clientSecret && CFG.cnpj && CFG.cityIbge && CFG.serviceCode);

async function getToken(): Promise<string> {
  const res = await fetch(CFG.authUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CFG.clientId,
      client_secret: CFG.clientSecret,
      scope: "nfse",
    }),
  });
  if (!res.ok) throw new Error(`nuvemfiscal token ${res.status}: ${await res.text()}`);
  return (await res.json()).access_token as string;
}

// Emite a DPS (Declaração de Prestação de Serviços) → NFS-e no padrão nacional.
// `referencia` = appointment_id garante idempotência (o provedor não duplica).
async function emitNfse(token: string, p: {
  ref: string; valor: number; tomadorCpf: string; tomadorNome: string;
  tomadorEmail: string; discriminacao: string;
}) {
  const body = {
    ambiente: CFG.ambiente === "producao" ? "producao" : "homologacao",
    referencia: p.ref,
    infDPS: {
      tpAmb: CFG.ambiente === "producao" ? 1 : 2,
      prest: { CNPJ: CFG.cnpj },
      toma: {
        CPF: p.tomadorCpf || undefined,
        xNome: p.tomadorNome,
        email: p.tomadorEmail || undefined,
      },
      serv: {
        locPrest: { cLocPrestacao: CFG.cityIbge },
        cServ: { cTribNac: CFG.serviceCode, xDescServ: p.discriminacao },
      },
      valores: {
        vServPrest: { vServ: Number(p.valor.toFixed(2)) },
        trib: { tribMun: { tribISSQN: 1, pAliq: CFG.issRate } },
      },
    },
  };
  const res = await fetch(`${CFG.apiBase}/nfse/dps`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`nuvemfiscal emit ${res.status}: ${JSON.stringify(data).slice(0, 400)}`);
  return data as { id?: string; status?: string; url_pdf?: string; url?: string };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  // SECURITY: só chamadas internas/serviço (o webhook chama). Nunca anônimo.
  if (!isInternalOrService(req)) return json({ error: "forbidden" }, 403);

  try {
    const { appointment_id } = await req.json();
    if (!appointment_id) return json({ error: "appointment_id required" }, 400);

    if (!isConfigured()) {
      // Ainda sem conta do provedor → pula silenciosamente (não quebra o pagamento).
      return json({ skipped: true, reason: "NFS-e não configurada (defina NUVEMFISCAL_* e NFSE_*)" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: appt } = await supabase
      .from("appointments")
      .select("id, patient_id, doctor_id, price_at_booking, payment_status, payment_confirmed_at")
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

    // 1) Emitir a NFS-e
    const token = await getToken();
    const nfse = await emitNfse(token, {
      ref: String(appt.id),
      valor,
      tomadorCpf: (patient?.cpf ?? "").replace(/\D/g, ""),
      tomadorNome: patientName,
      tomadorEmail: patientEmail,
      discriminacao: CFG.serviceDesc,
    });
    const pdfUrl = nfse.url_pdf || nfse.url || `${CFG.apiBase}/nfse/${nfse.id}/pdf`;

    const results: string[] = [`nfse: emitida (${nfse.status ?? "ok"})`];

    // 2) Enviar por E-MAIL
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

    // 3) Enviar por WHATSAPP
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

    return json({ success: true, nfse_id: nfse.id ?? null, pdf_url: pdfUrl, results });
  } catch (e) {
    // Falha na emissão NUNCA deve derrubar o fluxo do pagamento — loga e retorna 200.
    console.error("[emit-nfse]", e);
    return json({ success: false, error: (e as Error).message });
  }
});
