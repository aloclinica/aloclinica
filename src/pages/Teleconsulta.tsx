import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Video, Shield, Clock, MapPin, Heart, Stethoscope, FileText, Smartphone,
  CheckCircle2, ArrowRight, Users, Scale, HelpCircle, ChevronRight, MonitorSmartphone, Phone,
  Sparkles, Target, TrendingUp, Zap, Star, UserCheck, Receipt
} from "lucide-react";
import bannerDoctor from "@/assets/banner-teleconsulta-doctor.jpg";
import bannerPatient from "@/assets/banner-teleconsulta-patient.jpg";
import { motion } from "framer-motion";
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
  { icon: <MapPin className="w-5 h-5" />, title: "Sem deslocamento", desc: "Atendido por videoconferência no conforto da sua casa." },
  { icon: <Heart className="w-5 h-5" />, title: "Pacientes acamados", desc: "Impossibilidade de ir presencialmente? A teleconsulta resolve." },
  { icon: <Stethoscope className="w-5 h-5" />, title: "Telemonitoramento", desc: "Acompanhamento contínuo de pacientes crônicos à distância." },
  { icon: <Clock className="w-5 h-5" />, title: "Redução de custos", desc: "Economia de tempo e dinheiro para médico e paciente." },
  { icon: <CheckCircle2 className="w-5 h-5" />, title: "Comodidade", desc: "Revisões e retornos sem necessidade de presença física." },
  { icon: <Receipt className="w-5 h-5" />, title: "Receita digital", desc: "Prescrições válidas em qualquer farmácia do Brasil." },
];

const benefits = [
  { text: "Atendido no conforto do seu lar", icon: <Heart className="w-4 h-4" /> },
  { text: "Qualquer especialidade, em qualquer lugar do Brasil", icon: <MapPin className="w-4 h-4" /> },
  { text: "Tire dúvidas com mais de um especialista", icon: <Users className="w-4 h-4" /> },
  { text: "Convide parentes para a mesma videoconferência", icon: <MonitorSmartphone className="w-4 h-4" /> },
  { text: "Use em viagens pelo Brasil e exterior", icon: <Sparkles className="w-4 h-4" /> },
  { text: "Atualize receitas e atestados sem sair de casa", icon: <FileText className="w-4 h-4" /> },
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
    answer: "100% legal! Lei 13.989/2020, autorizado pelo CFM, regulado por CREMESP e LGPD. Você tem os mesmos direitos que em consulta presencial. Médicos são verificados a cada atendimento.",
  },
  {
    icon: <Smartphone className="w-5 h-5" />,
    question: "Preciso de setup especial? Conexão super rápida?",
    answer: "Não! Celular + wifi comum é suficiente. Testamos com 3G e funciona (vídeo fica menor, mas consulta rola). Baixe nosso app ou use pelo navegador. 1min de setup.",
  },
  {
    icon: <Shield className="w-5 h-5" />,
    question: "Meus dados estão seguros com vocês?",
    answer: "Sim. Criptografia AES-256 (o mesmo padrão dos bancos), backup automático, auditoria 24/7. Apenas você e o médico veem seus dados. Zero publicidade com seus dados. Conformidade total LGPD.",
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    question: "Vale mesmo a pena? É mais barato?",
    answer: "Sim em 3 aspectos: (1) Não gasta com deslocamento/estacionamento. (2) Ganha tempo (não perde 2h em trânsito). (3) Preço igual/menor que presencial e 24h disponível.",
  },
];

const stats = [
  { value: "12k+", label: "Pacientes atendidos", icon: <Users className="w-5 h-5" /> },
  { value: "4.9", label: "Avaliação média", icon: <Star className="w-5 h-5" /> },
  { value: "30+", label: "Especialidades", icon: <Stethoscope className="w-5 h-5" /> },
  { value: "<15min", label: "Tempo médio", icon: <Clock className="w-5 h-5" /> },
];

