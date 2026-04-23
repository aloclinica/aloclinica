import { useEffect, forwardRef, useMemo } from "react";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import SpecialtiesSection from "@/components/landing/SpecialtiesSection";
import Footer from "@/components/landing/Footer";
import TechnologySection from "@/components/landing/TechnologySection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import BenefitsGrid from "@/components/landing/BenefitsGrid";
import ForDoctorsSection from "@/components/landing/ForDoctorsSection";
import CTABanner from "@/components/landing/CTABanner";
import FAQSection from "@/components/landing/FAQSection";
import { Button } from "@/components/ui/button";
import { ArrowRight, Video, Star } from "lucide-react";
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
      {isOn("how_it_works") !== false && <HowItWorksSection />}
      {isOn("benefits") !== false && <BenefitsGrid />}
      <SpecialtiesSection config={sectionData.specialties} />

      {/* ═══════════════ DEPOIMENTOS ═══════════════ */}
      {isOn("testimonials") && (
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-primary/[0.03] to-background" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-16 items-center">
              <div className="flex flex-col items-center text-center">
                <img src={pingoDepoimentos} alt="Depoimentos" className="w-[240px] lg:w-[340px] drop-shadow-xl mb-6" />
                <div className="flex items-center gap-1.5 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-2xl font-extrabold text-foreground">4.9/5</p>
                <p className="text-sm text-muted-foreground">Baseado em +12.000 avaliações</p>
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-6">
                  {sectionData.testimonials?.title || "O que nossos pacientes estão dizendo"}
                </h2>
                {(sectionData.testimonials?.reviews || []).map((t: any, i: number) => (
                  <div key={i} className="p-5 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm">
                    <div className="flex items-center gap-1 mb-2.5">
                      {Array.from({ length: 5 }).map((_, si) => <Star key={si} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                      <span className="text-xs text-muted-foreground ml-2">{t.specialty}</span>
                    </div>
                    <p className="text-sm text-foreground mb-3 leading-relaxed">"{t.text}"</p>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">{t.name[0]}</div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.city}</p>
                      </div>
                    </div>
                  </div>
                ))}
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
