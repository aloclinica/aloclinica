import { lazy } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Heart, Target, Eye, ArrowRight, Users, Sparkle, Rocket, Buildings, ChartLineUp, Trophy } from "@phosphor-icons/react";
import Header from "@/components/landing/Header";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import heroDoctor from "@/assets/hero-doctor.png";

const Footer = lazy(() => import("@/components/landing/Footer"));

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true } as const,
};

const timeline = [
  { year: "2022", title: "O começo", desc: "Nascemos com uma missão clara: levar saúde de qualidade a quem mora longe dos grandes centros.", icon: Sparkle },
  { year: "2023", title: "Primeira escala", desc: "Atingimos 10 mil consultas e expandimos para 30+ especialidades médicas.", icon: Rocket },
  { year: "2024", title: "Crescimento B2B", desc: "Lançamento da Saúde Corporativa e parcerias com 100+ clínicas em todo Brasil.", icon: Buildings },
  { year: "2025", title: "Líder regional", desc: "Mais de 100 mil pacientes atendidos, 500+ médicos verificados e 4.9★ de satisfação.", icon: Trophy },
];

const QuemSomos = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-background">
      <SEOHead
        title="Quem Somos | AloClínica"
        description="Conheça a história, missão, visão e valores da AloClínica — saúde digital acessível para todos os brasileiros."
        canonical="https://aloclinica.com.br/sobre/quem-somos"
      />
      <Header />

      {/* HERO */}
      <section className="pt-32 pb-16 md:pb-24 px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-5">
              <Users className="w-3.5 h-3.5" weight="fill" /> Quem Somos
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.08] mb-6">
              Tecnologia e cuidado <span className="text-gradient">a serviço da vida</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mb-8">
              A AloClínica nasceu para democratizar o acesso à saúde de qualidade no Brasil.
              Conectamos pacientes e médicos por meio de uma plataforma segura, acessível e humanizada.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="rounded-2xl h-[54px] px-8 gap-2 group" onClick={() => navigate("/agendar")}>
                Agendar Consulta
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" weight="bold" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-2xl h-[54px] px-8 border-2" onClick={() => navigate("/sobre/porque-nos")}>
                Por que nós
              </Button>
            </div>
          </motion.div>

          <motion.div className="relative flex justify-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] to-secondary/[0.05] blur-[80px] rounded-full scale-90 -z-10" />
            <img src={heroDoctor} alt="Médico AloClínica" width={500} height={500} className="w-full max-w-[420px] lg:max-w-[480px] drop-shadow-2xl relative z-10" />
          </motion.div>
        </div>
      </section>

      {/* MISSÃO / VISÃO / VALORES */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-12" {...fadeUp}>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">Nossa essência</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Os princípios que orientam cada decisão e atendimento.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Target, label: "Missão", text: "Democratizar o acesso à saúde de qualidade através de telemedicina segura e acessível." },
              { icon: Eye, label: "Visão", text: "Ser a plataforma de saúde digital mais confiável e utilizada no Brasil." },
              { icon: Heart, label: "Valores", text: "Empatia, ética, inovação e cuidado humanizado em cada atendimento." },
            ].map((item, i) => (
              <motion.div
                key={i}
                {...fadeUp}
                transition={{ delay: i * 0.1 }}
                className="relative p-8 rounded-2xl border border-border bg-background hover:border-primary/30 hover:-translate-y-1 transition-all overflow-hidden"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <item.icon className="w-7 h-7 text-primary" weight="fill" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.label}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HISTÓRIA RESUMIDA */}
      <section className="py-20 md:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-5">
              <Sparkle className="w-3.5 h-3.5" weight="fill" /> Nossa História
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-6">
              Saúde sem barreiras, do primeiro clique ao cuidado contínuo
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Acreditamos que tecnologia bem aplicada salva tempo — e vidas. Por isso construímos uma
              plataforma que une médicos verificados, prontuário digital, prescrição válida em todo o
              Brasil e total conformidade com a LGPD e o CFM. Tudo isso com a simplicidade que o paciente
              precisa e a robustez que o profissional merece.
            </p>
          </motion.div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <motion.div className="text-center mb-12" {...fadeUp}>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4">
              <ChartLineUp className="w-3.5 h-3.5" weight="fill" /> Nossa Trajetória
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">Marcos que nos definem</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Cada etapa da nossa jornada nos aproxima do nosso propósito.
            </p>
          </motion.div>

          <div className="relative">
            {/* Linha vertical */}
            <div className="absolute left-[19px] sm:left-1/2 sm:-translate-x-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />

            <div className="space-y-10">
              {timeline.map((item, i) => (
                <motion.div
                  key={item.year}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.12, duration: 0.55 }}
                  className={`relative pl-14 sm:pl-0 sm:grid sm:grid-cols-2 sm:gap-8 sm:items-center ${
                    i % 2 === 0 ? "" : "sm:[&>*:first-child]:order-2"
                  }`}
                >
                  <div className={`${i % 2 === 0 ? "sm:text-right sm:pr-10" : "sm:pl-10"}`}>
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-lg hover:border-primary/40 transition-all">
                      <div className="flex items-center gap-2 mb-2 sm:justify-start">
                        <span className="text-xs font-bold uppercase tracking-widest text-primary">{item.year}</span>
                      </div>
                      <h3 className="text-lg font-extrabold text-foreground mb-1.5">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                  {/* Ícone central */}
                  <div className="absolute left-0 top-5 sm:left-1/2 sm:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground flex items-center justify-center shadow-lg ring-4 ring-background z-10">
                    <item.icon className="w-5 h-5" weight="fill" />
                  </div>
                  <div className="hidden sm:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MÉTRICAS DE IMPACTO */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { metric: "100k+", label: "Pacientes atendidos" },
            { metric: "500+", label: "Médicos verificados" },
            { metric: "30+", label: "Especialidades" },
            { metric: "4.9★", label: "Avaliação média" },
          ].map((item, i) => (
            <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.08 }} className="p-4">
              <div className="text-3xl sm:text-4xl font-extrabold text-primary mb-1">{item.metric}</div>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp} className="relative rounded-3xl overflow-hidden bg-gradient-hero p-10 sm:p-14 text-center shadow-elevated">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary-foreground)/0.22),transparent_38%)]" />
            <div className="relative z-10">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-primary-foreground mb-3">
                Comece a cuidar da sua saúde hoje
              </h3>
              <p className="text-primary-foreground/85 max-w-xl mx-auto mb-6">
                Agende em poucos minutos com médicos verificados.
              </p>
              <Button size="lg" className="bg-background text-primary hover:bg-background/95 rounded-2xl px-8 gap-2 font-extrabold" onClick={() => navigate("/agendar")}>
                Agendar Consulta <ArrowRight className="w-5 h-5" weight="bold" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default QuemSomos;
