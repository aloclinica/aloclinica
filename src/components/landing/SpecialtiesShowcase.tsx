import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Heart, Brain, Baby, Bone, Eye, FirstAidKit, Syringe, Tooth, ArrowRight,
  Wind, Drop, Heartbeat, Skull, Leaf, Person, Virus, Ear,
  Scales, HandHeart, Dna, Pill, Lightning, Wheelchair, ChartLine,
  Stethoscope, Sparkle, Flask, Knife, UserCircle

} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { PINGO_SPECIALTIES } from "@/constants/specialties-assets";
import { Stethoscope as FallbackIcon } from "@phosphor-icons/react";

const specialties = [
  { name: "Cardiologia", icon: Heart, color: "from-rose-500/10 to-rose-500/[0.02]", desc: "Cuidando do seu coração para ele bater sempre forte e feliz." },
  { name: "Neurologia", icon: Brain, color: "from-violet-500/10 to-violet-500/[0.02]", desc: "Especialista em cérebro e sistema nervoso. Conexão total!" },
  { name: "Pediatria", icon: Baby, color: "from-sky-500/10 to-sky-500/[0.02]", desc: "Cuidado especial para os nossos pequenos crescerem saudáveis." },
  { name: "Ortopedia", icon: Bone, color: "from-amber-500/10 to-amber-500/[0.02]", desc: "Para dores nos ossos, articulações e músculos. Vamos nos mexer!" },
  { name: "Oftalmologia", icon: Eye, color: "from-emerald-500/10 to-emerald-500/[0.02]", desc: "Para você enxergar o mundo com clareza e cores vibrantes." },
  { name: "Dermatologia", icon: FirstAidKit, color: "from-pink-500/10 to-pink-500/[0.02]", desc: "Cuidando da sua pele, cabelos e unhas com todo carinho." },
  { name: "Clínico Geral", icon: Syringe, color: "from-primary/10 to-primary/[0.02]", desc: "Seu primeiro contato para qualquer sintoma. Eu te ajudo!" },
  { name: "Endocrinologia", icon: Tooth, color: "from-teal-500/10 to-teal-500/[0.02]", desc: "Equilibrando seus hormônios e metabolismo para mais energia." },
  { name: "Acupuntura", icon: Sparkle, color: "from-orange-500/10 to-orange-500/[0.02]", desc: "Equilíbrio e bem-estar através de técnicas tradicionais." },
  { name: "Alergia e Imunologia", icon: Drop, color: "from-cyan-500/10 to-cyan-500/[0.02]", desc: "Protegendo seu corpo contra alergias e reforçando a imunidade." },
  { name: "Angiologia", icon: Heartbeat, color: "from-red-500/10 to-red-500/[0.02]", desc: "Cuidado especializado para seus vasos sanguíneos e circulação." },
  { name: "Cirurgia Geral", icon: Knife, color: "from-slate-500/10 to-slate-500/[0.02]", desc: "Procedimentos cirúrgicos essenciais com toda segurança." },
  { name: "Coloproctologia", icon: Stethoscope, color: "from-yellow-600/10 to-yellow-600/[0.02]", desc: "Saúde digestiva especializada com foco no seu conforto." },
  { name: "Gastroenterologia", icon: Flask, color: "from-lime-500/10 to-lime-500/[0.02]", desc: "Cuidando do seu sistema digestivo para você se sentir leve." },
  { name: "Geriatria", icon: Wheelchair, color: "from-stone-500/10 to-stone-500/[0.02]", desc: "Cuidado dedicado e especializado para a melhor idade." },
  { name: "Ginecologia e Obstetrícia", icon: HandHeart, color: "from-fuchsia-500/10 to-fuchsia-500/[0.02]", desc: "Saúde da mulher em todas as fases, com acolhimento." },
  { name: "Hematologia", icon: Drop, color: "from-red-600/10 to-red-600/[0.02]", desc: "Especialista em doenças do sangue e órgãos hematopoiéticos." },
  { name: "Infectologia", icon: Virus, color: "from-green-600/10 to-green-600/[0.02]", desc: "Prevenção e tratamento de doenças infecciosas com precisão." },
  { name: "Mastologia", icon: Heart, color: "from-pink-600/10 to-pink-600/[0.02]", desc: "Prevenção e tratamento especializado para a saúde das mamas." },
  { name: "Med. Família", icon: Person, color: "from-blue-500/10 to-blue-500/[0.02]", desc: "Cuidado contínuo para você e todos os seus familiares." },
  { name: "Med. do Esporte", icon: Lightning, color: "from-emerald-600/10 to-emerald-600/[0.02]", desc: "Foco na sua performance e saúde através do exercício." },
  { name: "Nefrologia", icon: Scales, color: "from-indigo-500/10 to-indigo-500/[0.02]", desc: "Cuidado vital para a saúde e função dos seus rins." },
  { name: "Nutrologia", icon: Leaf, color: "from-green-500/10 to-green-500/[0.02]", desc: "Abordagem médica para sua nutrição e prevenção de doenças." },
  { name: "Oncologia", icon: Flask, color: "from-orange-600/10 to-orange-600/[0.02]", desc: "Tratamento especializado e focado no combate ao câncer." },
  { name: "Otorrinolaringologia", icon: Ear, color: "from-purple-500/10 to-purple-500/[0.02]", desc: "Cuidando de ouvidos, nariz e garganta com precisão." },
  { name: "Pneumologia", icon: Wind, color: "from-sky-600/10 to-sky-600/[0.02]", desc: "Para você respirar melhor e cuidar dos seus pulmões." },
  { name: "Psiquiatria", icon: Brain, color: "from-violet-600/10 to-violet-600/[0.02]", desc: "Sua saúde mental é prioridade. Vamos cuidar da mente." },
  { name: "Radiologia", icon: ChartLine, color: "from-gray-500/10 to-gray-500/[0.02]", desc: "Diagnóstico por imagem preciso para orientar seu tratamento." },
  { name: "Reumatologia", icon: Bone, color: "from-amber-600/10 to-amber-600/[0.02]", desc: "Tratamento para doenças autoimunes e articulares." },
  { name: "Urologia", icon: UserCircle, color: "from-teal-600/10 to-teal-600/[0.02]", desc: "Saúde do sistema urinário e reprodutor com discrição." },
  { name: "Anestesiologia", icon: Pill, color: "from-cyan-600/10 to-cyan-600/[0.02]", desc: "Segurança e conforto durante seus procedimentos." },
  { name: "Endoscopia", icon: Eye, color: "from-indigo-600/10 to-indigo-600/[0.02]", desc: "Exames internos precisos para diagnósticos gastrointestinais." },
  { name: "Genética Médica", icon: Dna, color: "from-blue-600/10 to-blue-600/[0.02]", desc: "Estudo e aconselhamento genético para sua saúde e família." },
  { name: "Homeopatia", icon: Leaf, color: "from-lime-600/10 to-lime-600/[0.02]", desc: "Abordagem natural e holística para o seu equilíbrio." },
  { name: "Cirurgia Plástica", icon: Sparkle, color: "from-rose-400/10 to-rose-400/[0.02]", desc: "Harmonia e estética com foco na sua autoestima." },
  { name: "Cir. Cardiovascular", icon: Heartbeat, color: "from-red-700/10 to-red-700/[0.02]", desc: "Procedimentos avançados para a saúde do seu coração." },
  { name: "Med. Intensiva", icon: ChartLine, color: "from-slate-600/10 to-slate-600/[0.02]", desc: "Suporte vital e cuidado especializado em casos críticos." },
  { name: "Cir. Cabeça e Pescoço", icon: Skull, color: "from-stone-600/10 to-stone-600/[0.02]", desc: "Cirurgia especializada para a região da cabeça e pescoço." },
  { name: "Cirurgia Vascular", icon: Heartbeat, color: "from-red-400/10 to-red-400/[0.02]", desc: "Tratamento cirúrgico para vasos sanguíneos e circulação." },
];

