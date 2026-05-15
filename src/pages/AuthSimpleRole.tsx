import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import { toast } from "sonner";
import { Mail, Lock, Shield, type LucideIcon } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { AuthField, AuthPasswordField, AuthSubmitButton, AuthHeading } from "@/components/auth/AuthFields";
import { translateAuthError } from "@/lib/authErrors";

interface AuthSimpleRoleProps {
  role: string;
  title: string;
  subtitle: string;
  description: string;
  seoDescription: string;
  icon: LucideIcon;
  /** Kept for API compat (no longer used) */
  gradientFrom?: string;
  /** Kept for API compat (no longer used) */
  gradientTo?: string;
  features: string[];
  placeholder: string;
  bottomLabel: string;
  bottomIcon: LucideIcon;
  /** Kept for API compat (no longer used) */
  bottomIconColor?: string;
  mascotSrc?: string;
  /** Optional override for the panel gradient */
  panelGradient?: string;
}

const AuthSimpleRole = ({
  title, subtitle, description, seoDescription, icon, features,
  placeholder, bottomLabel, bottomIcon, mascotSrc, panelGradient,
}: AuthSimpleRoleProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await db.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Erro ao entrar", { description: translateAuthError(error.message) });
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <AuthShell
      seoTitle={title}
      seoDescription={seoDescription}
      icon={icon}
      eyebrow={subtitle}
      headline={title}
      description={description}
      mascotSrc={mascotSrc}
      theme={{
        panelGradient:
          panelGradient ?? "from-[hsl(215,45%,10%)] via-[hsl(218,42%,14%)] to-[hsl(222,40%,18%)]",
        features,
      }}
      footerItems={[
        { icon: bottomIcon, label: bottomLabel },
        { icon: Shield, label: "Acesso restrito" },
      ]}
    >
      <AuthHeading title={title} subtitle="Entre com suas credenciais" />

      <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/50 mb-5">
        <p className="text-[12.5px] text-muted-foreground flex items-start gap-2">
          <Shield className="w-4 h-4 shrink-0 text-primary/60 mt-0.5" aria-hidden="true" />
          Sua conta foi criada pelo administrador. Use as credenciais que você recebeu.
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5" noValidate>
        <AuthField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          icon={Mail}
          autoComplete="email"
          required
        />

        <AuthPasswordField
          label="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          icon={Lock}
          autoComplete="current-password"
          showForgot
          required
        />

        <AuthSubmitButton loading={loading} loadingLabel="Entrando...">
          Entrar
        </AuthSubmitButton>
      </form>
    </AuthShell>
  );
};

export default AuthSimpleRole;
