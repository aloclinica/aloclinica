import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "./DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import { getPatientNav } from "@/components/patient/patientNav";
import { format, differenceInDays, differenceInHours, differenceInMinutes, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarCheck, VideoCamera, Clock, Gift, ArrowRight,
   Heart, Lightning, ClipboardText, FileText, UploadSimple,
   Sparkle, Stethoscope, MagnifyingGlass, Star, Plus, Warning,
   Pill, CaretRight, Heartbeat, Timer, TrendUp, TrendDown,
   FirstAidKit, ChatCircleDots, User, DotsThreeVertical,
} from "@phosphor-icons/react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import PatientOnboarding, { ONBOARDING_KEY, KYC_PENDING_KEY } from "@/components/patient/PatientOnboarding";
import { PingoMascot } from "@/components/mascot/PingoMascot";
import LazyAvatar from "@/components/ui/lazy-avatar";
import PatientWaitingCard from "@/components/patient/PatientWaitingCard";
import SectionErrorBoundary from "@/components/ui/section-error-boundary";
import Sparkline from "@/components/ui/sparkline";
import {
  usePatientStats, usePatientUpcoming, useReturnAppointments, useRecentHealthMetrics,
  useDetectPatientService, type ServiceType,
} from "@/hooks/usePatientDashboard";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";

/* ── Constants ── */

const HEALTH_TIPS = [
  { title: "Hidratação é chave!", body: "Beba pelo menos 2L de água por dia para manter corpo e mente funcionando bem.", metric: "2L", metricLabel: "Meta Diária", emoji: "💧" },
  { title: "Mexa-se hoje!", body: "30 min de caminhada reduzem ansiedade em até 40%.", metric: "30min", metricLabel: "Ideal/dia", emoji: "🏃" },
  { title: "Durma bem!", body: "7-8h de sono fortalecem a imunidade.", metric: "8h", metricLabel: "Ideal", emoji: "😴" },
  { title: "Frutas no prato!", body: "5 porções diárias fortalecem a imunidade.", metric: "5", metricLabel: "Porções", emoji: "🍎" },
  { title: "Respire fundo!", body: "Respiração profunda reduz o cortisol.", metric: "5min", metricLabel: "Diário", emoji: "🧘" },
  { title: "Sol na medida!", body: "15 min de sol ajudam na vitamina D.", metric: "15min", metricLabel: "Sol/dia", emoji: "☀️" },
  { title: "Monitore a pressão!", body: "Acompanhamento regular é prevenção.", metric: "12/8", metricLabel: "Ideal", emoji: "❤️" },
];

/**
 * Get quick actions based on service type
 * Different services show different quick action buttons
 */
 const getQuickActions = (serviceType: ServiceType) => [
   { label: "Agendar", icon: CalendarCheck, path: "/dashboard/schedule?role=patient", color: "#3b82f6", bg: "#f0f7ff" },
   { label: "Urgência", icon: Lightning, path: "/dashboard/urgent-care?role=patient", color: "#ef4444", bg: "#fef2f2" },
   { label: "Chat", icon: ChatCircleDots, path: "/dashboard/chat?role=patient", color: "#10b981", bg: "#ecfdf5" },
   { label: "Exames", icon: ClipboardText, path: "/dashboard/patient/exam-results?role=patient", color: "#8b5cf6", bg: "#f5f3ff" },
 ];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 6) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
};

const getAvatarRingColor = (nextAppt: Record<string, unknown> | undefined) => {
  if (!nextAppt) return "ring-emerald-400";
  const mins = differenceInMinutes(new Date(nextAppt.scheduled_at as string), new Date());
  if (mins <= 60) return "ring-red-400 animate-pulse";
  if (mins <= 180) return "ring-amber-400";
  return "ring-emerald-400";
};

