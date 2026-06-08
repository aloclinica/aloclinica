import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "./DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import { getCartaoNav } from "@/components/cartao/cartaoNav";
import {
  Heart, IdentificationCard, Storefront, Sparkle, Crown,
  ArrowRight, QrCode, Receipt, Users, Headset, ForkKnife, Wallet,
  ShoppingCart, TrendUp, ArrowDown, ArrowUp, Lightning, ShieldCheck,
  CalendarBlank, CaretRight,
} from "@phosphor-icons/react";
import pingoLogo from "@/assets/pingo-cartao.png";

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 6) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
};

interface SubscriptionLite {
  id: string;
  card_number: string;
  status: string;
  current_period_end: string | null;
  total_savings: number | null;
  plan?: { name: string; tagline: string | null } | null;
}

interface TicketAccount {
  id: string;
  card_number: string;
  balance: number;
  status: string;
}

interface TicketTx {
  id: string;
  type: "credit" | "debit";
  amount: number;
  merchant: string | null;
  category: string | null;
  created_at: string;
}

/**
 * CartaoDashboard — painel de boas-vindas do titular do Cartão Benefícios.
 * Foco: carteirinha digital, rede credenciada, economia acumulada.
 * NÃO mostra agendamento de telemedicina (cliente diferente).
 */
const CartaoDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const nav = getCartaoNav("home");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionLite | null>(null);
  const [partnersCount, setPartnersCount] = useState(0);
  const [usageCount, setUsageCount] = useState(0);
  const [ticket, setTicket] = useState<TicketAccount | null>(null);
  const [ticketTxs, setTicketTxs] = useState<TicketTx[]>([]);

  useEffect(() => {
    if (!user) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const load = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [{ data: sub }, { count: pc }, { data: tk }, { data: txs }] = await Promise.all([
        db
          .from("pingo_card_subscriptions")
          .select("id, card_number, status, current_period_end, total_savings, plan:pingo_card_plans(name, tagline)")
          .eq("user_id", user!.id)
          .maybeSingle(),
        db
          .from("pingo_card_partners")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),
        db
          .from("pingo_ticket_accounts")
          .select("id, card_number, balance, status")
          .eq("user_id", user!.id)
          .maybeSingle(),
        db
          .from("pingo_ticket_transactions")
          .select("id, type, amount, merchant, category, created_at")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(4),
      ]);
      setSubscription((sub as SubscriptionLite) ?? null);
      setPartnersCount(pc ?? 0);
      setTicket((tk as TicketAccount | null) ?? null);
      setTicketTxs((txs as TicketTx[] | null) ?? []);

      if (sub?.id) {
        const { count: uc } = await db
          .from("pingo_card_transactions")
          .select("id", { count: "exact", head: true })
          .eq("subscription_id", sub.id);
        setUsageCount(uc ?? 0);
      }
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const firstName = profile?.first_name?.trim() || user?.email?.split("@")[0] || "titular";
  const isActive = subscription?.status === "active";
  const totalSavings = Number(subscription?.total_savings ?? 0);
  const ticketBalance = Number(ticket?.balance ?? 0);
  const ticketSpentMonth = ticketTxs
    .filter(t => t.type === "debit" && new Date(t.created_at).getMonth() === new Date().getMonth())
    .reduce((s, t) => s + Number(t.amount), 0);

  // Limite mensal estimado: saldo atual + gasto = teto de recarga visualizado
  const ticketCeiling = Math.max(ticketBalance + ticketSpentMonth, 1000);
  const ticketUsagePct = Math.min(100, Math.round((ticketSpentMonth / ticketCeiling) * 100));
  const renewDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    : null;

  const quickActions = [
    { label: "Carteirinha", icon: IdentificationCard, path: "/dashboard/cartao/carteirinha?role=cartao_beneficios", color: "hsl(340,75%,50%)" },
    { label: "Pingo Ticket", icon: ForkKnife, path: "/dashboard/cartao/ticket?role=cartao_beneficios", color: "hsl(155,55%,40%)" },
    { label: "Rede", icon: Storefront, path: "/dashboard/cartao/rede?role=cartao_beneficios", color: "hsl(190,70%,42%)" },
    { label: "Faturas", icon: Receipt, path: "/dashboard/cartao/faturas?role=cartao_beneficios", color: "hsl(38,92%,50%)" },
    { label: "Meu Plano", icon: Crown, path: "/dashboard/cartao/plano?role=cartao_beneficios", color: "hsl(45,90%,48%)" },
    { label: "Suporte", icon: Headset, path: "/dashboard/cartao/suporte?role=cartao_beneficios", color: "hsl(220,70%,55%)" },
  ];

  return (
    <DashboardLayout title="Cartão Benefícios" nav={nav} role="cartao_beneficios">
      <div className="space-y-6 max-w-6xl mx-auto pb-20">
        {/* Hero saudação */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden border-0 text-white shadow-xl relative">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(340,75%,42%)_0%,hsl(345,70%,48%)_45%,hsl(15,75%,55%)_100%)]" />
            <div className="absolute inset-0 opacity-25 mix-blend-screen bg-[radial-gradient(circle_at_85%_15%,rgba(255,220,150,0.6),transparent_45%),radial-gradient(circle_at_15%_85%,rgba(255,180,220,0.4),transparent_50%)]" />
            <CardContent className="relative p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <Badge className="mb-3 bg-white/20 text-white border-0 backdrop-blur">
                    <Heart size={12} weight="fill" className="mr-1" /> CARTÃO BENEFÍCIOS
                  </Badge>
                  <h1 className="text-2xl md:text-3xl font-bold mb-1">
                    {getGreeting()}, {firstName}!
                  </h1>
                  <p className="text-white/85 text-sm md:text-base">
                    {isActive
                      ? `Seu plano ${subscription?.plan?.name ?? "Cartão"} está ativo · ${partnersCount} parceiros disponíveis.`
                      : "Ative um plano para começar a economizar em farmácias, exames e mais."}
                  </p>
                  {/* Mini KPIs inline */}
                  <div className="mt-5 flex flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur px-3 py-1.5 rounded-full text-[12px] font-semibold">
                      <ShieldCheck size={13} weight="fill" className="text-emerald-200" />
                      {isActive ? "Plano ativo" : "Sem plano"}
                    </div>
                    {renewDate && (
                      <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur px-3 py-1.5 rounded-full text-[12px] font-semibold">
                        <CalendarBlank size={13} weight="fill" /> Renova em {renewDate}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur px-3 py-1.5 rounded-full text-[12px] font-semibold">
                      <Sparkle size={13} weight="fill" className="text-amber-200" />
                      {formatBRL(totalSavings)} economizados
                    </div>
                  </div>
                </div>
                <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/15 items-center justify-center shrink-0 backdrop-blur">
                  <Crown size={28} weight="fill" className="text-amber-200" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick actions */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5">
          {quickActions.map((a, i) => (
            <motion.button
              key={a.label}
              onClick={() => navigate(a.path)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
              className="group flex flex-col items-center gap-2 p-3 md:p-4 rounded-2xl bg-card border border-border/50 hover:shadow-lg hover:border-border transition-all"
            >
              <div
                className="w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110"
                style={{ background: `${a.color}15`, color: a.color }}
              >
                <a.icon size={20} weight="fill" />
              </div>
              <span className="text-[11px] md:text-xs font-semibold text-center leading-tight">{a.label}</span>
            </motion.button>
          ))}
        </div>

        {/* PINGO TICKET — destaque */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="overflow-hidden border-0 shadow-xl rounded-3xl">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-[1.1fr_1fr]">
                {/* Lado esquerdo — gradiente verde com saldo */}
                <button
                  type="button"
                  onClick={() => navigate("/dashboard/cartao/ticket?role=cartao_beneficios")}
                  className="relative text-left p-6 md:p-7 text-white bg-[linear-gradient(135deg,#053b2a_0%,#0a6e4d_45%,#10a37a_100%)] group overflow-hidden"
                >
                  <div className="absolute inset-0 opacity-25 mix-blend-screen bg-[conic-gradient(from_135deg_at_70%_30%,transparent_0deg,rgba(180,255,220,0.5)_60deg,transparent_120deg,rgba(255,240,180,0.3)_220deg,transparent_300deg)]" />
                  <div
                    className="absolute -inset-x-1/2 -inset-y-1/2 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.18)_50%,transparent_60%)] translate-x-[-100%] group-hover:translate-x-[100%] transition-transform"
                    style={{ transitionDuration: "1400ms" }}
                  />
                  <div className="relative flex items-center gap-2.5 mb-4">
                    <div className="w-9 h-9 rounded-full bg-white/95 ring-2 ring-emerald-200/70 flex items-center justify-center overflow-hidden">
                      <img src={pingoLogo} alt="Pingo" className="w-7 h-7 object-contain" />
                    </div>
                    <div className="leading-tight">
                      <p className="text-[9px] tracking-[0.25em] text-emerald-100/90 font-semibold">PINGO TICKET</p>
                      <p className="text-[12px] font-bold flex items-center gap-1">
                        <ForkKnife size={11} weight="fill" /> Vale Alimentação
                      </p>
                    </div>
                  </div>
                  <p className="relative text-[10px] uppercase tracking-[0.2em] font-bold text-white/70">Saldo disponível</p>
                  <p className="relative text-3xl md:text-4xl font-extrabold tabular-nums mt-1">
                    {loading ? "—" : formatBRL(ticketBalance)}
                  </p>
                  {/* Barra de uso mensal */}
                  <div className="relative mt-3 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-white/80">
                      <span>Uso do mês</span>
                      <span className="tabular-nums">{ticketUsagePct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${ticketUsagePct}%` }}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-amber-200 to-white rounded-full"
                      />
                    </div>
                  </div>
                  <div className="relative mt-4 inline-flex items-center gap-2 text-[12px] font-semibold bg-white/15 backdrop-blur px-3 py-1.5 rounded-full">
                    <ShoppingCart size={14} weight="fill" /> Pagar com Pingo Ticket
                    <ArrowRight size={12} weight="bold" />
                  </div>
                </button>

                {/* Lado direito — últimas transações */}
                <div className="p-6 bg-card">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Últimos gastos</p>
                    <button
                      onClick={() => navigate("/dashboard/cartao/ticket?role=cartao_beneficios")}
                      className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 hover:underline"
                    >
                      Ver extrato <CaretRight size={11} weight="bold" />
                    </button>
                  </div>
                  {ticketTxs.length === 0 ? (
                    loadError ? (
                      <div className="text-center py-6 text-sm">
                        <p className="font-semibold text-foreground">Falha ao carregar transações</p>
                        <p className="text-xs text-muted-foreground mb-3">Verifique sua conexão e tente novamente.</p>
                        <button onClick={() => load()} className="text-xs font-semibold text-primary hover:underline">Recarregar</button>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-sm text-muted-foreground">
                        <ForkKnife size={28} className="mx-auto mb-2 opacity-40" />
                        Nenhum gasto ainda. Use seu Pingo Ticket no primeiro estabelecimento!
                      </div>
                    )
                  ) : (
                    <ul className="space-y-1.5">
                      {ticketTxs.slice(0, 4).map(t => {
                        const debit = t.type === "debit";
                        return (
                          <li key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${debit ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                              {debit ? <ArrowUp size={13} weight="bold" /> : <ArrowDown size={13} weight="bold" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-semibold truncate">{t.merchant ?? (debit ? "Pagamento" : "Recarga")}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {t.category ?? "—"} · {new Date(t.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                              </p>
                            </div>
                            <p className={`text-[13px] font-bold tabular-nums ${debit ? "text-rose-700" : "text-emerald-700"}`}>
                              {debit ? "-" : "+"}{formatBRL(Number(t.amount))}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Gasto no mês</span>
                    <span className="font-bold text-foreground tabular-nums flex items-center gap-1">
                      <TrendUp size={11} weight="bold" className="text-emerald-600" />
                      {formatBRL(ticketSpentMonth)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* KPIs */}
        {loading ? (
          <div className="grid sm:grid-cols-4 gap-4">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Saldo Ticket", value: formatBRL(ticketBalance), icon: Wallet, ringClass: "bg-emerald-100 text-emerald-700", hint: "Disponível agora" },
              { label: "Economia", value: formatBRL(totalSavings), icon: Sparkle, ringClass: "bg-amber-100 text-amber-700", hint: "Acumulada" },
              { label: "Usos do cartão", value: String(usageCount), icon: QrCode, ringClass: "bg-blue-100 text-blue-700", hint: "Apresentações" },
              { label: "Parceiros", value: String(partnersCount), icon: Storefront, ringClass: "bg-rose-100 text-rose-700", hint: "Rede credenciada" },
            ].map((k, i) => (
              <motion.div
                key={k.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
              >
                <Card className="rounded-2xl border-border/50 hover:border-border hover:shadow-md transition-all h-full">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${k.ringClass}`}>
                        <k.icon size={20} weight="fill" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold">{k.label}</p>
                        <p className="text-lg sm:text-xl font-bold tabular-nums truncate">{k.value}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-[10px] text-muted-foreground">{k.hint}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Trio: Carteirinha · Família · Suporte (grade) */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Carteirinha / Ativação */}
          <Card className="rounded-2xl border-border/50 hover:shadow-lg transition group cursor-pointer overflow-hidden"
            onClick={() => navigate(isActive ? "/dashboard/cartao/carteirinha?role=cartao_beneficios" : "/dashboard/cartao/plano?role=cartao_beneficios")}>
            <div className="h-1.5 bg-gradient-to-r from-rose-500 to-pink-600" />
            <CardContent className="p-5 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-md">
                <IdentificationCard size={24} weight="fill" />
              </div>
              <div>
                <p className="font-bold text-[15px]">
                  {isActive ? "Carteirinha digital" : "Ative sua carteirinha"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isActive
                    ? "QR Code para apresentar na rede."
                    : "Escolha um plano e gere seu cartão."}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 group-hover:gap-2 transition-all">
                {isActive ? "Abrir" : "Ver planos"} <ArrowRight size={13} weight="bold" />
              </span>
            </CardContent>
          </Card>

          {/* Dependentes */}
          <Card className="rounded-2xl border-border/50 hover:shadow-lg transition group cursor-pointer overflow-hidden"
            onClick={() => navigate("/dashboard/cartao/dependentes?role=cartao_beneficios")}>
            <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
            <CardContent className="p-5 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
                <Users size={24} weight="fill" />
              </div>
              <div>
                <p className="font-bold text-[15px]">Sua família coberta</p>
                <p className="text-xs text-muted-foreground mt-0.5">Inclua até 4 dependentes no plano.</p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 group-hover:gap-2 transition-all">
                Gerenciar <ArrowRight size={13} weight="bold" />
              </span>
            </CardContent>
          </Card>

          {/* Suporte */}
          <Card className="rounded-2xl border-border/50 hover:shadow-lg transition group cursor-pointer overflow-hidden"
            onClick={() => navigate("/dashboard/cartao/suporte?role=cartao_beneficios")}>
            <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-600" />
            <CardContent className="p-5 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md">
                <Headset size={24} weight="fill" />
              </div>
              <div>
                <p className="font-bold text-[15px]">Suporte 24/7</p>
                <p className="text-xs text-muted-foreground mt-0.5">Chat com nossa equipe a qualquer hora.</p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 group-hover:gap-2 transition-all">
                Abrir chat <ArrowRight size={13} weight="bold" />
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Dica/CTA promocional */}
        <Card className="rounded-2xl border-amber-200/60 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-transparent">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <Lightning size={22} weight="fill" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">Dica do dia</p>
              <p className="text-xs text-muted-foreground">
                Use seu Pingo Ticket em supermercados parceiros e ganhe até <span className="font-bold text-amber-700">5% de cashback</span> em produtos selecionados.
              </p>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl border-amber-300 text-amber-800 hover:bg-amber-100"
              onClick={() => navigate("/dashboard/cartao/rede?role=cartao_beneficios")}>
              Ver parceiros
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CartaoDashboard;
