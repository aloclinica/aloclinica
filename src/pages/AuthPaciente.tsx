import { logError } from "@/lib/logger";
import { useState, useRef, useEffect } from "react";
import { securityMonitor } from "@/lib/security-monitor";
import { useNavigate, Link } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Envelope,
  Lock,
  ArrowLeft,
  ShieldCheck,
  Eye,
  EyeSlash,
  UserPlus,
  SpinnerGap,
  Stethoscope,
  Clock,
  Lightning,
  Heartbeat,
  Star,
  CheckCircle,
  Phone,
  IdentificationCard,
  FacebookLogo,
  Certificate,
  LockKey,
  VideoCamera,
  SignIn,
} from "@phosphor-icons/react";
import TermsConsentCheckbox from "@/components/auth/TermsConsentCheckbox";
import { registerConsent } from "@/lib/consent";
import { formatMask, unmask } from "@/hooks/use-mask";
import { validarCPF } from "@/lib/form-validators";
import CpfInput from "@/components/ui/cpf-input";
import { CalendarBlank } from "@phosphor-icons/react";
import SEOHead from "@/components/SEOHead";
import PasswordStrength from "@/components/ui/password-strength";
import { translateAuthError } from "@/lib/authErrors";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import logo from "@/assets/logo.png";
import mascotWave from "@/assets/mascot-wave.png";
import mascotThumbsup from "@/assets/mascot-thumbsup.png";

const benefits = [
  { icon: VideoCamera, text: "Videochamada HD criptografada" },
  { icon: ShieldCheck, text: "Médicos verificados pelo CFM" },
  { icon: Lightning, text: "Atendimento em até 10 minutos" },
];

/* ═══ LEFT PANEL (Desktop only) — extracted outside to avoid remount on every keystroke ═══ */
const LeftPanel = () => (
  <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary via-primary/90 to-secondary flex-col justify-between p-12 xl:p-16 overflow-hidden">
    {/* Ambient orbs */}
    <div className="absolute top-[-20%] right-[-15%] w-[400px] h-[400px] rounded-full bg-white/[0.06] blur-[120px]" />
    <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full bg-secondary/30 blur-[80px]" />
    <div className="absolute top-[50%] left-[60%] w-[150px] h-[150px] rounded-full bg-white/[0.04] blur-[60px]" />
    {/* Dot pattern */}
    <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 1.5px 1.5px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />

    {/* Top — back link */}
    <div className="relative z-10">
      <Link to="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors text-sm font-medium group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" weight="bold" />
        Voltar ao início
      </Link>
    </div>

    {/* Center content */}
    <div className="relative z-10 flex flex-col items-center text-center max-w-md mx-auto">
      <img src={logo} alt="AloClínica" className="w-12 h-12 rounded-2xl shadow-lg ring-2 ring-white/20 mb-8" />
      <motion.img
        src={mascotWave}
        alt="Pingo"
        className="w-[180px] h-[180px] xl:w-[210px] xl:h-[210px] object-contain select-none mb-8"
        style={{ filter: "drop-shadow(0 12px 40px rgba(0,0,50,.35))" }}
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <h1 className="text-[36px] xl:text-[42px] font-extrabold text-white leading-[1.1] tracking-tight">
        Sua saúde em{" "}
        <span className="relative inline-block">
          <span className="relative z-10">boas mãos</span>
          <span className="absolute inset-0 bg-white/15 rounded-xl -skew-x-2 scale-x-105 scale-y-125" />
        </span>
      </h1>
      <p className="text-white/65 mt-4 text-base leading-relaxed max-w-sm">
        Consulte médicos online 24h, em qualquer lugar do Brasil.
      </p>
      <div className="mt-10 space-y-4 w-full max-w-xs">
        {benefits.map((b, i) => (
          <motion.div
            key={b.text}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.12 }}
            className="flex items-center gap-3 text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/[0.08]">
              <b.icon className="w-5 h-5 text-white" weight="fill" />
            </div>
            <span className="text-sm text-white/85 font-medium">{b.text}</span>
          </motion.div>
        ))}
      </div>
    </div>

    {/* Bottom — social proof */}
    <div className="relative z-10 flex items-center justify-center gap-2 text-white/60 text-sm pt-6 border-t border-white/10">
      <Star className="w-4 h-4 text-yellow-300" weight="fill" />
      <span className="font-semibold text-white/80">4.9</span>
      <span>— mais de 12.000 avaliações</span>
    </div>
  </div>
);

