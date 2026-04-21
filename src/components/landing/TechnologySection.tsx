import { motion } from "framer-motion";
import { Video, ShieldCheck, Cpu, Lock } from "lucide-react";
import technologyDoctor from "@/assets/technology-doctor.png";

const TechnologySection = () => {
  const features = [
    {
      icon: <Video className="w-5 h-5 text-primary" />,
      title: "Videochamada em HD",
      description: "Conexão estável com criptografia ponta a ponta para consultas seguras e sem interrupção.",
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-primary" />,
      title: "Receita Digital Válida",
      description: "Prescrições com assinatura digital certificada (ICP-Brasil), aceitas em qualquer farmácia do país.",
    },
    {
      icon: <Cpu className="w-5 h-5 text-primary" />,
      title: "Inteligência Artificial",
      description: "IA para auxiliar médicos em diagnósticos, otimizar laudos e melhorar a experiência do paciente.",
    },
    {
      icon: <Lock className="w-5 h-5 text-primary" />,
      title: "Proteção de Dados (LGPD)",
      description: "Seus dados são protegidos com os mais altos padrões de segurança e em total conformidade com a LGPD.",
    },
  ];

  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left — Image */}
          <motion.div
            className="flex justify-center relative"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full scale-75 -z-10" />
            <img
              src={technologyDoctor}
              alt="Médica utilizando nossa tecnologia de teleconsulta"
              className="w-full max-w-[500px] h-auto drop-shadow-2xl"
              loading="lazy"
            />
          </motion.div>

          {/* Right — Content */}
          <div className="flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-10"
            >
              <span className="inline-flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-widest text-primary bg-primary/[0.08] px-4 py-1.5 rounded-full mb-6">
                <Cpu className="w-3.5 h-3.5" />
                NOSSA TECNOLOGIA
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground leading-[1.1] mb-6">
                Inovação a serviço da <span className="text-primary">sua saúde</span>
              </h2>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-xl">
                Utilizamos tecnologia de ponta para oferecer uma experiência médica segura e eficiente. Cada detalhe foi pensado para garantir qualidade no atendimento.
              </p>
            </motion.div>

            <div className="space-y-6">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  className="flex items-start gap-4 p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * i }}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/[0.08] flex items-center justify-center shrink-0">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechnologySection;