import { useState, useMemo } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Lock, ArrowLeft, Eye, EyeOff, Glasses, Sparkles, ClipboardCheck,
  ArrowRight, LogIn, ShieldCheck, CheckCircle2, Stethoscope, Zap, Brain,
} from "lucide-react";
import TermsConsentCheckbox from "@/components/auth/TermsConsentCheckbox";
import { registerConsent } from "@/lib/consent";
import SEOHead from "@/components/SEOHead";
import PasswordStrength from "@/components/ui/password-strength";
import logo from "@/assets/logo.png";
import pingoOftalmo from "@/assets/pingo-oftalmo.png";

type Step = "welcome" | "register" | "login";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

const benefits = [
  { icon: Eye, title: "Laudos oftalmológicos", desc: "Fundoscopia, campimetria e tonometria digital." },
  { icon: Glasses, title: "Receita de óculos", desc: "Prescrição digital válida com QR Code." },
  { icon: Brain, title: "IA de triagem", desc: "Apoio à análise de retinografias." },
  { icon: ClipboardCheck, title: "Histórico integrado", desc: "Prontuário oftalmológico completo." },
];

const OPH_SPECIALTIES = [
  "Oftalmologia Geral", "Catarata", "Retina", "Glaucoma", "Córnea",
  "Oftalmopediatria", "Plástica Ocular", "Refração", "Estrabismo",
];

