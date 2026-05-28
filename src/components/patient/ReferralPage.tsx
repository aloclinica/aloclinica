/**
 * Programa de indicação — paciente vê seu código único, link compartilhável
 * e quantos indicados já se cadastraram + créditos liberados.
 *
 * O código é criado on-demand no primeiro acesso (idempotente: 1 código por
 * usuário). Os triggers DB cuidam de liberar o crédito quando o indicado
 * conclui a 1a consulta paga.
 */
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getPatientNav } from "./patientNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/ui/kpi-card";
import { Gift, Share2, Copy, Check, Users, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { logError } from "@/lib/logger";

const REFEREE_CREDIT = 30;
const REFERRER_CREDIT = 30;

const ReferralPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState<string | null>(null);
  const [usageCount, setUsageCount] = useState(0);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        // 1) procura código existente
        const { data: existing } = await db.from("referrals")
          .select("id, code, usage_count")
          .eq("referrer_user_id", user.id)
          .maybeSingle();
        let referralId: string;
        let refCode: string;
        let count = 0;
        if (existing) {
          referralId = (existing as any).id;
          refCode = (existing as any).code;
          count = (existing as any).usage_count ?? 0;
        } else {
          // 2) cria — o BEFORE trigger gera o code
          const { data: created, error: insErr } = await db.from("referrals")
            .insert({ referrer_user_id: user.id, usage_count: 0 } as any)
            .select("id, code, usage_count").single();
          if (insErr || !created) throw insErr ?? new Error("create failed");
          referralId = (created as any).id;
          refCode = (created as any).code;
          count = 0;
        }
        setCode(refCode);

        // 3) conta usos + desbloqueados
        const { data: uses } = await db.from("referral_uses")
          .select("id, referrer_credit_unlocked")
          .eq("referral_id", referralId);
        setUsageCount(uses?.length ?? count);
        setUnlockedCount((uses ?? []).filter((u: any) => u.referrer_credit_unlocked).length);
      } catch (e) {
        logError("ReferralPage", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const link = code ? `https://aloclinica.com.br/paciente/cadastro?ref=${code}` : "";

  const copyLink = async () => {
    if (!link) return;
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); toast.success("Link copiado!"); } catch { /* */ }
  };

  const share = async () => {
    if (!link) return;
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({
          title: "AloClínica — consulta médica online",
          text: `Use meu código ${code} e ganhe R$ ${REFEREE_CREDIT} de desconto na primeira consulta.`,
          url: link,
        });
      } catch { /* user cancelou */ }
    } else {
      copyLink();
    }
  };

  return (
    <DashboardLayout title="Indique e ganhe" nav={getPatientNav("home")} role="patient">
      <div className="max-w-2xl mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Gift className="w-5 h-5 text-primary" /> Indique e ganhe R$ {REFERRER_CREDIT}</h1>
          <p className="text-sm text-muted-foreground">
            Compartilhe seu código com amigos. Eles ganham <strong>R$ {REFEREE_CREDIT}</strong> no cadastro
            e você ganha <strong>R$ {REFERRER_CREDIT}</strong> quando eles concluem a primeira consulta.
          </p>
        </div>

        {loading ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : (
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-primary/15 to-primary/5 p-6 text-center border-b border-border/40">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Seu código</p>
              <p className="text-3xl md:text-4xl font-black tabular-nums text-primary tracking-wider mt-1 select-all">{code}</p>
            </div>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Input value={link} readOnly className="text-xs" />
                <Button onClick={copyLink} variant="outline" size="icon" aria-label="Copiar link">
                  {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <Button onClick={share} className="w-full rounded-xl gap-2 h-11">
                <Share2 className="w-4 h-4" /> Compartilhar
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && (
          <div className="grid grid-cols-3 gap-3">
            <KpiCard icon={Users} label="Cadastros" value={usageCount} />
            <KpiCard icon={Sparkles} label="1ª consulta feita" value={unlockedCount} help="créditos liberados" />
            <KpiCard icon={Gift} label="Crédito acumulado" value={`R$ ${(unlockedCount * REFERRER_CREDIT).toFixed(2).replace(".", ",")}`} />
          </div>
        )}

        <p className="text-[11px] text-muted-foreground text-center">
          O crédito é abatido automaticamente na próxima consulta paga.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default ReferralPage;
