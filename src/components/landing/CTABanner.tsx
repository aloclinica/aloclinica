import { forwardRef } from "react";
import { BannerCTA } from "@/components/ui/banner-cta";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Clock, Star, Check, X, Heart, Lightning, Sparkle } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import mascotThumbsup from "@/assets/mascot-thumbsup.png";

const comparisonRows = [
  { feature: "Tempo de espera", us: "~15 min", them: "2–5 horas" },
  { feature: "Receita digital válida", us: true, them: false },
  { feature: "Disponível 24h", us: true, them: false },
  { feature: "Preço médio", us: "R$89", them: "R$200–400" },
  { feature: "Atestado digital", us: true, them: false },
];

const benefits = [
  { icon: Lightning, text: "Consulta em minutos" },
  { icon: ShieldCheck, text: "Dados criptografados" },
  { icon: Clock, text: "Disponível 24/7" },
  { icon: Star, text: "4.9★ de avaliação" },
  { icon: Heart, text: "50+ especialidades" },
];

const CTABanner = forwardRef<HTMLElement>((_, ref) => {
  const navigate = useNavigate();

  return (
    <section className="py-16 md:py-28 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-primary/95 to-secondary shadow-2xl shadow-primary/20"
        >
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/[0.04] -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-white/[0.04] translate-y-1/3 -translate-x-1/4" />
          <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] rounded-full bg-white/[0.015]" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-0">
            {/* Left column — CTA content */}
            <div className="lg:col-span-3 p-8 md:p-12 lg:px-16 lg:py-14 flex flex-col justify-center">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-primary-foreground text-xs font-semibold w-fit mb-6"
              >
                <span className="w-2 h-2 rounded-full bg-medical-green animate-pulse" />
                Médicos disponíveis agora
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-primary-foreground leading-[1.1] mb-5 tracking-tight"
              >
                Comece a cuidar da sua saúde{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">hoje mesmo</span>
                  <span className="absolute bottom-1 left-0 right-0 h-3.5 bg-white/15 rounded-full -z-0" />
                </span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="text-primary-foreground/70 text-base md:text-lg max-w-lg mb-8 leading-relaxed text-pretty"
              >
                Cadastre-se gratuitamente e agende sua primeira consulta com um especialista em minutos.
              </motion.p>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex flex-wrap gap-3 mb-10"
              >
                <Button
                  variant="rainbow"
                  size="lg"
                  className="rounded-full px-8 font-bold shadow-xl shadow-black/10 hover:shadow-2xl transition-all hover:scale-[1.03] active:scale-[0.97] group h-12"
                  onClick={() => navigate("/paciente")}
                >
                  Criar minha conta
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" weight="bold" />
                </Button>
                <BannerCTA
                  tone="light"
                  size="lg"
                  onClick={() => navigate("/paciente")}
                >
                  Consulta avulsa
                </BannerCTA>
              </motion.div>

              {/* Benefits row */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="flex flex-wrap gap-x-5 gap-y-2.5"
              >
                {benefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-primary-foreground/60 text-[11px] font-medium">
                    <b.icon className="w-3.5 h-3.5" weight="fill" />
                    {b.text}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right column — comparison + mascot */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center p-6 md:p-8 lg:p-10">
              {/* Mascot */}
              <motion.img
                src={mascotThumbsup}
                alt="Pingo mascote"
                className="w-28 h-28 md:w-32 md:h-32 object-contain drop-shadow-2xl mb-5 hidden lg:block"
                initial={{ opacity: 0, y: -20, rotate: -8 }}
                whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.35, type: "spring", stiffness: 180, damping: 14 }}
                whileHover={{ rotate: 5, scale: 1.08, transition: { duration: 0.3 } }}
              />

              {/* Comparison card */}
              <motion.div
                initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-sm rounded-2xl bg-white/[0.1] backdrop-blur-lg border border-white/[0.12] overflow-hidden shadow-xl shadow-black/10"
              >
                <div className="grid grid-cols-3 text-[10px] uppercase tracking-widest font-bold px-5 py-3.5 border-b border-white/10">
                  <span />
                  <span className="text-center text-primary-foreground">AloClinica</span>
                  <span className="text-center text-primary-foreground/35 text-[9px]">Tradicional</span>
                </div>
                {comparisonRows.map((row, i) => (
                  <div
                    key={i}
                    className={`grid grid-cols-3 items-center text-[12px] text-primary-foreground/70 px-5 py-3 ${
                      i < comparisonRows.length - 1 ? "border-b border-white/[0.06]" : ""
                    } hover:bg-white/[0.04] transition-colors`}
                  >
                    <span className="font-medium text-primary-foreground/80 text-[11px]">{row.feature}</span>
                    <span className="text-center font-bold text-primary-foreground">
                      {typeof row.us === "boolean" ? (
                        row.us ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-medical-green/25 mx-auto">
                            <Check className="w-3.5 h-3.5 text-medical-green" weight="bold" />
                          </span>
                        ) : (
                          <X className="w-3.5 h-3.5 opacity-40 mx-auto" weight="bold" />
                        )
                      ) : (
                        <span className="font-extrabold">{row.us}</span>
                      )}
                    </span>
                    <span className="text-center text-primary-foreground/30">
                      {typeof row.them === "boolean" ? (
                        row.them ? (
                          <Check className="w-3.5 h-3.5 mx-auto" weight="bold" />
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/[0.08] mx-auto">
                            <X className="w-3 h-3 opacity-50" weight="bold" />
                          </span>
                        )
                      ) : (
                        <span className="text-[11px]">{row.them}</span>
                      )}
                    </span>
                  </div>
                ))}
              </motion.div>

              {/* Trust note */}
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.55, duration: 0.5 }}
                className="text-[10px] text-primary-foreground/35 mt-4 text-center italic"
              >
                Mais de 10.000 pacientes atendidos com satisfação
              </motion.p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
});
CTABanner.displayName = "CTABanner";
export default CTABanner;
