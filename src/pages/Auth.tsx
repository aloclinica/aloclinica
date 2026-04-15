import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Heart, Stethoscope, Building2, ArrowRight, Mail, Lock,
  Eye, EyeOff, Sparkles, LogIn, ShieldCheck,
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import logo from "@/assets/logo.png";
import mascotWelcome from "@/assets/mascot-welcome.png";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const roleCards = [
  {
    to: "/paciente",
    title: "Sou paciente",
    desc: "Consultas, receitas e histórico médico",
    icon: Heart,
    gradient: "from-[hsl(195,75%,50%)] to-[hsl(340,75%,60%)]",
    iconBg: "from-[hsl(195,75%,90%)] to-[hsl(340,75%,95%)]",
    iconColor: "text-[hsl(340,75%,50%)]",
  },
  {
    to: "/medico",
    title: "Sou médico",
    desc: "Atenda pacientes online e gerencie sua agenda",
    icon: Stethoscope,
    gradient: "from-[hsl(210,85%,45%)] to-[hsl(160,70%,40%)]",
    iconBg: "from-[hsl(210,85%,92%)] to-[hsl(160,70%,92%)]",
    iconColor: "text-[hsl(210,85%,40%)]",
  },
];

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await db.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Erro ao entrar", { description: error.message });
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <SEOHead title="Entrar — AloClínica" description="Escolha como você deseja acessar a AloClínica." />
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[hsl(210,40%,97%)] via-background to-[hsl(340,40%,97%)]" />
      <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/[0.06] blur-[120px] -z-10" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] rounded-full bg-secondary/[0.08] blur-[100px] -z-10" />

      <div className="container mx-auto px-4 py-10 lg:py-16 max-w-5xl">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center mb-10">
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-3 mb-6">
            <img src={logo} alt="AloClínica" className="w-12 h-12 rounded-2xl shadow-md" />
            <span className="text-2xl font-extrabold text-foreground tracking-tight">AloClínica</span>
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-3xl lg:text-5xl font-black text-foreground tracking-tight mb-3">
            Como você quer{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">entrar?</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-sm lg:text-base text-muted-foreground max-w-lg mx-auto">
            Escolha seu perfil para acessar a plataforma de saúde digital mais completa do Brasil.
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={stagger} className="grid md:grid-cols-3 gap-5 mb-10">
          {roleCards.map((card) => (
            <motion.div key={card.to} variants={fadeUp}>
              <Link
                to={card.to}
                className="group block p-6 lg:p-7 rounded-3xl bg-card border border-border hover:border-transparent hover:shadow-2xl transition-all relative overflow-hidden h-full"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity`} />
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${card.iconBg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <card.icon className={`w-8 h-8 ${card.iconColor}`} />
                </div>
                <h3 className="text-xl font-extrabold text-foreground mb-2">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{card.desc}</p>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-3 transition-all">
                  Acessar <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="max-w-md mx-auto">
          {!showLogin ? (
            <button
              onClick={() => setShowLogin(true)}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Já tenho conta — <span className="font-semibold underline">fazer login rápido</span>
            </button>
          ) : (
            <motion.form
              onSubmit={handleLogin}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <img src={mascotWelcome} alt="" className="w-10 h-10 object-contain" />
                <div>
                  <p className="text-sm font-bold text-foreground">Login rápido</p>
                  <p className="text-xs text-muted-foreground">Sua conta te leva ao painel certo</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold">Email</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/50" />
                  <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@exemplo.com" className="pl-11 h-12 rounded-xl" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Senha</Label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline">Esqueci</Link>
                </div>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/50" />
                  <Input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="pl-11 pr-11 h-12 rounded-xl" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground">
                    {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold">
                {loading ? <Sparkles className="w-4 h-4 animate-spin" /> : (<>Entrar <LogIn className="w-4 h-4 ml-2" /></>)}
              </Button>
              <button type="button" onClick={() => setShowLogin(false)} className="w-full text-xs text-center text-muted-foreground hover:text-foreground pt-1">
                Voltar aos perfis
              </button>
            </motion.form>
          )}
        </motion.div>

        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground mt-10">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-primary" /> LGPD</span>
          <Link to="/terms" className="hover:underline">Termos</Link>
          <Link to="/privacy" className="hover:underline">Privacidade</Link>
        </div>
      </div>
    </div>
  );
};

export default Auth;
