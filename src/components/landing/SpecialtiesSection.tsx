import { memo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  Brain,
  Baby,
  Bone,
  Eye,
  Bandaids,
  Stethoscope,
  Syringe,
  Thermometer,
  Pill,
  FirstAidKit,
  Heartbeat,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "@phosphor-icons/react";

const specialties = [
  { icon: Stethoscope, name: "Clínica Geral", color: "bg-primary/10 text-primary" },
  { icon: Heart, name: "Cardiologia", color: "bg-rose-500/10 text-rose-600" },
  { icon: Brain, name: "Neurologia", color: "bg-violet-500/10 text-violet-600" },
  { icon: Baby, name: "Pediatria", color: "bg-amber-500/10 text-amber-600" },
  { icon: Bandaids, name: "Dermatologia", color: "bg-pink-500/10 text-pink-600" },
  { icon: Bone, name: "Ortopedia", color: "bg-orange-500/10 text-orange-600" },
  { icon: Heartbeat, name: "Endocrinologia", color: "bg-teal-500/10 text-teal-600" },
  { icon: Syringe, name: "Urologia", color: "bg-blue-500/10 text-blue-600" },
  { icon: Thermometer, name: "Ginecologia", color: "bg-fuchsia-500/10 text-fuchsia-600" },
  { icon: Pill, name: "Psiquiatria", color: "bg-indigo-500/10 text-indigo-600" },
  { icon: Eye, name: "Oftalmologia", color: "bg-cyan-500/10 text-cyan-600" },
  { icon: FirstAidKit, name: "Gastroenterologia", color: "bg-emerald-500/10 text-emerald-600" },
];

function SpecialtiesSection() {
  const navigate = useNavigate();

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-muted/30 to-background" />
      <div className="absolute top-[20%] left-[-8%] w-[500px] h-[500px] bg-primary/[0.04] rounded-full blur-[160px] -z-10" />
      <div className="absolute bottom-[10%] right-[-5%] w-[400px] h-[400px] bg-secondary/[0.04] rounded-full blur-[120px] -z-10" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-primary/60 mb-3 block">
            Especialidades
          </span>
          <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
            Mais de <span className="text-gradient">30 especialidades</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            Encontre o especialista ideal para sua necessidade, disponível 24h por vídeo.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 mb-12">
          {specialties.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-card/80 border border-border/40 hover:shadow-lg hover:border-primary/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              onClick={() => navigate("/dashboard/doctors")}
            >
              <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <s.icon className="w-6 h-6" weight="fill" />
              </div>
              <span className="text-xs md:text-sm font-semibold text-foreground text-center leading-tight">
                {s.name}
              </span>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <Button
            size="lg"
            variant="outline"
            className="rounded-2xl h-[50px] px-8 text-sm font-bold border-2 hover:border-primary/30 hover:bg-primary/[0.04] transition-all group"
            onClick={() => navigate("/dashboard/doctors")}
          >
            Ver todas as especialidades
            <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1" weight="bold" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

export default memo(SpecialtiesSection);
