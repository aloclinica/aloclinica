import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CaretDown } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import OptimizedImage from "@/components/ui/optimized-image";

import specClinicoGeral from "@/assets/spec-clinico-geral.png";
import specDermatologista from "@/assets/spec-dermatologista.png";
import specGinecologista from "@/assets/spec-ginecologista.png";
import specOrtopedista from "@/assets/spec-ortopedista.png";
import specCardiologista from "@/assets/spec-cardiologista.png";
import specPediatra from "@/assets/spec-pediatra.png";
import specPsiquiatra from "@/assets/spec-psiquiatra.png";
import specNeurologista from "@/assets/spec-neurologista.png";
import specOftalmologista from "@/assets/spec-oftalmologista.png";
import specEndocrinologista from "@/assets/spec-endocrinologista.png";
import specUrologista from "@/assets/spec-urologista.png";
import specGastroenterologista from "@/assets/spec-gastroenterologista.png";

import specAcupunturista from "@/assets/spec-acupunturista.png";
import specAnestesiologista from "@/assets/spec-anestesiologista.png";
import specCirurgiaoGeral from "@/assets/spec-cirurgiao-geral.png";
import specCirurgiaoOnco from "@/assets/spec-cirurgiao-onco.png";
import specCirurgiaoPlastico from "@/assets/spec-cirurgiao-plastico.png";
import specCirurgiaoVascular from "@/assets/spec-cirurgiao-vascular.png";
import specClinicaMedica from "@/assets/spec-clinico-geral.png";
import specGeriatra from "@/assets/spec-geriatra.png";
import specHomeopata from "@/assets/spec-homeopata.png";
import specInfectologista from "@/assets/spec-infectologista.png";
import specMedicoFamilia from "@/assets/spec-medico-familia.png";
import specNefrologia from "@/assets/spec-nefrologia.png";
import specNutricionista from "@/assets/spec-nutricionista.png";
import specOtorrino from "@/assets/spec-otorrino.png";
import specPneumologista from "@/assets/spec-pneumologista.png";
import specReumatologista from "@/assets/spec-reumatologista.png";

// Reuse some icons for remaining specialties that don't have unique ones yet
const topSpecialties = [
  { name: "Clínico geral", img: specClinicoGeral, desc: "Seu primeiro contato para qualquer sintoma. Eu te ajudo a começar!" },
  { name: "Dermatologista", img: specDermatologista, desc: "Cuidando da sua pele, cabelos e unhas com todo carinho." },
  { name: "Ginecologista-obstetra", img: specGinecologista, desc: "Saúde da mulher em todas as fases da vida, com acolhimento." },
  { name: "Ortopedista", img: specOrtopedista, desc: "Para dores nos ossos, articulações e músculos. Vamos nos mexer!" },
  { name: "Cardiologista", img: specCardiologista, desc: "Cuidando do seu coração para ele bater sempre forte e feliz." },
  { name: "Pediatra", img: specPediatra, desc: "Cuidado especial para os nossos pequenos crescerem saudáveis." },
  { name: "Psiquiatra", img: specPsiquiatra, desc: "Sua saúde mental é prioridade. Vamos conversar e cuidar da mente." },
  { name: "Neurologista", img: specNeurologista, desc: "Especialista em cérebro e sistema nervoso. Conexão total!" },
  { name: "Oftalmologista", img: specOftalmologista, desc: "Para você enxergar o mundo com clareza e cores vibrantes." },
  { name: "Endocrinologista", img: specEndocrinologista, desc: "Equilibrando seus hormônios e metabolismo para mais energia." },
  { name: "Urologista", img: specUrologista, desc: "Saúde do sistema urinário e reprodutor com total discrição." },
  { name: "Gastroenterologista", img: specGastroenterologista, desc: "Cuidando do seu sistema digestivo para você se sentir leve." },
];

