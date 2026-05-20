import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getCartaoNav } from "./cartaoNav";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Crown, ForkKnife, Users, Calendar } from "@phosphor-icons/react";
import { toast } from "sonner";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PingoSubscribeDialog } from "@/components/patient/PingoSubscribeDialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Plan {
  id: string; name: string; tagline: string | null;
  price_monthly: number; price_yearly: number;
  benefits: string[]; is_highlighted: boolean;
  slug?: string;
}

interface Summary {
  has_subscription: boolean;
  subscription_id?: string;
  plan_name?: string;
  status?: string;
  billing_cycle?: string;
  next_charge_at?: string | null;
  current_period_end?: string | null;
  card_number?: string;
  pingo_ticket_balance?: number;
  dependents_count?: number;
  dependents_limit?: number;
  total_savings?: number;
  benefits?: string[];
  tagline?: string | null;
}

const formatBRL = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const MeuPlano = () => {
  const { user } = useAuth();
  const nav = getCartaoNav("plano");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [subId, setSubId] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: rpc }, { data: sub }, { data: p }] = await Promise.all([
      db.rpc("fn_get_cartao_summary", { p_user_id: user!.id }),
      db.from("pingo_card_subscriptions").select("id").eq("user_id", user!.id).maybeSingle(),
      db.from("pingo_card_plans").select("*").eq("is_active", true).order("display_order"),
    ]);
    setSummary((rpc as Summary | null) ?? null);
    setSubId((sub as { id: string } | null)?.id ?? null);
    setPlans((p ?? []) as Plan[]);
    setLoading(false);
  };

  useEffect(() => {
    if (user) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const openSubscribe = (plan: Plan, cycle: "monthly" | "yearly") => {
    setBilling(cycle);
    setSelectedPlan(plan);
    setSubscribeOpen(true);
  };

  const cancel = async () => {
    if (!subId) return;
    const { error } = await db
      .from("pingo_card_subscriptions")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", subId);
    if (error) {
      toast.error("Erro ao cancelar");
      return;
    }
    toast.success("Assinatura cancelada — você manterá os benefícios até o fim do ciclo atual.");
    void load();
  };

  if (loading) {
    return (
      <DashboardLayout title="Meu Plano" nav={nav} role="cartao_beneficios">
        <div className="max-w-4xl mx-auto space-y-4"><Skeleton className="h-48 rounded-2xl" /></div>
      </DashboardLayout>
    );
  }

  const hasSub = summary?.has_subscription === true;

  if (!hasSub) {
    return (
      <DashboardLayout title="Meu Plano" nav={nav} role="cartao_beneficios">
        <div className="max-w-6xl mx-auto space-y-5 pb-20">
          <Card className="rounded-2xl border-0 bg-gradient-to-br from-rose-500 to-pink-600 text-white">
            <CardContent className="p-7">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Escolha seu plano</h1>
              <p className="opacity-90">Ative em segundos e comece a economizar na rede credenciada.</p>
            </CardContent>
          </Card>

          <Tabs value={billing} onValueChange={(v) => setBilling(v as "monthly" | "yearly")} className="w-fit mx-auto">
            <TabsList>
              <TabsTrigger value="monthly">Mensal</TabsTrigger>
              <TabsTrigger value="yearly">Anual <Badge className="ml-2 bg-emerald-500 text-white">-15%</Badge></TabsTrigger>
            </TabsList>
          </Tabs>

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
                    <span className="text-3xl font-bold">
                      {formatBRL(billing === "yearly" ? plan.price_yearly / 12 : plan.price_monthly)}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                    {billing === "yearly" && (
                      <p className="text-xs text-emerald-600 font-medium mt-1">
                        {formatBRL(plan.price_yearly)} cobrados anualmente
                      </p>
                    )}
                  </div>
                  <ul className="space-y-2 text-sm">
                    {plan.benefits?.slice(0, 5).map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check size={16} weight="bold" className="text-rose-600 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => openSubscribe(plan, billing)}
                    className="rounded-xl w-full"
                    variant={plan.is_highlighted ? "default" : "outline"}
                  >
                    Assinar agora
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <PingoSubscribeDialog
          open={subscribeOpen}
          onOpenChange={setSubscribeOpen}
          plan={selectedPlan as any}
          billingCycle={billing}
          onSubscribed={() => void load()}
        />
      </DashboardLayout>
    );
  }

  const isCanceled = summary?.status === "cancelled" || summary?.status === "canceled";

  return (
    <DashboardLayout title="Meu Plano" nav={nav} role="cartao_beneficios">
      <div className="max-w-4xl mx-auto space-y-5 pb-20">
        <Card className="rounded-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Crown size={22} weight="fill" className="text-amber-500" />
                {summary?.plan_name}
              </CardTitle>
              <Badge variant={isCanceled ? "destructive" : "default"}>
                {isCanceled ? "Cancelada" : "Ativa"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary?.tagline && <p className="text-muted-foreground">{summary.tagline}</p>}
            {!!summary?.benefits?.length && (
              <ul className="space-y-2">
                {summary.benefits.map((b: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check size={16} weight="bold" className="text-rose-600 mt-0.5 shrink-0" /> {b}
                  </li>
                ))}
              </ul>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm pt-4 border-t">
              <div>
                <p className="text-muted-foreground flex items-center gap-1"><Calendar size={12} /> Cobrança</p>
                <p className="font-semibold capitalize">{summary?.billing_cycle === "yearly" ? "Anual" : "Mensal"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Próximo ciclo</p>
                <p className="font-semibold">
                  {summary?.next_charge_at
                    ? format(new Date(summary.next_charge_at), "dd/MM/yyyy")
                    : summary?.current_period_end
                      ? format(new Date(summary.current_period_end), "dd/MM/yyyy")
                      : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground flex items-center gap-1"><ForkKnife size={12} /> Pingo Ticket</p>
                <p className="font-semibold text-emerald-600">{formatBRL(Number(summary?.pingo_ticket_balance ?? 0))}</p>
              </div>
              <div>
                <p className="text-muted-foreground flex items-center gap-1"><Users size={12} /> Dependentes</p>
                <p className="font-semibold">{summary?.dependents_count ?? 0} / {summary?.dependents_limit ?? 0}</p>
              </div>
            </div>

            {Number(summary?.total_savings ?? 0) > 0 && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm">
                💚 Você já economizou <strong className="text-emerald-700">{formatBRL(Number(summary?.total_savings ?? 0))}</strong> usando o seu cartão.
              </div>
            )}
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
                      Você manterá os benefícios até o fim do ciclo atual e não será mais cobrado nas próximas faturas.
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