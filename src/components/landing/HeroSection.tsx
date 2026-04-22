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

    const title      = config?.title || "Cuidado médico de excelência";
    const subtitle   = config?.subtitle || "Conecte-se a médicos especialistas verificados pelo CFM. Consultas por vídeo em HD, receitas digitais válidas e prontuário eletrônico completo.";
    const ctaText    = config?.cta_text || "Agendar consulta";
    const ctaUrl     = config?.cta_url || "/agendar";
    const badgeText  = config?.badge_text || "Médicos disponíveis agora";
    const heroImgUrl = config?.image_url || "";

    return (
      <section
        ref={ref}
        aria-label="Início"
        className="relative flex items-center pt-24 sm:pt-28 lg:pt-36 pb-20 sm:pb-24 lg:pb-32 overflow-hidden"
      >
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20" />
          <div className="absolute top-[-15%] right-[10%] w-[500px] h-[500px] rounded-full bg-primary/[0.04] blur-[180px] animate-breathe" />
        </div>

        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-16 xl:gap-24 items-center">
            <motion.div
              className="max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-success/20 bg-success/[0.06] text-success text-xs font-semibold mb-6 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                </span>
                {badgeText}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.2rem] font-extrabold leading-[1.1] tracking-tight text-foreground mb-6">
                <span className="text-gradient">{title}</span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg mb-6">
                {subtitle}
              </p>

              <div className="flex flex-col gap-2.5 mb-8">
                {highlights.map((h) => (
                  <div key={h} className="flex items-center gap-2.5 text-sm text-foreground/80">
                    <CheckCircle className="w-[18px] h-[18px] text-success shrink-0" weight="fill" />
                    {h}
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                className="rounded-2xl h-[52px] px-8 text-[14px] font-bold shadow-lg shadow-primary/20 group"
                onClick={() => navigate(ctaUrl)}
                onMouseEnter={prefetchPaciente}
              >
                {ctaText}
                <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-0.5" weight="bold" />
              </Button>
            </motion.div>

            <motion.div
              className="relative hidden md:flex justify-center items-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <OptimizedImage
                src={heroImgUrl || "https://cvbgrjauqjawrsyknhyj.supabase.co/storage/v1/object/public/files/uploads/0XILPRqqUbSOh99ow53X5OBDOCC3/1776864826984-178bx-doctor-tecnologia-removebg-preview.png"}
                alt="Hero"
                className="w-full h-auto drop-shadow-xl"
              />
            </motion.div>
          </div>
        </div>
      </section>
    );
  })
);

HeroSection.displayName = "HeroSection";
export default HeroSection;
