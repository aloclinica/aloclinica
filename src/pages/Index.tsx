import { useEffect, forwardRef, useMemo } from "react";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import SpecialtiesSection from "@/components/landing/SpecialtiesSection";
import Footer from "@/components/landing/Footer";
import TechnologySection from "@/components/landing/TechnologySection";
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
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/[0.03] via-primary/[0.08] to-background" />
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-8 lg:gap-20 items-center">
            <motion.div
              className="flex justify-center relative order-2 lg:order-1"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <img src={doctorTeleconsulta} alt="Médico Teleconsulta" className="w-[340px] lg:w-[500px] h-auto drop-shadow-2xl" />
            </motion.div>

            <motion.div
              className="order-1 lg:order-2"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-5xl font-extrabold text-foreground leading-[1.1] mb-5">
                Agende sua <span className="text-gradient">consulta online</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-10">
                Consulte-se com médicos especialistas verificados sem sair de casa.
                Receitas digitais válidas em todo o Brasil.
              </p>

              <div className="space-y-4 mb-10">
                {[
                  { img: pingoCalendar, title: "Agende em segundos", desc: "Escolha o horário que melhor se encaixa" },
                  { img: pingoVideocall, title: "Consulta por vídeo HD", desc: "Atendimento seguro e criptografado" },
                  { img: pingoPrescription, title: "Receita digital", desc: "Aceita em qualquer farmácia" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-card/80 border border-border/40 shadow-sm">
                    <img src={item.img} alt={item.title} className="w-12 h-12 object-contain" />
                    <div>
                      <p className="font-bold text-foreground">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="rounded-2xl h-[54px] px-10 font-bold shadow-lg shadow-primary/25" onClick={() => navigate("/agendar")}>
                  Agendar consulta <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <TechnologySection />
      <SpecialtiesSection />

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

      {isOn("footer") && <Footer config={sectionData.footer} />}
    </div>
  );
});

Index.displayName = "Index";
export default Index;
