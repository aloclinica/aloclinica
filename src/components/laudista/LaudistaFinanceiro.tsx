import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getLaudistaNav } from "./laudistaNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  TrendingUp, Wallet, ArrowUpRight, Clock, CheckCircle2, XCircle,
  Microscope, Shield, Phone, Mail, Award, QrCode, Copy, FileCheck, Sparkles, Zap,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const EXAM_BASE_PRICE = 80;
const LAUDISTA_PERCENT = 50;
const MIN_WITHDRAWAL = 50;

const LaudistaFinanceiro = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pixKey, setPixKey] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [flipped, setFlipped] = useState(false);

  /* ── Doctor Profile ── */
  const { data: doctorProfile } = useQuery({
    queryKey: ["laudista-doctor-profile", user?.id],
    queryFn: async () => {
      const { data } = await db.from("doctor_profiles").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  /* ── Earnings Data ── */
  const { data: earningsData, isLoading } = useQuery({
    queryKey: ["laudista-earnings", doctorProfile?.id],
    queryFn: async () => {
      const dpId = doctorProfile!.id;
      const [reportsRes, withdrawRes, walletRes] = await Promise.all([
        db.from("exam_reports").select("id, created_at, signed_at").eq("reporter_id", dpId).not("signed_at", "is", null).order("created_at", { ascending: false }),
        db.from("withdrawal_requests").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(20),
        db.from("wallet_transactions").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(100),
      ]);

      const reports = reportsRes.data ?? [];
      const withdrawals = withdrawRes.data ?? [];
      const walletTxns = walletRes.data ?? [];

      const pricePerReport = EXAM_BASE_PRICE * (LAUDISTA_PERCENT / 100);
      const walletCredits = walletTxns.filter((t: any) => t.type === "credit" || t.type === "refund").reduce((s: number, t: any) => s + Number(t.amount), 0);
      const walletDebits = walletTxns.filter((t: any) => t.type === "withdrawal" || t.type === "debit").reduce((s: number, t: any) => s + Number(t.amount), 0);
      const hasWalletData = walletTxns.length > 0;

      const totalEarned = hasWalletData ? walletCredits : reports.length * pricePerReport;
      const availableBalance = hasWalletData
        ? Math.max(0, walletCredits - walletDebits)
        : Math.max(0, totalEarned - withdrawals.filter((w: any) => w.status === "approved").reduce((sum: number, w: any) => sum + Number(w.amount), 0));

      const now = new Date();
      const monthStart = startOfMonth(now);
      const thisMonthReports = reports.filter((r: any) => new Date(r.created_at) >= monthStart);

      const chartData: { month: string; laudos: number; valor: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const m = subMonths(now, i);
        const mStart = startOfMonth(m);
        const mEnd = endOfMonth(m);
        const monthReports = reports.filter((r: any) => { const d = new Date(r.created_at); return d >= mStart && d <= mEnd; });
        chartData.push({ month: format(m, "MMM", { locale: ptBR }), laudos: monthReports.length, valor: monthReports.length * pricePerReport });
      }

      return { total: totalEarned, thisMonth: thisMonthReports.length * pricePerReport, totalReports: reports.length, available: availableBalance, monthlyData: chartData, withdrawals };
    },
    enabled: !!doctorProfile?.id,
  });

  /* ── Wallet card data ── */
  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ["laudista-wallet-card", doctorProfile?.id],
    queryFn: async () => {
      const dpId = doctorProfile!.id;
      const [specsRes, totalRes, signedRes] = await Promise.all([
        db.from("doctor_specialties").select("specialty_id, specialties(name)").eq("doctor_id", dpId),
        db.from("exam_reports").select("id", { count: "exact", head: true }).eq("reporter_id", dpId),
        db.from("exam_reports").select("id", { count: "exact", head: true }).eq("reporter_id", dpId).not("signed_at", "is", null),
      ]);
      return {
        specialties: (specsRes.data ?? []).map((s: any) => s.specialties?.name).filter(Boolean),
        totalReports: totalRes.count ?? 0,
        signedReports: signedRes.count ?? 0,
      };
    },
    enabled: !!doctorProfile?.id,
  });

  const requestWithdrawal = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < MIN_WITHDRAWAL) { toast.error(`Valor mínimo: R$ ${MIN_WITHDRAWAL.toFixed(2)}`); return; }
    if (!earningsData || amount > earningsData.available) { toast.error("Valor superior ao saldo disponível"); return; }
    if (!pixKey.trim()) { toast.error("Informe sua chave PIX"); return; }
    setSubmitting(true);
    const { error } = await db.from("withdrawal_requests").insert({ user_id: user!.id, amount, pix_key: pixKey });
    if (error) { toast.error("Erro ao solicitar saque", { description: error.message }); }
    else { toast.success("Solicitação de saque enviada!"); setWithdrawOpen(false); setWithdrawAmount(""); setPixKey(""); queryClient.invalidateQueries({ queryKey: ["laudista-earnings"] }); }
    setSubmitting(false);
  };

  const statusBadge = (status: string) => {
    if (status === "approved") return <Badge className="bg-success/10 text-success border-success/20 text-xs gap-1"><CheckCircle2 className="w-3 h-3" />Aprovado</Badge>;
    if (status === "rejected") return <Badge variant="destructive" className="text-xs gap-1"><XCircle className="w-3 h-3" />Rejeitado</Badge>;
    return <Badge variant="outline" className="text-xs gap-1"><Clock className="w-3 h-3" />Pendente</Badge>;
  };

  const fullName = `Dr(a). ${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();
  const crmFull = doctorProfile ? `CRM ${doctorProfile.crm}/${doctorProfile.crm_state}` : "";
  const initial = (profile?.first_name?.[0] ?? "L").toUpperCase();
  const copyId = () => { navigator.clipboard.writeText(doctorProfile?.id ?? ""); setCopied(true); toast.success("ID copiado!"); setTimeout(() => setCopied(false), 2000); };

  return (
    <DashboardLayout title="Laudista" nav={getLaudistaNav("financeiro")} role="laudista">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-secondary" /> Financeiro
          </h1>
          <p className="text-muted-foreground text-sm">Ganhos, saques e carteira digital</p>
        </div>

        {/* Split info */}
        <div className="p-3 rounded-xl bg-secondary/5 border border-secondary/20 flex items-center gap-3 text-xs text-muted-foreground">
          <Wallet className="w-4 h-4 shrink-0 text-secondary" />
          <span>Split automático: <strong className="text-foreground">{LAUDISTA_PERCENT}% Laudista</strong> · {100 - LAUDISTA_PERCENT}% Plataforma · Base R$ {EXAM_BASE_PRICE}/laudo</span>
        </div>

        <Tabs defaultValue="resumo" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="saques">Saques</TabsTrigger>
            <TabsTrigger value="carteira">Carteira</TabsTrigger>
          </TabsList>

          {/* ══════ ABA RESUMO ══════ */}
          <TabsContent value="resumo" className="space-y-6">
            {isLoading ? (
              <div className="grid sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (<Card key={i} className="border-border/50"><CardContent className="pt-6 space-y-3"><Skeleton className="h-3 w-24" /><Skeleton className="h-8 w-28" /></CardContent></Card>))}
              </div>
            ) : earningsData && (
              <>
                <div className="grid sm:grid-cols-4 gap-4">
                  <Card className="border-border/50 bg-gradient-to-br from-secondary/5 to-transparent">
                    <CardContent className="pt-6">
                      <p className="text-xs text-muted-foreground">Ganho Total</p>
                      <p className="text-2xl font-bold text-foreground tabular-nums">R$ {earningsData.total.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50">
                    <CardContent className="pt-6">
                      <p className="text-xs text-muted-foreground">Este Mês</p>
                      <p className="text-2xl font-bold text-foreground tabular-nums">R$ {earningsData.thisMonth.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50">
                    <CardContent className="pt-6">
                      <p className="text-xs text-muted-foreground">Laudos Assinados</p>
                      <p className="text-2xl font-bold text-foreground">{earningsData.totalReports}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50 border-secondary/20 bg-secondary/5">
                    <CardContent className="pt-6">
                      <p className="text-xs text-muted-foreground">Saldo Disponível</p>
                      <p className="text-2xl font-bold text-secondary tabular-nums">R$ {earningsData.available.toFixed(2)}</p>
                      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="mt-2 text-xs gap-1 w-full border-secondary/30 text-secondary hover:bg-secondary/10 rounded-xl">
                            <ArrowUpRight className="w-3 h-3" /> Solicitar Saque
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Solicitar Saque</DialogTitle></DialogHeader>
                          <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">Saldo disponível: <strong className="text-foreground">R$ {earningsData.available.toFixed(2)}</strong></p>
                            <p className="text-xs text-muted-foreground">Valor mínimo: R$ {MIN_WITHDRAWAL.toFixed(2)} · Processamento em 3-5 dias úteis</p>
                            <div>
                              <label className="text-xs font-medium text-foreground">Valor do saque (R$) *</label>
                              <Input type="number" placeholder={`Mín. ${MIN_WITHDRAWAL.toFixed(2)}`} value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} min={MIN_WITHDRAWAL} max={earningsData.available} />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-foreground">Chave PIX *</label>
                              <Input placeholder="CPF, e-mail ou telefone" value={pixKey} onChange={e => setPixKey(e.target.value)} />
                            </div>
                            <Button className="w-full bg-gradient-to-r from-secondary to-primary text-white rounded-xl" onClick={requestWithdrawal} disabled={submitting || !withdrawAmount || !pixKey.trim()}>
                              {submitting ? "Enviando..." : "Confirmar Solicitação"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                </div>

                {/* Chart */}
                <Card className="border-border/50">
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Faturamento Mensal</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={earningsData.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={v => `R$${v}`} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} formatter={(v: number) => [`R$ ${v.toFixed(2)}`, "Valor"]} />
                        <Bar dataKey="valor" fill="hsl(var(--secondary))" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ══════ ABA SAQUES ══════ */}
          <TabsContent value="saques" className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : earningsData && earningsData.withdrawals.length > 0 ? (
              <Card className="border-border/50">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Wallet className="w-5 h-5 text-primary" /> Histórico de Saques</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {earningsData.withdrawals.map((w: any) => (
                      <div key={w.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-foreground tabular-nums">R$ {Number(w.amount).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(w.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}{w.pix_key && ` · PIX: ${w.pix_key}`}</p>
                        </div>
                        {statusBadge(w.status)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/50">
                <CardContent className="py-12 text-center">
                  <Wallet className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground text-sm">Nenhum saque realizado ainda.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ══════ ABA CARTEIRA ══════ */}
          <TabsContent value="carteira">
            <div className="max-w-lg mx-auto space-y-4 pb-24 md:pb-6">
              <div className="flex justify-end">
                <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={() => setFlipped(!flipped)}>
                  <Sparkles className="w-3.5 h-3.5" /> {flipped ? "Frente" : "Verso"}
                </Button>
              </div>

              {walletLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
              ) : !doctorProfile ? (
                <p className="text-muted-foreground text-center py-12">Perfil médico não encontrado.</p>
              ) : (
                <div className="perspective-[1200px]" onClick={() => setFlipped(!flipped)}>
                  <motion.div className="relative w-full cursor-pointer" style={{ transformStyle: "preserve-3d" }} animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}>
                    {/* FRONT */}
                    <div className="relative w-full" style={{ backfaceVisibility: "hidden" }}>
                      <div className="relative overflow-hidden rounded-3xl shadow-2xl border border-secondary/20">
                        <div className="absolute -top-20 -left-20 w-60 h-60 bg-secondary/20 rounded-full blur-3xl" />
                        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-primary/15 rounded-full blur-3xl" />
                        <div className="relative bg-gradient-to-br from-secondary via-secondary/95 to-secondary/80 p-6 pb-16">
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                          <div className="absolute top-3 right-4 flex items-center gap-1.5 opacity-60">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
                            <span className="text-white/50 text-[9px] font-mono tracking-widest">ATIVO</span>
                          </div>
                          <div className="flex items-start justify-between relative z-10">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center"><Microscope className="w-4 h-4 text-white" /></div>
                                <div>
                                  <p className="text-white/60 text-[9px] font-medium tracking-[0.2em] uppercase">Allo Médico</p>
                                  <p className="text-white/40 text-[8px] tracking-wider">TELELAUDO · CARTEIRA DIGITAL</p>
                                </div>
                              </div>
                            </div>
                            <div className="relative">
                              <div className="absolute inset-0 bg-white/10 rounded-xl blur-md" />
                              <div className="relative bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/20"><QrCode className="w-12 h-12 text-white/90" /></div>
                            </div>
                          </div>
                        </div>
                        <div className="relative bg-card p-6 -mt-8 rounded-t-3xl space-y-5 z-10">
                          <div className="flex items-end gap-4 -mt-14">
                            <div className="relative">
                              <div className="absolute inset-0 bg-gradient-to-br from-secondary to-primary rounded-2xl blur-md opacity-40 scale-105" />
                              {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt={fullName} className="relative w-24 h-24 rounded-2xl object-cover border-4 border-card shadow-xl" loading="lazy" decoding="async" />
                              ) : (
                                <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-white text-3xl font-black border-4 border-card shadow-xl">{initial}</div>
                              )}
                              {doctorProfile.crm_verified && (
                                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-success flex items-center justify-center border-2 border-card shadow-md"><Shield className="w-3.5 h-3.5 text-white" /></div>
                              )}
                            </div>
                            <div className="flex-1 pb-1">
                              <h3 className="text-lg font-black text-foreground leading-tight">{fullName}</h3>
                              <p className="text-sm font-mono text-secondary font-semibold">{crmFull}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <Badge className="bg-secondary/10 text-secondary border-secondary/20 gap-1 text-[10px] font-semibold"><Microscope className="w-3 h-3" /> Médico Laudista</Badge>
                            {walletData?.specialties.map((s: string) => (<Badge key={s} variant="outline" className="text-[10px] border-secondary/20 text-secondary/80">{s}</Badge>))}
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { value: walletData?.totalReports ?? 0, label: "Laudos", icon: <FileCheck className="w-3.5 h-3.5 text-secondary" /> },
                              { value: walletData?.signedReports ?? 0, label: "Assinados", icon: <CheckCircle2 className="w-3.5 h-3.5 text-success" /> },
                              { value: "50%", label: "Repasse", icon: <Zap className="w-3.5 h-3.5 text-warning" /> },
                            ].map(s => (
                              <div key={s.label} className="relative overflow-hidden text-center p-3 rounded-2xl bg-gradient-to-br from-muted/60 to-muted/30 border border-border/50">
                                <div className="flex items-center justify-center gap-1 mb-0.5">{s.icon}<span className="text-lg font-black text-foreground">{s.value}</span></div>
                                <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
                              </div>
                            ))}
                          </div>
                          <div className="h-px bg-gradient-to-r from-transparent via-secondary/30 to-transparent" />
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Membro desde</p>
                              <p className="text-xs font-semibold text-foreground">{doctorProfile.created_at ? format(new Date(doctorProfile.created_at), "MMMM yyyy", { locale: ptBR }) : "—"}</p>
                            </div>
                            <Button size="sm" variant="ghost" className="text-[10px] gap-1 h-7 px-2 hover:bg-secondary/5" onClick={(e) => { e.stopPropagation(); copyId(); }}>
                              {copied ? <CheckCircle2 className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                              {copied ? "Copiado!" : "Copiar ID"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* BACK */}
                    <div className="absolute inset-0 w-full" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                      <div className="relative overflow-hidden rounded-3xl shadow-2xl border border-secondary/20 bg-gradient-to-br from-card via-card to-muted/30 h-full">
                        <div className="absolute -top-16 -right-16 w-48 h-48 bg-secondary/5 rounded-full blur-3xl" />
                        <div className="w-full h-12 bg-gradient-to-r from-foreground/80 via-foreground/90 to-foreground/80 mt-6" />
                        <div className="p-6 space-y-5">
                          <div>
                            <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1.5">Assinatura Digital</p>
                            <div className="h-14 rounded-xl bg-muted/50 border border-dashed border-border flex items-center justify-center">
                              <p className="text-sm italic text-muted-foreground/50 font-serif">{fullName}</p>
                            </div>
                          </div>
                          <div className="space-y-2.5">
                            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Contato</p>
                            {profile?.phone && (
                              <div className="flex items-center gap-2.5 text-sm text-foreground">
                                <div className="w-7 h-7 rounded-lg bg-secondary/10 flex items-center justify-center"><Phone className="w-3.5 h-3.5 text-secondary" /></div>
                                <span className="font-medium">{profile.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2.5 text-sm text-foreground">
                              <div className="w-7 h-7 rounded-lg bg-secondary/10 flex items-center justify-center"><Mail className="w-3.5 h-3.5 text-secondary" /></div>
                              <span className="font-medium text-xs">{user?.email}</span>
                            </div>
                          </div>
                          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">ID do Laudista</p>
                              <p className="text-xs font-mono text-foreground font-semibold mt-0.5">{doctorProfile?.id?.slice(0, 16)}...</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center"><Microscope className="w-5 h-5 text-secondary" /></div>
                          </div>
                          <p className="text-[8px] text-center text-muted-foreground/60 pt-2">Carteira válida enquanto o profissional mantiver registro ativo no CRM e vínculo com a plataforma.</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
};

export default LaudistaFinanceiro;
