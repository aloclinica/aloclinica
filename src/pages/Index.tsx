import { useEffect, forwardRef, lazy } from "react";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import SocialProofBar from "@/components/landing/SocialProofBar";
import FloatingMobileCTA from "@/components/landing/FloatingMobileCTA";
import DeferredSection from "@/components/ui/deferred-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Stethoscope } from "@phosphor-icons/react";
import { Stethoscope as StethoscopeLucide, Eye, Building2, ArrowRight, Wifi, Smartphone, LogIn, type LucideIcon } from "lucide-react";
import { useSiteConfig } from "@/lib/site-config";
import { useSiteSections } from "@/lib/site-sections";
import { motion } from "framer-motion";
import mockupPhoneHand from "@/assets/mockup-phone-hand.png";

// Icon name → component map (used to resolve string "icon" from CMS JSON)
const ICON_MAP: Record<string, LucideIcon> = {
  Stethoscope: StethoscopeLucide,
  Eye,
  Building2,
};

type EntryCard = {
  title: string;
  description: string;
  icon: string;
  cta: string;
  href: string;
  isClinic?: boolean;
};

const DEFAULT_ENTRY_CARDS: EntryCard[] = [
  { title: "Consulta Médica Online", description: "Fale por vídeo com médicos de diversas especialidades.", icon: "Stethoscope", cta: "Agendar agora", href: "/dashboard/doctors?type=telemedicina" },
  { title: "Consulta Oftalmológica",  description: "Avaliação com oftalmologista e teste de visão online.", icon: "Eye",         cta: "Ver oftalmologistas", href: "/dashboard/doctors?type=oftalmologia" },
  { title: "Sou clínica e quero enviar exame para laudo", description: "Envie exames e receba laudos de médicos especialistas.", icon: "Building2", cta: "Enviar exame", href: "/clinica/enviar-exame", isClinic: true },
];

function parseEntryCards(raw: string): EntryCard[] {
  if (!raw) return DEFAULT_ENTRY_CARDS;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as EntryCard[];
    return DEFAULT_ENTRY_CARDS;
  } catch {
    return DEFAULT_ENTRY_CARDS;
  }
}

// Lazy-load below-the-fold sections
const StatsSection = lazy(() => import("@/components/landing/StatsSection"));
const HorizontalScrollCards = lazy(() => import("@/components/landing/HorizontalScrollCards"));
const SpecialtiesShowcase = lazy(() => import("@/components/landing/SpecialtiesShowcase"));
const HowItWorksSection = lazy(() => import("@/components/landing/HowItWorksSection"));
const BenefitsGrid = lazy(() => import("@/components/landing/BenefitsGrid"));
const HealthNetworkSection = lazy(() => import("@/components/landing/HealthNetworkSection"));
const PricingSection = lazy(() => import("@/components/landing/PricingSection"));
const TestimonialsSection = lazy(() => import("@/components/landing/TestimonialsSection"));
const CTABanner = lazy(() => import("@/components/landing/CTABanner"));
const FAQSection = lazy(() => import("@/components/landing/FAQSection"));
const Footer = lazy(() => import("@/components/landing/Footer"));

