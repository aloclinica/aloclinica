import { forwardRef, lazy } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Rocket, Target, Users } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/landing/Header";
import SEOHead from "@/components/SEOHead";
import refDashboard from "@/assets/ref-dashboard-2.png";
import refDashboard3 from "@/assets/ref-dashboard-3.png";

const Footer = lazy(() => import("@/components/landing/Footer"));

const professions = [
  {
    id: 1,
    title: "Sou Médico",
    description: "Ganhe R$ 30 a R$ 80 por consulta. Sua agenda, suas regras. Trabalhe 2 horas/dia e ganhe R$ 3k+/mês sem abrir mão do consultório.",
    icon: "👨‍⚕️",
    image: refDashboard,
    href: "/para-medicos",
    badge: "💵 Maior Demanda",
    stats: "500+ médicos • Desde R$ 30/consulta",
    benefits: [
      "Agenda 100% flexível (você escolhe)",
      "R$ 30-R$ 80 por teleconsulta",
      "Ferramentas médicas completas",
      "Pagamento automático 1x/mês",
      "Suporte jurídico incluso",
    ],
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: 2,
    title: "Sou Laudista",
    description: "Emita laudos do sofá. Fila inteligente, assinatura digital integrada, ganhe por exame. Home office 100% com conformidade garantida.",
    icon: "📋",
    image: refDashboard3,
    href: "/laudista",
    badge: "🏠 Home Office",
    stats: "100+ laudistas • Taxa competitiva",
    benefits: [
      "Trabalhe de qualquer lugar",
      "Fila organizada por prioridade",
      "Assinatura digital automática",
      "Conformidade CFM + LGPD",
      "Suporte 24/7 dedicado",
    ],
    gradient: "from-green-500 to-emerald-500",
  },
  {
    id: 3,
    title: "Sou Clínica",
    description: "Digitalize seus exames. Envie, receba laudos assinados em 24h. Integração fácil, zero papel, mais eficiência e receita extra.",
    icon: "🏥",
    href: "/para-clinicas",
    badge: "🚀 Crescimento B2B",
    stats: "100+ clínicas • 50k+ exames/mês",
    benefits: [
      "API para integração com seu sistema",
      "Laudistas verificados e certificados",
      "SLA 24h garantido",
      "Gestor de relacionamento dedicado",
      "Relatórios de performance",
    ],
    gradient: "from-purple-500 to-fuchsia-500",
  },
];

