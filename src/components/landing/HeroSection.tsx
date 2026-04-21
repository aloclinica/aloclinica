import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { memo, forwardRef } from "react";
import { motion } from "framer-motion";
import { usePrefetchRoute } from "@/hooks/use-prefetch-route";
import OptimizedImage from "@/components/ui/optimized-image";
import { ArrowRight, ShieldCheck, Lock, Star, CheckCircle } from "@phosphor-icons/react";
import { useSiteConfig } from "@/lib/site-config";

import heroDoctor from "@/assets/hero-doctor.png";

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
  forwardRef<HTMLElement>((_, ref) => {
    const navigate = useNavigate();
    const prefetchPaciente = usePrefetchRoute(() => import("@/pages/AuthPaciente"));
    const { get } = useSiteConfig();

    const title      = get("hero_title",    "Cuidado médico de excelência");
    const subtitle   = get("hero_subtitle", "Conecte-se a médicos especialistas verificados pelo CFM. Consultas por vídeo em HD, receitas digitais válidas e prontuário eletrônico completo.");
    const ctaText    = get("hero_cta_primary_text", get("hero_cta_text", "Agendar consulta"));
    const ctaUrl     = get("hero_cta_primary_url", "/agendar");
    const cta2Text   = get("hero_cta_secondary_text", get("landing_second_cta", "Consulta avulsa"));
    const cta2Url    = get("hero_cta_secondary_url", "/paciente");
    const badgeText  = get("landing_badge_text", "Médicos disponíveis agora");
    const heroImgUrl = get("hero_image_url", "");

    return (
      <section
        ref={ref}
        aria-label="Início"
        className="relative flex items-center pt-24 sm:pt-28 lg:pt-36 pb-20 sm:pb-24 lg:pb-32 overflow-hidden"
      >
        {/* Subtle ambient background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20" />
          <div className="absolute top-[-15%] right-[10%] w-[500px] h-[500px] rounded-full bg-primary/[0.04] blur-[180px] animate-breathe" />
          <div className="absolute bottom-[-25%] left-[-8%] w-[400px] h-[400px] rounded-full bg-secondary/[0.04] blur-[160px] animate-breathe [animation-delay:1.5s]" />
          <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full bg-primary/[0.02] blur-[120px] animate-float" />
        </div>

        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-16 xl:gap-24 items-center">
            {/* Left content */}
            <motion.div
              className="max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Status badge */}
              <motion.div
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-success/20 bg-success/[0.06] text-success text-xs font-semibold mb-6 shadow-sm shadow-success/10"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: 0.1 }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success shadow-sm shadow-success/40" />
                </span>
                {badgeText}
              </motion.div>

              {/* Headline */}
              <div className="mb-6">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.2rem] font-extrabold leading-[1.1] tracking-tight text-foreground">
                  <span className="text-gradient">{title}</span>
                </h1>
              </div>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg mb-6">
                {subtitle}
              </p>

              {/* Highlights */}
              <div className="flex flex-col gap-2.5 mb-8">
                {highlights.map((h) => (
                  <div key={h} className="flex items-center gap-2.5 text-sm text-foreground/80">
                    <CheckCircle className="w-[18px] h-[18px] text-success shrink-0" weight="fill" />
                    {h}
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <motion.div
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0 }}
              >
                <Button
                  size="lg"
                  className="rounded-2xl h-[52px] w-full sm:w-auto justify-center text-[14px] font-bold shadow-lg shadow-primary/20 group bg-primary hover:bg-primary/90 text-primary-foreground border-0 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97] px-8"
                  onClick={() => navigate(ctaUrl)}
                  onMouseEnter={prefetchPaciente}
                >
                  {ctaText}
                  <ArrowRight className="w-4 h-4 ml-1.5 transition-transform duration-200 group-hover:translate-x-0.5" weight="bold" />
                </Button>
              </motion.div>

              {/* Trust badges */}
              <motion.div
                className="flex flex-row flex-wrap items-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25, delay: 0.15 }}
              >
                {trustItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 text-xs text-muted-foreground font-medium"
                  >
                    <item.icon className="w-3.5 h-3.5 text-primary/60 shrink-0" weight="fill" />
                    {item.label}
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right - hero image */}
            <motion.div
              className="relative hidden md:flex justify-center items-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="relative w-full max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl">
                {/* Soft gradient behind image */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] to-secondary/[0.04] blur-[80px] rounded-full scale-90 -z-10" />

                <OptimizedImage
                  src={heroImgUrl || "https://cvbgrjauqjawrsyknhyj.supabase.co/storage/v1/object/public/files/uploads/0XILPRqqUbSOh99ow53X5OBDOCC3/1776788772275-bngbf-hero-doctor__4_-removebg-preview.png"}
                  alt="Médico especialista realizando teleconsulta"
                  className="w-full h-auto drop-shadow-xl"
                  priority
                />

                {/* Floating card — Seguro */}
                <motion.div
                  className="absolute -top-1 -right-2 xl:right-0 bg-card/95 backdrop-blur-md rounded-2xl shadow-md shadow-foreground/[0.04] px-3.5 py-2.5 border border-border/50 flex items-center gap-2.5"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                  aria-hidden="true"
                  role="presentation"
                >
                  <div className="w-8 h-8 rounded-xl bg-success/10 flex items-center justify-center">
                    <ShieldCheck className="w-[18px] h-[18px] text-success" weight="fill" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-foreground leading-none mb-0.5">100% Seguro</p>
                    <p className="text-[10px] text-muted-foreground leading-none">Criptografia E2E</p>
                  </div>
                </motion.div>

                {/* Floating card — Rating */}
                <motion.div
                  className="absolute bottom-10 -left-4 xl:-left-2 bg-card/95 backdrop-blur-md rounded-2xl shadow-md shadow-foreground/[0.04] px-3.5 py-2.5 border border-border/50 flex items-center gap-2.5"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                >
                  <div className="w-8 h-8 rounded-xl bg-warning/10 flex items-center justify-center">
                    <Star className="w-[18px] h-[18px] text-warning" weight="fill" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-foreground leading-none mb-0.5">4.9/5</p>
                    <p className="text-[10px] text-muted-foreground leading-none">12k+ avaliações</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    );
  })
);

HeroSection.displayName = "HeroSection";
export default HeroSection;
