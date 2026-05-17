/**
 * SignupDoctor - Formulário de cadastro para médico
 * Campos: Nome, Email, Telefone, CPF, CRM, Especialidade, Senha
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { CPFInput, CRMInput, PhoneInput } from "@/components/ui/masked-inputs";
import {
  validarNome,
  validarEmail,
  validarTelefone,
  validarCPF,
  validarSenha,
  validarEspecialidade,
  VALID_SPECIALTIES,
  validarCRM,
} from "@/lib/form-validators";
import {
  ArrowLeft, Eye, EyeSlash, Stethoscope, IdentificationCard,
  Lock, ShieldCheck, CheckCircle, Clock, CurrencyDollar, Sparkle,
} from "@phosphor-icons/react";
import { toastError } from "@/lib/errorMessages";
import doctorSignup from "@/assets/doctor-signup-1.png";

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  cpf: string;
  crm: string;
  crm_state: string;
  specialty: string;
  password: string;
  password_confirm: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function SignupDoctor() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    email: "",
    phone: "",
    cpf: "",
    crm: "",
    crm_state: "",
    specialty: "",
    password: "",
    password_confirm: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Password strength (0-4)
  const passwordStrength = (() => {
    const p = formData.password;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();
  const strengthLabels = ["Muito fraca", "Fraca", "Média", "Forte", "Excelente"];
  const strengthColors = ["bg-destructive", "bg-destructive", "bg-amber-500", "bg-primary", "bg-emerald-500"];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!validarNome(formData.full_name)) {
      newErrors.full_name = "Nome deve ter pelo menos 2 nomes completos";
    }

    if (!validarEmail(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (!validarTelefone(formData.phone)) {
      newErrors.phone = "Telefone inválido (formato: (11) 9XXXX-XXXX)";
    }

    if (!validarCPF(formData.cpf)) {
      newErrors.cpf = "CPF inválido";
    }

    if (!formData.crm_state) {
      newErrors.crm_state = "Estado do CRM é obrigatório";
    }

    if (!formData.crm) {
      newErrors.crm = "CRM é obrigatório";
    } else if (!validarCRM(formData.crm, formData.crm_state || undefined)) {
      newErrors.crm = formData.crm_state
        ? "CRM inválido (4 a 6 dígitos) ou UF inválida"
        : "CRM inválido (4 a 6 dígitos)";
    }

    if (!formData.specialty) {
      newErrors.specialty = "Especialidade é obrigatória";
    } else if (!validarEspecialidade(formData.specialty)) {
      newErrors.specialty = "Especialidade inválida";
    }

    const passwordValidation = validarSenha(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.feedback.join(", ");
    }

    if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = "Senhas não conferem";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Preencha todos os campos corretamente");
      return;
    }

    setLoading(true);
    try {
      const parts = formData.full_name.trim().split(/\s+/);
      // 1. Cria usuário com role=doctor; trigger handle_new_user cria profile + user_role
      const { data: authData, error: authError } = await db.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            role: "doctor",
            first_name: parts[0] || "",
            last_name: parts.slice(1).join(" ") || "",
            cpf: formData.cpf.replace(/\D/g, ""),
            phone: formData.phone.replace(/\D/g, ""),
          },
        },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Falha ao criar usuário");

      // 2. Auto-login antes de inserir doctor_profiles (RLS exige auth.uid())
      if (!authData.session) {
        await db.auth.signInWithPassword({ email: formData.email, password: formData.password });
      }

      // 3. Confirma que auth.uid() bate com o usuário criado antes de inserir
      const { data: sessionData } = await db.auth.getSession();
      const authedUserId = sessionData?.session?.user?.id;
      if (!authedUserId || authedUserId !== authData.user.id) {
        throw new Error("Sessão não confirmada. Faça login para finalizar o cadastro.");
      }

      // 4. Cria doctor_profiles com CRM e especialidade (user_id = auth.uid())
      const { error: dpErr } = await (db as any).from("doctor_profiles").insert({
        user_id: authedUserId,
        crm: formData.crm.replace(/\D/g, ""),
        crm_state: formData.crm_state,
        doctor_type: formData.specialty,
        is_approved: false,
        crm_verified: false,
      });
      if (dpErr && !String(dpErr.message || "").includes("duplicate")) throw dpErr;

      toast.success("Cadastro realizado! Sua conta está em análise.");
      navigate("/medico");
    } catch (error) {
      toastError(toast, error, "signup");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] min-h-screen">
        {/* ─────── Brand panel ─────── */}
        <aside className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground p-12 overflow-hidden">
          <div aria-hidden className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary-foreground)/0.25),transparent_50%),radial-gradient(circle_at_bottom_left,hsl(var(--primary-foreground)/0.18),transparent_45%)]" />

          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(-1)}
            className="relative z-10 inline-flex items-center gap-2 text-sm font-semibold text-primary-foreground/85 hover:text-primary-foreground transition w-fit"
          >
            <ArrowLeft className="h-4 w-4" weight="bold" />
            Voltar
          </motion.button>

          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-primary-foreground/15 backdrop-blur px-3 py-1.5 rounded-full mb-6">
              <Sparkle className="w-3.5 h-3.5" weight="fill" />
              Cadastro de Médico
            </span>
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-[1.05] mb-5">
              Atenda mais,<br />
              <span className="text-primary-foreground/85">trabalhe de onde quiser.</span>
            </h1>
            <p className="text-primary-foreground/80 text-base leading-relaxed max-w-md mb-10">
              Junte-se a 500+ médicos parceiros. Cadastro gratuito, aprovação em até 24h
              e renda extra sem sair de casa.
            </p>

            <ul className="space-y-3.5 max-w-md">
              {[
                { icon: CurrencyDollar, label: "R$ 30-80 por consulta — pagamento via PIX em 48h" },
                { icon: Clock, label: "Agenda 100% sua: defina dias e horários livremente" },
                { icon: ShieldCheck, label: "Plataforma 100% CFM, CRM e LGPD compliant" },
                { icon: CheckCircle, label: "Prontuário, receita digital e atestados inclusos" },
              ].map((b) => (
                <li key={b.label} className="flex items-start gap-3">
                  <span className="w-9 h-9 rounded-xl bg-primary-foreground/15 flex items-center justify-center shrink-0">
                    <b.icon className="w-5 h-5" weight="fill" />
                  </span>
                  <span className="text-sm text-primary-foreground/90 leading-relaxed pt-1.5">{b.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative z-10 flex items-center gap-4 pt-8 border-t border-primary-foreground/15">
            <img src={doctorSignup} alt="" aria-hidden className="w-16 h-16 object-contain drop-shadow-lg" />
            <div className="text-xs text-primary-foreground/75">
              <p className="font-bold text-primary-foreground">+500 médicos parceiros</p>
              <p>4.9★ de satisfação na plataforma</p>
            </div>
          </div>
        </aside>

        {/* ─────── Form panel ─────── */}
        <main className="flex flex-col justify-center px-4 py-10 sm:px-8 lg:px-14 lg:py-14">
          <div className="w-full max-w-xl mx-auto">
            <button
              onClick={() => navigate(-1)}
              className="lg:hidden inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>

            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Crie sua conta de médico
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5">
                Leva menos de 5 minutos. Análise da sua documentação em até 24h.
              </p>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              onSubmit={handleSubmit}
              className="space-y-7"
            >
              {/* ── Section: Dados pessoais ── */}
              <section className="space-y-4 p-5 sm:p-6 rounded-2xl border border-border bg-card">
                <header className="flex items-center gap-2.5 pb-1">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <IdentificationCard className="w-4 h-4 text-primary" weight="fill" />
                  </span>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Dados pessoais</h3>
                </header>

                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome completo <span className="text-destructive">*</span></Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    placeholder="Dr. João Silva"
                    value={formData.full_name}
                    onChange={handleChange}
                    className={errors.full_name ? "border-destructive" : ""}
                  />
                  {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                  <PhoneInput
                    value={formData.phone}
                    onChange={(phone) => setFormData((prev) => ({ ...prev, phone }))}
                    required
                    error={errors.phone}
                  />
                </div>

                <CPFInput
                  value={formData.cpf}
                  onChange={(cpf) => setFormData((prev) => ({ ...prev, cpf }))}
                  required
                  error={errors.cpf}
                />
              </section>

              {/* ── Section: Dados profissionais ── */}
              <section className="space-y-4 p-5 sm:p-6 rounded-2xl border border-border bg-card">
                <header className="flex items-center gap-2.5 pb-1">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Stethoscope className="w-4 h-4 text-primary" weight="fill" />
                  </span>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Dados profissionais</h3>
                </header>

                <CRMInput
                  value={formData.crm}
                  onCRMChange={(crm) => setFormData((prev) => ({ ...prev, crm }))}
                  state={formData.crm_state}
                  onStateChange={(state) => setFormData((prev) => ({ ...prev, crm_state: state }))}
                  required
                  error={errors.crm || errors.crm_state}
                />

                <div className="space-y-2">
                  <Label htmlFor="specialty">Especialidade <span className="text-destructive">*</span></Label>
                  <select
                    id="specialty"
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleChange}
                    className={`w-full h-10 px-3 rounded-md bg-background border text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
                      errors.specialty ? "border-destructive" : "border-input"
                    }`}
                  >
                    <option value="">Selecione uma especialidade</option>
                    {VALID_SPECIALTIES.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec.charAt(0).toUpperCase() + spec.slice(1).replace("-", " ")}
                      </option>
                    ))}
                  </select>
                  {errors.specialty && <p className="text-xs text-destructive">{errors.specialty}</p>}
                </div>
              </section>

              {/* ── Section: Acesso ── */}
              <section className="space-y-4 p-5 sm:p-6 rounded-2xl border border-border bg-card">
                <header className="flex items-center gap-2.5 pb-1">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-primary" weight="fill" />
                  </span>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Acesso</h3>
                </header>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres, com maiúscula e número"
                      value={formData.password}
                      onChange={handleChange}
                      className={`pr-10 ${errors.password ? "border-destructive" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label="Alternar visibilidade"
                    >
                      {showPassword ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Strength meter */}
                  {formData.password && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex gap-1">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all ${
                              i < passwordStrength ? strengthColors[passwordStrength] : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Força da senha: <span className="font-semibold text-foreground">{strengthLabels[passwordStrength]}</span>
                      </p>
                    </div>
                  )}
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password_confirm">Confirmar senha <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      id="password_confirm"
                      name="password_confirm"
                      type={showPasswordConfirm ? "text" : "password"}
                      placeholder="Repita a senha"
                      value={formData.password_confirm}
                      onChange={handleChange}
                      className={`pr-10 ${errors.password_confirm ? "border-destructive" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label="Alternar visibilidade"
                    >
                      {showPasswordConfirm ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password_confirm && (
                    <p className="text-xs text-destructive">{errors.password_confirm}</p>
                  )}
                </div>
              </section>

              {/* Submit + LGPD note */}
              <div className="space-y-4">
                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-primary/20"
                >
                  {loading ? "Cadastrando..." : "Criar minha conta"}
                </Button>

                <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                  Ao se cadastrar, você concorda com nossos{" "}
                  <button type="button" onClick={() => navigate("/termos")} className="underline hover:text-foreground">Termos</button>{" "}
                  e{" "}
                  <button type="button" onClick={() => navigate("/privacidade")} className="underline hover:text-foreground">Política de Privacidade</button>.
                </p>

                <p className="text-center text-sm text-muted-foreground">
                  Já tem conta?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/medico")}
                    className="text-primary hover:underline font-semibold"
                  >
                    Fazer login
                  </button>
                </p>
              </div>
            </motion.form>
          </div>
        </main>
      </div>
    </div>
  );
}
