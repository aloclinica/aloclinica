import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "./DashboardLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import { getPatientNav } from "@/components/patient/patientNav";
import { useTranslation } from "@/i18n";
import { format, differenceInDays, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarCheck, VideoCamera, Clock, Gift, ArrowRight,
  Heart, Lightning, ClipboardText, FileText, UploadSimple,
  Sparkle, Stethoscope, MagnifyingGlass, Plus, Warning, Robot,
  Pill, Heartbeat, TrendUp, ChatCircleDots, DotsThreeVertical, Headset,
} from "@phosphor-icons/react";
import { AlertTriangle, RefreshCw, ShieldCheck, Lock } from "lucide-react";
import PatientOnboarding, { ONBOARDING_KEY, KYC_PENDING_KEY } from "@/components/patient/PatientOnboarding";
import { PingoMascot } from "@/components/mascot/PingoMascot";
import LazyAvatar from "@/components/ui/lazy-avatar";
import PatientWaitingCard from "@/components/patient/PatientWaitingCard";
import SectionErrorBoundary from "@/components/ui/section-error-boundary";
import PatientHealthReport from "@/components/patient/PatientHealthReport";
import {
   usePatientStats, usePatientUpcoming, useReturnAppointments, useRecentHealthMetrics, useHealthTimeline,
  useDetectPatientService, type ServiceType,
} from "@/hooks/usePatientDashboard";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import FirstConsultationTour from "@/components/patient/FirstConsultationTour";
import ImminentConsultationBar from "./ImminentConsultationBar";
import AppPromotionalBanners from "./AppPromotionalBanners";
import patientHomeHero from "@/assets/patient-home-hero.png";

/* ── Constants ── */
const HEALTH_TIPS = [
  { title: "Hidratação é chave!", body: "Beba pelo menos 2L de água por dia para manter corpo e mente funcionando bem.", metric: "2L", metricLabel: "Meta Diária", emoji: "💧" },
  { title: "Mexa-se hoje!", body: "30 min de caminhada reduzem ansiedade em até 40%.", metric: "30min", metricLabel: "Ideal/dia", emoji: "🏃" },
];

const getQuickActions = (serviceType: ServiceType) => [
  { label: "Agendar",  icon: CalendarCheck,   path: "/dashboard/schedule?role=patient",                      color: "hsl(215,75%,32%)", bg: "hsl(215,75%,32%,0.08)" },
  { label: "Urgência", icon: Lightning,       path: "/dashboard/urgent-care?role=patient",                   color: "hsl(0,72%,48%)",   bg: "hsl(0,72%,48%,0.08)"   },
  { label: "Pingo IA", icon: Robot,           path: "/dashboard/ai-assistant?role=patient&tab=triagem",      color: "hsl(195,70%,38%)", bg: "hsl(195,70%,38%,0.10)" },
  { label: "Chat",     icon: ChatCircleDots,  path: "/dashboard/chat?role=patient",                          color: "hsl(168,55%,35%)", bg: "hsl(168,55%,35%,0.10)" },
  { label: "Exames",   icon: ClipboardText,   path: "/dashboard/patient/documents?role=patient",             color: "hsl(225,55%,40%)", bg: "hsl(225,55%,40%,0.08)" },
];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 6) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
};

const getAvatarRingColor = (nextAppt: any) => {
  if (!nextAppt) return "ring-emerald-400";
  const mins = differenceInMinutes(new Date(nextAppt.scheduled_at), new Date());
  if (mins <= 60) return "ring-red-400 animate-pulse";
  return "ring-emerald-400";
};

const getContextualSubtitle = (upcoming: any[], stats: any) => {
  if ((upcoming?.length ?? 0) > 0) return "Você tem consultas agendadas";
  return "Tudo em dia por aqui ✓";
};

const getServiceTypeFromParam = (searchParams: URLSearchParams): ServiceType | null => {
  const service = searchParams.get("service")?.toLowerCase();
  return service === "telemedicina" ? service as ServiceType : null;
};

const SERVICE_SECTIONS = {
  telemedicina: { kpis: true, nextAppt: true, quickActions: true, healthTip: true, returnAppts: true, pendingAppt: true },
  all: { kpis: true, nextAppt: true, quickActions: true, healthTip: true, returnAppts: true, pendingAppt: true },
};

