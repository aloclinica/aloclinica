import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Heart, Star, Shield, Check, X, ArrowRight, QrCode, Sparkle, MapPin, Storefront, Flask, Eyeglasses, Quotes, Lightning, Users, Clock, Buildings, ShieldCheck, CurrencyCircleDollar, CaretRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Header from "@/components/landing/Header";
import SEOHead from "@/components/SEOHead";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import { PingoSubscribeDialog } from "@/components/patient/PingoSubscribeDialog";
import pingoCardHero from "@/assets/pingo-card-hero.png";
import pingoFamily from "@/assets/hero-pingo-family.png";
import pingoConfianca from "@/assets/pingo-confianca.png";
import pingoDepoimentos from "@/assets/pingo-depoimentos.png";

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

const PingoCard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
    // Plano Família/Premium → leva o titular para cadastrar dependentes
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
        db.from("pingo_card_partners").select("*").eq("is_active", true).order("display_order").limit(8),
      ]);
      setPlans((planData ?? []) as PingoPlan[]);
      setPartners((partnerData ?? []) as PingoPartner[]);
    };
    load();
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

  const faqs = [
    { q: "O Pingo Card é um plano de saúde?", a: "Não. O Pingo Card é um cartão de benefícios que oferece descontos em consultas, exames e parceiros — sem carência e sem coparticipação fixa." },
    { q: "Posso incluir minha família?", a: "Sim! Os planos Família e Premium incluem dependentes. Você pode adicionar até o limite definido em cada plano." },
    { q: "Tem fidelidade ou multa?", a: "Não. Você pode cancelar quando quiser, sem multa nem burocracia. É só acessar o painel e cancelar com um clique." },
    { q: "Como uso meu cartão?", a: "Após assinar, você recebe seu cartão digital com QR Code no app. Basta apresentar em consultas, exames e parceiros para garantir o desconto." },
    { q: "Quais são as formas de pagamento?", a: "Aceitamos PIX, cartão de crédito (Visa, Master, Elo) e débito recorrente. O plano anual tem 15% de desconto à vista." },
    { q: "Em quanto tempo o cartão fica ativo?", a: "Imediatamente! Após a confirmação do pagamento (PIX é instantâneo), seu cartão já está disponível para uso." },
  ];

  const benefits = [
    { icon: <CurrencyCircleDollar size={28} weight="fill" />, title: "Economia real", desc: "Até 60% off em consultas, exames e medicamentos." },
    { icon: <ShieldCheck size={28} weight="fill" />, title: "Sem carência", desc: "Use a partir do primeiro dia, sem burocracia." },
    { icon: <Star size={28} weight="fill" />, title: "Rede premium", desc: "Centenas de parceiros em todo o Brasil." },
    { icon: <Heart size={28} weight="fill" />, title: "Família junto", desc: "Inclua dependentes com poucos cliques." },
  ];

  return (
    <div className="pingo-card-page min-h-screen">
      {/* Esmeralda Saúde — escopo local */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Fira+Sans:wght@300;400;500;600;700&display=swap');
        .pingo-card-page {
          --pc-emerald-900: #04382a;
          --pc-emerald-800: #064e3b;
          --pc-emerald-600: #0d7a5f;
          --pc-emerald-500: #11926f;
          --pc-gold: #c9a84c;
          --pc-gold-soft: #e7cf85;
          --pc-cream: #f5f0e0;
          --pc-ink: #0b1f17;
          background: linear-gradient(180deg, #fbf8ee 0%, #ffffff 40%, #f3eee0 100%);
          color: var(--pc-ink);
          font-family: 'Fira Sans', system-ui, sans-serif;
        }
        .pingo-card-page h1, .pingo-card-page h2, .pingo-card-page h3, .pingo-card-page .pc-display {
          font-family: 'DM Serif Display', serif;
          font-weight: 400;
          letter-spacing: -0.01em;
        }
        .pc-emerald-bg { background: var(--pc-emerald-800); }
        .pc-emerald { color: var(--pc-emerald-800); }
        .pc-emerald-600 { color: var(--pc-emerald-600); }
        .pc-gold { color: var(--pc-gold); }
        .pc-gold-bg { background: var(--pc-gold); }
        .pc-cream-bg { background: var(--pc-cream); }
        .pc-tile {
          border-radius: 28px;
          background: #ffffff;
          border: 1px solid rgba(11,31,23,0.06);
          box-shadow: 0 1px 0 rgba(255,255,255,.6) inset, 0 12px 40px -24px rgba(6,78,59,.25);
          transition: transform .4s ease, box-shadow .4s ease;
        }
        .pc-tile:hover { transform: translateY(-4px); box-shadow: 0 24px 60px -28px rgba(6,78,59,.35); }
        .pc-tile-dark {
          border-radius: 28px;
          background: radial-gradient(120% 120% at 0% 0%, #0d7a5f 0%, #064e3b 55%, #04382a 100%);
          color: var(--pc-cream);
          border: 1px solid rgba(201,168,76,.25);
          box-shadow: 0 30px 80px -30px rgba(4,56,42,.55);
        }
        .pc-tile-gold {
          border-radius: 28px;
          background: linear-gradient(135deg, #f5e4a8 0%, #e7cf85 45%, #c9a84c 100%);
          color: var(--pc-emerald-900);
          border: 1px solid rgba(201,168,76,.5);
          box-shadow: 0 30px 80px -30px rgba(201,168,76,.55);
        }
        .pc-chip {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: 'Fira Sans', sans-serif;
          font-weight: 600; font-size: 11px; letter-spacing: .14em;
          text-transform: uppercase;
          padding: 6px 12px; border-radius: 999px;
          background: rgba(201,168,76,.18); color: #6b4f0d;
          border: 1px solid rgba(201,168,76,.4);
        }
        .pc-chip-dark { background: rgba(201,168,76,.18); color: var(--pc-gold-soft); border-color: rgba(201,168,76,.35); }
        .pc-divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(11,31,23,.12), transparent); }
        .pc-grain::after {
          content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .08;
          background-image: radial-gradient(rgba(255,255,255,.6) 1px, transparent 1px);
          background-size: 4px 4px; border-radius: inherit;
        }
      `}</style>
      <SEOHead
        title="Pingo Card — Cartão de benefícios da AloClínica"
        description="Mais benefícios para o que mais importa: você. Descontos em consultas, exames e rede de parceiros a partir de R$19,90/mês."
        canonical="/pingo-card"
      />
      <Header />

      {/* ============ HERO BENTO ============ */}
      <section className="pt-24 md:pt-28 pb-10 md:pb-14">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-12 gap-4 md:gap-5">
            {/* Headline tile */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}
              className="col-span-12 lg:col-span-8 pc-tile-dark pc-grain relative overflow-hidden p-8 md:p-12"
            >
              <span className="pc-chip pc-chip-dark"><Sparkle size={12} weight="fill" /> Cartão de benefícios</span>
              <h1 className="mt-5 text-5xl md:text-6xl lg:text-7xl leading-[1] tracking-tight">
                Cuide de quem você ama,
                <span className="block" style={{ color: "var(--pc-gold-soft)" }}>pagando menos.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base md:text-lg leading-relaxed" style={{ color: "rgba(245,240,224,.85)" }}>
                O <strong className="pc-gold">Pingo Card</strong> dá descontos reais em consultas, exames e parceiros — sem carência, sem fidelidade. A partir de <strong>R$ 19,90/mês</strong>.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" className="pc-gold-bg hover:opacity-90 font-semibold border-0" style={{ color: "var(--pc-emerald-900)" }}
                  onClick={() => document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" })}>
                  Ver planos <ArrowRight size={18} className="ml-2" weight="bold" />
                </Button>
                <Button size="lg" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10"
                  onClick={() => document.getElementById("parceiros")?.scrollIntoView({ behavior: "smooth" })}>
                  Rede credenciada
                </Button>
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm" style={{ color: "rgba(245,240,224,.8)" }}>
                <span className="flex items-center gap-1.5"><Check size={16} weight="bold" className="pc-gold" /> Sem carência</span>
                <span className="flex items-center gap-1.5"><Check size={16} weight="bold" className="pc-gold" /> Sem fidelidade</span>
                <span className="flex items-center gap-1.5"><Check size={16} weight="bold" className="pc-gold" /> Cancela quando quiser</span>
              </div>
              {/* decorative orbs */}
              <div className="pointer-events-none absolute -right-16 -bottom-20 w-72 h-72 rounded-full" style={{ background: "radial-gradient(closest-side, rgba(201,168,76,.35), transparent)" }} />
              <div className="pointer-events-none absolute right-10 top-10 w-24 h-24 rounded-full border" style={{ borderColor: "rgba(201,168,76,.3)" }} />
            </motion.div>

            {/* Card mock tile */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, delay: .1 }}
              className="col-span-12 lg:col-span-4 pc-tile-gold relative overflow-hidden p-7 flex flex-col justify-between min-h-[260px]"
            >
              <div>
                <p className="text-[11px] font-semibold tracking-[0.18em] uppercase opacity-70">Pingo · Saúde</p>
                <p className="pc-display text-3xl mt-1">Pingo Card</p>
              </div>
              <img src={pingoCardHero} alt="" aria-hidden="true"
                className="absolute -right-6 -bottom-4 w-48 h-48 object-contain opacity-90 select-none" />
              <div className="relative z-10">
                <p className="text-[11px] uppercase tracking-widest opacity-60">Benefício membro</p>
                <p className="pc-display text-3xl leading-none mt-1">Até 60% off</p>
                <p className="text-xs mt-1 opacity-70">em mais de 800 parceiros</p>
              </div>
            </motion.div>

            {/* Stat tiles */}
            {stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2 + i * .06 }}
                className="col-span-6 md:col-span-3 pc-tile p-5 md:p-6 flex items-center gap-3"
              >
                <div className="w-11 h-11 rounded-2xl pc-emerald-bg flex items-center justify-center shrink-0" style={{ color: "var(--pc-gold-soft)" }}>
                  {s.icon}
                </div>
                <div>
                  <div className="pc-display text-2xl leading-none pc-emerald">{s.value}</div>
                  <div className="text-xs mt-1" style={{ color: "rgba(11,31,23,.6)" }}>{s.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ BENEFITS BENTO ============ */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-12 gap-4 md:gap-5">
            <div className="col-span-12 lg:col-span-4 flex flex-col justify-center">
              <span className="pc-chip self-start"><Heart size={12} weight="fill" /> Por que escolher</span>
              <h2 className="pc-display text-4xl md:text-5xl mt-4 leading-[1.05]">
                Saúde sem <em className="not-italic pc-emerald-600">surpresas</em> no boleto.
              </h2>
              <p className="mt-4 text-base leading-relaxed" style={{ color: "rgba(11,31,23,.7)" }}>
                Quatro pilares que tornam o Pingo Card a forma mais simples de ter um cuidado contínuo — sem contratos longos, sem letras miúdas.
              </p>
            </div>
            <div className="col-span-12 lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
              {benefits.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .08 }}
                  className="pc-tile p-7"
                >
                  <div className="w-12 h-12 rounded-2xl pc-cream-bg pc-emerald flex items-center justify-center mb-4 border" style={{ borderColor: "rgba(201,168,76,.35)" }}>
                    {b.icon}
                  </div>
                  <h3 className="pc-display text-2xl">{b.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(11,31,23,.65)" }}>{b.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ COMO FUNCIONA ============ */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-10">
            <span className="pc-chip"><QrCode size={12} weight="fill" /> Em 3 passos</span>
            <h2 className="pc-display text-4xl md:text-5xl mt-4">Comece a economizar hoje</h2>
          </div>
          <div className="grid grid-cols-12 gap-4 md:gap-5">
            {[
              { n: 1, title: "Escolha seu plano", desc: "Essencial, Família ou Premium — você decide.", icon: <Heart size={28} weight="fill" /> },
              { n: 2, title: "Receba o cartão digital", desc: "QR Code direto no celular, sem espera.", icon: <QrCode size={28} weight="fill" /> },
              { n: 3, title: "Use e economize", desc: "Apresente em consultas, exames e parceiros.", icon: <Sparkle size={28} weight="fill" /> },
            ].map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .1 }}
                className={`col-span-12 md:col-span-4 pc-tile p-8 ${i === 1 ? "md:translate-y-4" : ""}`}
              >
                <div className="flex items-center gap-3 mb-5">
                  <span className="pc-display text-5xl pc-gold">0{step.n}</span>
                  <div className="w-11 h-11 rounded-2xl pc-emerald-bg flex items-center justify-center" style={{ color: "var(--pc-gold-soft)" }}>
                    {step.icon}
                  </div>
                </div>
                <h3 className="pc-display text-2xl">{step.title}</h3>
                <p className="mt-2 text-sm" style={{ color: "rgba(11,31,23,.65)" }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PLANOS ============ */}
      <section id="planos" className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-10">
            <span className="pc-chip"><CurrencyCircleDollar size={12} weight="fill" /> Planos</span>
            <h2 className="pc-display text-4xl md:text-5xl mt-4">Escolha o que combina com você</h2>
            <p className="mt-3 text-base" style={{ color: "rgba(11,31,23,.65)" }}>Cancele quando quiser. Sem fidelidade.</p>
            <div className="mt-6 inline-block">
              <Tabs value={billing} onValueChange={(v) => setBilling(v as "monthly" | "yearly")}>
                <TabsList className="bg-white border" style={{ borderColor: "rgba(11,31,23,.1)" }}>
                  <TabsTrigger value="monthly" className="data-[state=active]:bg-[var(--pc-emerald-800)] data-[state=active]:text-white">Mensal</TabsTrigger>
                  <TabsTrigger value="yearly" className="data-[state=active]:bg-[var(--pc-emerald-800)] data-[state=active]:text-white">
                    Anual <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: "var(--pc-gold)", color: "var(--pc-emerald-900)" }}>-15%</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {plans.map((plan, i) => {
              const price = billing === "monthly" ? plan.price_monthly : plan.price_yearly / 12;
              const highlight = plan.is_highlighted;
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .1 }}
                  className={highlight ? "lg:-mt-4" : ""}
                >
                  <div className={`relative h-full p-8 ${highlight ? "pc-tile-dark" : "pc-tile"}`}>
                    {highlight && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest pc-gold-bg" style={{ color: "var(--pc-emerald-900)" }}>
                        MAIS POPULAR
                      </span>
                    )}
                    <h3 className="pc-display text-3xl">{plan.name}</h3>
                    <p className={`text-sm mt-1 ${highlight ? "opacity-70" : ""}`} style={!highlight ? { color: "rgba(11,31,23,.6)" } : {}}>
                      {plan.tagline}
                    </p>

                    <div className="my-6">
                      <div className="flex items-baseline gap-1">
                        <span className="pc-display text-5xl">{formatBRL(price)}</span>
                        <span className={`text-sm ${highlight ? "opacity-70" : ""}`} style={!highlight ? { color: "rgba(11,31,23,.6)" } : {}}>/mês</span>
                      </div>
                      {billing === "yearly" && (
                        <p className={`text-xs mt-1 ${highlight ? "pc-gold" : "pc-emerald-600"}`}>
                          {formatBRL(plan.price_yearly)} cobrados anualmente
                        </p>
                      )}
                    </div>

                    <ul className="space-y-3 mb-7">
                      {plan.benefits.map((b, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check size={18} weight="bold" className={highlight ? "pc-gold shrink-0 mt-0.5" : "pc-emerald-600 shrink-0 mt-0.5"} />
                          <span className={highlight ? "opacity-90" : ""}>{b}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      size="lg"
                      className={`w-full font-semibold border-0 ${highlight ? "pc-gold-bg hover:opacity-90" : ""}`}
                      style={highlight
                        ? { color: "var(--pc-emerald-900)" }
                        : { background: "var(--pc-emerald-800)", color: "#fff" }}
                      onClick={() => handleSubscribe(plan)}
                    >
                      Assinar agora <ArrowRight size={16} className="ml-2" weight="bold" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Consulta avulsa */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .3 }}
            className="max-w-3xl mx-auto mt-10 pc-tile p-6 md:p-7 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6"
          >
            <div className="w-12 h-12 rounded-2xl pc-cream-bg pc-emerald flex items-center justify-center shrink-0 border" style={{ borderColor: "rgba(201,168,76,.35)" }}>
              <Clock size={22} weight="fill" />
            </div>
            <div className="flex-1">
              <h3 className="pc-display text-xl">Só preciso de uma consulta agora</h3>
              <p className="text-sm mt-1" style={{ color: "rgba(11,31,23,.65)" }}>
                Sem assinatura. Pague apenas pela consulta avulsa e seja atendido em minutos.
              </p>
            </div>
            <Button size="lg" variant="outline" className="w-full md:w-auto" style={{ borderColor: "var(--pc-emerald-800)", color: "var(--pc-emerald-800)" }}
              onClick={() => navigate("/agendar")}>
              Agendar consulta avulsa <ArrowRight size={16} className="ml-2" weight="bold" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ============ PARCEIROS BENTO ============ */}
      <section id="parceiros" className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <span className="pc-chip"><Storefront size={12} weight="fill" /> Rede credenciada</span>
              <h2 className="pc-display text-4xl md:text-5xl mt-3">Descontos onde você precisa</h2>
            </div>
            {partnerCategories.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {partnerCategories.map((cat) => {
                  const active = partnerCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setPartnerCategory(cat)}
                      className="px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all border"
                      style={active
                        ? { background: "var(--pc-emerald-800)", color: "#fff", borderColor: "var(--pc-emerald-800)" }
                        : { background: "#fff", color: "var(--pc-emerald-800)", borderColor: "rgba(11,31,23,.15)" }}
                    >
                      {categoryLabels[cat] ?? cat}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-12 gap-4 md:gap-5">
            {filteredPartners.map((p, i) => {
              const featured = p.is_featured || i === 0;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .05 }}
                  className={`pc-tile p-6 ${featured ? "col-span-12 md:col-span-6" : "col-span-12 sm:col-span-6 md:col-span-3"}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-2xl pc-cream-bg pc-emerald flex items-center justify-center border" style={{ borderColor: "rgba(201,168,76,.35)" }}>
                      {categoryIcons[p.category] ?? <Storefront size={20} weight="fill" />}
                    </div>
                    <span className="pc-display text-2xl pc-gold">-{p.discount_percent}%</span>
                  </div>
                  <h3 className="pc-display text-xl">{p.name}</h3>
                  <p className="text-sm mt-1 line-clamp-2" style={{ color: "rgba(11,31,23,.65)" }}>
                    {p.discount_description ?? p.description}
                  </p>
                  {p.city && (
                    <p className="text-xs mt-3 flex items-center gap-1" style={{ color: "rgba(11,31,23,.5)" }}>
                      <MapPin size={12} weight="fill" /> {p.city}, {p.state}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ COMPARATIVO ============ */}
      <section id="comparativo" className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-10">
            <span className="pc-chip"><Lightning size={12} weight="fill" /> Comparativo</span>
            <h2 className="pc-display text-4xl md:text-5xl mt-4">Por que o Pingo Card faz sentido</h2>
          </div>

          <div className="pc-tile overflow-hidden">
            <div className="grid grid-cols-3 border-b" style={{ borderColor: "rgba(11,31,23,.08)" }}>
              <div className="p-5 text-sm font-semibold uppercase tracking-wider" style={{ color: "rgba(11,31,23,.55)" }}>Característica</div>
              <div className="p-5 text-center pc-display text-lg pc-emerald-bg" style={{ color: "var(--pc-gold-soft)" }}>Pingo Card</div>
              <div className="p-5 text-center text-sm font-semibold uppercase tracking-wider" style={{ color: "rgba(11,31,23,.55)" }}>Plano tradicional</div>
            </div>
            {comparison.map((row, i) => (
              <div key={i} className="grid grid-cols-3 border-b last:border-b-0" style={{ borderColor: "rgba(11,31,23,.06)" }}>
                <div className="p-5 text-sm md:text-base">{row.feature}</div>
                <div className="p-5 text-center font-semibold flex items-center justify-center" style={{ background: "rgba(13,122,95,.06)", color: "var(--pc-emerald-800)" }}>
                  {typeof row.pingo === "boolean"
                    ? (row.pingo ? <Check size={22} weight="bold" /> : <X size={22} weight="bold" />)
                    : row.pingo}
                </div>
                <div className="p-5 text-center flex items-center justify-center" style={{ color: "rgba(11,31,23,.55)" }}>
                  {typeof row.plano === "boolean"
                    ? (row.plano ? <Check size={22} weight="bold" /> : <X size={22} weight="bold" />)
                    : row.plano}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ DEPOIMENTOS BENTO ============ */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-10">
            <span className="pc-chip"><Star size={12} weight="fill" /> Histórias reais</span>
            <h2 className="pc-display text-4xl md:text-5xl mt-4">Quem usa, recomenda</h2>
          </div>

          <div className="grid grid-cols-12 gap-4 md:gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .1 }}
                className={`p-7 md:p-8 ${i === 1 ? "col-span-12 md:col-span-6 pc-tile-dark" : "col-span-12 md:col-span-3 pc-tile"}`}
              >
                <Quotes size={28} weight="fill" className={i === 1 ? "pc-gold" : "pc-emerald-600"} />
                <p className={`mt-4 leading-relaxed ${i === 1 ? "text-lg md:text-xl" : "text-sm"}`} style={i !== 1 ? { color: "rgba(11,31,23,.8)" } : {}}>
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3 mt-6 pt-5 border-t" style={{ borderColor: i === 1 ? "rgba(201,168,76,.25)" : "rgba(11,31,23,.08)" }}>
                  <div className="w-11 h-11 rounded-full flex items-center justify-center pc-display text-xl"
                    style={i === 1
                      ? { background: "var(--pc-gold)", color: "var(--pc-emerald-900)" }
                      : { background: "var(--pc-emerald-800)", color: "var(--pc-cream)" }}>
                    {t.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs opacity-70">{t.role}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, idx) => (
                      <Star key={idx} size={13} weight="fill" className="pc-gold" />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <div className="text-center mb-10">
            <span className="pc-chip"><Shield size={12} weight="fill" /> Dúvidas frequentes</span>
            <h2 className="pc-display text-4xl md:text-5xl mt-4">Tudo o que você precisa saber</h2>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="pc-tile px-5 border-0 data-[state=open]:shadow-lg"
              >
                <AccordionTrigger className="text-left pc-display text-lg hover:no-underline py-5">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="leading-relaxed pb-5" style={{ color: "rgba(11,31,23,.7)" }}>
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="pc-tile-dark pc-grain relative overflow-hidden p-10 md:p-16 text-center">
            <div className="pointer-events-none absolute -left-20 -top-20 w-72 h-72 rounded-full" style={{ background: "radial-gradient(closest-side, rgba(201,168,76,.3), transparent)" }} />
            <div className="pointer-events-none absolute -right-20 -bottom-20 w-72 h-72 rounded-full" style={{ background: "radial-gradient(closest-side, rgba(17,146,111,.4), transparent)" }} />
            <span className="pc-chip pc-chip-dark mx-auto"><Heart size={12} weight="fill" /> Sua saúde merece</span>
            <h2 className="pc-display text-4xl md:text-6xl mt-5 leading-[1.05] relative">
              Pronto para cuidar de você
              <span className="block" style={{ color: "var(--pc-gold-soft)" }}>pagando menos?</span>
            </h2>
            <p className="mt-5 text-lg max-w-2xl mx-auto relative" style={{ color: "rgba(245,240,224,.8)" }}>
              Junte-se a milhares de famílias que já economizam com o Pingo Card.
            </p>
            <Button size="lg" className="mt-8 pc-gold-bg hover:opacity-90 font-semibold border-0 relative" style={{ color: "var(--pc-emerald-900)" }}
              onClick={() => {
                const target = plans.find(p => p.is_highlighted) ?? plans[0];
                if (target) handleSubscribe(target);
                else document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" });
              }}>
              Começar agora <ArrowRight size={18} className="ml-2" weight="bold" />
            </Button>
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>

      <PingoSubscribeDialog
        open={subscribeOpen}
        onOpenChange={setSubscribeOpen}
        plan={selectedPlan}
        billingCycle={billing}
        onSubscribed={handleSubscribed}
      />
    </div>
  );
};

export default PingoCard;
