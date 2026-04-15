import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowLeft, Shield, Sparkles, CheckCircle2, Eye, EyeOff } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import pingoAdmin from "@/assets/pingo-admin.png";
import logo from "@/assets/logo.png";

const AuthAdmin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await db.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Erro ao entrar", { description: error.message });
    } else {
      navigate("/dashboard/admin/panel-center");
    }
  };

  const features = [
    "Dashboard financeiro completo",
    "Gestão de planos e assinaturas",
    "Controle de inadimplência",
    "Aprovação de médicos e clínicas",
  ];

  return (
    <div className="min-h-screen relative flex">
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-background via-muted/30 to-muted/50" />
      <SEOHead title="Acesso Administrativo" description="Painel administrativo da AloClinica." />

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[46%] bg-[hsl(220,40%,8%)] relative overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[400px] h-[400px] rounded-full bg-primary/[0.08] blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[350px] h-[350px] rounded-full bg-white/[0.03] blur-[80px]" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1.5px 1.5px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white/70 transition text-sm group mb-10">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Voltar ao início
            </Link>

            <div className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/[0.08]">
                <Shield className="w-7 h-7 text-white/90" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin</h1>
                <p className="text-sm text-white/50 mt-0.5">Painel Administrativo</p>
              </div>
            </div>
            <p className="text-sm text-white/55 max-w-sm leading-relaxed mb-8">
              Acesso restrito. Gerencie toda a plataforma: faturamento, cadastros e relatórios.
            </p>

            <div className="space-y-3">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-3 text-sm text-white/60"
                >
                  <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white/50" />
                  </div>
                  {f}
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            className="flex justify-center mt-8"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.img
              src={pingoAdmin}
              alt="Pingo Admin"
              className="w-52 h-52 object-contain select-none"
              style={{ filter: "drop-shadow(0 8px 32px rgba(0,0,50,.4))" }}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              loading="eager" decoding="async" width={208} height={208}
            />
          </motion.div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col min-h-screen">
        <div className="lg:hidden bg-[hsl(220,40%,8%)] px-5 pt-[max(env(safe-area-inset-top,12px),12px)] pb-6 relative overflow-hidden">
          <div className="absolute top-[-30%] right-[-20%] w-[200px] h-[200px] rounded-full bg-primary/[0.06] blur-[60px]" />
          <Link to="/" className="relative z-10 inline-flex items-center gap-2 text-white/50 hover:text-white/70 transition text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <div className="relative z-10 flex items-center gap-3">
            <img src={pingoAdmin} alt="Pingo" className="w-14 h-14 object-contain drop-shadow-lg" loading="lazy" decoding="async" width={56} height={56} />
            <div>
              <h1 className="text-xl font-bold text-white">Painel Administrativo</h1>
              <p className="text-xs text-white/50">Área restrita</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-5 py-8 lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md"
          >
            {/* Desktop header */}
            <div className="hidden lg:flex items-center gap-3 mb-8">
              <img src={logo} alt="AloClínica" className="w-10 h-10 rounded-xl shadow-md" />
              <div>
                <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Acesso Administrativo</h2>
                <p className="text-xs text-muted-foreground">Área restrita</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <Label className="text-sm font-semibold text-foreground">Email</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/50" />
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@aloclinica.com"
                    className="pl-11 h-[52px] rounded-2xl bg-card border-border/60 shadow-sm focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)] focus-visible:border-primary/40 text-[15px]"
                    required
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-foreground">Senha</Label>
                  <Link to="/forgot-password" className="text-[13px] font-semibold text-primary hover:underline">
                    Esqueci minha senha
                  </Link>
                </div>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/50" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-11 pr-11 h-[52px] rounded-2xl bg-card border-border/60 shadow-sm focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)] focus-visible:border-primary/40 text-[15px]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-[52px] rounded-2xl bg-gradient-to-r from-foreground to-foreground/90 text-background font-bold text-base shadow-lg hover:shadow-xl hover:brightness-110 active:scale-[0.98] transition-all"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-spin" /> Entrando...
                  </motion.span>
                ) : "Entrar como Admin"}
              </Button>
            </form>
          </motion.div>
        </div>

        <div className="px-5 py-3.5 pb-[max(env(safe-area-inset-bottom,8px),8px)] border-t border-border/40 bg-muted/20 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-foreground shrink-0" /> Acesso restrito</span>
          <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 shrink-0" /> Criptografado</span>
          <span className="flex items-center gap-1.5 text-destructive"><Sparkles className="w-3.5 h-3.5 shrink-0" /> 2FA obrigatório</span>
        </div>
      </div>
    </div>
  );
};

export default AuthAdmin;
