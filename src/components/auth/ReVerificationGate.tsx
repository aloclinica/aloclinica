import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import BiometricKYC from "@/components/kyc/BiometricKYC";
import { ShieldCheck, AlertTriangle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const LAST_LOGIN_KEY = "aloclinica_last_login";
const REVERIFY_KEY = "aloclinica_reverified";
const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

/**
 * If a patient hasn't logged in for 60+ days, require facial re-verification
 * before allowing access to the dashboard.
 */
const ReVerificationGate = ({ children }: { children: React.ReactNode }) => {
  const { user, roles } = useAuth();
  const [needsReverification, setNeedsReverification] = useState(false);
  const [checking, setChecking] = useState(true);
  const [verified, setVerified] = useState(false);

  const isPatient = roles.includes("patient") && !roles.includes("admin") && !roles.includes("doctor");

  useEffect(() => {
    if (!user || !isPatient) {
      setChecking(false);
      return;
    }

    // Check if already re-verified this session
    const sessionKey = `${REVERIFY_KEY}_${user.id}`;
    if (sessionStorage.getItem(sessionKey) === "true") {
      setChecking(false);
      return;
    }

    // Get last login timestamp
    const lastLoginStr = localStorage.getItem(`${LAST_LOGIN_KEY}_${user.id}`);
    const now = Date.now();

    if (lastLoginStr) {
      const lastLogin = parseInt(lastLoginStr, 10);
      const daysSince = now - lastLogin;

      if (daysSince >= SIXTY_DAYS_MS) {
        // Check if user has a previous KYC verification
        db
          .from("kyc_verificacoes")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "approved")
          .limit(1)
          .then(({ data }) => {
            if (data?.length) {
              // Had KYC before — require re-verification
              setNeedsReverification(true);
            }
            setChecking(false);
          });
        return;
      }
    }

    // Update last login
    localStorage.setItem(`${LAST_LOGIN_KEY}_${user.id}`, now.toString());
    setChecking(false);
  }, [user, isPatient]);

  const handleComplete = () => {
    if (!user) return;
    setVerified(true);
    setNeedsReverification(false);
    sessionStorage.setItem(`${REVERIFY_KEY}_${user.id}`, "true");
    localStorage.setItem(`${LAST_LOGIN_KEY}_${user.id}`, Date.now().toString());
  };

  const handleLogout = async () => {
    await db.auth.signOut();
    window.location.href = "/";
  };

  if (checking) return null;

  if (needsReverification && !verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="rounded-3xl border border-border/50 bg-card shadow-2xl p-7 space-y-6">
            {/* Header */}
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-500/15 to-amber-600/5 border border-amber-500/20 flex items-center justify-center shadow-lg shadow-amber-500/10"
              >
                <ShieldCheck className="w-10 h-10 text-amber-500" />
              </motion.div>
              <div>
                <h2 className="text-2xl font-extrabold text-foreground font-[Manrope] tracking-tight">
                  Reverificação de Identidade
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mt-2 max-w-xs mx-auto">
                  Faz mais de <strong className="text-foreground">60 dias</strong> desde seu último acesso. 
                  Por segurança, confirme sua identidade.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500/8 border border-amber-500/15">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  Verificação obrigatória para acessar sua conta
                </p>
              </div>
            </div>

            {/* KYC Component */}
            <div className="rounded-2xl border border-border/30 bg-muted/20 p-4">
              <BiometricKYC
                onComplete={handleComplete}
                variant="full"
                tipo="paciente"
              />
            </div>

            {/* Logout option */}
            <div className="pt-3 border-t border-border/20">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:text-destructive gap-2 h-11 rounded-xl"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                Sair da conta
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ReVerificationGate;
