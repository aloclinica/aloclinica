import { logError } from "@/lib/logger";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminNav } from "@/components/admin/adminNav";
import {
  Users, Stethoscope, Building2, Headphones,
  Handshake, Bot, ShieldCheck, ArrowRight,
  Activity, RefreshCw, Monitor, Sparkles, LayoutGrid,
  UserPlus, Layers,
} from "lucide-react";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import pingoAdmin from "@/assets/pingo-admin.png";

interface RecentUser { name: string; page: string; lastSeen: string }
interface PanelInfo {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  route: string;
  roleKey: string;
  onlineCount: number;
  totalUsers: number;
  recentUsers: RecentUser[];
}

const PANELS: Omit<PanelInfo, "onlineCount" | "totalUsers" | "recentUsers">[] = [
  { id: "patient",      label: "Paciente",      description: "Agendamentos e jornada de saúde",   icon: Users,        gradient: "from-blue-500 to-blue-600",        route: "/dashboard?role=patient",     roleKey: "patient" },
  { id: "doctor",       label: "Médico",        description: "Consultas, prontuários e receitas", icon: Stethoscope,  gradient: "from-emerald-500 to-teal-600",     route: "/dashboard?role=doctor",      roleKey: "doctor" },
  { id: "clinic",       label: "Clínica",       description: "Gestão de médicos e afiliações",    icon: Building2,    gradient: "from-violet-500 to-purple-600",    route: "/dashboard?role=clinic",      roleKey: "clinic" },
  { id: "receptionist", label: "Recepção",      description: "Agendas, check-in e cobranças",     icon: Monitor,      gradient: "from-amber-500 to-orange-600",     route: "/dashboard?role=receptionist", roleKey: "receptionist" },
  { id: "support",      label: "Suporte",       description: "Tickets, logs e monitoramento",     icon: Headphones,   gradient: "from-rose-500 to-pink-600",        route: "/dashboard?role=support",     roleKey: "support" },
  { id: "partner",      label: "Parceiro",      description: "Validações e integrações",          icon: Handshake,    gradient: "from-teal-500 to-emerald-600",     route: "/dashboard?role=partner",     roleKey: "partner" },
  { id: "admin",        label: "Administração", description: "Controle total do sistema",         icon: ShieldCheck,  gradient: "from-primary to-blue-700",         route: "/dashboard?role=admin",       roleKey: "admin" },
  { id: "ai-assistant", label: "Assistente IA", description: "Chat, triagem e documentos",        icon: Bot,          gradient: "from-purple-500 to-fuchsia-600",   route: "/dashboard/ai-assistant",     roleKey: "ai-assistant" },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
};

