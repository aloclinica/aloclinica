import { forwardRef, lazy } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, CurrencyDollar, CalendarBlank, Globe, ShieldCheck, ArrowRight, ChartLineUp, CheckCircle, Lock } from "@phosphor-icons/react";
import { TrendingUp, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/landing/Header";
import SEOHead from "@/components/SEOHead";

const Footer = lazy(() => import("@/components/landing/Footer"));

const stats = [
  { value: "500+", label: "Médicos ativos" },
  { value: "30+", label: "Especialidades" },
  { value: "R$3k+", label: "Renda média/mês" },
  { value: "4.9★", label: "Satisfação média" },
];

const perks = [
  {
    icon: CurrencyDollar,
    title: "Renda extra garantida",
    desc: "Atenda pacientes de todo o Brasil e aumente seu faturamento sem sair de casa.",
  },
  {
    icon: CalendarBlank,
    title: "Agenda no seu ritmo",
    desc: "Defina horários e especialidades. Você controla quando e quanto quer atender.",
  },
  {
    icon: Globe,
    title: "Alcance nacional",
    desc: "Conecte-se a pacientes de qualquer estado. Sem limites geográficos.",
  },
  {
    icon: ShieldCheck,
    title: "100% regulamentado",
    desc: "Plataforma em conformidade com CFM, CRM e LGPD. Atenda com segurança jurídica.",
  },
  {
    icon: ChartLineUp,
    title: "Ferramentas completas",
    desc: "Prontuário SOAP, receita digital, laudo, atestado — tudo em um só lugar.",
  },
  {
    icon: Stethoscope,
    title: "Suporte médico dedicado",
    desc: "Time médico disponível para onboarding e dúvidas sobre a plataforma.",
  },
];

const howItWorks = [
  {
    step: "1",
    title: "Cadastre-se",
    desc: "Preencha seu perfil médico com CRM, especialidade e horários disponíveis.",
  },
  {
    step: "2",
    title: "Análise rápida",
    desc: "Nossa equipe valida seus documentos em até 24 horas.",
  },
  {
    step: "3",
    title: "Comece a atender",
    desc: "Receba pacientes e aumente sua renda com consultas online.",
  },
];

const faqItems = [
  {
    question: "Quanto eu ganho por consulta?",
    answer: "A média é de R$ 30-80 por consulta de 20-30 min, dependendo da especialidade. Médicos de psicologia, cardiologia e dermatologia ganham mais. Você recebe 48h após a consulta.",
  },
  {
    question: "Preciso abandonar meu consultório?",
    answer: "Não! A teleconsulta é complemento de renda. Muitos médicos atendem 2-3 pacientes online entre consultas presenciais. Você controla 100% da sua agenda.",
  },
  {
    question: "Vocês controlam meus horários?",
    answer: "Zero controle. Você define quando está disponível (pode ser 3am, domingo, feriado — como quiser). Pacientes encaixam nos seus horários, não o contrário.",
  },
  {
    question: "E se surgir dúvida sobre a plataforma?",
    answer: "Time médico dedicado disponível 24/7 por chat, email e whatsapp. Temos também webinars mensais e documentação completa.",
  },
  {
    question: "Meus dados de paciente ficam seguros?",
    answer: "Sim. LGPD compliant, criptografia AES-256, prontuário eletrônico em nuvem, backup automático. Auditoria e conformidade 100% CFM/CREMESP.",
  },
];

const testimonials = [
  {
    name: "Dr. Lucas Ferreira",
    specialty: "Cardiologista",
    income: "R$ 4.2k/mês",
    quote: "Em 6 meses de teleconsulta, fiz mais consultas do que fazia em 1 ano de consultório físico. Flexibilidade total.",
  },
  {
    name: "Dra. Marina Silva",
    specialty: "Dermatologista",
    income: "R$ 3.8k/mês",
    quote: "Perfeito para pós-consulta e retornos. Menos deslocamento, mais renda, mesma qualidade.",
  },
  {
    name: "Dr. Rafael Mendes",
    specialty: "Psicólogo",
    income: "R$ 5.1k/mês",
    quote: "Meus pacientes adoram. Não perde ninguém por questão de deslocamento. Renda super consistente.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const ForDoctors = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();

  return (
    <div ref={ref} className="relative min-h-screen bg-background">
      <div className="absolute inset-0 -z-10 bg-[image:var(--landing-bg)] pointer-events-none" />

      <SEOHead
        title="Seja Médico Parceiro | Telemedicina AloClínica"
        description="Atenda pacientes online e aumente sua renda. Cadastro gratuito, aprovação em 24h. 500+ médicos já parceiros."
        canonical="https://aloclinica.com.br/para-medicos"
      />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Animated floating elements */}
        <motion.div
          className="absolute top-32 left-10 w-24 h-24 rounded-full bg-primary/15 blur-3xl"
          animate={{ y: [0, 40, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-secondary/10 blur-3xl"
          animate={{ y: [0, -40, 0] }}
          transition={{ duration: 8, repeat: Infinity, delay: 0.5 }}
        />

        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
                Para Médicos
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight tracking-tight mb-4">
                Atenda mais, trabalhe{" "}
                <span className="text-primary">de onde quiser</span>
              </h1>
              <p className="text-muted-foreground text-lg sm:text-xl leading-relaxed mb-8 max-w-lg">
                Junte-se a mais de 500 médicos que já expandiram sua prática com telemedicina. Cadastro gratuito, aprovação em até 24h.
              </p>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {stats.map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + i * 0.08, type: "spring", stiffness: 200, damping: 18 }}
                    className="text-center rounded-xl border border-border bg-card p-3"
                  >
                    <p className="text-xl sm:text-2xl font-extrabold text-primary tabular-nums">{s.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="bg-gradient-hero text-primary-foreground hover:opacity-90 rounded-xl px-8 gap-2 font-semibold shadow-lg shadow-primary/20 h-12"
                  onClick={() => navigate("/medico/cadastro")}
                >
                  <Stethoscope className="w-5 h-5" weight="fill" />
                  Quero ser parceiro
                  <ArrowRight className="w-4 h-4" weight="bold" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-xl px-8 gap-2 font-semibold h-12"
                  onClick={() => navigate("/medico")}
                >
                  Saiba mais
                </Button>
              </div>
            </motion.div>

            {/* Right: perks grid */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {perks.map((p) => (
                <motion.div
                  key={p.title}
                  variants={itemVariants}
                  className="flex gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                    <p.icon className="w-5 h-5 text-primary" weight="fill" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground mb-0.5">{p.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
              Como Funciona
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
              3 passos para começar
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Rápido, simples e seguro.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative p-8 rounded-2xl border border-border bg-card hover:shadow-elevated transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 font-extrabold text-lg text-primary">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
                {i < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-muted-foreground/30" weight="bold" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <motion.div variants={fadeUp} className="text-center mb-16">
              <Badge className="mb-4 text-sm px-4 py-1.5 rounded-full font-semibold bg-primary/10 text-primary border-primary/20">
                ⭐ O Que Médicos Falam
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground text-center mb-4 tracking-tight">
                Histórias Reais de Sucesso
              </h2>
              <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto font-medium">
                Médicos como você já aumentaram sua renda sem abandonar seu consultório
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <Card className="h-full border-border/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group bg-card">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground text-sm">{t.name}</h3>
                          <p className="text-xs text-muted-foreground">{t.specialty}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground italic mb-4 leading-relaxed">"{t.quote}"</p>
                      <div className="pt-4 border-t border-border/50">
                        <p className="text-xs font-semibold text-primary flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" weight="fill" /> {t.income}/mês
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-black text-foreground text-center mb-12 tracking-tight">
              Dúvidas Frequentes
            </motion.h2>
            <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {faqItems.map((faq, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <Card className="h-full border-border/50 hover:shadow-lg hover:border-primary/20 transition-all group">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                          <Sparkles className="w-4 h-4 text-primary" weight="fill" />
                        </div>
                        <h3 className="font-bold text-foreground text-sm leading-snug">{faq.question}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed ml-11">{faq.answer}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Final */}
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
                  Sua Renda Extra em 5 Minutos
                </h2>
                <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
                  Cadastro gratuito, análise em 24h. Começar a atender no mesmo dia.
                </p>
              </div>
              <Button
                size="lg"
                className="bg-background text-primary hover:bg-background/95 rounded-2xl px-8 gap-2.5 shadow-lg shadow-foreground/10 font-extrabold"
                onClick={() => navigate("/medico/cadastro")}
              >
                <CheckCircle className="w-5 h-5" weight="fill" />
                Quero Começar Agora
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

ForDoctors.displayName = "ForDoctors";
export default ForDoctors;
