import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getCartaoNav } from "./cartaoNav";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Crown } from "@phosphor-icons/react";
import { toast } from "sonner";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Plan {
  id: string; name: string; tagline: string | null;
  price_monthly: number; price_yearly: number;
  benefits: string[]; is_highlighted: boolean;
}

interface Sub {
  id: string; plan_id: string; status: string; billing_cycle: string;
  current_period_end: string | null; card_number: string;
  plan?: Plan | null;
}

const formatBRL = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const generateCardNumber = () => {
  const block = () => Math.floor(1000 + Math.random() * 9000);
  return `${block()} ${block()} ${block()} ${block()}`;
};

const MeuPlano = () => {
  const { user } = useAuth();
  const nav = getCartaoNav("plano");
  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState<Sub | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: p }] = await Promise.all([
      db.from("pingo_card_subscriptions").select("*, plan:pingo_card_plans(*)").eq("user_id", user!.id).maybeSingle(),
      db.from("pingo_card_plans").select("*").eq("is_active", true).order("display_order"),
    ]);
    setSub(s as Sub | null);
    setPlans((p ?? []) as Plan[]);
    setLoading(false);
  };

  useEffect(() => {
    if (user) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const subscribe = async (plan: Plan, cycle: "monthly" | "yearly") => {
    if (!user) return;
    const { error } = await db.from("pingo_card_subscriptions").insert({
      user_id: user.id,
      plan_id: plan.id,
      card_number: generateCardNumber(),
      status: "active",
      billing_cycle: cycle,
      current_period_end: new Date(Date.now() + (cycle === "yearly" ? 365 : 30) * 86400_000).toISOString(),
    });
    if (error) return toast.error("Erro ao assinar", { description: error.message });
    toast.success(`Plano ${plan.name} ativado!`);
    void load();
  };

  const cancel = async () => {
    if (!sub) return;
    const { error } = await db
      .from("pingo_card_subscriptions")
      .update({ status: "canceled", canceled_at: new Date().toISOString() })
      .eq("id", sub.id);
    if (error) return toast.error("Erro ao cancelar");
    toast.success("Assinatura cancelada");
    void load();
  };

  if (loading) {
    return (
      <DashboardLayout title="Meu Plano" nav={nav} role="cartao_beneficios">
        <div className="max-w-4xl mx-auto space-y-4"><Skeleton className="h-48 rounded-2xl" /></div>
      </DashboardLayout>
    );
  }

  // Sem assinatura → mostra todos os planos
  if (!sub) {
    return (
      <DashboardLayout title="Meu Plano" nav={nav} role="cartao_beneficios">
        <div className="max-w-6xl mx-auto space-y-5 pb-20">
          <Card className="rounded-2xl border-0 bg-gradient-to-br from-rose-500 to-pink-600 text-white">
            <CardContent className="p-7">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Escolha seu plano</h1>
              <p className="opacity-90">Ative em segundos e comece a economizar na rede credenciada.</p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className={`rounded-2xl ${plan.is_highlighted ? "border-2 border-rose-500 shadow-lg" : ""}`}>
                <CardHeader>
                  {plan.is_highlighted && <Badge className="w-fit mb-2 bg-rose-100 text-rose-700 border-0">MAIS POPULAR</Badge>}
                  <CardTitle>{plan.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{plan.tagline}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-3xl font-bold">{formatBRL(plan.price_monthly)}</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {plan.benefits?.slice(0, 5).map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check size={16} weight="bold" className="text-rose-600 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-col gap-2 pt-2">
                    <Button onClick={() => subscribe(plan, "monthly")} className="rounded-xl">Assinar mensal</Button>
                    <Button variant="outline" onClick={() => subscribe(plan, "yearly")} className="rounded-xl">
                      Anual ({formatBRL(plan.price_yearly)})
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const plan = sub.plan;
  const isCanceled = sub.status === "canceled";

  return (
    <DashboardLayout title="Meu Plano" nav={nav} role="cartao_beneficios">
      <div className="max-w-4xl mx-auto space-y-5 pb-20">
        <Card className="rounded-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Crown size={22} weight="fill" className="text-amber-500" />
                {plan?.name}
              </CardTitle>
              <Badge variant={isCanceled ? "destructive" : "default"}>
                {isCanceled ? "Cancelada" : "Ativa"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{plan?.tagline}</p>
            <ul className="space-y-2">
              {plan?.benefits?.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check size={16} weight="bold" className="text-rose-600 mt-0.5 shrink-0" /> {b}
                </li>
              ))}
            </ul>
            <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t">
              <div>
                <p className="text-muted-foreground">Cobrança</p>
                <p className="font-semibold capitalize">{sub.billing_cycle === "yearly" ? "Anual" : "Mensal"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Próximo ciclo</p>
                <p className="font-semibold">
                  {sub.current_period_end ? format(new Date(sub.current_period_end), "dd/MM/yyyy") : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {!isCanceled && (
          <Card className="rounded-2xl">
            <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-semibold">Quer trocar de plano?</p>
                <p className="text-sm text-muted-foreground">Cancele a assinatura atual e escolha outro.</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="rounded-xl">Cancelar assinatura</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar Cartão Benefícios?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Você perderá os benefícios e descontos imediatamente. Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                    <AlertDialogAction onClick={cancel}>Confirmar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MeuPlano;