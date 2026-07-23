/**
 * AdminOnboardingPipeline — funil unificado de onboarding de médicos.
 *
 * Consolida numa única visão as etapas que hoje ficam espalhadas em
 * AdminDoctorApplications, AdminApprovals e AdminKycReview, mostrando por etapa:
 *  - a CONTAGEM real (via count head:true, sem fabricar números)
 *  - o AGING (idade do item mais antigo) para expor gargalos de SLA
 *  - para as etapas acionáveis, os poucos itens mais antigos + link para a tela existente
 *
 * Fontes de dados (verificadas em types.ts + componentes existentes):
 *  1. Candidatura      → doctor_applications (status = 'pending')
 *  2. Convite enviado  → doctor_invite_codes (is_used = false)   [flag de uso em runtime]
 *  3. Cadastro pendente→ doctor_profiles (is_approved false/null)
 *  4. KYC pendente     → kyc_verificacoes (tipo='medico', status pending/pendente)
 *  5. CRM a verificar  → doctor_profiles (crm_verified false/null)
 *  6. Aprovado         → doctor_profiles (is_approved = true) — etapa terminal
 */
import { useState, useEffect, useCallback, useMemo, Fragment } from "react";
import { Link } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import { logError } from "@/lib/logger";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getAdminNav } from "./adminNav";
import { AdminPageHeader } from "./AdminPageHeader";
import { AdminLoading } from "./AdminStateBlocks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  Workflow, ClipboardList, Mail, UserPlus, ScanFace, ShieldCheck, BadgeCheck,
  Clock, AlertTriangle, RefreshCw, ArrowRight, TrendingUp, CheckCircle2, Info,
} from "lucide-react";

/* ─── Tipos ────────────────────────────────────────────────────────── */

type StageId = "candidatura" | "convite" | "cadastro" | "kyc" | "crm" | "aprovado";

interface StageEntry {
  id: string;
  name: string;
  sub?: string;
  createdAt: string;
  days: number;
}

interface StageData {
  count: number;
  oldestDays: number | null;
  entries: StageEntry[];
  unavailable?: boolean;
  note?: string;
}

interface StageMeta {
  id: StageId;
  label: string;
  icon: LucideIcon;
  accent: string;
  description: string;
  /** SLA em dias — acima disso o aging fica vermelho. 0 = etapa terminal (sem SLA). */
  slaDays: number;
  /** Etapa em que o admin age (mostra lista + link). */
  actionable: boolean;
  link: string;
  linkLabel: string;
}

/* ─── Configuração das etapas ──────────────────────────────────────── */

const STAGES: StageMeta[] = [
  {
    id: "candidatura", label: "Candidatura", icon: ClipboardList,
    accent: "from-blue-500 to-indigo-600",
    description: "Intake pré-cadastro aguardando triagem",
    slaDays: 2, actionable: true,
    link: "/dashboard/admin/doctor-applications?role=admin", linkLabel: "Candidaturas",
  },
  {
    id: "convite", label: "Convite enviado", icon: Mail,
    accent: "from-amber-500 to-orange-600",
    description: "Código emitido, médico ainda não se cadastrou",
    slaDays: 7, actionable: true,
    link: "/dashboard/admin/invite-codes?role=admin", linkLabel: "Códigos de convite",
  },
  {
    id: "cadastro", label: "Cadastro pendente", icon: UserPlus,
    accent: "from-violet-500 to-purple-600",
    description: "Cadastrado, aguardando aprovação",
    slaDays: 2, actionable: true,
    link: "/dashboard/admin/approvals?role=admin", linkLabel: "Aprovações",
  },
  {
    id: "kyc", label: "KYC pendente", icon: ScanFace,
    accent: "from-cyan-500 to-blue-600",
    description: "Verificação biométrica na fila",
    slaDays: 1, actionable: true,
    link: "/dashboard/admin/kyc-review?role=admin", linkLabel: "Verificação KYC",
  },
  {
    id: "crm", label: "CRM a verificar", icon: ShieldCheck,
    accent: "from-teal-500 to-emerald-600",
    description: "CRM ainda não validado no CFM",
    slaDays: 2, actionable: true,
    link: "/dashboard/admin/approvals?role=admin", linkLabel: "Aprovações",
  },
  {
    id: "aprovado", label: "Aprovado", icon: BadgeCheck,
    accent: "from-emerald-500 to-green-600",
    description: "Médico ativo na plataforma",
    slaDays: 0, actionable: false,
    link: "/dashboard/admin/doctors?role=admin", linkLabel: "Médicos",
  },
];

