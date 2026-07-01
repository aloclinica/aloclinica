import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getAdminNav } from "@/components/admin/adminNav";
import { db } from "@/integrations/supabase/untyped";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Wallet, CheckCircle2, Copy } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
// UI: standardized empty-state block
import { AdminEmpty } from "@/components/admin/AdminStateBlocks";

const STATUSES = ["pending", "ready", "paid", "disputed", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

const statusColor: Record<Status, string> = {
  pending: "bg-amber-100 text-amber-700",
  ready: "bg-emerald-100 text-emerald-700",
  paid: "bg-blue-100 text-blue-700",
  disputed: "bg-red-100 text-red-700",
  cancelled: "bg-muted text-muted-foreground",
};

const AdminPayouts = () => {
  const [tab, setTab] = useState<Status>("ready");
  const [txMap, setTxMap] = useState<Record<string, string>>({});
  const qc = useQueryClient();

  const { data: payouts = [], isLoading } = useQuery({
    queryKey: ["admin-payouts", tab],
    queryFn: async () => {
      const { data, error } = await db
        .from("doctor_payouts")
        .select("id, doctor_id, appointment_id, gross_amount, platform_fee, net_amount, status, release_at, paid_at, pix_key, pix_tx_id, created_at, doctor_profiles!inner(user_id, crm, crm_state, profiles!inner(first_name, last_name))")
        .eq("status", tab)
        .order("release_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  const totals = (payouts as any[]).reduce(
    (acc, p) => ({ gross: acc.gross + Number(p.gross_amount || 0), net: acc.net + Number(p.net_amount || 0) }),
    { gross: 0, net: 0 }
  );

  const markPaid = async (id: string) => {
    const tx = txMap[id]?.trim();
    if (!tx) { toast.error("Informe o ID da transação PIX"); return; }
    const { error } = await db
      .from("doctor_payouts")
      .update({ status: "paid", paid_at: new Date().toISOString(), pix_tx_id: tx })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Repasse marcado como pago");
    qc.invalidateQueries({ queryKey: ["admin-payouts"] });
  };

  return (
    <DashboardLayout title="Repasses Médicos" nav={getAdminNav("payouts")}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" /> Repasses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Total bruto ({tab})</p>
                <p className="text-2xl font-bold">R$ {totals.gross.toFixed(2)}</p>
              </div>
              <div className="rounded-lg border p-4 bg-emerald-50/40">
                <p className="text-xs text-muted-foreground">Total líquido a pagar</p>
                <p className="text-2xl font-bold text-emerald-700">R$ {totals.net.toFixed(2)}</p>
              </div>
            </div>
            <Tabs value={tab} onValueChange={(v) => setTab(v as Status)}>
              <TabsList className="grid grid-cols-5 w-full">
                {STATUSES.map((s) => <TabsTrigger key={s} value={s} className="capitalize">{s}</TabsTrigger>)}
              </TabsList>
              <TabsContent value={tab} className="mt-4 space-y-2">
                {isLoading ? <p className="text-sm text-muted-foreground">Carregando...</p>
                : payouts.length === 0 ? <AdminEmpty icon={Wallet} title={`Nenhum repasse ${tab}`} description="Não há repasses com este status no momento." />
                : (payouts as any[]).map((p) => {
                    const dr = p.doctor_profiles?.profiles;
                    return (
                      <div key={p.id} className="rounded-lg border p-3 flex items-center justify-between gap-3 flex-wrap">
                        <div>
                          <p className="font-medium">Dr(a). {dr?.first_name} {dr?.last_name}</p>
                          <p className="text-xs text-muted-foreground">CRM {p.doctor_profiles?.crm}/{p.doctor_profiles?.crm_state} · liberado em {format(new Date(p.release_at), "dd/MM/yyyy")}</p>
                          {p.pix_key && (
                            <p className="text-xs flex items-center gap-1 mt-1">
                              <span className="text-muted-foreground">PIX:</span> <code className="bg-muted px-1 rounded">{p.pix_key}</code>
                              <button type="button" aria-label="Copiar chave PIX" onClick={() => { navigator.clipboard.writeText(p.pix_key); toast.success("PIX copiado"); }} className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Copy className="h-3 w-3" /></button>
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold">R$ {Number(p.net_amount).toFixed(2)}</p>
                            <p className="text-[10px] text-muted-foreground">bruto R$ {Number(p.gross_amount).toFixed(2)} · taxa R$ {Number(p.platform_fee).toFixed(2)}</p>
                          </div>
                          <Badge className={statusColor[p.status as Status]}>{p.status}</Badge>
                          {p.status === "ready" && (
                            <div className="flex items-center gap-1">
                              <Input placeholder="ID transação PIX" className="h-8 w-44"
                                value={txMap[p.id] || ""} onChange={(e) => setTxMap({ ...txMap, [p.id]: e.target.value })} />
                              <Button size="sm" onClick={() => markPaid(p.id)}><CheckCircle2 className="h-4 w-4 mr-1" /> Pago</Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminPayouts;