import { forwardRef, lazy } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Users, Building, ChartLineUp, ShieldCheck } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/landing/Header";
import SEOHead from "@/components/SEOHead";

const Footer = lazy(() => import("@/components/landing/Footer"));

const corporatePlans = [
  {
    id: "pme",
    icon: Building,
    name: "Pequena Empresa",
    description: "Para empresas com até 50 colaboradores.",
    price: "A partir de",
    amount: "R$12",
    period: "por colaborador/mês",
    cta: "Solicitar orçamento",
    features: [
      "Consultas médicas online ilimitadas",
      "Plantão 24h para emergências",
      "Suporte dedicado por WhatsApp",
      "Portal de gestão de saúde",
      "Relatórios de saúde da empresa",
      "Integração com eSocial",
      "Análise de afastamentos",
    ],
  },
  {
    id: "media",
    icon: ChartLineUp,
    badge: "Recomendado",
    name: "Média Empresa",
    description: "Para empresas com 51 a 500 colaboradores.",
    price: "A partir de",
    amount: "R$10",
    period: "por colaborador/mês",
    cta: "Agendar demo",
    variant: "default" as const,
    features: [
      "Todas as funcionalidades PME",
      "Gestor de benefícios dedicado",
      "Campanhas de saúde personalizadas",
      "Inteligência de dados e IA",
      "Relatórios customizados",
      "Suporte telefônico 24/7",
      "Integração com folha de pagamento",
      "Análise ROI em saúde corporativa",
    ],
  },
  {
    id: "grande",
    icon: Users,
    name: "Grande Empresa",
    description: "Para empresas com mais de 500 colaboradores.",
    price: "Sob",
    amount: "Orçamento",
    period: "customizado",
    cta: "Falar com especialista",
    features: [
      "Todas as funcionalidades Média",
      "Gestor executivo dedicado",
      "Programas de saúde mental",
      "Wellness corporativo customizado",
      "Telemedicina preventiva",
      "Dados em tempo real",
      "SLA garantido 99.9%",
      "Compliance com legislação vigente",
    ],
  },
];

const benefits = [
  {
    icon: ShieldCheck,
    title: "Reduz custos",
    desc: "Diminui ausências, afastamentos e gastos com saúde.",
  },
  {
    icon: ChartLineUp,
    title: "Aumenta produtividade",
    desc: "Equipe mais saudável = equipe mais produtiva.",
  },
  {
    icon: Users,
    title: "Melhora retenção",
    desc: "Benefício valorizado pelos colaboradores.",
  },
  {
    icon: Building,
    title: "Suporte total",
    desc: "Gestor dedicado e suporte prioritário 24/7.",
  },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const CartaoB2B = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();

  return (
    <div ref={ref} className="relative min-h-screen bg-background">
      <div className="absolute inset-0 -z-10 bg-[image:var(--landing-bg)] pointer-events-none" />

      <SEOHead
        title="Cartão B2B - Benefício Corporativo | AloClínica"
        description="Solução de telemedicina para empresas. Planos de saúde corporativa com suporte dedicado. Consulte-nos para orçamento."
        canonical="https://aloclinica.com.br/cartao-b2b"
      />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="text-center mb-16"
          >
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
              Saúde Corporativa
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight tracking-tight mb-4">
              Saúde corporativa <span className="text-primary">que faz diferença</span>
            </h1>
            <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
              Plataforma completa de telemedicina e benefícios de saúde para sua empresa. Cuide de seus colaboradores, reduza custos.
            </p>
          </motion.div>

          {/* Benefits Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20"
          >
            {benefits.map((benefit) => (
              <motion.div
                key={benefit.title}
                variants={cardVariants}
                className="p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <benefit.icon className="w-5 h-5 text-primary" weight="fill" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Plans Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
          >
            {corporatePlans.map((plan) => {
              const isRecommended = plan.id === "media";
              return (
                <motion.div
                  key={plan.id}
                  variants={cardVariants}
                  className={`relative rounded-2xl border flex flex-col overflow-hidden transition-all ${
                    isRecommended
                      ? "border-primary shadow-2xl shadow-primary/15 bg-gradient-to-b from-primary/5 to-background scale-[1.02] md:scale-105 z-10"
                      : "border-border bg-card shadow-sm hover:shadow-lg"
                  }`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded-full text-[11px] font-bold tracking-wide whitespace-nowrap bg-primary text-primary-foreground">
                      {plan.badge}
                    </div>
                  )}

                  <div className={`p-6 sm:p-8 flex flex-col flex-1 ${plan.badge ? "pt-8" : ""}`}>
                    {/* Icon + name */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isRecommended ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                        <plan.icon className="w-5 h-5" weight="fill" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-base">{plan.name}</h3>
                        <p className="text-xs text-muted-foreground">{plan.description}</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm text-muted-foreground font-medium">{plan.price}</span>
                        <span className="text-3xl sm:text-4xl font-extrabold text-foreground">{plan.amount}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{plan.period}</p>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2.5 mb-8 flex-1">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground">
                          <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" weight="bold" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Button
                      variant={isRecommended ? "default" : "outline"}
                      size="lg"
                      className="w-full rounded-xl font-semibold h-11 gap-2"
                      onClick={() => navigate("/clinica/cadastro")}
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4" weight="bold" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
              Resultados mensuráveis
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Empresas que implementaram telemedicina relatam redução de 40% em afastamentos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { metric: "-40%", label: "Redução em afastamentos" },
              { metric: "+35%", label: "Aumento em produtividade" },
              { metric: "98%", label: "Satisfação dos colaboradores" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-xl border border-border bg-card text-center"
              >
                <div className="text-4xl font-extrabold text-primary mb-2">{item.metric}</div>
                <p className="text-muted-foreground">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-4">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden bg-gradient-hero shadow-elevated"
          >
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary-foreground)/0.22),transparent_38%),radial-gradient(circle_at_bottom_right,hsl(var(--primary-foreground)/0.14),transparent_34%)]" />
            <div className="relative z-10 flex flex-col items-center justify-center gap-6 px-6 sm:px-10 py-16 sm:py-20 text-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-primary-foreground mb-2">
                  Pronto para transformar a saúde na sua empresa?
                </h2>
                <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
                  Agende uma demonstração gratuita e conheça como podemos ajudar sua empresa.
                </p>
              </div>
              <Button
                size="lg"
                className="bg-background text-primary hover:bg-background/95 rounded-2xl px-8 gap-2.5 shadow-lg shadow-foreground/10 font-extrabold"
                onClick={() => navigate("/para-empresas/telelaudo")}
              >
                Agendar demo gratuita
                <ArrowRight className="w-5 h-5" weight="bold" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
});

CartaoB2B.displayName = "CartaoB2B";
export default CartaoB2B;
