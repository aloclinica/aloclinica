import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Shield, CheckCircle2, Lock, Video, ShieldCheck, Zap } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import mascotImg from "@/assets/mascot-wave.png";

const benefits = [
  { icon: Video, text: "Videochamada HD criptografada" },
  { icon: ShieldCheck, text: "Médicos verificados pelo CFM" },
  { icon: Zap, text: "Atendimento em até 10 minutos" },
];

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      // Hidden from user — protection against user enumeration
    }
    setSent(true);
    toast.success("Se esse email estiver cadastrado, você receberá um link em breve.");
  };

  return (
    <div className="min-h-screen flex">
      <SEOHead title="Recuperar Senha" description="Recupere sua senha da plataforma AloClinica." />

      {/* Left panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-secondary relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,hsl(var(--primary)/0.3),transparent_60%)]" />
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-center">
          <motion.img
            src={mascotImg}
            alt="Pingo"
            className="w-40 h-40 object-contain mb-8 drop-shadow-2xl"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
          />
          <h2 className="text-3xl font-extrabold text-white mb-3">Recupere seu acesso</h2>
          <p className="text-white/70 text-sm max-w-sm mb-8">
            Enviaremos um link seguro para redefinir sua senha
          </p>
          <div className="space-y-3 max-w-xs w-full">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-3 text-white/80 text-sm">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <b.icon className="w-4 h-4" />
                </div>
                {b.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-background relative">
        <div className="pointer-events-none absolute top-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-primary/[0.04] blur-[120px]" />

        <div className="w-full max-w-md">
          <Link to="/paciente" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Voltar ao Login
          </Link>

          {/* Mobile hero */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <img src={mascotImg} alt="Pingo" className="w-12 h-12 object-contain" />
            <div>
              <h1 className="text-lg font-bold text-foreground">Recuperar Senha</h1>
              <p className="text-xs text-muted-foreground">AloClínica</p>
            </div>
          </div>

          <div className="hidden lg:flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-7 h-7 text-primary" />
            </div>
          </div>

          <h1 className="hidden lg:block text-2xl font-extrabold text-foreground text-center mb-2">
            Esqueceu sua senha?
          </h1>
          <p className="text-center text-muted-foreground text-sm mb-8">
            Digite seu e-mail e enviaremos as instruções para recuperação.
          </p>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl bg-card border border-border/60 p-8 text-center shadow-lg"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
                <CheckCircle2 className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Email Enviado!</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Enviamos um link de recuperação para <strong className="text-foreground">{email}</strong>.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-6">
                <Shield className="w-3.5 h-3.5 text-primary" />
                Ambiente Seguro e Criptografado
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Não recebeu?{" "}
                <button onClick={() => setSent(false)} className="text-primary font-semibold hover:underline">
                  Tente novamente
                </button>
              </p>
              <Button variant="outline" onClick={() => navigate("/paciente")} className="rounded-full">
                Voltar ao login
              </Button>
            </motion.div>
          ) : (
            <div className="rounded-2xl bg-card border border-border/60 p-8 shadow-lg">
              <form onSubmit={handleReset} className="space-y-5">
                <div>
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Endereço de E-mail
                  </Label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="seu@email.com.br"
                      className="pl-11 h-12 rounded-xl bg-muted/30 border-transparent focus:border-primary/30 text-base"
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 rounded-full font-bold text-base"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? "Enviando..." : "Enviar Link de Recuperação →"}
                </Button>
              </form>

              <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground">
                <Shield className="w-3.5 h-3.5 text-primary" />
                Ambiente Seguro e Criptografado
              </div>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground mt-8">
            Ainda precisa de ajuda?{" "}
            <Link to="/dashboard/patient/support?role=patient" className="text-primary font-semibold hover:underline">
              Contate o Suporte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
