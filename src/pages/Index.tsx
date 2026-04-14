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

    </div>
  );
});
Index.displayName = "Index";
export default Index;