const NAME_LIMIT = 5;

/* ─── Helpers ──────────────────────────────────────────────────────── */

const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

const ageLabel = (iso: string) => {
  const h = (Date.now() - new Date(iso).getTime()) / 3600000;
  if (h < 24) return `${Math.max(1, Math.round(h))}h`;
  return `${Math.round(h / 24)}d`;
};

type Tone = "ok" | "warn" | "danger" | "muted";

const TONE_CLASS: Record<Tone, string> = {
  ok: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  warn: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  danger: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  muted: "bg-muted text-muted-foreground border-border",
};

const slaTone = (slaDays: number, days: number | null): Tone => {
  if (days == null || slaDays <= 0) return "muted";
  if (days > slaDays) return "danger";
  if (days > slaDays * 0.5) return "warn";
  return "ok";
};

/* ─── Componente ───────────────────────────────────────────────────── */

const AdminOnboardingPipeline = () => {
  const [data, setData] = useState<Record<StageId, StageData> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [
        candCount, candList,
        invCount, invList,
        cadCount, cadList,
        kycCount, kycList,
        crmCount, crmList,
        aprovadoCount,
      ] = await Promise.all([
        // 1 — Candidatura
        db.from("doctor_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
        db.from("doctor_applications").select("id, full_name, crm, crm_state, created_at")
          .eq("status", "pending").order("created_at", { ascending: true }).limit(NAME_LIMIT),

        // 2 — Convite enviado
        db.from("doctor_invite_codes").select("id", { count: "exact", head: true }).eq("is_used", false),
        db.from("doctor_invite_codes").select("id, code, created_at")
          .eq("is_used", false).order("created_at", { ascending: true }).limit(NAME_LIMIT),

        // 3 — Cadastro pendente
        db.from("doctor_profiles").select("id", { count: "exact", head: true })
          .or("is_approved.is.null,is_approved.eq.false"),
        db.from("doctor_profiles").select("id, user_id, crm, crm_state, created_at")
          .or("is_approved.is.null,is_approved.eq.false").order("created_at", { ascending: true }).limit(NAME_LIMIT),

        // 4 — KYC pendente (médicos)
        db.from("kyc_verificacoes").select("id", { count: "exact", head: true })
          .eq("tipo", "medico").in("status", ["pending", "pendente"]),
        db.from("kyc_verificacoes").select("id, user_id, created_at")
          .eq("tipo", "medico").in("status", ["pending", "pendente"]).order("created_at", { ascending: true }).limit(NAME_LIMIT),

        // 5 — CRM a verificar
        db.from("doctor_profiles").select("id", { count: "exact", head: true })
          .or("crm_verified.is.null,crm_verified.eq.false"),
        db.from("doctor_profiles").select("id, user_id, crm, crm_state, created_at")
          .or("crm_verified.is.null,crm_verified.eq.false").order("created_at", { ascending: true }).limit(NAME_LIMIT),

        // 6 — Aprovado (terminal)
        db.from("doctor_profiles").select("id", { count: "exact", head: true }).eq("is_approved", true),
      ]);

      // Resolve nomes (profiles) para as etapas que só têm user_id
      const userIds = [...new Set(
        [...(cadList.data ?? []), ...(kycList.data ?? []), ...(crmList.data ?? [])]
          .map((r: { user_id?: string }) => r.user_id)
          .filter(Boolean)
      )] as string[];

      const { data: profs } = userIds.length
        ? await db.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds)
        : { data: [] as Array<{ user_id: string; first_name: string | null; last_name: string | null }> };

      const nameMap = new Map<string, string>(
        (profs ?? []).map((p: { user_id: string; first_name: string | null; last_name: string | null }) =>
          [p.user_id, `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim()] as const)
      );

      const mk = (count: number | null | undefined, entries: StageEntry[]): StageData => ({
        count: count ?? entries.length,
        oldestDays: entries.length ? entries[0].days : null,
        entries,
      });

      const inviteUnavailable = !!invCount.error || !!invList.error;
      if (inviteUnavailable) logError("OnboardingPipeline: doctor_invite_codes sem flag is_used", invCount.error ?? invList.error);

      const result: Record<StageId, StageData> = {
        candidatura: mk(
          candCount.count,
          (candList.data ?? []).map((r: { id: string; full_name: string | null; crm: string | null; crm_state: string | null; created_at: string }) => ({
            id: r.id,
            name: r.full_name || "Sem nome",
            sub: `CRM ${r.crm || "—"}/${r.crm_state || "—"}`,
            createdAt: r.created_at,
            days: daysSince(r.created_at),
          }))
        ),

        convite: inviteUnavailable
          ? { count: 0, oldestDays: null, entries: [], unavailable: true, note: "doctor_invite_codes não expõe flag de uso confiável neste ambiente." }
          : mk(
              invCount.count,
              (invList.data ?? []).map((r: { id: string; code: string; created_at: string }) => ({
                id: r.id,
                name: r.code,
                sub: "Convite não resgatado",
                createdAt: r.created_at,
                days: daysSince(r.created_at),
              }))
            ),

        cadastro: mk(
          cadCount.count,
          (cadList.data ?? []).map((r: { id: string; user_id: string; crm: string | null; crm_state: string | null; created_at: string }) => ({
            id: r.id,
            name: nameMap.get(r.user_id) || "Médico sem nome",
            sub: `CRM ${r.crm || "—"}/${r.crm_state || "—"}`,
            createdAt: r.created_at,
            days: daysSince(r.created_at),
          }))
        ),

        kyc: mk(
          kycCount.count,
          (kycList.data ?? []).map((r: { id: string; user_id: string; created_at: string }) => ({
            id: r.id,
            name: nameMap.get(r.user_id) || "Médico sem nome",
            sub: "Aguardando revisão biométrica",
            createdAt: r.created_at,
            days: daysSince(r.created_at),
          }))
        ),

        crm: mk(
          crmCount.count,
          (crmList.data ?? []).map((r: { id: string; user_id: string; crm: string | null; crm_state: string | null; created_at: string }) => ({
            id: r.id,
            name: nameMap.get(r.user_id) || "Médico sem nome",
            sub: `CRM ${r.crm || "—"}/${r.crm_state || "—"}`,
            createdAt: r.created_at,
            days: daysSince(r.created_at),
          }))
        ),

        aprovado: { count: aprovadoCount.count ?? 0, oldestDays: null, entries: [] },
      };

      setData(result);
    } catch (err) {
      logError("AdminOnboardingPipeline load error", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* Gargalo: etapa acionável com mais itens (desempate pelo mais antigo). */
  const bottleneck = useMemo(() => {
    if (!data) return null;
    const candidates = STAGES.filter(
      s => s.actionable && !data[s.id].unavailable && data[s.id].count > 0
    );
    if (!candidates.length) return null;
    return candidates.sort((a, b) => {
      const A = data[a.id], B = data[b.id];
      if (B.count !== A.count) return B.count - A.count;
      return (B.oldestDays ?? 0) - (A.oldestDays ?? 0);
    })[0];
  }, [data]);

  const totalPending = useMemo(() => {
    if (!data) return 0;
    return STAGES.filter(s => s.actionable).reduce((sum, s) => sum + (data[s.id].unavailable ? 0 : data[s.id].count), 0);
  }, [data]);

  /* ─── Render helpers ─── */

  const renderFunnelCard = (meta: StageMeta) => {
    const d = data![meta.id];
    const Icon = meta.icon;
    const tone: Tone = d.unavailable ? "muted" : slaTone(meta.slaDays, d.oldestDays);
    const isBottleneck = bottleneck?.id === meta.id;
    return (
      <Link
        to={meta.link}
        className={cn(
          "group relative flex w-[160px] shrink-0 flex-col rounded-2xl border bg-card/80 p-3.5 transition-all hover:shadow-md hover:-translate-y-0.5",
          isBottleneck ? "border-rose-500/40 ring-1 ring-rose-500/20" : "border-border/60"
        )}
      >
        <div className={cn("mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm", meta.accent)}>
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">{meta.label}</p>
        <p className="mt-0.5 text-2xl font-bold text-foreground tabular-nums">
          {d.unavailable ? "—" : d.count}
        </p>
        <div className="mt-2">
          {d.unavailable ? (
            <Badge variant="outline" className={cn("h-5 gap-1 px-1.5 text-[10px]", TONE_CLASS.muted)}>
              <Info className="h-3 w-3" /> s/ dados
            </Badge>
          ) : d.count === 0 ? (
            <Badge variant="outline" className={cn("h-5 px-1.5 text-[10px]", TONE_CLASS.ok)}>
              vazio
            </Badge>
          ) : meta.slaDays <= 0 ? (
            <Badge variant="outline" className={cn("h-5 gap-1 px-1.5 text-[10px]", TONE_CLASS.muted)}>
              <CheckCircle2 className="h-3 w-3" /> terminal
            </Badge>
          ) : (
            <Badge variant="outline" className={cn("h-5 gap-1 px-1.5 text-[10px]", TONE_CLASS[tone])}>
              {tone === "danger" ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              mais antigo {d.oldestDays}d
            </Badge>
          )}
        </div>
      </Link>
    );
  };

  const renderDetailCard = (meta: StageMeta) => {
    const d = data![meta.id];
    const Icon = meta.icon;
    return (
      <Card key={meta.id} className="border-border/60">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm shrink-0", meta.accent)}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight truncate">{meta.label}</p>
                <p className="text-[11px] text-muted-foreground truncate">{d.count} no total</p>
              </div>
            </div>
            <Link to={meta.link} className="shrink-0 text-[11px] font-medium text-primary hover:underline whitespace-nowrap">
              Ver todos →
            </Link>
          </div>

          {d.unavailable ? (
            <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-2.5 text-[11px] text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{d.note}</span>
            </div>
          ) : d.entries.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/5 p-2.5 text-[11px] text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Nada pendente nesta etapa.
            </div>
          ) : (
            <ul className="space-y-1.5">
              {d.entries.map(e => {
                const tone = slaTone(meta.slaDays, e.days);
                return (
                  <li key={e.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-card/40 px-2.5 py-1.5">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{e.name}</p>
                      {e.sub && <p className="text-[10.5px] text-muted-foreground truncate">{e.sub}</p>}
                    </div>
                    <Badge variant="outline" className={cn("h-5 shrink-0 gap-1 px-1.5 text-[10px]", TONE_CLASS[tone])}>
                      {tone === "danger" ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {ageLabel(e.createdAt)}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    );
  };

  /* ─── UI ─── */

  const actionableWithData = STAGES.filter(s => s.actionable);

  return (
    <DashboardLayout title="Administração" nav={getAdminNav("onboarding-pipeline")} role="admin">
      <div className="w-full mx-auto max-w-6xl space-y-5 pb-24 md:pb-6">
        <AdminPageHeader
          icon={Workflow}
          eyebrow="Operação"
          title="Funil de Onboarding"
          description="Visão unificada da jornada do médico — candidatura, convite, cadastro, KYC e verificação de CRM — com contagem e tempo de espera (SLA) por etapa."
          accent="from-violet-500 to-purple-600"
          badge={
            loading
              ? undefined
              : totalPending === 0
                ? { label: "Tudo em dia", tone: "success" }
                : { label: `${totalPending} em andamento`, tone: "warning" }
          }
          actions={
            <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5">
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Atualizar
            </Button>
          }
        />

        {loading || !data ? (
          <AdminLoading variant="cards" count={4} />
        ) : (
          <>
            {/* Gargalo headline */}
            {bottleneck ? (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-500/25 bg-rose-500/5 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    Gargalo: <span className="text-rose-600 dark:text-rose-400">{bottleneck.label}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {data[bottleneck.id].count} {data[bottleneck.id].count === 1 ? "médico parado" : "médicos parados"} nesta etapa
                    {data[bottleneck.id].oldestDays != null && ` · mais antigo há ${data[bottleneck.id].oldestDays} dia${data[bottleneck.id].oldestDays === 1 ? "" : "s"}`}.
                  </p>
                </div>
                <Link
                  to={bottleneck.link}
                  className="ml-auto shrink-0 self-center text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline whitespace-nowrap"
                >
                  Resolver →
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-foreground">Nenhum gargalo — nenhuma etapa acionável com itens pendentes.</p>
              </div>
            )}

            {/* Funil horizontal */}
            <div className="overflow-x-auto pb-2 -mx-1 px-1">
              <div className="flex min-w-max items-stretch gap-2">
                {STAGES.map((meta, i) => (
                  <Fragment key={meta.id}>
                    {renderFunnelCard(meta)}
                    {i < STAGES.length - 1 && (
                      <div className="flex items-center" aria-hidden>
                        <ArrowRight className="h-4 w-4 text-muted-foreground/40" />
                      </div>
                    )}
                  </Fragment>
                ))}
              </div>
            </div>

            {/* Detalhe das etapas acionáveis */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {actionableWithData.map(renderDetailCard)}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminOnboardingPipeline;
