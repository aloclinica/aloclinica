import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Building2, Plus, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface PlanOption {
  id: string;
  slug: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  benefits: string[];
}

interface Employee { email: string; name: string; cpf: string }

export default function CompanyCheckout() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [company, setCompany] = useState({
    cnpj: "", legal_name: "", trade_name: "",
    contact_name: "", contact_email: "", contact_phone: "",
  });
  const [planSlug, setPlanSlug] = useState<string>("familia");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [numSeats, setNumSeats] = useState(10);
  const [employees, setEmployees] = useState<Employee[]>([{ email: "", name: "", cpf: "" }]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await db
          .from("pingo_card_plans")
          .select("id, slug, name, price_monthly, price_yearly, benefits")
          .eq("is_active", true)
          .order("display_order");
        setPlans((data as any) ?? []);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Erro ao carregar planos");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selected = plans.find((p) => p.slug === planSlug);
  const basePrice = selected ? (billingCycle === "yearly" ? selected.price_yearly : selected.price_monthly) : 0;
  const pricePerSeat = Math.round(Number(basePrice) * 0.85 * 100) / 100;
  const totalAmount = Math.round(pricePerSeat * numSeats * 100) / 100;

  const updateEmployee = (i: number, k: keyof Employee, v: string) =>
    setEmployees((p) => p.map((e, idx) => (idx === i ? { ...e, [k]: v } : e)));
  const addEmployee = () => {
    if (employees.length >= numSeats) return;
    setEmployees((p) => [...p, { email: "", name: "", cpf: "" }]);
  };
  const removeEmployee = (i: number) => setEmployees((p) => p.filter((_, idx) => idx !== i));

  const submit = async () => {
    if (!company.cnpj || !company.legal_name || !company.contact_email || !company.contact_name) {
      toast.error("Preencha CNPJ, razão social, contato e email"); return;
    }
    if (numSeats < 5) { toast.error("Mínimo de 5 cartões"); return; }
    setSubmitting(true);
    try {
      const validEmployees = employees.filter((e) => e.email.trim());
      const { data, error } = await db.functions.invoke("b2b-corporate-checkout", {
        body: {
          ...company,
          pingo_card_plan_slug: planSlug,
          billing_cycle: billingCycle,
          num_seats: numSeats,
          employees: validEmployees,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Falha no checkout");
      toast.success(`Pedido criado! Convites enviados para ${data.invites?.length || 0} funcionários.`);
      navigate(`/empresas/pedido/${data.order.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro no checkout");
    } finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-primary hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="flex items-center gap-3 mb-6">
          <Building2 className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Pingo Card Corporativo</h1>
            <p className="text-sm text-muted-foreground">Compre cartões em lote para seus funcionários (15% desconto)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Dados da empresa</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>CNPJ *</Label>
                    <Input value={company.cnpj} onChange={(e) => setCompany((p) => ({ ...p, cnpj: e.target.value }))} placeholder="00.000.000/0000-00" />
                  </div>
                  <div>
                    <Label>Razão social *</Label>
                    <Input value={company.legal_name} onChange={(e) => setCompany((p) => ({ ...p, legal_name: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Nome fantasia</Label>
                    <Input value={company.trade_name} onChange={(e) => setCompany((p) => ({ ...p, trade_name: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Nome do contato (RH) *</Label>
                    <Input value={company.contact_name} onChange={(e) => setCompany((p) => ({ ...p, contact_name: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Email do contato *</Label>
                    <Input type="email" value={company.contact_email} onChange={(e) => setCompany((p) => ({ ...p, contact_email: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input value={company.contact_phone} onChange={(e) => setCompany((p) => ({ ...p, contact_phone: e.target.value }))} placeholder="(11) 99999-9999" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Plano e quantidade</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={billingCycle} onValueChange={(v) => setBillingCycle(v as any)}>
                  <TabsList className="grid grid-cols-2 max-w-xs">
                    <TabsTrigger value="monthly">Mensal</TabsTrigger>
                    <TabsTrigger value="yearly">Anual (~20% off)</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {plans.map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setPlanSlug(p.slug)}
                      className={`text-left p-4 border rounded-lg transition ${
                        planSlug === p.slug ? "border-primary bg-primary/5" : "hover:border-primary/50"
                      }`}
                    >
                      <p className="font-semibold text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        R$ {Number(billingCycle === "yearly" ? p.price_yearly : p.price_monthly).toFixed(2).replace(".", ",")} / {billingCycle === "yearly" ? "ano" : "mês"} por funcionário
                      </p>
                    </button>
                  ))}
                </div>
                <div>
                  <Label>Quantidade de cartões (mín. 5)</Label>
                  <Input type="number" min={5} value={numSeats} onChange={(e) => setNumSeats(Math.max(5, Number(e.target.value)))} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Funcionários (opcional agora)</CardTitle>
                <CardDescription>Você pode adicionar depois pelo painel da empresa.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {employees.map((e, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-7 gap-2 items-end">
                    <div className="md:col-span-3">
                      <Label className="text-xs">Email *</Label>
                      <Input type="email" value={e.email} onChange={(ev) => updateEmployee(i, "email", ev.target.value)} />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-xs">Nome</Label>
                      <Input value={e.name} onChange={(ev) => updateEmployee(i, "name", ev.target.value)} />
                    </div>
                    <div className="md:col-span-1">
                      <Label className="text-xs">CPF</Label>
                      <Input value={e.cpf} onChange={(ev) => updateEmployee(i, "cpf", ev.target.value)} />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeEmployee(i)} disabled={employees.length === 1}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addEmployee} disabled={employees.length >= numSeats}>
                  <Plus className="w-4 h-4 mr-1" /> Adicionar funcionário
                </Button>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-6">
              <CardHeader><CardTitle>Resumo</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plano</span>
                  <span>{selected?.name ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Período</span>
                  <span>{billingCycle === "yearly" ? "Anual" : "Mensal"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cartões</span>
                  <span>{numSeats}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Preço/cartão</span>
                  <span>R$ {pricePerSeat.toFixed(2).replace(".", ",")}</span>
                </div>
                <hr />
                <div className="flex justify-between text-base font-semibold">
                  <span>Total {billingCycle === "yearly" ? "/ ano" : "/ mês"}</span>
                  <span className="text-primary">R$ {totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
                <Button onClick={submit} disabled={submitting} size="lg" className="w-full">
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Contratar
                </Button>
                <p className="text-[10px] text-muted-foreground text-center">
                  Após contratar, você receberá fatura por email para pagar via Pix ou boleto.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
