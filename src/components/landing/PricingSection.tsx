import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Star, ArrowRight, Lightning, Crown, Users } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { useSiteConfig } from "@/lib/site-config";

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

const PricingSection = forwardRef<HTMLElement>((_, ref) => {
  const navigate = useNavigate();
  const { get } = useSiteConfig();
  const badge    = get("pricing_badge",    "Planos & Preços");
  const title    = get("pricing_title",    "Cuidado médico ao alcance de todos");
  const subtitle = get("pricing_subtitle", "Escolha o plano ideal para você. Sem carência, sem burocracia — consulta agendada em menos de 2 minutos.");

  return (
    <section ref={ref} id="planos" aria-labelledby="pricing-heading" className="py-20 md:py-28 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
            {badge}
          </span>
          <h2 id="pricing-heading" className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground leading-tight tracking-tight mb-4">
            {title}
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start"
        >
          {plans.map((plan) => {
            const isPopular = plan.id === "mensal";
            return (
              <motion.div
                key={plan.id}
                variants={cardVariants}
                className={`relative rounded-2xl border flex flex-col overflow-hidden transition-shadow ${
                  isPopular
                    ? "border-primary shadow-2xl shadow-primary/15 bg-gradient-to-b from-primary/5 to-background scale-[1.02] md:scale-105 z-10"
                    : "border-border bg-card shadow-sm hover:shadow-lg"
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

                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">{plan.description}</p>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" weight="bold" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button
                    size="lg"
                    variant={isPopular ? "default" : "outline"}
                    className={`w-full rounded-xl font-semibold gap-2 h-12 ${isPopular ? "bg-gradient-hero text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20" : ""}`}
                    onClick={() => navigate("/paciente")}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4" weight="bold" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-10 text-center space-y-2"
        >
          <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" weight="fill" />
            <span>Todos os planos incluem <strong className="text-foreground">cadastro gratuito</strong> e cancelamento a qualquer momento</span>
          </div>
          <p className="text-[11px] text-muted-foreground/60">
            Regulamentado pelo CFM (Res. 2.314/2022) · Dados protegidos pela LGPD · Pagamentos seguros com SSL
          </p>
        </motion.div>
      </div>
    </section>
  );
});

PricingSection.displayName = "PricingSection";
export default PricingSection;
