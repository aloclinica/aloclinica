/**
 * ConsultationTopBar — Barra superior de consulta
 *
 * Responsabilidades:
 * - Informações do participante
 * - Timer de duração
 * - Botão de encerrar
 * - Indicador de status WebRTC
 */

import { Clock, Maximize2, Minimize2, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

interface ConsultationTopBarProps {
  otherPartyName?: string;
  elapsed: number;
  webrtcStatus: string;
  isFullscreen?: boolean;
  queuePosition?: number | null;
  onEndCall: () => void;
  onToggleFullscreen?: () => void;
  formatTime: (seconds: number) => string;
}

const timerColorMap = {
  safe: "text-[hsl(150,60%,45%)]",
  warning: "text-amber-400",
  critical: "text-destructive",
};

export function ConsultationTopBar({
  otherPartyName,
  elapsed,
  webrtcStatus,
  isFullscreen = false,
  queuePosition,
  onEndCall,
  onToggleFullscreen,
  formatTime,
}: ConsultationTopBarProps) {
  const isMobile = useIsMobile();

  // Timer color based on elapsed time
  const timerColor = elapsed > 3600 ? timerColorMap.critical :
                     elapsed > 1800 ? timerColorMap.warning :
                     timerColorMap.safe;

  return (
    <>
      {/* Queue banner */}
      <AnimatePresence>
        {queuePosition && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-3 bg-amber-500/5 border-b border-amber-500/15 flex items-center justify-center gap-2"
          >
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            <p className="text-sm text-amber-300">
              {queuePosition === 1
                ? "O médico está finalizando outro atendimento. Você é o próximo!"
                : `Posição na fila: ${queuePosition}º — aguarde, o médico atenderá em breve.`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar — compact on mobile */}
      <div
        className="flex items-center justify-between px-3 md:px-5 py-2 md:py-2.5 bg-[hsl(220,25%,6%)] border-b border-[hsl(220,15%,10%)] shrink-0"
        style={{ paddingTop: isMobile ? "max(env(safe-area-inset-top, 0px), 8px)" : undefined }}
      >
        {/* Left: participant info */}
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <div className="relative">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <span className="text-xs font-bold text-primary">
                {(otherPartyName || "C").charAt(0)}
              </span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[hsl(150,60%,45%)] border-2 border-[hsl(220,25%,6%)]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs md:text-sm font-semibold text-white truncate max-w-[120px] md:max-w-none">
              {otherPartyName || "Consulta"}
            </p>
            {!isMobile && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${
                    webrtcStatus === "connected" ? "bg-[hsl(150,60%,45%)] animate-pulse" :
                    webrtcStatus === "connecting" ? "bg-amber-400 animate-pulse" :
                    webrtcStatus === "failed" ? "bg-destructive" :
                    "bg-[hsl(220,15%,40%)]"
                  }`} />
                  <span className="text-[10px] text-[hsl(220,15%,40%)]">
                    {webrtcStatus === "connected" ? "P2P Ativo" :
                     webrtcStatus === "connecting" ? "Conectando" :
                     webrtcStatus === "waiting_peer" ? "Aguardando" :
                     webrtcStatus === "reconnecting" ? "Reconectando" :
                     webrtcStatus === "failed" ? "Falha" : "WebRTC"}
                  </span>
                </div>
                <span className="text-[10px] text-[hsl(220,15%,20%)]">•</span>
                <span className="text-[10px] text-[hsl(220,15%,40%)]">CFM 2.314/22</span>
              </div>
            )}
          </div>
        </div>

        {/* Center: Timer (always visible) */}
        <div className="flex items-center gap-1.5 px-2.5 md:px-3 py-1 md:py-1.5 rounded-xl bg-[hsl(220,20%,8%)] border border-[hsl(220,15%,12%)]">
          <div className={`w-2 h-2 rounded-full shimmer-v2 ${
            elapsed > 3600 ? "bg-destructive" : elapsed > 1800 ? "bg-amber-400" : "bg-[hsl(150,60%,45%)]"
          }`} />
          <span className={`text-xs font-mono font-bold tracking-wider ${timerColor}`}>
            {formatTime(elapsed)}
          </span>
        </div>

        {/* Right: End call (always visible) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Fullscreen — desktop only */}
          {!isMobile && onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[hsl(220,15%,45%)] hover:text-white hover:bg-[hsl(220,20%,12%)] transition-all"
              aria-label={isFullscreen ? "Sair da tela cheia" : "Entrar em tela cheia"}
              title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Maximize2 className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          )}

          {/* End call */}
          <Button
            onClick={onEndCall}
            size="sm"
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl gap-1.5 shadow-lg shadow-destructive/20 hover:shadow-destructive/30 transition-all hover:scale-105 active:scale-95 h-9 md:h-9 px-3 md:px-4 min-w-[44px]"
            aria-label="Encerrar consulta"
          >
            <PhoneOff className="w-4 h-4" aria-hidden="true" />
            {!isMobile && <span className="text-xs font-semibold">Encerrar</span>}
          </Button>
        </div>
      </div>
    </>
  );
}
