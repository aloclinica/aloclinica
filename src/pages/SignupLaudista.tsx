/**
 * SignupLaudista — Cadastro de laudista com layout split-screen unificado.
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Mail, Lock, User as UserIcon, FileText, ArrowRight, ShieldCheck,
  Sparkles, Wallet, Clock,
} from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import {
  AuthField, AuthPasswordField, AuthSubmitButton, AuthHeading,
} from "@/components/auth/AuthFields";
import { CPFInput, PhoneInput } from "@/components/ui/masked-inputs";
import {
  validarNome, validarEmail, validarTelefone, validarCPF, validarSenha,
} from "@/lib/form-validators";
import { toastError } from "@/lib/errorMessages";
import pingoTelelaudo from "@/assets/telelaudo-pingo.png";

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  cpf: string;
  password: string;
  password_confirm: string;
}

const initial: FormData = {
  full_name: "", email: "", phone: "", cpf: "", password: "", password_confirm: "",
};

const PasswordStrength = ({ password }: { password: string }) => {
  if (!password) return null;
  const score =
    (password.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) +
    (/[0-9]/.test(password) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(password) ? 1 : 0);
  const labels = ["Fraca", "Razoável", "Boa", "Forte"];
  const colors = ["bg-destructive", "bg-amber-500", "bg-blue-500", "bg-emerald-500"];
  const idx = Math.max(0, score - 1);
  return (
    <div className="space-y-1.5 pt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < score ? colors[idx] : "bg-muted"}`} />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Força da senha: <span className="font-semibold text-foreground">{labels[idx]}</span>
      </p>
    </div>
  );
};

export default function SignupLaudista() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<FormData>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) => {
    setData((p) => ({ ...p, [k]: v }));
    if (errors[k as string]) setErrors((p) => ({ ...p, [k as string]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!validarNome(data.full_name)) e.full_name = "Informe nome e sobrenome";
    if (!validarEmail(data.email)) e.email = "Email inválido";
    if (!validarTelefone(data.phone)) e.phone = "Telefone inválido";
    if (!validarCPF(data.cpf)) e.cpf = "CPF inválido";
    const pv = validarSenha(data.password);
    if (!pv.isValid) e.password = pv.feedback.join(", ");
    if (data.password !== data.password_confirm) e.password_confirm = "Senhas não conferem";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) {
      toast.error("Preencha todos os campos corretamente");
      return;
    }
    setLoading(true);
    try {
      const { data: auth, error } = await db.auth.signUp({
        email: data.email,
        password: data.password,
      });
      if (error) throw error;
      if (!auth.user) throw new Error("Falha ao criar usuário");

      const { error: pErr } = await (db as any).from("profiles").insert([{
        id: auth.user.id,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        cpf: data.cpf.replace(/\D/g, ""),
        role: "laudista",
        avatar_url: null,
        created_at: new Date().toISOString(),
      }]);
      if (pErr) throw pErr;

      toast.success("Cadastro realizado! Verifique seu email.");
      navigate("/laudista");
    } catch (err) {
      toastError(toast, err, "signup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      seoTitle="Criar conta — Laudista | AloClínica"
      seoDescription="Cadastre-se como laudista e atue na rede de telelaudo da AloClínica."
      icon={FileText}
      eyebrow="Sou laudista"
      headline="Laudo a distância, ganhos por demanda."
      highlightWord="por demanda"
      description="Receba estudos para laudo, assine digitalmente e tenha pagamentos via PIX automáticos."
      mascotSrc={pingoTelelaudo}
      theme={{
        panelGradient: "from-[hsl(215,70%,22%)] via-[hsl(210,60%,30%)] to-[hsl(168,55%,38%)]",
        benefits: [
          { icon: Clock, title: "Trabalhe quando quiser", desc: "Aceite estudos com plantão flexível." },
          { icon: Wallet, title: "Pagamento via PIX", desc: "Saque automático após laudo aprovado." },
          { icon: ShieldCheck, title: "Assinatura ICP-Brasil", desc: "Laudos com validade jurídica integral." },
        ],
      }}
      footerItems={[
        { icon: ShieldCheck, label: "LGPD", tone: "success" },
        { icon: Sparkles, label: "Onboarding em 24h" },
      ]}
    >
      <AuthHeading title="Criar conta" subtitle="Preencha seus dados para começar a laudar" />

      <form onSubmit={submit} className="space-y-4" noValidate>
        <AuthField
          label="Nome completo"
          icon={UserIcon}
          value={data.full_name}
          onChange={(e) => set("full_name", e.target.value)}
          placeholder="Dr(a). Nome Sobrenome"
          autoComplete="name"
          required
          hint={errors.full_name && <p className="text-[12px] text-destructive">{errors.full_name}</p>}
        />

        <AuthField
          label="Email"
          icon={Mail}
          type="email"
          value={data.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="voce@email.com"
          autoComplete="email"
          required
          hint={errors.email && <p className="text-[12px] text-destructive">{errors.email}</p>}
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <PhoneInput value={data.phone} onChange={(v) => set("phone", v)} required error={errors.phone} />
          <CPFInput value={data.cpf} onChange={(v) => set("cpf", v)} required error={errors.cpf} />
        </div>

        <AuthPasswordField
          label="Senha"
          icon={Lock}
          value={data.password}
          onChange={(e) => set("password", e.target.value)}
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          required
          strength={errors.password
            ? <p className="text-[12px] text-destructive mt-1.5">{errors.password}</p>
            : <PasswordStrength password={data.password} />}
        />

        <AuthPasswordField
          label="Confirmar senha"
          icon={Lock}
          value={data.password_confirm}
          onChange={(e) => set("password_confirm", e.target.value)}
          placeholder="Repita a senha"
          autoComplete="new-password"
          required
          strength={errors.password_confirm && <p className="text-[12px] text-destructive mt-1.5">{errors.password_confirm}</p>}
        />

        <AuthSubmitButton
          loading={loading}
          loadingLabel="Criando conta..."
          icon={<ArrowRight className="w-4 h-4" />}
          variantClassName="bg-gradient-to-r from-primary via-primary/90 to-secondary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:brightness-110"
        >
          Criar minha conta
        </AuthSubmitButton>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-center text-[13px] text-muted-foreground pt-1"
        >
          Já tem conta?{" "}
          <Link to="/laudista" className="font-bold text-primary hover:underline">
            Fazer login
          </Link>
        </motion.p>
      </form>
    </AuthShell>
  );
}
