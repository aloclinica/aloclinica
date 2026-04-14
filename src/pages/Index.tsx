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
import { Stethoscope as StethoscopeLucide, Eye, Building2, ArrowRight, Wifi, Smartphone, LogIn, Calendar, Video, FileText, type LucideIcon } from "lucide-react";
import { useSiteConfig } from "@/lib/site-config";
import { useSiteSections } from "@/lib/site-sections";
import { motion } from "framer-motion";
import doctorTeleconsulta from "@/assets/doctor-phone-teleconsulta.png";

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

      {/* ═══════════════ AGENDAR CONSULTA ═══════════════ */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/[0.04] via-primary/[0.10] to-background" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/[0.06] rounded-full blur-[150px] -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Image */}
            <motion.div
              className="flex justify-center lg:justify-start"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <img
                src={doctorTeleconsulta}
                alt="Médica realizando teleconsulta"
                loading="lazy"
                width={1024}
                height={1280}
                className="w-[280px] sm:w-[320px] lg:w-[380px] h-auto drop-shadow-2xl"
              />
            </motion.div>

            {/* Right — Content */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-3">
                Telemedicina
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight mb-4">
                Agende sua<br />
                <span className="text-primary">consulta online</span>
              </h2>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-8 max-w-lg">
                Consulte-se com médicos especialistas verificados sem sair de casa.
                Receitas digitais válidas em todo o Brasil, atendimento humanizado por vídeo em HD.
              </p>

              <div className="space-y-4 mb-10">
                {[
                  { icon: Calendar, title: "Agende em segundos", desc: "Escolha o horário que melhor se encaixa na sua rotina" },
                  { icon: Video, title: "Consulta por vídeo em HD", desc: "Atendimento seguro com criptografia ponta a ponta" },
                  { icon: FileText, title: "Receita digital válida", desc: "Aceita em qualquer farmácia do Brasil" },
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                  >
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm md:text-base">{item.title}</p>
                      <p className="text-xs md:text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                className="flex flex-col sm:flex-row gap-3"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  size="lg"
                  className="rounded-2xl h-[52px] px-8 text-sm font-bold shadow-lg shadow-primary/20 group"
                  onClick={() => navigate("/paciente")}
                >
                  Agendar consulta
                  <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-2xl h-[52px] px-8 text-sm font-bold border-2"
                  onClick={() => navigate("/dashboard/doctors")}
                >
                  Ver especialistas
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
});
Index.displayName = "Index";
export default Index;
