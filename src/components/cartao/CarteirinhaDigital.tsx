import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getCartaoNav } from "./cartaoNav";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, DownloadSimple, Share, ArrowRight, ShieldCheck } from "@phosphor-icons/react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Sub {
  id: string;
  card_number: string;
  status: string;
  current_period_end: string | null;
  user_id: string;
  plan?: { name: string; color: string } | null;
}

const CarteirinhaDigital = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const nav = getCartaoNav("carteirinha");
  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState<Sub | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await db
        .from("pingo_card_subscriptions")
        .select("id, card_number, status, current_period_end, user_id, plan:pingo_card_plans(name, color)")
        .eq("user_id", user.id)
        .maybeSingle();
      setSub(data as Sub | null);
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return (
      <DashboardLayout title="Carteirinha Digital" nav={nav} role="cartao_beneficios">
        <div className="max-w-2xl mx-auto"><Skeleton className="h-72 rounded-2xl" /></div>
      </DashboardLayout>
    );
  }

  if (!sub) {
    return (
      <DashboardLayout title="Carteirinha Digital" nav={nav} role="cartao_beneficios">
        <div className="max-w-2xl mx-auto">
          <Card className="rounded-2xl text-center">
            <CardContent className="p-10 space-y-4">
              <Heart size={40} weight="fill" className="mx-auto text-rose-500" />
              <h2 className="text-xl font-bold">Você ainda não tem carteirinha</h2>
              <p className="text-sm text-muted-foreground">Ative um plano para gerar sua carteirinha digital com QR Code.</p>
              <Button onClick={() => navigate("/dashboard/cartao/plano?role=cartao_beneficios")} className="rounded-xl">
                Ver planos <ArrowRight size={16} weight="bold" className="ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const fullName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || user?.email?.split("@")[0] || "Titular";
  const payload = `PINGO:${sub.card_number}:${sub.user_id}`;
  const isCanceled = sub.status === "canceled";

  const share = async () => {
    try {
      await navigator.share?.({ title: "Cartão Benefícios", text: `Carteirinha ${sub.card_number}` });
    } catch {
      navigator.clipboard.writeText(sub.card_number);
      toast.success("Número copiado");
    }
  };

  return (
    <DashboardLayout title="Carteirinha Digital" nav={nav} role="cartao_beneficios">
      <div className="max-w-2xl mx-auto space-y-5">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-[hsl(340,75%,40%)] via-[hsl(345,70%,48%)] to-[hsl(355,65%,55%)] text-white rounded-3xl">
            <CardContent className="p-7">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Heart size={20} weight="fill" className="text-amber-300" />
                  <span className="font-bold tracking-wide text-sm">CARTÃO BENEFÍCIOS</span>
                </div>
                <Badge className="bg-amber-400 text-amber-950 border-0">{sub.plan?.name ?? "Plano"}</Badge>
              </div>
              <p className="text-2xl md:text-3xl font-mono tracking-widest mb-6">{sub.card_number}</p>
              <div className="grid grid-cols-2 gap-4 text-sm mb-5">
                <div>
                  <p className="text-[10px] uppercase opacity-75 font-bold">Titular</p>
                  <p className="font-semibold truncate">{fullName}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase opacity-75 font-bold">Válido até</p>
                  <p className="font-semibold">
                    {sub.current_period_end ? format(new Date(sub.current_period_end), "MM/yy") : "—"}
                  </p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl flex flex-col items-center">
                <QRCodeSVG value={payload} size={140} />
                <p className="text-[11px] text-foreground/70 mt-2 font-medium">Apresente em parceiros</p>
              </div>
              {!isCanceled && (
                <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-white/90">
                  <ShieldCheck size={14} weight="fill" className="text-emerald-300" />
                  Carteirinha verificada · ativa
                </div>
              )}
              {isCanceled && <Badge variant="destructive" className="mt-4">Assinatura cancelada</Badge>}
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={share} className="rounded-xl gap-2 h-12">
            <Share size={18} weight="bold" /> Compartilhar
          </Button>
          <Button variant="outline" onClick={() => window.print()} className="rounded-xl gap-2 h-12">
            <DownloadSimple size={18} weight="bold" /> Salvar
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CarteirinhaDigital;