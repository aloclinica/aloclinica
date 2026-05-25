/**
 * Portal do Titular dos Dados (LGPD - Art. 18).
 *
 * Permite ao usuário autenticado exercer seus direitos:
 *   - confirmar a existência de tratamento e visualizar dados
 *   - exportar todos os dados (JSON)
 *   - consultar histórico completo de consentimentos
 *   - solicitar revogação de consentimento
 *   - solicitar exclusão da conta
 *
 * Todas as ações são registradas em consent_logs para auditoria.
 */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  ShieldCheck, Download, FileSearch, Trash2, History,
  XCircle, Loader2, FileText,
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { logConsent } from "@/lib/consent";

interface ConsentRow {
  id: string;
  consent_type: string;
  version: string;
  accepted: boolean;
  created_at: string;
  document_url: string | null;
  ip_address: string | null;
}

const HUMAN_LABELS: Record<string, string> = {
  terms_of_use: "Termos de Uso",
  privacy_policy: "Política de Privacidade",
  lgpd_data_processing: "Tratamento de dados (LGPD)",
  biometric_kyc: "Verificação biométrica (KYC)",
  tcle_telemedicine: "TCLE — Telemedicina",
  cookies_essential: "Cookies essenciais",
  cookies_analytics: "Cookies analíticos",
  cookies_marketing: "Cookies de marketing",
  cookies_all: "Cookies — todos",
  cookies_rejected: "Cookies opcionais recusados",
};

