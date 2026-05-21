import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CaretDown, Heart, Baby, Bone, Eye, Brain, Syringe, UserCircle, Drop, FirstAidKit, Sparkle, Wind, User, HandHeart, Virus, Stethoscope } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { PINGO_SPECIALTIES } from "@/constants/specialties-assets";

const specialtyIcons: Record<string, Icon> = {
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

const specialtyImageAliases: Record<string, string> = {
  "Clínico geral": "Clínico Geral",
  "Dermatologista": "Dermatologia",
  "Ginecologista-obstetra": "Ginecologista-obstetra",
  "Ortopedista": "Ortopedia",
  "Cardiologista": "Cardiologia",
  "Pediatra": "Pediatria",
  "Psiquiatra": "Psiquiatria",
  "Neurologista": "Neurologia",
  "Oftalmologia": "Oftalmologia",
  "Endocrinologista": "Endocrinologia",
  "Urologista": "Urologia",
  "Gastroenterologista": "Gastroenterologia",
  "Acupunturista": "Acupuntura",
  "Alergologista": "Alergologista",
  "Anestesiologista": "Anestesiologia",
  "Cirurgião dentista": "Cirurgião Dentista",
  "Cirurgião geral": "Cirurgia Geral",
  "Cirurgião oncológico": "Oncologia",
  "Cirurgião plástico": "Cirurgia Plástica",
  "Cirurgião vascular": "Cirurgia Vascular",
  "Clínica médica": "Clínico Geral",
  "Fisiatra": "Fisiatra",
  "Fisioterapeuta": "Fisioterapia",
  "Fonoaudiólogo": "Fonoaudiologia",
  "Geriatra": "Geriatria",
  "Homeopata": "Homeopatia",
  "Infectologista": "Infectologia",
  "Médico de família": "Médico de família",
  "Médico de tráfego": "Clínico Geral",
  "Médico do trabalho": "Clínico Geral",
  "Nefrologista": "Nefrologia",
  "Nutricionista": "Nutricionista",
  "Nutrólogo": "Nutrologia",
  "Otorrinolaringologista": "Otorrinolaringologia",
  "Pneumologista": "Pneumologia",
  "Psicólogo": "Psiquiatria",
  "Reumatologista": "Reumatologia",
};

const getSpecialtyImage = (name: string) => {
  const alias = specialtyImageAliases[name] ?? name;
  return PINGO_SPECIALTIES[alias] ?? PINGO_SPECIALTIES["Clínico Geral"];
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
  const imageSrc = getSpecialtyImage(name);
  const [loaded, setLoaded] = useState(false);

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => navigate(`/agendar?especialidade=${encodeURIComponent(name)}`)}
      title={desc}
      className="group relative flex flex-col items-center p-5 md:p-6 rounded-[2rem] bg-card border border-border/50 shadow-[0_8px_30px_hsl(var(--primary)/0.04)] hover:shadow-[0_20px_50px_hsl(var(--primary)/0.12)] hover:-translate-y-2 hover:border-primary/20 transition-all duration-500 cursor-pointer h-full w-full"
    >
      {/* Mascot inside orb */}
      <div className="relative mb-4 md:mb-5 w-20 h-20 md:w-24 md:h-24">
        {/* Outer glow */}
        <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-primary/40 via-secondary/30 to-primary/20 opacity-60 blur-md group-hover:opacity-100 group-hover:blur-lg transition-all duration-500" />
        {/* Gradient border ring */}
        <div className="absolute inset-0 rounded-full p-[1.5px] bg-gradient-to-br from-primary/70 via-secondary/50 to-primary/30">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-primary/15 via-primary/5 to-secondary/10 shadow-[inset_0_2px_10px_hsl(var(--primary)/0.12)] group-hover:from-primary/25 group-hover:via-primary/10 transition-all duration-500" />
        </div>
        <div className="absolute inset-0 rounded-full overflow-hidden flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
          {imageSrc ? (
            <>
              {!loaded && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 animate-pulse" />
              )}
              <img
                src={imageSrc}
                alt={`Pingo ${name}`}
                width={96}
                height={96}
                className={`w-full h-full object-contain object-bottom md:w-[125%] md:h-[125%] md:object-cover md:object-center pingo-float transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
                loading="lazy"
                decoding="async"
                onLoad={() => setLoaded(true)}
              />
            </>
          ) : (
            <div className="relative z-10 w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/10 rounded-full">
              <Icon className="w-10 h-10 md:w-12 md:h-12 text-primary drop-shadow-[0_2px_8px_hsl(var(--primary)/0.3)]" weight="duotone" />
            </div>
          )}
        </div>
      </div>

      <span className="text-xs md:text-sm font-bold text-foreground text-center leading-tight group-hover:text-primary transition-colors">
        {name}
      </span>

      <div className="mt-3 flex items-center gap-1 text-[10px] font-extrabold text-secondary uppercase tracking-wider opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
        Ver médicos
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
        </svg>
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

        <div className="flex justify-center mt-4">
          <Button
            size="lg"
            className="rounded-full h-12 px-8 font-extrabold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.03] active:scale-95 transition-all"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Ver menos especialidades" : "Ver mais especialidades"}
            <CaretDown className={`w-4 h-4 ml-2 transition-transform ${showAll ? "rotate-180" : ""}`} weight="bold" />
          </Button>
        </div>
      </div>
    </section>
  );
}

export default memo(SpecialtiesSection);
