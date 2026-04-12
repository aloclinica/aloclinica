import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Video, Shield, Clock, MapPin, Heart, Stethoscope, FileText, Smartphone,
  CheckCircle2, ArrowRight, Users, Scale, HelpCircle, ChevronRight, MonitorSmartphone, Phone
} from "lucide-react";
import bannerDoctor from "@/assets/banner-teleconsulta-doctor.jpg";
import bannerPatient from "@/assets/banner-teleconsulta-patient.jpg";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/landing/Header";
import { lazy, Suspense } from "react";
import heroTeleconsulta from "@/assets/hero-teleconsulta.png";

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
    question: "Como o médico faz diagnóstico por vídeo?",
    answer: "A consulta médica é baseada nas queixas e respostas do paciente — a chamada semiologia médica. O exame físico complementa, mas o médico forma sua suspeita durante a anamnese. Para complementar, são solicitados exames que ajudam no diagnóstico.",
  },
  {
    icon: <Scale className="w-5 h-5" />,
    question: "A teleconsulta é legal?",
    answer: "Sim! Regulamentada pela Lei nº 13.989/2020 e autorizada pelo CFM. O uso da telemedicina foi ampliado, permitindo atendimento completo sem necessidade de consulta presencial prévia. O médico deve informar sobre limitações, como a impossibilidade de exame físico.",
  },
  {
    icon: <MonitorSmartphone className="w-5 h-5" />,
    question: "O que preciso para participar?",
    answer: "Apenas um celular, tablet ou computador com webcam. No dia marcado, você e o médico entram numa sala virtual segura e criptografada para o atendimento.",
  },
  {
    icon: <Shield className="w-5 h-5" />,
    question: "Por que optar pela teleconsulta?",
    answer: "É o meio mais seguro de acessar um especialista sem exposição a riscos. Economia real: você paga apenas pelo procedimento, sem custos de deslocamento, estacionamento ou tempo perdido.",
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

        {/* Hero */}
        <section className="relative overflow-hidden mt-[70px]" style={{ minHeight: "55vh" }}>
          <img src={heroTeleconsulta} alt="Teleconsulta" className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/35 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="container mx-auto px-4 relative flex items-end pb-12" style={{ minHeight: "55vh" }}>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-xl">
              <Badge className="mb-3 text-xs px-4 py-1 bg-white/15 text-white border-white/20 backdrop-blur-sm">
                <Video className="w-3 h-3 mr-1" /> Telemedicina
              </Badge>
              <h1 className="text-3xl md:text-5xl font-black text-white mb-3 tracking-tight leading-tight">
                Teleconsulta Médica<br />
                <span className="text-white/85">por Vídeo 24h</span>
              </h1>
              <p className="text-sm text-white/70 max-w-lg mb-6 leading-relaxed">
                Consulte médicos online de qualquer lugar do Brasil. Agendamento fácil, receitas digitais válidas e atendimento seguro.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-3">
                  <Button variant="rainbow" size="default" className="rounded-2xl px-8 font-bold" asChild>
                    <Link to="/dashboard/schedule?role=patient">Marcar Teleconsulta <ArrowRight className="w-4 h-4 ml-2" /></Link>
                  </Button>
                <Button size="default" variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 rounded-2xl px-6 font-semibold" asChild>
                  <Link to="/medico">Sou Médico</Link>
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-6">
                {[
                  { icon: <Shield className="w-3.5 h-3.5" />, label: "LGPD" },
                  { icon: <Video className="w-3.5 h-3.5" />, label: "Vídeo HD" },
                  { icon: <FileText className="w-3.5 h-3.5" />, label: "Receita Digital" },
                  { icon: <Users className="w-3.5 h-3.5" />, label: "30+ Especialidades" },
                ].map((item, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-white/50 text-xs font-medium">{item.icon} {item.label}</span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 relative">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.div variants={fadeUp} className="text-center mb-14 relative">
                <Badge variant="outline" className="mb-3 text-sm px-4 py-1 rounded-full">
                  <HelpCircle className="w-3.5 h-3.5 mr-1.5" /> Entenda
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                  Como funciona a Teleconsulta?
                </h2>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-5">
                {[
                  { step: "01", title: "Agende no Marketplace", desc: "Escolha seu médico por especialidade, avaliação e preço. Agende o melhor horário para você.", icon: <Stethoscope className="w-6 h-6 text-white" />, gradient: "from-primary to-primary/70" },
                  { step: "02", title: "Prepare-se", desc: "Anexe exames, atestados e receitas no seu prontuário digital. O médico terá acesso durante a consulta.", icon: <FileText className="w-6 h-6 text-white" />, gradient: "from-warning to-warning/70" },
                  { step: "03", title: "Entre na sala virtual", desc: "30 min antes, você recebe o link por SMS. Entre na sala de vídeo segura e criptografada.", icon: <Video className="w-6 h-6 text-white" />, gradient: "from-secondary to-secondary/70" },
                ].map((item, i) => (
                  <motion.div key={i} variants={fadeUp}>
                    <Card className="h-full border-border/50 hover:shadow-xl hover:border-border hover:-translate-y-1 transition-all duration-300 group overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                            {item.icon}
                          </div>
                          <span className="text-3xl font-black text-muted-foreground/20">{item.step}</span>
                        </div>
                        <h3 className="font-bold text-foreground text-lg mb-2">{item.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
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

        {/* Why teleconsulta */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-black text-foreground text-center mb-4 tracking-tight">
                Por que usar a Teleconsulta?
              </motion.h2>
              <motion.p variants={fadeUp} className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
                Benefícios reais para sua saúde e seu bolso
              </motion.p>
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
