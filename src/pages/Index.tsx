import { useEffect, forwardRef } from "react";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import SpecialtiesSection from "@/components/landing/SpecialtiesSection";
import CTABanner from "@/components/landing/CTABanner";
import Footer from "@/components/landing/Footer";
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
  const isOn = (key: string) => sections ? enabled(key) : true;

  useEffect(() => {
    const prev = theme;
    setTheme("light");
    return () => { if (prev && prev !== "light") setTheme(prev); };
  }, []);

  return (
    <div className="relative min-h-screen bg-background">
      <div className="absolute inset-0 -z-10 bg-[image:var(--landing-bg)] pointer-events-none" />
      <SEOHead
        title="Consultas Médicas Online por Vídeo 24h | AloClínica"
        description="Consulte médicos online por vídeo 24h. Agendamento fácil, receitas digitais válidas, 30+ especialidades, plantão clínico 24h. Sua saúde na palma da mão."
        canonical="https://aloclinica.com.br/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "MedicalOrganization",
          name: "AloClínica",
          url: "https://aloclinica.com.br",
          logo: "https://aloclinica.com.br/pwa-512x512.png",
          description: "Plataforma de telemedicina com consultas online por vídeo 24h, receitas digitais válidas e mais de 30 especialidades médicas.",
          medicalSpecialty: ["Cardiologia", "Dermatologia", "Endocrinologia", "Neurologia", "Oftalmologia", "Ortopedia", "Pediatria", "Clínica Geral"],
          areaServed: { "@type": "Country", name: "BR" },
          contactPoint: { "@type": "ContactPoint", contactType: "customer service", availableLanguage: ["Portuguese"], telephone: "+55-11-99999-0000" },
          sameAs: ["https://www.instagram.com/aloclinica", "https://www.facebook.com/aloclinica"],
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Consultas Médicas",
            itemListElement: [
              { "@type": "Offer", name: "Consulta Avulsa", price: "89.00", priceCurrency: "BRL" },
              { "@type": "Offer", name: "Pronto-Atendimento 24h Diurno", price: "75.00", priceCurrency: "BRL" },
            ],
          },
          potentialAction: {
            "@type": "ReserveAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: "https://aloclinica.com.br/paciente",
              actionPlatform: ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"],
            },
            result: { "@type": "Reservation", name: "Consulta Médica Online" },
          },
          aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "2500", bestRating: "5" },
        }}
      />
      {isOn("header") && <Header />}
      {isOn("hero") && <HeroSection />}

      {/* ═══════════════ AGENDAR CONSULTA ═══════════════ */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/[0.03] via-primary/[0.08] to-background" />
        <div className="absolute top-[-10%] right-[-5%] w-[700px] h-[700px] bg-primary/[0.07] rounded-full blur-[160px] -z-10" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] bg-secondary/[0.05] rounded-full blur-[120px] -z-10" />

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-8 lg:gap-20 items-center">
            {/* Left — Image (much larger) */}
            <motion.div
              className="flex justify-center relative order-2 lg:order-1"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Glow behind image */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] to-secondary/[0.06] blur-[100px] rounded-full scale-75 -z-10" />
              <img
                src={doctorTeleconsulta}
                alt="Pingo, mascote da AloClínica, pronto para sua teleconsulta"
                loading="lazy"
                width={1024}
                height={1280}
                className="w-[340px] sm:w-[400px] md:w-[440px] lg:w-[500px] xl:w-[540px] h-auto drop-shadow-2xl"
              />
            </motion.div>

            {/* Right — Content */}
            <motion.div
              className="order-1 lg:order-2"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <motion.span
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary bg-primary/[0.08] px-4 py-1.5 rounded-full mb-5"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
              >
                <Video className="w-3.5 h-3.5" />
                Telemedicina
              </motion.span>
              <h2 className="text-3xl sm:text-4xl lg:text-[2.8rem] xl:text-5xl font-extrabold text-foreground leading-[1.1] mb-5">
                Agende sua<br />
                <span className="text-gradient">consulta online</span>
              </h2>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-10 max-w-lg">
                Consulte-se com médicos especialistas verificados sem sair de casa.
                Receitas digitais válidas em todo o Brasil, atendimento humanizado por vídeo em HD.
              </p>

              <div className="space-y-4 mb-10">
                {[
                  { img: pingoCalendar, title: "Agende em segundos", desc: "Escolha o horário que melhor se encaixa na sua rotina" },
                  { img: pingoVideocall, title: "Consulta por vídeo em HD", desc: "Atendimento seguro com criptografia ponta a ponta" },
                  { img: pingoPrescription, title: "Receita digital válida", desc: "Aceita em qualquer farmácia do Brasil" },
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    className="flex items-start gap-4 p-4 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/40 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                    initial={{ opacity: 0, x: 24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.25 + i * 0.12 }}
                  >
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0">
                      <img src={item.img} alt={item.title} loading="lazy" width={56} height={56} className="w-14 h-14 object-contain" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-[15px] md:text-base">{item.title}</p>
                      <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                className="flex flex-col sm:flex-row gap-3"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  size="lg"
                  className="rounded-2xl h-[54px] px-10 text-sm font-bold shadow-lg shadow-primary/25 group hover:-translate-y-0.5 transition-all"
                  onClick={() => navigate("/agendar")}
                >
                  Agendar consulta
                  <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-2xl h-[54px] px-10 text-sm font-bold border-2 hover:border-primary/30 hover:bg-primary/[0.04] transition-all"
                  onClick={() => navigate("/dashboard/doctors")}
                >
                  Ver especialistas
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════ ESPECIALIDADES ═══════════════ */}
      <SpecialtiesSection />

      {/* ═══════════════ DEPOIMENTOS ═══════════════ */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-primary/[0.03] to-background" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-16 items-center">
            {/* Left — Dra. Lila + Rating */}
            <motion.div
              className="flex flex-col items-center text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <img
                src={pingoDepoimentos}
                alt="Pingo com 5 estrelas de avaliação"
                loading="lazy"
                width={512}
                height={512}
                className="w-[240px] sm:w-[300px] lg:w-[340px] drop-shadow-xl mb-6"
              />
              <div className="flex items-center gap-1.5 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-2xl font-extrabold text-foreground">4.9/5</p>
              <p className="text-sm text-muted-foreground">Baseado em +12.000 avaliações</p>
            </motion.div>

            {/* Right — Testimonials */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-6"
              >
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary bg-primary/[0.08] px-4 py-1.5 rounded-full mb-4">
                  ✦ Depoimentos
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-tight">
                  O que nossos pacientes{" "}
                  <span className="text-gradient">estão dizendo</span>
                </h2>
              </motion.div>

              {[
                {
                  name: "Maria Fernanda",
                  city: "São Paulo, SP",
                  text: "Consultar pela AloClínica mudou minha vida. Recebi atendimento excelente do cardiologista sem sair de casa. Super recomendo!",
                  specialty: "Cardiologia",
                },
                {
                  name: "João Carlos",
                  city: "Recife, PE",
                  text: "Moro no interior e finalmente consegui consultar com um dermatologista. A receita digital funcionou perfeitamente na farmácia.",
                  specialty: "Dermatologia",
                },
                {
                  name: "Ana Beatriz",
                  city: "Belo Horizonte, MG",
                  text: "Atendimento rápido, médica muito atenciosa e a plataforma é super fácil de usar. Resolveu meu problema em 20 minutos!",
                  specialty: "Clínico Geral",
                },
              ].map((t, i) => (
                <motion.div
                  key={t.name}
                  className="p-5 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                  initial={{ opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + i * 0.1 }}
                >
                  <div className="flex items-center gap-1 mb-2.5">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star key={si} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-xs text-muted-foreground ml-2">{t.specialty}</span>
                  </div>
                  <p className="text-sm text-foreground mb-3 leading-relaxed">"{t.text}"</p>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{t.name[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.city}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA FINAL (removido) ═══════════════ */}

      {/* ═══════════════ FOOTER ═══════════════ */}
      {isOn("footer") && <Footer />}
    </div>
  );
});
Index.displayName = "Index";
export default Index;
