import { forwardRef, lazy } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Star, ArrowRight, Lightning, Crown, Users } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/landing/Header";
import SEOHead from "@/components/SEOHead";

const Footer = lazy(() => import("@/components/landing/Footer"));

const plans = [
  {
    id: "avulso",
    icon: Lightning,
    badge: null,
    name: "Consulta Avulsa",
    price: "89",
    period: "por consulta",
    description: "Ideal para quem precisa de atendimento pontual sem compromisso de assinatura.",
    cta: "Agendar agora",
    variant: "outline" as const,
    features: [
      "Consulta por vídeo com especialista",
      "Receita digital válida em todo Brasil",
      "Atestado médico digital",
      "Acesso ao prontuário por 30 dias",
      "Suporte por chat",
    ],
  },
  {
    id: "mensal",
    icon: Crown,
    badge: "Mais popular",
    name: "Assinatura Mensal",
    price: "49",
    period: "por mês",
    description: "Consultas ilimitadas com clínico geral e acesso a especialistas com desconto.",
    cta: "Assinar agora",
    variant: "default" as const,
    features: [
      "2 consultas com especialistas/mês",
      "Consultas ilimitadas com clínico geral",
      "Plantão 24h sem custo adicional",
      "Receitas e atestados ilimitados",
      "Prontuário digital permanente",
      "Suporte prioritário",
    ],
  },
  {
    id: "familia",
    icon: Users,
    badge: "Melhor custo-benefício",
    name: "Plano Família",
    price: "89",
    period: "por mês · até 4 pessoas",
    description: "Cobertura completa para toda a família com um único plano acessível.",
    cta: "Proteger minha família",
    variant: "outline" as const,
    features: [
      "Até 4 dependentes inclusos",
      "4 consultas com especialistas/mês",
      "Consultas ilimitadas com clínico geral",
      "Plantão pediátrico 24h",
      "Prontuário para cada membro",
      "Desconto em exames parceiros",
    ],
  },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const CartaoBeneficios = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();

  return (
    <div ref={ref} className="relative min-h-screen bg-background">
      <div className="absolute inset-0 -z-10 bg-[image:var(--landing-bg)] pointer-events-none" />

      <SEOHead
        title="Cartão de Benefícios - Planos de Saúde | AloClínica"
        description="Conheça nossos planos de telemedicina. Consulta Avulsa, Assinatura Mensal ou Plano Família. Sem carência, sem burocracia."
        canonical="https://aloclinica.com.br/cartao-beneficios"
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
              Planos & Preços
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight tracking-tight mb-4">
              Cuidado médico ao alcance de <span className="text-primary">todos</span>
            </h1>
            <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
              Escolha o plano ideal para você. Sem carência, sem burocracia — consulta agendada em menos de 2 minutos.
            </p>
          </motion.div>

          {/* Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start"
          >
            {plans.map((plan) => {
              const isPopular = plan.id === "mensal";
              return (
                <motion.div
                  key={plan.id}
                  variants={cardVariants}
                  className={`relative rounded-2xl border flex flex-col overflow-hidden transition-all ${
                    isPopular
                      ? "border-primary shadow-2xl shadow-primary/15 bg-gradient-to-b from-primary/5 to-background scale-[1.02] md:scale-105 z-10"
                      : "border-border bg-card shadow-sm hover:shadow-lg hover:-translate-y-1"
                  }`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded-full text-[11px] font-bold tracking-wide whitespace-nowrap ${
                      isPopular ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                    }`}>
                      {plan.badge}
                    </div>
                  )}

                  <div className={`p-6 sm:p-8 flex flex-col flex-1 ${plan.badge ? "pt-8" : ""}`}>
                    {/* Icon + name */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPopular ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                        <plan.icon className="w-5 h-5" weight="fill" />
                      </div>
                      <h3 className="font-bold text-foreground text-base">{plan.name}</h3>
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm text-muted-foreground font-medium">R$</span>
                        <span className="text-4xl sm:text-5xl font-extrabold text-foreground tabular-nums tracking-tight">{plan.price}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{plan.period}</p>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{plan.description}</p>

                    {/* Features */}
                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground">
                          <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" weight="bold" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Button
                      variant={plan.variant}
                      size="lg"
                      className="w-full rounded-xl font-semibold h-11 gap-2"
                      onClick={() => navigate(plan.variant === "default" ? "/paciente" : "/paciente/cadastro")}
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

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
              Dúvidas frequentes
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Encontre respostas para as principais perguntas sobre nossos planos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              { q: "Posso cancelar meu plano?", a: "Sim, sem multa ou penalidade. Você pode cancelar a qualquer momento." },
              { q: "Há período de carência?", a: "Não. Você pode agendar uma consulta imediatamente após a contratação." },
              { q: "Funciona em qualquer lugar do Brasil?", a: "Sim, a plataforma funciona em todo o território nacional, 24 horas por dia." },
              { q: "Quanto tempo leva para agendar?", a: "Menos de 2 minutos. Basta escolher a especialidade e confirmar o horário disponível." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-xl border border-border bg-card"
              >
                <h3 className="font-semibold text-foreground mb-2">{item.q}</h3>
                <p className="text-sm text-muted-foreground">{item.a}</p>
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
                  Pronto para cuidar da sua saúde?
                </h2>
                <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
                  Escolha seu plano e comece hoje. Primeira consulta em menos de 2 minutos.
                </p>
              </div>
              <Button
                size="lg"
                className="bg-background text-primary hover:bg-background/95 rounded-2xl px-8 gap-2.5 shadow-lg shadow-foreground/10 font-extrabold"
                onClick={() => navigate("/paciente/cadastro")}
              >
                Escolher plano
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

CartaoBeneficios.displayName = "CartaoBeneficios";
export default CartaoBeneficios;