export default function PrivacyPortal() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [consents, setConsents] = useState<ConsentRow[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await db.auth.getUser();
      const u = data?.user;
      if (!u) { navigate("/paciente"); return; }
      setUserId(u.id);
      setEmail(u.email ?? "");
      const { data: rows } = await db
        .from("consent_logs")
        .select("id,consent_type,version,accepted,created_at,document_url,ip_address")
        .order("created_at", { ascending: false })
        .limit(200);
      setConsents((rows as ConsentRow[]) ?? []);
      setLoading(false);
    })();
  }, [navigate]);

  const exportData = async () => {
    if (!userId) return;
    setBusy("export");
    try {
      const [profile, appointments, prescriptions, notifs] = await Promise.all([
        db.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
        db.from("appointments").select("*").eq("patient_id", userId),
        db.from("prescriptions").select("*").eq("patient_id", userId),
        db.from("notifications").select("*").eq("user_id", userId).limit(500),
      ]);
      const payload = {
        exported_at: new Date().toISOString(),
        user: { id: userId, email },
        profile: profile.data ?? null,
        appointments: appointments.data ?? [],
        prescriptions: prescriptions.data ?? [],
        notifications: notifs.data ?? [],
        consent_history: consents,
        _note: "Exportação LGPD Art. 18 III/V — portabilidade dos dados.",
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aloclinica-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      await logConsent({ type: "lgpd_data_processing", accepted: true, metadata: { action: "export_request" } });
      toast.success("Seus dados foram exportados.");
    } catch (e) {
      toast.error("Não foi possível exportar agora. Tente novamente.");
    } finally {
      setBusy(null);
    }
  };

  const revokeMarketing = async () => {
    setBusy("revoke");
    try {
      await logConsent({
        type: "cookies_marketing", accepted: false,
        metadata: { action: "revoke_via_portal" },
      });
      try { localStorage.removeItem("cookie_consent_v2"); } catch { /* ignore */ }
      toast.success("Consentimento de marketing revogado.");
    } finally { setBusy(null); }
  };

  const requestDeletion = async () => {
    if (!confirm("Tem certeza? Esta solicitação inicia o processo de exclusão da sua conta (atendido em até 15 dias úteis, conforme LGPD).")) return;
    setBusy("delete");
    try {
      await db.from("support_tickets").insert({
        user_id: userId,
        subject: "Solicitação de exclusão de conta (LGPD Art. 18 VI)",
        description: `O titular ${email} solicita a exclusão de seus dados pessoais conforme a LGPD. Manter apenas o que for exigido por lei (prontuário médico = 20 anos por res. CFM 1.638/2002).`,
        priority: "high",
        category: "lgpd",
        status: "open",
      });
      await logConsent({
        type: "lgpd_data_processing", accepted: false,
        metadata: { action: "account_deletion_request" },
      });
      toast.success("Solicitação registrada. Nosso time de privacidade entrará em contato em até 15 dias.");
    } catch {
      toast.error("Não foi possível registrar a solicitação. Escreva para privacidade@aloclinica.com.br.");
    } finally { setBusy(null); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(220,60%,97%)] to-[hsl(168,40%,95%)] dark:from-background dark:to-muted">
      <SEOHead
        title="Portal do Titular dos Dados | AloClínica"
        description="Exerça seus direitos previstos na LGPD: acesse, exporte, revogue consentimentos e solicite a exclusão dos seus dados."
      />
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <header className="flex items-start gap-4 mb-8">
          <div className="rounded-2xl bg-primary/10 p-3"><ShieldCheck className="w-7 h-7 text-primary" /></div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Portal do Titular dos Dados</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Exerça aqui os direitos garantidos pela Lei Geral de Proteção de Dados (Lei nº 13.709/2018, art. 18).
              {email && <> Conta: <strong>{email}</strong></>}
            </p>
          </div>
        </header>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <ActionCard
            icon={Download} title="Exportar meus dados"
            description="Baixe um arquivo JSON com perfil, consultas, receitas, notificações e consentimentos. (Art. 18 V — portabilidade)"
            buttonLabel="Baixar agora"
            onClick={exportData} loading={busy === "export"}
          />
          <ActionCard
            icon={FileSearch} title="Confirmar tratamento e acesso"
            description="Visualize quais dados pessoais e de saúde são tratados pela plataforma. (Art. 18 I, II)"
            buttonLabel="Ver meu perfil"
            onClick={() => navigate("/dashboard/profile")}
          />
          <ActionCard
            icon={XCircle} title="Revogar consentimentos opcionais"
            description="Desligue cookies de marketing/analytics e comunicações promocionais. (Art. 18 IX)"
            buttonLabel="Revogar marketing"
            onClick={revokeMarketing} loading={busy === "revoke"}
            variant="outline"
          />
          <ActionCard
            icon={Trash2} title="Solicitar exclusão da conta"
            description="Inicia o processo de eliminação dos seus dados (exceto prontuário médico, retido por 20 anos por lei). (Art. 18 VI)"
            buttonLabel="Solicitar exclusão"
            onClick={requestDeletion} loading={busy === "delete"}
            variant="destructive"
          />
        </div>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Histórico de consentimentos</h2>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
            </div>
          ) : consents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum consentimento registrado ainda.</p>
          ) : (
            <ul className="divide-y divide-border">
              {consents.map((c) => (
                <li key={c.id} className="py-2.5 flex items-start justify-between gap-3 text-sm">
                  <div>
                    <div className="font-medium text-foreground">
                      {HUMAN_LABELS[c.consent_type] ?? c.consent_type}
                      <span className={`ml-2 text-[11px] px-1.5 py-0.5 rounded ${c.accepted ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>
                        {c.accepted ? "aceito" : "revogado"}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      v{c.version} · {new Date(c.created_at).toLocaleString("pt-BR")}
                      {c.ip_address && <> · IP {c.ip_address}</>}
                    </div>
                  </div>
                  {c.document_url && (
                    <Link to={c.document_url} className="text-primary hover:underline text-xs shrink-0 inline-flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> Documento
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <p className="mt-6 text-xs text-muted-foreground text-center">
          Encarregado de Dados (DPO): <a className="text-primary underline" href="mailto:privacidade@aloclinica.com.br">privacidade@aloclinica.com.br</a>
        </p>
      </div>
    </div>
  );
}

interface ActionCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string; description: string;
  buttonLabel: string;
  onClick: () => void;
  loading?: boolean;
  variant?: "default" | "outline" | "destructive";
}

const ActionCard = ({ icon: Icon, title, description, buttonLabel, onClick, loading, variant = "default" }: ActionCardProps) => (
  <Card className="p-5 flex flex-col gap-3">
    <div className="flex items-center gap-2"><Icon className="w-5 h-5 text-primary" /><h3 className="font-semibold text-foreground">{title}</h3></div>
    <p className="text-xs text-muted-foreground flex-1">{description}</p>
    <Button onClick={onClick} disabled={loading} variant={variant} size="sm" className="rounded-xl">
      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
      {buttonLabel}
    </Button>
  </Card>
);