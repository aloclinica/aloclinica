import { memo } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Lightning, Devices, Receipt, UsersFour, FirstAid } from "@phosphor-icons/react";

import familyImg from "@/assets/section-family-telehealth.jpg";
import doctorAppImg from "@/assets/section-doctor-app.jpg";
import multiplatformImg from "@/assets/benefit-multiplatform.jpg";
import familyPlanImg from "@/assets/benefit-family-plan.jpg";
import medicalRecordsImg from "@/assets/benefit-medical-records.jpg";

const benefits = [
  {
    icon: Lightning,
    title: "Atendimento em minutos",
    description: "Sem filas, sem deslocamento. Consulte médicos de qualquer lugar do Brasil.",
    accent: "bg-amber-500/10 text-amber-600",
  },
  {
    icon: ShieldCheck,
    title: "Segurança total",
    description: "Dados criptografados end-to-end, em conformidade com LGPD e regulamentação CFM.",
    accent: "bg-emerald-500/10 text-emerald-600",
  },
  {
    icon: Receipt,
    title: "Receita digital válida",
    description: "Receitas assinadas digitalmente e aceitas em todo o Brasil.",
    accent: "bg-blue-500/10 text-blue-600",
  },
  {
    icon: Devices,
    title: "Multiplataforma",
    description: "Acesse pelo celular, tablet ou computador. Sem necessidade de instalar nada.",
    accent: "bg-violet-500/10 text-violet-600",
  },
  {
    icon: UsersFour,
    title: "Plano família",
    description: "Adicione dependentes e cuide de toda a família em uma única conta.",
    accent: "bg-rose-500/10 text-rose-600",
  },
  {
    icon: FirstAid,
    title: "Prontuário completo",
    description: "Histórico de consultas, exames e receitas sempre acessíveis na palma da mão.",
    accent: "bg-teal-500/10 text-teal-600",
  },
];

function BenefitsGrid() {
  return (
    <section className="py-16 md:py-28 overflow-hidden">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-primary/60 mb-3 block">
            Por que escolher a AloClínica
          </span>
          <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
            Saúde moderna,{" "}
            <span className="text-gradient">sem complicação</span>
          </h2>
        </motion.div>

        {/* Bento grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5">
          {/* Large feature image card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-7 relative rounded-3xl overflow-hidden min-h-[280px] md:min-h-[380px] group"
          >
            <img
              src={familyImg}
              alt="Família em teleconsulta"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
            <div className="relative z-10 flex flex-col justify-end h-full p-6 md:p-8">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider w-fit mb-3">
                <UsersFour className="w-3 h-3" weight="fill" />
                Para toda família
              </span>
              <h3 className="text-xl md:text-2xl font-extrabold text-white leading-tight mb-2">
                Consultas para toda a família, de onde vocês estiverem
              </h3>
              <p className="text-white/80 text-sm max-w-md">
                Cuide de quem você ama com praticidade. Adicione dependentes e gerencie a saúde de todos em um só lugar.
              </p>
            </div>
          </motion.div>

          {/* Right column - 3 benefit cards */}
          <div className="md:col-span-5 grid gap-4 md:gap-5">
            {benefits.slice(0, 3).map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="bg-card rounded-2xl border border-border/40 p-5 flex items-start gap-4 hover:shadow-lg hover:border-primary/15 transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className={`w-11 h-11 rounded-xl ${b.accent} flex items-center justify-center shrink-0`}>
                  <b.icon className="w-5 h-5" weight="fill" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground mb-1">{b.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{b.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom row - 3 more benefit cards + image */}
          {benefits.slice(3).map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="md:col-span-3 bg-card rounded-2xl border border-border/40 p-5 flex flex-col gap-3 hover:shadow-lg hover:border-primary/15 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className={`w-11 h-11 rounded-xl ${b.accent} flex items-center justify-center`}>
                <b.icon className="w-5 h-5" weight="fill" />
              </div>
              <h4 className="text-sm font-bold text-foreground">{b.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{b.description}</p>
            </motion.div>
          ))}

          {/* Doctor image card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="md:col-span-3 relative rounded-3xl overflow-hidden min-h-[200px] group"
          >
            <img
              src={doctorAppImg}
              alt="Médica com app AloClínica"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent" />
            <div className="relative z-10 flex flex-col justify-end h-full p-5">
              <p className="text-white font-bold text-sm">Médicos verificados pelo CFM</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default memo(BenefitsGrid);
