import { lazy, Suspense, useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Heart, Star, Shield, Check, X, ArrowRight, QrCode, Sparkle, MapPin, Storefront, Flask, Eyeglasses, Quotes, Lightning, Users, Clock, Buildings, ShieldCheck, CurrencyCircleDollar, CaretRight, ShieldStar, Umbrella, Gift, DeviceMobile, FileText, Prescription, Video, CaretLeft } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Header from "@/components/landing/Header";
import SEOHead from "@/components/SEOHead";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import { PingoSubscribeDialog } from "@/components/patient/PingoSubscribeDialog";
import PublicPageEnhancer from "@/components/landing/PublicPageEnhancer";

// Imagens da coleção Cloudinary (vias assets locais para retrocompatibilidade)
import campaignAccidentInsuranceImage from "@/assets/pingo-campaign/accident-insurance.jpg";
import campaignAllInOneCardImage from "@/assets/pingo-campaign/all-in-one-card.jpg";
import campaignAppHealthImage from "@/assets/pingo-campaign/app-health.jpg";
import campaignCardCareProtectionImage from "@/assets/pingo-campaign/card-care-protection.jpg";
import campaignEconomyCardImage from "@/assets/pingo-campaign/economy-card.jpg";
import campaignExamsConfidenceImage from "@/assets/pingo-campaign/exams-confidence.jpg";
import campaignFuneralSupportImage from "@/assets/pingo-campaign/funeral-support.jpg";
import campaignLifeStagesImage from "@/assets/pingo-campaign/life-stages.jpg";
import campaignPingoCardFamilyImage from "@/assets/pingo-campaign/pingo-card-family.jpg";
import campaignPreventionCheckupImage from "@/assets/pingo-campaign/prevention-checkup.jpg";
import campaignPrizeDrawImage from "@/assets/pingo-campaign/prize-draw.jpg";
import campaignSimpleAccessImage from "@/assets/pingo-campaign/simple-access.jpg";
import campaignSpecialistsImage from "@/assets/pingo-campaign/specialists.jpg";
import campaignTelemedicinePhoneImage from "@/assets/pingo-campaign/telemedicine-phone.jpg";

const PINGO_ASSETS = {
  hero: campaignPingoCardFamilyImage,
  telemedicina: campaignTelemedicinePhoneImage,
  seguro: campaignAccidentInsuranceImage,
  funeral: campaignFuneralSupportImage,
  sorteio: campaignPrizeDrawImage,
  economia: campaignEconomyCardImage,
  fases: campaignLifeStagesImage,
  acesso: campaignSimpleAccessImage,
  tudoEmUm: campaignAllInOneCardImage,
  cuidado: campaignCardCareProtectionImage,
  exames: campaignExamsConfidenceImage,
  app: campaignAppHealthImage,
  especialistas: campaignSpecialistsImage,
  prevencao: campaignPreventionCheckupImage,
};

const SLIDES = [
  {
    image: PINGO_ASSETS.hero,
    title: "Sua família protegida com o melhor custo-benefício",
    subtitle: "Acesso a saúde de qualidade por menos de R$ 1,00 por dia.",
    badge: "O queridinho do Brasil",
    cta: "Assinar agora",
    color: "from-blue-600 to-cyan-500"
  },
  {
    image: PINGO_ASSETS.telemedicina,
    title: "Telemedicina 24h sem custo adicional",
    subtitle: "Fale com médicos pelo celular de onde estiver, a qualquer hora.",
    badge: "Saúde Digital",
    cta: "Conhecer planos",
    color: "from-emerald-600 to-teal-500"
  },
  {
    image: PINGO_ASSETS.economia,
    title: "Economia real em exames e farmácias",
    subtitle: "Até 60% de desconto em mais de 15.000 pontos de atendimento.",
    badge: "Economia Inteligente",
    cta: "Ver parceiros",
    color: "from-amber-500 to-orange-500"
  },
  {
    image: PINGO_ASSETS.sorteio,
    title: "Sorteios mensais de R$ 10.000,00",
    subtitle: "Assinantes Pingo Card concorrem a prêmios todos os meses.",
    badge: "Benefício Extra",
    cta: "Quero concorrer",
    color: "from-purple-600 to-pink-500"
  }
];

const Footer = lazy(() => import("@/components/landing/Footer"));

interface PingoPlan {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  consultation_discount_percent: number;
  exam_discount_percent: number;
  partner_discount_percent: number;
  max_dependents: number;
  benefits: string[];
  color: string;
  is_highlighted: boolean;
}

interface PingoPartner {
  id: string;
  name: string;
  category: string;
  description: string | null;
  discount_percent: number;
  discount_description: string | null;
  city: string | null;
  state: string | null;
  is_featured: boolean;
}

