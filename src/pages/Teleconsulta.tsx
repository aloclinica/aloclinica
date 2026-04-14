import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Video, Shield, Clock, MapPin, Heart, Stethoscope, FileText, Smartphone,
  CheckCircle2, ArrowRight, Users, Scale, HelpCircle, ChevronRight, MonitorSmartphone, Phone,
  Sparkles, Target, TrendingUp, Zap
} from "lucide-react";
import bannerDoctor from "@/assets/banner-teleconsulta-doctor.jpg";
import bannerPatient from "@/assets/banner-teleconsulta-patient.jpg";
import { motion, AnimatePresence } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/landing/Header";
import { lazy, Suspense } from "react";
import heroTeleconsultaPhone from "@/assets/hero-teleconsulta-phone.png";

const Footer = lazy(() => import("@/components/landing/Footer"));

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};
const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const whyReasons = [
  { icon: <MapPin className="w-5 h-5 text-white" />, title: "Sem deslocamento", desc: "Atendido por videoconferência no conforto da sua casa.", gradient: "from-primary to-primary/70" },
  { icon: <Heart className="w-5 h-5 text-white" />, title: "Pacientes acamados", desc: "Impossibilidade de ir presencialmente? A teleconsulta resolve.", gradient: "from-destructive to-destructive/70" },
  { icon: <Stethoscope className="w-5 h-5 text-white" />, title: "Telemonitoramento", desc: "Acompanhamento contínuo de pacientes crônicos à distância.", gradient: "from-secondary to-secondary/70" },
  { icon: <Clock className="w-5 h-5 text-white" />, title: "Redução de custos", desc: "Economia de tempo e dinheiro para médico e paciente.", gradient: "from-warning to-warning/70" },
  { icon: <CheckCircle2 className="w-5 h-5 text-white" />, title: "Comodidade", desc: "Revisões e retornos sem necessidade de presença física.", gradient: "from-primary to-secondary" },
];

const benefits = [
  "Atendido no conforto do seu lar",
  "Qualquer médico, qualquer especialidade, em qualquer lugar do Brasil",
  "Tire dúvidas com mais de um especialista de forma rápida",
  "Convide parentes para a mesma videoconferência",
  "Use em viagens pelo Brasil e exterior",
  "Atualize receitas e atestados sem sair de casa",
];

const faqItems = [
  {
    icon: <Stethoscope className="w-5 h-5" />,
    question: "Vai funcionar por vídeo? E se o médico precisar me examinar?",
    answer: "Funciona! A maioria dos diagnósticos (80%+) vem de conversa + histórico. Mas se precisar exame físico, o médico encaminha para presencial perto de você. Receitas, atestados e laudos saem na hora, válidos em farmácias e hospitais.",
  },
  {
    icon: <Scale className="w-5 h-5" />,
    question: "Teleconsulta é legal no Brasil?",
    answer: "100% legal! Lei 13.989/2020, autorizado pelo CFM, regulado por CREMESP e LGPD. Você tem os mesmos direitos que em consulta presencial. Médicos são verificados a cada atendimento. Você tem recibo de tudo.",
  },
  {
    icon: <Smartphone className="w-5 h-5" />,
    question: "Preciso de setup especial? Conexão super rápida?",
    answer: "Não! Celular + wifi comum é suficiente. Testamos com 3G e funciona (video fica menor, mas consulta rola). Baixe nosso app ou use pelo navegador. 1min de setup.",
  },
  {
    icon: <Shield className="w-5 h-5" />,
    question: "Meus dados tão seguros com vocês?",
    answer: "Sim. Criptografia AES-256 (o mesmo padrão dos bancos), backup automático, auditoria 24/7. Apenas você e o médico veem seus dados. Zero publicidade com seus dados. Conformidade total LGPD.",
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    question: "Vale mesmo a pena? É mais barato?",
    answer: "Sim em 3 aspectos: (1) Não gasta com deslocamento/estacionamento (em SP, média R$ 80). (2) Ganha tempo (não perde 2h em trânsito). (3) Preço igual/menor que presencial (e 24h disponível).",
  },
];

