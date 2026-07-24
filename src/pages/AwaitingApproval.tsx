/**
 * AwaitingApproval — Tela amigável pós-cadastro para médico e clínica.
 * Mostra status de aprovação, permite reenvio de e-mail de confirmação
 * e oferece atalhos de logout / suporte.
 */
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { db } from "@/integrations/supabase/untyped";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { toastError } from "@/lib/errorMessages";
import { CheckCircle, Clock, Envelope, ShieldCheck, ArrowRight, SignOut } from "@phosphor-icons/react";

type RoleParam = "doctor" | "clinic";

const COPY: Record<RoleParam, { eyebrow: string; title: string; subtitle: string; steps: string[] }> = {
  doctor: {
    eyebrow: "Cadastro de médico",
    title: "Estamos analisando seu cadastro",
    subtitle:
      "Nossa equipe valida CRM, CPF e documentos em até 24h úteis. Você receberá um e-mail assim que sua conta for aprovada.",
    steps: [
      "Confirme seu e-mail clicando no link enviado",
      "Validamos seu CRM junto ao Conselho Regional",
      "Liberamos seu painel para atender pacientes",
    ],
  },
  clinic: {
    eyebrow: "Cadastro de clínica",
    title: "Sua clínica está em análise",
    subtitle:
      "Validamos CNPJ, responsável técnico e dados da empresa em até 24h úteis. Avisaremos por e-mail quando o ambiente estiver pronto.",
    steps: [
      "Confirme o e-mail do responsável",
      "Validamos CNPJ e dados cadastrais",
      "Você poderá cadastrar equipe e agenda",
    ],
  },
};

export default function AwaitingApproval() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const roleParam = (params.get("role") === "clinic" ? "clinic" : "doctor") as RoleParam;
  const copy = COPY[roleParam];

  const [email, setEmail] = useState<string>("");
  const [emailConfirmed, setEmailConfirmed] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await db.auth.getUser();
      if (data?.user?.email) setEmail(data.user.email);
      if (data?.user?.email_confirmed_at) setEmailConfirmed(true);
    })();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // Detecta a aprovação (na carga + realtime) e avança o profissional sozinho,
  // em vez de deixá-lo parado nesta tela após ser aprovado.
  useEffect(() => {
    let channel: ReturnType<typeof db.channel> | null = null;
    (async () => {
      const { data: u } = await db.auth.getUser();
      const uid = u?.user?.id;
      if (!uid) return;
      const table = roleParam === "clinic" ? "clinic_profiles" : "doctor_profiles";
      const { data } = await db.from(table).select("is_approved").eq("user_id", uid).maybeSingle();
      if ((data as { is_approved?: boolean } | null)?.is_approved) { setApproved(true); return; }
      channel = db
        .channel(`approval-${uid}`)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table, filter: `user_id=eq.${uid}` },
          (payload) => { if ((payload.new as { is_approved?: boolean })?.is_approved) setApproved(true); })
        .subscribe();
    })();
    return () => { if (channel) db.removeChannel(channel); };
  }, [roleParam]);

  useEffect(() => {
    if (!approved) return;
    toast.success("Cadastro aprovado! 🎉", { description: "Levando você para o seu painel…" });
    const t = setTimeout(() => navigate("/dashboard"), 2500);
    return () => clearTimeout(t);
  }, [approved, navigate]);

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setResending(true);
    try {
      const { error } = await db.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
      toast.success("E-mail de confirmação reenviado", {
        description: "Verifique sua caixa de entrada e a pasta de spam.",
      });
      setCooldown(60);
    } catch (err) {
      toastError(toast, err, "signup");
    } finally {
      setResending(false);
    }
  };

  const handleLogout = async () => {
    await db.auth.signOut();
    navigate(roleParam === "clinic" ? "/clinica" : "/medico");
  };

  const handleCheck = async () => {
    const { data } = await db.auth.getUser();
    if (data?.user?.email_confirmed_at) {
      setEmailConfirmed(true);
      toast.success("E-mail confirmado!");
    } else {
      toast.info("Ainda não detectamos a confirmação. Clique no link do e-mail e tente de novo.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-card border border-border rounded-3xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-8 sm:p-10">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-primary-foreground/15 backdrop-blur px-3 py-1.5 rounded-full mb-5">
              <Clock className="w-3.5 h-3.5" weight="fill" />
              {copy.eyebrow}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-2">{copy.title}</h1>
            <p className="text-primary-foreground/85 text-sm sm:text-base leading-relaxed max-w-xl">
              {copy.subtitle}
            </p>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-10 space-y-7">
            {/* Aprovado — avança sozinho */}
            {approved && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 flex items-start gap-4">
                <span className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5" weight="fill" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Cadastro aprovado! 🎉</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Levando você para o painel…</p>
                  <Button size="sm" className="mt-3" onClick={() => navigate("/dashboard")}>
                    Entrar agora <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </div>
            )}
            {/* Email status */}
            <div className="rounded-2xl border border-border bg-muted/30 p-5 flex items-start gap-4">
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                emailConfirmed ? "bg-emerald-500/15 text-emerald-600" : "bg-primary/10 text-primary"
              }`}>
                {emailConfirmed
                  ? <CheckCircle className="w-5 h-5" weight="fill" />
                  : <Envelope className="w-5 h-5" weight="fill" />}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {emailConfirmed ? "E-mail confirmado" : "Confirme seu e-mail"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 break-all">
                  {email || "Carregando…"}
                </p>
                {!emailConfirmed && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleResend}
                      disabled={resending || cooldown > 0 || !email}
                    >
                      {cooldown > 0 ? `Reenviar em ${cooldown}s` : resending ? "Enviando…" : "Reenviar e-mail"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCheck}>
                      Já confirmei
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Steps */}
            <ol className="space-y-3">
              {copy.steps.map((step, i) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm text-foreground/90 leading-relaxed pt-0.5">{step}</span>
                </li>
              ))}
            </ol>

            {/* Trust */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border pt-5">
              <ShieldCheck className="w-4 h-4 text-primary" weight="fill" />
              Dados protegidos pela LGPD. Validação em conformidade com CFM/CRM.
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button onClick={() => navigate("/dashboard")} className="flex-1">
                Ir para o painel
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <SignOut className="w-4 h-4 mr-1.5" />
                Sair
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Dúvidas? <Link to="/ajuda" className="font-semibold text-primary hover:underline">Fale com o suporte</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}