import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, ArrowRight, Home, Loader2, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SEOHead from "@/components/SEOHead";
import { db } from "@/integrations/supabase/untyped";

/* CSS-only confetti */
const ConfettiPiece = ({ i }: { i: number }) => {
  const colors = [
    "bg-primary", "bg-secondary", "bg-destructive", "bg-yellow-400",
    "bg-emerald-400", "bg-blue-400", "bg-pink-400", "bg-orange-400",
  ];
  const color = colors[i % colors.length];
  const left = 10 + Math.random() * 80;
  const delay = Math.random() * 0.8;
  const dur = 1.5 + Math.random() * 1;
  return (
    <motion.div
      className={`absolute w-2 h-2 rounded-sm ${color}`}
      style={{ left: `${left}%`, top: "-5%" }}
      initial={{ opacity: 1, y: 0, rotate: 0 }}
      animate={{
        y: [0, 600],
        x: [(Math.random() - 0.5) * 200],
        rotate: [0, 360 + Math.random() * 360],
        opacity: [1, 1, 0],
      }}
      transition={{ duration: dur, delay, ease: "easeIn" }}
    />
  );
};

/* Animated checkmark SVG */
const AnimatedCheck = () => (
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: "spring", stiffness: 200, damping: 12 }}
    className="relative mx-auto mb-6"
  >
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1.6, opacity: 0 }}
      transition={{ delay: 0.3, duration: 0.8 }}
      className="absolute inset-0 rounded-full bg-emerald-500/20"
    />
    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <motion.path
          d="M10 20L17 27L30 13"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        />
      </svg>
    </div>
  </motion.div>
);

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [verifying, setVerifying] = useState(!!sessionId);
  const [verified, setVerified] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setVerified(true);
      setShowConfetti(true);
      return;
    }

    const verifySubscription = async () => {
      const { data: { user } } = await db.auth.getUser();
      if (!user) { setVerifying(false); setVerified(true); setShowConfetti(true); return; }

      let attempts = 0;
      const maxAttempts = 10;
      const poll = setInterval(async () => {
        attempts++;
        const { data: subs } = await db
          .from("subscriptions")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .limit(1);

        if ((subs && subs.length > 0) || attempts >= maxAttempts) {
          clearInterval(poll);
          setVerifying(false);
          setVerified(true);
          setShowConfetti(true);
        }
      }, 2000);

      return () => clearInterval(poll);
    };

    verifySubscription();
  }, [sessionId]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-background">
      <SEOHead title="Pagamento Confirmado" description="Seu pagamento foi processado com sucesso na AloClinica." />

      {/* Confetti */}
      {showConfetti && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <ConfettiPiece key={i} i={i} />
          ))}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        {verifying ? (
          <div className="text-center py-16">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-lg font-semibold text-foreground mb-1">Verificando pagamento...</p>
            <p className="text-sm text-muted-foreground">Aguarde enquanto confirmamos.</p>
          </div>
        ) : (
          <>
            <AnimatedCheck />

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center mb-8"
            >
              <h1 className="text-[28px] font-extrabold text-foreground mb-2">
                Pagamento confirmado!
              </h1>
              <p className="text-muted-foreground text-sm">
                Seu acesso foi liberado. Aproveite todos os recursos da plataforma!
              </p>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex justify-center gap-4 mb-8"
            >
              {[
                { icon: Shield, text: "Dados protegidos" },
                { icon: Sparkles, text: "Acesso ilimitado" },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <b.icon className="w-3.5 h-3.5 text-primary" />
                  {b.text}
                </div>
              ))}
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-3"
            >
              <Button asChild className="w-full h-12 rounded-full" size="lg">
                <Link to="/dashboard">
                  <Calendar className="w-4 h-4 mr-2" /> Ver minha consulta
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full h-11 rounded-full" size="lg">
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" /> Ir ao início
                </Link>
              </Button>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
