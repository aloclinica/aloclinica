import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { memo, forwardRef } from "react";
import { motion } from "framer-motion";
import { usePrefetchRoute } from "@/hooks/use-prefetch-route";
import OptimizedImage from "@/components/ui/optimized-image";
import { ArrowRight, ShieldCheck, Lock, Star, CheckCircle } from "@phosphor-icons/react";

const trustItems = [
  { label: "Regulamentado CFM", icon: ShieldCheck },
  { label: "Criptografia E2E", icon: Lock },
  { label: "4.9★ — 12k avaliações", icon: Star },
];

const highlights = [
  "Receita digital válida em todo o Brasil",
  "Atendimento 24h — inclusive feriados",
  "30+ especialidades médicas",
];

const HeroSection = memo(
  forwardRef<HTMLElement, { config?: any }>(({ config }, ref) => {
    const navigate = useNavigate();
    const prefetchPaciente = usePrefetchRoute(() => import("@/pages/AuthPaciente"));

    const title      = config?.title || "Cuidado médico de excelência para você";
    const subtitle   = config?.subtitle || "Conecte-se a médicos especialistas verificados pelo CFM em poucos cliques. Atendimento humano, seguro e disponível a qualquer momento do seu dia.";
    const ctaText    = config?.cta_text || "Agendar consulta";
    const ctaUrl     = config?.cta_url || "/agendar";
    const badgeText  = config?.badge_text || "Médicos disponíveis agora";
    const heroImgUrl = config?.image_url || "https://cvbgrjauqjawrsyknhyj.supabase.co/storage/v1/object/public/files/uploads/public/1776900477087-k2u1c-image.png";

    return (
      <section
        ref={ref}
        aria-label="Início"
        className="relative flex items-center pt-24 sm:pt-28 lg:pt-36 pb-20 sm:pb-24 lg:pb-32 overflow-hidden"
      >
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/[0.02]" />
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-primary/[0.05] blur-[120px] animate-pulse" />
        </div>

        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-16 xl:gap-24 items-center">
            <motion.div
              className="max-w-2xl"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-success/20 bg-success/[0.06] text-success text-xs font-bold mb-8 shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
                </span>
                {badgeText}
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[3.6rem] font-black leading-[1.05] tracking-tight text-foreground mb-6">
                <span className="text-gradient block">{title}</span>
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-lg mb-8">
                {subtitle}
              </p>

              <div className="flex flex-col gap-3 mb-10">
                {highlights.map((h) => (
                  <div key={h} className="flex items-center gap-3 text-[15px] font-medium text-foreground/80">
                    <CheckCircle className="w-5 h-5 text-success shrink-0" weight="fill" />
                    {h}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Button
                  size="lg"
                  className="w-full sm:w-auto rounded-2xl h-[56px] px-10 text-[15px] font-extrabold shadow-xl shadow-primary/25 group transition-all duration-300 hover:scale-[1.02]"
                  onClick={() => navigate(ctaUrl)}
                  onMouseEnter={prefetchPaciente}
                >
                  {ctaText}
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" weight="bold" />
                </Button>
                
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden">
                      <img src={`https://i.pravatar.cc/150?u=${i}`} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-background bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                    +12k
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="relative hidden lg:flex justify-center items-center"
              initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
            >
              <div className="absolute inset-0 bg-primary/5 rounded-full blur-[100px] scale-75 animate-pulse" />
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10 w-full"
              >
                <OptimizedImage
                  src={heroImgUrl}
                  alt="Médico e pacientes"
                  className="w-full h-auto drop-shadow-[0_25px_50px_rgba(0,0,0,0.15)] max-w-[600px] mx-auto"
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
    );
  })
);

HeroSection.displayName = "HeroSection";
export default HeroSection;
