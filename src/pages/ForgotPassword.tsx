import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  Shield,
  CheckCircle2,
  Lock,
  Video,
  ShieldCheck,
  Zap,
  MailCheck,
  Inbox,
  Clock,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import mascotImg from "@/assets/mascot-wave.png";

const benefits = [
  { icon: Video, text: "Videochamada HD criptografada" },
  { icon: ShieldCheck, text: "Médicos verificados pelo CFM" },
  { icon: Zap, text: "Atendimento em até 10 minutos" },
];

const steps = [
  { icon: Inbox, title: "Verifique sua caixa de entrada", desc: "O email pode levar até 2 minutos para chegar." },
  { icon: AlertCircle, title: "Não esqueça do spam", desc: "Às vezes o email vai para a pasta de promoções ou lixo eletrônico." },
  { icon: Lock, title: "Clique no link seguro", desc: "Você poderá criar uma nova senha forte." },
];

const RESEND_COOLDOWN_SECONDS = 45;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();

  const emailValid = useMemo(() => EMAIL_REGEX.test(email.trim()), [email]);
  const showError = touched && email.length > 0 && !emailValid;

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!emailValid) {
      toast.error("Email inválido", { description: "Verifique e tente novamente." });
      return;
    }
    if (cooldown > 0) return;

    setLoading(true);
    const { error } = await db.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      // Hidden from user — protection against user enumeration
    }
    setSent(true);
    setCooldown(RESEND_COOLDOWN_SECONDS);
    toast.success("Link enviado!", {
      description: "Se esse email estiver cadastrado, você receberá as instruções em instantes.",
    });
  };

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    await db.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    setCooldown(RESEND_COOLDOWN_SECONDS);
    toast.success("Reenviado!", { description: "Verifique sua caixa de entrada novamente." });
  };

  return (
    <div className="min-h-screen flex bg-background">
      <SEOHead
        title="Recuperar Senha — AloClínica"
        description="Recupere o acesso à sua conta AloClínica em poucos passos."
      />

      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] bg-gradient-to-br from-primary via-primary to-secondary relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,hsl(var(--primary-foreground)/0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsl(var(--accent)/0.25),transparent_50%)]" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary-foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary-foreground)) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-center">
          <motion.img
            src={mascotImg}
            alt="Pingo"
            loading="lazy"
            className="w-44 h-44 object-contain mb-8 drop-shadow-2xl"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
          />
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-extrabold text-primary-foreground mb-3 leading-tight"
          >
            Recupere seu acesso
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-primary-foreground/75 text-base max-w-sm mb-10"
          >
            Em poucos cliques você volta a cuidar da sua saúde com a gente.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-3 max-w-xs w-full"
          >
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="flex items-center gap-3 text-primary-foreground/85 text-sm bg-primary-foreground/5 backdrop-blur-sm rounded-xl px-4 py-3 border border-primary-foreground/10"
              >
                <div className="w-9 h-9 rounded-lg bg-primary-foreground/10 flex items-center justify-center shrink-0">
                  <b.icon className="w-4 h-4" />
                </div>
                <span className="text-left">{b.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 sm:px-8 sm:py-12 relative">
        <div className="pointer-events-none absolute top-[-20%] right-[-10%] w-[420px] h-[420px] rounded-full bg-primary/[0.05] blur-[120px]" />
        <div className="pointer-events-none absolute bottom-[-15%] left-[-10%] w-[360px] h-[360px] rounded-full bg-secondary/[0.04] blur-[110px]" />

        <div className="w-full max-w-md relative">
          <Link
            to="/paciente"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Voltar ao Login
          </Link>

          {/* Mobile mini header */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <img src={mascotImg} alt="Pingo" loading="lazy" className="w-12 h-12 object-contain" />
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">Recuperar Senha</h1>
              <p className="text-xs text-muted-foreground">AloClínica</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4 }}
              >
                <div className="rounded-2xl bg-card border border-border/60 p-7 sm:p-8 shadow-xl shadow-primary/5">
                  <div className="flex flex-col items-center text-center">
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 14 }}
                      className="relative w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-5"
                    >
                      <MailCheck className="w-10 h-10 text-emerald-500" />
                      <motion.span
                        className="absolute inset-0 rounded-full border-2 border-emerald-500/30"
                        animate={{ scale: [1, 1.3, 1.3], opacity: [0.6, 0, 0] }}
                        transition={{ duration: 1.8, repeat: Infinity }}
                      />
                    </motion.div>
                    <h3 className="text-2xl font-extrabold text-foreground mb-2">
                      Verifique seu email
                    </h3>
                    <p className="text-muted-foreground text-sm mb-5 leading-relaxed">
                      Se houver uma conta associada a{" "}
                      <strong className="text-foreground break-all">{email.trim()}</strong>, você
                      receberá um link de recuperação em alguns instantes.
                    </p>
                  </div>

                  {/* Steps */}
                  <div className="space-y-2.5 mb-6">
                    {steps.map((s, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + i * 0.08 }}
                        className="flex gap-3 items-start rounded-xl bg-muted/40 p-3 border border-border/40"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <s.icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="text-left min-w-0">
                          <p className="text-sm font-semibold text-foreground leading-tight">
                            {s.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                            {s.desc}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Resend */}
                  <div className="border-t border-border/60 pt-5 space-y-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResend}
                      disabled={cooldown > 0 || loading}
                      className="w-full h-11 rounded-full font-semibold gap-2"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Reenviando...
                        </>
                      ) : cooldown > 0 ? (
                        <>
                          <Clock className="w-4 h-4" />
                          Aguarde {cooldown}s para reenviar
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          Reenviar email
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => navigate("/paciente")}
                      className="w-full h-11 rounded-full font-bold"
                    >
                      Voltar ao login
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setSent(false);
                        setEmail("");
                        setTouched(false);
                      }}
                      className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center pt-1"
                    >
                      Usar outro email
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 mt-5 text-xs text-muted-foreground">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  Conexão segura e criptografada de ponta a ponta
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4 }}
              >
                <div className="hidden lg:flex justify-center mb-5">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center border border-primary/10">
                      <Lock className="w-7 h-7 text-primary" />
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 2.4, repeat: Infinity }}
                      className="absolute inset-0 rounded-2xl border-2 border-primary/30"
                    />
                  </div>
                </div>

                <h1 className="hidden lg:block text-3xl font-extrabold text-foreground text-center mb-2 tracking-tight">
                  Esqueceu sua senha?
                </h1>
                <p className="text-center text-muted-foreground text-sm mb-7 max-w-sm mx-auto leading-relaxed">
                  Sem problemas. Digite o email cadastrado e enviaremos um link seguro para criar
                  uma nova senha.
                </p>

                <div className="rounded-2xl bg-card border border-border/60 p-7 sm:p-8 shadow-xl shadow-primary/5">
                  <form onSubmit={handleReset} className="space-y-5" noValidate>
                    <div>
                      <Label
                        htmlFor="email"
                        className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                      >
                        Endereço de Email
                      </Label>
                      <div className="relative mt-2">
                        <Mail
                          className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                            showError
                              ? "text-destructive"
                              : emailValid
                                ? "text-emerald-500"
                                : "text-muted-foreground"
                          }`}
                        />
                        <Input
                          id="email"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onBlur={() => setTouched(true)}
                          placeholder="seu@email.com.br"
                          className={`pl-11 h-12 rounded-xl bg-muted/30 text-base transition-colors ${
                            showError
                              ? "border-destructive/60 focus-visible:ring-destructive/40"
                              : "border-transparent focus:border-primary/40"
                          }`}
                          required
                          autoFocus
                          aria-invalid={showError}
                          aria-describedby={showError ? "email-error" : undefined}
                        />
                        {emailValid && (
                          <CheckCircle2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                        )}
                      </div>
                      <AnimatePresence>
                        {showError && (
                          <motion.p
                            id="email-error"
                            initial={{ opacity: 0, y: -4, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: -4, height: 0 }}
                            className="text-xs text-destructive mt-2 flex items-center gap-1.5"
                          >
                            <AlertCircle className="w-3 h-3" />
                            Digite um email válido
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 rounded-full font-bold text-base group"
                      size="lg"
                      disabled={loading || (touched && !emailValid)}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Enviando...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Enviar Link de Recuperação
                          <ArrowLeft className="w-4 h-4 rotate-180 transition-transform group-hover:translate-x-1" />
                        </span>
                      )}
                    </Button>
                  </form>

                  <div className="flex items-center justify-center gap-2 mt-6 pt-5 border-t border-border/40 text-xs text-muted-foreground">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    Ambiente seguro e criptografado
                  </div>
                </div>

                <p className="text-center text-sm text-muted-foreground mt-6">
                  Lembrou a senha?{" "}
                  <Link to="/paciente" className="text-primary font-bold hover:underline">
                    Faça login
                  </Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Precisa de ajuda?{" "}
            <Link
              to="/dashboard/patient/support?role=patient"
              className="text-primary font-semibold hover:underline"
            >
              Fale com o suporte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