/* ── Main Component ── */
const PatientDashboard = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const forceOnboarding = searchParams.get("onboarding") === "true";
  const { data: detectedService, isLoading: detectingService } = useDetectPatientService();
  const serviceType = getServiceTypeFromParam(searchParams) || detectedService || "all";
  const sections = SERVICE_SECTIONS[serviceType as keyof typeof SERVICE_SECTIONS] || SERVICE_SECTIONS.all;
  
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingDone] = useLocalStorage<boolean>(ONBOARDING_KEY, false);
  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = usePatientStats();
  const { data: upcoming = [], isLoading: upcomingLoading, isError: upcomingError } = usePatientUpcoming();
  const { data: returnAppts = [] } = useReturnAppointments();
  const { data: healthMetrics = [] } = useRecentHealthMetrics();
  const { data: timelineEvents = [], isLoading: timelineLoading } = useHealthTimeline(3);
  const loading = statsLoading || upcomingLoading || detectingService;
  const waitingAppt = upcoming.find((a: any) => a.status === "waiting" || a.status === "in_progress") ?? null;
  const nextAppt = upcoming[0];
  const minutesUntilNext = nextAppt ? differenceInMinutes(new Date(nextAppt.scheduled_at), new Date()) : null;
  const todayTip = HEALTH_TIPS[new Date().getDay() % HEALTH_TIPS.length];
  const firstName = profile?.first_name || "Paciente";
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullStartY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["patient-upcoming-enriched"] });
    await queryClient.invalidateQueries({ queryKey: ["patient-dashboard-stats"] });
    await queryClient.invalidateQueries({ queryKey: ["patient-return-appts"] });
    await queryClient.invalidateQueries({ queryKey: ["patient-recent-metrics"] });
    setTimeout(() => setIsRefreshing(false), 600);
  }, [queryClient]);

  // Realtime: revalida o painel quando appointments do paciente mudam
  useEffect(() => {
    if (!user?.id) return;
    let pending: ReturnType<typeof setTimeout> | null = null;
    const ch = db
      .channel(`patient-dashboard-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `patient_id=eq.${user.id}` }, () => {
        if (pending) clearTimeout(pending);
        pending = setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["patient-upcoming-enriched"] });
          queryClient.invalidateQueries({ queryKey: ["patient-dashboard-stats"] });
          queryClient.invalidateQueries({ queryKey: ["patient-return-appts"] });
        }, 250);
      })
      .subscribe();
    return () => { if (pending) clearTimeout(pending); db.removeChannel(ch); };
  }, [user?.id, queryClient]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onTouchStart = (e: TouchEvent) => { if (el.scrollTop <= 0) pullStartY.current = e.touches[0].clientY; };
    const onTouchMove = (e: TouchEvent) => {
      if (pullStartY.current === 0) return;
      const delta = e.touches[0].clientY - pullStartY.current;
      if (delta > 60 && el.scrollTop <= 0) setIsPulling(true);
    };
    const onTouchEnd = () => { if (isPulling) { handleRefresh(); setIsPulling(false); } pullStartY.current = 0; };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => { el.removeEventListener("touchstart", onTouchStart); el.removeEventListener("touchmove", onTouchMove); el.removeEventListener("touchend", onTouchEnd); };
  }, [isPulling, handleRefresh]);

   useEffect(() => {
     if (loading) return;
 
     // Check metadata first (more reliable cross-device)
     const hasCompletedOnboardingMetadata = user?.user_metadata?.onboarding_completed === true;
     
     // Consider profile incomplete if essential fields are missing
     const profileIncomplete = !profile?.cpf || !profile?.phone || !profile?.date_of_birth;
 
     // Priority 1: Force via URL (signup redirect)
     if (forceOnboarding) {
       setShowOnboarding(true);
       return;
     }
 
     // Priority 2: If it's the first login after signup (checked via param)
     // or if they have absolutely no profile data and haven't dismissed onboarding yet
     if (!hasCompletedOnboardingMetadata && !onboardingDone) {
       const isVeryNewUser = profile?.created_at ? (Date.now() - new Date(profile.created_at).getTime() < 3600000) : true;
       
       if (isVeryNewUser && profileIncomplete) {
         setShowOnboarding(true);
       }
     }
   }, [loading, stats?.total, onboardingDone, forceOnboarding, profile, user]);

  if (loading) return (
    <DashboardLayout title="Perfil do Paciente" nav={getPatientNav("home", t)} role="patient">
      <div className="space-y-6 max-w-7xl mx-auto" aria-busy="true" aria-label="Carregando seu painel">
        {/* Hero */}
        <Skeleton className="h-56 md:h-64 rounded-[2rem]" />
        {/* Ações rápidas */}
        <div>
          <Skeleton className="h-4 w-32 mb-3 rounded" />
          <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-4">
            {[0,1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        </div>
        {/* Próxima consulta + KPIs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-56 rounded-2xl" />
          </div>
          <div className="lg:col-span-4 space-y-4">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="Perfil do Paciente" nav={getPatientNav("home", t)} role="patient">
      {showOnboarding && <PatientOnboarding onComplete={() => setShowOnboarding(false)} />}
      {!showOnboarding && <FirstConsultationTour />}
      <div ref={scrollRef} className="space-y-6 pb-24 md:pb-12 max-w-7xl mx-auto">
        <ImminentConsultationBar
          appt={waitingAppt ?? nextAppt}
          role="patient"
        />
        <PatientHomeModern
          firstName={firstName}
          stats={stats}
          nextAppt={nextAppt}
          timelineEvents={timelineEvents}
          navigate={navigate}
        />
      </div>
    </DashboardLayout>
  );
};

const PatientHomeModern = ({ firstName, stats, nextAppt, timelineEvents, navigate }: any) => {
  const scheduledAt = nextAppt ? new Date(nextAppt.scheduled_at) : null;
  const activities = (timelineEvents ?? []).slice(0, 3);
  const PAID_STATUSES = ["approved", "confirmed", "received", "paid"];
  const paymentApproved = nextAppt ? PAID_STATUSES.includes(String(nextAppt.payment_status ?? "").toLowerCase()) : false;
  const actionCards = [
    { label: "Agendar", sub: "Consulta", icon: CalendarCheck, path: "/dashboard/schedule?role=patient", tone: "from-blue-500 to-cyan-500", soft: "bg-blue-500/10 text-blue-600" },
    { label: "Urgência", sub: "Agora", icon: Lightning, path: "/dashboard/urgent-care?role=patient", tone: "from-rose-500 to-orange-500", soft: "bg-rose-500/10 text-rose-600" },
    { label: "Receitas", sub: "Histórico", icon: FileText, path: "/dashboard/history?role=patient", tone: "from-teal-500 to-emerald-500", soft: "bg-teal-500/10 text-teal-600" },
    { label: "Exames", sub: "Documentos", icon: Pill, path: "/dashboard/patient/documents?role=patient", tone: "from-violet-500 to-indigo-500", soft: "bg-violet-500/10 text-violet-600" },
  ];
  const healthItems = [
    { label: "Consultas", value: stats?.total ?? 0, icon: CalendarCheck, color: "text-blue-600", bg: "bg-blue-500/10" },
    { label: "Receitas", value: stats?.prescriptions ?? 0, icon: FileText, color: "text-teal-600", bg: "bg-teal-500/10" },
    { label: "Exames", value: stats?.documents ?? 0, icon: Pill, color: "text-indigo-600", bg: "bg-indigo-500/10" },
  ];

  return (
    <div className="mx-auto w-full max-w-[1080px] space-y-4 md:space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[32px] border border-white/50 bg-[linear-gradient(135deg,#eef7ff_0%,#ffffff_45%,#e9fbff_100%)] p-4 shadow-[0_24px_70px_-42px_rgba(15,42,90,.55)] md:p-7"
      >
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-10 h-40 w-40 rounded-full bg-teal-300/18 blur-3xl" />
        <div className="relative grid gap-5 md:grid-cols-[1fr_310px] md:items-center">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/15 bg-white/70 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-blue-700 shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              Dados seguros
            </div>
            <h1 className="font-[Manrope] text-[28px] font-black leading-tight tracking-tight text-slate-950 md:text-[42px]">
              Olá, {firstName}
            </h1>
            <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-slate-600 md:text-base">
              Seu cuidado em um app simples, rápido e organizado para consultas, receitas e exames.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {actionCards.map((item, index) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + index * 0.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(item.path)}
                  className="group rounded-[22px] border border-white bg-white p-3 text-left shadow-[0_14px_34px_-28px_rgba(15,42,90,.65)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-28px_rgba(15,42,90,.75)]"
                >
                  <div className={cn("mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition group-hover:scale-105", item.tone)}>
                    <item.icon size={22} weight="bold" />
                  </div>
                  <p className="text-sm font-black text-slate-950">{item.label}</p>
                  <p className="mt-0.5 text-[11px] font-bold text-slate-500">{item.sub}</p>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="relative min-h-[176px] overflow-hidden rounded-[28px] border border-white/70 bg-white/86 p-4 shadow-[0_18px_48px_-34px_rgba(15,42,90,.8)] backdrop-blur">
            <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Assistente Pingo</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">Como posso ajudar?</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">Atendimento, exames e orientação sempre à mão.</p>
              </div>
              <PingoMascot variant="wave" size={82} animate bounce className="shrink-0 drop-shadow-[0_16px_28px_rgba(15,42,90,.18)]" />
            </div>
            <Button
              onClick={() => navigate("/dashboard/chat?role=patient")}
              className="relative mt-4 h-11 w-full rounded-2xl font-black"
            >
              Falar com suporte
              <ArrowRight size={16} weight="bold" />
            </Button>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_.95fr]">
        <section className="rounded-[28px] border border-border/55 bg-card p-4 shadow-sm md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">Próxima consulta</p>
              <h2 className="mt-1 text-lg font-black text-foreground">{nextAppt ? "Consulta agendada" : "Agenda livre"}</h2>
            </div>
            <span className={cn(
              "rounded-full px-3 py-1 text-[11px] font-black",
              !nextAppt
                ? "bg-blue-500/10 text-blue-700"
                : paymentApproved
                  ? "bg-emerald-500/10 text-emerald-700"
                  : "bg-amber-500/10 text-amber-700"
            )}>
              {!nextAppt ? "Disponível" : paymentApproved ? "Confirmada" : "Aguardando pagamento"}
            </span>
          </div>
          <div className="flex gap-4 rounded-[24px] bg-muted/25 p-3">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/15">
              <VideoCamera size={30} weight="fill" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-black text-foreground">{nextAppt?.doctor_name ?? "Nenhuma consulta marcada"}</p>
              <p className="text-sm font-medium text-muted-foreground">{nextAppt ? (nextAppt.specialty ?? "Atendimento médico") : "Escolha um médico para começar"}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black">
                <span className="rounded-full bg-background px-2.5 py-1 text-primary">{scheduledAt ? format(scheduledAt, "dd MMM", { locale: ptBR }) : "Sem data"}</span>
                <span className="rounded-full bg-background px-2.5 py-1 text-primary">{scheduledAt ? format(scheduledAt, "HH:mm") : "--:--"}</span>
                <span className={cn(
                  "rounded-full px-2.5 py-1",
                  nextAppt && !paymentApproved ? "bg-amber-500/10 text-amber-700" : "bg-emerald-500/10 text-emerald-700"
                )}>
                  {nextAppt && !paymentApproved ? "Aguardando pagamento" : "Online"}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => navigate("/dashboard/appointments?role=patient")} className="h-11 rounded-2xl font-black">
              Detalhes
            </Button>
            <Button onClick={() => navigate(nextAppt ? `/dashboard/consultation/${nextAppt.id}` : "/dashboard/schedule?role=patient")} className="h-11 rounded-2xl font-black">
              {nextAppt ? "Entrar" : "Agendar"}
            </Button>
          </div>
        </section>

        <section className="rounded-[28px] border border-border/55 bg-card p-4 shadow-sm md:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">Resumo</p>
              <h2 className="mt-1 text-lg font-black text-foreground">Sua saúde</h2>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-500/10 text-orange-500">
              <Heartbeat size={25} weight="fill" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {healthItems.map((item) => (
              <div key={item.label} className="rounded-2xl border border-border/40 bg-background p-3">
                <div className={cn("mb-3 grid h-9 w-9 place-items-center rounded-xl", item.bg, item.color)}>
                  <item.icon size={19} weight="bold" />
                </div>
                <p className={cn("text-2xl font-black leading-none", item.color)}>{item.value}</p>
                <p className="mt-1 text-[11px] font-bold text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-[28px] border border-border/55 bg-card p-4 shadow-sm md:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-black text-foreground">Atividade recente</h2>
          <button onClick={() => navigate("/dashboard/history?role=patient")} className="flex items-center gap-1 text-xs font-black text-primary">
            Ver histórico <ArrowRight size={13} weight="bold" />
          </button>
        </div>
        <div className="grid gap-2">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border/50 bg-background/60 px-4 py-8 text-center">
              <p className="text-sm font-black text-foreground">Nenhuma atividade ainda</p>
              <p className="text-xs text-muted-foreground">Suas consultas, receitas e exames aparecerão aqui.</p>
            </div>
          ) : (
            activities.map((item: any, index: number) => {
              const Icon = item.icon ?? (index === 0 ? FileText : Pill);
              return (
                <button key={item.id ?? item.title ?? index} onClick={() => navigate("/dashboard/history?role=patient")} className="group flex w-full items-center gap-3 rounded-2xl border border-border/40 bg-background p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 transition group-hover:scale-105">
                    <Icon size={20} weight="bold" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-foreground">{item.title ?? item.type ?? "Atividade"}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.subtitle ?? item.description ?? "Atualização recente"}</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black text-emerald-700">{item.status ?? "Ativa"}</span>
                </button>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};

const PatientHomeReference = ({ firstName, stats, nextAppt, timelineEvents, navigate }: any) => {
  const scheduledAt = nextAppt ? new Date(nextAppt.scheduled_at) : null;
  const activities = (timelineEvents ?? []).slice(0, 2);
  const actionCards = [
    { label: "Agendar", sub: "Consulta", icon: CalendarCheck, path: "/dashboard/schedule?role=patient", color: "text-blue-600", bg: "bg-blue-500/10" },
    { label: "Urgência", sub: "Atendimento", icon: Lightning, path: "/dashboard/urgent-care?role=patient", color: "text-red-500", bg: "bg-red-500/10" },
    { label: "Receitas", sub: "Ver todas", icon: FileText, path: "/dashboard/history?role=patient", color: "text-teal-600", bg: "bg-teal-500/10" },
    { label: "Exames", sub: "Meus exames", icon: Pill, path: "/dashboard/patient/documents?role=patient", color: "text-indigo-600", bg: "bg-indigo-500/10" },
  ];

  const summary = [
    { label: "Consultas", sub: "realizadas", value: stats?.total ?? 0, icon: ShieldCheck, color: "text-blue-600" },
    { label: "Receitas", sub: "emitidas", value: stats?.prescriptions ?? 0, icon: FileText, color: "text-teal-600" },
    { label: "Exames", sub: "realizados", value: stats?.documents ?? 0, icon: Pill, color: "text-indigo-600" },
    { label: "Bem-estar", sub: "geral", value: "92%", icon: Heartbeat, color: "text-orange-500" },
  ];

  return (
    <div className="mx-auto w-full max-w-[430px] space-y-5 md:max-w-3xl">
      <section className="relative min-h-[118px] overflow-hidden rounded-b-[34px] px-3 pb-4 pt-2 md:rounded-[34px] md:bg-gradient-to-br md:from-blue-50 md:via-white md:to-cyan-50 md:px-6 md:pt-5">
        <div className="relative z-10 max-w-[260px]">
          <p className="font-[Manrope] text-[22px] font-extrabold tracking-tight text-foreground">
            Olá, {firstName} <span className="text-amber-500">👋</span>
          </p>
          <p className="mt-1 text-sm font-medium text-muted-foreground">Como está se sentindo hoje?</p>
        </div>
        <div className="absolute -right-2 -top-1 flex h-32 w-32 items-center justify-center rounded-full bg-blue-100/70 md:right-5 md:top-3">
          <PingoMascot variant="welcome" size={112} animate />
          <span className="absolute right-5 top-4 h-4 w-4 rounded-full border-2 border-white bg-emerald-400" />
        </div>
      </section>

      <section className="rounded-[24px] border border-border/55 bg-card p-4 shadow-[0_10px_28px_-18px_rgba(15,42,90,0.55)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-foreground">Próxima consulta</h2>
          {nextAppt && (
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700">Confirmada</span>
          )}
        </div>
        <div className="flex gap-3">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-blue-500/10 text-blue-600">
            <CalendarCheck size={32} weight="bold" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold text-foreground">{nextAppt?.doctor_name ?? "Nenhuma consulta marcada"}</p>
            <p className="text-xs font-medium text-muted-foreground">{nextAppt?.specialty ?? "Escolha um médico para começar"}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-bold text-primary">
              <span>{scheduledAt ? format(scheduledAt, "dd MMM yyyy", { locale: ptBR }) : "Sem data"}</span>
              <span>{scheduledAt ? format(scheduledAt, "HH:mm") : "--:--"}</span>
              <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-emerald-700">Online</span>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/50 pt-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard/appointments?role=patient")} className="h-11 rounded-2xl font-bold text-primary">
            Ver detalhes
          </Button>
          <Button onClick={() => navigate(nextAppt ? `/dashboard/consultation/${nextAppt.id}` : "/dashboard/schedule?role=patient")} className="h-11 rounded-2xl font-bold">
            <VideoCamera size={16} weight="fill" />
            {nextAppt ? "Entrar" : "Agendar"}
          </Button>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-foreground">O que você precisa?</h2>
          <button onClick={() => navigate("/dashboard/schedule?role=patient")} className="flex items-center gap-1 text-xs font-bold text-primary">
            Ver todos <ArrowRight size={13} weight="bold" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {actionCards.map((item) => (
            <button key={item.label} onClick={() => navigate(item.path)} className="rounded-2xl border border-border/55 bg-card p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className={cn("mx-auto mb-2 grid h-11 w-11 place-items-center rounded-2xl", item.bg, item.color)}>
                <item.icon size={22} weight="fill" />
              </div>
              <p className="text-[11px] font-extrabold leading-tight text-foreground">{item.label}</p>
              <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">{item.sub}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[22px] border border-border/55 bg-card p-4 shadow-sm">
        <h2 className="mb-4 text-sm font-extrabold text-foreground">Resumo da sua saúde</h2>
        <div className="grid grid-cols-4 divide-x divide-border/60">
          {summary.map((item) => (
            <div key={item.label} className="px-2 text-center first:pl-0 last:pr-0">
              <item.icon className={cn("mx-auto mb-2 h-6 w-6", item.color)} />
              <p className={cn("text-xl font-black leading-none", item.color)}>{item.value}</p>
              <p className="mt-1 text-[10px] font-bold leading-tight text-muted-foreground">{item.label}</p>
              <p className="text-[10px] leading-tight text-muted-foreground">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-foreground">Atividade recente</h2>
          <button onClick={() => navigate("/dashboard/history?role=patient")} className="flex items-center gap-1 text-xs font-bold text-primary">
            Ver histórico <ArrowRight size={13} weight="bold" />
          </button>
        </div>
        <div className="overflow-hidden rounded-[22px] border border-border/55 bg-card shadow-sm">
          {(activities.length ? activities : [
            { title: "Receita emitida", subtitle: "Seu histórico ficará disponível aqui", status: "Ativa", icon: FileText },
            { title: "Exame de sangue", subtitle: "Documentos recentes aparecem nesta área", status: "Concluído", icon: Pill },
          ]).map((item: any, index: number) => {
            const Icon = item.icon ?? (index === 0 ? FileText : Pill);
            return (
              <button key={item.id ?? item.title ?? index} onClick={() => navigate("/dashboard/history?role=patient")} className="flex w-full items-center gap-3 border-b border-border/50 p-3 text-left last:border-b-0">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                  <Icon size={20} weight="fill" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-extrabold text-foreground">{item.title ?? item.type ?? "Atividade"}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{item.subtitle ?? item.description ?? "Atualização recente"}</p>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-700">{item.status ?? "Ativa"}</span>
                <ArrowRight size={16} weight="bold" className="text-muted-foreground/50" />
              </button>
            );
          })}
        </div>
      </section>

      <button onClick={() => navigate("/dashboard/chat?role=patient")} className="flex w-full items-center gap-3 rounded-[22px] border border-blue-500/10 bg-blue-500/8 p-4 text-left shadow-sm">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
          <Headset size={24} weight="fill" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-primary">Precisa de ajuda?</p>
          <p className="text-xs text-muted-foreground">Fale com nossa equipe de suporte</p>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-background text-primary">
          <ArrowRight size={16} weight="bold" />
        </div>
      </button>
    </div>
  );
};

const PatientHomeCommandCenter = ({ firstName, stats, nextAppt, upcoming, minutesUntilNext, navigate }: any) => {
  const consultationSoon = nextAppt && minutesUntilNext !== null && minutesUntilNext <= 60;
  const scheduledAt = nextAppt ? new Date(nextAppt.scheduled_at) : null;
  const statusLabel = upcoming?.length ? "Consulta programada" : "Agenda livre";
  const actionItems = [
    {
      label: "Agendar",
      desc: "Buscar médico",
      icon: CalendarCheck,
      path: "/dashboard/schedule?role=patient",
      className: "bg-primary text-primary-foreground border-primary/20",
      iconClass: "bg-white/16 text-white",
    },
    {
      label: "Urgência",
      desc: "Atendimento agora",
      icon: Lightning,
      path: "/dashboard/urgent-care?role=patient",
      className: "bg-red-500/8 text-foreground border-red-500/16",
      iconClass: "bg-red-500/12 text-red-600",
    },
    {
      label: "Receitas",
      desc: "Histórico",
      icon: FileText,
      path: "/dashboard/history?role=patient",
      className: "bg-card text-foreground border-border/55",
      iconClass: "bg-emerald-500/12 text-emerald-600",
    },
    {
      label: "Exames",
      desc: "Documentos",
      icon: ClipboardText,
      path: "/dashboard/patient/documents?role=patient",
      className: "bg-card text-foreground border-border/55",
      iconClass: "bg-sky-500/12 text-sky-600",
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[28px] border border-border/55 bg-card p-4 shadow-sm sm:p-5"
    >
      <div className="grid gap-4 xl:grid-cols-[1fr_270px]">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold text-muted-foreground">{getGreeting()}, {firstName}</p>
              <h1 className="mt-1 font-[Manrope] text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Início
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Dados seguros
              </span>
              <span className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em]",
                consultationSoon
                  ? "border-red-500/20 bg-red-500/10 text-red-600"
                  : "border-primary/15 bg-primary/8 text-primary"
              )}>
                <span className={cn("h-2 w-2 rounded-full", consultationSoon ? "animate-pulse bg-red-500" : "bg-primary")} />
                {statusLabel}
              </span>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-3xl border border-border/55 bg-muted/18 p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">Próxima consulta</p>
                  <h2 className="mt-1 font-[Manrope] text-xl font-extrabold text-foreground">
                    {nextAppt ? nextAppt.doctor_name : "Nenhuma consulta marcada"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {nextAppt
                      ? `${nextAppt.specialty || "Atendimento médico"} · ${format(scheduledAt!, "dd/MM 'às' HH:mm")}`
                      : "Agende em poucos passos ou entre no atendimento imediato."}
                  </p>
                </div>
                <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl", consultationSoon ? "bg-red-500/12 text-red-600" : "bg-primary/10 text-primary")}>
                  <VideoCamera size={22} weight="fill" />
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={() => navigate(nextAppt ? "/dashboard/appointments?role=patient" : "/dashboard/schedule?role=patient")}
                  className="h-11 rounded-2xl font-extrabold"
                >
                  {nextAppt ? "Ver consulta" : "Agendar consulta"}
                  <ArrowRight size={16} weight="bold" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/dashboard/urgent-care?role=patient")}
                  className="h-11 rounded-2xl font-extrabold"
                >
                  Atendimento agora
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: "Consultas", value: stats?.total ?? 0, icon: CalendarCheck },
                { label: "Receitas", value: stats?.prescriptions ?? 0, icon: FileText },
                { label: "Exames", value: stats?.documents ?? 0, icon: ClipboardText },
                { label: "Próximo", value: nextAppt ? format(scheduledAt!, "HH:mm") : "Livre", icon: Clock },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-border/50 bg-background p-3">
                  <item.icon size={18} weight="fill" className="mb-2 text-primary" />
                  <p className="text-xl font-black leading-none text-foreground">{item.value}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
            {actionItems.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={cn("group rounded-2xl border p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md", item.className)}
              >
                <div className={cn("mb-3 grid h-10 w-10 place-items-center rounded-2xl", item.iconClass)}>
                  <item.icon size={20} weight="fill" />
                </div>
                <p className="text-sm font-extrabold">{item.label}</p>
                <p className={cn("mt-1 text-xs leading-5", item.className.includes("bg-primary") ? "text-primary-foreground/75" : "text-muted-foreground")}>{item.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="hidden xl:block">
          <div className="relative h-full min-h-[300px] overflow-hidden rounded-[24px] border border-border/50 bg-muted/20">
            <img src={patientHomeHero} alt="" className="h-full w-full object-cover object-[69%_center]" aria-hidden="true" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/72 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 rounded-2xl border border-white/60 bg-white/78 p-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/72">
              <div className="flex items-center gap-3">
                <PingoMascot variant="wave" size={42} animate />
                <div>
                  <p className="text-sm font-extrabold text-foreground">Tudo em um painel</p>
                  <p className="text-xs text-muted-foreground">{getContextualSubtitle(upcoming, stats)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

const PatientHomeHero = ({ firstName, stats, nextAppt, upcoming, minutesUntilNext, navigate }: any) => {
  const consultationSoon = nextAppt && minutesUntilNext !== null && minutesUntilNext <= 60;
  const statusText = upcoming?.length ? "Consulta programada" : "Pronto para agendar";

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative -mx-4 -mt-5 overflow-hidden rounded-b-[34px] border border-border/50 bg-card shadow-[0_18px_55px_-28px_rgba(15,42,90,0.5)] md:-mx-6 md:-mt-5 md:rounded-[2rem] lg:-mx-8 lg:-mt-6"
    >
      <div className="absolute inset-0">
        <img
          src={patientHomeHero}
          alt=""
          className="h-full w-full object-cover object-center"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/35 dark:from-slate-950 dark:via-slate-950/88 dark:to-slate-950/35" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="relative grid min-h-[360px] gap-6 px-5 py-7 sm:px-7 md:grid-cols-[1.08fr_0.92fr] md:px-8 md:py-9">
        <div className="flex max-w-2xl flex-col justify-between gap-7">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                Cuidado verificado
              </span>
              <span className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em]",
                consultationSoon
                  ? "border-red-500/20 bg-red-500/10 text-red-600"
                  : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
              )}>
                <span className={cn("h-2 w-2 rounded-full", consultationSoon ? "animate-pulse bg-red-500" : "bg-emerald-500")} />
                {statusText}
              </span>
            </div>

            <p className="mb-2 text-sm font-bold text-muted-foreground">{getGreeting()}, {firstName}</p>
            <h1 className="font-[Manrope] text-3xl font-extrabold leading-[1.04] tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Sua saúde organizada em uma experiência simples.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              Agende consultas, acompanhe receitas, exames e histórico médico com segurança e atendimento online quando precisar.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={() => navigate("/dashboard/schedule?role=patient")}
              className="h-12 rounded-2xl px-6 font-extrabold shadow-lg shadow-primary/20 transition hover:-translate-y-0.5"
            >
              Agendar consulta
              <ArrowRight size={17} weight="bold" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard/urgent-care?role=patient")}
              className="h-12 rounded-2xl border-border/70 bg-background/70 px-6 font-extrabold backdrop-blur transition hover:-translate-y-0.5"
            >
              Atendimento agora
            </Button>
          </div>
        </div>

        <div className="flex items-end justify-stretch md:justify-end">
          <div className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white/72 p-4 shadow-[0_22px_70px_-36px_rgba(15,42,90,0.65)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/65">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">Painel de hoje</p>
                <p className="mt-1 text-sm font-bold text-foreground">{getContextualSubtitle(upcoming, stats)}</p>
              </div>
              <PingoMascot variant="wave" size={58} animate />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: "Consultas", value: stats?.total ?? 0, icon: CalendarCheck },
                { label: "Receitas", value: stats?.prescriptions ?? 0, icon: FileText },
                { label: "Exames", value: stats?.documents ?? 0, icon: ClipboardText },
                { label: "Próximo", value: nextAppt ? format(new Date(nextAppt.scheduled_at), "HH:mm") : "Livre", icon: Clock },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-border/45 bg-background/70 p-3">
                  <item.icon size={18} weight="fill" className="mb-2 text-primary" />
                  <p className="text-xl font-black leading-none text-foreground">{item.value}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

const HeroSection = ({ firstName, nextAppt, upcoming, stats, getGreeting, getAvatarRingColor, getContextualSubtitle, profile }: any) => (
  <section className={cn("patient-hero relative -mx-4 -mt-5 overflow-hidden rounded-b-[32px] md:-mx-6 md:-mt-5 md:rounded-[2rem] lg:-mx-8 lg:-mt-6 bg-gradient-to-br from-white via-[hsl(210_60%_97%)] to-[hsl(210_70%_94%)] border border-[hsl(215_30%_90%)]/60 dark:border-white/5 dark:bg-[radial-gradient(ellipse_at_top_right,hsl(215_70%_18%)_0%,hsl(220_30%_8%)_55%,hsl(220_25%_6%)_100%)]")} style={{ boxShadow: "0 12px 40px -12px rgba(15, 42, 90, 0.18), inset 0 1px 0 rgba(255,255,255,0.6)" }}>
    <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-[hsl(215_85%_60%)]/10 blur-[80px] hidden md:block dark:bg-[hsl(215_85%_55%)]/20" />
    <div className="pointer-events-none absolute -left-8 bottom-4 h-48 w-48 rounded-full bg-[hsl(168_60%_55%)]/10 blur-[60px] hidden md:block dark:bg-[hsl(215_85%_55%)]/15" />
    <div className="relative z-10 px-5 pt-8 pb-7 md:px-8 md:pt-12 md:pb-9 flex flex-col md:flex-row items-center md:items-start gap-4">
      <div className={cn("ring-[3px] ring-offset-2 ring-offset-transparent rounded-full", getAvatarRingColor(nextAppt))}>
        <LazyAvatar src={profile?.avatar_url} name={firstName} className="h-16 w-16 md:h-[72px] md:w-[72px] border-2 border-[hsl(215_30%_90%)] dark:border-white/20" fallbackClassName="bg-[hsl(215_80%_28%)]/10 text-[hsl(215_80%_28%)] dark:bg-white/15 dark:text-white" />
      </div>
      <div className="flex-1 min-w-0 text-center md:text-left">
        <h1 className="font-[Manrope] text-[26px] font-extrabold leading-[1.1] tracking-tight md:text-[38px] text-[hsl(215_80%_18%)] dark:text-white">
          <span className="block text-[11px] md:text-[13px] font-bold uppercase tracking-[0.18em] text-[hsl(215_85%_45%)] dark:text-[hsl(215_90%_70%)] mb-2">{getGreeting()}, {firstName}! 👋</span>
          Sua saúde em um só lugar
        </h1>
        <p className="mt-2 text-[13px] font-medium leading-relaxed md:text-[15px] text-[hsl(215_30%_35%)] dark:text-white/70">{getContextualSubtitle(upcoming, stats)}</p>
      </div>
      <div className="shrink-0 -mt-2 hidden sm:block"><PingoMascot variant="wave" size={120} animate bounce className="drop-shadow-[0_12px_32px_rgba(15,42,90,0.18)] dark:drop-shadow-[0_12px_32px_rgba(0,0,0,0.45)] sm:!w-[130px] sm:!h-[130px]" /></div>
    </div>
    {/* Trust strip */}
    <div className="relative z-10 px-5 pb-5 md:px-8 md:pb-6">
      <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-[11px] font-semibold text-[hsl(215_50%_30%)] dark:text-white/70">
        <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> CFM verificado</span>
        <span className="hidden sm:inline opacity-30">·</span>
        <span className="inline-flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-emerald-500" /> Dados criptografados</span>
        <span className="hidden sm:inline opacity-30">·</span>
        <span className="inline-flex items-center gap-1.5"><Sparkle weight="fill" className="w-3.5 h-3.5 text-amber-500" /> 4.9 ★ avaliação</span>
      </div>
    </div>
  </section>
);

const QUICK_SPECIALTIES = [
  { label: "Clínico Geral", icon: Stethoscope, query: "Clínico" },
  { label: "Pediatria", icon: Heart, query: "Pediatria" },
  { label: "Saúde Mental", icon: Sparkle, query: "Psiquiatria" },
  { label: "Dermatologia", icon: Heart, query: "Dermatologia" },
];

const DoctorSearchHero = ({ navigate, hasNextAppt }: { navigate: any; hasNextAppt: boolean }) => {
  const [term, setTerm] = useState("");
  const submit = (q?: string) => {
    const value = (q ?? term).trim();
    const path = value
      ? `/dashboard/schedule?role=patient&q=${encodeURIComponent(value)}`
      : "/dashboard/schedule?role=patient";
    navigate(path);
  };
  return (
    <motion.section
      data-tour="search"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
              className="app-card rounded-[30px] border-primary/15 bg-gradient-to-br from-primary/[0.07] via-card to-card p-5 md:p-6"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="hidden sm:flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 shrink-0">
          <MagnifyingGlass size={22} weight="fill" className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base md:text-lg font-bold text-foreground leading-tight">
            {hasNextAppt ? "Precisa de outro especialista?" : "Encontre um médico em segundos"}
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Mais de 100 especialistas verificados pelo CFM. Atendimento em até 15 min.
          </p>
        </div>
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); submit(); }}
        className="flex flex-col sm:flex-row gap-2"
      >
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Especialidade, sintoma ou nome do médico"
            className="h-12 pl-11 rounded-2xl bg-card/90 border-border/50 text-sm md:text-base shadow-inner transition-all focus-visible:ring-primary/25"
            aria-label="Buscar médico ou especialidade"
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className="h-12 rounded-2xl px-6 font-bold shadow-sm gap-1.5 transition-all hover:-translate-y-0.5"
        >
          Buscar <ArrowRight size={16} weight="bold" />
        </Button>
      </form>
      <div className="flex items-center gap-1.5 flex-wrap mt-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 mr-1">Rápido:</span>
        {QUICK_SPECIALTIES.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => submit(s.query)}
            className="h-8 px-3 rounded-full text-[12px] font-semibold bg-muted/60 hover:bg-primary/10 hover:text-primary transition-all text-muted-foreground hover:-translate-y-0.5"
          >
            {s.label}
          </button>
        ))}
      </div>
    </motion.section>
  );
};

const UrgentAlerts = ({ nextAppt, minutesUntilNext, waitingAppt, sections, navigate }: any) => (
  <div className="space-y-4">
    <AnimatePresence>
      {nextAppt && minutesUntilNext !== null && minutesUntilNext > 0 && minutesUntilNext <= 60 && (
        <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} className="rounded-2xl bg-emerald-500 text-white p-4 flex items-center gap-3 shadow-lg">
          <div className="animate-pulse w-3 h-3 rounded-full bg-white shrink-0" />
          <div className="flex-1 min-w-0"><p className="font-bold text-[14px]">Sua consulta começa em breve!</p><p className="text-[12px] opacity-90">{nextAppt.doctor_name} · às {format(new Date(nextAppt.scheduled_at), "HH:mm")}</p></div>
          <Button size="sm" onClick={() => navigate(`/dashboard/consultation/${nextAppt.id}`)} className="shrink-0 rounded-full bg-white text-emerald-700 font-bold text-[12px] hover:bg-white/90">Entrar</Button>
        </motion.div>
      )}
    </AnimatePresence>
    {sections.pendingAppt && waitingAppt && <SectionErrorBoundary fallbackTitle="Erro na sala de espera"><PatientWaitingCard appointment={waitingAppt} /></SectionErrorBoundary>}
  </div>
);

const ReturnAppointments = ({ items, navigate }: any) => (
  <div className="app-card overflow-hidden rounded-[26px] border-warning/15 bg-warning/[0.04] p-4">
    <div className="mb-3 flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-xl bg-warning/12"><Gift size={14} weight="fill" className="text-warning" /></div><p className="text-[11px] font-bold text-warning uppercase tracking-wide">Retorno Grátis</p></div>
    {items.map((ra: any) => (
      <div key={ra.id} className="card-interactive mb-2 flex items-center justify-between rounded-xl border border-border/10 bg-card p-3 last:mb-0 shadow-sm">
        <div className="flex items-center gap-3"><LazyAvatar name={ra.doctor_name} className="h-9 w-9" fallbackClassName="bg-warning/10 text-warning text-xs" />
          <div className="text-xs"><p className="font-semibold text-foreground">{ra.doctor_name}</p><p className="mt-0.5 text-muted-foreground">Válido até {format(new Date(ra.return_deadline), "dd/MM")}</p></div>
        </div>
        <Button size="sm" className="h-8 rounded-full bg-warning text-warning-foreground hover:bg-warning/90 text-[11px] font-bold" onClick={() => navigate(`/dashboard/schedule/${ra.doctor_id}?return=true&original=${ra.id}`)}>Agendar</Button>
      </div>
    ))}
  </div>
);

const NextAppointmentCard = ({ appt, navigate }: any) => {
  const scheduledAt = new Date(appt.scheduled_at);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="app-card rounded-[32px] p-6 flex flex-col md:flex-row items-center gap-6 relative group overflow-hidden">
      <div aria-hidden="true" className="absolute top-0 right-0 p-4 opacity-30 group-hover:opacity-100 transition-opacity pointer-events-none"><DotsThreeVertical size={24} className="text-muted-foreground" /></div>
      <div className="flex items-center gap-5 w-full md:w-auto">
        <div className="relative"><LazyAvatar src={appt.doctor_avatar} name={appt.doctor_name} className="h-20 w-20 rounded-full border-4 border-white dark:border-muted shadow-lg" /><div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-2 border-white dark:border-muted flex items-center justify-center"><VideoCamera size={12} weight="fill" className="text-white" /></div></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1"><span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-0.5 rounded-full">Consulta Presencial</span></div>
          <h4 className="text-xl font-bold text-foreground truncate">{appt.doctor_name}</h4><p className="text-sm text-muted-foreground">{appt.specialty || "Clínico Geral"}</p><p className="text-[11px] text-muted-foreground mt-1">Clínica AloClínica – Unidade Centro</p>
        </div>
      </div>
      <div className="hidden md:block h-16 w-px bg-border/40 mx-2" />
      <div className="flex flex-row md:flex-col items-center md:items-start justify-between md:justify-center gap-1 w-full md:w-32 bg-muted/30 md:bg-transparent p-4 md:p-0 rounded-2xl">
        <div className="flex items-baseline gap-1"><span className="text-3xl font-black text-foreground">{format(scheduledAt, "dd")}</span><span className="text-[13px] font-bold text-muted-foreground uppercase">{format(scheduledAt, "MMM", { locale: ptBR })}</span></div>
        <div className="text-right md:text-left"><p className="text-[13px] font-bold text-foreground capitalize">{format(scheduledAt, "eeee", { locale: ptBR })}</p><p className="text-[13px] text-muted-foreground">{format(scheduledAt, "HH:mm")}</p></div>
      </div>
      <div className="w-full md:w-auto md:ml-auto"><Button variant="outline" className="w-full md:w-auto rounded-2xl border-border/40 hover:bg-muted font-bold text-sm px-8 py-6 h-auto transition-all shadow-sm" onClick={() => navigate("/dashboard/appointments?role=patient")}>Ver detalhes</Button></div>
    </motion.div>
  );
};

const EmptyAppointmentCard = ({ navigate }: any) => (
  <div className="app-card relative rounded-[32px] bg-gradient-to-br from-card via-card to-blue-500/[0.04] p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
    <div className="flex-1 text-center md:text-left">
      <div className="inline-flex p-3 rounded-2xl bg-primary/10 mb-3">
        <CalendarCheck size={24} weight="fill" className="text-primary" />
      </div>
      <p className="text-lg md:text-xl font-bold text-foreground mb-2">Sem consultas agendadas</p>
      <p className="text-sm text-muted-foreground max-w-md mb-5 mx-auto md:mx-0">
        Você ainda não tem nenhuma consulta para os próximos dias.
      </p>
      <Button
        onClick={() => navigate("/dashboard/schedule?role=patient")}
        className="rounded-2xl px-8 h-12 font-bold bg-primary text-primary-foreground shadow-lg hover:shadow-xl"
      >
        Agendar primeira consulta
      </Button>
    </div>
    <div className="shrink-0 hidden md:block">
      <PingoMascot variant="reading" size={160} animate className="drop-shadow-[0_12px_28px_rgba(15,42,90,0.18)]" />
    </div>
  </div>
);

export default PatientDashboard;