const ParaProfissionais = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();

  return (
    <div ref={ref} className="relative min-h-screen bg-background">
      <div className="absolute inset-0 -z-10 bg-[image:var(--landing-bg)] pointer-events-none" />

      <SEOHead
        title="Para Profissionais | AloClínica - Médicos, Laudistas e Clínicas"
        description="Oportunidades para médicos, laudistas e clínicas. Cadastre-se e comece a ganhar com telemedicina."
        canonical="https://aloclinica.com.br/para-profissionais"
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
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
              💰 Ganhe Mais, Trabalhe Melhor
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-foreground leading-tight mb-6">
              Profissionais de <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Saúde Ganham Aqui</span>
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium mb-4">
              Médicos, laudistas e clínicas — expanda sua renda, controle sua agenda, atenda quantas vezes quiser.
            </p>
            <p className="text-base text-muted-foreground/80 max-w-2xl mx-auto">
              500+ profissionais já ganham R$ 3k+/mês. Você pode ser o próximo.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Professions Grid */}
      <section className="py-20 px-4">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {professions.map((prof, i) => (
              <motion.div
                key={prof.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                whileHover={{ y: -8 }}
                className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                {/* Header with Image */}
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-foreground/5 to-foreground/10">
                  {prof.image && (
                    <motion.img
                      src={prof.image}
                      alt={prof.title}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-300"
                      initial={{ scale: 1 }}
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.4 }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-card/95" />

                  {/* Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      className="text-6xl"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      transition={{ delay: 0.2 + i * 0.1, type: "spring", stiffness: 200 }}
                    >
                      {prof.icon}
                    </motion.div>
                  </div>

                  <motion.span
                    className="absolute top-4 right-4 text-xs font-bold px-3 py-1 rounded-full bg-primary/90 text-primary-foreground backdrop-blur-sm"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.1 }}
                  >
                    {prof.badge}
                  </motion.span>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 flex flex-col">
                  <motion.h3
                    className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-300"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    {prof.title}
                  </motion.h3>
                  <motion.p
                    className="text-sm text-muted-foreground mb-6 flex-1 leading-relaxed"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                  >
                    {prof.description}
                  </motion.p>

                  {/* Stats */}
                  <motion.div
                    className="text-xs text-muted-foreground mb-4 pt-4 border-t border-border flex items-center gap-2 font-medium"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <CheckCircle size={16} className="text-primary shrink-0" weight="fill" />
                    {prof.stats}
                  </motion.div>

                  {/* Benefits List */}
                  <motion.div
                    className="mb-6 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg p-4 border border-border/30"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                  >
                    <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                      <Target size={14} weight="fill" className="text-primary" />
                      Benefícios:
                    </h4>
                    <ul className="space-y-2.5">
                      {prof.benefits.slice(0, 3).map((benefit, j) => (
                        <motion.li
                          key={j}
                          className="text-xs text-muted-foreground flex items-start gap-2.5 hover:text-foreground transition-colors"
                          initial={{ opacity: 0, x: -5 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + j * 0.05 }}
                        >
                          <CheckCircle size={14} className="text-primary mt-0 shrink-0" weight="fill" />
                          {benefit}
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
                      size="sm"
                      className="w-full bg-gradient-hero text-primary-foreground hover:opacity-90 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                      onClick={() => navigate(prof.href)}
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        Saiba Mais
                        <motion.div whileHover={{ x: 2 }}>
                          <ArrowRight className="w-3 h-3" weight="bold" />
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

      {/* Why Join Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <motion.div
            className="text-center max-w-3xl mx-auto mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Por que fazer parte de uma rede?
            </h2>
            <p className="text-lg text-muted-foreground">
              Crescimento, segurança e suporte em cada etapa.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: "📈",
                title: "Crescimento",
                desc: "Aumente sua renda com acesso a mais pacientes",
              },
              {
                icon: "🔒",
                title: "Segurança",
                desc: "Plataforma regulada e conformidade garantida",
              },
              {
                icon: "⚙️",
                title: "Tecnologia",
                desc: "Ferramentas de ponta para seu trabalho",
              },
              {
                icon: "🤝",
                title: "Suporte",
                desc: "Time dedicado para ajudar seu sucesso",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -4, shadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
                className="relative p-6 rounded-2xl border border-border/50 bg-card hover:shadow-lg transition-all duration-300 overflow-hidden group"
              >
                {/* Animated gradient background */}
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-primary/5 to-secondary/5"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                />

                <div className="relative z-10">
                  <motion.div
                    className="text-4xl mb-3 inline-block"
                    initial={{ scale: 0, rotate: -20 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    transition={{ delay: i * 0.1 + 0.1, type: "spring", stiffness: 200 }}
                  >
                    {item.icon}
                  </motion.div>
                  <h4 className="font-semibold text-foreground mb-2 text-lg">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <motion.div
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
              Como começar?
            </h2>
            <p className="text-lg text-muted-foreground">
              3 passos simples para fazer parte da rede AloClínica
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Cadastre-se",
                desc: "Preencha seu perfil com informações profissionais verificadas.",
              },
              {
                step: "02",
                title: "Aprovação",
                desc: "Nossa equipe valida seus documentos em até 24 horas.",
              },
              {
                step: "03",
                title: "Comece",
                desc: "Acesse a plataforma e inicie a gerar renda imediatamente.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                whileHover={{ y: -4 }}
                className="relative p-6 rounded-2xl border border-border bg-card shadow-md hover:shadow-lg transition-all overflow-hidden group"
              >
                {/* Gradient background */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                />

                <div className="relative z-10">
                  <motion.div
                    className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-lg"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ delay: i * 0.15 + 0.1, type: "spring", stiffness: 200 }}
                  >
                    {item.step}
                  </motion.div>
                  <motion.h3
                    className="font-bold text-foreground mt-2 mb-2 text-lg"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: i * 0.15 + 0.2 }}
                  >
                    {item.title}
                  </motion.h3>
                  <motion.p
                    className="text-sm text-muted-foreground"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: i * 0.15 + 0.3 }}
                  >
                    {item.desc}
                  </motion.p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Connection line */}
          <motion.div
            className="hidden md:flex items-center justify-between mt-12 px-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex-1 h-1 bg-gradient-to-r from-primary/20 to-transparent" />
            <Users className="w-5 h-5 text-primary mx-4" weight="bold" />
            <div className="flex-1 h-1 bg-gradient-to-l from-primary/20 to-transparent" />
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-background via-muted/20 to-background">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <motion.div
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Números que impressionam
            </h2>
            <p className="text-lg text-muted-foreground">
              Crescimento sustentável de uma comunidade de profissionais
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { metric: "500+", label: "Médicos na rede", icon: "👨‍⚕️" },
              { metric: "100+", label: "Clínicas parceiras", icon: "🏥" },
              { metric: "50k+", label: "Exames/mês", icon: "📋" },
              { metric: "R$ 3k+", label: "Renda média/mês", icon: "💰" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="relative p-6 rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 overflow-hidden group shadow-md hover:shadow-lg transition-all"
              >
                {/* Animated gradient overlay */}
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-primary/10 to-secondary/10"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                />

                <div className="relative z-10 text-center">
                  <motion.div
                    className="text-4xl mb-3"
                    initial={{ scale: 0, rotate: -20 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    transition={{ delay: i * 0.1 + 0.1, type: "spring", stiffness: 200 }}
                  >
                    {item.icon}
                  </motion.div>
                  <motion.div
                    className="text-3xl sm:text-4xl font-extrabold text-primary mb-1"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 + 0.2 }}
                  >
                    {item.metric}
                  </motion.div>
                  <motion.p
                    className="text-xs sm:text-sm text-muted-foreground font-medium"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: i * 0.1 + 0.3 }}
                  >
                    {item.label}
                  </motion.p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-black text-foreground mb-4">
              Sua renda extra começa <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">em 5 minutos</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-2">
              Cadastro rápido. Aprovação em até 24h. Ganhe no mesmo dia.
            </p>
            <p className="text-muted-foreground/70 text-base mb-8">
              Não perca tempo. 500+ profissionais já estão ganhando. Você quer ficar de fora?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-hero text-primary-foreground hover:opacity-90 rounded-xl px-10 h-14 font-bold text-base shadow-lg hover:shadow-xl transition-all"
                onClick={() => navigate("/para-medicos")}
              >
                <span className="flex items-center gap-2">
                  👨‍⚕️ Cadastro Médico
                  <ArrowRight className="w-5 h-5" weight="bold" />
                </span>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl px-10 h-14 font-bold text-base"
                onClick={() => navigate("/laudista")}
              >
                <span className="flex items-center gap-2">
                  📋 Cadastro Laudista
                  <ArrowRight className="w-5 h-5" weight="bold" />
                </span>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl px-10 h-14 font-bold text-base"
                onClick={() => navigate("/para-clinicas")}
              >
                <span className="flex items-center gap-2">
                  🏢 Para Clínicas
                  <ArrowRight className="w-5 h-5" weight="bold" />
                </span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground/60 mt-8">
              ✓ Sem taxas escondidas • ✓ Pagamento garantido • ✓ Suporte dedicado
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
});

ParaProfissionais.displayName = "ParaProfissionais";
export default ParaProfissionais;
