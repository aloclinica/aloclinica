/**
 * Admin → Novo contrato (wizard).
 *
 * Cria o contrato + gera convite de gestor em 1 fluxo. Pré-preenche
 * dados de um lead (query ?lead=...) quando vindo do AdminLeads.
 */
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getAdminNav } from "./adminNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Sparkles, ArrowRight, Copy, Check, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { logError } from "@/lib/logger";

const TIPOS = [
  { v: "prefeitura", label: "Prefeitura / Município" },
  { v: "secretaria", label: "Secretaria de Saúde" },
  { v: "empresa", label: "Empresa privada" },
  { v: "ong", label: "ONG" },
  { v: "sindicato", label: "Sindicato" },
];
const SUBDOMINIOS = ["orgaos", "parceiros", "acoes", "empresas"];
const COBRANCAS = [
  { v: "gratuito_patrocinado", label: "Gratuito patrocinado (cliente paga 100%)" },
  { v: "copart_50_50", label: "Copart 50/50 (paciente paga metade)" },
  { v: "voucher_avulso", label: "Voucher avulso (cliente compra créditos)" },
];

const AdminContractNew = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const leadId = params.get("lead");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saving, setSaving] = useState(false);

  const [contrato, setContrato] = useState({
    nome: "",
    tipo: "",
    status: "ativo",
    cota_total: "",
    valor_consulta: "",
    vigencia_inicio: new Date().toISOString().slice(0, 10),
    vigencia_fim: "",
    modelo_cobranca: "gratuito_patrocinado",
    subdominio: "orgaos",
  });
  const [gestor, setGestor] = useState({ email: "", nome: "" });
  const [contratoId, setContratoId] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Pré-preenche do lead ou URL, se houver
  useEffect(() => {
    const org = params.get("org");
    const name = params.get("name");
    const email = params.get("email");

    if (org || name || email) {
      if (org) setContrato(c => ({ ...c, nome: org }));
      if (name || email) setGestor({ nome: name || "", email: email || "" });
      return;
    }

    if (!leadId) return;
    (async () => {
      const { data } = await db.from("contract_leads").select("*").eq("id", leadId).maybeSingle();
      if (data) {
        const l: any = data;
        setContrato((c) => ({
          ...c,
          nome: l.org_name,
          tipo: l.org_type === "outro" ? "empresa" : l.org_type,
          subdominio: l.org_type === "empresa" ? "empresas" : l.org_type === "ong" ? "acoes" : "orgaos",
        }));
        setGestor({ email: l.contact_email, nome: l.contact_name });
      }
    })();
  }, [leadId, params]);

  const submit = async () => {
    if (!contrato.nome || !contrato.tipo || !gestor.email) {
      toast.info("Preencha contrato, tipo e e-mail do gestor."); return;
    }
    setSaving(true);
    try {
      // 1) Cria contrato
      const { data: c, error: cErr } = await db.from("contratos").insert({
        nome: contrato.nome.trim(),
        tipo: contrato.tipo,
        status: "ativo",
        cota_total: contrato.cota_total ? Number(contrato.cota_total) : null,
        cota_utilizada: 0,
        valor_consulta: contrato.valor_consulta ? Number(contrato.valor_consulta) : null,
        vigencia_inicio: contrato.vigencia_inicio,
        vigencia_fim: contrato.vigencia_fim || null,
        modelo_cobranca: contrato.modelo_cobranca,
        subdominio: contrato.subdominio,
      } as any).select("id").single();
      if (cErr) throw cErr;
      const newId = (c as any).id;
      setContratoId(newId);

      // 2) Gera convite (token aleatório)
      const token = (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, "").slice(0, 40);
      const { error: invErr } = await db.from("contract_manager_invites").insert({
        token,
        contrato_id: newId,
        email: gestor.email.trim().toLowerCase(),
      } as any);
      if (invErr) throw invErr;
      setInviteToken(token);

      // 3) Se veio de um lead, marca como ganho
      if (leadId) {
        await db.from("contract_leads").update({ status: "won", updated_at: new Date().toISOString() } as any).eq("id", leadId);
      }

      setStep(3);
      toast.success("Contrato criado");
    } catch (e: any) {
      logError("AdminContractNew submit", e);
      toast.error("Erro ao criar contrato", { description: e?.message });
    } finally { setSaving(false); }
  };

  const inviteUrl = inviteToken ? `https://aloclinica.com.br/parceiros/aceitar/${inviteToken}` : "";
  const copyInvite = async () => {
    try { await navigator.clipboard.writeText(inviteUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); toast.success("Link copiado"); } catch { /* */ }
  };

  return (
    <DashboardLayout title="Novo contrato" nav={getAdminNav("contracts-new")} role="admin">
      <div className="max-w-2xl mx-auto space-y-4">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/admin/leads")} className="gap-1 mb-2">
            <ChevronLeft className="w-4 h-4" /> Voltar aos leads
          </Button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" /> Novo contrato {leadId && <span className="text-xs text-muted-foreground">(de lead)</span>}
          </h1>
        </div>

        {step === 3 && inviteToken ? (
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-success/15 flex items-center justify-center mx-auto">
                <Sparkles className="w-7 h-7 text-success" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Contrato criado!</h2>
              <p className="text-sm text-muted-foreground">
                Envie o link abaixo ao gestor (<strong>{gestor.email}</strong>). Ele cria a conta, aceita o
                convite e cai direto no painel do contrato.
              </p>
              <div className="rounded-xl border border-border bg-muted/40 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Link de convite (válido por 14 dias)</p>
                <div className="flex gap-2">
                  <Input value={inviteUrl} readOnly className="text-xs font-mono" />
                  <Button onClick={copyInvite} variant="default" size="icon" aria-label="Copiar link">
                    {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 justify-center pt-2">
                <Button variant="outline" onClick={() => navigate("/dashboard/admin/leads")} className="rounded-xl">
                  Voltar aos leads
                </Button>
                <Button onClick={() => { setStep(1); setContratoId(null); setInviteToken(null); setContrato({ ...contrato, nome: "", cota_total: "", valor_consulta: "", vigencia_fim: "" }); setGestor({ email: "", nome: "" }); }} className="rounded-xl">
                  Criar outro
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-5 space-y-5">
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">1. Dados do contrato</p>
                <div className="space-y-3">
                  <div>
                    <Label>Nome *</Label>
                    <Input value={contrato.nome} onChange={(e) => setContrato({ ...contrato, nome: e.target.value })} placeholder="Ex.: Prefeitura de São Paulo" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Tipo *</Label>
                      <Select value={contrato.tipo} onValueChange={(v) => setContrato({ ...contrato, tipo: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{TIPOS.map((t) => <SelectItem key={t.v} value={t.v}>{t.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Subdomínio</Label>
                      <Select value={contrato.subdominio} onValueChange={(v) => setContrato({ ...contrato, subdominio: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{SUBDOMINIOS.map((s) => <SelectItem key={s} value={s}>{s}.aloclinica.com.br</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Modelo de cobrança *</Label>
                    <Select value={contrato.modelo_cobranca} onValueChange={(v) => setContrato({ ...contrato, modelo_cobranca: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{COBRANCAS.map((c) => <SelectItem key={c.v} value={c.v}>{c.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Valor/consulta (R$)</Label>
                      <Input type="number" min={0} step={0.01} value={contrato.valor_consulta}
                        onChange={(e) => setContrato({ ...contrato, valor_consulta: e.target.value })} placeholder="80.00" />
                    </div>
                    <div>
                      <Label>Cota total</Label>
                      <Input type="number" min={0} value={contrato.cota_total}
                        onChange={(e) => setContrato({ ...contrato, cota_total: e.target.value })} placeholder="5000" />
                    </div>
                    <div>
                      <Label>Vigência fim</Label>
                      <Input type="date" value={contrato.vigencia_fim}
                        onChange={(e) => setContrato({ ...contrato, vigencia_fim: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-5">
                <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">2. Gestor do contrato</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Nome</Label>
                      <Input value={gestor.nome} onChange={(e) => setGestor({ ...gestor, nome: e.target.value })} placeholder="Maria Souza" />
                    </div>
                    <div>
                      <Label>E-mail *</Label>
                      <Input type="email" value={gestor.email} onChange={(e) => setGestor({ ...gestor, email: e.target.value })} placeholder="gestor@orgao.gov.br" />
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Vai receber um link único de convite (válido 14 dias). Ao aceitar, cria conta e cai no painel do contrato.
                  </p>
                </div>
              </div>

              <Button onClick={submit} disabled={saving} size="lg" className="w-full h-12 rounded-2xl gap-2">
                {saving ? "Criando…" : <>Criar contrato e gerar convite <ArrowRight className="w-4 h-4" /></>}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminContractNew;
