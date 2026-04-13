import { forwardRef, lazy } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, CreditCard, CheckCircle } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/landing/Header";
import SEOHead from "@/components/SEOHead";
import bannerBenefitsCard from "@/assets/banner-benefits-card.png";
import bannerB2BCorporate from "@/assets/banner-b2b-corporate.jpg";

const Footer = lazy(() => import("@/components/landing/Footer"));

const cardTypes = [
  {
    id: 1,
    title: "Cartão Benefícios",
    subtitle: "👥 Para Você e Família",
    description: "Consultas ilimitadas a partir de R$ 49/mês. Sem fila, sem espera, com médicos de verdade e atestados que funcionam em qualquer lugar.",
    icon: "❤️",
    image: bannerBenefitsCard,
    href: "/cartao-beneficios",
    features: [
      "Consultas avulsas R$ 89 (1ª grátis)",
      "Plano Mensal R$ 49 (5 consultas)",
      "Plano Família R$ 89 (ilimitado)",
      "Sem carência • Cancela na hora",
      "500+ médicos • 30+ especialidades",
    ],
    cta: "Escolher Plano",
    gradient: "from-blue-500 via-cyan-500 to-teal-500",
  },
  {
    id: 2,
    title: "Cartão B2B",
    subtitle: "🏢 Para Sua Empresa",
    description: "Saúde dos colaboradores = mais produtividade. Reduza afastamentos em até 40% e melhore a satisfação da equipe. Sem burocracias.",
    icon: "🎯",
    image: bannerB2BCorporate,
    href: "/cartao-b2b",
    features: [
      "Planos PME • Média • Grande Empresa",
      "Totalmente customizável",
      "Gestor de saúde dedicado",
      "Relatórios de ROI + Dashboards",
      "Suporte prioritário 24/7",
    ],
    cta: "Solicitar Demo",
    gradient: "from-purple-500 via-fuchsia-500 to-rose-500",
  },
];