const Index = forwardRef<HTMLDivElement>((_, ref) => {
  const { setTheme, theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { get } = useSiteConfig();
  const { enabled, configOf, sections } = useSiteSections();
  // If DB has seeded sections, use entry_cards from there; else fall back.
  const entryCardsFromDB = configOf<{ items?: EntryCard[] }>("entry_cards", { items: undefined });
  const entryCards = entryCardsFromDB.items && entryCardsFromDB.items.length > 0
    ? entryCardsFromDB.items
    : parseEntryCards(get("entry_cards", ""));
  // When sections not loaded yet, render everything (default).
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

      {/* ═══════════════ TELEMEDICINA É SIMPLES ═══════════════ */}
      <section className="py-12 md:py-20 relative overflow-hidden">
        {/* Gradient background that bridges hero to content */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/[0.03] via-primary/[0.08] to-primary/[0.02]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/[0.06] rounded-full blur-[120px] -z-10" />

        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 shadow-2xl shadow-primary/20">
            <div className="grid lg:grid-cols-2 items-center min-h-[420px]">
              {/* Left — Phone mockup */}
              <motion.div
                className="flex justify-center items-end pt-10 lg:pt-0 px-8 lg:px-12 relative"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-white/[0.05] rounded-full blur-[80px]" />
                <img
                  src={mockupPhoneHand}
                  alt="App AloClínica no celular"
                  loading="lazy"
                  width={800}
                  height={1024}
                  className="w-[260px] md:w-[300px] lg:w-[340px] h-auto drop-shadow-2xl relative z-10"
                />
              </motion.div>

              {/* Right — Text + checklist */}
              <motion.div
                className="p-8 md:p-12 lg:p-16"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.15 }}
              >
                <div className="w-10 h-1 bg-primary-foreground/40 rounded-full mb-6" />
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary-foreground leading-tight mb-3">
                  Para se consultar via<br />Telemedicina é simples!
                </h2>
                <p className="text-primary-foreground/70 text-sm md:text-base mb-8 max-w-md">
                  Você precisa de apenas 3 coisas para começar sua consulta online agora mesmo.
                </p>

                <div className="space-y-5">
                  {[
                    { icon: <Wifi className="w-5 h-5" />, text: "Basta ter acesso a internet", detail: "Wi-Fi ou dados móveis" },
                    { icon: <Smartphone className="w-5 h-5" />, text: "Um aparelho com câmera", detail: "Celular, tablet ou notebook" },
                    { icon: <LogIn className="w-5 h-5" />, text: "Fazer login no Portal", detail: "Cadastro rápido e gratuito" },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center gap-4 bg-white/[0.08] backdrop-blur-sm rounded-2xl p-4 border border-white/[0.1] hover:bg-white/[0.12] transition-colors"
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.25 + i * 0.1 }}
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary-foreground/15 border border-primary-foreground/20 flex items-center justify-center shrink-0 text-primary-foreground">
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-base md:text-lg font-bold text-primary-foreground leading-snug">
                          {item.text}
                        </p>
                        <p className="text-xs text-primary-foreground/60">{item.detail}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {isOn("social_proof") && <SocialProofBar />}

      {isOn("stats") && <DeferredSection rootMargin="200px 0px">
        <StatsSection />
      </DeferredSection>}

      {isOn("entry_cards") && entryCards.length > 0 && (
        <section className="py-12 md:py-20" id="servicos">
          <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
            <motion.div
              className="text-center mb-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground mb-3">
                Nossos Serviços
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Escolha o tipo de atendimento ideal para você
              </p>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {entryCards.map((card, i) => {
                const Icon = ICON_MAP[card.icon] || StethoscopeLucide;
                return (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card
                      className="group h-full cursor-pointer border-border/50 bg-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                      onClick={() => navigate(card.href)}
                    >
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2">{card.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4 flex-1">{card.description}</p>
                        <Button variant="ghost" className="w-full justify-between group-hover:text-primary transition-colors">
                          {card.cta}
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {isOn("horizontal_scroll") && <DeferredSection rootMargin="200px 0px">
        <HorizontalScrollCards />
      </DeferredSection>}

      {isOn("specialties") && <DeferredSection rootMargin="200px 0px">
        <SpecialtiesShowcase />
      </DeferredSection>}

      {isOn("how_it_works") && <DeferredSection rootMargin="200px 0px">
        <HowItWorksSection />
      </DeferredSection>}

      {isOn("benefits") && <DeferredSection rootMargin="200px 0px">
        <BenefitsGrid />
      </DeferredSection>}

      {isOn("health_network") && <DeferredSection rootMargin="200px 0px">
        <HealthNetworkSection />
      </DeferredSection>}

      {isOn("pricing") && <DeferredSection rootMargin="200px 0px">
        <PricingSection />
      </DeferredSection>}

      {isOn("testimonials") && <DeferredSection rootMargin="200px 0px">
        <TestimonialsSection />
      </DeferredSection>}

      {isOn("cta_banner") && <DeferredSection rootMargin="200px 0px">
        <CTABanner />
      </DeferredSection>}

      {isOn("faq") && <DeferredSection rootMargin="200px 0px">
        <FAQSection />
      </DeferredSection>}

      <FloatingMobileCTA />

      {isOn("footer") && <DeferredSection fallbackClassName="h-72" rootMargin="180px 0px">
        <Footer />
      </DeferredSection>}
    </div>
  );
});
Index.displayName = "Index";
export default Index;
