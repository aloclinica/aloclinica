import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Heart, User, Star, Shield, Check, ArrowRight, QrCode, Sparkle, MapPin, Storefront, Flask, Eyeglasses, Quotes, Calculator, Question, CaretDown } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Header from "@/components/landing/Header";
import SEOHead from "@/components/SEOHead";
import { db } from "@/integrations/supabase/untyped";
import pingoCardHero from "@/assets/pingo-card-hero.png";

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
  const [plans, setPlans] = useState<PingoPlan[]>([]);
  const [partners, setPartners] = useState<PingoPartner[]>([]);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [consultations, setConsultations] = useState<number>(2);
  const [exams, setExams] = useState<number>(1);

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

  // Calculadora — economia estimada baseada no plano destacado (ou primeiro)
  const featuredPlan = useMemo(
    () => plans.find(p => p.is_highlighted) ?? plans[0],
    [plans]
  );

  const savings = useMemo(() => {
    const consultPrice = 120;
    const examPrice = 80;
    const consultDisc = featuredPlan?.consultation_discount_percent ?? 30;
    const examDisc = featuredPlan?.exam_discount_percent ?? 40;
    const monthlySaving =
      consultations * consultPrice * (consultDisc / 100) +
      exams * examPrice * (examDisc / 100);
    const yearlyNet = monthlySaving * 12 - (featuredPlan?.price_monthly ?? 19.9) * 12;
    return { monthly: monthlySaving, yearly: yearlyNet };
  }, [consultations, exams, featuredPlan]);

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
    { icon: <Heart size={28} weight="fill" />, title: "Mais saúde para você", desc: "Descontos reais em consultas, exames e medicamentos." },
    { icon: <User size={28} weight="fill" />, title: "Atendimento humanizado", desc: "Equipe dedicada para cuidar de você e da sua família." },
    { icon: <Star size={28} weight="fill" />, title: "Vantagens exclusivas", desc: "Benefícios em uma rede crescente de parceiros premium." },
    { icon: <Shield size={28} weight="fill" />, title: "Rede de parceiros", desc: "Farmácias, laboratórios, óticas e academias parceiras." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Pingo Card — Cartão de benefícios da AloClínica"
        description="Mais benefícios para o que mais importa: você. Descontos em consultas, exames e rede de parceiros a partir de R$19,90/mês."
        canonical="/pingo-card"
      />
      <Header />

      {/* HERO */}
      <section
        className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24 bg-primary"
        style={{
          backgroundImage: `url(${pingoCardHero})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Overlay para legibilidade do texto */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/30" />
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-primary-foreground"
            >
              <Badge className="mb-6 bg-amber-400 text-amber-950 hover:bg-amber-400 border-0">
                <Heart size={14} weight="fill" className="mr-1" /> CARTÃO BENEFÍCIOS
              </Badge>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[0.95] tracking-tight mb-6">
                Pingo<span className="block text-amber-300">Card</span>
              </h1>
              <p className="text-xl md:text-2xl font-medium mb-8 opacity-95 max-w-xl">
                Mais benefícios para o que mais importa: <span className="text-amber-300 font-bold">você</span>.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="bg-amber-400 text-amber-950 hover:bg-amber-300 font-semibold" onClick={() => document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" })}>
                  Ver planos <ArrowRight size={18} className="ml-2" weight="bold" />
                </Button>
                <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20" onClick={() => document.getElementById("parceiros")?.scrollIntoView({ behavior: "smooth" })}>
                  Rede de parceiros
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12">
                {benefits.map((b, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="text-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur flex items-center justify-center mx-auto mb-2 text-amber-300">
                      {b.icon}
                    </div>
                    <p className="text-xs uppercase tracking-wide font-semibold opacity-90">{b.title}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="hidden lg:block"
              aria-hidden="true"
            />
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Como funciona o Pingo Card</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Em 3 passos você começa a economizar com sua saúde e da sua família.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: 1, title: "Escolha seu plano", desc: "Essencial, Família ou Premium — escolha o que melhor se encaixa.", icon: <Heart size={32} weight="fill" /> },
              { n: 2, title: "Receba seu cartão digital", desc: "Cartão virtual + QR Code no seu celular, pronto para usar.", icon: <QrCode size={32} weight="fill" /> },
              { n: 3, title: "Use e economize", desc: "Apresente o QR em consultas, exames e parceiros. Pronto!", icon: <Sparkle size={32} weight="fill" /> },
            ].map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full border-2 hover:border-primary/50 transition-all hover:shadow-xl">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                      {step.icon}
                    </div>
                    <div className="text-sm font-bold text-primary mb-2">PASSO {step.n}</div>
                    <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Escolha o plano ideal</h2>
            <p className="text-muted-foreground text-lg mb-8">Cancele quando quiser. Sem fidelidade.</p>

            <Tabs value={billing} onValueChange={(v) => setBilling(v as "monthly" | "yearly")} className="inline-block">
              <TabsList>
                <TabsTrigger value="monthly">Mensal</TabsTrigger>
                <TabsTrigger value="yearly">
                  Anual <Badge className="ml-2 bg-emerald-500 text-white">-15%</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => {
              const price = billing === "monthly" ? plan.price_monthly : plan.price_yearly / 12;
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={plan.is_highlighted ? "lg:-mt-4" : ""}
                >
                  <Card className={`h-full relative ${plan.is_highlighted ? "border-2 border-primary shadow-2xl" : "border-2"}`}>
                    {plan.is_highlighted && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                        MAIS POPULAR
                      </Badge>
                    )}
                    <CardContent className="p-8">
                      <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground mb-6">{plan.tagline}</p>

                      <div className="mb-6">
                        <span className="text-5xl font-extrabold">{formatBRL(price)}</span>
                        <span className="text-muted-foreground">/mês</span>
                        {billing === "yearly" && (
                          <p className="text-sm text-emerald-600 font-medium mt-1">
                            {formatBRL(plan.price_yearly)} cobrados anualmente
                          </p>
                        )}
                      </div>

                      <ul className="space-y-3 mb-8">
                        {plan.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <Check size={18} weight="bold" className="text-primary shrink-0 mt-0.5" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        size="lg"
                        className="w-full"
                        variant={plan.is_highlighted ? "default" : "outline"}
                        onClick={() => navigate(`/paciente?next=/dashboard/patient/pingo-card`)}
                      >
                        Assinar agora
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PARCEIROS */}
      <section id="parceiros" className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Rede de parceiros</h2>
            <p className="text-muted-foreground text-lg">
              Descontos em farmácias, laboratórios, óticas e muito mais.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {partners.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        {categoryIcons[p.category] ?? <Storefront size={20} weight="fill" />}
                      </div>
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-0">
                        -{p.discount_percent}%
                      </Badge>
                    </div>
                    <h3 className="font-bold mb-1">{p.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {p.discount_description ?? p.description}
                    </p>
                    {p.city && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin size={12} weight="fill" /> {p.city}, {p.state}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Quem usa, ama 💛</h2>
            <p className="text-muted-foreground text-lg">Histórias reais de quem já cuida da saúde com o Pingo Card.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full border-2 hover:border-primary/40 hover:shadow-xl transition-all">
                  <CardContent className="p-6 md:p-7">
                    <Quotes size={32} weight="fill" className="text-primary/30 mb-3" />
                    <p className="text-sm md:text-base text-foreground/85 leading-relaxed mb-5">
                      "{t.text}"
                    </p>
                    <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center font-bold">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                      <div className="ml-auto flex gap-0.5">
                        {Array.from({ length: t.rating }).map((_, idx) => (
                          <Star key={idx} size={14} weight="fill" className="text-amber-400" />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <Badge className="mb-3 bg-violet-100 text-violet-700 hover:bg-violet-100 border-0">
              <Question size={14} weight="fill" className="mr-1" /> DÚVIDAS FREQUENTES
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Perguntas frequentes</h2>
            <p className="text-muted-foreground text-lg">Tudo o que você precisa saber sobre o Pingo Card.</p>
          </motion.div>

          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <AccordionItem
                  value={`item-${i}`}
                  className="border-2 rounded-2xl px-5 bg-card data-[state=open]:border-primary/40 data-[state=open]:shadow-md transition-all"
                >
                  <AccordionTrigger className="text-left font-semibold hover:no-underline py-4">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Pronto para economizar com sua saúde?
            </h2>
            <p className="text-lg md:text-xl opacity-90 mb-8">
              Junte-se a milhares de famílias que já cuidam mais por menos com o Pingo Card.
            </p>
            <Button size="lg" className="bg-amber-400 text-amber-950 hover:bg-amber-300 font-semibold" onClick={() => navigate("/paciente?next=/dashboard/patient/pingo-card")}>
              Começar agora <ArrowRight size={18} className="ml-2" weight="bold" />
            </Button>
          </motion.div>
        </div>
      </section>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default PingoCard;
