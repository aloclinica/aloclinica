import { lazy } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChatsCircle, ArrowRight, ShieldCheck, FileText, Clock, Lock } from "@phosphor-icons/react";
import Header from "@/components/landing/Header";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";

const Footer = lazy(() => import("@/components/landing/Footer"));

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true } as const,
};

const trustPoints = [
  { icon: ShieldCheck, title: "Médicos verificados no CFM", desc: "Todos os profissionais têm registro ativo confirmado no Conselho Federal de Medicina." },
  { icon: FileText, title: "Receita digital válida", desc: "Prescrições com assinatura ICP-Brasil, aceitas em farmácias de todo o Brasil." },
  { icon: Clock, title: "Atendimento 24h", desc: "Consultas por vídeo em HD a qualquer hora, todos os dias da semana." },
  { icon: Lock, title: "Conformidade com a LGPD", desc: "Seus dados são protegidos com criptografia e tratados conforme a legislação brasileira." },
];

const Depoimentos = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-background">
      <SEOHead
        title="Depoimentos | AloClínica"
        description="Avaliações verificadas de pacientes da AloClínica e os pontos que tornam o atendimento seguro e confiável."
        canonical="https://aloclinica.com.br/sobre/depoimentos"
      />
      <Header />

      {/* HERO */}
      <section className="pt-32 pb-12 md:pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-5">
              <ChatsCircle className="w-3.5 h-3.5" weight="fill" /> Depoimentos
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold leading-[1.08] mb-5">
              A opinião de quem <span className="text-gradient">nos conhece</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Estamos começando a reunir avaliações verificadas de pacientes. À medida que a
              plataforma cresce, os depoimentos reais aparecerão aqui — sem edição e sem invenção.
            </p>
          </motion.div>
        </div>
      </section>

      {/* AVISO / EM BREVE */}
      <section className="px-4 pb-4">
        <div className="max-w-3xl mx-auto rounded-2xl border border-border bg-card p-6 sm:p-8 text-center shadow-sm">
          <ChatsCircle className="w-10 h-10 text-primary mx-auto mb-4" weight="fill" />
          <h2 className="text-xl sm:text-2xl font-extrabold mb-2">Avaliações verificadas em breve</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Publicamos apenas depoimentos de pacientes reais que autorizaram o compartilhamento.
            Enquanto reunimos essas avaliações, conheça abaixo os pontos que sustentam a confiança
            no nosso atendimento.
          </p>
        </div>
      </section>

      {/* PONTOS DE CONFIANÇA */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div className="text-center mb-10" {...fadeUp}>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">Por que confiar na AloClínica</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Fatos verificáveis sobre como cuidamos de você.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {trustPoints.map((item, i) => (
              <motion.div
                key={i}
                {...fadeUp}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-4 p-6 rounded-2xl border border-border bg-card hover:border-primary/30 hover:-translate-y-1 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-6 h-6 text-primary" weight="fill" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp} className="relative rounded-3xl overflow-hidden bg-gradient-hero p-10 sm:p-14 text-center shadow-elevated">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary-foreground)/0.22),transparent_38%)]" />
            <div className="relative z-10">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-primary-foreground mb-3">
                Cuide da sua saúde com quem leva a sério
              </h3>
              <p className="text-primary-foreground/85 max-w-xl mx-auto mb-6">
                Agende uma consulta com médicos verificados, quando você precisar.
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

export default Depoimentos;
