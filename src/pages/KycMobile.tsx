import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, CheckCircle2, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import BiometricKYC from "@/components/kyc/BiometricKYC";
import PingoLoader from "@/components/PingoLoader";
import { toast } from "sonner";
import { logError } from "@/lib/logger";

type KycSession = {
  id: string;
  token: string;
  user_id: string;
  role: string;
  status: "pending" | "scanned" | "completed" | "failed" | "expired";
  expires_at: string;
};

/**
 * Mobile landing for the cross-device KYC flow.
 *
 * Flow:
 * 1. User scans QR code on desktop -> opens this page with ?token=XXX.
 * 2. Page requires the user to be logged in with the SAME account that started
 *    the desktop session (verified via user_id match — RLS also enforces it).
 * 3. Once authenticated and the token matches, we mark the session as "scanned"
 *    and render the full <BiometricKYC /> camera flow.
 * 4. When verification completes, we update the session row to "completed" and
 *    show a success screen — the desktop receives a Realtime event and unlocks.
 */
const KycMobile = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const token = params.get("token") || "";

  const [session, setSession] = useState<KycSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Load + validate session (re-runs whenever the user finishes logging in)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!token) {
        setError("Link inválido. Volte ao computador e gere um novo QR code.");
        setLoading(false);
        return;
      }
      if (authLoading) return;
      if (!user) {
        // User must log in first — page will re-render after auth
        setLoading(false);
        return;
      }
      try {
        const { data, error: qErr } = await db
          .from("kyc_sessions" as any)
          .select("id, token, user_id, role, status, expires_at")
          .eq("token", token)
          .maybeSingle();

        if (qErr) throw qErr;
        if (cancelled) return;

        if (!data) {
          setError("Sessão não encontrada. Gere um novo QR code no computador.");
          setLoading(false);
          return;
        }

        const s = data as KycSession;

        // Owner check (RLS also enforces it, but better UX)
        if (s.user_id !== user.id) {
          setError("Esta verificação foi iniciada em outra conta. Faça login com a mesma conta usada no computador.");
          setLoading(false);
          return;
        }

        // Expiration check
        if (new Date(s.expires_at).getTime() < Date.now()) {
          setError("Este QR code expirou. Gere um novo no computador.");
          setLoading(false);
          return;
        }

        if (s.status === "completed") {
          setDone(true);
          setSession(s);
          setLoading(false);
          return;
        }

        // Mark as scanned (only if still pending) so desktop shows progress
        if (s.status === "pending") {
          await db.from("kyc_sessions" as any).update({ status: "scanned" }).eq("id", s.id);
        }

        setSession(s);
        setLoading(false);
      } catch (err) {
        logError("[KycMobile] load session", err);
        if (!cancelled) {
          setError("Não foi possível carregar a sessão. Tente novamente.");
          setLoading(false);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [token, user, authLoading]);

  const handleKycComplete = async (result: { match: boolean; score: number; status: string }) => {
    if (!session) return;
    try {
      await db
        .from("kyc_sessions" as any)
        .update({
          status: result.match ? "completed" : "failed",
          match_score: result.score,
          failure_reason: result.match ? null : "Similaridade insuficiente",
        })
        .eq("id", session.id);

      if (result.match) {
        setDone(true);
        toast.success("Verificação enviada para o computador!");
      }
    } catch (err) {
      logError("[KycMobile] update session", err);
      toast.error("Erro ao sincronizar com o computador");
    }
  };

  if (authLoading || loading) {
    return <PingoLoader />;
  }

  // Login required
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl border border-border/50 bg-card p-6 space-y-4 text-center shadow-lg"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <LogIn className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Faça login para continuar</h1>
          <p className="text-sm text-muted-foreground">
            Para verificar sua identidade, entre com a <strong>mesma conta</strong> que você está usando no computador.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={() => navigate(`/paciente?redirect=${encodeURIComponent(`/kyc-mobile?token=${token}`)}`)}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold"
            >
              Entrar como paciente
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/medico?redirect=${encodeURIComponent(`/kyc-mobile?token=${token}`)}`)}
              className="w-full h-12 rounded-xl"
            >
              Entrar como médico
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl border border-destructive/30 bg-card p-6 space-y-4 text-center shadow-lg"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Não foi possível continuar</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={() => navigate("/dashboard")} variant="outline" className="rounded-xl">
            Ir para o painel
          </Button>
        </motion.div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-3xl border border-primary/30 bg-card p-6 space-y-4 text-center shadow-xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
            className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center"
          >
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </motion.div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">Verificação concluída! 🎉</h1>
            <p className="text-sm text-muted-foreground">
              Já enviamos o resultado para o seu computador.
              <br />
              <strong className="text-foreground">Pode voltar para a tela do PC e continuar de lá.</strong>
            </p>
          </div>
          <div className="rounded-2xl bg-primary/5 border border-primary/20 p-3">
            <p className="text-[11px] text-muted-foreground">
              Você pode fechar esta aba com segurança.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pb-8">
      <div className="sticky top-0 z-10 bg-background/85 backdrop-blur-md border-b border-border/40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-foreground leading-tight">Verificação de Identidade</h1>
            <p className="text-[10px] text-muted-foreground leading-tight">Sincronizado com seu computador</p>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-full">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
            </span>
            Ao vivo
          </span>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4">
        <BiometricKYC
          onComplete={handleKycComplete}
          variant="full"
          tipo={(session?.role === "doctor" ? "medico" : "paciente") as "medico" | "paciente"}
        />
      </div>
    </div>
  );
};

export default KycMobile;
