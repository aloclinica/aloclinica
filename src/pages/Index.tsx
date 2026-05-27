import { useEffect, forwardRef, useMemo } from "react";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import PingoRunBanner from "@/components/landing/PingoRunBanner";
import SpecialtiesSection from "@/components/landing/SpecialtiesSection";
import Footer from "@/components/landing/Footer";
import TechnologySection from "@/components/landing/TechnologySection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import BenefitsGrid from "@/components/landing/BenefitsGrid";
import ForDoctorsSection from "@/components/landing/ForDoctorsSection";
import CTABanner from "@/components/landing/CTABanner";
import ConsultaInfoBanner from "@/components/landing/ConsultaInfoBanner";
import TrustBanner from "@/components/landing/TrustBanner";
import PingoCardBanner from "@/components/landing/PingoCardBanner";
import FAQSection from "@/components/landing/FAQSection";
import TestimonialsMarquee from "@/components/landing/TestimonialsMarquee";
import { Button } from "@/components/ui/button";
import { ArrowRight, Video, Star, Quote } from "lucide-react";
import { useSiteSections } from "@/lib/site-sections";
import { motion } from "framer-motion";
import doctorTeleconsulta from "@/assets/doctor-phone-teleconsulta.png";
import pingoCalendar from "@/assets/pingo-calendar.png";
import pingoVideocall from "@/assets/pingo-videocall.png";
import pingoPrescription from "@/assets/pingo-prescription.png";
import pingoDepoimentos from "@/assets/pingo-depoimentos.png";

const Index = forwardRef<HTMLDivElement>((_, ref) => {
  const { setTheme, theme } = useTheme();
  const navigate = useNavigate();
  const { enabled, sections } = useSiteSections();

  const sectionData = useMemo(() => {
    const map: Record<string, any> = {};
    if (sections) {
      sections.forEach(s => {
        map[s.key] = s.config;
      });
    }
    return map;
  }, [sections]);

  const isOn = (key: string) => enabled(key);

  useEffect(() => {
    const prev = theme;
    setTheme("light");
    return () => { if (prev && prev !== "light") setTheme(prev); };
  }, []);

  return (
    <div className="relative min-h-screen bg-background" ref={ref}>
      <div className="absolute inset-0 -z-10 bg-[image:var(--landing-bg)] pointer-events-none" />
      <SEOHead
        title="Consultas Médicas Online por Vídeo 24h | AloClínica"
        description="Consulte médicos online por vídeo 24h. Agendamento fácil, receitas digitais válidas, 30+ especialidades, plantão clínico 24h. Sua saúde na palma da mão."
        canonical="https://aloclinica.com.br/"
      />
      
      {isOn("header") && <Header config={sectionData.header} />}
      {isOn("hero") && <HeroSection config={sectionData.hero} />}
      <PingoRunBanner />

      {/* ═══════════════ AGENDAR CONSULTA ═══════════════ */}
      <section className="relative py-24 md:py-40 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/[0.02] via-primary/[0.05] to-background" />
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-24 items-center">
            <motion.div
              className="flex justify-center relative order-2 lg:order-1"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-[80px] scale-75 animate-pulse" />
              <img src={doctorTeleconsulta} alt="Médico Teleconsulta" className="relative z-10 w-[380px] lg:w-[540px] h-auto drop-shadow-2xl" />
            </motion.div>

            <motion.div
              className="order-1 lg:order-2"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-4xl lg:text-6xl font-black text-foreground leading-[1.05] mb-6">
                Agende sua <span className="text-gradient">consulta online</span> em minutos
              </h2>
              <p className="text-muted-foreground text-lg sm:text-xl mb-12 max-w-xl">
                Acesso imediato a médicos especialistas de qualquer lugar. Receitas, atestados e exames entregues digitalmente com total segurança.
              </p>

              <div className="grid sm:grid-cols-1 gap-5 mb-12">
                {[
                  { img: pingoCalendar, title: "Agende em segundos", desc: "Escolha o melhor horário para você" },
                  { img: pingoVideocall, title: "Consulta por vídeo HD", desc: "Atendimento humano e seguro por vídeo" },
                  { img: pingoPrescription, title: "Receita digital", desc: "Válida em todas as farmácias do país" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-5 p-5 rounded-2xl bg-card/40 border border-border/50 shadow-sm backdrop-blur-sm transition-all hover:bg-card/60">
                    <img src={item.img} alt={item.title} className="w-14 h-14 object-contain" />
                    <div>
                      <p className="font-extrabold text-foreground text-lg">{item.title}</p>
                      <p className="text-sm text-muted-foreground font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="rounded-2xl h-[60px] px-12 text-lg font-bold shadow-2xl shadow-primary/25 transition-transform hover:scale-105" onClick={() => navigate("/agendar")}>
                  Agendar consulta <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <TechnologySection config={sectionData.technology} />
      <ConsultaInfoBanner />
      {isOn("how_it_works") !== false && <HowItWorksSection />}
      <PingoCardBanner />
      {isOn("benefits") !== false && <BenefitsGrid />}
      <SpecialtiesSection config={sectionData.specialties} />
      <TrustBanner />

      {/* ═══════════════ DEPOIMENTOS ═══════════════ */}
      {isOn("testimonials") && (
        <section className="relative py-24 md:py-32 overflow-hidden">
          {/* Background ambiance */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-primary/[0.04] to-background" />
          <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-primary/10 blur-3xl -z-10" />
          <div className="absolute -bottom-32 -right-32 w-[420px] h-[420px] rounded-full bg-secondary/10 blur-3xl -z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-[0.9fr_1.3fr] gap-16 lg:gap-20 items-center">
              {/* Pingo + rating */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="flex flex-col items-center text-center relative"
              >
                <div className="relative">
                  {/* Halo */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-secondary/15 to-transparent rounded-full blur-2xl scale-110" />
                  <div className="absolute inset-4 bg-card rounded-full shadow-2xl" />
                  <img
                    src={pingoDepoimentos}
                    alt="Pingo celebrando avaliações dos pacientes"
                    className="relative w-[260px] lg:w-[360px] drop-shadow-2xl pingo-float"
                  />
                </div>

                <div className="relative mt-6 px-8 py-5 rounded-[2rem] bg-card border border-border/60 shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.25)]">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400 drop-shadow-sm" />
                    ))}
                  </div>
                  <p className="text-4xl font-extrabold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent leading-none">
                    4.9<span className="text-2xl text-muted-foreground font-bold">/5</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 font-semibold uppercase tracking-wider">
                    +12.000 avaliações reais
                  </p>
                </div>
              </motion.div>

              {/* Testimonials */}
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="mb-10"
                >
                  <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary/60 mb-3 block">
                    Depoimentos
                  </span>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight leading-[1.05]">
                    {sectionData.testimonials?.title || (
                      <>
                        O que nossos <span className="text-primary">pacientes</span> dizem
                      </>
                    )}
                  </h2>
                </motion.div>

                <div className="space-y-5">
                  {(sectionData.testimonials?.reviews || []).map((t: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 24 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className="group relative p-6 md:p-7 rounded-[1.75rem] bg-card border border-border/60 shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.12)] hover:shadow-[0_20px_50px_-20px_hsl(var(--primary)/0.25)] hover:-translate-y-1 hover:border-primary/30 transition-all duration-500 overflow-hidden"
                    >
                      {/* Accent bar */}
                      <div className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full bg-gradient-to-b from-primary via-primary/60 to-secondary opacity-70 group-hover:opacity-100 transition-opacity" />
                      {/* Quote watermark */}
                      <Quote className="absolute -top-2 -right-2 w-24 h-24 text-primary/[0.06] rotate-180" strokeWidth={1.5} />

                      <div className="relative pl-3">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, si) => (
                              <Star key={si} className="w-4 h-4 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary/70 bg-primary/8 px-2.5 py-1 rounded-full border border-primary/15">
                            {t.specialty}
                          </span>
                        </div>
                        <p className="text-base md:text-lg text-foreground/90 mb-5 leading-relaxed font-medium">
                          "{t.text}"
                        </p>
                        <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-extrabold text-primary-foreground text-sm shadow-md">
                            {t.name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground leading-tight">{t.name}</p>
                            <p className="text-xs text-muted-foreground font-medium">{t.city}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {isOn("for_doctors") !== false && <ForDoctorsSection />}
      {isOn("faq") !== false && <FAQSection />}
      {isOn("cta_banner") !== false && <CTABanner />}

      {isOn("footer") && <Footer config={sectionData.footer} />}
    </div>
  );
});

Index.displayName = "Index";
export default Index;
