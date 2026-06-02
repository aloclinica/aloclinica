import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Heart, Star, Shield, Check, X, ArrowRight, QrCode, Sparkle, MapPin, Storefront, Flask, Eyeglasses, Quotes, Lightning, Users, Clock, Buildings, ShieldCheck, CurrencyCircleDollar, CaretRight, ShieldStar, Umbrella, Gift } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Header from "@/components/landing/Header";
import SEOHead from "@/components/SEOHead";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import { PingoSubscribeDialog } from "@/components/patient/PingoSubscribeDialog";

const PINGO_ASSETS = {
  hero: "https://res.cloudinary.com/dvdyiyvpo/image/upload/v1780417543/ChatGPT_Image_2_de_jun._de_2026_13_17_09_1_vteboe.png",
  telemedicina: "https://res.cloudinary.com/dvdyiyvpo/image/upload/v1780417543/ChatGPT_Image_2_de_jun._de_2026_13_17_09_2_xlpk3y.png",
  seguro: "https://res.cloudinary.com/dvdyiyvpo/image/upload/v1780417543/ChatGPT_Image_2_de_jun._de_2026_13_17_09_3_khgobs.png",
  funeral: "https://res.cloudinary.com/dvdyiyvpo/image/upload/v1780417543/ChatGPT_Image_2_de_jun._de_2026_13_17_10_4_ud4fn8.png",
  sorteio: "https://res.cloudinary.com/dvdyiyvpo/image/upload/v1780417540/ChatGPT_Image_2_de_jun._de_2026_13_17_11_5_mhx48l.png",
  economia: "https://res.cloudinary.com/dvdyiyvpo/image/upload/v1780417540/ChatGPT_Image_2_de_jun._de_2026_13_17_12_6_b0579j.png",
  fases: "https://res.cloudinary.com/dvdyiyvpo/image/upload/v1780417540/ChatGPT_Image_2_de_jun._de_2026_13_17_13_7_tmjaau.png",
  acesso: "https://res.cloudinary.com/dvdyiyvpo/image/upload/v1780417539/ChatGPT_Image_2_de_jun._de_2026_13_17_14_8_jgy1vq.png",
  tudoEmUm: "https://res.cloudinary.com/dvdyiyvpo/image/upload/v1780417539/ChatGPT_Image_2_de_jun._de_2026_13_17_16_9_n9hcqp.png",
  cuidado: "https://res.cloudinary.com/dvdyiyvpo/image/upload/v1780417539/ChatGPT_Image_2_de_jun._de_2026_13_17_20_10_qrm1hi.png",
};

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
      {/* Azul Confiança · DM Serif Display + Fira Sans · editorial caloroso */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        .pingo-card-page {
          --pc-navy-900: hsl(var(--foreground));
          --pc-navy-800: hsl(var(--primary));
          --pc-navy-700: hsl(var(--primary) / 0.8);
          --pc-blue-500: hsl(var(--secondary));
          --pc-blue-100: hsl(var(--accent));
          --pc-gold: hsl(var(--warning));
          --pc-gold-soft: hsl(var(--warning) / 0.6);
          --pc-cream: hsl(var(--background));
          --pc-paper: hsl(var(--background));
          --pc-ink: hsl(var(--foreground));
          background: var(--pc-paper);
          color: var(--pc-ink);
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        }
        .pingo-card-page h1,.pingo-card-page h2,.pingo-card-page h3,.pingo-card-page .pc-display {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--pc-navy-900);
        }
        .pingo-card-page .pc-display em { font-style: italic; color: var(--pc-blue-500); }
        .pc-navy-bg { background: var(--pc-navy-800); }
        .pc-navy { color: var(--pc-navy-800); }
        .pc-blue { color: var(--pc-blue-500); }
        .pc-gold { color: var(--pc-gold); }
        .pc-gold-bg { background: var(--pc-gold); }
        .pc-cream-bg { background: var(--pc-cream); }
        .pc-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700;
          font-size: 11px; letter-spacing: .22em; text-transform: uppercase;
          color: var(--pc-navy-800);
          opacity: 0.6;
        }
        .pc-eyebrow::before { content: ""; width: 28px; height: 2px; background: currentColor; }
        .pc-card {
          border-radius: 1.5rem; background: hsl(var(--card));
          border: 1px solid hsl(var(--border) / 0.5);
          box-shadow: var(--shadow-card);
          transition: all .35s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .pc-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-elevated); border-color: hsl(var(--primary) / 0.3); }
        .pc-card-dark {
          border-radius: 1.5rem;
          background: var(--gradient-hero);
          color: white;
          border: none;
          box-shadow: 0 20px 40px -10px hsl(var(--primary) / 0.3);
        }
        .pc-rule { height: 1px; background: hsl(var(--border)); }
        .pc-grain { position: relative; }
        .pc-grain::after {
          content:""; position:absolute; inset:0; pointer-events:none; opacity:.03; border-radius: inherit;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
        .pc-serif-num { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; }
        /* membership card */
        .pc-member-card {
          position: relative; border-radius: 1.5rem; overflow: hidden;
          background: var(--gradient-hero);
          color: white; padding: 2rem;
          box-shadow: 0 30px 60px -12px hsl(var(--primary) / 0.4), inset 0 1px 1px hsl(0 0% 100% / 0.2);
          aspect-ratio: 1.586 / 1;
        }
        .pc-member-card::before {
          content:""; position:absolute; inset:0;
          background: radial-gradient(circle at top right, hsl(0 0% 100% / 0.1), transparent 70%);
        }
      `}</style>
      <SEOHead
        title="Pingo Card — Cartão de benefícios da AloClínica"
        description="Mais benefícios para o que mais importa: você. Descontos em consultas, exames e rede de parceiros a partir de R$19,90/mês."
        canonical="/pingo-card"
      />
      <Header />

      {/* ============ HERO ============ */}
      <section className="relative pt-24 md:pt-28 pb-16 md:pb-24 overflow-hidden">
        <div aria-hidden className="absolute inset-x-0 top-0 h-[520px] -z-10"
          style={{ background: "radial-gradient(80% 60% at 80% 0%, rgba(200,155,70,.10), transparent 60%), linear-gradient(180deg, var(--pc-cream) 0%, transparent 100%)" }} />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-12 gap-10 lg:gap-14 items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }}
              className="col-span-12 lg:col-span-7"
            >
              <span className="pc-eyebrow">Cartão de benefícios · AloClínica</span>
              <h1 className="mt-6 text-5xl md:text-6xl lg:text-7xl leading-[1.02]">
                Cuidar de quem você ama,
                <br />
                <em className="not-italic" style={{ color: "var(--pc-blue-500)" }}>com calma</em> e sem pesar no bolso.
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-relaxed" style={{ color: "rgba(10,19,46,.7)" }}>
                O <strong className="pc-navy">Pingo Card</strong> é o cartão de saúde da família brasileira: descontos reais em consultas, exames e parceiros, sem carência e sem fidelidade. A partir de <strong>R$ 19,90/mês</strong>.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button size="lg" className="font-semibold border-0 rounded-full px-7"
                  style={{ background: "var(--pc-navy-800)", color: "var(--pc-cream)" }}
                  onClick={() => document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" })}>
                  Ver planos <ArrowRight size={18} className="ml-2" weight="bold" />
                </Button>
                <Button size="lg" variant="ghost" className="rounded-full px-6 hover:bg-transparent group" style={{ color: "var(--pc-navy-800)" }}
                  onClick={() => document.getElementById("parceiros")?.scrollIntoView({ behavior: "smooth" })}>
                  Conhecer a rede credenciada
                  <CaretRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" weight="bold" />
                </Button>
              </div>
              <div className="mt-10 grid grid-cols-3 max-w-lg gap-6">
                {stats.slice(0,3).map((s, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="pc-display text-3xl md:text-4xl pc-navy">{s.value}</span>
                    <span className="text-xs mt-1 uppercase tracking-wider" style={{ color: "rgba(10,19,46,.55)" }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Membership card visual */}
            <motion.div
              initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .8, delay: .15 }}
              className="col-span-12 lg:col-span-5 relative"
            >
              <div className="relative max-w-md mx-auto">
                <div className="pc-member-card relative z-10 overflow-hidden">
                  {/* Decorative background image */}
                  <img 
                    src={PINGO_ASSETS.tudoEmUm} 
                    alt="" 
                    className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay pointer-events-none"
                  />
                  <div className="relative z-10 flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.24em] uppercase" style={{ color: "var(--pc-gold-soft)" }}>Membro · Família</p>
                      <p className="pc-display text-3xl mt-2" style={{ color: "var(--pc-cream)" }}>Pingo Card</p>
                    </div>
                    <QrCode size={36} weight="duotone" className="pc-gold" />
                  </div>
                  <div className="relative z-10 mt-auto pt-10">
                    <p className="text-[10px] uppercase tracking-[0.22em] opacity-60">Titular</p>
                    <p className="font-medium text-lg mt-1" style={{ color: "var(--pc-cream)" }}>Mariana Costa</p>
                    <div className="flex items-end justify-between mt-3">
                      <p className="text-xs opacity-60">Válido enquanto ativo</p>
                      <p className="pc-display text-xl pc-gold">até 60% off</p>
                    </div>
                  </div>
                </div>
                {/* paper card behind */}
                <div aria-hidden className="absolute -bottom-4 -right-4 w-full h-full rounded-[14px] -z-0"
                  style={{ background: "linear-gradient(135deg, #e8c882, #c89b46)", opacity: .35 }} />
              </div>
              <div className="mt-8 flex items-center gap-3 max-w-md mx-auto">
                <div className="flex -space-x-2">
                  {["M","R","J","A"].map((l,i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[11px] font-semibold"
                      style={{ background: i%2?"var(--pc-blue-500)":"var(--pc-navy-700)", color: "var(--pc-cream)" }}>{l}</div>
                  ))}
                </div>
                <p className="text-xs leading-snug" style={{ color: "rgba(10,19,46,.65)" }}>
                  <strong className="pc-navy">+15 mil famílias</strong> já cuidam da saúde com o Pingo Card.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl"><div className="pc-rule" /></div>

      {/* ============ BENEFÍCIOS ============ */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-12 gap-10 lg:gap-14">
            <div className="col-span-12 lg:col-span-4">
              <span className="pc-eyebrow">Por que escolher</span>
              <h2 className="pc-display text-4xl md:text-5xl mt-5 leading-[1.05]">
                Saúde sem <em>surpresas</em> no boleto.
              </h2>
              <p className="mt-5 text-base leading-relaxed" style={{ color: "rgba(10,19,46,.7)" }}>
                Quatro pilares simples que fazem do Pingo Card a forma mais acolhedora de cuidar da família — sem contratos longos, sem letras miúdas, com transparência do começo ao fim.
              </p>
              <div className="mt-8 relative h-48 rounded-2xl overflow-hidden border border-slate-200">
                <img src={PINGO_ASSETS.fases} alt="Benefícios para todas as fases" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="col-span-12 lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {benefits.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .08 }}
                  className="pc-card p-8"
                >
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center pc-navy"
                      style={{ background: "var(--pc-cream)", border: "1px solid rgba(200,155,70,.4)" }}>
                      {b.icon}
                    </div>
                    <span className="pc-serif-num text-3xl pc-gold">0{i+1}</span>
                  </div>
                  <h3 className="pc-display text-2xl">{b.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed" style={{ color: "rgba(10,19,46,.65)" }}>{b.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* ============ VANTAGENS EXCLUSIVAS ============ */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-16">
            <span className="pc-eyebrow justify-center">Proteção total</span>
            <h2 className="pc-display text-4xl md:text-5xl mt-4">Vantagens que vão além da saúde.</h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">Com o Pingo Card, você garante benefícios exclusivos pensados para a sua tranquilidade em todos os momentos.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Telemedicina 24h",
                desc: "Acolhimento médico por vídeo a qualquer hora, de onde estiver.",
                img: PINGO_ASSETS.telemedicina,
                icon: <Lightning size={24} weight="fill" className="text-blue-500" />
              },
              {
                title: "Seguro Acidente",
                desc: "Tranquilidade garantida para você e sua família em imprevistos.",
                img: PINGO_ASSETS.seguro,
                icon: <ShieldStar size={24} weight="fill" className="text-emerald-500" />
              },
              {
                title: "Assistência Funeral",
                desc: "Apoio humanizado e completo quando você mais precisar.",
                img: PINGO_ASSETS.funeral,
                icon: <Umbrella size={24} weight="fill" className="text-indigo-500" />
              },
              {
                title: "Sorteios Mensais",
                desc: "Concorra a R$ 40 mil reais todos os meses pelo Pingo Card.",
                img: PINGO_ASSETS.sorteio,
                icon: <Gift size={24} weight="fill" className="text-amber-500" />
              },
              {
                title: "Economia Real",
                desc: "Descontos expressivos em farmácias, laboratórios e óticas.",
                img: PINGO_ASSETS.economia,
                icon: <CurrencyCircleDollar size={24} weight="fill" className="text-green-600" />
              },
              {
                title: "Cuidado Completo",
                desc: "Proteção e vantagens exclusivas em um único cartão digital.",
                img: PINGO_ASSETS.cuidado,
                icon: <Heart size={24} weight="fill" className="text-red-500" />
              }
            ].map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500"
              >
                <div className="aspect-[16/9] overflow-hidden">
                  <img src={v.img} alt={v.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                      {v.icon}
                    </div>
                    <h3 className="pc-display text-2xl">{v.title}</h3>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{v.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ COMO FUNCIONA ============ */}
      <section className="py-20 md:py-24" style={{ background: "linear-gradient(180deg, transparent, var(--pc-cream))" }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="max-w-2xl mb-12">
            <span className="pc-eyebrow">Em três passos</span>
            <h2 className="pc-display text-4xl md:text-5xl mt-4">Comece a economizar hoje mesmo.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-x-12 gap-y-10 relative">
            <div aria-hidden className="hidden md:block absolute top-8 left-[16%] right-[16%] h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(200,155,70,.5), transparent)" }} />
            {[
              { n: 1, title: "Escolha seu plano", desc: "Essencial, Família ou Premium — você decide o que cabe no orçamento.", icon: <Heart size={22} weight="fill" /> },
              { n: 2, title: "Receba o cartão digital", desc: "QR Code no celular em segundos, pronto para apresentar.", icon: <QrCode size={22} weight="fill" /> },
              { n: 3, title: "Use e economize", desc: "Mostre em consultas, exames e parceiros — desconto na hora.", icon: <Sparkle size={22} weight="fill" /> },
            ].map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .1 }}
                className="relative text-center"
              >
                <div className="relative mx-auto w-16 h-16 rounded-full flex items-center justify-center pc-navy-bg" style={{ color: "var(--pc-gold-soft)" }}>
                  {step.icon}
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center pc-gold-bg" style={{ color: "var(--pc-navy-900)" }}>{step.n}</span>
                </div>
                <h3 className="pc-display text-2xl mt-6">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed max-w-xs mx-auto" style={{ color: "rgba(10,19,46,.65)" }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PLANOS ============ */}
      <section id="planos" className="py-20 md:py-28" style={{ background: "var(--pc-cream)" }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <span className="pc-eyebrow justify-center"><span className="hidden">·</span></span>
            <h2 className="pc-display text-4xl md:text-5xl mt-3">Escolha o plano que combina com a sua família.</h2>
            <p className="mt-4 text-base" style={{ color: "rgba(10,19,46,.65)" }}>Cancele quando quiser. Sem fidelidade, sem multa, sem letras miúdas.</p>
            <div className="mt-7 inline-block">
              <Tabs value={billing} onValueChange={(v) => setBilling(v as "monthly" | "yearly")}>
                <TabsList className="bg-white border rounded-full p-1" style={{ borderColor: "rgba(10,19,46,.1)" }}>
                  <TabsTrigger value="monthly" className="rounded-full px-5 data-[state=active]:bg-[var(--pc-navy-800)] data-[state=active]:text-white">Mensal</TabsTrigger>
                  <TabsTrigger value="yearly" className="rounded-full px-5 data-[state=active]:bg-[var(--pc-navy-800)] data-[state=active]:text-white">
                    Anual <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "var(--pc-gold)", color: "var(--pc-navy-900)" }}>-15%</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {plans.map((plan, i) => {
              const price = billing === "monthly" ? plan.price_monthly : plan.price_yearly / 12;
              const highlight = plan.is_highlighted;
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .1 }}
                  className={highlight ? "lg:-mt-6" : ""}
                >
                  <div className={`relative h-full p-8 flex flex-col ${highlight ? "pc-card-dark pc-grain" : "pc-card"}`}>
                    {highlight && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest pc-gold-bg" style={{ color: "var(--pc-navy-900)" }}>
                        MAIS POPULAR
                      </span>
                    )}
                    <h3 className="pc-display text-3xl" style={highlight ? { color: "var(--pc-cream)" } : {}}>{plan.name}</h3>
                    <p className={`text-sm mt-1 ${highlight ? "opacity-75" : ""}`} style={!highlight ? { color: "rgba(10,19,46,.6)" } : {}}>
                      {plan.tagline}
                    </p>

                    <div className="my-7">
                      <div className="flex items-baseline gap-1">
                        <span className="pc-display text-5xl" style={highlight ? { color: "var(--pc-cream)" } : {}}>{formatBRL(price)}</span>
                        <span className={`text-sm ${highlight ? "opacity-70" : ""}`} style={!highlight ? { color: "rgba(10,19,46,.6)" } : {}}>/mês</span>
                      </div>
                      {billing === "yearly" && (
                        <p className={`text-xs mt-1 ${highlight ? "pc-gold" : "pc-blue"}`}>
                          {formatBRL(plan.price_yearly)} cobrados anualmente
                        </p>
                      )}
                    </div>

                    <ul className="space-y-3 mb-7 flex-1">
                      {plan.benefits.map((b, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check size={18} weight="bold" className={highlight ? "pc-gold shrink-0 mt-0.5" : "pc-blue shrink-0 mt-0.5"} />
                          <span className={highlight ? "opacity-90" : ""}>{b}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      size="lg"
                      className={`w-full font-semibold border-0 rounded-full ${highlight ? "pc-gold-bg hover:opacity-90" : ""}`}
                      style={highlight
                        ? { color: "var(--pc-navy-900)" }
                        : { background: "var(--pc-navy-800)", color: "#fff" }}
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
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: .3 }}
            className="max-w-3xl mx-auto mt-12 pc-card p-6 md:p-7 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6"
          >
            <div className="w-12 h-12 rounded-full pc-cream-bg pc-navy flex items-center justify-center shrink-0 border" style={{ borderColor: "rgba(200,155,70,.4)" }}>
              <Clock size={22} weight="fill" />
            </div>
            <div className="flex-1">
              <h3 className="pc-display text-xl">Só preciso de uma consulta agora</h3>
              <p className="text-sm mt-1" style={{ color: "rgba(10,19,46,.65)" }}>
                Sem assinatura. Pague apenas pela consulta avulsa e seja atendido em poucos minutos.
              </p>
            </div>
            <Button size="lg" variant="outline" className="w-full md:w-auto rounded-full" style={{ borderColor: "var(--pc-navy-800)", color: "var(--pc-navy-800)" }}
              onClick={() => navigate("/agendar")}>
              Agendar consulta avulsa <ArrowRight size={16} className="ml-2" weight="bold" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ============ PARCEIROS ============ */}
      <section id="parceiros" className="py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div>
              <span className="pc-eyebrow">Rede credenciada</span>
              <h2 className="pc-display text-4xl md:text-5xl mt-4 max-w-xl">Descontos onde você <em>já costuma ir</em>.</h2>
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
                        ? { background: "var(--pc-navy-800)", color: "#fff", borderColor: "var(--pc-navy-800)" }
                        : { background: "#fff", color: "var(--pc-navy-800)", borderColor: "rgba(10,19,46,.15)" }}
                    >
                      {categoryLabels[cat] ?? cat}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-12 gap-5">
            {filteredPartners.map((p, i) => {
              const featured = p.is_featured || i === 0;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .05 }}
                  className={`pc-card p-6 ${featured ? "col-span-12 md:col-span-6" : "col-span-12 sm:col-span-6 md:col-span-3"}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-full pc-cream-bg pc-navy flex items-center justify-center border" style={{ borderColor: "rgba(200,155,70,.4)" }}>
                      {categoryIcons[p.category] ?? <Storefront size={20} weight="fill" />}
                    </div>
                    <span className="pc-display text-3xl pc-gold">-{p.discount_percent}%</span>
                  </div>
                  <h3 className="pc-display text-xl">{p.name}</h3>
                  <p className="text-sm mt-1 line-clamp-2" style={{ color: "rgba(10,19,46,.65)" }}>
                    {p.discount_description ?? p.description}
                  </p>
                  {p.city && (
                    <p className="text-xs mt-3 flex items-center gap-1" style={{ color: "rgba(10,19,46,.5)" }}>
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
      <section id="comparativo" className="py-20 md:py-28" style={{ background: "var(--pc-cream)" }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-12">
            <span className="pc-eyebrow justify-center"></span>
            <h2 className="pc-display text-4xl md:text-5xl mt-3">Por que o Pingo Card faz sentido.</h2>
            <p className="mt-3 text-base max-w-xl mx-auto" style={{ color: "rgba(10,19,46,.65)" }}>Uma comparação honesta com planos tradicionais — sem promessas exageradas.</p>
          </div>

          <div className="pc-card overflow-hidden">
            <div className="grid grid-cols-3 border-b" style={{ borderColor: "rgba(10,19,46,.08)" }}>
              <div className="p-5 text-sm font-semibold uppercase tracking-wider" style={{ color: "rgba(10,19,46,.55)" }}>Característica</div>
              <div className="p-5 text-center pc-display text-lg pc-navy-bg" style={{ color: "var(--pc-gold-soft)" }}>Pingo Card</div>
              <div className="p-5 text-center text-sm font-semibold uppercase tracking-wider" style={{ color: "rgba(10,19,46,.55)" }}>Plano tradicional</div>
            </div>
            {comparison.map((row, i) => (
              <div key={i} className="grid grid-cols-3 border-b last:border-b-0" style={{ borderColor: "rgba(10,19,46,.06)" }}>
                <div className="p-5 text-sm md:text-base">{row.feature}</div>
                <div className="p-5 text-center font-semibold flex items-center justify-center" style={{ background: "rgba(59,111,160,.06)", color: "var(--pc-navy-800)" }}>
                  {typeof row.pingo === "boolean"
                    ? (row.pingo ? <Check size={22} weight="bold" /> : <X size={22} weight="bold" />)
                    : row.pingo}
                </div>
                <div className="p-5 text-center flex items-center justify-center" style={{ color: "rgba(10,19,46,.55)" }}>
                  {typeof row.plano === "boolean"
                    ? (row.plano ? <Check size={22} weight="bold" /> : <X size={22} weight="bold" />)
                    : row.plano}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ DEPOIMENTOS ============ */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-12 gap-10 items-end mb-12">
            <div className="col-span-12 md:col-span-7">
              <span className="pc-eyebrow">Histórias reais</span>
              <h2 className="pc-display text-4xl md:text-5xl mt-4">Famílias que <em>cuidam melhor</em> com o Pingo Card.</h2>
            </div>
            <div className="col-span-12 md:col-span-5 flex md:justify-end items-center gap-3">
              <div className="w-24 h-16 rounded-lg overflow-hidden border border-slate-200">
                <img src={PINGO_ASSETS.acesso} alt="Uso simples" className="w-full h-full object-cover" />
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (<Star key={i} size={18} weight="fill" className="pc-gold" />))}
                <p className="ml-2 text-sm self-center" style={{ color: "rgba(10,19,46,.65)" }}>4.9 · +2 mil avaliações</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .1 }}
                className={`p-8 md:p-9 ${i === 1 ? "col-span-12 md:col-span-6 pc-card-dark pc-grain" : "col-span-12 md:col-span-3 pc-card"}`}
              >
                <Quotes size={32} weight="fill" className={i === 1 ? "pc-gold" : "pc-blue"} />
                <p className={`mt-5 leading-relaxed ${i === 1 ? "pc-display text-2xl md:text-3xl" : "text-base"}`} style={i !== 1 ? { color: "rgba(10,19,46,.8)" } : { color: "var(--pc-cream)" }}>
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3 mt-7 pt-5 border-t" style={{ borderColor: i === 1 ? "rgba(200,155,70,.25)" : "rgba(10,19,46,.08)" }}>
                  <div className="w-11 h-11 rounded-full flex items-center justify-center pc-display text-xl"
                    style={i === 1
                      ? { background: "var(--pc-gold)", color: "var(--pc-navy-900)" }
                      : { background: "var(--pc-navy-800)", color: "var(--pc-cream)" }}>
                    {t.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs opacity-70">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="py-20 md:py-28" style={{ background: "var(--pc-cream)" }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="grid grid-cols-12 gap-10">
            <div className="col-span-12 md:col-span-4">
              <span className="pc-eyebrow">Dúvidas frequentes</span>
              <h2 className="pc-display text-4xl md:text-5xl mt-4 leading-[1.05]">Tudo o que você precisa <em>saber</em>.</h2>
              <p className="mt-5 text-sm leading-relaxed" style={{ color: "rgba(10,19,46,.65)" }}>
                Não encontrou sua resposta? Fale com a gente pelo chat ou WhatsApp — atendimento humano de segunda a sábado.
              </p>
            </div>
            <div className="col-span-12 md:col-span-8">
              <Accordion type="single" collapsible className="space-y-2">
                {faqs.map((faq, i) => (
                  <AccordionItem
                    key={i}
                    value={`item-${i}`}
                    className="bg-white px-6 border rounded-md data-[state=open]:shadow-md"
                    style={{ borderColor: "rgba(10,19,46,.08)" }}
                  >
                    <AccordionTrigger className="text-left pc-display text-lg md:text-xl hover:no-underline py-5">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="leading-relaxed pb-5 text-base" style={{ color: "rgba(10,19,46,.7)" }}>
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={PINGO_ASSETS.hero} alt="" className="w-full h-full object-cover opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-white" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="pc-card-dark pc-grain relative overflow-hidden p-10 md:p-16 grid grid-cols-12 gap-8 items-center">
            <img src={PINGO_ASSETS.cuidado} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" />
            <div className="col-span-12 md:col-span-8 relative z-10">
              <span className="pc-eyebrow" style={{ color: "var(--pc-gold-soft)" }}>Sua saúde merece</span>
              <h2 className="pc-display text-4xl md:text-6xl mt-5 leading-[1.02]" style={{ color: "var(--pc-cream)" }}>
                Pronto para cuidar de você <em style={{ color: "var(--pc-gold-soft)" }}>pagando menos</em>?
              </h2>
              <p className="mt-5 text-lg max-w-xl" style={{ color: "rgba(247,241,230,.8)" }}>
                Junte-se a milhares de famílias que já economizam com o Pingo Card. Sem carência, sem fidelidade.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" className="pc-gold-bg hover:opacity-90 font-semibold border-0 rounded-full px-7 h-14" style={{ color: "var(--pc-navy-900)" }}
                  onClick={() => {
                    const target = plans.find(p => p.is_highlighted) ?? plans[0];
                    if (target) handleSubscribe(target);
                    else document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" });
                  }}>
                  Assinar agora <ArrowRight size={18} className="ml-2" weight="bold" />
                </Button>
                <Button size="lg" variant="ghost" className="rounded-full px-6 hover:bg-white/10 h-14" style={{ color: "var(--pc-cream)" }}
                  onClick={() => window.open("https://wa.me/5581900000000", "_blank")}>
                  Falar com especialista
                </Button>
              </div>
            </div>
            <div className="col-span-12 md:col-span-4 relative flex justify-center z-10">
              <div className="relative group">
                <div className="absolute inset-0 bg-gold/20 blur-3xl rounded-full scale-150 group-hover:scale-200 transition-transform duration-1000" />
                <img src={PINGO_ASSETS.acesso} alt="Pingo Card" className="w-56 md:w-full max-w-[280px] select-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative transition-transform duration-700 group-hover:translate-y-[-10px] group-hover:rotate-[-2deg]" draggable={false}/>
              </div>
            </div>
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
