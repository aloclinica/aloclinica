import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Eye, Shield, Clock, CheckCircle2, ArrowRight, FileText, Smartphone,
  Stethoscope, Users, HelpCircle
} from "lucide-react";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/landing/Header";
import { lazy, Suspense } from "react";

const Footer = lazy(() => import("@/components/landing/Footer"));

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};
const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const services = [
  { icon: <Eye className="w-5 h-5 text-white" />, title: "Exames Oftalmológicos", desc: "Refração, tonometria, fundo de olho e mais — tudo digital.", gradient: "from-primary to-primary/70" },
  { icon: <FileText className="w-5 h-5 text-white" />, title: "Receitas Especializadas", desc: "Receitas para óculos e lentes de contato com prescrição completa OD/OE.", gradient: "from-secondary to-secondary/70" },
  { icon: <Stethoscope className="w-5 h-5 text-white" />, title: "Fila de Exames Inteligente", desc: "Gerencie exames pendentes, em andamento e finalizados em tempo real.", gradient: "from-destructive to-destructive/70" },
  { icon: <Shield className="w-5 h-5 text-white" />, title: "Laudos com Assinatura Digital", desc: "Laudos oftalmológicos com validade jurídica e verificação por QR Code.", gradient: "from-warning to-warning/70" },
  { icon: <Smartphone className="w-5 h-5 text-white" />, title: "Teste de Acuidade Visual", desc: "Teste de Snellen digital para triagem rápida do paciente.", gradient: "from-primary to-secondary" },
];

const benefits = [
  "Atendimento oftalmológico completo e digital",
  "Prescrição de óculos e lentes de contato com campos OD/OE",
  "Medição de PIO (Pressão Intraocular) integrada",
  "Fila de exames com prioridade e SLA",
  "Laudos com IA sugestiva para agilizar diagnósticos",
  "Teste de acuidade visual para pacientes online",
];

const steps = [
  { step: "01", title: "Cadastre-se como Oftalmologista", desc: "Crie sua conta com CRM e RQE para acessar o painel especializado." },
  { step: "02", title: "Receba exames na fila", desc: "Exames chegam automaticamente na fila com dados do paciente e imagens." },
  { step: "03", title: "Emita laudos e receitas", desc: "Gere laudos assinados digitalmente e receitas para óculos/lentes." },
];

const faqs = [
  { q: "Quais exames posso realizar na plataforma?", a: "Refração, tonometria, fundo de olho, campimetria, topografia e mais. Todos com campos específicos para oftalmologia." },
  { q: "As receitas seguem o padrão do CRM?", a: "Sim. As receitas incluem campos OD/OE, eixo, cilindro, esférico, adição e DNP conforme normas do CFM." },
  { q: "Posso usar IA para sugerir laudos?", a: "Sim, o sistema utiliza IA para sugerir textos de laudo com base nos dados do exame, agilizando a emissão." },
  { q: "Os laudos têm validade jurídica?", a: "Sim. Todos os laudos são assinados digitalmente com ICP-Brasil e possuem verificação por QR Code." },
];

export default function Oftalmologia() {
  return (
    <>
      <SEOHead
        title="Oftalmologia Digital | AloClínica"
        description="Plataforma completa para oftalmologistas: exames, laudos, receitas para óculos e lentes de contato com assinatura digital."
      />
      <Header />

      <main className="min-h-screen bg-background pt-14">
        {/* Hero */}
        <section className="relative overflow-hidden py-16 md:py-24 lg:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-center max-w-3xl mx-auto"
            >
              <Badge variant="secondary" className="mb-4 text-xs font-semibold px-3 py-1">
                <Eye className="w-3.5 h-3.5 mr-1.5" /> Módulo Oftalmologia
              </Badge>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
                Oftalmologia Digital{" "}
                <span className="text-primary">Completa</span>
              </h1>
              <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Exames, laudos e receitas para óculos e lentes de contato — tudo em uma plataforma integrada com IA e assinatura digital.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                <Button size="lg" className="rounded-full gap-2 font-semibold shadow-lg" asChild>
                  <Link to="/oftalmologista">
                    <Eye className="w-4 h-4" /> Cadastrar como Oftalmologista
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-full gap-2 font-semibold" asChild>
                  <Link to="/paciente">
                    <Users className="w-4 h-4" /> Sou Paciente
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Services */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={container} className="text-center mb-12">
              <motion.h2 variants={fadeUp} className="text-2xl sm:text-3xl font-bold text-foreground">
                Recursos Especializados
              </motion.h2>
              <motion.p variants={fadeUp} className="text-muted-foreground mt-2 max-w-xl mx-auto">
                Ferramentas projetadas exclusivamente para oftalmologistas
              </motion.p>
            </motion.div>
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={container} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.map((s) => (
                <motion.div key={s.title} variants={fadeUp}>
                  <Card className="card-interactive border-border hover:border-primary/30 h-full">
                    <CardContent className="pt-6 pb-5">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-4`}>
                        {s.icon}
                      </div>
                      <h3 className="font-semibold text-foreground text-sm">{s.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{s.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={container} className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div variants={fadeUp}>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
                  Tudo que você precisa para atender em oftalmologia
                </h2>
                <ul className="space-y-3">
                  {benefits.map((b) => (
                    <li key={b} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground">{b}</span>
                    </li>
                  ))}
                </ul>
                <Button className="mt-8 rounded-full gap-2 font-semibold" asChild>
                  <Link to="/oftalmologista">
                    Começar agora <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div variants={fadeUp} className="bg-muted/40 rounded-2xl p-8 border border-border">
                <div className="space-y-6">
                  {steps.map((s) => (
                    <div key={s.step} className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">{s.step}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-sm">{s.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={container}>
              <motion.h2 variants={fadeUp} className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-10">
                <HelpCircle className="w-6 h-6 inline-block mr-2 text-primary" />
                Perguntas Frequentes
              </motion.h2>
              <div className="space-y-4">
                {faqs.map((faq) => (
                  <motion.div key={faq.q} variants={fadeUp}>
                    <Card className="border-border">
                      <CardContent className="pt-5 pb-4">
                        <h3 className="font-semibold text-foreground text-sm mb-1.5">{faq.q}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 rounded-2xl p-8 md:p-12 border border-primary/10"
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                Comece a atender em oftalmologia digital
              </h2>
              <p className="text-muted-foreground text-sm max-w-xl mx-auto mb-6">
                Cadastre-se gratuitamente e acesse a plataforma completa para oftalmologistas.
              </p>
              <Button size="lg" className="rounded-full gap-2 font-semibold shadow-lg" asChild>
                <Link to="/oftalmologista">
                  <Eye className="w-4 h-4" /> Criar Conta de Oftalmologista
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </main>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </>
  );
}
