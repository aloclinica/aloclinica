import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { memo, forwardRef } from "react";
import { motion } from "framer-motion";
import { usePrefetchRoute } from "@/hooks/use-prefetch-route";
import OptimizedImage from "@/components/ui/optimized-image";
import { ArrowRight, Star, CreditCard, VideoCamera, ShieldCheck, Clock, Sparkle, Check, WifiHigh } from "@phosphor-icons/react";
import heroPingoFamily from "@/assets/hero-pingo-family.png";
import { isFeatureEnabled } from "@/lib/featureFlags";

const highlights = [
  { icon: ShieldCheck, text: "Receita digital válida em todo o Brasil" },
  { icon: Clock, text: "Atendimento 24h — inclusive feriados" },
  { icon: Sparkle, text: "30+ especialidades médicas" },
];

const HeroSection = memo(
  forwardRef<HTMLElement, { config?: any }>(({ config }, ref) => {
    const navigate = useNavigate();
    const prefetchPaciente = usePrefetchRoute(() => import("@/pages/AuthPaciente"));

    const subtitle  = config?.subtitle || "Conecte-se a médicos especialistas verificados pelo CFM. Consultas por vídeo em HD, receitas digitais válidas e prontuário eletrônico completo.";
    const ctaText   = config?.cta_text || "Agendar consulta";
    const ctaUrl    = config?.cta_url || "/agendar";
    const badgeText = config?.badge_text || "Médicos disponíveis agora";
    const showPingo = isFeatureEnabled("cartao_pingo");

    return (
      <section
        ref={ref}
        aria-label="Início"
        className="relative pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-20 lg:pb-24 overflow-hidden bg-gradient-to-b from-[#f0f9ff] via-white to-[#f0f9ff]"
      >
        {/* Ambient glow */}
        <div aria-hidden className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-[#0ea5e9]/[0.10] blur-[120px]" />
          <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#0284c7]/[0.08] blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.025] [background-image:radial-gradient(circle_at_1px_1px,#0284c7_1px,transparent_0)] [background-size:24px_24px]" />
        </div>

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-4 lg:auto-rows-[110px]">

            {/* Headline + CTA principal */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="lg:col-span-7 lg:row-span-4 bg-white/95 backdrop-blur-sm rounded-[28px] p-8 md:p-12 flex flex-col justify-center border border-white shadow-[0_20px_60px_-20px_rgba(2,132,199,0.15)] relative overflow-hidden"
            >
              <div aria-hidden className="absolute -top-10 -right-10 w-48 h-48 bg-gradient-to-br from-[#e0f2fe] to-transparent rounded-full blur-2xl" />
              <div aria-hidden className="absolute -bottom-16 -left-10 w-40 h-40 bg-gradient-to-tr from-sky-100/60 to-transparent rounded-full blur-2xl" />

              <div className="inline-flex items-center gap-2 pl-2 pr-3.5 py-1.5 bg-gradient-to-r from-emerald-50 to-emerald-50/50 text-emerald-700 rounded-full text-xs font-semibold mb-6 border border-emerald-200/60 shadow-sm shadow-emerald-100/50 w-fit relative">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                {badgeText}
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-[64px] font-extrabold leading-[1.02] mb-5 tracking-[-0.02em] relative">
                <span className="text-slate-900">Cuidado médico de </span>
                <br className="hidden sm:block" />
                <span className="bg-gradient-to-r from-[#0ea5e9] via-[#0284c7] to-[#0369a1] bg-clip-text text-transparent">
                  excelência
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-lg mb-8 leading-relaxed relative">
                {subtitle}
              </p>

              <div className="flex flex-wrap items-center gap-4 relative">
                <Button
                  size="lg"
                  onClick={() => navigate(ctaUrl)}
                  onMouseEnter={prefetchPaciente}
                  className="relative rounded-2xl h-[60px] px-8 text-base font-bold bg-gradient-to-br from-[#0ea5e9] to-[#0369a1] hover:from-[#0284c7] hover:to-[#075985] text-white shadow-[0_12px_30px_-8px_rgba(2,132,199,0.55)] hover:shadow-[0_18px_40px_-8px_rgba(2,132,199,0.65)] transition-all duration-300 hover:-translate-y-0.5 group overflow-hidden"
                >
                  <span aria-hidden className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative">{ctaText}</span>
                  <ArrowRight className="relative w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" weight="bold" />
                </Button>

                <div className="hidden sm:flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-muted overflow-hidden">
                        <img src={`https://i.pravatar.cc/80?u=${i}`} alt="Paciente" className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    ))}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0ea5e9] to-[#0369a1] border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                      +12k
                    </div>
                  </div>
                  <div className="ml-1 leading-tight">
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[1,2,3,4,5].map((i)=>(<Star key={i} className="w-3 h-3" weight="fill" />))}
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">+12k pacientes atendidos</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Pingo — célula âncora */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
              className="lg:col-span-5 lg:row-span-6 bg-gradient-to-br from-[#e0f2fe] to-[#f0f9ff] rounded-3xl overflow-hidden relative group min-h-[440px] border border-white shadow-sm"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 flex items-end justify-center pt-20 px-4"
              >
                <OptimizedImage
                  src={heroPingoFamily}
                  alt="Pingo, mascote da AloClínica, junto a pacientes"
                  className="w-full h-auto max-h-full object-contain mix-blend-multiply"
                />
              </motion.div>

              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#0ea5e9]/10 to-transparent pointer-events-none" />

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="absolute top-5 right-5 z-10"
              >
                <div className="bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white shadow-lg flex items-center gap-3">
                  <div className="p-2 bg-[#0ea5e9]/10 rounded-lg">
                    <VideoCamera className="w-5 h-5 text-[#0ea5e9]" weight="fill" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Em consulta agora</p>
                    <p className="text-sm font-bold text-slate-800">847 pacientes</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="absolute bottom-5 left-5 right-5 z-10"
              >
                <div className="bg-white/85 backdrop-blur-md p-4 rounded-2xl border border-white shadow-xl">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="flex text-amber-400">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className="w-3.5 h-3.5" weight="fill" />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-slate-800">4.9</span>
                    </div>
                    <div className="bg-rose-50 px-2 py-1 rounded text-[10px] font-bold text-rose-600 border border-rose-100 uppercase tracking-tighter">
                      CFM Verificado
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 italic leading-snug">
                    "Resolvi minha consulta em 8 minutos, sem sair do sofá."
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1.5 uppercase">— Maria, SP</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Pingo Card (CTA secundária) */}
            {showPingo && (
              <motion.button
                type="button"
                onClick={() => navigate("/pingo-card")}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.99 }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="lg:col-span-4 lg:row-span-2 text-left rounded-3xl p-6 flex flex-col justify-between group cursor-pointer overflow-hidden relative border border-orange-300/60 shadow-[0_18px_50px_-20px_rgba(234,88,12,0.45)] hover:shadow-[0_24px_60px_-18px_rgba(234,88,12,0.55)] transition-all duration-500"
                style={{
                  background:
                    "linear-gradient(135deg,#fff7ed 0%,#ffedd5 45%,#fed7aa 100%)",
                }}
              >
                {/* decorative orbs */}
                <div aria-hidden className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-gradient-to-br from-orange-300/50 to-amber-400/30 blur-2xl group-hover:scale-110 transition-transform duration-700" />
                <div aria-hidden className="absolute -left-8 top-8 w-24 h-24 rounded-full bg-amber-200/40 blur-2xl" />
                {/* sheen on hover */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{
                    background:
                      "linear-gradient(110deg,transparent 35%,rgba(255,255,255,0.55) 50%,transparent 65%)",
                    transform: "translateX(-100%)",
                    animation: "none",
                  }}
                />
                {/* grain dots */}
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-overlay"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle,#7c2d12 0.5px,transparent 0.5px)",
                    backgroundSize: "14px 14px",
                  }}
                />

                {/* Header */}
                <div className="flex justify-between items-start z-10 relative">
                  <div className="relative">
                    <div className="absolute inset-0 bg-orange-400/40 blur-lg rounded-2xl" />
                    <div className="relative bg-gradient-to-br from-orange-400 to-orange-600 text-white p-2.5 rounded-2xl shadow-lg ring-1 ring-white/40">
                      <CreditCard className="w-6 h-6" weight="fill" />
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/70 backdrop-blur text-[9.5px] font-extrabold text-orange-700 uppercase tracking-[0.18em] ring-1 ring-orange-200/80 shadow-sm">
                    <Sparkle className="w-3 h-3" weight="fill" />
                    Vantagens exclusivas
                  </span>
                </div>

                {/* Mini credit card mockup */}
                <div className="z-10 relative mt-5 mb-4 self-start w-[78%]">
                  <div
                    className="relative aspect-[1.58/1] rounded-xl p-3 overflow-hidden shadow-[0_14px_30px_-12px_rgba(124,45,18,0.55)] ring-1 ring-white/20 transition-transform duration-500 group-hover:-rotate-2 group-hover:-translate-y-1"
                    style={{
                      background:
                        "linear-gradient(135deg,#9a3412 0%,#c2410c 45%,#ea580c 100%)",
                    }}
                  >
                    <div aria-hidden className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(at 80% 20%,rgba(255,255,255,0.5),transparent 55%)" }} />
                    <div className="relative flex items-start justify-between">
                      <div className="w-7 h-5 rounded bg-gradient-to-br from-amber-200 to-amber-500 ring-1 ring-white/30" />
                      <WifiHigh className="w-3.5 h-3.5 text-white/80 rotate-90" weight="bold" />
                    </div>
                    <div className="relative mt-2 text-white/90 font-mono text-[10px] tracking-[0.18em]">
                      •••• 4000
                    </div>
                    <div className="relative mt-1 flex items-end justify-between">
                      <span className="text-[8px] text-white font-extrabold tracking-[0.2em] uppercase">Pingo Card</span>
                      <span className="text-[7.5px] text-white/70 font-bold uppercase">12/29</span>
                    </div>
                  </div>
                </div>

                {/* Title + features */}
                <div className="z-10 relative space-y-3">
                  <div>
                    <h3 className="text-2xl font-extrabold text-orange-950 tracking-tight leading-none">
                      Pingo Card
                    </h3>
                    <p className="text-[13px] text-orange-900/70 mt-1 leading-snug">
                      Cartão de benefícios da família por
                    </p>
                    <p className="mt-0.5 flex items-baseline gap-1">
                      <span className="text-3xl font-black text-orange-700 tracking-tight">R$ 29</span>
                      <span className="text-xs font-bold text-orange-700/70">/mês</span>
                    </p>
                  </div>

                  <ul className="space-y-1.5 pt-1">
                    {["Consultas 24h", "Desconto em farmácias", "Toda a família"].map((b) => (
                      <li key={b} className="flex items-center gap-2 text-[12px] font-semibold text-orange-900/85">
                        <span className="w-4 h-4 rounded-full bg-orange-500/15 ring-1 ring-orange-400/40 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-orange-700" weight="bold" />
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>

                  <div className="pt-3 flex items-center gap-1.5 text-[12px] font-extrabold text-orange-700 group-hover:gap-2.5 transition-all">
                    Assinar agora
                    <ArrowRight className="w-3.5 h-3.5" weight="bold" />
                  </div>
                </div>
              </motion.button>
            )}

            {/* Benefícios principais */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className={`${showPingo ? "lg:col-span-3" : "lg:col-span-7"} lg:row-span-2 bg-white/95 backdrop-blur-sm rounded-3xl p-6 border border-white shadow-[0_12px_40px_-16px_rgba(2,132,199,0.18)] flex flex-col gap-3 justify-center`}
            >
              {highlights.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 group">
                  <div className="bg-gradient-to-br from-sky-50 to-sky-100 p-2 rounded-lg flex-shrink-0 ring-1 ring-sky-100 group-hover:scale-110 transition-transform">
                    <Icon className="w-4 h-4 text-[#0284c7]" weight="fill" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 leading-snug">{text}</p>
                </div>
              ))}
            </motion.div>

          </div>
        </div>
      </section>
    );
  })
);

HeroSection.displayName = "HeroSection";
export default HeroSection;