const categoryIcons: Record<string, React.ReactNode> = {
  farmacia: <Storefront size={20} weight="fill" />,
  laboratorio: <Flask size={20} weight="fill" />,
  otica: <Eyeglasses size={20} weight="fill" />,
  academia: <Sparkle size={20} weight="fill" />,
};

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const HeroSlider = ({ onCtaClick }: { onCtaClick: () => void }) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const slideNext = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const slidePrev = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(slideNext, 6000);
    return () => clearInterval(timer);
  }, [slideNext]);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <div className="relative w-full h-[600px] md:h-[720px] overflow-hidden rounded-[2rem] md:rounded-[3rem] bg-slate-900 shadow-2xl">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent z-10" />
          <img
            src={SLIDES[current].image}
            alt={SLIDES[current].title}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          
          <div className="relative z-20 h-full flex flex-col justify-center px-6 md:px-20 max-w-4xl">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-white bg-gradient-to-r ${SLIDES[current].color} mb-6 shadow-lg shadow-black/20 self-start`}
            >
              <Sparkle className="w-4 h-4 mr-2 fill-current" />
              {SLIDES[current].badge}
            </motion.span>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-7xl font-black text-white leading-[1.05] mb-6 drop-shadow-sm"
            >
              {SLIDES[current].title}
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg md:text-xl text-slate-200 mb-10 max-w-2xl font-medium leading-relaxed"
            >
              {SLIDES[current].subtitle}
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-4"
            >
              <Button 
                size="lg" 
                onClick={onCtaClick}
                className={`h-14 px-10 rounded-2xl text-lg font-bold bg-gradient-to-r ${SLIDES[current].color} hover:scale-105 transition-all shadow-xl shadow-black/20 border-none`}
              >
                {SLIDES[current].cta} <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls */}
      <div className="absolute bottom-10 right-10 z-30 flex items-center gap-3">
        <button
          onClick={slidePrev}
          className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-all"
        >
          <CaretLeft size={24} weight="bold" />
        </button>
        <button
          onClick={slideNext}
          className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-all"
        >
          <CaretRight size={24} weight="bold" />
        </button>
      </div>

      {/* Indicators */}
      <div className="absolute bottom-10 left-10 md:left-20 z-30 flex items-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setDirection(i > current ? 1 : -1);
              setCurrent(i);
            }}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === current ? "w-10 bg-white" : "w-3 bg-white/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const PingoCard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [plans, setPlans] = useState<PingoPlan[]>([]);
  const [partners, setPartners] = useState<PingoPartner[]>([]);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [partnerCategory, setPartnerCategory] = useState<string>("todas");
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PingoPlan | null>(null);

  const handleSubscribe = (plan: PingoPlan, cycle: "monthly" | "yearly" = billing) => {
    if (!user) {
      navigate(`/paciente?next=/pingo-card%23planos`);
      return;
    }
    setBilling(cycle);
    setSelectedPlan(plan);
    setSubscribeOpen(true);
  };

  const handleSubscribed = () => {
    if (selectedPlan && selectedPlan.max_dependents > 0) {
      navigate("/dashboard/cartao/dependentes?role=cartao_beneficios&onboarding=1");
      return;
    }
    navigate("/dashboard/cartao/carteirinha?role=cartao_beneficios");
  };

  useEffect(() => {
    const load = async () => {
      const [{ data: planData }, { data: partnerData }] = await Promise.all([
        db.from("pingo_card_plans").select("*").eq("is_active", true).order("display_order"),
        db.from("pingo_card_partners").select("*").eq("is_active", true).order("display_order").limit(12),
      ]);
      setPlans((planData ?? []) as PingoPlan[]);
      setPartners((partnerData ?? []) as PingoPartner[]);
    };
    load();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = window.scrollY / totalHeight;
      setScrollProgress(progress);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const partnerCategories = useMemo(() => {
    const set = new Set<string>(partners.map(p => p.category));
    return ["todas", ...Array.from(set)];
  }, [partners]);

  const filteredPartners = useMemo(
    () => partnerCategory === "todas" ? partners : partners.filter(p => p.category === partnerCategory),
    [partners, partnerCategory]
  );

  const categoryLabels: Record<string, string> = {
    todas: "Todas",
    farmacia: "Farmácias",
    laboratorio: "Laboratórios",
    otica: "Óticas",
    academia: "Academias",
  };

  const stats = [
    { icon: <Users size={24} weight="fill" />, value: "+15 mil", label: "Vidas cuidadas" },
    { icon: <Buildings size={24} weight="fill" />, value: "+800", label: "Parceiros credenciados" },
    { icon: <Lightning size={24} weight="fill" />, value: "Até 60%", label: "De desconto em exames" },
    { icon: <Clock size={24} weight="fill" />, value: "0 dias", label: "De carência" },
  ];

  const faqs = [
    { q: "O Pingo Card é um plano de saúde?", a: "Não. O Pingo Card é um cartão de benefícios que oferece descontos em consultas, exames e parceiros — sem carência e sem coparticipação fixa." },
    { q: "Posso incluir minha família?", a: "Sim! Os planos Família e Premium incluem dependentes. Você pode adicionar até o limite definido em cada plano." },
    { q: "Tem fidelidade ou multa?", a: "Não. Você pode cancelar quando quiser, sem multa nem burocracia. É só acessar o painel e cancelar com um clique." },
    { q: "Como uso meu cartão?", a: "Após assinar, você recebe seu cartão digital com QR Code no app. Basta apresentar em consultas, exames e parceiros para garantir o desconto." },
    { q: "Quais são as formas de pagamento?", a: "Aceitamos PIX, cartão de crédito (Visa, Master, Elo) e débito recorrente. O plano anual tem 15% de desconto à vista." },
    { q: "Em quanto tempo o cartão fica ativo?", a: "Imediatamente! Após a confirmação do pagamento (PIX é instantâneo), seu cartão já está disponível para uso." },
  ];

  const comparison = [
    { feature: "Mensalidade a partir de", pingo: "R$ 19,90", plano: "R$ 250+", pingoOk: true },
    { feature: "Carência", pingo: "Nenhuma", plano: "Até 180 dias", pingoOk: true },
    { feature: "Fidelidade / multa", pingo: "Não", plano: "Sim", pingoOk: true },
    { feature: "Consultas online ilimitadas", pingo: true, plano: false, pingoOk: true },
    { feature: "Descontos em farmácias", pingo: true, plano: false, pingoOk: true },
    { feature: "Aceito em todo Brasil", pingo: true, plano: "Regional", pingoOk: true },
  ];

  const testimonials = [
    { name: "Mariana C.", role: "Mãe de 2 filhos", text: "Em 3 meses já paguei o cartão de um ano inteiro. Os descontos em laboratório fizeram total diferença.", rating: 5 },
    { name: "Roberto S.", role: "Aposentado", text: "Eu e minha esposa usamos o Pingo Card para consultas de rotina. Atendimento excelente e preços justíssimos.", rating: 5 },
    { name: "Juliana M.", role: "Designer", text: "O QR Code no celular é prático demais. Já usei em farmácias e ótica. Recomendo!", rating: 5 },
  ];

  const bentoBenefits = [
    { 
      title: "Telemedicina Ilimitada", 
      desc: "Consultas 24h por dia, 7 dias por semana, sem sair de casa.", 
      icon: <Video size={32} weight="fill" className="text-blue-600" />,
      size: "lg",
      image: PINGO_ASSETS.telemedicina,
      color: "bg-blue-50"
    },
    { 
      title: "Descontos em Exames", 
      desc: "Economize até 60% em laboratórios parceiros.", 
      icon: <Flask size={32} weight="fill" className="text-emerald-600" />,
      size: "sm",
      color: "bg-emerald-50"
    },
    { 
      title: "Seguro de Acidentes", 
      desc: "Proteção financeira para você e sua família.", 
      icon: <ShieldCheck size={32} weight="fill" className="text-amber-600" />,
      size: "sm",
      color: "bg-amber-50"
    },
    { 
      title: "Farmácias Parceiras", 
      desc: "Descontos exclusivos em medicamentos.", 
      icon: <Prescription size={32} weight="fill" className="text-purple-600" />,
      size: "sm",
      color: "bg-purple-50"
    },
    { 
      title: "Sorteios Mensais", 
      desc: "Concorra a R$ 10.000 todos os meses.", 
      icon: <Gift size={32} weight="fill" className="text-pink-600" />,
      size: "sm",
      color: "bg-pink-50"
    },
    { 
      title: "Auxílio Funeral", 
      desc: "Assistência completa em momentos difíceis.", 
      icon: <Umbrella size={32} weight="fill" className="text-slate-600" />,
      size: "sm",
      color: "bg-slate-50"
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <HeroSlider onCtaClick={() => document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" })} />

      {/* Stats */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4 shadow-sm">
                {stat.icon}
              </div>
              <span className="text-2xl font-black text-slate-900">{stat.value}</span>
              <span className="text-sm text-slate-500 font-medium mt-1">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Bento */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-5xl font-black text-center mb-16">
            Tudo o que você precisa em <span className="text-blue-600">um só cartão</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {bentoBenefits.map((b, i) => (
              <div key={i} className={`p-8 rounded-3xl ${b.color} border border-slate-200/50 shadow-sm transition hover:shadow-lg hover:-translate-y-1 ${b.size === 'lg' ? 'md:col-span-2' : ''}`}>
                <div className="mb-6">{b.icon}</div>
                <h3 className="text-2xl font-black mb-2">{b.title}</h3>
                <p className="text-slate-600 font-medium">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="planos" className="py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-black text-center mb-16">Escolha o seu plano</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map(plan => (
              <div key={plan.id} className="p-8 rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-100 transition hover:-translate-y-2">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="text-4xl font-black mb-4">{formatBRL(plan.price_monthly)}<span className="text-sm font-medium text-slate-400">/mês</span></div>
                <ul className="space-y-4 mb-8">
                  {plan.benefits.map(b => <li key={b} className="flex items-center gap-2"><Check className="text-green-500" /> {b}</li>)}
                </ul>
                <Button className="w-full rounded-xl" onClick={() => handleSubscribe(plan)}>Assinar</Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-6">Pingo Card vs. Planos Comuns</h2>
            <p className="text-slate-400 font-medium">Compare e veja por que milhares de pessoas estão mudando para o Pingo.</p>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-950/50 overflow-hidden shadow-2xl">
            {comparison.map((item, i) => (
              <div key={i} className={`grid grid-cols-12 p-6 border-b border-slate-800 last:border-0 ${i % 2 === 0 ? 'bg-slate-900/30' : ''}`}>
                <div className="col-span-6 md:col-span-8 font-bold text-slate-300">{item.feature}</div>
                <div className="col-span-3 md:col-span-2 text-center text-blue-400 font-black">{item.pingo === true ? <Check className="mx-auto" size={24} weight="bold" /> : item.pingo}</div>
                <div className="col-span-3 md:col-span-2 text-center text-slate-500 font-bold">{item.plano === false ? <X className="mx-auto" size={24} weight="bold" /> : item.plano}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section id="parceiros" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-6">Rede Credenciada</h2>
            <p className="text-slate-500 font-medium max-w-2xl mx-auto">Milhares de farmácias, laboratórios e clínicas em todo o Brasil com descontos exclusivos para membros.</p>
          </div>
          
          <div className="flex justify-center mb-12">
            <Tabs value={partnerCategory} onValueChange={setPartnerCategory} className="w-full max-w-2xl">
              <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto p-1 bg-slate-50 rounded-2xl">
                {partnerCategories.map(cat => (
                  <TabsTrigger key={cat} value={cat} className="rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider">
                    {categoryLabels[cat] || cat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredPartners.map(partner => (
              <div key={partner.id} className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col items-center text-center transition hover:bg-white hover:shadow-lg hover:border-blue-100 group">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-blue-600 mb-4 shadow-sm group-hover:scale-110 transition">
                  {categoryIcons[partner.category] || <Buildings size={24} />}
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">{partner.name}</h4>
                <div className="text-emerald-600 font-black text-xs uppercase tracking-tight">Até {partner.discount_percent}% OFF</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm relative">
                <Quotes size={48} weight="fill" className="text-blue-100 absolute top-6 right-8" />
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} size={16} weight="fill" className="text-amber-400" />)}
                </div>
                <p className="text-slate-700 font-medium italic mb-6 leading-relaxed">"{t.text}"</p>
                <div className="flex flex-col">
                  <span className="font-black text-slate-900">{t.name}</span>
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-black text-center mb-16">Dúvidas Frequentes</h2>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border rounded-2xl px-6 bg-slate-50/50 border-slate-100 overflow-hidden">
                <AccordionTrigger className="hover:no-underline py-6 font-bold text-left text-slate-900">{faq.q}</AccordionTrigger>
                <AccordionContent className="pb-6 text-slate-600 font-medium leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-[2.5rem] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-blue-500/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-32 -mb-32" />
            
            <h2 className="text-4xl md:text-6xl font-black mb-8 relative z-10">Sua saúde não pode esperar.</h2>
            <p className="text-xl md:text-2xl font-medium text-white/90 mb-12 max-w-2xl mx-auto relative z-10">
              Assine o Pingo Card agora e comece a usar no mesmo instante. Sem carência, sem burocracia.
            </p>
            <Button 
              size="lg" 
              className="h-16 px-12 rounded-2xl text-xl font-bold bg-white text-blue-600 hover:bg-slate-50 hover:scale-105 transition-all shadow-xl"
              onClick={() => document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" })}
            >
              Começar agora <ArrowRight className="w-6 h-6 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      <PingoSubscribeDialog 
        open={subscribeOpen} 
        onOpenChange={setSubscribeOpen} 
        plan={selectedPlan!} 
        billingCycle={billing} 
        onSubscribed={handleSubscribed} 
      />

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default PingoCard;