const Teleconsulta = () => {
  return (
    <>
      <SEOHead
        title="Teleconsulta Médica Online | AloClinica"
        description="Consulte médicos online por vídeo 24h. Entenda como funciona a teleconsulta, benefícios, legalidade e como agendar."
      />
      <div className="min-h-screen relative">
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-muted/30 via-background to-muted/20 dark:from-background dark:via-background dark:to-muted/5" />
        <Header />

        {/* ═══════════════ HERO ═══════════════ */}
        <section className="relative mt-[70px] overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.06),transparent_60%)]" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          <div className="container mx-auto px-4 py-16 md:py-20 lg:py-28 relative z-10">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              {/* Left — Text */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-xl"
              >
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-6"
                >
                  <Badge variant="outline" className="px-4 py-1.5 text-xs font-semibold rounded-full border-primary/30 text-primary bg-primary/5">
                    <Video className="w-3.5 h-3.5 mr-1.5" /> Telemedicina por vídeo
                  </Badge>
                </motion.div>

                <motion.h1
                  className="text-4xl md:text-5xl lg:text-[3.5rem] font-black text-foreground leading-[1.08] tracking-tight mb-6"
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
                    className="rounded-xl px-10 h-14 font-bold text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
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
                    className="rounded-xl px-8 h-14 font-bold text-base border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
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
                  className="flex flex-wrap items-center gap-5 mt-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.55 }}
                >
                  {[
                    { icon: <Shield className="w-4 h-4 text-primary" />, label: "Conforme LGPD" },
                    { icon: <Video className="w-4 h-4 text-primary" />, label: "Vídeo HD criptografado" },
                    { icon: <FileText className="w-4 h-4 text-primary" />, label: "Receita digital válida" },
                  ].map((item, i) => (
                    <span key={i} className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                      {item.icon} {item.label}
                    </span>
                  ))}
                </motion.div>
              </motion.div>

              {/* Right — Pingo in phone */}
              <motion.div
                className="flex items-center justify-center lg:justify-end"
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.7, type: "spring", stiffness: 100 }}
              >
                <div className="relative w-[280px] md:w-[380px] lg:w-[440px]">
                  <img
                    src={heroTeleconsultaPhone}
                    alt="Pingo — seu assistente de teleconsulta saindo do celular"
                    width={1024}
                    height={1024}
                    className="w-full h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.12)]"
                  />
                  {/* Floating badge - top left */}
                  <motion.div
                    className="absolute top-6 -left-2 md:top-10 md:-left-6 bg-card/95 backdrop-blur-sm border border-border rounded-2xl px-4 py-2.5 shadow-xl flex items-center gap-2.5"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Clock className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground leading-none mb-0.5">24h por dia</p>
                      <p className="text-[10px] text-muted-foreground leading-none">Inclusive feriados</p>
                    </div>
                  </motion.div>

                  {/* Floating badge - bottom right */}
                  <motion.div
                    className="absolute bottom-10 -right-2 md:bottom-14 md:-right-6 bg-card/95 backdrop-blur-sm border border-border rounded-2xl px-4 py-2.5 shadow-xl flex items-center gap-2.5"
                    animate={{ y: [0, 6, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  >
                    <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center">
                      <UserCheck className="w-4.5 h-4.5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground leading-none mb-0.5">CRM verificado</p>
                      <p className="text-[10px] text-muted-foreground leading-none">30+ especialidades</p>
                    </div>
                  </motion.div>

                  {/* Floating mini badge - rating */}
                  <motion.div
                    className="absolute top-1/2 -right-3 md:-right-10 bg-card/95 backdrop-blur-sm border border-border rounded-xl px-3 py-2 shadow-lg flex items-center gap-1.5"
                    animate={{ y: [0, 4, 0] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  >
                    <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                    <span className="text-xs font-bold text-foreground">4.9</span>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══════════════ STATS BAR ═══════════════ */}
        <section className="border-y border-border bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
              {stats.map((s, i) => (
                <motion.div
                  key={i}
                  className="py-6 md:py-8 text-center"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-primary">{s.icon}</span>
                    <span className="text-2xl md:text-3xl font-black text-foreground">{s.value}</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════ COMO FUNCIONA ═══════════════ */}
        <section className="py-20 relative">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.div variants={fadeUp} className="text-center mb-14">
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
              <motion.div className="hidden md:block mb-10 relative h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary via-secondary to-primary rounded-full"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.3 }}
                  style={{ originX: 0 }}
                />
              </motion.div>

              <div className="grid md:grid-cols-3 gap-5">
                {[
                  { step: "1", title: "Escolha seu Médico", desc: "Veja fotos, especializações, avaliações reais e preços. Escolha quem você quer consultar.", emoji: "🔍" },
                  { step: "2", title: "Agende sem Fila", desc: "Escolha o horário que funciona pra você. Receba confirmação por SMS e e-mail.", emoji: "⏰" },
                  { step: "3", title: "Consulte Agora", desc: "Videochamada criptografada. Médico vê seu histórico. Receita na hora. Pronto!", emoji: "✅" },
                ].map((item, i) => (
                  <motion.div key={i} variants={fadeUp} whileHover={{ y: -6 }} className="relative">
                    <Card className="h-full border-border/50 hover:shadow-xl hover:border-primary/20 transition-all duration-300 group overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <CardContent className="p-7">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          {item.step}
                        </div>
                        <h3 className="font-bold text-foreground text-lg mb-2 group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <motion.div variants={fadeUp} className="mt-6 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Shield className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">Plataforma segura e regulamentada</span> — Prontuário em nuvem, criptografia de ponta e conformidade total com LGPD.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════ BANNER MÉDICO ═══════════════ */}
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
              <div className="flex flex-wrap gap-2">
                {["Clínico Geral", "Pediatria", "Dermatologia", "Psicologia", "Cardiologia"].map((spec) => (
                  <span key={spec} className="px-3 py-1 rounded-full bg-white/15 text-white text-xs font-medium backdrop-blur-sm border border-white/10">{spec}</span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════ CTA BANNER ═══════════════ */}
        <section className="py-6 px-4">
          <div className="container mx-auto max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-xl shadow-primary/20"
            >
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-bold flex items-center gap-2 justify-center sm:justify-start">
                  <Video className="w-5 h-5" /> Marque sua Teleconsulta agora!
                </h3>
                <p className="text-sm opacity-70 mt-1">Atendimento rápido, seguro e sem sair de casa.</p>
              </div>
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-full px-8 font-bold shadow-lg shrink-0" asChild>
                <Link to="/dashboard/schedule?role=patient">Agendar <ArrowRight className="w-4 h-4 ml-1.5" /></Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════ POR QUE TELECONSULTA ═══════════════ */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-5xl">
            <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.div variants={fadeUp} className="text-center mb-14">
                <Badge className="mb-4 text-sm px-4 py-1.5 rounded-full font-semibold bg-primary/10 text-primary border-primary/20">
                  💡 Benefícios Reais
                </Badge>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight mb-3">
                  Por Que Milhões Escolhem Teleconsulta
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Velocidade, segurança e economia que funcionam na prática
                </p>
              </motion.div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {whyReasons.map((r, i) => (
                  <motion.div key={i} variants={fadeUp}>
                    <Card className="h-full border-border/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                      <CardContent className="p-5">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
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

        {/* ═══════════════ CHECKLIST ═══════════════ */}
        <section className="py-20 bg-muted/30 dark:bg-muted/10">
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
                  <motion.div key={i} variants={fadeUp} className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 hover:shadow-md hover:border-primary/20 transition-all group">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {b.icon}
                    </div>
                    <span className="text-sm text-foreground font-medium">{b.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════ BANNER PACIENTE ═══════════════ */}
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

        {/* ═══════════════ FAQ ═══════════════ */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.div variants={fadeUp} className="text-center mb-12">
                <Badge variant="outline" className="mb-4 text-sm px-4 py-1.5 rounded-full font-semibold">
                  <HelpCircle className="w-3.5 h-3.5 mr-2" /> Tire suas dúvidas
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                  Perguntas Frequentes
                </h2>
              </motion.div>
              <div className="space-y-3">
                {faqItems.map((faq, i) => (
                  <motion.div key={i} variants={fadeUp}>
                    <Card className="border-border/50 hover:shadow-md hover:border-primary/15 transition-all">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                            {faq.icon}
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground mb-2 text-[15px]">{faq.question}</h3>
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

        {/* ═══════════════ FINAL CTA ═══════════════ */}
        <section className="py-20 bg-muted/20 dark:bg-muted/5">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mx-auto mb-5">
                <Smartphone className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-3 tracking-tight">
                Sua saúde na palma da mão
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-8">
                Celular, tablet ou computador com webcam. É tudo que você precisa para consultar agora.
              </p>
              <Button size="lg" className="rounded-xl h-14 px-10 text-base font-bold shadow-lg shadow-primary/20" asChild>
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
