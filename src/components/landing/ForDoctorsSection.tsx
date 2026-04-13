import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Stethoscope, CurrencyDollar, CalendarBlank, Globe, ShieldCheck, ArrowRight, ChartLineUp } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";

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

const stats = [
  { value: "500+", label: "Médicos ativos" },
  { value: "30+", label: "Especialidades" },
  { value: "R$3k+", label: "Renda média/mês" },
  { value: "4.9★", label: "Satisfação média" },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const ForDoctorsSection = forwardRef<HTMLElement>((_, ref) => {
  const navigate = useNavigate();

  return (
    <section
      ref={ref}
      id="para-medicos"
      aria-labelledby="doctors-heading"
      className="py-20 md:py-28 px-4 bg-gradient-to-b from-muted/30 to-background overflow-hidden"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left: content */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
              Para Médicos
            </span>
            <h2 id="doctors-heading" className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground leading-tight tracking-tight mb-4">
              Atenda mais, trabalhe{" "}
              <span className="text-primary">de onde quiser</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
              Junte-se a mais de 500 médicos que já expandiram sua prática com telemedicina. Cadastro gratuito, aprovação em até 24h.
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, scale: 0.85 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
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
                onClick={() => navigate("/medico")}
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
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
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
  );
});

ForDoctorsSection.displayName = "ForDoctorsSection";
export default ForDoctorsSection;
