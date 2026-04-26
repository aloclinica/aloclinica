import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getCartaoNav } from "./cartaoNav";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Receipt } from "@phosphor-icons/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Tx {
  id: string;
  description: string | null;
  original_amount: number;
  discount_amount: number;
  final_amount: number;
  category: string | null;
  created_at: string;
  partner?: { name: string } | null;
}

const formatBRL = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const FaturasCartao = () => {
  const { user } = useAuth();
  const nav = getCartaoNav("faturas");
  const [loading, setLoading] = useState(true);
  const [txs, setTxs] = useState<Tx[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: sub } = await db
        .from("pingo_card_subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!sub?.id) {
        setLoading(false);
        return;
      }
      const { data } = await db
        .from("pingo_card_transactions")
        .select("*, partner:pingo_card_partners(name)")
        .eq("subscription_id", sub.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setTxs((data ?? []) as Tx[]);
      setLoading(false);
    })();
  }, [user]);

  const totalSavings = txs.reduce((sum, t) => sum + Number(t.discount_amount), 0);
  const totalSpent = txs.reduce((sum, t) => sum + Number(t.final_amount), 0);

  return (
    <DashboardLayout title="Faturas e Histórico" nav={nav} role="cartao_beneficios">
      <div className="space-y-5 max-w-4xl mx-auto pb-20">
        <div className="grid grid-cols-3 gap-3">
          <Card className="rounded-2xl">
            <CardContent className="p-4 sm:p-5">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-bold">Economia total</p>
              <p className="text-lg sm:text-2xl font-bold text-emerald-600 tabular-nums">{formatBRL(totalSavings)}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4 sm:p-5">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-bold">Total pago</p>
              <p className="text-lg sm:text-2xl font-bold tabular-nums">{formatBRL(totalSpent)}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4 sm:p-5">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-bold">Transações</p>
              <p className="text-lg sm:text-2xl font-bold tabular-nums">{txs.length}</p>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <Skeleton className="h-72 rounded-2xl" />
        ) : txs.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="p-10 text-center text-muted-foreground space-y-2">
              <Receipt size={32} weight="fill" className="mx-auto opacity-50" />
              <p>Nenhuma fatura ou uso registrado ainda.</p>
              <p className="text-xs">Use seu cartão na rede credenciada para acompanhar o histórico aqui.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl overflow-hidden">
            <CardContent className="p-0 divide-y">
              {txs.map((t) => (
                <div key={t.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{t.partner?.name ?? t.description ?? "Uso do cartão"}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(t.created_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                      {t.category ? ` · ${t.category}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-emerald-600 font-bold">-{formatBRL(Number(t.discount_amount))}</p>
                    <p className="text-xs text-muted-foreground">de {formatBRL(Number(t.original_amount))}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FaturasCartao;