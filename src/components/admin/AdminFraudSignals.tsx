/**
 * AdminFraudSignals — painel de sinais de fraude para o admin.
 *
 * Consulta a view public.fraud_signals (heurística composta: CPF compartilhado,
 * falhas de login em 24h, alto índice de no-show, múltiplas tentativas de KYC).
 * Cada linha tem severidade visual; admin clica e abre o EMR para investigar.
 *
 * Ações de moderação:
 *  - Bloquear / desbloquear a conta via profiles.account_status ('blocked' | 'active').
 *    O bloqueio é REAL e imposto no banco: um trigger em appointments impede o
 *    agendamento de novas consultas enquanto account_status = 'blocked'.
 *  - Marcar o status do caso (em análise / revisado / dispensado). Como
 *    fraud_signals é uma view somente-leitura e não existe tabela de revisão,
 *    o status é persistido em localStorage por admin.
 *  - Toda ação de moderação grava uma linha de auditoria em activity_logs
 *    (mesmo padrão de AdminUsers).
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { getAdminNav } from "./adminNav";
import { ShieldAlert, AlertTriangle, Eye, Users, KeyRound, CalendarX, Ban, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { logError } from "@/lib/logger";

interface Signal {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  cpf: string | null;
  phone: string | null;
  cpf_compartilhado_por: number | null;
  login_fails_24h: number | null;
  no_show_rate: number | null;
  appointments_total: number | null;
  kyc_attempts: number | null;
  kyc_rejs: number | null;
}

interface ProfileStatus {
  account_status: string;
  account_blocked_reason: string | null;
}

type CaseStatus = "novo" | "em_analise" | "revisado" | "dispensado";
interface ReviewState { status: CaseStatus; updated_at: string; }

const CASE_OPTIONS: { value: CaseStatus; label: string }[] = [
  { value: "novo", label: "Novo" },
  { value: "em_analise", label: "Em análise" },
  { value: "revisado", label: "Revisado" },
  { value: "dispensado", label: "Dispensado" },
];
const CASE_LABELS: Record<CaseStatus, string> = Object.fromEntries(CASE_OPTIONS.map(o => [o.value, o.label])) as Record<CaseStatus, string>;
const CASE_BADGE: Record<CaseStatus, string> = {
  novo: "",
  em_analise: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  revisado: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  dispensado: "bg-muted text-muted-foreground",
};
const isResolved = (st?: CaseStatus) => st === "revisado" || st === "dispensado";

const SEVERITIES = ["Crítico", "Alto", "Atenção"] as const;

function severityOf(s: Signal): { score: number; label: string; color: string } {
  let score = 0;
  if ((s.cpf_compartilhado_por ?? 0) >= 3) score += 3;
  else if ((s.cpf_compartilhado_por ?? 0) >= 2) score += 2;
  if ((s.login_fails_24h ?? 0) >= 10) score += 2; else if ((s.login_fails_24h ?? 0) >= 5) score += 1;
  if ((s.no_show_rate ?? 0) >= 0.7) score += 2; else if ((s.no_show_rate ?? 0) >= 0.5) score += 1;
  if ((s.kyc_rejs ?? 0) >= 3) score += 2; else if ((s.kyc_rejs ?? 0) >= 2) score += 1;
  if (score >= 5) return { score, label: "Crítico", color: "bg-destructive/10 text-destructive border-destructive/40" };
  if (score >= 3) return { score, label: "Alto", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/40" };
  return { score, label: "Atenção", color: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/40" };
}

const displayName = (s: Signal) => `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || "(sem nome)";

const reviewKey = (adminId: string) => `aloclinica_fraud_reviews_${adminId}`;
function loadReviews(adminId: string): Record<string, ReviewState> {
  try { const raw = localStorage.getItem(reviewKey(adminId)); return raw ? JSON.parse(raw) : {}; }
  catch { return {}; }
}
function persistReviews(adminId: string, reviews: Record<string, ReviewState>) {
  try { localStorage.setItem(reviewKey(adminId), JSON.stringify(reviews)); } catch { /* quota/off — ignore */ }
}

/** Auditoria imutável de moderação (mesmo padrão de AdminUsers → activity_logs). Não bloqueia UX. */
async function writeAudit(action: string, targetUserId: string, metadata: Record<string, unknown>) {
  try {
    const { data: authData } = await db.auth.getUser();
    const actorId = authData?.user?.id ?? null;
    await db.from("activity_logs").insert({
      user_id: actorId,
      action,
      entity_type: "profile",
      entity_id: targetUserId,
      metadata: { actor_id: actorId, target_user_id: targetUserId, ...metadata },
    });
  } catch (e) {
    logError("AdminFraudSignals audit write failed", e);
  }
}

