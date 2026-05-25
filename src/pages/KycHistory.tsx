/**
 * /kyc/historico — histórico das verificações biométricas do usuário logado.
 * Lista todas as tentativas (em andamento, aprovadas, rejeitadas) com data,
 * tipo de documento, similaridade e motivos de rejeição quando houver.
 */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, CheckCircle2, XCircle, Loader2, Clock, ArrowLeft, Fingerprint, FileText } from "lucide-react";

type KycRow = {
  id: string;
  status: string;
  similarity: number | null;
  tipo: string;
  document_type: string | null;
  mismatch_reasons: string[] | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

const STATUS_META: Record<string, { label: string; icon: any; className: string }> = {
  approved: { label: "Aprovada", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300" },
  rejected: { label: "Reprovada", icon: XCircle, className: "bg-red-500/10 text-red-700 border-red-500/30 dark:text-red-300" },
  in_progress: { label: "Em andamento", icon: Loader2, className: "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-300" },
  pendente: { label: "Pendente", icon: Clock, className: "bg-muted text-muted-foreground border-border" },
};

const DOC_LABELS: Record<string, string> = {
  rg: "RG",
  cnh: "CNH",
  passaporte: "Passaporte",
};

export default function KycHistory() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<KycRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/paciente", { replace: true });
      return;
    }
    (async () => {
      const { data } = await db
        .from("kyc_verificacoes")
        .select("id,status,similarity,tipo,document_type,mismatch_reasons,error_message,created_at,updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      setRows((data as KycRow[]) ?? []);
      setLoading(false);
    })();
  }, [user, authLoading, navigate]);

  const lastApproved = rows?.find((r) => r.status === "approved");

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <SEOHead title="Histórico de verificações — AloClínica" description="Consulte o histórico completo das suas verificações biométricas de identidade." />

      <div className="max-w-3xl mx-auto px-4 py-8 lg:py-12">
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
          <Link to="/dashboard"><ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar ao painel</Link>
        </Button>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-3">
            <Fingerprint className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Verificação de identidade</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight">Histórico de verificações</h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Todas as suas tentativas de verificação biométrica ficam registradas aqui, com data, resultado e nível de similaridade.
          </p>
        </div>

        {/* Status atual */}
        <Card className="mb-6 border-primary/15 bg-gradient-to-br from-primary/5 via-card to-secondary/5">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Status atual</CardTitle>
                <CardDescription className="text-xs">
                  {lastApproved
                    ? `Verificada em ${new Date(lastApproved.created_at).toLocaleDateString("pt-BR")}`
                    : "Você ainda não tem uma verificação aprovada"}
                </CardDescription>
              </div>
            </div>
            {lastApproved ? (
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Aprovada
              </Badge>
            ) : (
              <Button size="sm" asChild>
                <Link to="/kyc">Verificar agora</Link>
              </Button>
            )}
          </CardHeader>
        </Card>

        {/* Lista */}
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        ) : !rows || rows.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nenhuma verificação registrada ainda.</p>
              <Button asChild className="mt-4"><Link to="/kyc">Iniciar primeira verificação</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => {
              const meta = STATUS_META[r.status] || STATUS_META.pendente;
              const Icon = meta.icon;
              const dateStr = new Date(r.created_at).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" });
              const sim = r.similarity != null ? Math.round(r.similarity * 100) : null;
              return (
                <li key={r.id}>
                  <Card className="hover:border-primary/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${meta.className}`}>
                            <Icon className={`w-5 h-5 ${r.status === "in_progress" ? "animate-spin" : ""}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className={meta.className}>{meta.label}</Badge>
                              {r.document_type && (
                                <Badge variant="outline" className="text-[10px]">{DOC_LABELS[r.document_type] || r.document_type.toUpperCase()}</Badge>
                              )}
                              {sim != null && (
                                <span className="text-xs text-muted-foreground">Similaridade: <strong className="text-foreground">{sim}%</strong></span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{dateStr}</p>
                            {r.mismatch_reasons && r.mismatch_reasons.length > 0 && (
                              <ul className="mt-2 text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                                {r.mismatch_reasons.slice(0, 3).map((m, i) => <li key={i}>{m}</li>)}
                              </ul>
                            )}
                            {r.error_message && (
                              <p className="mt-2 text-xs text-red-600 dark:text-red-400">{r.error_message}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}