const getContextualSubtitle = (upcoming: unknown[], stats: { total: number } | null | undefined) => {
  const today = upcoming.filter((a: any) => {
    const d = new Date(a.scheduled_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  if (today.length > 0) return `Você tem ${today.length} consulta${today.length > 1 ? "s" : ""} hoje`;
  if ((upcoming?.length ?? 0) > 0) return "Você tem consultas agendadas";
  if ((stats?.total ?? 0) > 0) return "Tudo em dia por aqui ✓";
  return "Cuide da sua saúde com quem entende";
};

/* ── Service Type & Filtering ── */

/**
 * Determine service type from query param or auto-detect from patient's appointments
 * URL: /dashboard/patient?service=cartao | ?service=oftalmologia | ?service=telemedicina
 * Without param: auto-detects from patient's appointment history
 */
const getServiceTypeFromParam = (searchParams: URLSearchParams): ServiceType | null => {
  const service = searchParams.get("service")?.toLowerCase();
  if (service === "telemedicina" || service === "oftalmologia") {
    return service;
  }
  return null;
};

/**
 * Sections to show for each service type
 */
const SERVICE_SECTIONS = {
  telemedicina: {
    heroActions: true,
    pendingAppt: true,
    nextAppt: true,
    quickActions: true,
    kpis: true,
    returnAppts: true,
    healthMetrics: true,
    healthTip: true,
    activePrescriptions: true,
  },
  oftalmologia: {
    heroActions: true,
    pendingAppt: true,
    nextAppt: true,
    quickActions: true,
    kpis: true,
    returnAppts: true,
    healthMetrics: false,
    healthTip: false,
    activePrescriptions: false,
  },
  all: {
    heroActions: true,
    pendingAppt: true,
    nextAppt: true,
    quickActions: true,
    kpis: true,
    returnAppts: true,
    healthMetrics: true,
    healthTip: true,
    activePrescriptions: true,
  },
};

/* ── Main Component ── */

const PatientDashboard = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const forceOnboarding = searchParams.get("onboarding") === "true";

  // Try to get service from query param first, then auto-detect
  const paramService = getServiceTypeFromParam(searchParams);
  const { data: detectedService, isLoading: detectingService } = useDetectPatientService();
  const serviceType = paramService || detectedService || "all";
  const sections = SERVICE_SECTIONS[serviceType];

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingDone] = useLocalStorage<boolean>(ONBOARDING_KEY, false);

  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = usePatientStats();
  const { data: upcoming = [], isLoading: upcomingLoading, isError: upcomingError } = usePatientUpcoming();
  const { data: returnAppts = [] } = useReturnAppointments();
  const { data: healthMetrics = [] } = useRecentHealthMetrics();

  const loading = statsLoading || upcomingLoading || detectingService;
  const waitingAppt = upcoming.find((a: { status: string }) =>
    a.status === "waiting" || a.status === "in_progress"
  ) ?? null;

  const nextAppt = upcoming[0];
  const daysUntilNext = nextAppt ? differenceInDays(new Date(nextAppt.scheduled_at), new Date()) : null;
  const minutesUntilNext = nextAppt ? differenceInMinutes(new Date(nextAppt.scheduled_at), new Date()) : null;

  const todayTip = HEALTH_TIPS[new Date().getDay() % HEALTH_TIPS.length];
  const firstName = profile?.first_name || "Paciente";
  const typedMetrics = healthMetrics as { type: string; value: number; unit: string }[];

  // Pull-to-refresh state
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

  // Pull-to-refresh touch handlers
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (el.scrollTop <= 0) pullStartY.current = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (pullStartY.current === 0) return;
      const delta = e.touches[0].clientY - pullStartY.current;
      if (delta > 60 && el.scrollTop <= 0) setIsPulling(true);
    };
    const onTouchEnd = () => {
      if (isPulling) {
        handleRefresh();
        setIsPulling(false);
      }
      pullStartY.current = 0;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [isPulling, handleRefresh]);

  useEffect(() => {
    if (loading) return;
    if (forceOnboarding) {
      setShowOnboarding(true);
      return;
    }
    // Force onboarding if profile is incomplete (missing mandatory fields)
    const profileIncomplete = !profile?.cpf || !profile?.phone || !profile?.date_of_birth;
    if (profileIncomplete || (!onboardingDone && (stats?.total ?? 0) === 0)) {
      setShowOnboarding(true);
    }
  }, [loading, stats?.total, onboardingDone, forceOnboarding, profile]);

  useEffect(() => {
    if (!user) return;
    const ch = db.channel("patient-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `patient_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["patient-upcoming-enriched"] });
        queryClient.invalidateQueries({ queryKey: ["patient-dashboard-stats"] });
      }).subscribe();
    return () => { db.removeChannel(ch); };
  }, [user, queryClient]);

  if (loading) {
    return (
      <DashboardLayout title="Perfil do Paciente" nav={getPatientNav("home")} role="patient">
        <div className="space-y-6 pb-24 md:pb-8">
          <div className="-mx-4 -mt-5 md:-mx-6 md:-mt-5 lg:-mx-8 lg:-mt-6">
            <Skeleton className="h-56 rounded-b-[2rem] md:rounded-[2rem]" />
          </div>
          <div className="grid grid-cols-5 gap-3 px-2">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="flex flex-col items-center gap-2.5">
                <Skeleton className="w-14 h-14 rounded-2xl" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Perfil do Paciente" nav={getPatientNav("home")} role="patient">
      {showOnboarding && <PatientOnboarding onComplete={() => setShowOnboarding(false)} />}

       <div ref={scrollRef} className="space-y-6 pb-24 md:pb-12">

        {/* Pull-to-refresh indicator */}
        <AnimatePresence>
          {(isPulling || isRefreshing) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 40 }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-center"
            >
              <RefreshCw className={cn("w-5 h-5 text-muted-foreground", isRefreshing && "animate-spin")} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* KYC Pending Warning */}
        {localStorage.getItem(KYC_PENDING_KEY) === "true" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Verificação pendente</p>
              <p className="text-xs text-muted-foreground">Complete o KYC para agendar consultas e usar o app.</p>
            </div>
            <Button size="sm" variant="destructive" className="rounded-xl shrink-0" onClick={() => navigate("/dashboard/profile?role=patient&kyc=open")}>
              Verificar
            </Button>
          </motion.div>
        )}

        {/* Data fetch error */}
        {(statsError || upcomingError) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 flex items-center gap-3"
          >
            <Warning size={20} weight="fill" className="text-destructive shrink-0" />
            <p className="flex-1 text-sm font-semibold text-destructive">Erro ao carregar dados</p>
            <Button size="sm" variant="outline" className="rounded-xl shrink-0" onClick={() => refetchStats()}>
              Tentar novamente
            </Button>
          </motion.div>
        )}

         {/* Hero, Quick Actions and Summary Row */}
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
           {/* Main Column (8/12) */}
           <div className="lg:col-span-8 space-y-6">
             {/* ═══════════ HERO BANNER ═══════════ */}
        <section
          className={cn(
            "patient-hero relative -mx-4 -mt-5 overflow-hidden rounded-b-[32px] md:-mx-6 md:-mt-5 md:rounded-[2rem] lg:-mx-8 lg:-mt-6",
            // Light mode: soft white-to-pale-blue gradient like the reference
            "bg-gradient-to-br from-white via-[hsl(210_60%_97%)] to-[hsl(210_70%_94%)] border border-[hsl(215_30%_90%)]/60",
            // Dark mode: deep navy gradient with subtle glow
            "dark:border-white/5 dark:bg-[radial-gradient(ellipse_at_top_right,hsl(215_70%_18%)_0%,hsl(220_30%_8%)_55%,hsl(220_25%_6%)_100%)]"
          )}
          style={{
            boxShadow:
              "var(--patient-hero-shadow, 0 12px 40px -12px rgba(15, 42, 90, 0.18), inset 0 1px 0 rgba(255,255,255,0.6))",
          }}
        >
          {/* Decorative elements */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-[hsl(215_85%_60%)]/10 blur-[80px] hidden md:block dark:bg-[hsl(215_85%_55%)]/20" />
          <div className="pointer-events-none absolute -left-8 bottom-4 h-48 w-48 rounded-full bg-[hsl(168_60%_55%)]/10 blur-[60px] hidden md:block dark:bg-[hsl(215_85%_55%)]/15" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(215_30%_70%)]/30 to-transparent dark:via-white/20" />

          {/* Decorative line chart — like the reference */}
          <svg
            className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-3/5 md:block opacity-60 dark:opacity-90"
            viewBox="0 0 600 240"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="patientHeroLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(215 85% 55%)" stopOpacity="0" />
                <stop offset="40%" stopColor="hsl(215 85% 55%)" stopOpacity="1" />
                <stop offset="100%" stopColor="hsl(215 95% 65%)" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="patientHeroFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(215 85% 55%)" stopOpacity="0.18" />
                <stop offset="100%" stopColor="hsl(215 85% 55%)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,180 C80,160 130,120 200,110 C260,102 300,150 360,130 C420,110 460,60 520,50 L600,40"
              stroke="url(#patientHeroLine)"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M0,180 C80,160 130,120 200,110 C260,102 300,150 360,130 C420,110 460,60 520,50 L600,40 L600,240 L0,240 Z"
              fill="url(#patientHeroFill)"
            />
            {/* Data points */}
            {[
              { cx: 200, cy: 110 },
              { cx: 360, cy: 130 },
              { cx: 520, cy: 50 },
            ].map((p, i) => (
              <g key={i}>
                <circle cx={p.cx} cy={p.cy} r="6" fill="hsl(215 85% 55%)" opacity="0.25" />
                <circle cx={p.cx} cy={p.cy} r="3.5" fill="hsl(215 95% 65%)" />
              </g>
            ))}
          </svg>

          {/* Subtle pattern overlay */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
            style={{ backgroundImage: "radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)", backgroundSize: "24px 24px" }} />

          <div className="relative z-10 px-5 pt-8 pb-7 md:px-8 md:pt-12 md:pb-9">
            <div className="flex items-start gap-4">
              {/* Avatar with colored ring */}
              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className={cn(
                  "ring-[3px] ring-offset-2 ring-offset-transparent rounded-full",
                  getAvatarRingColor(nextAppt)
                )}>
                  <LazyAvatar
                    src={profile?.avatar_url}
                    name={firstName}
                    className="h-16 w-16 md:h-[72px] md:w-[72px] border-2 border-[hsl(215_30%_90%)] dark:border-white/20 shadow-lg"
                    fallbackClassName="bg-[hsl(215_80%_28%)]/10 text-[hsl(215_80%_28%)] dark:bg-white/15 dark:text-white text-lg"
                  />
                </div>
              </motion.div>

              <div className="flex-1 min-w-0">
                <motion.h1
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="font-[Manrope] text-[26px] font-extrabold leading-[1.1] tracking-tight md:text-[38px] text-[hsl(215_80%_18%)] dark:text-white"
                >
                  <span className="block text-[11px] md:text-[13px] font-bold uppercase tracking-[0.18em] text-[hsl(215_85%_45%)] dark:text-[hsl(215_90%_70%)] mb-2">
                    {getGreeting()}, {firstName}! 👋
                  </span>
                  Sua saúde em um só lugar
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.45 }}
                  className="mt-2 text-[13px] font-medium leading-relaxed md:text-[15px] text-[hsl(215_30%_35%)] dark:text-white/70"
                >
                  {getContextualSubtitle(upcoming, stats)}
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                className="shrink-0 -mt-2 hidden sm:block relative"
              >
                {/* Speech Bubble to match HeroBanner pattern */}
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                  className="absolute -top-12 -left-12 z-20 rounded-2xl rounded-br-none border border-border/40 bg-card/95 backdrop-blur-md px-3 py-2 shadow-xl dark:border-white/15"
                >
                  <p className="text-[10px] font-black text-[hsl(215_85%_45%)] dark:text-[hsl(215_90%_70%)] leading-none whitespace-nowrap">
                    Olá, {firstName}! ✨
                  </p>
                  <div className="absolute -bottom-2 right-0 h-0 w-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-card/95" />
                </motion.div>
                
                <PingoMascot 
                  variant="wave" 
                  size={120} 
                  animate 
                  bounce 
                  className="drop-shadow-[0_12px_32px_rgba(15,42,90,0.18)] dark:drop-shadow-[0_12px_32px_rgba(0,0,0,0.45)] sm:!w-[130px] sm:!h-[130px]" 
                />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.45 }}
              className="flex gap-2 mt-5 flex-wrap"
            >
              {[
                { icon: CalendarCheck, label: `${stats?.total ?? 0} consultas` },
                { icon: FileText, label: `${stats?.prescriptions ?? 0} receitas` },
                { icon: Heart, label: `${typedMetrics.length} métricas` },
              ].map((pill, i) => (
                <motion.span
                  key={pill.label}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.22 + i * 0.06 }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-card/80 backdrop-blur-md border border-border/40 px-3.5 py-1.5 text-[11px] font-bold text-foreground/80 shadow-[0_2px_8px_rgba(15,42,90,.06)] dark:bg-white/[0.08] dark:border-white/[0.1] dark:text-white/80 dark:shadow-[0_2px_8px_rgba(0,0,0,.25)]"
                >
                  <pill.icon size={12} weight="fill" className="text-[hsl(215_85%_45%)] dark:text-[hsl(215_90%_70%)]" /> {pill.label}
                </motion.span>
              ))}
            </motion.div>
          </div>
             </section>
 
             {/* ═══════════ QUICK ACTIONS ═══════════ */}
             {sections.quickActions && (
               <section>
                 <h3 className="text-sm font-bold text-foreground mb-4 px-1">Ações rápidas</h3>
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                   {getQuickActions(serviceType).map((action, i) => (
                     <motion.button
                       key={action.label}
                       initial={{ opacity: 0, y: 16 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: 0.1 + i * 0.04, type: "spring", stiffness: 320, damping: 26 }}
                       whileTap={{ scale: 0.95 }}
                       whileHover={{ y: -4 }}
                       onClick={() => navigate(action.path)}
                       className="group flex flex-col items-center gap-2 p-4 rounded-2xl border border-border/40 bg-card hover:border-primary/20 hover:bg-primary/[0.02] transition-all duration-300"
                     >
                       <div
                         className="flex h-12 w-12 items-center justify-center rounded-xl mb-1 shadow-sm transition-transform duration-300 group-hover:scale-110"
                         style={{ backgroundColor: action.bg, color: action.color }}
                       >
                         <action.icon size={24} weight="fill" />
                       </div>
                       <div className="flex flex-col items-center">
                         <span className="text-[13px] font-bold text-foreground leading-tight">{action.label}</span>
                         <span className="text-[10px] text-muted-foreground mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">Abrir</span>
                       </div>
                     </motion.button>
                   ))}
                 </div>
               </section>
             )}
 
             {/* ═══════════ SUMMARY / KPIs ═══════════ */}
             {sections.kpis && (
               <section>
                 <h3 className="text-sm font-bold text-foreground mb-4 px-1">Resumo geral</h3>
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                   {[
                     { label: "Consultas", value: stats?.total ?? 0, icon: CalendarCheck, color: "#3b82f6", bg: "bg-blue-500/8", trend: "up" },
                     { label: "Receitas", value: stats?.prescriptions ?? 0, icon: FileText, color: "#10b981", bg: "bg-emerald-500/8", trend: "up" },
                     { label: "Documentos", value: stats?.documents ?? 0, icon: UploadSimple, color: "#f59e0b", bg: "bg-amber-500/8", trend: "neutral" },
                     { label: "Próx. retorno", value: returnAppts.length > 0 ? "Ativo" : "—", icon: Clock, color: "#8b5cf6", bg: "bg-purple-500/8", trend: "neutral" },
                   ].map((stat, i) => (
                     <motion.div
                       key={stat.label}
                       initial={{ opacity: 0, y: 14 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: 0.15 + i * 0.05 }}
                       className="flex flex-col p-4 rounded-2xl border border-border/40 bg-card"
                     >
                       <div className="flex items-center justify-between mb-3">
                         <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", stat.bg)}>
                           <stat.icon size={18} weight="fill" style={{ color: stat.color }} />
                         </div>
                         {stat.trend === "up" && <TrendUp size={12} weight="bold" className="text-emerald-500 opacity-60" />}
                       </div>
                       <p className="text-xl font-extrabold text-foreground leading-none">{stat.value}</p>
                       <p className="text-[11px] font-medium text-muted-foreground mt-1">{stat.label}</p>
                     </motion.div>
                   ))}
                 </div>
               </section>
             )}
 
             {/* ═══════════ NEXT APPOINTMENT ═══════════ */}
             {sections.nextAppt && (
               <section>
                 <h3 className="text-sm font-bold text-foreground mb-4 px-1">Próxima consulta</h3>
                 {nextAppt ? (
                   <NextAppointmentCard appt={nextAppt} daysUntilNext={daysUntilNext} minutesUntil={minutesUntilNext} navigate={navigate} />
                 ) : (
                   <EmptyAppointmentCard navigate={navigate} />
                 )}
               </section>
             )}
           </div>
 
           {/* Side Column (4/12) */}
           <div className="lg:col-span-4 space-y-6">
             {/* ═══════════ HEALTH TIP ═══════════ */}
             {sections.healthTip && (
               <motion.div
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="rounded-3xl border border-border/40 bg-card p-6 shadow-sm relative overflow-hidden"
               >
                 <div className="absolute top-4 right-4 text-blue-500/20"><Sparkle size={48} weight="fill" /></div>
                 <div className="flex items-center gap-2 mb-4">
                   <div className="w-2 h-6 bg-blue-500 rounded-full" />
                   <span className="text-[11px] font-black uppercase tracking-widest text-blue-500">Dica de saúde</span>
                 </div>
                 <h4 className="text-lg font-bold text-foreground mb-2">{todayTip.title}</h4>
                 <p className="text-sm text-muted-foreground leading-relaxed mb-6">{todayTip.body}</p>
                 
                 <div className="flex items-center gap-4 bg-muted/40 p-4 rounded-2xl border border-border/10">
                   <div className="text-3xl">{todayTip.emoji}</div>
                   <div className="flex-1">
                     <p className="text-2xl font-black text-foreground leading-none">{todayTip.metric}</p>
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{todayTip.metricLabel}</p>
                   </div>
                   <div className="h-10 w-10 rounded-full border-4 border-blue-500/20 border-t-blue-500 flex items-center justify-center">
                     <span className="text-[8px] font-bold">100%</span>
                   </div>
                 </div>
               </motion.div>
             )}
 
             {/* ═══════════ FIND DOCTOR ═══════════ */}
             <motion.div
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.1 }}
               className="rounded-3xl border border-border/40 bg-card p-6 shadow-sm"
             >
               <div className="flex items-center gap-2 mb-4">
                 <div className="w-2 h-6 bg-emerald-500 rounded-full" />
                 <span className="text-[11px] font-black uppercase tracking-widest text-emerald-500">Encontre seu médico</span>
               </div>
               <p className="text-sm font-bold text-foreground mb-4">Busque por especialidade ou médico</p>
               
               <div className="relative group mb-4">
                 <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                 <input 
                   type="text" 
                   placeholder="Buscar médico ou especialidade..."
                   className="w-full bg-muted/50 border border-border/40 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-card transition-all"
                   onClick={() => navigate("/dashboard/schedule?role=patient")}
                 />
                 <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-emerald-500 text-white p-2 rounded-xl shadow-md cursor-pointer hover:bg-emerald-600 transition-colors"
                   onClick={() => navigate("/dashboard/schedule?role=patient")}>
                   <MagnifyingGlass size={16} weight="bold" />
                 </div>
               </div>
 
               <div className="flex gap-2 flex-wrap">
                 {["Cardiologia", "Clínico Geral", "Pediatria", "Dermatologia"].map(s => (
                   <button key={s} className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-muted/50 border border-border/40 hover:bg-primary/10 hover:border-primary/20 transition-all text-muted-foreground hover:text-primary">
                     {s}
                   </button>
                 ))}
               </div>
             </motion.div>
 
             {/* Health Metrics Sparkline List */}
             {typedMetrics.length > 0 && (
               <motion.div
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: 0.2 }}
                 className="rounded-3xl border border-border/40 bg-card p-6 shadow-sm"
               >
                 <div className="flex items-center justify-between mb-6">
                   <h4 className="text-sm font-bold text-foreground">Sua evolução</h4>
                   <Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-500 bg-emerald-500/5">
                     +12% este mês
                   </Badge>
                 </div>
                 
                 <div className="space-y-6">
                   {typedMetrics.slice(0, 3).map((m, i) => (
                     <div key={i} className="flex items-center gap-4">
                       <div className="flex-1">
                         <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{m.type.replace(/_/g, ' ')}</p>
                         <p className="text-lg font-black text-foreground">{m.value} <span className="text-xs font-normal text-muted-foreground">{m.unit}</span></p>
                       </div>
                       <div className="w-24 h-10">
                         <Sparkline data={[m.value * 0.9, m.value * 1.1, m.value * 1.05, m.value * 0.95, m.value]} height={40} color={i % 2 === 0 ? "#3b82f6" : "#10b981"} />
                       </div>
                     </div>
                   ))}
                 </div>
                 
                 <Button 
                   variant="ghost" 
                   className="w-full mt-6 text-[11px] font-bold text-muted-foreground hover:text-primary"
                   onClick={() => navigate("/dashboard/patient/health?role=patient")}
                 >
                   Ver histórico completo <ArrowRight size={14} className="ml-2" />
                 </Button>
               </motion.div>
             )}
           </div>
         </div>
 
         {/* Lower Content Grid */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Prescriptions */}
           {sections.activePrescriptions && (stats?.prescriptions ?? 0) > 0 && (
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="rounded-3xl border border-border/40 bg-card p-6"
             >
               <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-3">
                   <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500"><Pill size={20} weight="fill" /></div>
                   <h3 className="font-bold">Receitas ativas</h3>
                 </div>
                 <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/dashboard/history?role=patient")}>Ver todas</Button>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {[...Array(Math.min(stats?.prescriptions ?? 0, 4))].map((_, i) => (
                   <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30 border border-border/10">
                     <div className="h-10 w-10 rounded-xl bg-white dark:bg-muted flex items-center justify-center shadow-sm">
                       <FileText size={20} className="text-blue-500" />
                     </div>
                     <div className="flex-1">
                       <p className="text-sm font-bold truncate">Receita #{1042 + i}</p>
                       <p className="text-[10px] text-muted-foreground">Válida até 12/06/26</p>
                     </div>
                   </div>
                 ))}
               </div>
             </motion.div>
           )}
 
           {/* Recent Appointments List */}
           {upcoming.length > 0 && (
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="rounded-3xl border border-border/40 bg-card p-6"
             >
               <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-3">
                   <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500"><CalendarCheck size={20} weight="fill" /></div>
                   <h3 className="font-bold">Seu histórico</h3>
                 </div>
                 <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/dashboard/appointments?role=patient")}>Ver histórico</Button>
               </div>
               <div className="space-y-3">
                 {upcoming.slice(0, 3).map((appt: any, i: number) => (
                   <div key={i} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/dashboard/appointments?role=patient`)}>
                     <LazyAvatar name={appt.doctor_name} className="h-10 w-10" />
                     <div className="flex-1">
                       <p className="text-sm font-bold">{appt.doctor_name}</p>
                       <p className="text-[10px] text-muted-foreground">{format(new Date(appt.scheduled_at), "dd MMMM yyyy", { locale: ptBR })}</p>
                     </div>
                     <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest">{appt.status}</Badge>
                   </div>
                 ))}
               </div>
             </motion.div>
           )}
         </div>

        {/* ═══════════ URGENT BANNER ═══════════ */}
        <AnimatePresence>
          {nextAppt && minutesUntilNext !== null && minutesUntilNext > 0 && minutesUntilNext <= 60 && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl bg-emerald-500 dark:bg-emerald-600 text-white p-4 flex items-center gap-3 shadow-lg"
            >
              <div className="animate-pulse w-3 h-3 rounded-full bg-white shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[14px]">Sua consulta começa em breve!</p>
                <p className="text-[12px] opacity-90">{nextAppt.doctor_name} · às {format(new Date(nextAppt.scheduled_at), "HH:mm")}</p>
              </div>
              <Button
                size="sm"
                onClick={() => navigate(`/dashboard/consultation/${nextAppt.id}`)}
                className="shrink-0 rounded-full bg-white text-emerald-700 font-bold text-[12px] hover:bg-white/90 shadow-sm"
              >
                Entrar
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live consultation */}
        {sections.pendingAppt && waitingAppt && (
          <SectionErrorBoundary fallbackTitle="Erro na sala de espera">
            <PatientWaitingCard appointment={waitingAppt} />
          </SectionErrorBoundary>
        )}

        {/* ═══════════ QUICK ACTIONS ═══════════ */}
        {sections.quickActions && (
        <section className="grid gap-2 sm:gap-4" style={{ gridTemplateColumns: `repeat(${getQuickActions(serviceType).length}, minmax(0, 1fr))` }}>
          {getQuickActions(serviceType).map((action, i) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.04, type: "spring", stiffness: 320, damping: 26 }}
              whileTap={{ scale: 0.85 }}
              whileHover={{ y: -6, scale: 1.08 }}
              onClick={() => navigate(action.path)}
              className="group flex flex-col items-center gap-2.5 py-2 cursor-pointer"
            >
              <div
                className="relative flex h-[60px] w-[60px] items-center justify-center rounded-[22px] border border-border/8 shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-300 group-hover:shadow-xl group-hover:border-border/15 overflow-hidden"
                style={{ backgroundColor: action.bg }}
              >
                <action.icon size={26} weight="fill" style={{ color: action.color }} className="relative z-10 transition-transform duration-300 group-hover:scale-110" />
                {/* Shine effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              </div>
              <span className="text-[11px] font-bold text-muted-foreground group-hover:text-foreground leading-tight transition-colors duration-200">{action.label}</span>
            </motion.button>
          ))}
        </section>
        )}

        {/* ═══════════ BENTO STATS ═══════════ */}
        {sections.kpis && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-[hsl(var(--p-primary))]/8">
              <TrendUp size={13} weight="fill" className="text-[hsl(var(--p-primary))]" />
            </div>
            <h2 className="font-[Manrope] text-[15px] font-bold text-foreground tracking-tight">Histórico e Resumo</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Consultas", value: stats?.total ?? 0, icon: CalendarCheck, color: "hsl(var(--p-primary))", bgToken: "hsl(var(--p-primary) / 0.07)", trend: "up" as const },
              { label: "Receitas", value: stats?.prescriptions ?? 0, icon: Pill, color: "hsl(var(--secondary))", bgToken: "hsl(var(--secondary) / 0.07)", trend: "up" as const },
              { label: "Documentos", value: stats?.documents ?? 0, icon: ClipboardText, color: "hsl(var(--warning))", bgToken: "hsl(var(--warning) / 0.07)", trend: "neutral" as const },
              { label: "Próx. retorno", value: returnAppts.length > 0 ? `${differenceInDays(new Date((returnAppts[0] as any).return_deadline), new Date())}d` : "—", icon: Timer, color: "hsl(var(--p-primary-mid))", bgToken: "hsl(var(--p-primary-mid) / 0.07)", trend: returnAppts.length > 0 ? "down" as const : "neutral" as const },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className="group kpi-card rounded-2xl border border-border/10 bg-card p-4 shadow-[var(--p-shadow-card)] hover:shadow-md hover:border-border/20 transition-all duration-300 cursor-default"
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105"
                    style={{ backgroundColor: stat.bgToken }}
                  >
                    <stat.icon size={19} weight="fill" style={{ color: stat.color }} />
                  </div>
                  {stat.trend === "up" && <TrendUp size={14} weight="bold" className="text-emerald-500 opacity-60" />}
                  {stat.trend === "down" && <TrendDown size={14} weight="bold" className="text-amber-500 opacity-60" />}
                </div>
                <p className="font-[Manrope] text-[26px] font-extrabold text-foreground leading-none">{stat.value}</p>
                <p className="text-[10.5px] font-semibold text-muted-foreground mt-2 uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </section>
        )}

        {/* ═══════════ CONTENT GRID ═══════════ */}
        {(sections.nextAppt || sections.returnAppts || sections.healthMetrics || sections.healthTip || sections.activePrescriptions) && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5 lg:gap-8">

          {/* LEFT: Next Appointment */}
          {(sections.nextAppt || sections.returnAppts) && (
          <div className="space-y-5 lg:col-span-2 order-first">
            {sections.nextAppt && (
            <>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(var(--p-primary) / 0.1)" }}>
                <CalendarCheck size={14} weight="fill" className="text-[hsl(var(--p-primary))]" />
              </div>
              <h2 className="font-[Manrope] text-[17px] font-bold text-foreground tracking-tight">Próxima Consulta</h2>
            </div>

            {nextAppt ? (
              <NextAppointmentCard appt={nextAppt} daysUntilNext={daysUntilNext} minutesUntil={minutesUntilNext} navigate={navigate} />
            ) : (
              <EmptyAppointmentCard navigate={navigate} />
            )}
            </>
            )}

            {sections.returnAppts && returnAppts.length > 0 && (
              <ReturnAppointments items={returnAppts as ReturnAppt[]} navigate={navigate} />
            )}
          </div>
          )}

          {/* RIGHT */}
          <div className="lg:col-span-3 space-y-5 order-last">

            {/* Health Tip — premium card */}
            {sections.healthTip && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="card-interactive relative overflow-hidden rounded-2xl border border-[hsl(var(--p-primary))]/10 bg-card p-5 sm:p-6 shadow-[var(--p-shadow-card)]"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[hsl(var(--p-primary))]/5 blur-2xl" />
              <div className="pointer-events-none absolute -left-6 bottom-0 h-20 w-20 rounded-full bg-[hsl(var(--secondary))]/5 blur-2xl" />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[48px] leading-none drop-shadow-sm">{todayTip.emoji}</span>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[hsl(var(--p-primary))] opacity-60">Dica de Saúde</span>
                      <h3 className="font-[Manrope] text-[16px] font-bold text-foreground leading-snug">{todayTip.title}</h3>
                    </div>
                  </div>
                  <p className="text-[12.5px] leading-relaxed text-muted-foreground">{todayTip.body}</p>
                </div>
                <div className="flex min-w-[110px] flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-[hsl(var(--p-primary))]/[0.08] to-[hsl(var(--p-primary))]/[0.02] border border-[hsl(var(--p-primary))]/10 p-5 shadow-sm">
                  <span className="text-[28px] font-extrabold text-[hsl(var(--p-primary))] font-[Manrope] leading-none">{todayTip.metric}</span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground mt-2">{todayTip.metricLabel}</span>
                </div>
              </div>
            </motion.div>
            )}

            {/* Find your doctor — enhanced CTA */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="card-interactive relative overflow-hidden rounded-2xl border border-secondary/15 bg-gradient-to-br from-secondary/[0.06] via-secondary/[0.03] to-transparent p-5"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-secondary/8 blur-2xl" />
              <div className="flex items-center gap-4">
                <div className="shrink-0 flex h-13 w-13 items-center justify-center rounded-2xl bg-secondary/10 shadow-sm">
                  <Stethoscope size={24} weight="fill" className="text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Sparkle size={12} weight="fill" className="text-secondary" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-secondary">Encontre seu médico</span>
                  </div>
                  <p className="text-[13.5px] font-bold text-foreground leading-snug">Busque por especialidade ou médico</p>
                  <p className="mt-0.5 text-[11.5px] text-muted-foreground leading-relaxed">Perfis, avaliações e horários disponíveis.</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate("/dashboard/schedule?role=patient")}
                  className="shrink-0 rounded-full bg-secondary text-secondary-foreground text-[12px] font-bold px-5 h-10 shadow-md hover:bg-secondary/90 hover:shadow-lg active:scale-95 transition-all duration-200"
                >
                  <MagnifyingGlass size={14} weight="bold" className="mr-1.5" /> Buscar
                </Button>
              </div>
            </motion.div>

            {/* Health Metrics with Sparklines */}
            {typedMetrics.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.42 }}
                className="rounded-2xl border border-border/10 bg-card p-5 shadow-[var(--p-shadow-card)]"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Heartbeat size={16} weight="fill" className="text-destructive" />
                    <span className="font-[Manrope] text-[14px] font-bold text-foreground">Sinais Vitais Recentes</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/dashboard/patient/health?role=patient")}
                    className="text-[11px] font-semibold text-muted-foreground hover:text-foreground h-7 px-2"
                  >
                    Ver tudo <ArrowRight size={12} className="ml-1" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {typedMetrics.slice(0, 4).map((m, i) => {
                    const metricLabel = {
                      blood_pressure_sys: "Pressão Sistólica",
                      blood_pressure_dia: "Pressão Diastólica",
                      heart_rate: "Freq. Cardíaca",
                      temperature: "Temperatura",
                      weight: "Peso",
                      glucose: "Glicose",
                      oxygen_saturation: "Saturação O2",
                    }[m.type] || m.type;

                    return (
                      <div key={i} className="kpi-card rounded-xl bg-muted/40 border border-border/5 p-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{metricLabel}</p>
                        </div>
                        <p className="text-[20px] font-extrabold font-[Manrope] text-foreground leading-none">{m.value}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5">{m.unit}</p>
                        <div className="mt-2 -mx-1">
                          <Sparkline data={[m.value * 0.9, m.value * 0.95, m.value * 1.02, m.value * 0.98, m.value]} height={32} color="hsl(var(--p-primary))" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}


            {/* Active Prescriptions - Receitas Ativas */}
            {sections.activePrescriptions && (stats?.prescriptions ?? 0) > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.56 }}
                className="rounded-2xl border border-border/10 bg-card p-5 shadow-[var(--p-shadow-card)]"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Pill size={15} weight="fill" className="text-destructive" />
                  <span className="font-[Manrope] text-[14px] font-bold text-foreground">Receitas Ativas</span>
                </div>
                <div className="space-y-2">
                  {[...Array(Math.min(stats?.prescriptions ?? 0, 3))].map((_, i) => {
                    const daysRemaining = 25 - (i * 3); // Mock countdown days
                    const isExpiring = daysRemaining <= 7;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + i * 0.05 }}
                        className={cn(
                          "card-interactive flex items-center gap-3 p-3 rounded-xl border transition-colors",
                          isExpiring
                            ? "border-destructive/20 bg-destructive/5"
                            : "border-border/5 bg-muted/20"
                        )}
                      >
                        <div className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg",
                          isExpiring ? "bg-destructive/20" : "bg-[hsl(var(--p-primary))]/10"
                        )}>
                          <Pill size={14} weight="fill" className={isExpiring ? "text-destructive" : "text-[hsl(var(--p-primary))]"} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-bold text-foreground">Medicação {i + 1}</p>
                          <p className="text-[10px] text-muted-foreground">Prescrever por Dr. Silva</p>
                        </div>
                        <div className={cn(
                          "text-right text-xs font-bold",
                          isExpiring ? "text-destructive" : "text-[hsl(var(--p-primary))]"
                        )}>
                          {daysRemaining}d
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-3 text-[11px] font-semibold text-muted-foreground hover:text-foreground h-8"
                  onClick={() => navigate("/dashboard/history?role=patient")}
                >
                  Ver todas as receitas <ArrowRight size={12} className="ml-1" />
                </Button>
              </motion.div>
            )}

            {/* Recent History */}
            {upcoming.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.64 }}
                className="rounded-2xl border border-border/10 bg-card p-5 shadow-[var(--p-shadow-card)]"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={15} weight="fill" className="text-[hsl(var(--p-primary))]" />
                  <span className="font-[Manrope] text-[14px] font-bold text-foreground">Próximas Consultas</span>
                </div>
                <div className="space-y-2">
                  {upcoming.slice(0, 3).map((appt: any, i: number) => (
                    <motion.div
                      key={appt.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.68 + i * 0.05 }}
                      onClick={() => navigate("/dashboard/appointments?role=patient")}
                      className="card-interactive flex items-center gap-3 p-3 rounded-xl border border-border/5 cursor-pointer"
                    >
                      <LazyAvatar name={appt.doctor_name} className="h-10 w-10" fallbackClassName="bg-[hsl(var(--p-primary))]/10 text-[hsl(var(--p-primary))] text-xs" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-foreground truncate">{appt.doctor_name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {format(new Date(appt.scheduled_at), "dd/MM · HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <Badge variant="outline" className={cn(
                        "text-[10px] font-bold shrink-0",
                        appt.status === "scheduled" && "border-[hsl(var(--p-primary))]/20 text-[hsl(var(--p-primary))] bg-[hsl(var(--p-primary))]/5",
                        appt.status === "waiting" && "border-warning/20 text-warning bg-warning/5",
                        appt.status === "in_progress" && "border-emerald-500/20 text-emerald-600 bg-emerald-500/5",
                      )}>
                        {appt.status === "scheduled" ? "Agendada" : appt.status === "waiting" ? "Aguardando" : "Em andamento"}
                      </Badge>
                      <CaretRight size={14} className="text-muted-foreground/50 shrink-0" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
        )}
      </div>
    </DashboardLayout>
  );
};

/* ── Sub-components ── */

interface ReturnAppt {
  id: string;
  return_deadline: string;
  doctor_name: string;
  doctor_id: string;
}

const ReturnAppointments = ({ items, navigate }: { items: ReturnAppt[]; navigate: ReturnType<typeof useNavigate> }) => (
  <div className="overflow-hidden rounded-2xl border border-warning/15 bg-warning/[0.04] p-4">
    <div className="mb-3 flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-warning/12">
        <Gift size={14} weight="fill" className="text-warning" />
      </div>
      <p className="text-[11px] font-bold text-warning uppercase tracking-wide">Retorno Grátis</p>
    </div>
    {items.map(ra => {
      const daysR = differenceInDays(new Date(ra.return_deadline), new Date());
      return (
        <div key={ra.id} className="card-interactive mb-2 flex items-center justify-between rounded-xl border border-border/10 bg-card p-3 last:mb-0 shadow-sm">
          <div className="flex items-center gap-3">
            <LazyAvatar name={ra.doctor_name} className="h-9 w-9" fallbackClassName="bg-warning/10 text-warning text-xs" />
            <div className="text-xs">
              <p className="font-semibold text-foreground">{ra.doctor_name}</p>
              <p className="mt-0.5 text-muted-foreground">
                {daysR <= 3
                  ? <span className="font-semibold text-destructive">⚠️ {daysR}d restantes</span>
                  : `Até ${format(new Date(ra.return_deadline), "dd/MM")} (${daysR}d)`}
              </p>
            </div>
          </div>
          <Button size="sm" className="h-8 rounded-full bg-warning text-warning-foreground hover:bg-warning/90 text-[11px] font-bold shadow-sm"
            onClick={() => navigate(`/dashboard/schedule/${ra.doctor_id}?return=true&original=${ra.id}`)}>
            Agendar
          </Button>
        </div>
      );
    })}
  </div>
);

 const NextAppointmentCard = ({
   appt, navigate,
 }: {
   appt: Record<string, unknown>;
   daysUntilNext: number | null;
   minutesUntil: number | null;
   navigate: ReturnType<typeof useNavigate>;
 }) => {
   const scheduledAt = new Date(appt.scheduled_at as string);
 
   return (
     <motion.div
       initial={{ opacity: 0, y: 10 }}
       animate={{ opacity: 1, y: 0 }}
       className="rounded-[32px] border border-border/40 bg-card p-6 shadow-sm flex flex-col md:flex-row items-center gap-6 relative group overflow-hidden"
     >
       <div className="absolute top-0 right-0 p-4 opacity-30 group-hover:opacity-100 transition-opacity">
         <DotsThreeVertical size={24} className="text-muted-foreground cursor-pointer" />
       </div>
       
       {/* Doctor Info Group */}
       <div className="flex items-center gap-5 w-full md:w-auto">
         <div className="relative">
           <LazyAvatar 
             src={appt.doctor_avatar as string} 
             name={appt.doctor_name as string} 
             className="h-20 w-20 rounded-full border-4 border-white dark:border-muted shadow-lg" 
           />
           <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-2 border-white dark:border-muted flex items-center justify-center">
             <VideoCamera size={12} weight="fill" className="text-white" />
           </div>
         </div>
         
         <div className="flex-1 min-w-0">
           <div className="flex items-center gap-2 mb-1">
             <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-0.5 rounded-full">Consulta Presencial</span>
           </div>
           <h4 className="text-xl font-bold text-foreground truncate">{appt.doctor_name as string}</h4>
           <p className="text-sm text-muted-foreground">{(appt.specialty as string) ?? "Clínico Geral"}</p>
           <p className="text-[11px] text-muted-foreground mt-1">Clínica AloClínica – Unidade Centro</p>
         </div>
       </div>
 
       {/* Vertical Divider */}
       <div className="hidden md:block h-16 w-px bg-border/40 mx-2" />
 
       {/* Time & Date Group */}
       <div className="flex flex-row md:flex-col items-center md:items-start justify-between md:justify-center gap-1 w-full md:w-32 bg-muted/30 md:bg-transparent p-4 md:p-0 rounded-2xl">
         <div className="flex items-baseline gap-1">
           <span className="text-3xl font-black text-foreground">{format(scheduledAt, "dd")}</span>
           <span className="text-[13px] font-bold text-muted-foreground uppercase">{format(scheduledAt, "MMM", { locale: ptBR })}</span>
         </div>
         <div className="text-right md:text-left">
           <p className="text-[13px] font-bold text-foreground capitalize">{format(scheduledAt, "eeee", { locale: ptBR })}</p>
           <p className="text-[13px] text-muted-foreground">{format(scheduledAt, "HH:mm")}</p>
         </div>
       </div>
 
       {/* Action */}
       <div className="w-full md:w-auto md:ml-auto">
         <Button 
           variant="outline"
           className="w-full md:w-auto rounded-2xl border-border/40 hover:bg-muted font-bold text-sm px-8 py-6 h-auto transition-all shadow-sm"
           onClick={() => navigate("/dashboard/appointments?role=patient")}
         >
           Ver detalhes
         </Button>
       </div>
     </motion.div>
   );
 };

const EmptyAppointmentCard = ({ navigate }: { navigate: ReturnType<typeof useNavigate> }) => (
  <Card className="relative overflow-hidden border-dashed border-border/20 bg-gradient-to-b from-card to-muted/20">
    <CardContent className="flex flex-col items-center py-12 text-center">
      <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 h-32 w-32 rounded-full bg-[hsl(var(--p-primary))]/6 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <PingoMascot variant="wave" size={90} bounce animate />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.45 }}
        className="mt-5"
      >
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--p-primary))]/8 px-3.5 py-1.5 mb-3">
          <Stethoscope size={12} weight="fill" className="text-[hsl(var(--p-primary))]" />
          <span className="text-[10px] font-bold text-[hsl(var(--p-primary))] uppercase tracking-wider">Agenda livre</span>
        </div>
        <p className="font-[Manrope] text-[17px] font-bold text-foreground">Tudo tranquilo por aqui! 🎉</p>
        <p className="mt-2 text-[12.5px] text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
          Que tal agendar uma consulta? Encontre especialistas e agende em poucos toques.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <Button
          className="mt-6 rounded-full bg-[hsl(var(--p-primary))] text-white px-8 py-3 h-auto text-[14px] font-bold shadow-[0_4px_16px_rgba(0,52,127,.2)] hover:shadow-[0_6px_24px_rgba(0,52,127,.3)] hover:scale-[1.02] active:scale-[0.97] transition-all duration-200"
          onClick={() => navigate("/dashboard/schedule?role=patient")}
        >
          <Plus size={16} weight="bold" className="mr-2" /> Agendar agora
        </Button>
      </motion.div>
    </CardContent>
  </Card>
);

export default PatientDashboard;