const PanelCenter = () => {
  const navigate = useNavigate();
  const [panels, setPanels] = useState<PanelInfo[]>(
    PANELS.map(p => ({ ...p, onlineCount: 0, totalUsers: 0, recentUsers: [] }))
  );
  const [totalOnline, setTotalOnline] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchPresence = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const { data: onlineUsers } = await db
        .from("user_presence")
        .select("user_id, current_page, last_seen_at, is_online")
        .eq("is_online", true)
        .gte("last_seen_at", new Date(Date.now() - 5 * 60 * 1000).toISOString());

      const { data: allRoles } = await db.from("user_roles").select("user_id, role");
      const onlineUserIds = [...new Set((onlineUsers ?? []).map(u => u.user_id))];

      const onlineRolesMap: Map<string, string[]> = new Map();
      const profilesMap: Map<string, string> = new Map();

      if (onlineUserIds.length > 0) {
        const [{ data: onlineRoles }, { data: profiles }] = await Promise.all([
          db.from("user_roles").select("user_id, role").in("user_id", onlineUserIds),
          db.from("profiles").select("user_id, first_name, last_name").in("user_id", onlineUserIds),
        ]);
        (onlineRoles ?? []).forEach(r => {
          const ex = onlineRolesMap.get(r.user_id) ?? [];
          ex.push(r.role);
          onlineRolesMap.set(r.user_id, ex);
        });
        (profiles ?? []).forEach(p => {
          profilesMap.set(p.user_id, `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "Usuário");
        });
      }

      const roleTotals: Record<string, number> = {};
      (allRoles ?? []).forEach(r => { roleTotals[r.role] = (roleTotals[r.role] ?? 0) + 1; });

      const panelOnlineMap: Record<string, RecentUser[]> = {};
      (onlineUsers ?? []).forEach(u => {
        const page = u.current_page ?? "/dashboard";
        const roles = onlineRolesMap.get(u.user_id) ?? ["patient"];
        const name = profilesMap.get(u.user_id) ?? "Usuário";

        let panelId = "patient";
        if (page.includes("ai-assistant")) panelId = "ai-assistant";
        else if (page.includes("role=admin") || page.includes("/admin/")) panelId = "admin";
        else if (page.includes("role=doctor") || page.includes("/doctor/")) panelId = "doctor";
        else if (page.includes("role=receptionist") || page.includes("/reception/")) panelId = "receptionist";
        else if (page.includes("role=support")) panelId = "support";
        else if (page.includes("role=clinic") || page.includes("/clinic/")) panelId = "clinic";
        else if (page.includes("role=partner")) panelId = "partner";
        else if (roles.includes("doctor")) panelId = "doctor";
        else if (roles.includes("admin")) panelId = "admin";

        if (!panelOnlineMap[panelId]) panelOnlineMap[panelId] = [];
        panelOnlineMap[panelId].push({
          name,
          page: page.replace("/dashboard", "").replace("?role=", "").slice(0, 30) || "Início",
          lastSeen: u.last_seen_at,
        });
      });

      setPanels(PANELS.map(p => ({
        ...p,
        onlineCount: panelOnlineMap[p.id]?.length ?? 0,
        totalUsers: p.id === "ai-assistant" ? 0 : (roleTotals[p.roleKey] ?? 0),
        recentUsers: (panelOnlineMap[p.id] ?? []).slice(0, 5),
      })));
      setTotalOnline(onlineUserIds.length);
      setTotalUsers(new Set((allRoles ?? []).map(r => r.user_id)).size);
    } catch (e) {
      logError("PanelCenter fetch error", e);
    }
    setRefreshing(false);
    setLastRefresh(new Date());
  };

  useEffect(() => {
    fetchPresence();
    const interval = setInterval(() => fetchPresence(), 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const channel = db
      .channel("panel-center-presence")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_presence" }, () => fetchPresence())
      .subscribe();
    return () => { db.removeChannel(channel); };
  }, []);

  const liveActivity = useMemo(() => {
    const all: { name: string; page: string; lastSeen: string; panel: PanelInfo }[] = [];
    panels.forEach(p => p.recentUsers.forEach(u => all.push({ ...u, panel: p })));
    return all
      .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
      .slice(0, 8);
  }, [panels]);

  const activePanels = panels.filter(p => p.onlineCount > 0).length;

  const stats = [
    {
      label: "Online agora",
      sublabel: "Usuários conectados",
      value: totalOnline,
      icon: Users,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      sparkColor: "stroke-emerald-500",
    },
    {
      label: "Cadastrados",
      sublabel: "Novos usuários hoje",
      value: totalUsers,
      icon: UserPlus,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-600 dark:text-blue-400",
      sparkColor: "stroke-blue-500",
    },
    {
      label: "Painéis ativos",
      sublabel: "Em exibição agora",
      value: activePanels,
      icon: LayoutGrid,
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-600 dark:text-violet-400",
      sparkColor: "stroke-violet-500",
    },
    {
      label: "Total de painéis",
      sublabel: "Cadastrados no sistema",
      value: PANELS.length,
      icon: Layers,
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-600 dark:text-amber-400",
      sparkColor: "stroke-amber-500",
    },
  ];

  // Mini sparkline path generator (decorative)
  const sparkPaths = [
    "M0,18 L12,14 L24,16 L36,10 L48,12 L60,6 L72,9 L84,4 L96,7 L108,3 L120,5",
    "M0,15 L12,12 L24,14 L36,8 L48,11 L60,7 L72,10 L84,5 L96,8 L108,4 L120,6",
    "M0,14 L12,10 L24,13 L36,7 L48,9 L60,5 L72,8 L84,3 L96,6 L108,2 L120,4",
    "M0,16 L12,13 L24,15 L36,9 L48,11 L60,6 L72,10 L84,4 L96,7 L108,5 L120,3",
  ];

  return (
    <DashboardLayout title="Centro de Painéis" nav={getAdminNav("panel-center")}>
      <motion.div variants={container} initial="hidden" animate="show" className="w-full max-w-7xl mx-auto space-y-6 pb-24 md:pb-8">

        {/* ─────── HEADER ─────── */}
        <motion.section variants={fadeUp}>
          <Card className="overflow-hidden border-border/40 bg-card">
            <div className="grid lg:grid-cols-[1fr_auto] gap-0">
              {/* Left: title block */}
              <div className="p-5 md:p-6 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                    <LayoutGrid className="w-3 h-3" />
                    Centro de Controle
                  </span>
                  <Badge variant="secondary" className="gap-1.5 font-mono text-[10px] h-5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </span>
                    {format(lastRefresh, "HH:mm:ss")}
                  </Badge>
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                  Painéis da Plataforma
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {totalOnline} {totalOnline === 1 ? "pessoa online" : "pessoas online"} · atualizado {formatDistanceToNow(lastRefresh, { locale: ptBR, addSuffix: true })}
                </p>
              </div>

              {/* Right: Pingo */}
              <div className="hidden lg:flex items-end justify-center pr-6 pl-4 bg-gradient-to-br from-primary/[0.04] to-transparent">
                <img
                  src={pingoAdmin}
                  alt="Pingo Admin"
                  className="h-32 w-auto object-contain drop-shadow-md"
                  loading="lazy"
                />
              </div>
            </div>

          </Card>
        </motion.section>

        {/* ─────── KPI CARDS ─────── */}
        <motion.section
          variants={container}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
        >
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.label} variants={fadeUp}>
                <Card className="h-full border-border/40 bg-card hover:shadow-md transition-shadow overflow-hidden">
                  <CardContent className="p-4 md:p-5">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center shrink-0", s.iconBg)}>
                        <Icon className={cn("w-5 h-5", s.iconColor)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-2xl md:text-3xl font-black tabular-nums leading-none text-foreground">
                          {s.value}
                        </div>
                        <div className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-muted-foreground mt-1">
                          {s.label}
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground/80 mt-2 ml-[3.5rem] -translate-y-1">
                      {s.sublabel}
                    </p>
                    {/* Mini sparkline */}
                    <svg
                      viewBox="0 0 120 24"
                      className="w-full h-6 mt-1"
                      fill="none"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <path
                        d={sparkPaths[i]}
                        className={cn(s.sparkColor, "opacity-70")}
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.section>

        {/* ─────── MAIN GRID: Activity (left) + Quick info (right) ─────── */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Activity feed */}
          <motion.div variants={fadeUp} className="lg:col-span-2">
            <Card className="h-full border-border/40 bg-card/80 backdrop-blur-sm overflow-hidden">
              <div className="h-[2px] bg-gradient-to-r from-emerald-500 via-primary to-purple-500" />
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-bold text-foreground leading-tight">Atividade em tempo real</h2>
                    <p className="text-[11px] text-muted-foreground">{liveActivity.length} eventos · atualiza a cada 15s</p>
                  </div>
                </div>

                {liveActivity.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                      <Sparkles className="w-5 h-5 text-muted-foreground/60" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">Nenhum usuário online</p>
                    <p className="text-xs text-muted-foreground mt-0.5">A presença atualiza automaticamente</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {liveActivity.map((u, i) => {
                      const Icon = u.panel.icon;
                      return (
                        <motion.button
                          key={`${u.name}-${i}`}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          onClick={() => navigate(u.panel.route)}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors text-left group"
                        >
                          <div className={cn(
                            "shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm",
                            u.panel.gradient
                          )}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="relative flex h-1.5 w-1.5 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                              </span>
                              <p className="text-xs font-semibold text-foreground truncate">{u.name}</p>
                            </div>
                            <p className="text-[10.5px] text-muted-foreground font-mono truncate">
                              {u.panel.label} · {u.page || "/"}
                            </p>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick refresh / status card */}
          <motion.div variants={fadeUp}>
            <Card className="h-full border-border/40 bg-gradient-to-br from-primary/5 via-card to-card overflow-hidden">
              <CardContent className="p-5 flex flex-col h-full">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <RefreshCw className={cn("w-5 h-5 text-primary", refreshing && "animate-spin")} />
                </div>
                <h3 className="text-sm font-bold text-foreground">Sincronização</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Dados de presença em tempo real via Realtime do Supabase.
                </p>
                <div className="mt-4 space-y-2 text-[11px]">
                  <div className="flex justify-between items-center py-1.5 border-b border-border/40">
                    <span className="text-muted-foreground">Última atualização</span>
                    <span className="font-mono font-semibold text-foreground">{format(lastRefresh, "HH:mm:ss")}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-border/40">
                    <span className="text-muted-foreground">Intervalo</span>
                    <span className="font-mono font-semibold text-foreground">15s</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-muted-foreground">Painéis ativos</span>
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{activePanels}/{PANELS.length}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fetchPresence(true)}
                  disabled={refreshing}
                  className="mt-auto w-full gap-2 text-xs"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
                  Atualizar agora
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ─────── PANELS GRID ─────── */}
        <motion.section variants={fadeUp} className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-base md:text-lg font-bold text-foreground tracking-tight">Acesso aos painéis</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Entre em qualquer painel como administrador</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {panels.map((panel) => {
              const Icon = panel.icon;
              const hasOnline = panel.onlineCount > 0;
              return (
                <motion.div
                  key={panel.id}
                  variants={fadeUp}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    className={cn(
                      "relative overflow-hidden cursor-pointer group h-full",
                      "border-border/40 bg-card hover:shadow-lg hover:border-primary/30 transition-all duration-300"
                    )}
                    onClick={() => navigate(panel.route)}
                  >
                    <div className={cn("h-[2px] bg-gradient-to-r opacity-80 group-hover:opacity-100 transition-opacity", panel.gradient)} />

                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className={cn(
                          "w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300",
                          panel.gradient
                        )}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        {hasOnline && (
                          <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold ring-1 ring-emerald-500/20">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                            </span>
                            {panel.onlineCount}
                          </div>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                        {panel.label}
                      </h3>
                      <p className="text-[11.5px] text-muted-foreground mt-0.5 leading-snug line-clamp-2 min-h-[2.4em]">
                        {panel.description}
                      </p>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Users className="w-3 h-3" />
                          <span className="font-semibold text-foreground tabular-nums">{panel.totalUsers}</span>
                          <span>cadastros</span>
                        </div>
                        <div className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center group-hover:bg-primary transition-all duration-300">
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary-foreground group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

      </motion.div>
    </DashboardLayout>
  );
};

export default PanelCenter;