const Cartoes = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();

  return (
    <div ref={ref} className="relative min-h-screen bg-background">
      <div className="absolute inset-0 -z-10 bg-[image:var(--landing-bg)] pointer-events-none" />

      <SEOHead
        title="Cartões de Benefício e B2B | AloClínica"
        description="Descubra os planos AloClínica: Cartão Benefícios para pacientes e Cartão B2B para empresas."
        canonical="https://aloclinica.com.br/cartoes"
      />

      <Header />

      {/* Hero */}
      <section className="pt-20 pb-16 px-4">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mb-4 flex items-center justify-center gap-2 w-fit mx-auto">
              <CreditCard size={14} weight="bold" /> 💳 Benefícios Reais
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-foreground leading-tight mb-6">
              Telemedicina que <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">cabe no orçamento</span>
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium mb-4">
              De R$ 49/mês para indivíduos a planos corporativos customizados — acesso a 500+ médicos em 30+ especialidades.
            </p>
            <p className="text-base text-muted-foreground/80 max-w-2xl mx-auto">
              Sem carência. Sem complicações. Cancelamento a qualquer hora.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Cards Grid */}
      <section className="py-20 px-4">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {cardTypes.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, x: i === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                whileHover={{ y: -12 }}
                className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                {/* Header with Image */}
                <div className="relative h-56 overflow-hidden bg-gradient-to-br from-foreground/5 to-foreground/10">
                  {card.image && (
                    <motion.img
                      src={card.image}
                      alt={card.title}
                      className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-300"
                      initial={{ scale: 1 }}
                      whileHover={{ scale: 1.08 }}
                      transition={{ duration: 0.4 }}
                    />
                  )}
                  <div className={`absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-card/95`} />

                  {/* Icon and Badge */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <motion.div
                      className="text-7xl"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    >
                      {card.icon}
                    </motion.div>
                  </div>

                  <motion.div
                    className="absolute top-4 left-4 bg-primary text-primary-foreground px-4 py-2 rounded-full text-xs font-bold backdrop-blur-sm"
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {card.subtitle}
                  </motion.div>
                </div>

                {/* Content */}
                <div className="flex-1 p-8 flex flex-col">
                  <motion.h3
                    className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-300"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    {card.title}
                  </motion.h3>
                  <motion.p
                    className="text-muted-foreground mb-6 leading-relaxed"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                  >
                    {card.description}
                  </motion.p>

                  {/* Features */}
                  <motion.div
                    className="flex-1 mb-6"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h4 className="text-sm font-semibold text-foreground mb-4">✨ Incluso:</h4>
                    <ul className="space-y-3">
                      {card.features.map((feature, j) => (
                        <motion.li
                          key={j}
                          className="flex items-center gap-3 text-sm text-muted-foreground group/item hover:text-foreground transition-colors"
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.25 + j * 0.05 }}
                        >
                          <CheckCircle size={16} weight="fill" className="text-primary shrink-0" />
                          {feature}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>

                  {/* CTA */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Button
                      size="lg"
                      className="w-full bg-gradient-hero text-primary-foreground hover:opacity-90 rounded-xl font-semibold group/btn shadow-lg hover:shadow-xl transition-all"
                      onClick={() => navigate(card.href)}
                    >
                      <span className="flex items-center justify-center gap-2">
                        {card.cta}
                        <motion.div whileHover={{ x: 4 }}>
                          <ArrowRight className="w-4 h-4" weight="bold" />
                        </motion.div>
                      </span>
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
              Qual plano é ideal para você?
            </h2>
            <p className="text-lg text-muted-foreground">
              Solução para cada perfil: individual, familiar ou corporativo.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Você está buscando",
                items: ["Consultas avulsas", "Plano individual", "Cobertura familiar"],
              },
              {
                title: "Para sua empresa",
                items: ["Saúde corporativa", "ROI comprovado", "Equipe dedicada"],
              },
              {
                title: "Precisa de",
                items: ["Flexibilidade", "Conformidade", "Suporte 24/7"],
              },
            ].map((section, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-xl border border-border/50 bg-card"
              >
                <h4 className="font-bold text-foreground mb-4">{section.title}</h4>
                <ul className="space-y-2">
                  {section.items.map((item, j) => (
                    <li key={j} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 bg-gradient-to-b from-background via-muted/10 to-background">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <motion.h2
                className="text-3xl sm:text-4xl font-bold text-foreground mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Benefícios de se inscrever agora
              </motion.h2>
              <ul className="space-y-3">
                {[
                  "Acesso imediato a 500+ médicos",
                  "Sem carência ou períodos de espera",
                  "Cancelamento sem penalidade",
                  "Prontuário digital unificado",
                  "Receitas e atestados digitais",
                  "Suporte via chat e telefone",
                ].map((benefit, i) => (
                  <motion.li
                    key={i}
                    className="flex items-center gap-3 group/benefit"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                  >
                    <motion.span
                      className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-bold flex items-center justify-center shrink-0 group-hover/benefit:bg-primary/30 transition-colors"
                      whileHover={{ scale: 1.1 }}
                    >
                      ✓
                    </motion.span>
                    <span className="text-muted-foreground group-hover/benefit:text-foreground transition-colors">{benefit}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              {/* Animated background */}
              <motion.div
                className="absolute -inset-4 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-2xl opacity-50"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <div className="relative bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-8 border border-border/50 backdrop-blur-sm">
                <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  Números que falam
                </h3>
                <div className="space-y-4">
                  {[
                    { metric: "500+", label: "Médicos verificados" },
                    { metric: "50k+", label: "Consultas/mês" },
                    { metric: "4.9★", label: "Avaliação média" },
                    { metric: "24h", label: "Disponibilidade" },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      className="flex justify-between items-center pb-4 border-b border-border/30 last:border-0 group/stat"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      whileHover={{ x: 4 }}
                    >
                      <span className="text-muted-foreground group-hover/stat:text-foreground transition-colors">{item.label}</span>
                      <motion.span
                        className="text-2xl font-bold text-primary"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ delay: 0.45 + i * 0.1, type: "spring", stiffness: 200 }}
                      >
                        {item.metric}
                      </motion.span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-black text-foreground mb-4">
              Qual é seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">primeiro passo?</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Crie sua conta agora e aproveite 7 dias grátis (sem cartão de crédito necessário).
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-hero text-primary-foreground hover:opacity-90 rounded-xl px-10 h-14 font-bold text-base shadow-lg hover:shadow-xl transition-all"
                onClick={() => navigate("/cartao-beneficios")}
              >
                <span className="flex items-center gap-2">
                  👥 Para Pacientes
                  <ArrowRight className="w-5 h-5" weight="bold" />
                </span>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl px-10 h-14 font-bold text-base"
                onClick={() => navigate("/cartao-b2b")}
              >
                <span className="flex items-center gap-2">
                  🏢 Para Empresas
                  <ArrowRight className="w-5 h-5" weight="bold" />
                </span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground/60 mt-6">
              ✓ Sem complicações • ✓ Sem carência • ✓ Cancela quando quiser
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
});

Cartoes.displayName = "Cartoes";
export default Cartoes;
