import { motion } from "framer-motion";
import { Smartphone, Wifi, FileText, Clock, Pill, ShieldCheck } from "lucide-react";

const steps = [
  {
    icon: Smartphone,
    title: "Celular ou computador",
    description: "Acesse pelo app ou site. Funciona em qualquer dispositivo com internet.",
  },
  {
    icon: Wifi,
    title: "Conexão estável",
    description: "Use Wi-Fi ou dados móveis 4G/5G. Não precisa instalar nada.",
  },
  {
    icon: Clock,
    title: "Atendimento 24 horas",
    description: "Plantão clínico disponível todos os dias, inclusive feriados.",
  },
  {
    icon: FileText,
    title: "Documentos digitais",
    description: "Receba atestados, receitas e pedidos de exames com validade legal.",
  },
  {
    icon: Pill,
    title: "Farmácias parceiras",
    description: "Apresente a receita digital em qualquer farmácia do Brasil.",
  },
  {
    icon: ShieldCheck,
    title: "100% seguro e sigiloso",
    description: "Seus dados são criptografados. Atendimento segue o CFM e a LGPD.",
  },
];

const ConsultaInfoBanner = () => {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-b from-[#F8FAFC] to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary bg-primary/5 px-4 py-2 rounded-full mb-4">
            <Smartphone className="w-3.5 h-3.5" /> COMO FUNCIONA
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground leading-tight">
            Sua consulta <span className="text-primary">na palma da mão</span>
          </h2>
          <p className="text-muted-foreground text-lg mt-4 max-w-2xl mx-auto">
            Tudo que você precisa para cuidar da sua saúde, sem sair de casa. Rápido, fácil e seguro.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="group relative flex flex-col items-start p-6 rounded-2xl bg-card border border-border/60 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white text-primary transition-colors">
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <h3 className="font-bold text-foreground text-lg mb-1.5">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ConsultaInfoBanner;
