import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Heart, Brain, Baby, Bone, Eye, FirstAidKit, Syringe, Tooth, ArrowRight,
  Wind, Drop, Heartbeat, Skull, Leaf, Person, Virus, Ear,
  Scales, HandHeart, Dna, Pill, Lightning, Wheelchair, ChartLine,
  Stethoscope, UserCircle, Sparkle, Flask, Knife
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import OptimizedImage from "@/components/ui/optimized-image";

// Pingo specialty mascots (transparent PNGs)
import specCardiology from "@/assets/spec-cardiologista.png";
import specNeurology from "@/assets/spec-neurologista.png";
import specPediatrics from "@/assets/spec-pediatra.png";
import specOrthopedics from "@/assets/spec-ortopedista.png";
import specOphthalmology from "@/assets/spec-oftalmologista.png";
import specDermatology from "@/assets/spec-dermatologista.png";
import specGeneral from "@/assets/spec-clinico-geral.png";
import specEndocrinology from "@/assets/spec-endocrinologista.png";
import specAcupuntura from "@/assets/spec-acupunturista.png";
import specAlergia from "@/assets/spec-alergologista.png";
import specAngiologia from "@/assets/spec-angiologia.png";
import specCirurgia from "@/assets/spec-cirurgiao-geral.png";
import specColoproctologia from "@/assets/spec-coloproctologia.png";
import specGastro from "@/assets/spec-gastroenterologista.png";
import specGeriatria from "@/assets/spec-geriatra.png";
import specGinecologia from "@/assets/spec-ginecologista.png";
import specHematologia from "@/assets/spec-hematologia.png";
import specInfectologia from "@/assets/spec-infectologista.png";
import specMastologia from "@/assets/spec-mastologia.png";
import specFamilia from "@/assets/spec-medico-familia.png";
import specEsporte from "@/assets/spec-esporte.png";
import specNefrologia from "@/assets/spec-nefrologia.png";
import specNutrologia from "@/assets/spec-nutricionista.png";
import specOncologia from "@/assets/spec-cirurgiao-onco.png";
import specOtorrino from "@/assets/spec-otorrino.png";
import specPneumologia from "@/assets/spec-pneumologista.png";
import specPsiquiatria from "@/assets/spec-psiquiatra.png";
import specRadiologia from "@/assets/spec-radiologia.png";
import specReumatologia from "@/assets/spec-reumatologista.png";
import specUrologia from "@/assets/spec-urologista.png";
import specAnestesiologia from "@/assets/spec-anestesiologista.png";
import specEndoscopia from "@/assets/spec-endoscopia.png";
import specGenetica from "@/assets/spec-genetica.png";
import specHomeopatia from "@/assets/spec-homeopata.png";
import specPlastica from "@/assets/spec-cirurgiao-plastico.png";
import specCirurgiaCardio from "@/assets/spec-cirurgiao-vascular.png";
import specIntensiva from "@/assets/spec-intensiva.png";
import specCabecaPescoco from "@/assets/spec-cabeca-pescoco.png";
import specCirurgiaVascular from "@/assets/spec-cirurgiao-vascular.png";

const specialties = [
  { name: "Cardiologia", icon: Heart, image: specCardiology, color: "from-rose-500/15 to-rose-500/[0.03]", desc: "Cuidando do seu coração para ele bater sempre forte e feliz." },
  { name: "Neurologia", icon: Brain, image: specNeurology, color: "from-violet-500/15 to-violet-500/[0.03]", desc: "Especialista em cérebro e sistema nervoso. Conexão total!" },
  { name: "Pediatria", icon: Baby, image: specPediatrics, color: "from-sky-500/15 to-sky-500/[0.03]", desc: "Cuidado especial para os nossos pequenos crescerem saudáveis." },
  { name: "Ortopedia", icon: Bone, image: specOrthopedics, color: "from-amber-500/15 to-amber-500/[0.03]", desc: "Para dores nos ossos, articulações e músculos. Vamos nos mexer!" },
  { name: "Oftalmologia", icon: Eye, image: specOphthalmology, color: "from-emerald-500/15 to-emerald-500/[0.03]", desc: "Para você enxergar o mundo com clareza e cores vibrantes." },
  { name: "Dermatologia", icon: FirstAidKit, image: specDermatology, color: "from-pink-500/15 to-pink-500/[0.03]", desc: "Cuidando da sua pele, cabelos e unhas com todo carinho." },
  { name: "Clínico Geral", icon: Syringe, image: specGeneral, color: "from-primary/15 to-primary/[0.03]", desc: "Seu primeiro contato para qualquer sintoma. Eu te ajudo!" },
  { name: "Endocrinologia", icon: Tooth, image: specEndocrinology, color: "from-teal-500/15 to-teal-500/[0.03]", desc: "Equilibrando seus hormônios e metabolismo para mais energia." },
  { name: "Acupuntura", icon: Sparkle, image: specAcupuntura, color: "from-orange-500/15 to-orange-500/[0.03]", desc: "Equilíbrio e bem-estar através de técnicas tradicionais." },
  { name: "Alergia e Imunologia", icon: Drop, image: specAlergia, color: "from-cyan-500/15 to-cyan-500/[0.03]", desc: "Protegendo seu corpo contra alergias e reforçando a imunidade." },
  { name: "Angiologia", icon: Heartbeat, image: specAngiologia, color: "from-red-500/15 to-red-500/[0.03]", desc: "Cuidado especializado para seus vasos sanguíneos e circulação." },
  { name: "Cirurgia Geral", icon: Knife, image: specCirurgia, color: "from-slate-500/15 to-slate-500/[0.03]", desc: "Procedimentos cirúrgicos essenciais com toda segurança." },
  { name: "Coloproctologia", icon: Stethoscope, image: specColoproctologia, color: "from-yellow-600/15 to-yellow-600/[0.03]", desc: "Saúde digestiva especializada com foco no seu conforto." },
  { name: "Gastroenterologia", icon: Flask, image: specGastro, color: "from-lime-500/15 to-lime-500/[0.03]", desc: "Cuidando do seu sistema digestivo para você se sentir leve." },
  { name: "Geriatria", icon: Wheelchair, image: specGeriatria, color: "from-stone-500/15 to-stone-500/[0.03]", desc: "Cuidado dedicado e especializado para a melhor idade." },
  { name: "Ginecologia e Obstetrícia", icon: HandHeart, image: specGinecologia, color: "from-fuchsia-500/15 to-fuchsia-500/[0.03]", desc: "Saúde da mulher em todas as fases, com acolhimento." },
  { name: "Hematologia", icon: Drop, image: specHematologia, color: "from-red-600/15 to-red-600/[0.03]", desc: "Especialista em doenças do sangue e órgãos hematopoiéticos." },
  { name: "Infectologia", icon: Virus, image: specInfectologia, color: "from-green-600/15 to-green-600/[0.03]", desc: "Prevenção e tratamento de doenças infecciosas com precisão." },
  { name: "Mastologia", icon: Heart, image: specMastologia, color: "from-pink-600/15 to-pink-600/[0.03]", desc: "Prevenção e tratamento especializado para a saúde das mamas." },
  { name: "Med. Família", icon: Person, image: specFamilia, color: "from-blue-500/15 to-blue-500/[0.03]", desc: "Cuidado contínuo para você e todos os seus familiares." },
  { name: "Med. do Esporte", icon: Lightning, image: specEsporte, color: "from-emerald-600/15 to-emerald-600/[0.03]", desc: "Foco na sua performance e saúde através do exercício." },
  { name: "Nefrologia", icon: Scales, image: specNefrologia, color: "from-indigo-500/15 to-indigo-500/[0.03]", desc: "Cuidado vital para a saúde e função dos seus rins." },
  { name: "Nutrologia", icon: Leaf, image: specNutrologia, color: "from-green-500/15 to-green-500/[0.03]", desc: "Abordagem médica para sua nutrição e prevenção de doenças." },
  { name: "Oncologia", icon: Flask, image: specOncologia, color: "from-orange-600/15 to-orange-600/[0.03]", desc: "Tratamento especializado e focado no combate ao câncer." },
  { name: "Otorrinolaringologia", icon: Ear, image: specOtorrino, color: "from-purple-500/15 to-purple-500/[0.03]", desc: "Cuidando de ouvidos, nariz e garganta com precisão." },
  { name: "Pneumologia", icon: Wind, image: specPneumologia, color: "from-sky-600/15 to-sky-600/[0.03]", desc: "Para você respirar melhor e cuidar dos seus pulmões." },
  { name: "Psiquiatria", icon: Brain, image: specPsiquiatria, color: "from-violet-600/15 to-violet-600/[0.03]", desc: "Sua saúde mental é prioridade. Vamos cuidar da mente." },
  { name: "Radiologia", icon: ChartLine, image: specRadiologia, color: "from-gray-500/15 to-gray-500/[0.03]", desc: "Diagnóstico por imagem preciso para orientar seu tratamento." },
  { name: "Reumatologia", icon: Bone, image: specReumatologia, color: "from-amber-600/15 to-amber-600/[0.03]", desc: "Tratamento para doenças autoimunes e articulares." },
  { name: "Urologia", icon: UserCircle, image: specUrologia, color: "from-teal-600/15 to-teal-600/[0.03]", desc: "Saúde do sistema urinário e reprodutor com discrição." },
  { name: "Anestesiologia", icon: Pill, image: specAnestesiologia, color: "from-cyan-600/15 to-cyan-600/[0.03]", desc: "Segurança e conforto durante seus procedimentos." },
  { name: "Endoscopia", icon: Eye, image: specEndoscopia, color: "from-indigo-600/15 to-indigo-600/[0.03]", desc: "Exames internos precisos para diagnósticos gastrointestinais." },
  { name: "Genética Médica", icon: Dna, image: specGenetica, color: "from-blue-600/15 to-blue-600/[0.03]", desc: "Estudo e aconselhamento genético para sua saúde e família." },
  { name: "Homeopatia", icon: Leaf, image: specHomeopatia, color: "from-lime-600/15 to-lime-600/[0.03]", desc: "Abordagem natural e holística para o seu equilíbrio." },
  { name: "Cirurgia Plástica", icon: Sparkle, image: specPlastica, color: "from-rose-400/15 to-rose-400/[0.03]", desc: "Harmonia e estética com foco na sua autoestima." },
  { name: "Cir. Cardiovascular", icon: Heartbeat, image: specCirurgiaCardio, color: "from-red-700/15 to-red-700/[0.03]", desc: "Procedimentos avançados para a saúde do seu coração." },
  { name: "Med. Intensiva", icon: ChartLine, image: specIntensiva, color: "from-slate-600/15 to-slate-600/[0.03]", desc: "Suporte vital e cuidado especializado em casos críticos." },
  { name: "Cir. Cabeça e Pescoço", icon: Skull, image: specCabecaPescoco, color: "from-stone-600/15 to-stone-600/[0.03]", desc: "Cirurgia especializada para a região da cabeça e pescoço." },
  { name: "Cirurgia Vascular", icon: Heartbeat, image: specCirurgiaVascular, color: "from-red-400/15 to-red-400/[0.03]", desc: "Tratamento cirúrgico para vasos sanguíneos e circulação." },
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
                <div className="relative bg-card rounded-2xl border border-border/40 hover:shadow-xl hover:border-primary/20 transition-all duration-300">
                  {/* Pingo (transparent) on a soft tinted backdrop */}
                  <div className={`relative h-40 sm:h-44 bg-gradient-to-br ${spec.color} flex items-center justify-center rounded-t-2xl`}>
                    <OptimizedImage
                      src="https://cvbgrjauqjawrsyknhyj.supabase.co/storage/v1/object/public/files/uploads/0XILPRqqUbSOh99ow53X5OBDOCC3/1776788772275-bngbf-hero-doctor__4_-removebg-preview.png"
                      alt={`Especialista - ${spec.name}`}
                      className="h-full w-auto object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-500 ease-out"
                      width={512}
                      height={512}
                    />
                    {/* Soft shimmer */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col gap-1.5 border-t border-border/30">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
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
