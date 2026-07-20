import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, ShieldCheck, CheckCircle2, RefreshCw, Loader2, Camera, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import BiometricKYC from "./BiometricKYC";
import { logError } from "@/lib/logger";
import { IS_DEV } from "@/lib/constants";

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

  // Decide later (after all hooks) whether we render the camera flow directly.
  const useLocalFlow = isMobile || forceLocal;

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
    if (useLocalFlow) return;
    if (!user || session || creating) return;
    createSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, useLocalFlow]);

  // Tick every second to update the countdown
  useEffect(() => {
    if (useLocalFlow || !session) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [session, useLocalFlow]);

  // Realtime subscription on this session row
  useEffect(() => {
    if (useLocalFlow || !session?.id) return;

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
  }, [session?.id, onComplete, useLocalFlow]);

  // Build the URL the QR points to
  const mobileUrl = useMemo(() => {
    if (!session) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/kyc-mobile?token=${encodeURIComponent(session.token)}`;
  }, [session]);

  // After all hooks are declared, render the local flow if needed.
  if (useLocalFlow) {
    return <BiometricKYC onComplete={onComplete} variant={variant} className={className} tipo={tipo} />;
  }

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
        <Skeleton className="w-56 h-56 rounded-3xl mx-auto" />
      </div>
    );
  }

  // Completed state
  if (completedResult || session.status === "completed") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-8 text-center space-y-5 ${className}`}
      >
        {/* Decorative glow */}
        <div className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-primary/10 blur-3xl" />

        <motion.div
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
          className="relative w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30"
        >
          <CheckCircle2 className="w-10 h-10 text-primary-foreground" strokeWidth={2.5} />
        </motion.div>
        <div className="relative space-y-1.5">
          <h3 className="text-2xl font-bold text-foreground">Identidade verificada!</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Verificação concluída no seu celular. Você já pode prosseguir aqui no computador.
          </p>
        </div>
        {(completedResult?.score ?? session.match_score) != null && (
          <div className="relative rounded-2xl border border-primary/20 bg-card/80 backdrop-blur p-4 max-w-xs mx-auto">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">Similaridade facial</span>
              <span className="font-bold text-primary text-lg">
                {Math.round(Number(completedResult?.score ?? session.match_score))}%
              </span>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-8 space-y-6 ${className}`}>
      {/* Decorative gradient blobs */}
      <div className="pointer-events-none absolute -top-20 -right-20 w-48 h-48 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-primary/5 blur-3xl" />

      {/* Header */}
      <div className="relative text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-3">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Verificação Segura</span>
        </div>
        <h3 className="text-2xl font-bold text-foreground">Continue no seu celular</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Use a câmera do celular para verificar sua identidade — é mais rápido e nítido. Esta tela libera automaticamente quando concluir.
        </p>
      </div>

      <div className="relative grid md:grid-cols-[auto_1fr] gap-6 items-center">
        {/* QR Code */}
        <div className="flex flex-col items-center gap-3 mx-auto">
          <motion.div
            key={session.token}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="relative rounded-3xl bg-gradient-to-br from-primary/30 via-primary/10 to-primary/20 p-1 shadow-xl shadow-primary/10"
          >
            <div className="rounded-[20px] bg-white p-4">
              <QRCodeSVG
                value={mobileUrl}
                size={200}
                level="M"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#0f172a"
              />
            </div>
            {/* Corner brackets */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-primary rounded-tl-lg" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-primary rounded-tr-lg" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-primary rounded-bl-lg" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-primary rounded-br-lg" />
          </motion.div>

          <AnimatePresence mode="wait">
            {session.status === "scanned" ? (
              <motion.div
                key="scanned"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center gap-2 text-xs font-semibold text-primary bg-primary/15 border border-primary/30 px-3 py-1.5 rounded-full"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Verificando no celular…
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
                Aguardando leitura do QR…
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

        {/* Steps */}
        <ol className="space-y-3 max-w-sm">
          {[
            { n: 1, t: "Abra a câmera do celular", d: "Aponte para o QR code ao lado." },
            { n: 2, t: "Faça login com a mesma conta", d: "Use o mesmo e-mail que você usou aqui." },
            { n: 3, t: "Tire uma selfie", d: "Siga as instruções para verificar seu rosto." },
            { n: 4, t: "Volte para esta tela", d: "Liberamos automaticamente o próximo passo." },
          ].map((step, idx) => (
            <motion.li
              key={step.n}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + idx * 0.06 }}
              className="flex items-start gap-3"
            >
              <span className="shrink-0 w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                {step.n}
              </span>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground leading-tight">{step.t}</p>
                <p className="text-xs text-muted-foreground leading-snug">{step.d}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>

      {expired && (
        <div className="relative rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center space-y-2">
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

      <div className="relative flex flex-col sm:flex-row gap-2 pt-2 border-t border-border/40">
        <Button
          variant="outline"
          onClick={copyLink}
          className="flex-1 rounded-xl gap-2 h-11"
          disabled={!mobileUrl}
        >
          {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
          {copied ? "Link copiado!" : "Copiar link do celular"}
        </Button>
        <Button
          variant="ghost"
          onClick={() => setForceLocal(true)}
          className="flex-1 rounded-xl gap-2 h-11 hover:bg-muted/60"
        >
          <Camera className="w-4 h-4" />
          Usar webcam deste PC
        </Button>

        {/* DEV-only bypass: never rendered in production builds. The DB triggers
            also block any client-side KYC write, so this cannot self-approve. */}
        {import.meta.env.DEV && (
          <Button
            variant="outline"
            onClick={async () => {
              if (!user) return;
              const kycResult: KYCResult = { match: true, score: 100, status: "aprovado" };
              setCompletedResult(kycResult);
              onComplete?.(kycResult);
              toast.success("Pulo de verificação (Dev — apenas ambiente local)");
            }}
            className="flex-1 rounded-xl border-dashed border-primary/40 text-primary/70 hover:text-primary hover:border-primary transition-all text-xs h-11"
          >
            <ShieldCheck className="w-4 h-4 mr-2" /> Pular (Dev)
          </Button>
        )}
      </div>
      <div className="relative rounded-2xl bg-muted/40 border border-border/40 p-3">
        <p className="text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2">
          <Monitor className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
          <span>
            <strong className="text-foreground">100% seguro.</strong> O QR code é único, expira em 15 min e só pode ser usado pela sua conta. Nenhum dado biométrico é armazenado.
          </span>
        </p>
      </div>
    </div>
  );
};

export default KycCrossDevice;
