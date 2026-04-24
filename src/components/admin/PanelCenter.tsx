import { logError } from "@/lib/logger";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminNav } from "@/components/admin/adminNav";
import {
  Users, Stethoscope, Building2, Headphones, LayoutGrid,
  Handshake, Bot, ShieldCheck, ArrowRight,
  Activity, RefreshCw, Globe, FileSearch, Monitor,
  Zap, TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { HeroBanner } from "@/components/dashboards/HeroBanner";
import { StatBento } from "@/components/dashboards/StatBento";
import { ActionPills } from "@/components/dashboards/ActionPills";
import pingoAdmin from "@/assets/pingo-admin.png";

interface PanelInfo {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
  accentRing: string;
  route: string;
  roleKey: string;
  onlineCount: number;
  totalUsers: number;
  recentUsers: { name: string; page: string; lastSeen: string }[];
}

// ── Painéis agrupados por serviço ──
const SERVICES_CONFIG: Record<string, { name: string; emoji: string; color: string; description: string; roles: any[] }> = {
  telemedicina: {
    name: "Telemedicina 🩺",
    emoji: "🩺",
    color: "from-blue-500 to-cyan-500",
    description: "Consultas online, pacientes e médicos",
    roles: [
      { id: "patient", label: "Paciente", description: "Agendamentos, consultas e saúde", icon: Users, gradient: "from-blue-500 to-blue-600", iconBg: "bg-blue-500/12", accentRing: "ring-blue-500/20", route: "/dashboard?role=patient", roleKey: "patient" },
      { id: "doctor", label: "Médico", description: "Consultas, prontuários e receitas", icon: Stethoscope, gradient: "from-emerald-500 to-teal-600", iconBg: "bg-emerald-500/12", accentRing: "ring-emerald-500/20", route: "/dashboard?role=doctor", roleKey: "doctor" },
    ]
  },
  cartao: {
    name: "Cartão Benefícios 💳",
    emoji: "💳",
    color: "from-amber-500 to-orange-500",
    description: "Plano mensal, desconto e benefícios",
    roles: []
  }
};

const PANELS: Omit<PanelInfo, "onlineCount" | "totalUsers" | "recentUsers">[] = [
  // Telemedicina
  { id: "patient", label: "Paciente", description: "Agendamentos, consultas e saúde", icon: Users, gradient: "from-blue-500 to-blue-600", iconBg: "bg-blue-500/12", accentRing: "ring-blue-500/20", route: "/dashboard?role=patient", roleKey: "patient" },
  { id: "doctor", label: "Médico", description: "Consultas, prontuários e receitas", icon: Stethoscope, gradient: "from-emerald-500 to-teal-600", iconBg: "bg-emerald-500/12", accentRing: "ring-emerald-500/20", route: "/dashboard?role=doctor", roleKey: "doctor" },
  // Support
  { id: "receptionist", label: "Recepção", description: "Agendas, check-in e cobranças", icon: Monitor, gradient: "from-amber-500 to-orange-600", iconBg: "bg-amber-500/12", accentRing: "ring-amber-500/20", route: "/dashboard?role=receptionist", roleKey: "receptionist" },
  { id: "support", label: "Suporte", description: "Tickets, logs e monitoramento", icon: Headphones, gradient: "from-rose-500 to-pink-600", iconBg: "bg-rose-500/12", accentRing: "ring-rose-500/20", route: "/dashboard?role=support", roleKey: "support" },
  { id: "partner", label: "Parceiro", description: "Validações e integrações", icon: Handshake, gradient: "from-teal-500 to-emerald-600", iconBg: "bg-teal-500/12", accentRing: "ring-teal-500/20", route: "/dashboard?role=partner", roleKey: "partner" },
  // Admin
  { id: "admin", label: "Administração", description: "Controle total do sistema", icon: ShieldCheck, gradient: "from-primary to-blue-700", iconBg: "bg-primary/12", accentRing: "ring-primary/20", route: "/dashboard?role=admin", roleKey: "admin" },
  { id: "ai-assistant", label: "Assistente IA", description: "Chat, triagem e documentos", icon: Bot, gradient: "from-purple-500 to-fuchsia-600", iconBg: "bg-purple-500/12", accentRing: "ring-purple-500/20", route: "/dashboard/ai-assistant", roleKey: "ai-assistant" },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
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

      const { data: allRoles } = await db
        .from("user_roles")
        .select("user_id, role");

      const onlineUserIds = [...new Set((onlineUsers ?? []).map(u => u.user_id))];
      
      const onlineRolesMap: Map<string, string[]> = new Map();
      if (onlineUserIds.length > 0) {
        const { data: onlineRoles } = await db
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", onlineUserIds);
        
        (onlineRoles ?? []).forEach(r => {
          const existing = onlineRolesMap.get(r.user_id) ?? [];
          existing.push(r.role);
          onlineRolesMap.set(r.user_id, existing);
        });
      }

      const profilesMap: Map<string, string> = new Map();
      if (onlineUserIds.length > 0) {
        const { data: profiles } = await db
          .from("profiles")
          .select("user_id, first_name, last_name")
          .in("user_id", onlineUserIds);
        
        (profiles ?? []).forEach(p => {
          profilesMap.set(p.user_id, `${p.first_name} ${p.last_name}`.trim() || "Usuário");
        });
      }

      const roleTotals: Record<string, number> = {};
      (allRoles ?? []).forEach(r => {
        roleTotals[r.role] = (roleTotals[r.role] ?? 0) + 1;
      });

      const panelOnlineMap: Record<string, { name: string; page: string; lastSeen: string }[]> = {};
      
      (onlineUsers ?? []).forEach(u => {
        const page = u.current_page ?? "/dashboard";
        const roles = onlineRolesMap.get(u.user_id) ?? ["patient"];
        const name = profilesMap.get(u.user_id) ?? "Usuário";

        let panelId = "patient";
        if (page.includes("ai-assistant")) panelId = "ai-assistant";
        else if (page.includes("role=admin") || page.includes("/admin/")) panelId = "admin";
        else if (page.includes("role=laudista") || page.includes("/laudista/")) panelId = "laudista";
        else if (page.includes("role=doctor") || page.includes("/doctor/") || page.includes("/availability") || page.includes("/prescriptions") || page.includes("/earnings") || page.includes("/patients") || page.includes("/certificates")) panelId = "doctor";
        else if (page.includes("role=receptionist") || page.includes("/reception/")) panelId = "receptionist";
        else if (page.includes("role=support")) panelId = "support";
        else if (page.includes("role=clinic") || page.includes("/clinic/")) panelId = "clinic";
        else if (page.includes("role=partner")) panelId = "partner";
        else if (roles.includes("doctor") && !page.includes("role=")) panelId = "doctor";
        else if (roles.includes("admin") && !page.includes("role=")) panelId = "admin";
        else panelId = "patient";

        if (!panelOnlineMap[panelId]) panelOnlineMap[panelId] = [];
        panelOnlineMap[panelId].push({
          name,
          page: page.replace("/dashboard", "").replace("?role=", "").slice(0, 30) || "Início",
          lastSeen: u.last_seen_at,
        });
      });

      const updatedPanels = PANELS.map(p => ({
        ...p,
        onlineCount: panelOnlineMap[p.id]?.length ?? 0,
        totalUsers: p.id === "ai-assistant" ? 0 : (roleTotals[p.roleKey] ?? 0),
        recentUsers: (panelOnlineMap[p.id] ?? []).slice(0, 5),
      }));

      setPanels(updatedPanels);
      setTotalOnline(onlineUserIds.length);
      
      const uniqueUserIds = new Set((allRoles ?? []).map(r => r.user_id));
      setTotalUsers(uniqueUserIds.size);
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
      .on("postgres_changes", { event: "*", schema: "public", table: "user_presence" }, () => {
        fetchPresence();
      })
      .subscribe();
    return () => { db.removeChannel(channel); };
  }, []);

  return (
    <DashboardLayout title="Centro de Painéis" nav={getAdminNav("switch-panel")}>
      <motion.div variants={container} initial="hidden" animate="show" className="w-full max-w-6xl space-y-6 pb-24 md:pb-8">

        {/* Hero Banner */}
        <div className="-mx-4 -mt-5 md:-mx-6 md:-mt-5 lg:-mx-8 lg:-mt-6">
          <HeroBanner
            gradient="from-[#0f172a] via-[#1e293b] to-[#334155]"
            pingoSrc={pingoAdmin}
            pingoAlt="Pingo Admin"
            liveDot={totalOnline > 0}
            liveColor="green"
            bubble={{
              greeting: "🎛️ Centro de Controle",
              name: "Painéis da Plataforma",
              sub: `${totalOnline} usuário${totalOnline !== 1 ? "s" : ""} online agora`,
            }}
            kpis={[
              { label: "Online", value: totalOnline },
              { label: "Total", value: totalUsers },
              { label: "Painéis", value: PANELS.length },
              { label: "Ativos", value: panels.filter(p => p.onlineCount > 0).length },
            ]}
            loading={false}
            onRefresh={() => fetchPresence(true)}
            refreshing={refreshing}
          />
        </div>

        {/* Quick Action Pills */}
        <ActionPills title="Acesso rápido" actions={[
          { label: "Admin", icon: "⚙️", iconBg: "bg-red-50 dark:bg-red-950/30", path: "/dashboard?role=admin" },
          { label: "Médicos", icon: "🩺", iconBg: "bg-emerald-50 dark:bg-emerald-950/30", path: "/dashboard?role=doctor" },
          { label: "Pacientes", icon: "👤", iconBg: "bg-blue-50 dark:bg-blue-950/30", path: "/dashboard?role=patient" },
          { label: "Clínica", icon: "🏢", iconBg: "bg-violet-50 dark:bg-violet-950/30", path: "/dashboard?role=clinic" },
          { label: "IA", icon: "🤖", iconBg: "bg-purple-50 dark:bg-purple-950/30", path: "/dashboard/ai-assistant" },
        ]} />

        {/* Stats */}
        <StatBento loading={false} stats={[
          { label: "Usuários online", value: totalOnline, icon: "🟢", iconBg: "bg-emerald-50 dark:bg-emerald-950/30", valueClass: "text-emerald-700 dark:text-emerald-400", accentClass: "bg-emerald-500" },
          { label: "Total cadastrados", value: totalUsers, icon: "👥", iconBg: "bg-blue-50 dark:bg-blue-950/30", valueClass: "text-blue-700 dark:text-blue-400", accentClass: "bg-blue-500" },
          { label: "Painéis ativos", value: panels.filter(p => p.onlineCount > 0).length, icon: "📊", iconBg: "bg-violet-50 dark:bg-violet-950/30", valueClass: "text-violet-600 dark:text-violet-400", accentClass: "bg-violet-500" },
          { label: "Última atualização", value: format(lastRefresh, "HH:mm", { locale: ptBR }), icon: "🕐", iconBg: "bg-amber-50 dark:bg-amber-950/30", valueClass: "text-amber-600 dark:text-amber-400", accentClass: "bg-amber-500" },
        ]} />

        {/* Service Cards - 4 Main Services */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(SERVICES_CONFIG).slice(0, 4).map(([key, service]) => {
            const serviceRoles = service.roles;
            const serviceOnline = serviceRoles.reduce((sum, role) => {
              const panel = panels.find(p => p.id === role.id);
              return sum + (panel?.onlineCount ?? 0);
            }, 0);
            const serviceTotal = serviceRoles.reduce((sum, role) => {
              const panel = panels.find(p => p.id === role.id);
              return sum + (panel?.totalUsers ?? 0);
            }, 0);

            return (
              <motion.div
                key={key}
                variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.25 } }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className={`card-interactive relative overflow-hidden group border-border/40 bg-gradient-to-br ${service.color} bg-opacity-5 backdrop-blur-sm hover:shadow-lg transition-all duration-300 ring-1 ring-transparent hover:ring-opacity-30`}>
                  <div className={`h-1 bg-gradient-to-r ${service.color}`} />

                  <CardContent className="p-5 pt-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <div className={`text-3xl`}>{service.emoji}</div>
                        <div>
                          <h3 className="font-bold text-base text-foreground">{service.name}</h3>
                          <p className="text-xs text-muted-foreground">{service.description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Service metrics */}
                    <div className="grid grid-cols-2 gap-3 mb-4 pt-3 border-t border-border/40">
                      <div className="bg-muted/30 rounded-lg p-2.5">
                        <p className="text-[10px] text-muted-foreground font-medium mb-1">Online</p>
                        <p className="text-lg font-bold text-foreground">{serviceOnline}</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-2.5">
                        <p className="text-[10px] text-muted-foreground font-medium mb-1">Total</p>
                        <p className="text-lg font-bold text-foreground">{serviceTotal}</p>
                      </div>
                    </div>

                    {/* Quick links to roles */}
                    <div className="space-y-1.5">
                      {serviceRoles.length > 0 ? (
                        serviceRoles.map(role => (
                          <button
                            key={role.id}
                            onClick={() => navigate(role.route)}
                            className="w-full text-left text-xs py-2 px-2.5 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors text-foreground font-medium flex items-center justify-between group/btn"
                          >
                            <span className="truncate">{role.label}</span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground group-hover/btn:translate-x-0.5 transition-transform opacity-0 group-hover/btn:opacity-100" />
                          </button>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground italic p-2">Em breve</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Presence bar */}
        <motion.div variants={fadeUp}>
          <Card className="card-interactive border-border/40 bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary via-secondary to-purple-500" />
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-bold text-foreground">Presença em Tempo Real</span>
                <span className="text-[10px] text-muted-foreground ml-auto font-mono bg-muted/50 px-2 py-0.5 rounded-md">
                  {format(lastRefresh, "HH:mm:ss", { locale: ptBR })}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {panels.filter(p => p.onlineCount > 0).map(p => {
                  const Icon = p.icon;
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Badge
                        variant="secondary"
                        className={`gap-1.5 text-xs py-1.5 px-3 ring-1 ${p.accentRing} bg-card hover:scale-105 transition-transform cursor-default`}
                      >
                        <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${p.gradient} flex items-center justify-center`}>
                          <Icon className="w-3 h-3 text-white" />
                        </div>
                        {p.label}: <span className="font-bold text-foreground">{p.onlineCount}</span>
                      </Badge>
                    </motion.div>
                  );
                })}
                {panels.every(p => p.onlineCount === 0) && (
                  <span className="text-xs text-muted-foreground italic">Nenhum usuário online no momento</span>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* All Panels Grid */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-2 mb-4">
            <LayoutGrid className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Todos os Painéis</h2>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {panels.map((panel) => {
            const Icon = panel.icon;
            const hasOnline = panel.onlineCount > 0;
            return (
              <motion.div
                key={panel.id}
                variants={fadeUp}
                whileHover={{ y: -6, transition: { duration: 0.25, ease: "easeOut" } }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className="card-interactive relative overflow-hidden cursor-pointer group border-border/40 bg-card/90 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 ring-1 ring-transparent hover:ring-primary/20"
                  onClick={() => navigate(panel.route)}
                >
                  {/* Top gradient accent line */}
                  <div className={`h-1 bg-gradient-to-r ${panel.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />
                  
                  {/* Subtle corner glow on hover */}
                  <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${panel.gradient} opacity-0 group-hover:opacity-[0.06] blur-2xl transition-opacity duration-500 pointer-events-none`} />

                  {/* Online ping badge */}
                  {hasOnline && (
                    <div className="absolute top-4 right-4 z-10">
                      <div className="relative flex items-center gap-1.5 bg-success/10 text-success px-2.5 py-1 rounded-full text-xs font-bold">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                        </span>
                        {panel.onlineCount}
                      </div>
                    </div>
                  )}

                  <CardContent className="p-5 pt-4">
                    <div className="flex items-start gap-4">
                      {/* Icon with gradient background */}
                      <div className={`relative w-13 h-13 rounded-2xl bg-gradient-to-br ${panel.gradient} flex items-center justify-center shrink-0 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}
                        style={{ width: 52, height: 52 }}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{panel.label}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{panel.description}</p>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/40">
                      {panel.totalUsers > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Users className="w-3.5 h-3.5" />
                          <span className="font-medium">{panel.totalUsers}</span>
                          <span>cadastrados</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span className="font-medium">{panel.onlineCount}</span>
                        <span>online</span>
                      </div>
                      <div className="ml-auto w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center group-hover:bg-primary group-hover:shadow-lg group-hover:shadow-primary/25 transition-all duration-300">
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary-foreground group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>

                    {/* Recent online users */}
                    {panel.recentUsers.length > 0 && (
                      <div className="mt-3 space-y-1.5 bg-muted/30 rounded-xl p-2.5">
                        {panel.recentUsers.slice(0, 3).map((u, i) => (
                          <div key={i} className="flex items-center gap-2 text-[11px]">
                            <span className="relative flex h-2 w-2 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                            </span>
                            <span className="text-foreground font-medium truncate">{u.name}</span>
                            <span className="text-muted-foreground ml-auto truncate max-w-[80px] font-mono text-[10px]">{u.page}</span>
                          </div>
                        ))}
                        {panel.recentUsers.length > 3 && (
                          <p className="text-[10px] text-muted-foreground pl-4">
                            +{panel.recentUsers.length - 3} mais...
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default PanelCenter;
