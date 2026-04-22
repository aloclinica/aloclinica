import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CaretDown, Heart, Baby, Bone, Eye, Brain, Syringe, UserCircle, Drop, FirstAidKit, Sparkle, Wind, User, HandHeart, Virus, Stethoscope } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { PINGO_SPECIALTIES } from "@/constants/specialties-assets";

const specialtyIcons: Record<string, any> = {
  "Clínico geral": Syringe,
  "Dermatologista": User,
  "Ginecologista-obstetra": HandHeart,
  "Ortopedista": Bone,
  "Cardiologista": Heart,
  "Pediatra": Baby,
  "Psiquiatra": Brain,
  "Neurologista": Brain,
  "Oftalmologia": Eye,
  "Endocrinologista": Drop,
  "Urologista": UserCircle,
  "Gastroenterologista": FirstAidKit,
  "Acupunturista": Sparkle,
  "Alergologista": Virus,
  "Pneumologista": Wind,
};

const topSpecialties = [
  { name: "Clínico geral", desc: "Seu primeiro contato para qualquer sintoma. Eu te ajudo a começar!" },
  { name: "Dermatologista", desc: "Cuidando da sua pele, cabelos e unhas com todo carinho." },
  { name: "Ginecologista-obstetra", desc: "Saúde da mulher em todas as fases da vida, com acolhimento." },
  { name: "Ortopedista", desc: "Para dores nos ossos, articulações e músculos. Vamos nos mexer!" },
  { name: "Cardiologista", desc: "Cuidando do seu coração para ele bater sempre forte e feliz." },
  { name: "Pediatra", desc: "Cuidado especial para os nossos pequenos crescerem saudáveis." },
  { name: "Psiquiatra", desc: "Sua saúde mental é prioridade. Vamos conversar e cuidar da mente." },
  { name: "Neurologista", desc: "Especialista em cérebro e sistema nervoso. Conexão total!" },
  { name: "Oftalmologia", desc: "Para você enxergar o mundo com clareza e cores vibrantes." },
  { name: "Endocrinologista", desc: "Equilibrando seus hormônios e metabolismo para mais energia." },
  { name: "Urologista", desc: "Saúde do sistema urinário e reprodutor com total discrição." },
  { name: "Gastroenterologista", desc: "Cuidando do seu sistema digestivo para você se sentir leve." },
];

const moreSpecialties = [
  { name: "Acupunturista", desc: "Equilíbrio e bem-estar através de técnicas tradicionais." },
  { name: "Alergologista", desc: "Tratamento de alergias e cuidados com seu sistema imunológico." },
  { name: "Anestesiologista", desc: "Segurança e conforto durante seus procedimentos." },
  { name: "Cirurgião dentista", desc: "Cuidando do seu sorriso e da sua saúde bucal com carinho." },
  { name: "Cirurgião geral", desc: "Especialista em diversos procedimentos cirúrgicos essenciais." },
  { name: "Cirurgião oncológico", desc: "Tratamento especializado e focado no combate ao câncer." },
  { name: "Cirurgião plástico", desc: "Harmonia e estética com foco na sua autoestima." },
  { name: "Cirurgião vascular", desc: "Cuidando da sua circulação e saúde das veias e artérias." },
  { name: "Clínica médica", desc: "Visão integral da sua saúde para diagnósticos precisos." },
  { name: "Fisiatra", desc: "Reabilitação e qualidade de vida para sua recuperação física." },
  { name: "Fisioterapeuta", desc: "Movimento e cuidado para sua plena recuperação e bem-estar." },
  { name: "Fonoaudiólogo", desc: "Cuidando da sua comunicação, fala e audição com dedicação." },
  { name: "Geriatra", desc: "Cuidado dedicado e especializado para a melhor idade." },
  { name: "Homeopata", desc: "Abordagem natural e holística para o seu equilíbrio." },
  { name: "Infectologista", desc: "Prevenção e tratamento de doenças infecciosas." },
  { name: "Médico de família", desc: "Cuidado contínuo para você e todos os seus familiares." },
  { name: "Médico de tráfego", desc: "Avaliações necessárias para sua jornada no trânsito." },
  { name: "Médico do trabalho", desc: "Saúde e segurança para sua vida profissional." },
  { name: "Nefrologista", desc: "Cuidado vital para a saúde e função dos seus rins." },
  { name: "Nutricionista", desc: "Alimentação balanceada para uma vida muito mais saudável." },
  { name: "Nutrólogo", desc: "Foco médico na sua nutrição e prevenção de doenças." },
  { name: "Otorrinolaringologista", desc: "Cuidando de ouvidos, nariz e garganta com precisão." },
  { name: "Pneumologista", desc: "Para você respirar melhor e cuidar dos seus pulmões." },
  { name: "Psicólogo", desc: "Apoio emocional para enfrentar os desafios do dia a dia." },
  { name: "Reumatologista", desc: "Tratamento especializado para doenças autoimunes e articulares." },
];

const SpecialtyCard = ({ name, desc, index }: { name: string; desc?: string; index: number }) => {
  const navigate = useNavigate();
  const Icon = specialtyIcons[name] || Stethoscope;
  
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="group flex flex-col items-center gap-3 p-4 rounded-2xl bg-card/80 border border-border/40 hover:shadow-lg hover:border-primary/25 hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full w-full"
      onClick={() => navigate("/dashboard/doctors")}
    >
      <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
        <Icon className="w-6 h-6 md:w-7 md:h-7 text-primary group-hover:text-white transition-colors" weight="duotone" />
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-xs md:text-sm font-bold text-foreground text-center leading-tight group-hover:text-primary transition-colors">
          {name}
        </span>
        {desc && (
          <p className="text-[10px] md:text-[11px] text-muted-foreground text-center leading-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300 line-clamp-2">
            {desc}
          </p>
        )}
      </div>
    </motion.button>
  );
};

function SpecialtiesSection({ config }: { config?: any }) {
  const [showAll, setShowAll] = useState(false);
  const title = config?.title || "Especialidades mais buscadas";
  const subtitle = config?.subtitle || "Selecione a especialidade para ver os profissionais disponíveis.";

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-muted/30 to-background" />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div className="text-center mb-14" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary/60 mb-3 block">Especialidades</span>
          <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight">{title}</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">{subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 mb-6">
          {topSpecialties.map((s, i) => (
            <SpecialtyCard key={s.name} name={s.name} desc={s.desc} index={i} />
          ))}
        </div>

        <AnimatePresence>
          {showAll && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 mb-6">
                {moreSpecialties.map((s, i) => (
                  <SpecialtyCard key={s.name} name={s.name} desc={s.desc} index={i} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-center">
          <Button size="lg" variant="ghost" className="rounded-2xl h-[46px] px-6 font-bold text-primary group" onClick={() => setShowAll(!showAll)}>
            {showAll ? "Ver menos" : "Ver mais"}
            <CaretDown className={`w-4 h-4 ml-1.5 transition-transform ${showAll ? "rotate-180" : ""}`} weight="bold" />
          </Button>
        </div>
      </div>
    </section>
  );
}

export default memo(SpecialtiesSection);