const Teleconsulta = () => {
  return (
    <>
      <SEOHead
        title="Teleconsulta Médica Online | AloClinica"
        description="Consulte médicos online por vídeo 24h. Entenda como funciona a teleconsulta, benefícios, legalidade e como agendar."
      />
      <div className="min-h-screen relative">
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[hsl(205,65%,96%)] via-[hsl(215,50%,90%)] to-[hsl(225,45%,84%)] dark:from-[hsl(205,30%,8%)] dark:via-[hsl(215,25%,11%)] dark:to-[hsl(225,20%,13%)]" />
        <Header />

        {/* Hero — clean split layout inspired by Tokio Marine style */}
        <section className="relative mt-[70px] bg-gradient-to-br from-muted/40 via-background to-muted/30 dark:from-muted/10 dark:via-background dark:to-muted/5 overflow-hidden">
          {/* Subtle decorative circles */}
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-secondary/5 blur-3xl pointer-events-none" />

          <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left — Text */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-xl"
              >
                <motion.h1
                  className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground leading-[1.1] tracking-tight mb-5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  Sem tempo?
                  <br />
                  <span className="text-primary">A consulta</span>
                  <br />
                  <span className="text-primary">vai até você</span>
                </motion.h1>

                <motion.p
                  className="text-base md:text-lg text-muted-foreground leading-relaxed mb-8 max-w-md"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  A telemedicina resolve questões de saúde com mais agilidade, sem precisar ir ao consultório. Ideal pra quem tem a agenda cheia.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col sm:flex-row items-start gap-3"
                >
                  <Button
                    size="lg"
                    className="rounded-xl px-10 h-14 font-bold text-base shadow-lg hover:shadow-xl transition-all bg-primary text-primary-foreground"
                    asChild
                  >
                    <Link to="/dashboard/schedule?role=patient" className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Fale com a gente!
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-xl px-8 h-14 font-bold text-base border-border"
                    asChild
                  >
                    <Link to="/medico" className="flex items-center gap-2">
                      Sou Médico
                      <Stethoscope className="w-4 h-4" />
                    </Link>
                  </Button>
                </motion.div>

                {/* Trust badges */}
                <motion.div
                  className="flex flex-wrap items-center gap-4 mt-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.55 }}
                >
                  {[
                    { icon: <Shield className="w-4 h-4 text-primary" />, label: "LGPD Compliant" },
                    { icon: <Video className="w-4 h-4 text-primary" />, label: "Vídeo HD" },
                    { icon: <FileText className="w-4 h-4 text-primary" />, label: "Receita Digital" },
                  ].map((item, i) => (
                    <span key={i} className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                      {item.icon} {item.label}
                    </span>
                  ))}
                </motion.div>
              </motion.div>

              {/* Right — Pingo coming out of phone */}
              <motion.div
                className="flex items-center justify-center lg:justify-end"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25, duration: 0.6, type: "spring", stiffness: 120 }}
              >
                <div className="relative w-[300px] md:w-[400px] lg:w-[460px]">
                  <img
                    src={heroTeleconsultaPhone}
                    alt="Pingo — seu assistente de teleconsulta saindo do celular"
                    width={1024}
                    height={1024}
                    className="w-full h-auto drop-shadow-2xl"
                  />
                  {/* Floating badge */}
                  <motion.div
                    className="absolute top-8 -left-4 md:top-12 md:-left-8 bg-card border border-border rounded-2xl px-4 py-2.5 shadow-lg flex items-center gap-2"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">24h por dia</p>
                      <p className="text-[10px] text-muted-foreground">Inclusive feriados</p>
                    </div>
                  </motion.div>

                  <motion.div
                    className="absolute bottom-12 -right-4 md:bottom-16 md:-right-8 bg-card border border-border rounded-2xl px-4 py-2.5 shadow-lg flex items-center gap-2"
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  >
                    <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-secondary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">30+ especialidades</p>
                      <p className="text-[10px] text-muted-foreground">Médicos verificados</p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* How it works - AMWELL STYLE */}
        <section className="py-20 relative bg-gradient-to-b from-background via-muted/10 to-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.div variants={fadeUp} className="text-center mb-16 relative">
                <Badge variant="outline" className="mb-4 text-sm px-4 py-1.5 rounded-full font-semibold">
                  <Target className="w-3.5 h-3.5 mr-2" /> 3 Passos Simples
                </Badge>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight mb-3">
                  Marque a Consulta em 2 Minutos
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Processo transparente. Sem surpresas. Médicos verificados a cada passo.
                </p>
              </motion.div>

              {/* Progress line */}
              <motion.div className="hidden md:block mb-12 relative h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary via-secondary to-primary rounded-full"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.3 }}
                  style={{ originX: 0 }}
                />
              </motion.div>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { step: "1", title: "Escolha seu Médico", desc: "Veja fotos, especializações, avaliações reais e preços. Escolha quem você quer consultar.", icon: "🔍", color: "from-blue-500 to-cyan-500" },
                  { step: "2", title: "Agende sem Fila", desc: "Escolha o horário que funciona pra você. Salas virtuais às 3am? Temos. Receba SMS com link.", icon: "⏰", color: "from-purple-500 to-pink-500" },
                  { step: "3", title: "Consulte Agora", desc: "Videochamada criptografada. Médico vê sua câmera e histórico. Receita na hora. Pronto!", icon: "✅", color: "from-green-500 to-emerald-500" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    whileHover={{ y: -8 }}
                    className="relative"
                  >
                    <Card className="h-full border-border/50 hover:shadow-2xl hover:border-primary/30 transition-all duration-300 group overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                      <CardContent className="p-8">
                        {/* Number circle */}
                        <motion.div
                          className={`w-14 h-14 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-white font-black text-2xl shadow-lg mb-4 group-hover:scale-110 transition-transform`}
                          initial={{ scale: 0, rotate: -20 }}
                          whileInView={{ scale: 1, rotate: 0 }}
                          transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
                        >
                          {item.step}
                        </motion.div>

                        <h3 className="font-bold text-foreground text-lg mb-3 group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {item.desc}
                        </p>

                        {/* Animated checkmark */}
                        <motion.div
                          className="mt-4 text-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                          initial={{ rotate: 0 }}
                          whileHover={{ rotate: 360 }}
                        >
                          {item.icon}
                        </motion.div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <motion.div variants={fadeUp} className="mt-8 p-5 rounded-2xl bg-muted/50 border border-border/50">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-sm mb-1">Plataforma segura e regulamentada</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Prontuário eletrônico em nuvem, videochamada criptografada, autenticação em múltiplas camadas e conformidade total com a LGPD.
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ==================== BANNER MÉDICO ==================== */}
        <section className="relative overflow-hidden" style={{ minHeight: "320px" }}>
          <img src={bannerDoctor} alt="Médica em teleconsulta" className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent" />
          <div className="container mx-auto px-4 relative flex items-center" style={{ minHeight: "320px" }}>
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="max-w-lg py-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs">Profissionais Qualificados</Badge>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-3">
                Mais de 30 especialidades<br />disponíveis 24h
              </h2>
              <p className="text-white/80 text-sm leading-relaxed mb-5 max-w-md">
                Clínico geral, pediatria, dermatologia, psicologia, cardiologia e muito mais. Médicos com CRM verificado e avaliações reais.
              </p>
              <div className="flex flex-wrap gap-3">
                {["Clínico Geral", "Pediatria", "Dermatologia", "Psicologia", "Cardiologia"].map((spec) => (
                  <span key={spec} className="px-3 py-1 rounded-full bg-white/15 text-white text-xs font-medium backdrop-blur-sm border border-white/10">{spec}</span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-6 px-4">
          <div className="container mx-auto max-w-3xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-xl shadow-primary/20">
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-bold flex items-center gap-2 justify-center sm:justify-start">
                  <Video className="w-5 h-5" /> Marque sua Teleconsulta agora!
                </h3>
                <p className="text-sm opacity-70 mt-1">Atendimento rápido, seguro e sem sair de casa.</p>
              </div>
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-full px-8 font-bold shadow-lg shrink-0" asChild>
                <Link to="/dashboard/schedule?role=patient">Agendar <ArrowRight className="w-4 h-4 ml-1.5" /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Why teleconsulta - BENEFITS FOCUSED */}
        <section className="py-20 bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.div variants={fadeUp} className="text-center mb-16">
                <Badge className="mb-4 text-sm px-4 py-1.5 rounded-full font-semibold bg-primary/10 text-primary border-primary/20">
                  💡 Benefícios Reais
                </Badge>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground text-center mb-4 tracking-tight">
                  Por Que Milhões Escolhem Teleconsulta
                </h2>
                <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto font-medium">
                  Velocidade, segurança e economia que funcionam na prática
                </p>
              </motion.div>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
                {whyReasons.map((r, i) => (
                  <motion.div key={i} variants={fadeUp}>
                    <Card className="h-full border-border/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                      <CardContent className="p-5">
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${r.gradient} flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                          {r.icon}
                        </div>
                        <h3 className="font-bold text-foreground mb-1">{r.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Benefits checklist */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.h2 variants={fadeUp} className="text-3xl font-black text-foreground text-center mb-3 tracking-tight">
                Benefícios da consulta por vídeo
              </motion.h2>
              <motion.p variants={fadeUp} className="text-muted-foreground text-center mb-10">
                Tudo que você precisa, sem sair de casa
              </motion.p>
              <div className="grid sm:grid-cols-2 gap-3">
                {benefits.map((b, i) => (
                  <motion.div key={i} variants={fadeUp} className="card-interactive flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 hover:shadow-lg hover:border-primary/20 transition-all group">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-success to-success/70 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-foreground font-medium">{b}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ==================== BANNER PACIENTE ==================== */}
        <section className="relative overflow-hidden" style={{ minHeight: "320px" }}>
          <img src={bannerPatient} alt="Paciente usando teleconsulta de casa" className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-l from-secondary/90 via-secondary/70 to-transparent" />
          <div className="container mx-auto px-4 relative flex items-center justify-end" style={{ minHeight: "320px" }}>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="max-w-lg py-10 text-right">
              <div className="flex items-center gap-2 mb-4 justify-end">
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs">Conforto de Casa</Badge>
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-3">
                Consulte sem sair<br />do sofá
              </h2>
              <p className="text-white/80 text-sm leading-relaxed mb-5 max-w-md ml-auto">
                Celular, tablet ou computador — é tudo que você precisa. Receitas digitais válidas em todo o Brasil, sem enfrentar trânsito ou filas.
              </p>
              <Button className="bg-white text-secondary hover:bg-white/90 rounded-2xl px-8 font-bold shadow-lg" asChild>
                <Link to="/dashboard/schedule?role=patient">Marcar Consulta <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* CTA Banner 2 */}
        <section className="py-6 px-4">
          <div className="container mx-auto max-w-3xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-secondary to-primary text-primary-foreground shadow-xl shadow-secondary/20">
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-bold">Pronto para sua teleconsulta?</h3>
                <p className="text-sm opacity-70 mt-1">Médicos disponíveis agora. Agende em menos de 2 minutos.</p>
              </div>
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-full px-8 font-bold shadow-lg shrink-0" asChild>
                <Link to="/dashboard/schedule?role=patient">Marcar Agora <ChevronRight className="w-4 h-4 ml-1" /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.h2 variants={fadeUp} className="text-3xl font-black text-foreground text-center mb-12 tracking-tight">
                Perguntas Frequentes
              </motion.h2>
              <div className="space-y-4">
                {faqItems.map((faq, i) => (
                  <motion.div key={i} variants={fadeUp}>
                    <Card className="border-border/50 hover:shadow-lg hover:border-border transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center shrink-0 text-primary">
                            {faq.icon}
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground mb-2">{faq.question}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary mx-auto mb-5 shadow-xl">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-3 tracking-tight">
                Sua saúde na palma da mão
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-8">
                Celular, tablet ou computador com webcam. É tudo que você precisa.
              </p>
              <Button variant="rainbow" size="lg" className="rounded-2xl h-14 px-10 text-base font-bold" asChild>
                <Link to="/dashboard/schedule?role=patient">Marcar Teleconsulta <ArrowRight className="w-5 h-5 ml-2" /></Link>
              </Button>
            </motion.div>
          </div>
        </section>

        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </div>
    </>
  );
};

export default Teleconsulta;