const INITIAL_VISIBLE = 8;

function SpecialtiesShowcase() {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

  const visibleSpecialties = showAll ? specialties : specialties.slice(0, INITIAL_VISIBLE);

  return (
    <section className="py-16 md:py-24 overflow-hidden">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-primary/60 mb-3 block">
            Especialidades
          </span>
          <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
            Mais de <span className="text-primary">{specialties.length} especialidades</span> médicas
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            Encontre o especialista ideal para o seu caso em poucos cliques.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-5">
          <AnimatePresence mode="popLayout">
            {visibleSpecialties.map((spec, i) => (
              <motion.div
                key={spec.name}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i < INITIAL_VISIBLE ? i * 0.06 : (i - INITIAL_VISIBLE) * 0.03, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="group cursor-pointer"
                onClick={() => navigate("/paciente")}
              >
                <div className="relative bg-card rounded-2xl border border-border/40 hover:shadow-xl hover:border-primary/20 transition-all duration-300 overflow-hidden">
                  {/* Backdrop with Icon */}
                  <div className={`relative h-32 sm:h-36 bg-gradient-to-br ${spec.color} flex items-center justify-center rounded-t-2xl group-hover:bg-primary/5 transition-colors`}>
                    <spec.icon 
                      className="w-16 h-16 text-primary/40 group-hover:text-primary group-hover:scale-110 transition-all duration-500 ease-out" 
                      weight="duotone"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col gap-1.5 border-t border-border/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
                        <spec.icon className="w-4 h-4 text-primary group-hover:text-primary-foreground transition-colors" weight="fill" />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-foreground leading-tight">{spec.name}</span>
                    </div>
                    {spec.desc && (
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300 line-clamp-2">
                        {spec.desc}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-10"
        >
          {!showAll ? (
            <Button
              variant="outline"
              size="lg"
              className="rounded-2xl px-8 gap-2 font-bold border-2 hover:border-primary/30 hover:bg-primary/[0.04] group"
              onClick={() => setShowAll(true)}
            >
              Ver todas as {specialties.length} especialidades
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" weight="bold" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="lg"
              className="rounded-2xl px-8 gap-2 font-bold border-2 hover:border-primary/30 hover:bg-primary/[0.04] group"
              onClick={() => navigate("/paciente")}
            >
              Agendar consulta
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" weight="bold" />
            </Button>
          )}
        </motion.div>
      </div>
    </section>
  );
}

export default memo(SpecialtiesShowcase);