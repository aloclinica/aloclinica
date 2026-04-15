import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getDoctorNav } from "./doctorNav";
import { TrendingUp, Wallet, ArrowUpRight, Clock, CheckCircle2, XCircle, Building2, AlertCircle } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { toast } from "sonner";

const PLATFORM_PERCENT = 50;
const DEFAULT_DOCTOR_PERCENT = 50;
const MIN_WITHDRAWAL = 50;

const DoctorEarnings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, pending: 0, thisMonth: 0, totalAppts: 0, available: 0 });
  const [monthlyData, setMonthlyData] = useState<{ month: string; consultas: number; valor: number }[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pixKey, setPixKey] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clinicInfo, setClinicInfo] = useState<{ name: string; percent: number } | null>(null);

  useEffect(() => { if (user) fetchEarnings(); }, [user]);

  const fetchEarnings = async () => {
    const { data: docProfile } = await db.from("doctor_profiles").select("id, consultation_price").eq("user_id", user!.id).single();
    if (!docProfile) { setLoading(false); return; }

    // Check clinic affiliation for commission percent (issue #16)
    const { data: affiliation } = await supabase
      .from("clinic_affiliations")
      .select("commission_percent, clinic_id, clinic_profiles(name)")
      .eq("doctor_id", docProfile.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    const doctorPercent = affiliation ? Number(affiliation.commission_percent) : DEFAULT_DOCTOR_PERCENT;
    if (affiliation) {
      setClinicInfo({
        name: (affiliation as { clinic_profiles?: { name?: string } | null }).clinic_profiles?.name ?? "Clínica",
        percent: doctorPercent,
      });
    }

    const [confirmedRes, pendingRes, withdrawRes, walletRes] = await Promise.all([
      // Only count appointments with confirmed payment (issue #5)
      supabase
        .from("appointments")
        .select("id, scheduled_at, status, payment_status, price_at_booking")
        .eq("doctor_id", docProfile.id)
        .eq("status", "completed")
        .in("payment_status", ["approved", "confirmed", "received"])
        .order("scheduled_at", { ascending: false }),
      supabase
        .from("appointments")
        .select("id, scheduled_at, price_at_booking")
        .eq("doctor_id", docProfile.id)
        .eq("status", "completed")
        .eq("payment_status", "pending")
        .order("scheduled_at", { ascending: false }),
      supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    const confirmedAppts = confirmedRes.data ?? [];
    const pendingAppts = pendingRes.data ?? [];
    setWithdrawals(withdrawRes.data ?? []);

    const defaultPrice = Number(docProfile.consultation_price) || 89;

    // Use price_at_booking if available, otherwise fallback (issue #13)
    const getPrice = (appt: { price_at_booking?: number | null }) => Number(appt.price_at_booking) || defaultPrice;

    // Use wallet_transactions as source of truth if available
    const walletTxns = walletRes.data ?? [];
    const walletCredits = walletTxns.filter((t: any) => t.type === 'credit' || t.type === 'refund').reduce((s: number, t: any) => s + Number(t.amount), 0);
    const walletDebits = walletTxns.filter((t: any) => t.type === 'withdrawal' || t.type === 'debit').reduce((s: number, t: any) => s + Number(t.amount), 0);
    const hasWalletData = walletTxns.length > 0;

    const totalEarned = hasWalletData ? walletCredits : confirmedAppts.reduce((sum, a) => sum + getPrice(a) * (doctorPercent / 100), 0);
    const totalPending = pendingAppts.reduce((sum, a) => sum + getPrice(a) * (doctorPercent / 100), 0);
    const availableBalance = hasWalletData ? Math.max(0, walletCredits - walletDebits) : Math.max(0, totalEarned - (withdrawRes.data ?? []).filter(w => w.status === "approved").reduce((sum: number, w: { amount: number }) => sum + Number(w.amount), 0));

    const now = new Date();
    const monthStart = startOfMonth(now);
    const thisMonthAppts = confirmedAppts.filter(a => new Date(a.scheduled_at) >= monthStart);

    setStats({
      total: totalEarned,
      pending: totalPending,
      thisMonth: thisMonthAppts.reduce((sum, a) => sum + getPrice(a) * (doctorPercent / 100), 0),
      totalAppts: confirmedAppts.length,
      available: availableBalance,
    });

    // Last 6 months chart
    const chartData: { month: string; consultas: number; valor: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(now, i);
      const mStart = startOfMonth(m);
      const mEnd = endOfMonth(m);
      const monthAppts = confirmedAppts.filter(a => {
        const d = new Date(a.scheduled_at);
        return d >= mStart && d <= mEnd;
      });
      chartData.push({
        month: format(m, "MMM", { locale: ptBR }),
        consultas: monthAppts.length,
        valor: monthAppts.reduce((sum, a) => sum + getPrice(a) * (doctorPercent / 100), 0),
      });
    }
    setMonthlyData(chartData);
    setLoading(false);
  };

  const requestWithdrawal = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < MIN_WITHDRAWAL) {
      toast.error(`Valor mínimo para saque: R$ ${MIN_WITHDRAWAL.toFixed(2)}`);
      return;
    }
    if (amount > stats.available) {
      toast.error("Valor superior ao saldo disponível");
      return;
    }
    if (!pixKey.trim()) {
      toast.error("Informe sua chave PIX");
      return;
    }
    setSubmitting(true);
    const { error } = await db.from("withdrawal_requests").insert({
      user_id: user!.id,
      amount,
      pix_key: pixKey,
    });
    if (error) {
      toast.error("Erro ao solicitar saque");
    } else {
      toast.success("Solicitação de saque enviada! Processamento em 3-5 dias úteis.");
      setWithdrawOpen(false);
      setWithdrawAmount("");
      setPixKey("");
      fetchEarnings();
    }
    setSubmitting(false);
  };

  const statusBadge = (status: string) => {
    if (status === "approved") return <Badge className="bg-secondary/10 text-secondary border-secondary/20 text-xs gap-1"><CheckCircle2 className="w-3 h-3" />Aprovado</Badge>;
    if (status === "rejected") return <Badge variant="destructive" className="text-xs gap-1"><XCircle className="w-3 h-3" />Rejeitado</Badge>;
    return <Badge variant="outline" className="text-xs gap-1"><Clock className="w-3 h-3" />Pendente</Badge>;
  };

  return (
    <DashboardLayout title="Médico" nav={getDoctorNav("earnings")}>
      <div className="w-full mx-auto max-w-4xl pb-24 md:pb-6 space-y-5">
        {/* Premium hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#042A1C] via-[#065f46] to-[#059669] p-5 text-white" style={{ boxShadow: "0 8px 32px rgba(4,42,28,0.25)" }}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/8 blur-2xl" />
          <div className="relative z-10">
            <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white/50 hover:text-white/80 transition-colors mb-2">
              ← Voltar ao painel
            </button>
            <h1 className="text-xl font-black tracking-tight">💰 Meus Ganhos</h1>
            <p className="text-xs text-white/60 mt-1">Resumo financeiro das consultas realizadas</p>
          </div>
        </div>

        {/* Clinic affiliation info */}
        {clinicInfo && (
          <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 flex items-center gap-3 text-xs">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Building2 className="w-4 h-4 text-primary" /></div>
            <span className="text-foreground">Vinculado à <strong>{clinicInfo.name}</strong> — repasse de <strong>{clinicInfo.percent}%</strong></span>
          </div>
        )}

        {/* Split info */}
        <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/30 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center shrink-0"><Wallet className="w-4 h-4" /></div>
          <span>Split automático: <strong className="text-foreground">{clinicInfo?.percent ?? DEFAULT_DOCTOR_PERCENT}% Médico</strong> · {PLATFORM_PERCENT}% Plataforma</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { label: "Ganho Confirmado", value: `R$ ${stats.total.toFixed(0)}`, icon: "✅", iconBg: "bg-emerald-50 dark:bg-emerald-950/30", valueClass: "text-emerald-700 dark:text-emerald-400", accent: "bg-emerald-500" },
            { label: "Este Mês", value: `R$ ${stats.thisMonth.toFixed(0)}`, icon: "📅", iconBg: "bg-blue-50 dark:bg-blue-950/30", valueClass: "text-blue-700 dark:text-blue-400", accent: "bg-blue-500" },
            { label: "Pendente", value: `R$ ${stats.pending.toFixed(0)}`, icon: "⏳", iconBg: "bg-amber-50 dark:bg-amber-950/30", valueClass: "text-amber-600 dark:text-amber-400", accent: "bg-amber-500" },
            { label: "Saldo Disponível", value: `R$ ${stats.available.toFixed(0)}`, icon: "💳", iconBg: "bg-violet-50 dark:bg-violet-950/30", valueClass: "text-violet-600 dark:text-violet-400", accent: "bg-violet-500" },
          ].map(s => (
            <div key={s.label} className="overflow-hidden rounded-2xl border border-border/20 bg-card transition-all hover:-translate-y-0.5 hover:shadow-md" style={{ boxShadow: "var(--d-shadow-card)" }}>
              <div className={`h-[3px] w-full ${s.accent}`} />
              <div className="p-3.5">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-[16px] ${s.iconBg}`}>{s.icon}</div>
                <p className={`mt-2 text-[20px] font-black leading-none tracking-tight tabular-nums ${s.valueClass}`}>{s.value}</p>
                <p className="mt-1 text-[10px] font-medium text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Withdrawal button */}
        <div className="flex justify-end">
          <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-md shadow-emerald-600/20">
                <ArrowUpRight className="w-3.5 h-3.5" /> Solicitar Saque · R$ {stats.available.toFixed(2)}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Solicitar Saque</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Saldo disponível: <strong className="text-foreground">R$ {stats.available.toFixed(2)}</strong>
                </p>
                <p className="text-xs text-muted-foreground">Valor mínimo: R$ {MIN_WITHDRAWAL.toFixed(2)} · Processamento em 3-5 dias úteis</p>
                <div>
                  <label className="text-xs font-medium text-foreground">Valor do saque (R$) *</label>
                  <Input type="number" placeholder={`Mín. ${MIN_WITHDRAWAL.toFixed(2)}`} value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} min={MIN_WITHDRAWAL} max={stats.available} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">Chave PIX *</label>
                  <Input placeholder="CPF, e-mail ou telefone" value={pixKey} onChange={e => setPixKey(e.target.value)} className="rounded-xl" />
                </div>
                <Button className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white" onClick={requestWithdrawal} disabled={submitting || !withdrawAmount || !pixKey.trim()}>
                  {submitting ? "Enviando..." : "Confirmar Solicitação"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-border mb-8">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Faturamento Mensal</CardTitle></CardHeader>
          <CardContent>
            {loading ? <div className="space-y-3"><div className="shimmer-v2 h-24 rounded-2xl"/><div className="shimmer-v2 h-24 rounded-2xl"/><div className="shimmer-v2 h-24 rounded-2xl"/></div> : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={v => `R$${v}`} />
                  <Tooltip formatter={(v: number) => [`R$ ${v.toFixed(2)}`, "Valor"]} />
                  <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {withdrawals.length > 0 && (
          <Card className="border-border">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Wallet className="w-5 h-5" /> Histórico de Saques</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {withdrawals.map(w => (
                  <div key={w.id} className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-foreground">R$ {Number(w.amount).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(w.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        {w.pix_key && ` · PIX: ${w.pix_key}`}
                      </p>
                    </div>
                    {statusBadge(w.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorEarnings;
