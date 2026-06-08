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
import pingoLogo from "@/assets/pingo-cartao.png";

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
        {/* CARTÃO PREMIUM — frente */}
        <motion.div
          initial={{ opacity: 0, y: 20, rotateX: -15 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{ perspective: 1200 }}
        >
          <div className="relative rounded-[28px] overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] aspect-[1.586/1] max-w-[440px] mx-auto group">
            {/* Base metálica escura */}
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#0a1628_0%,#0f2942_30%,#1a3a5c_55%,#0f2942_80%,#0a1628_100%)]" />
            {/* Reflexo holográfico */}
            <div className="absolute inset-0 opacity-40 mix-blend-screen bg-[conic-gradient(from_135deg_at_60%_40%,transparent_0deg,rgba(120,200,255,0.35)_60deg,transparent_120deg,rgba(255,180,220,0.25)_200deg,transparent_280deg,rgba(120,255,220,0.3)_340deg,transparent_360deg)]" />
            {/* Linhas guilhoché */}
            <div className="absolute inset-0 opacity-[0.07]" style={{
              backgroundImage: "repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 8px), repeating-linear-gradient(-45deg, #fff 0 1px, transparent 1px 8px)"
            }} />
            {/* Brilho diagonal animado no hover */}
            <div
              className="absolute -inset-x-1/2 -inset-y-1/2 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.18)_50%,transparent_60%)] translate-x-[-100%] group-hover:translate-x-[100%] transition-transform"
              style={{ transitionDuration: "1400ms" }}
            />

            <div className="relative h-full w-full p-5 sm:p-6 flex flex-col text-white">
              {/* Topo: Logo Pingo + bandeira plano */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 rounded-full bg-white/95 ring-2 ring-amber-300/60 shadow-lg flex items-center justify-center overflow-hidden">
                    <img src={pingoLogo} alt="Pingo" className="w-9 h-9 object-contain" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-[9px] tracking-[0.25em] text-amber-200/90 font-semibold">PINGO CARD</p>
                    <p className="text-[13px] font-bold tracking-wide">Benefícios Saúde</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 border-0 font-bold tracking-wider text-[10px] px-2.5 py-0.5 shadow-md">
                    {(sub.plan?.name ?? "PLANO").toUpperCase()}
                  </Badge>
                  {!isCanceled && (
                    <p className="text-[9px] mt-1 text-emerald-300/90 font-semibold flex items-center justify-end gap-1">
                      <ShieldCheck size={10} weight="fill" /> ATIVO
                    </p>
                  )}
                </div>
              </div>

              {/* Chip + contactless */}
              <div className="flex items-center gap-3 mt-5">
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

              {/* Número do cartão */}
              <p className="mt-3 font-mono text-[17px] sm:text-[19px] tracking-[0.18em] font-semibold drop-shadow-sm">
                {sub.card_number.replace(/(.{4})/g, "$1 ").trim()}
              </p>

              {/* Rodapé: titular + validade */}
              <div className="mt-auto flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[8px] uppercase tracking-[0.2em] text-white/60 font-bold">Titular</p>
                  <p className="text-[13px] font-bold uppercase tracking-wide truncate">{fullName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] uppercase tracking-[0.2em] text-white/60 font-bold">Válido até</p>
                  <p className="text-[13px] font-bold font-mono tracking-wider">
                    {sub.current_period_end ? format(new Date(sub.current_period_end), "MM/yy") : "—/—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* VERSO — QR Code de validação */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="overflow-hidden border border-border/50 shadow-xl rounded-3xl bg-gradient-to-br from-background to-muted/40">
            <CardContent className="p-6 flex items-center gap-5">
              <div className="bg-white p-3 rounded-2xl shadow-md ring-1 ring-border">
                <QRCodeSVG value={payload} size={110} />
              </div>
              <div className="flex-1 space-y-1.5">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary">Validação</p>
                <p className="text-base font-bold leading-tight">Apresente em parceiros credenciados</p>
                <p className="text-xs text-muted-foreground">O parceiro escaneia o QR para confirmar seu plano e aplicar o desconto.</p>
                {isCanceled && <Badge variant="destructive" className="mt-1">Assinatura cancelada</Badge>}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={share} className="rounded-2xl gap-2 h-12">
            <Share size={18} weight="bold" /> Compartilhar
          </Button>
          <Button variant="outline" onClick={() => window.print()} className="rounded-2xl gap-2 h-12">
            <DownloadSimple size={18} weight="bold" /> Salvar
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CarteirinhaDigital;