/* ═══ STEP INDICATOR — extracted outside ═══ */
const StepIndicator = ({ current }: { current: number }) => (
  <div className="flex items-center gap-2 mb-6">
    {[1, 2, 3].map((step) => (
      <div key={step} className="flex items-center gap-2 flex-1">
        <div className={`h-1.5 rounded-full flex-1 transition-colors duration-300 ${
          step <= current ? "bg-primary" : "bg-muted"
        }`} />
      </div>
    ))}
    <span className="text-xs text-muted-foreground font-medium ml-1">{current}/3</span>
  </div>
);

const AuthPaciente = () => {
  const [mode, setMode] = useState<"welcome" | "login" | "signup">("welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [shake, setShake] = useState(false);
  const [signupStep, setSignupStep] = useState(1);
  const lockoutUntil = useRef<number>(0);
  const emailRef = useRef<HTMLInputElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { redirectAfterLogin } = useAuthRedirect();

  // Auto-focus on mode change
  useEffect(() => {
    if (mode === "login") setTimeout(() => emailRef.current?.focus(), 100);
    if (mode === "signup") setTimeout(() => firstNameRef.current?.focus(), 100);
  }, [mode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Date.now() < lockoutUntil.current) {
      const secs = Math.ceil((lockoutUntil.current - Date.now()) / 1000);
      toast.error("Aguarde", { description: `Tente novamente em ${secs}s` });
      return;
    }
    if (securityMonitor.isLoginBlocked(email)) {
      toast.error("Conta temporariamente bloqueada", { description: "Muitas tentativas. Aguarde 15 minutos." });
      return;
    }
    setLoading(true);
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      securityMonitor.trackFailedLogin(email);
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setShake(true);
      setTimeout(() => setShake(false), 600);
      if (newAttempts >= 5) {
        lockoutUntil.current = Date.now() + 30000;
        setAttempts(0);
        toast.error("Muitas tentativas", { description: "Conta bloqueada por 30 segundos." });
      } else {
        toast.error("Erro ao entrar", { description: translateAuthError(error.message) });
      }
    } else if (data.user) {
      setAttempts(0);
      securityMonitor.clearFailedLogins(email);
      setLoading(false);
      await redirectAfterLogin(data.user.id);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Dados incompletos", { description: "Preencha seu nome e sobrenome." });
      return;
    }
    const cleanCpf = unmask(cpf);
    if (!validarCPF(cleanCpf)) {
      toast.error("CPF inválido", { description: "O CPF informado não é válido. Verifique os dígitos e tente novamente." });
      return;
    }
    const cleanPhone = unmask(phone);
    if (cleanPhone.length < 10) {
      toast.error("Telefone inválido", { description: "Digite um telefone válido." });
      return;
    }
    if (!email || !email.includes("@")) {
      toast.error("Email inválido", { description: "Digite um email válido." });
      return;
    }
    if (password.length < 6) {
      toast.error("Senha fraca", { description: "A senha deve ter no mínimo 6 caracteres." });
      return;
    }
    if (!termsAccepted) {
      toast.error("Aceite os termos", { description: "Você precisa aceitar os Termos de Uso e Política de Privacidade para continuar." });
      return;
    }

    setLoading(true);
    try {
      const { data: signUpData, error: signUpError } = await db.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { first_name: firstName, last_name: lastName },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          toast.error("Email já cadastrado", { description: "Tente fazer login." });
          setMode("login");
          setLoading(false);
          return;
        }
        toast.error("Erro ao criar conta", { description: translateAuthError(signUpError.message) });
        setLoading(false);
        return;
      }

      if (signUpData.user) {
        const userId = signUpData.user.id;

        await db.from("profiles").upsert({
          user_id: userId,
          cpf: cleanCpf,
          phone: cleanPhone,
          first_name: firstName,
          last_name: lastName,
          date_of_birth: birthDate || null,
        }, { onConflict: "user_id" });

        await registerConsent(userId);

        try {
          await db.functions.invoke("send-email", {
            body: { type: "welcome", to: email, data: { name: firstName } },
          });
        } catch {}

        toast.success("Conta criada! ✅", { description: "Vamos completar seu perfil..." });
        setTimeout(() => navigate("/dashboard?role=patient&onboarding=true"), 1500);
      }
    } catch (err) {
      logError("handleSignup error", err);
      toast.error("Erro inesperado", { description: "Tente novamente." });
    }
    setLoading(false);
  };



  /* ═══ FORM CONTENT — rendered as inline JSX, not a sub-component ═══ */
  const formContent = (
    <AnimatePresence mode="wait">
      {/* ── WELCOME ── */}
      {mode === "welcome" && (
        <motion.div
          key="welcome-form"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Back to landing — desktop */}
          <Link
            to="/"
            className="hidden lg:inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium mb-4 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Voltar ao início
          </Link>

          <div>
            <h2 className="text-[28px] font-extrabold text-foreground tracking-tight">Bem-vindo! 👋</h2>
            <p className="text-muted-foreground mt-1">Como deseja continuar?</p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => setMode("login")}
              variant="outline"
              className="w-full h-14 rounded-2xl text-base font-semibold border-border/60 hover:bg-muted/50 transition-all active:scale-[0.98]"
              size="lg"
            >
              <SignIn className="w-5 h-5 mr-2.5" weight="bold" />
              Entrar na minha conta
            </Button>

            <Button
              onClick={() => setMode("signup")}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-bold text-base shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98] transition-all"
              size="lg"
            >
              <UserPlus className="w-5 h-5 mr-2.5" weight="fill" />
              Criar conta grátis
            </Button>
          </div>



          {/* Trust items */}
          <div className="flex items-center justify-center gap-6 pt-4">
            {[
              { icon: LockKey, label: "Criptografado" },
              { icon: ShieldCheck, label: "CFM" },
              { icon: Clock, label: "24h" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1.5">
                <item.icon className="w-4 h-4 text-muted-foreground/40" weight="fill" />
                <span className="text-[10px] text-muted-foreground/50 font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── LOGIN ── */}
      {mode === "login" && (
        <motion.div
          key="login-form"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
        >
          {/* Desktop back */}
          <button
            type="button"
            onClick={() => setMode("welcome")}
            className="hidden lg:flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <div className="mb-6">
            <h2 className="text-[28px] font-extrabold text-foreground tracking-tight">
              Entrar na sua conta
            </h2>
            <p className="text-muted-foreground mt-1">
              Digite suas credenciais para continuar
            </p>
          </div>

          <motion.form
            onSubmit={handleLogin}
            className="space-y-5"
            animate={shake ? { x: [0, -12, 12, -8, 8, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            <div>
              <Label className="text-sm font-semibold text-foreground">Email</Label>
              <div className="relative mt-1.5">
                <Envelope className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/60" weight="fill" />
                <Input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
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
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/60" weight="fill" />
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
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeSlash className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-[52px] rounded-2xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-bold text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98] transition-all"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <SpinnerGap className="w-5 h-5 animate-spin" /> Entrando...
                </span>
              ) : "Entrar"}
            </Button>
          </motion.form>

          {/* Trust row */}
          <div className="flex items-center justify-center gap-6 mt-8">
            {[
              { icon: LockKey, label: "Dados\ncriptografados" },
              { icon: VideoCamera, label: "Vídeo HD\nseguro" },
              { icon: Clock, label: "Atendimento\n24h" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1.5 text-center">
                <item.icon className="w-[18px] h-[18px] text-muted-foreground/40" weight="fill" />
                <span className="text-[10px] text-muted-foreground/50 font-medium leading-tight whitespace-pre-line">{item.label}</span>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Não tem conta?{" "}
            <button type="button" onClick={() => setMode("signup")} className="text-primary font-bold hover:underline">
              Cadastre-se grátis
            </button>
          </p>
        </motion.div>
      )}

      {/* ── SIGNUP ── */}
      {mode === "signup" && (
        <motion.div
          key="signup-form"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
        >
          {/* Desktop back */}
          <button
            type="button"
            onClick={() => signupStep > 1 ? setSignupStep(s => s - 1) : setMode("welcome")}
            className="hidden lg:flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {signupStep > 1 ? "Voltar" : "Início"}
          </button>

          <div className="mb-2">
            <h2 className="text-[24px] font-extrabold text-foreground tracking-tight">Criar sua conta</h2>
            <p className="text-sm text-muted-foreground mt-1">Leva menos de 1 minuto</p>
          </div>

          <StepIndicator current={signupStep} />

          <form onSubmit={(e) => {
            e.preventDefault();
            if (signupStep < 3) {
              // Validate current step before advancing
              if (signupStep === 1) {
                if (!firstName.trim() || !lastName.trim()) {
                  toast.error("Preencha nome e sobrenome.");
                  return;
                }
                const cleanCpf = unmask(cpf);
                if (!validarCPF(cleanCpf)) {
                  toast.error("CPF inválido", { description: "Verifique os dígitos." });
                  return;
                }
                if (!birthDate) {
                  toast.error("Data de nascimento obrigatória", { description: "Informe sua data de nascimento." });
                  return;
                }
                const today = new Date();
                const birth = new Date(birthDate);
                let age = today.getFullYear() - birth.getFullYear();
                const monthDiff = today.getMonth() - birth.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                  age--;
                }
                if (age < 16) {
                  toast.error("Idade mínima: 16 anos", { description: "É necessário ter pelo menos 16 anos para se cadastrar." });
                  return;
                }
              }
              if (signupStep === 2) {
                const cleanPhone = unmask(phone);
                if (cleanPhone.length < 10) {
                  toast.error("Telefone inválido");
                  return;
                }
                if (!email || !email.includes("@")) {
                  toast.error("Email inválido");
                  return;
                }
                if (password.length < 6) {
                  toast.error("Senha deve ter 6+ caracteres");
                  return;
                }
              }
              setSignupStep(s => s + 1);
            } else {
              handleSignup(e);
            }
          }} className="space-y-4">
            <AnimatePresence mode="wait">
              {/* Step 1: Nome + CPF */}
              {signupStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[13px] font-semibold text-foreground">Nome</Label>
                      <Input
                        ref={firstNameRef}
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        placeholder="João"
                        required
                        className="mt-1.5 h-12 rounded-xl bg-muted/40 border-border/50 text-[15px] focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)] focus-visible:border-primary/40"
                      />
                    </div>
                    <div>
                      <Label className="text-[13px] font-semibold text-foreground">Sobrenome</Label>
                      <Input
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        placeholder="Silva"
                        required
                        className="mt-1.5 h-12 rounded-xl bg-muted/40 border-border/50 text-[15px] focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)] focus-visible:border-primary/40"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[13px] font-semibold text-foreground">CPF</Label>
                    <CpfInput
                      value={cpf}
                      onChange={v => setCpf(v)}
                      className="mt-1.5"
                      inputClassName="pl-11 h-12 rounded-xl bg-muted/40 border-border/50 text-[15px] tracking-wide focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)] focus-visible:border-primary/40"
                    />
                  </div>
                  <div>
                    <Label className="text-[13px] font-semibold text-foreground">Data de nascimento</Label>
                    <div className="relative mt-1.5">
                      <CalendarBlank className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/50" weight="fill" />
                      <Input
                        type="date"
                        value={birthDate}
                        onChange={e => setBirthDate(e.target.value)}
                        max={new Date().toISOString().split("T")[0]}
                        className="pl-11 h-12 rounded-xl bg-muted/40 border-border/50 text-[15px] focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)] focus-visible:border-primary/40"
                        required
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Email + Senha + Telefone */}
              {signupStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div>
                    <Label className="text-[13px] font-semibold text-foreground">Email</Label>
                    <div className="relative mt-1.5">
                      <Envelope className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/50" weight="fill" />
                      <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="pl-11 h-12 rounded-xl bg-muted/40 border-border/50 text-[15px] focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)] focus-visible:border-primary/40" required />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[13px] font-semibold text-foreground">Crie uma senha</Label>
                    <div className="relative mt-1.5">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/50" weight="fill" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="pl-11 pr-11 h-12 rounded-xl bg-muted/40 border-border/50 text-[15px] focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)] focus-visible:border-primary/40"
                        required
                        minLength={6}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors">
                        {showPassword ? <EyeSlash className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                      </button>
                    </div>
                    {password && <PasswordStrength password={password} />}
                  </div>
                  <div>
                    <Label className="text-[13px] font-semibold text-foreground">Telefone</Label>
                    <div className="relative mt-1.5">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/50" weight="fill" />
                      <Input value={phone} onChange={e => setPhone(formatMask(e.target.value, 'phone'))} placeholder="(00) 00000-0000" className="pl-11 font-mono h-12 rounded-xl bg-muted/40 border-border/50 text-[15px] tracking-wide focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)] focus-visible:border-primary/40" maxLength={15} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Termos + Confirmar */}
              {signupStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  {/* Summary card */}
                  <div className="bg-muted/30 rounded-2xl p-4 border border-border/40 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resumo</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Nome:</span> <span className="font-medium text-foreground">{firstName} {lastName}</span></div>
                      <div><span className="text-muted-foreground">Email:</span> <span className="font-medium text-foreground">{email}</span></div>
                    </div>
                  </div>

                  <TermsConsentCheckbox checked={termsAccepted} onCheckedChange={setTermsAccepted} />
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              className="w-full h-[54px] rounded-2xl bg-gradient-to-r from-primary to-primary/85 text-primary-foreground font-bold text-base shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98] transition-all"
              size="lg"
              disabled={loading || (signupStep === 3 && !termsAccepted)}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <SpinnerGap className="w-5 h-5 animate-spin" /> Criando conta...
                </span>
              ) : signupStep < 3 ? (
                "Continuar"
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" weight="fill" />
                  Criar minha conta
                </span>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Já tem conta?{" "}
              <button type="button" onClick={() => setMode("login")} className="text-primary font-bold hover:underline">
                Entrar
              </button>
            </p>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      <SEOHead title="AloClínica — Paciente" description="Acesse sua conta AloClinica para consultas médicas online." />

      {/* Desktop left panel */}
      <LeftPanel />

      {/* Mobile hero — inline to avoid remount */}
      <div className="lg:hidden relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-secondary px-5 pt-[max(env(safe-area-inset-top,16px),16px)] pb-6">
        <div className="absolute top-[-30%] right-[-15%] w-[250px] h-[250px] rounded-full bg-white/[0.06] blur-[80px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[180px] h-[180px] rounded-full bg-secondary/20 blur-[60px]" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {mode !== "welcome" && (
              <button
                type="button"
                onClick={() => mode === "signup" && signupStep > 1 ? setSignupStep(s => s - 1) : setMode("welcome")}
                className="text-white/70 hover:text-white transition-colors mr-1"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <img src={logo} alt="AloClínica" className="w-8 h-8 rounded-xl ring-2 ring-white/20" />
            <div>
              <h1 className="text-lg font-black text-white tracking-tight leading-none">AloClínica</h1>
              <p className="text-[10px] text-white/50 mt-0.5">Telemedicina de excelência</p>
            </div>
          </div>
          <motion.img
            src={mascotWave}
            alt="Pingo"
            className="w-[70px] h-[70px] object-contain select-none"
            style={{ filter: "drop-shadow(0 4px 16px rgba(0,0,50,.25))" }}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
         {mode === "welcome" && (
          <div className="relative z-10 mt-3 flex items-center justify-between">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-white/70 text-sm"
            >
              Sua saúde em boas mãos 💙
            </motion.p>
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-white/60 hover:text-white transition-colors text-xs font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Início
            </Link>
          </div>
        )}
      </div>

      {/* Right / main form area */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 lg:px-10 lg:py-12 xl:px-16 overflow-y-auto">
        <div className="w-full max-w-md">
          {formContent}

          <p className="text-center text-[10px] text-muted-foreground/40 mt-8">
            © {new Date().getFullYear()} AloClínica — Tecnologia em Saúde
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPaciente;
