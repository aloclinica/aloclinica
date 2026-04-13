import { forwardRef, lazy } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, ArrowRight, Heart, Eye, Target, Users, Lightning, Lock } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/landing/Header";
import SEOHead from "@/components/SEOHead";

const Footer = lazy(() => import("@/components/landing/Footer"));

const values = [
  {
    icon: Heart,
    title: "Cuidado em Primeiro",
    desc: "Cada decisão é guiada pelo bem-estar do paciente e qualidade do atendimento.",
  },
  {
    icon: Lightning,
    title: "Inovação Contínua",
    desc: "Tecnologia de ponta para tornar saúde acessível, rápida e confiável.",
  },
  {
    icon: Lock,
    title: "Segurança Total",
    desc: "Conformidade com LGPD, CFM e padrões internacionais de privacidade.",
  },
  {
    icon: Users,
    title: "Inclusão & Acesso",
    desc: "Saúde de qualidade para todos, independente de localização ou condição econômica.",
  },
];

const timeline = [
  { year: "2020", event: "Fundação da AloClínica", desc: "Nasce a missão de democratizar acesso à saúde." },
  { year: "2021", event: "Primeiro Telemedicina Launch", desc: "Plataforma de teleconsulta com 100+ médicos." },
  { year: "2022", event: "Módulo de Oftalmologia", desc: "Lançamento completo com exames e receitas de óculos." },
  { year: "2023", event: "Solução B2B Telelaudo", desc: "Laudos a distância com IA para clínicas." },
  { year: "2024", event: "500+ Profissionais Ativos", desc: "Crescimento exponencial e expansão de serviços." },
  { year: "2025", event: "Visão 2030", desc: "Plataforma completa de saúde digital para Brasil." },
];

const team = [
  { name: "Dr. Carlos Silva", role: "Fundador & CEO", area: "Cardiologia, Gestão" },
  { name: "Dra. Marina Santos", role: "CTO", area: "Tecnologia, IA em Saúde" },
  { name: "Pedro Costa", role: "COO", area: "Operações, Compliance" },
  { name: "Juliana Oliveira", role: "CMO", area: "Marketing, Crescimento" },
];

const Sobre = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();

  return (
    <div ref={ref} className="relative min-h-screen bg-background">
      <div className="absolute inset-0 -z-10 bg-[image:var(--landing-bg)] pointer-events-none" />

      <SEOHead
        title="Sobre AloClínica - Saúde Digital para Todos"
        description="Conheça a missão de revolucionar acesso à saúde no Brasil. Tecnologia, segurança e cuidado em primeiro lugar."
        canonical="https://aloclinica.com.br/sobre"
      />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
              Nossa História
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-6">
              Saúde Digital para <span className="text-primary">Todos</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              AloClínica nasceu com a missão simples mas ambiciosa: transformar acesso à saúde no Brasil através de tecnologia segura, acessível e centrada no paciente.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                label: "Missão",
                icon: Target,
                text: "Democratizar acesso à saúde de qualidade através de telemedicina segura, rápida e acessível.",
              },
              {
                label: "Visão",
                icon: Eye,
                text: "Ser a plataforma de saúde digital mais confiável e usada no Brasil até 2030.",
              },
              {
                label: "Compromisso",
                icon: Heart,
                text: "Colocar cuidado, segurança e inovação no centro de cada decisão.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-8 rounded-2xl border border-border bg-background"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-primary" weight="fill" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{item.label}</h3>
                <p className="text-muted-foreground">{item.text}</p>
              </motion.div>
            ))}
          </div>

          {/* Values Grid */}
          <div className="mt-20">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground text-center mb-12">
              Nossos Valores
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <value.icon className="w-5 h-5 text-primary" weight="fill" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-4">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground text-center mb-16">
            Nossa Trajetória
          </h2>

          <div className="max-w-3xl mx-auto">
            {timeline.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative pl-8 pb-12 last:pb-0"
              >
                <div className="absolute left-0 top-2 w-4 h-4 rounded-full bg-primary border-4 border-background" />
                {i < timeline.length - 1 && (
                  <div className="absolute left-[7px] top-8 w-0.5 h-16 bg-border" />
                )}

                <div className="p-6 rounded-xl border border-border bg-card">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-lg font-extrabold text-primary">{item.year}</span>
                    <h3 className="text-lg font-semibold text-foreground">{item.event}</h3>
                  </div>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground text-center mb-12">
            Liderança Dedicada
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {team.map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-6 rounded-xl border border-border bg-background"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary" weight="fill" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{member.name}</h3>
                <p className="text-sm text-primary font-medium mb-2">{member.role}</p>
                <p className="text-xs text-muted-foreground">{member.area}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { metric: "500+", label: "Profissionais de Saúde" },
              { metric: "100k+", label: "Pacientes Ativos" },
              { metric: "30+", label: "Especialidades" },
              { metric: "24h", label: "Suporte Disponível" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-3xl sm:text-4xl font-extrabold text-primary mb-2">{item.metric}</div>
                <p className="text-muted-foreground text-sm">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance & Trust */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground text-center mb-12">
            Segurança & Conformidade
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {[
              { title: "LGPD", desc: "Proteção de dados pessoais em conformidade total com legislação brasileira." },
              { title: "CFM Regulado", desc: "Aprovado e regulado pelo Conselho Federal de Medicina." },
              { title: "Encriptação", desc: "Criptografia de ponta a ponta em todas as comunicações." },
              { title: "Backup 24/7", desc: "Redundância de sistemas e backup automático contínuo." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-xl border border-border bg-background"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Check className="w-5 h-5 text-primary" weight="bold" />
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
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
                  Quer fazer parte dessa revolução?
                </h2>
                <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
                  Pacientes, médicos e empresas — juntos transformando saúde no Brasil.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="bg-background text-primary hover:bg-background/95 rounded-2xl px-8 gap-2.5 font-extrabold"
                  onClick={() => navigate("/paciente/cadastro")}
                >
                  Comece como Paciente
                  <ArrowRight className="w-5 h-5" weight="bold" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-2xl px-8 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 font-extrabold"
                  onClick={() => navigate("/para-medicos")}
                >
                  Seja Médico Parceiro
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
});

Sobre.displayName = "Sobre";
export default Sobre;
