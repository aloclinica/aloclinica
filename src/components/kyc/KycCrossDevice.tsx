import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, Monitor, ShieldCheck, CheckCircle2, RefreshCw, Loader2, Camera, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import BiometricKYC from "./BiometricKYC";
import { logError } from "@/lib/logger";

interface KYCResult {
  match: boolean;
  score: number;
  status: string;
  nome?: string | null;
  cpf?: string | null;
}

interface Props {
  onComplete?: (result: KYCResult) => void;
  variant?: "full" | "compact";
  className?: string;
  tipo?: "medico" | "paciente";
}

type KycSession = {
  id: string;
  token: string;
  status: "pending" | "scanned" | "completed" | "failed" | "expired";
  match_score: number | null;
  failure_reason: string | null;
  expires_at: string;
};

/**
 * Cross-device KYC.
 *
 * - On mobile: renders <BiometricKYC /> directly (camera flow).
 * - On desktop: creates a kyc_sessions row, shows a QR code that points to
 *   /kyc-mobile?token=XXX and listens via Supabase Realtime for the completion
 *   event. When the phone finishes the verification, the desktop instantly
 *   transitions to a "verified" state and calls onComplete.
 *
 * The user can also force "do it on this computer" if they prefer.
 */
const KycCrossDevice = ({ onComplete, variant = "full", className = "", tipo = "paciente" }: Props) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [forceLocal, setForceLocal] = useState(false);
  const [session, setSession] = useState<KycSession | null>(null);
  const [creating, setCreating] = useState(false);
  const [completedResult, setCompletedResult] = useState<KYCResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(Date.now());
  const channelRef = useRef<ReturnType<typeof db.channel> | null>(null);

  // Mobile -> just render the camera flow directly (no QR)
  if (isMobile || forceLocal) {
    return <BiometricKYC onComplete={onComplete} variant={variant} className={className} tipo={tipo} />;
  }

  // ---- Desktop QR flow ----

  const createSession = async () => {
    if (!user) return;
    setCreating(true);
    setCompletedResult(null);
    try {
      // Token: short-ish but unguessable — 32 hex chars
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      const token = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

      const { data, error } = await db
        .from("kyc_sessions" as any)
        .insert({
          token,
          user_id: user.id,
          role: tipo === "medico" ? "doctor" : "patient",
          status: "pending",
          device_info: {
            ua: typeof navigator !== "undefined" ? navigator.userAgent : "",
            origin: "desktop",
          },
        })
        .select("id, token, status, match_score, failure_reason, expires_at")
        .single();

      if (error) throw error;
      setSession(data as KycSession);
    } catch (err) {
      logError("[KycCrossDevice] create session", err);
      toast.error("Não foi possível iniciar a verificação", {
        description: "Tente novamente em instantes.",
      });
    } finally {
      setCreating(false);
    }
  };

  // Auto-create the session once when the desktop view mounts
  useEffect(() => {
    if (!user || session || creating) return;
    createSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Tick every second to update the countdown
  useEffect(() => {
    if (!session) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [session]);

  // Realtime subscription on this session row
  useEffect(() => {
    if (!session?.id) return;

    const channel = db
      .channel(`kyc_session_${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "kyc_sessions",
          filter: `id=eq.${session.id}`,
        },
        (payload: { new: KycSession }) => {
          const next = payload.new;
          setSession((prev) => (prev ? { ...prev, ...next } : prev));

          if (next.status === "completed") {
            const result: KYCResult = {
              match: true,
              score: Number(next.match_score ?? 0),
              status: "aprovado",
            };
            setCompletedResult(result);
            toast.success("Verificação concluída no celular!", {
              description: `Similaridade: ${result.score}%`,
            });
            onComplete?.(result);
          } else if (next.status === "failed") {
            toast.error("Verificação não aprovada", {
              description: next.failure_reason || "Tente novamente.",
            });
          }
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      db.removeChannel(channel);
      channelRef.current = null;
    };
  }, [session?.id, onComplete]);

  // Build the URL the QR points to
  const mobileUrl = useMemo(() => {
    if (!session) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/kyc-mobile?token=${encodeURIComponent(session.token)}`;
  }, [session]);

  const expiresInSec = session ? Math.max(0, Math.floor((new Date(session.expires_at).getTime() - now) / 1000)) : 0;
  const expired = !!session && expiresInSec === 0 && session.status !== "completed";

  const copyLink = async () => {
    if (!mobileUrl) return;
    try {
      await navigator.clipboard.writeText(mobileUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o link");
    }
  };

  // Loading state while we create the session
  if (creating || !session) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Preparando verificação…</h3>
          <p className="text-xs text-muted-foreground mt-1">Gerando QR code seguro</p>
        </div>
        <Skeleton className="w-56 h-56 rounded-2xl mx-auto" />
      </div>
    );
  }

  // Completed state
  if (completedResult || session.status === "completed") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`text-center py-6 space-y-4 ${className}`}
      >
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Identidade verificada! ✅</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Concluída no seu celular. Você já pode prosseguir.
          </p>
        </div>
        {(completedResult?.score ?? session.match_score) != null && (
          <div className="rounded-2xl border border-border/50 p-4 bg-card text-left max-w-xs mx-auto">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Similaridade</span>
              <span className="font-bold text-foreground">
                {completedResult?.score ?? session.match_score}%
              </span>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center">
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Smartphone className="w-7 h-7 text-primary" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Verifique no seu celular</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
          Aponte a câmera do celular para o QR code abaixo. Faça login com a mesma conta e siga os passos.
          Esta tela atualiza automaticamente quando concluir.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <motion.div
          key={session.token}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl bg-card border-2 border-primary/20 p-5 shadow-lg shadow-primary/5"
        >
          <div className="rounded-2xl bg-white p-4">
            <QRCodeSVG
              value={mobileUrl}
              size={208}
              level="M"
              includeMargin={false}
              bgColor="#ffffff"
              fgColor="#0f172a"
            />
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {session.status === "scanned" ? (
            <motion.div
              key="scanned"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="inline-flex items-center gap-2 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              QR escaneado — aguardando verificação no celular…
            </motion.div>
          ) : (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Aguardando leitura do QR code…
            </motion.div>
          )}
        </AnimatePresence>

        {!expired && (
          <p className="text-[11px] text-muted-foreground">
            Expira em{" "}
            <span className="font-mono font-semibold text-foreground">
              {Math.floor(expiresInSec / 60).toString().padStart(2, "0")}:
              {(expiresInSec % 60).toString().padStart(2, "0")}
            </span>
          </p>
        )}
      </div>

      {expired && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center space-y-2">
          <p className="text-sm font-semibold text-destructive">QR code expirado</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setSession(null); createSession(); }}
            className="rounded-xl gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Gerar novo QR code
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          onClick={copyLink}
          className="flex-1 rounded-xl gap-2 h-11"
          disabled={!mobileUrl}
        >
          {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
          {copied ? "Link copiado" : "Copiar link"}
        </Button>
        <Button
          variant="ghost"
          onClick={() => setForceLocal(true)}
          className="flex-1 rounded-xl gap-2 h-11"
        >
          <Camera className="w-4 h-4" />
          Verificar neste computador
        </Button>
      </div>

      <div className="rounded-2xl bg-muted/30 border border-border/40 p-3">
        <p className="text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2">
          <Monitor className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            <strong className="text-foreground">Por que no celular?</strong> A câmera do seu celular costuma
            ser mais nítida e a verificação fica mais rápida. Esta tela detecta automaticamente quando você
            terminar e libera o próximo passo.
          </span>
        </p>
      </div>
    </div>
  );
};

export default KycCrossDevice;
