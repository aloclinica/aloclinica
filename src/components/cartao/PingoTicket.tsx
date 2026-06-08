import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getCartaoNav } from "./cartaoNav";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  ForkKnife, ShoppingCart, ArrowDown, ArrowUp, ShieldCheck, Wallet, Storefront,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import pingoLogo from "@/assets/pingo-cartao.png";

interface Account {
  id: string;
  card_number: string;
  balance: number;
  status: string;
}

interface Tx {
  id: string;
  type: "credit" | "debit";
  amount: number;
  merchant: string | null;
  category: string | null;
  description: string | null;
  balance_after: number;
  created_at: string;
}

const QUICK_MERCHANTS = [
  { name: "Supermercado Extra", category: "Mercado" },
  { name: "Padaria do Bairro", category: "Padaria" },
  { name: "Restaurante Sabor & Cia", category: "Restaurante" },
  { name: "Hortifruti Verde", category: "Hortifruti" },
  { name: "Açougue Bom Corte", category: "Açougue" },
  { name: "iFood", category: "Delivery" },
];

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const PingoTicket = () => {
  const { user, profile } = useAuth();
  const nav = getCartaoNav("ticket");
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<Account | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [open, setOpen] = useState(false);
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("Mercado");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    if (!user) return;
    let { data: acc } = await db
      .from("pingo_ticket_accounts")
      .select("id, card_number, balance, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!acc) {
      const { data: created, error } = await db
        .from("pingo_ticket_accounts")
        .insert({ user_id: user.id } as any)
        .select("id, card_number, balance, status")
        .single();
      if (error) {
        toast.error("Erro ao criar conta", { description: error.message });
      }
      acc = created;
    }
    setAccount(acc as Account | null);

    const { data: list } = await db
      .from("pingo_ticket_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    setTxs((list as Tx[] | null) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [user]);

  const spend = async () => {
    const v = Number(String(amount).replace(",", "."));
    if (!v || v <= 0) { toast.error("Informe um valor válido"); return; }
    if (!merchant.trim()) { toast.error("Informe o estabelecimento"); return; }
    if (account && v > Number(account.balance)) { toast.error("Saldo insuficiente"); return; }
    setSubmitting(true);
    const { data, error } = await supabase.rpc("fn_spend_pingo_ticket", {
      p_amount: v,
      p_merchant: merchant.trim(),
      p_category: category,
      p_description: undefined,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Não foi possível pagar", { description: error.message });
      return;
    }
    toast.success(`Pagamento aprovado · ${fmtBRL(v)}`);
    setOpen(false); setAmount(""); setMerchant("");
    fetchAll();
  };

  const fullName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim()
    || user?.email?.split("@")[0] || "Titular";

  if (loading) {
    return (
      <DashboardLayout title="Pingo Ticket" nav={nav} role="cartao_beneficios">
        <div className="max-w-2xl mx-auto"><Skeleton className="h-72 rounded-3xl" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Pingo Ticket" nav={nav} role="cartao_beneficios">
      <div className="max-w-2xl mx-auto space-y-5 pb-24 md:pb-6">
        {/* CARTÃO TICKET — verde vale-alimentação */}
        <motion.div
          initial={{ opacity: 0, y: 20, rotateX: -12 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{ perspective: 1200 }}
        >
          <div className="relative rounded-[28px] overflow-hidden shadow-[0_25px_60px_-15px_rgba(16,80,50,0.55)] aspect-[1.586/1] max-w-[440px] mx-auto group">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#053b2a_0%,#0a6e4d_30%,#10a37a_55%,#0a6e4d_80%,#053b2a_100%)]" />
            <div className="absolute inset-0 opacity-30 mix-blend-screen bg-[conic-gradient(from_135deg_at_60%_40%,transparent_0deg,rgba(180,255,220,0.4)_60deg,transparent_120deg,rgba(255,240,180,0.25)_200deg,transparent_280deg,rgba(180,255,220,0.35)_340deg,transparent_360deg)]" />
            <div className="absolute inset-0 opacity-[0.06]" style={{
              backgroundImage: "repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 8px), repeating-linear-gradient(-45deg, #fff 0 1px, transparent 1px 8px)"
            }} />
            <div
              className="absolute -inset-x-1/2 -inset-y-1/2 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.18)_50%,transparent_60%)] translate-x-[-100%] group-hover:translate-x-[100%] transition-transform"
              style={{ transitionDuration: "1400ms" }}
            />

            <div className="relative h-full w-full p-5 sm:p-6 flex flex-col text-white">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 rounded-full bg-white/95 ring-2 ring-emerald-200/70 shadow-lg flex items-center justify-center overflow-hidden">
                    <img src={pingoLogo} alt="Pingo" className="w-9 h-9 object-contain" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-[9px] tracking-[0.25em] text-emerald-100/90 font-semibold">PINGO TICKET</p>
                    <p className="text-[13px] font-bold tracking-wide flex items-center gap-1">
                      <ForkKnife size={12} weight="fill" /> Vale Alimentação
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-gradient-to-br from-emerald-200 to-emerald-400 text-emerald-950 border-0 font-bold tracking-wider text-[10px] px-2.5 py-0.5 shadow-md">
                    SALDO
                  </Badge>
                  <p className="text-[16px] sm:text-[18px] font-extrabold mt-1 tabular-nums">
                    {fmtBRL(Number(account?.balance ?? 0))}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4">
                <div className="w-11 h-8 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 relative overflow-hidden shadow-inner">
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-px p-0.5">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="bg-amber-700/40 rounded-[1px]" />
                    ))}
                  </div>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white/80">
                  <path d="M5 8a10 10 0 0114 0M8 11a6 6 0 018 0M11 14a2 2 0 012 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </div>

              <p className="mt-2 font-mono text-[16px] sm:text-[18px] tracking-[0.18em] font-semibold drop-shadow-sm">
                {(account?.card_number ?? "").replace(/(.{4})/g, "$1 ").trim()}
              </p>

              <div className="mt-auto flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[8px] uppercase tracking-[0.2em] text-white/60 font-bold">Titular</p>
                  <p className="text-[13px] font-bold uppercase tracking-wide truncate">{fullName}</p>
                </div>
                <div className="text-right flex items-center gap-1 text-[10px] font-semibold text-emerald-100">
                  <ShieldCheck size={12} weight="fill" /> ATIVO
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA pagamento */}
        <div className="grid grid-cols-2 gap-3">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl h-12 gap-2 bg-gradient-to-br from-emerald-600 to-emerald-700 hover:opacity-90 text-white border-0 shadow-md">
                <ShoppingCart size={18} weight="fill" /> Pagar
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ForkKnife className="text-emerald-600" weight="fill" /> Pagar com Pingo Ticket
                </DialogTitle>
                <DialogDescription>
                  Saldo disponível: <span className="font-bold text-emerald-700">{fmtBRL(Number(account?.balance ?? 0))}</span>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Estabelecimento</Label>
                  <Input value={merchant} onChange={e => setMerchant(e.target.value)} placeholder="Ex: Supermercado Extra" className="mt-1 h-11" />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {QUICK_MERCHANTS.map(m => (
                      <button key={m.name} type="button"
                        onClick={() => { setMerchant(m.name); setCategory(m.category); }}
                        className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition">
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Categoria</Label>
                    <Input value={category} onChange={e => setCategory(e.target.value)} className="mt-1 h-11" />
                  </div>
                  <div>
                    <Label className="text-xs">Valor (R$)</Label>
                    <Input value={amount} onChange={e => setAmount(e.target.value)} type="number" min={0.01} step={0.01} placeholder="0,00" className="mt-1 h-11 font-bold text-lg" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={spend} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                  {submitting ? "Processando..." : "Confirmar pagamento"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" className="rounded-2xl h-12 gap-2" onClick={() => window.location.assign("/dashboard/cartao/rede?role=cartao_beneficios")}>
            <Storefront size={18} weight="fill" /> Ver rede
          </Button>
        </div>

        {/* Cards informativos */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="rounded-2xl border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-emerald-700 text-[11px] font-bold uppercase tracking-wider">
                <Wallet size={14} weight="fill" /> Saldo
              </div>
              <p className="mt-1 text-2xl font-extrabold text-emerald-800 tabular-nums">{fmtBRL(Number(account?.balance ?? 0))}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Recarga mensal</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-rose-100 bg-gradient-to-br from-rose-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-rose-700 text-[11px] font-bold uppercase tracking-wider">
                <ArrowUp size={14} weight="fill" /> Gasto no mês
              </div>
              <p className="mt-1 text-2xl font-extrabold text-rose-800 tabular-nums">
                {fmtBRL(txs.filter(t => t.type === "debit" && new Date(t.created_at).getMonth() === new Date().getMonth())
                  .reduce((s, t) => s + Number(t.amount), 0))}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{txs.filter(t => t.type === "debit").length} transações</p>
            </CardContent>
          </Card>
        </div>

        {/* Histórico */}
        <Card className="rounded-2xl">
          <CardContent className="p-0">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold">Extrato</h3>
              <span className="text-xs text-muted-foreground">{txs.length} movimentações</span>
            </div>
            {txs.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <ForkKnife size={32} className="mx-auto mb-2 text-muted-foreground/50" />
                Nenhuma transação ainda. Use seu Pingo Ticket no primeiro estabelecimento parceiro!
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {txs.map(t => (
                  <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${t.type === "debit" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {t.type === "debit" ? <ArrowUp size={16} weight="bold" /> : <ArrowDown size={16} weight="bold" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{t.merchant ?? (t.type === "credit" ? "Recarga" : "Pagamento")}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {t.category ?? "—"} · {format(new Date(t.created_at), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold tabular-nums ${t.type === "debit" ? "text-rose-700" : "text-emerald-700"}`}>
                        {t.type === "debit" ? "-" : "+"}{fmtBRL(Number(t.amount))}
                      </p>
                      <p className="text-[10px] text-muted-foreground tabular-nums">Saldo: {fmtBRL(Number(t.balance_after))}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PingoTicket;
