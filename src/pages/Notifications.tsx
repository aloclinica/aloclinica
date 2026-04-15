import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getPatientNav } from "@/components/patient/patientNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, BellOff, CheckCheck, Calendar, CreditCard, FileText, MessageSquare, Heart, Stethoscope, ChevronRight, Sparkles, ArrowLeft } from "lucide-react";
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import mascotWave from "@/assets/mascot-wave.png";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

const TYPE_ICONS: Record<string, { icon: React.ReactNode; bg: string }> = {
  appointment: { icon: <Calendar className="w-5 h-5 text-primary" />, bg: "bg-primary/10" },
  payment: { icon: <CreditCard className="w-5 h-5 text-secondary" />, bg: "bg-secondary/10" },
  document: { icon: <FileText className="w-5 h-5 text-warning" />, bg: "bg-warning/10" },
  message: { icon: <MessageSquare className="w-5 h-5 text-primary" />, bg: "bg-primary/10" },
  health: { icon: <Heart className="w-5 h-5 text-destructive" />, bg: "bg-destructive/10" },
  system: { icon: <Bell className="w-5 h-5 text-muted-foreground" />, bg: "bg-muted" },
  consultation: { icon: <Stethoscope className="w-5 h-5 text-primary" />, bg: "bg-primary/10" },
};

const HEALTH_TIPS = [
  { title: "Check-up Preventivo", desc: "Agende seu check-up anual e cuide da sua saúde.", icon: "🩺" },
  { title: "Hidratação", desc: "Beba pelo menos 2L de água por dia.", icon: "💧" },
];

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("patient-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => fetchNotifications())
      .subscribe();
    return () => { db.removeChannel(channel); };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifications(data ?? []);
    setLoading(false);
  };

  const markAllRead = async () => {
    if (!user) return;
    await db.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const markRead = async (id: string) => {
    await db.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleClick = (n: Notification) => {
    markRead(n.id);
    if (n.link) navigate(n.link);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const filtered = filter === "unread" ? notifications.filter(n => !n.is_read) : notifications;

  // Group by time
  const groups: { label: string; items: Notification[] }[] = [];
  const today: Notification[] = [];
  const yesterday: Notification[] = [];
  const thisWeek: Notification[] = [];
  const older: Notification[] = [];

  filtered.forEach(n => {
    const d = new Date(n.created_at);
    if (isToday(d)) today.push(n);
    else if (isYesterday(d)) yesterday.push(n);
    else if (isThisWeek(d)) thisWeek.push(n);
    else older.push(n);
  });

  if (today.length) groups.push({ label: "Hoje", items: today });
  if (yesterday.length) groups.push({ label: "Ontem", items: yesterday });
  if (thisWeek.length) groups.push({ label: "Esta semana", items: thisWeek });
  if (older.length) groups.push({ label: "Anteriores", items: older });

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("notifications")}>
      <div className="w-full max-w-2xl mx-auto pb-24 md:pb-6">
        <button onClick={() => navigate("/dashboard?role=patient")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-[Manrope] text-3xl font-extrabold tracking-tight text-primary mb-2">
            Suas Notificações
            {unreadCount > 0 && (
              <Badge className="bg-destructive text-destructive-foreground text-[10px] px-1.5 h-5 ml-2 align-middle">{unreadCount}</Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">Fique por dentro das suas atualizações de saúde e consultas.</p>
        </div>

        {/* Pingo health tip hero — dark gradient banner */}
        <div className="relative rounded-2xl bg-gradient-to-br from-primary to-[hsl(215,60%,38%)] p-6 overflow-hidden shadow-xl mb-6">
          <div className="relative z-10 pr-20">
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-[10px] font-bold tracking-widest uppercase mb-3">
              <Sparkles className="w-3 h-3 inline mr-1" />Dica de Saúde
            </span>
            <h3 className="font-[Manrope] text-xl font-bold text-white mb-2">"Beba água agora!"</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              Pingu avisou: Manter a hidratação é essencial para sua concentração hoje. Que tal uma pausa para um copo d'água?
            </p>
          </div>
          <img src={mascotWave} alt="Pingo" className="absolute -right-4 -bottom-4 w-36 h-36 object-contain opacity-90 -rotate-12 drop-shadow-xl" loading="lazy" decoding="async" />
        </div>

        {unreadCount > 0 && (
          <div className="flex justify-end mb-4">
            <Button variant="ghost" size="sm" className="text-xs gap-1.5" onClick={markAllRead}>
              <CheckCheck className="w-4 h-4" /> Marcar tudo como lido
            </Button>
          </div>
        )}

        {/* Section label */}
        <h4 className="font-[Manrope] font-bold text-muted-foreground text-xs uppercase tracking-[0.2em] px-2 mb-4">Recentes</h4>

        {/* Notifications list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-3 p-4 rounded-2xl border border-border">
                <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-60" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-border bg-muted/10">
            <BellOff className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm font-semibold text-foreground">Nenhuma notificação</p>
            <p className="text-xs text-muted-foreground mt-1">
              {filter === "unread" ? "Todas as notificações foram lidas!" : "Suas notificações aparecerão aqui."}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {groups.map(group => (
              <div key={group.label}>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 px-1">{group.label}</p>
                <div className="space-y-2">
                  <AnimatePresence>
                    {group.items.map((n, i) => {
                      const typeConf = TYPE_ICONS[n.type] ?? TYPE_ICONS.system;
                      return (
                        <motion.div
                          key={n.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          onClick={() => handleClick(n)}
                          className={`flex items-start gap-4 p-5 rounded-2xl transition-all cursor-pointer active:scale-[0.98] ${
                            n.is_read
                              ? "bg-card hover:bg-muted/30"
                              : "bg-primary/5 hover:bg-primary/10"
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-full ${typeConf.bg} flex items-center justify-center shrink-0`}>
                            {typeConf.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h5 className={`text-sm leading-tight font-[Manrope] ${n.is_read ? "text-foreground" : "text-foreground font-bold"}`}>
                                {n.title}
                              </h5>
                              {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1">
                              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                            </p>
                          </div>
                          {n.link && <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-1" />}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom wellness cards */}
        {!loading && filtered.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-3">
            {HEALTH_TIPS.map((tip, i) => (
              <div key={i} className="p-4 rounded-2xl bg-card border border-border">
                <span className="text-2xl">{tip.icon}</span>
                <p className="text-sm font-bold text-foreground mt-2">{tip.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{tip.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