const AuthOftalmologista = () => {
  const [searchParams] = useSearchParams();
  const hasLoginAccess = useMemo(() => searchParams.get("acesso") === "entrar", [searchParams]);
  const [step, setStep] = useState<Step>(hasLoginAccess ? "login" : "welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [crm, setCrm] = useState("");
  const [crmState, setCrmState] = useState("SP");
  const [specialty, setSpecialty] = useState(OPH_SPECIALTIES[0]);
  const [termsAccepted, setTermsAccepted] = useState(false);
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
      navigate("/dashboard?role=ophthalmologist");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      toast.error("Aceite os termos", { description: "Você precisa aceitar os Termos de Uso." });
      return;
    }
    setLoading(true);
    const { data, error } = await db.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { first_name: firstName, last_name: lastName },
      },
    });
    if (error) {
      setLoading(false);
      toast.error("Erro no cadastro", { description: error.message });
      return;
    }
    if (data.user) {
      await db.functions.invoke("assign-role", {
        body: {
          user_id: data.user.id,
          role: "ophthalmologist",
          profile_data: { crm, crm_state: crmState, specialty },
        },
      });
      await registerConsent(data.user.id, "terms_and_privacy_doctor");
    }
    setLoading(false);
    toast.success("Cadastro realizado!", { description: "Seu CRM passará por verificação." });
    navigate("/dashboard?role=ophthalmologist");
  };

  return (
    <div className="min-h-screen relative flex">
      <SEOHead title="Portal do Oftalmologista — AloClínica" description="Atenda pacientes oftalmológicos online com tecnologia de ponta." />
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[hsl(190,70%,97%)] via-background to-[hsl(270,55%,96%)]" />

      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-[46%] relative overflow-hidden bg-gradient-to-br from-[hsl(190,85%,35%)] via-[hsl(220,75%,40%)] to-[hsl(275,65%,45%)]">
        <div className="absolute top-[-20%] right-[-15%] w-[460px] h-[460px] rounded-full bg-white/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[360px] h-[360px] rounded-full bg-[hsl(275,80%,60%)]/30 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 1.5px 1.5px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white/90 transition text-sm group mb-10">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Voltar ao início
            </Link>
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.div variants={fadeUp} className="flex items-center gap-3 mb-7">
                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  <Eye className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold text-white tracking-tight">Oftalmologia</h1>
                  <p className="text-sm text-white/70 mt-0.5">Portal do especialista</p>
                </div>
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-[32px] xl:text-[38px] font-black text-white leading-[1.1] tracking-tight mb-4">
                Tecnologia a serviço da{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">visão</span>
                  <span className="absolute inset-x-0 bottom-1 h-3 bg-white/20 -skew-x-3 rounded" />
                </span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-sm text-white/75 leading-relaxed max-w-sm mb-8">
                Realize consultas, laudos e prescreva óculos com toda segurança digital. Ferramentas especializadas para oftalmologistas.
              </motion.p>
              <motion.div variants={fadeUp} className="space-y-3">
                {benefits.map((b) => (
                  <div key={b.title} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/12 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/15">
                      <b.icon className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{b.title}</p>
                      <p className="text-xs text-white/70">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>

          <motion.div className="flex justify-center mt-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}>
            <motion.img
              src={pingoOftalmo}
              alt="Pingo oftalmologista"
              className="w-48 h-48 object-contain select-none"
              style={{ filter: "drop-shadow(0 12px 40px rgba(0,0,50,.35))" }}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex flex-col min-h-screen">
        <div className="lg:hidden bg-gradient-to-br from-[hsl(190,85%,35%)] to-[hsl(275,65%,45%)] px-5 pt-6 pb-6 relative">
          <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Portal Oftalmologista</h1>
              <p className="text-xs text-white/70">Tecnologia para a visão</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-5 py-8 lg:items-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
            <div className="hidden lg:flex items-center gap-3 mb-7">
              <img src={logo} alt="AloClínica" className="w-10 h-10 rounded-xl shadow-md" />
              <div>
                <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                  {step === "welcome" && "Olá, doutor(a)"}
                  {step === "register" && "Cadastro profissional"}
                  {step === "login" && "Acessar consultório"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {step === "welcome" && "Como deseja começar?"}
                  {step === "register" && "Preencha seus dados CRM"}
                  {step === "login" && "Entre com suas credenciais"}
                </p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {step === "welcome" && (
                <motion.div key="welcome" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
                  <button
                    onClick={() => setStep("register")}
                    className="w-full p-5 rounded-2xl border border-border bg-card hover:border-[hsl(190,85%,45%)] hover:shadow-lg text-left transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(190,85%,45%)] to-[hsl(275,65%,55%)] flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-foreground">Cadastre-se agora</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Novo oftalmologista na plataforma</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                  <button
                    onClick={() => setStep("login")}
                    className="w-full p-5 rounded-2xl border border-border bg-card hover:border-[hsl(275,65%,55%)] hover:shadow-lg text-left transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[hsl(275,65%,95%)] flex items-center justify-center">
                        <LogIn className="w-6 h-6 text-[hsl(275,65%,40%)]" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-foreground">Já sou cadastrado</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Acessar consultório digital</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                </motion.div>
              )}

              {step === "register" && (
                <motion.form key="register" onSubmit={handleRegister} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-semibold">Nome</Label>
                      <Input required value={firstName} onChange={e => setFirstName(e.target.value)} className="h-12 rounded-xl mt-1.5" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Sobrenome</Label>
                      <Input required value={lastName} onChange={e => setLastName(e.target.value)} className="h-12 rounded-xl mt-1.5" />
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr_100px] gap-3">
                    <div>
                      <Label className="text-sm font-semibold">CRM</Label>
                      <Input required value={crm} onChange={e => setCrm(e.target.value)} placeholder="123456" className="h-12 rounded-xl mt-1.5" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">UF</Label>
                      <Input value={crmState} onChange={e => setCrmState(e.target.value.toUpperCase().slice(0, 2))} className="h-12 rounded-xl mt-1.5 text-center font-semibold" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Especialidade</Label>
                    <select
                      value={specialty}
                      onChange={e => setSpecialty(e.target.value)}
                      className="w-full h-12 rounded-xl mt-1.5 border border-input bg-background px-3 text-sm"
                    >
                      {OPH_SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Email</Label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/50" />
                      <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@exemplo.com" className="pl-11 h-12 rounded-xl" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Senha</Label>
                    <div className="relative mt-1.5">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/50" />
                      <Input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="pl-11 pr-11 h-12 rounded-xl" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground">
                        {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                      </button>
                    </div>
                    {password && <PasswordStrength password={password} />}
                  </div>
                  <TermsConsentCheckbox checked={termsAccepted} onCheckedChange={setTermsAccepted} />
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" className="flex-1 h-12 rounded-xl" onClick={() => setStep("welcome")}>Voltar</Button>
                    <Button type="submit" disabled={loading} className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[hsl(190,85%,40%)] to-[hsl(275,65%,50%)] text-white font-bold shadow-lg hover:brightness-110">
                      {loading ? <Sparkles className="w-4 h-4 animate-spin" /> : (<>Criar conta <ArrowRight className="w-4 h-4 ml-2" /></>)}
                    </Button>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Já possui conta? <button type="button" onClick={() => setStep("login")} className="font-semibold text-[hsl(220,75%,45%)] hover:underline">Entrar</button>
                  </p>
                </motion.form>
              )}

              {step === "login" && (
                <motion.form key="login" onSubmit={handleLogin} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
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
                      <Link to="/forgot-password" className="text-xs font-semibold text-[hsl(220,75%,45%)] hover:underline">Esqueci minha senha</Link>
                    </div>
                    <div className="relative mt-1.5">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/50" />
                      <Input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="pl-11 pr-11 h-12 rounded-xl" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground">
                        {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" className="flex-1 h-12 rounded-xl" onClick={() => setStep("welcome")}>Voltar</Button>
                    <Button type="submit" disabled={loading} className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[hsl(190,85%,40%)] to-[hsl(275,65%,50%)] text-white font-bold shadow-lg hover:brightness-110">
                      {loading ? <Sparkles className="w-4 h-4 animate-spin" /> : (<>Entrar <LogIn className="w-4 h-4 ml-2" /></>)}
                    </Button>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[hsl(190,85%,40%)]" />
                    CRM verificado pelo CFM
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Primeira vez aqui? <button type="button" onClick={() => setStep("register")} className="font-semibold text-[hsl(220,75%,45%)] hover:underline">Cadastre-se</button>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <div className="px-5 py-3 border-t border-border/40 bg-muted/20 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-[hsl(190,85%,40%)]" /> Especialidade</span>
          <span className="flex items-center gap-1.5"><Stethoscope className="w-3.5 h-3.5" /> CFM verificado</span>
          <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Ágil</span>
        </div>
      </div>
    </div>
  );
};

export default AuthOftalmologista;
