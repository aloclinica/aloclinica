import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Lock, Check, ArrowLeft, Video, ShieldCheck, Zap } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import PasswordStrength from "@/components/ui/password-strength";
import mascotImg from "@/assets/mascot-wave.png";

const benefits = [
  { icon: Video, text: "Videochamada HD criptografada" },
  { icon: ShieldCheck, text: "Médicos verificados pelo CFM" },
  { icon: Zap, text: "Atendimento em até 10 minutos" },
];

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Senhas não conferem");
      return;
    }
    if (password.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres");
      return;
    }
    setLoading(true);
    const { error } = await db.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error("Erro", { description: error.message });
    } else {
      setSuccess(true);
      toast.success("Senha atualizada!");
      const { data: { session } } = await db.auth.getSession();
      if (session) {
        setTimeout(() => navigate("/dashboard"), 2000);
      } else {
        setTimeout(() => navigate("/paciente"), 2000);
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      <SEOHead title="Redefinir Senha" description="Redefina sua senha de acesso à AloClinica." />

      {/* Left panel */}
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
          <h2 className="text-3xl font-extrabold text-white mb-3">Nova senha</h2>
          <p className="text-white/70 text-sm max-w-sm mb-8">
            Escolha uma senha forte para proteger sua conta
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

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-background relative">
        <div className="pointer-events-none absolute bottom-[-15%] left-[-8%] w-[400px] h-[400px] rounded-full bg-primary/[0.03] blur-[100px]" />

        <div className="w-full max-w-md">
          <Link to="/paciente" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Voltar ao Login
          </Link>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 12 }}
                className="w-16 h-16 rounded-full bg-emerald-500/10 mx-auto flex items-center justify-center mb-4"
              >
                <Check className="w-8 h-8 text-emerald-500" />
              </motion.div>
              <h3 className="text-lg font-bold text-foreground mb-2">Senha Atualizada!</h3>
              <p className="text-muted-foreground text-sm">Redirecionando...</p>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="w-7 h-7 text-primary" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-foreground text-center mb-2">Redefinir Senha</h2>
              <p className="text-muted-foreground text-center text-sm mb-8">
                Escolha uma nova senha para sua conta.
              </p>

              <div className="rounded-2xl bg-card border border-border/60 p-8 shadow-lg">
                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <Label htmlFor="new-password">Nova Senha</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="new-password"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="pl-10 h-12 rounded-xl"
                        required
                        minLength={6}
                        autoFocus
                      />
                    </div>
                    <PasswordStrength password={password} />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirmar Senha</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Repita a senha"
                        className="pl-10 h-12 rounded-xl"
                        required
                        minLength={6}
                      />
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-destructive mt-1">Senhas não conferem</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-full font-bold"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? "Atualizando..." : "Redefinir Senha"}
                  </Button>
                </form>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
