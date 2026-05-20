import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, RefreshCw, SignalHigh, SignalMedium, SignalLow, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConnectionStatusProps {
  onReconnect: () => void;
  /** When true, video is being served via the Jitsi fallback instead of native WebRTC */
  usingJitsi?: boolean;
}

type NetworkQuality = "good" | "fair" | "poor" | "offline";

const ConnectionStatus = ({ onReconnect, usingJitsi = false }: ConnectionStatusProps) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnecting, setShowReconnecting] = useState(false);
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>("good");
  const rttHistory = useRef<number[]>([]);

  // Monitor network quality using a lightweight ping
  useEffect(() => {
    if (!navigator.onLine) {
      setNetworkQuality("offline");
      return;
    }

    const checkQuality = async () => {
      try {
        const start = performance.now();
        await fetch("/favicon.ico", {
          method: "HEAD",
          cache: "no-store",
        });
        const rtt = performance.now() - start;
        
        rttHistory.current.push(rtt);
        if (rttHistory.current.length > 5) rttHistory.current.shift();
        
        const avgRtt = rttHistory.current.reduce((a, b) => a + b, 0) / rttHistory.current.length;

        if (avgRtt < 300) setNetworkQuality("good");
        else if (avgRtt < 800) setNetworkQuality("fair");
        else setNetworkQuality("poor");
      } catch {
        setNetworkQuality("poor");
      }
    };

    checkQuality();
    const interval = setInterval(checkQuality, 20000);
    return () => clearInterval(interval);
  }, [isOnline]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnecting(true);
      setTimeout(() => {
        onReconnect();
        setShowReconnecting(false);
      }, 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setNetworkQuality("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [onReconnect]);

  const qualityConfig = {
    good: { icon: SignalHigh, color: "hsl(150,60%,45%)", label: "Conexão boa" },
    fair: { icon: SignalMedium, color: "hsl(45,90%,55%)", label: "Conexão instável" },
    poor: { icon: SignalLow, color: "hsl(0,70%,55%)", label: "Conexão fraca" },
    offline: { icon: WifiOff, color: "hsl(0,70%,55%)", label: "Sem internet" },
  };

  // Banner permanente: determina rótulo, cor e ícone
  const effectiveState: "offline" | "reconnecting" | "jitsi" | NetworkQuality =
    !isOnline ? "offline" :
    showReconnecting ? "reconnecting" :
    usingJitsi ? "jitsi" :
    networkQuality;

  const bannerConfig: Record<typeof effectiveState, { icon: typeof Wifi; label: string; bg: string; fg: string; dot: string; pulse?: boolean }> = {
    good:        { icon: SignalHigh,   label: "Online",                 bg: "bg-emerald-500/10",  fg: "text-emerald-300", dot: "bg-emerald-400" },
    fair:        { icon: SignalMedium, label: "Online — conexão instável", bg: "bg-amber-500/10",   fg: "text-amber-300",   dot: "bg-amber-400" },
    poor:        { icon: SignalLow,    label: "Online — conexão fraca",  bg: "bg-orange-500/10",  fg: "text-orange-300",  dot: "bg-orange-400", pulse: true },
    jitsi:       { icon: Video,        label: "Online via Jitsi",        bg: "bg-blue-500/10",    fg: "text-blue-300",    dot: "bg-blue-400" },
    reconnecting:{ icon: RefreshCw,    label: "Reconectando...",         bg: "bg-amber-500/15",   fg: "text-amber-200",   dot: "bg-amber-400", pulse: true },
    offline:     { icon: WifiOff,      label: "Sem internet",            bg: "bg-destructive/20", fg: "text-destructive-foreground", dot: "bg-destructive", pulse: true },
  };

  const cfg = bannerConfig[effectiveState];
  const BannerIcon = cfg.icon;

  return (
    <>
      {/* Banner permanente de status de conexão */}
      <div
        className={`sticky top-0 z-[55] w-full px-3 py-1.5 flex items-center justify-center gap-2 text-xs font-medium border-b border-white/5 backdrop-blur-md ${cfg.bg} ${cfg.fg}`}
        role="status"
        aria-live="polite"
        aria-label={`Status de conexão: ${cfg.label}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${cfg.pulse ? "animate-pulse" : ""}`} aria-hidden="true" />
        <BannerIcon className={`w-3.5 h-3.5 ${effectiveState === "reconnecting" ? "animate-spin" : ""}`} aria-hidden="true" />
        <span>{cfg.label}</span>
        {usingJitsi && isOnline && !showReconnecting && (
          <span className="hidden sm:inline text-[10px] opacity-70 ml-1">(fallback ativo)</span>
        )}
        {!isOnline && (
          <Button
            size="sm"
            variant="secondary"
            className="ml-2 h-6 px-2 text-[11px] rounded-full"
            onClick={onReconnect}
            aria-label="Tentar reconectar à consulta"
          >
            <RefreshCw className="w-3 h-3 mr-1" aria-hidden="true" />
            Reconectar
          </Button>
        )}
      </div>

      {/* Alerta crítico de offline em tela cheia mantido para acessibilidade */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-8 left-0 right-0 z-[60] px-4 py-3 flex items-center justify-center gap-3 text-sm font-medium backdrop-blur-md bg-destructive/90 text-destructive-foreground"
            role="alert"
            aria-live="assertive"
          >
            <WifiOff className="w-4 h-4" aria-hidden="true" />
            <span>Sem conexão com a internet — a consulta será retomada assim que voltar online.</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ConnectionStatus;