const moreSpecialties = [
  { name: "Acupunturista", img: specAcupunturista, desc: "Equilíbrio e bem-estar através de técnicas tradicionais." },
  { name: "Anestesiologista", img: specAnestesiologista, desc: "Segurança e conforto durante seus procedimentos." },
  { name: "Cirurgião geral", img: specCirurgiaoGeral, desc: "Especialista em diversos procedimentos cirúrgicos essenciais." },
  { name: "Cirurgião oncológico", img: specCirurgiaoOnco, desc: "Tratamento especializado e focado no combate ao câncer." },
  { name: "Cirurgião plástico", img: specCirurgiaoPlastico, desc: "Harmonia e estética com foco na sua autoestima." },
  { name: "Cirurgião vascular", img: specCirurgiaoVascular, desc: "Cuidando da sua circulação e saúde das veias e artérias." },
  { name: "Clínica médica", img: specClinicaMedica, desc: "Visão integral da sua saúde para diagnósticos precisos." },
  { name: "Geriatra", img: specGeriatra, desc: "Cuidado dedicado e especializado para a melhor idade." },
  { name: "Homeopata", img: specHomeopata, desc: "Abordagem natural e holística para o seu equilíbrio." },
  { name: "Infectologista", img: specInfectologista, desc: "Prevenção e tratamento de doenças infecciosas." },
  { name: "Médico de família", img: specMedicoFamilia, desc: "Cuidado contínuo para você e todos os seus familiares." },
  { name: "Médico de tráfego", img: specClinicoGeral, desc: "Avaliações necessárias para sua jornada no trânsito." },
  { name: "Médico do trabalho", img: specClinicoGeral, desc: "Saúde e segurança para sua vida profissional." },
  { name: "Nefrologista", img: specNefrologia, desc: "Cuidado vital para a saúde e função dos seus rins." },
  { name: "Nutricionista", img: specNutricionista, desc: "Alimentação balanceada para uma vida muito mais saudável." },
  { name: "Nutrólogo", img: specNutricionista, desc: "Foco médico na sua nutrição e prevenção de doenças." },
  { name: "Otorrinolaringologista", img: specOtorrino, desc: "Cuidando de ouvidos, nariz e garganta com precisão." },
  { name: "Pneumologista", img: specPneumologista, desc: "Para você respirar melhor e cuidar dos seus pulmões." },
  { name: "Psicólogo", img: specPsiquiatra, desc: "Apoio emocional para enfrentar os desafios do dia a dia." },
  { name: "Reumatologista", img: specReumatologista, desc: "Tratamento especializado para doenças autoimunes e articulares." },
];

const SpecialtyCard = ({ name, img, desc, index }: { name: string; img: string; desc?: string; index: number }) => {
  const navigate = useNavigate();
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="group flex flex-col items-center gap-3 p-4 rounded-2xl bg-card/80 border border-border/40 hover:shadow-lg hover:border-primary/25 hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full"
      onClick={() => navigate("/dashboard/doctors")}
    >
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
        <OptimizedImage
          src="https://cvbgrjauqjawrsyknhyj.supabase.co/storage/v1/object/public/files/uploads/0XILPRqqUbSOh99ow53X5OBDOCC3/1776788772275-bngbf-hero-doctor__4_-removebg-preview.png"
          alt={`Especialista ${name}`}
          width={80}
          height={80}
          className="w-full h-full object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-300"
        />
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

function SpecialtiesSection() {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-muted/30 to-background" />
      <div className="absolute top-[20%] left-[-8%] w-[500px] h-[500px] bg-primary/[0.04] rounded-full blur-[160px] -z-10" />
      <div className="absolute bottom-[10%] right-[-5%] w-[400px] h-[400px] bg-secondary/[0.04] rounded-full blur-[120px] -z-10" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
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
            Especialidades <span className="text-gradient">mais buscadas</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            Selecione a especialidade para ver os profissionais disponíveis para agendamento.
          </p>
        </motion.div>

        {/* Top 12 with Dr. Lila icons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 mb-6">
          {topSpecialties.map((s, i) => (
            <SpecialtyCard key={s.name} name={s.name} img={s.img} desc={s.desc} index={i} />
          ))}
        </div>

        {/* More specialties (expandable) */}
        <AnimatePresence>
          {showAll && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 mb-6">
                {moreSpecialties.map((s, i) => (
                  <SpecialtyCard key={s.name} name={s.name} img={s.img} desc={s.desc} index={i} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-center">
          <Button
            size="lg"
            variant="ghost"
            className="rounded-2xl h-[46px] px-6 text-sm font-bold text-primary hover:bg-primary/[0.06] transition-all group"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Ver menos especialidades" : "Ver mais especialidades"}
            <CaretDown className={`w-4 h-4 ml-1.5 transition-transform duration-300 ${showAll ? "rotate-180" : "group-hover:translate-y-0.5"}`} weight="bold" />
          </Button>
        </div>
      </div>
    </section>
  );
}

export default memo(SpecialtiesSection);