const AdminFraudSignals = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [statusMap, setStatusMap] = useState<Record<string, ProfileStatus>>({});
  const [reviews, setReviews] = useState<Record<string, ReviewState>>({});
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [severityFilter, setSeverityFilter] = useState<"all" | (typeof SEVERITIES)[number]>("all");
  const [onlyUnreviewed, setOnlyUnreviewed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await db.from("fraud_signals").select("*").limit(200);
        if (error) throw error;
        const list = (data ?? []) as Signal[];
        list.sort((a, b) => severityOf(b).score - severityOf(a).score);
        setSignals(list);

        // Estado da conta (bloqueada / ativa / anonimizada) para cada usuário sinalizado.
        const ids = list.map(s => s.user_id).filter(Boolean);
        if (ids.length) {
          const { data: profs } = await db.from("profiles")
            .select("user_id, account_status, account_blocked_reason")
            .in("user_id", ids);
          const map: Record<string, ProfileStatus> = {};
          (profs ?? []).forEach((p: ProfileStatus & { user_id: string }) => {
            map[p.user_id] = { account_status: p.account_status, account_blocked_reason: p.account_blocked_reason };
          });
          setStatusMap(map);
        }

        // Status de revisão dos casos — persistido em localStorage por admin.
        const { data: authData } = await db.auth.getUser();
        const aid = authData?.user?.id ?? null;
        setAdminId(aid);
        if (aid) setReviews(loadReviews(aid));
      } catch (e) {
        logError("AdminFraudSignals load", e);
      } finally { setLoading(false); }
    })();
  }, []);

  const setBusyFor = (id: string, on: boolean) =>
    setBusy(prev => { const n = new Set(prev); if (on) n.add(id); else n.delete(id); return n; });

  // Bloqueio/desbloqueio REAL da conta via profiles.account_status.
  const toggleBlock = async (s: Signal) => {
    const current = statusMap[s.user_id]?.account_status ?? "active";
    if (current === "anonymized") {
      toast.error("Conta anonimizada (LGPD) — não é possível alterar.");
      return;
    }
    const isBlocked = current === "blocked";
    const name = displayName(s);
    const ok = await confirm({
      title: isBlocked ? `Desbloquear ${name}?` : `Bloquear ${name}?`,
      description: isBlocked
        ? "A conta volta a poder agendar consultas normalmente."
        : "A conta ficará impedida de agendar novas consultas (bloqueio imposto no banco). Faça isso apenas após revisar o sinal.",
      confirmLabel: isBlocked ? "Desbloquear" : "Bloquear",
      destructive: !isBlocked,
    });
    if (!ok) return;

    setBusyFor(s.user_id, true);
    try {
      const nextStatus = isBlocked ? "active" : "blocked";
      const reason = isBlocked ? null : "Bloqueado pelo admin — sinal de fraude em revisão";
      const { error } = await db.from("profiles")
        .update({ account_status: nextStatus, account_blocked_reason: reason })
        .eq("user_id", s.user_id);
      if (error) throw error;
      setStatusMap(prev => ({ ...prev, [s.user_id]: { account_status: nextStatus, account_blocked_reason: reason } }));
      await writeAudit(isBlocked ? "fraud.user_unblock" : "fraud.user_block", s.user_id, {
        previous_status: current, new_status: nextStatus, reason,
      });
      toast.success(isBlocked ? "Conta desbloqueada ✅" : "Conta bloqueada 🔒");
    } catch (e) {
      logError("AdminFraudSignals toggleBlock", e);
      toast.error("Não foi possível atualizar a conta.");
    } finally {
      setBusyFor(s.user_id, false);
    }
  };

  const setCaseStatus = (s: Signal, status: CaseStatus) => {
    if (!adminId) { toast.error("Sessão não identificada."); return; }
    const next = { ...reviews, [s.user_id]: { status, updated_at: new Date().toISOString() } };
    setReviews(next);
    persistReviews(adminId, next);
    void writeAudit("fraud.review_status", s.user_id, { case_status: status });
    toast.success(`Caso marcado como "${CASE_LABELS[status]}"`);
  };

  const sevCounts = signals.reduce<Record<string, number>>((acc, s) => {
    const l = severityOf(s).label; acc[l] = (acc[l] ?? 0) + 1; return acc;
  }, {});

  const visible = signals.filter(s => {
    if (severityFilter !== "all" && severityOf(s).label !== severityFilter) return false;
    if (onlyUnreviewed && isResolved(reviews[s.user_id]?.status)) return false;
    return true;
  });

  return (
    <DashboardLayout title="Sinais de fraude" nav={getAdminNav("fraud-signals")} role="admin">
      <div className="max-w-5xl mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-destructive" /> Sinais de fraude</h1>
          <p className="text-sm text-muted-foreground">
            Heurística composta — CPF duplicado, falhas de login em 24h, alto no-show, múltiplas tentativas de KYC.
            Os sinais são listados por severidade decrescente.
          </p>
        </div>

        {!loading && signals.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 mr-1">Severidade:</span>
            <button
              type="button"
              onClick={() => setSeverityFilter("all")}
              className={`h-7 px-3 rounded-full text-[11px] font-semibold transition-colors ${
                severityFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              Todas ({signals.length})
            </button>
            {SEVERITIES.filter(sv => (sevCounts[sv] ?? 0) > 0).map(sv => (
              <button
                key={sv}
                type="button"
                onClick={() => setSeverityFilter(severityFilter === sv ? "all" : sv)}
                className={`h-7 px-3 rounded-full text-[11px] font-semibold transition-colors ${
                  severityFilter === sv ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                {sv} ({sevCounts[sv]})
              </button>
            ))}
            <button
              type="button"
              onClick={() => setOnlyUnreviewed(v => !v)}
              className={`h-7 px-3 rounded-full text-[11px] font-semibold transition-colors ml-auto ${
                onlyUnreviewed ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              Somente não revisados
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
        ) : signals.length === 0 ? (
          <EmptyState icon={ShieldAlert} title="Tudo limpo por agora"
            description="Não foram detectados sinais relevantes nos últimos 30 dias." variant="subtle" />
        ) : visible.length === 0 ? (
          <EmptyState icon={ShieldAlert} title="Nenhum sinal com esses filtros"
            description="Ajuste a severidade ou desative o filtro de não revisados." variant="subtle" />
        ) : (
          <div className="space-y-2">
            {visible.map((s) => {
              const sev = severityOf(s);
              const name = displayName(s);
              const acct = statusMap[s.user_id]?.account_status ?? "active";
              const blocked = acct === "blocked";
              const anonymized = acct === "anonymized";
              const caseStatus = reviews[s.user_id]?.status ?? "novo";
              const resolved = isResolved(caseStatus);
              const rowBusy = busy.has(s.user_id);
              return (
                <Card key={s.user_id} className={`border-l-4 ${sev.color.split(" ").find(c => c.startsWith("border-"))} ${resolved ? "opacity-60" : ""}`}>
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground truncate">{name}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sev.color}`}>{sev.label}</span>
                        {blocked && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive inline-flex items-center gap-1"><Ban className="w-3 h-3" /> Bloqueado</span>
                        )}
                        {anonymized && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Anonimizado</span>
                        )}
                        {caseStatus !== "novo" && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CASE_BADGE[caseStatus]}`}>{CASE_LABELS[caseStatus]}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {s.cpf ? `CPF ${s.cpf}` : "Sem CPF"}{s.phone ? ` · ${s.phone}` : ""}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px]">
                        {(s.cpf_compartilhado_por ?? 0) >= 2 && (
                          <span className="inline-flex items-center gap-1 text-foreground"><Users className="w-3 h-3 text-destructive" /> CPF em {s.cpf_compartilhado_por} contas</span>
                        )}
                        {(s.login_fails_24h ?? 0) >= 3 && (
                          <span className="inline-flex items-center gap-1 text-foreground"><KeyRound className="w-3 h-3 text-amber-600" /> {s.login_fails_24h} falhas de login 24h</span>
                        )}
                        {(s.no_show_rate ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-1 text-foreground"><CalendarX className="w-3 h-3 text-amber-600" /> {Math.round((s.no_show_rate ?? 0) * 100)}% no-show ({s.appointments_total} consultas)</span>
                        )}
                        {(s.kyc_attempts ?? 0) >= 3 && (
                          <span className="inline-flex items-center gap-1 text-foreground"><AlertTriangle className="w-3 h-3 text-amber-600" /> {s.kyc_attempts} tentativas KYC ({s.kyc_rejs} rejeitadas)</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <Select value={caseStatus} onValueChange={(v) => setCaseStatus(s, v as CaseStatus)}>
                        <SelectTrigger className="h-8 w-[132px] rounded-xl text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CASE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {!anonymized && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={rowBusy}
                          className={`rounded-xl gap-1.5 ${blocked ? "" : "text-destructive border-destructive/30 hover:bg-destructive/5"}`}
                          onClick={() => toggleBlock(s)}
                        >
                          {rowBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : blocked ? <ShieldCheck className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                          {blocked ? "Desbloquear" : "Bloquear"}
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={() => navigate(`/dashboard/patients/${s.user_id}/emr`)}>
                        <Eye className="w-3.5 h-3.5" /> Inspecionar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminFraudSignals;
