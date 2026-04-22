import { useState, useMemo } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Lock, ArrowLeft, Eye, EyeOff, Building2, Hospital, Users, BarChart3,
  ArrowRight, LogIn, Sparkles, ShieldCheck, CheckCircle2, Briefcase, FileText,
} from "lucide-react";
import TermsConsentCheckbox from "@/components/auth/TermsConsentCheckbox";
import { registerConsent } from "@/lib/consent";
import SEOHead from "@/components/SEOHead";
import PasswordStrength from "@/components/ui/password-strength";
import logo from "@/assets/logo.png";
import pingoReception from "@/assets/pingo-reception.png";

type Step = "welcome" | "register" | "login";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

const benefits = [
  { icon: Hospital, title: "Gestão de exames", desc: "Envie exames para telelaudo com um clique." },
  { icon: Users, title: "Equipe conectada", desc: "Recepção, médicos e gestão num só painel." },
  { icon: BarChart3, title: "Relatórios em tempo real", desc: "Acompanhe volume, SLA e faturamento." },
  { icon: ShieldCheck, title: "Conformidade LGPD", desc: "Dados clínicos criptografados e auditáveis." },
];

const formatCnpj = (v: string) => v.replace(/\D/g, "").slice(0, 14)
  .replace(/^(\d{2})(\d)/, "$1.$2")
  .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
  .replace(/\.(\d{3})(\d)/, ".$1/$2")
  .replace(/(\d{4})(\d)/, "$1-$2");

const AuthClinica = () => {
  const [searchParams] = useSearchParams();
  const hasLoginAccess = useMemo(() => searchParams.get("acesso") === "entrar", [searchParams]);
  const [step, setStep] = useState<Step>(hasLoginAccess ? "login" : "welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [crm, setCrm] = useState("");
  const [crmState, setCrmState] = useState("SP");
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
      navigate("/dashboard?role=clinic");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      toast.error("Aceite os termos", { description: "Você precisa aceitar os Termos de Uso." });
      return;
    }
    if (cnpj.replace(/\D/g, "").length !== 14) {
      toast.error("CNPJ inválido", { description: "Informe um CNPJ válido com 14 dígitos." });
      return;
    }
    setLoading(true);
    const { data, error } = await db.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { business_name: razaoSocial, responsible_name: responsavel },
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
          role: "clinic",
          profile_data: {
            name: razaoSocial,
            cnpj: cnpj.replace(/\D/g, ""),
            responsible_name: responsavel,
            responsible_crm: crm,
            responsible_crm_state: crmState,
          },
        },
      });
      await registerConsent(data.user.id, "terms_and_privacy_clinic");
    }
    setLoading(false);
    toast.success("Cadastro realizado!", { description: "Bem-vinda ao portal da sua clínica." });
    navigate("/dashboard?role=clinic");
  };

  return (
    <div className="min-h-screen relative flex">
      <SEOHead title="Portal da Clínica — AloClínica" description="Gerencie sua clínica, exames e equipe com a AloClínica." />
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[hsl(220,40%,97%)] via-background to-[hsl(42,70%,96%)]" />

      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-[46%] relative overflow-hidden bg-gradient-to-br from-[hsl(220,55%,14%)] via-[hsl(222,50%,18%)] to-[hsl(225,45%,22%)]">
        <div className="absolute top-[-20%] right-[-15%] w-[460px] h-[460px] rounded-full bg-[hsl(42,85%,55%)]/10 blur-[120px]" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[360px] h-[360px] rounded-full bg-[hsl(210,80%,55%)]/15 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "radial-gradient(circle at 1.5px 1.5px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-white/55 hover:text-white/85 transition text-sm group mb-10">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Voltar ao início
            </Link>
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.div variants={fadeUp} className="flex items-center gap-3 mb-7">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[hsl(42,85%,60%)] to-[hsl(38,80%,50%)] flex items-center justify-center shadow-lg">
                  <Building2 className="w-7 h-7 text-[hsl(220,55%,14%)]" />
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold text-white tracking-tight">Clínicas</h1>
                  <p className="text-sm text-white/55 mt-0.5">Portal institucional</p>
                </div>
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-[32px] xl:text-[38px] font-black text-white leading-[1.1] tracking-tight mb-4">
                Sua clínica conectada à{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(42,90%,70%)] to-[hsl(38,85%,55%)]">
                  medicina digital
                </span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-sm text-white/60 leading-relaxed max-w-sm mb-8">
                Envie exames para telelaudo, gerencie equipe e tenha relatórios completos. Tudo numa plataforma segura e certificada.
              </motion.p>
              <motion.div variants={fadeUp} className="space-y-3">
                {benefits.map((b) => (
                  <div key={b.title} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/8 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/10">
                      <b.icon className="w-4.5 h-4.5 text-[hsl(42,85%,65%)]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white/90">{b.title}</p>
                      <p className="text-xs text-white/55">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>

          <motion.div className="flex justify-center mt-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}>
            <motion.img
              src={pingoReception}
              alt="Pingo recepção"
              className="w-44 h-44 object-contain select-none"
              style={{ filter: "drop-shadow(0 8px 32px rgba(0,0,50,.4))" }}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex flex-col min-h-screen">
        <div className="lg:hidden bg-[hsl(220,55%,14%)] px-5 pt-6 pb-6 relative">
          <Link to="/" className="inline-flex items-center gap-2 text-white/55 hover:text-white/85 text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(42,85%,60%)] to-[hsl(38,80%,50%)] flex items-center justify-center shadow-md">
              <Building2 className="w-6 h-6 text-[hsl(220,55%,14%)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Portal da Clínica</h1>
              <p className="text-xs text-white/55">Medicina digital institucional</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-5 py-8 lg:items-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
            <div className="hidden lg:flex items-center gap-3 mb-7">
              <img src={logo} alt="AloClínica" className="w-10 h-10 rounded-xl shadow-md" />
              <div>
                <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                  {step === "welcome" && "Bem-vinda, clínica"}
                  {step === "register" && "Cadastrar clínica"}
                  {step === "login" && "Acessar portal"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {step === "welcome" && "Escolha como deseja começar"}
                  {step === "register" && "Preencha os dados institucionais"}
                  {step === "login" && "Entre com sua conta corporativa"}
                </p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {step === "welcome" && (
                <motion.div key="welcome" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
                  <button
                    onClick={() => setStep("register")}
                    className="w-full p-5 rounded-2xl border border-border bg-card hover:border-[hsl(220,55%,40%)] hover:shadow-lg text-left transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(220,55%,22%)] to-[hsl(225,50%,30%)] flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-[hsl(42,85%,65%)]" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-foreground">Cadastrar minha clínica</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Criar uma conta institucional</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                  <button
                    onClick={() => setStep("login")}
                    className="w-full p-5 rounded-2xl border border-border bg-card hover:border-[hsl(42,85%,55%)] hover:shadow-lg text-left transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[hsl(42,85%,95%)] flex items-center justify-center">
                        <LogIn className="w-6 h-6 text-[hsl(38,85%,40%)]" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-foreground">Já tenho conta</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Acessar o painel da clínica</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                </motion.div>
              )}

              {step === "register" && (
                <motion.form key="register" onSubmit={handleRegister} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold">Razão social</Label>
                    <div className="relative mt-1.5">
                      <Hospital className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/50" />
                      <Input required value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} placeholder="Clínica Exemplo Ltda" className="pl-11 h-12 rounded-xl" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">CNPJ</Label>
                    <div className="relative mt-1.5">
                      <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/50" />
                      <Input required value={cnpj} onChange={e => setCnpj(formatCnpj(e.target.value))} placeholder="00.000.000/0000-00" className="pl-11 h-12 rounded-xl" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Responsável técnico</Label>
                    <div className="relative mt-1.5">
                      <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/50" />
                      <Input required value={responsavel} onChange={e => setResponsavel(e.target.value)} placeholder="Dr(a). Nome completo" className="pl-11 h-12 rounded-xl" />
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr_100px] gap-3">
                    <div>
                      <Label className="text-sm font-semibold">CRM do responsável</Label>
                      <Input required value={crm} onChange={e => setCrm(e.target.value)} placeholder="123456" className="h-12 rounded-xl mt-1.5" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">UF</Label>
                      <Input value={crmState} onChange={e => setCrmState(e.target.value.toUpperCase().slice(0, 2))} className="h-12 rounded-xl mt-1.5 text-center font-semibold" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Email corporativo</Label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/50" />
                      <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="contato@suaclinica.com" className="pl-11 h-12 rounded-xl" />
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
                    <Button type="submit" disabled={loading} className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[hsl(220,55%,22%)] to-[hsl(225,50%,30%)] text-white font-bold shadow-lg hover:brightness-110">
                      {loading ? <Sparkles className="w-4 h-4 animate-spin" /> : (<>Criar conta <ArrowRight className="w-4 h-4 ml-2" /></>)}
                    </Button>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Já possui cadastro? <button type="button" onClick={() => setStep("login")} className="font-semibold text-[hsl(220,55%,35%)] hover:underline">Entrar</button>
                  </p>
                </motion.form>
              )}

              {step === "login" && (
                <motion.form key="login" onSubmit={handleLogin} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold">Email corporativo</Label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/50" />
                      <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="contato@suaclinica.com" className="pl-11 h-12 rounded-xl" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Senha</Label>
                      <Link to="/forgot-password" className="text-xs font-semibold text-[hsl(220,55%,35%)] hover:underline">Esqueci minha senha</Link>
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
                    <Button type="submit" disabled={loading} className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[hsl(220,55%,22%)] to-[hsl(225,50%,30%)] text-white font-bold shadow-lg hover:brightness-110">
                      {loading ? <Sparkles className="w-4 h-4 animate-spin" /> : (<>Entrar <LogIn className="w-4 h-4 ml-2" /></>)}
                    </Button>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(42,85%,45%)]" />
                    Conexão segura e conformidade LGPD
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Nova clínica? <button type="button" onClick={() => setStep("register")} className="font-semibold text-[hsl(220,55%,35%)] hover:underline">Cadastrar agora</button>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <div className="px-5 py-3 border-t border-border/40 bg-muted/20 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[hsl(220,55%,35%)]" /> LGPD</span>
          <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Portal institucional</span>
        </div>
      </div>
    </div>
  );
};

export default AuthClinica;
