import { motion } from "framer-motion";
import pingoPhone from "@/assets/pingo-videocall.png";
import { Stethoscope, HeartPulse, Pill, Video, Calendar, ShieldCheck } from "lucide-react";

/**
 * Faixa animada com ícones em marquee e o Pingo fixo
 * segurando um celular, com animação sutil de flutuação.
 */
const MARQUEE_ITEMS = [
  { icon: Stethoscope, label: "Consulta 24h" },
  { icon: Video, label: "Por vídeo" },
  { icon: Pill, label: "Receita digital" },
  { icon: HeartPulse, label: "30+ especialidades" },
  { icon: Calendar, label: "Agendamento rápido" },
  { icon: ShieldCheck, label: "Atendimento seguro" },
];

const PingoRunBanner = () => {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

  return (
    <section
      aria-label="Destaques AloClínica"
      className="relative w-full overflow-hidden border-y border-primary/20 bg-gradient-to-r from-primary via-[hsl(215,75%,42%)] to-secondary"
    >
      {/* Padrão de pontilhado sutil */}
      <div
        className="absolute inset-0 opacity-[0.12] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* Conteúdo principal: texto à esquerda + Pingo fixo à direita */}
      <div className="relative flex items-center justify-between gap-6 px-6 md:px-12 lg:px-20 py-6 md:py-8">
        {/* Texto chamativo */}
        <div className="z-10 max-w-xl">
          <motion.p
            className="text-white/80 text-xs md:text-sm font-semibold uppercase tracking-widest mb-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Na palma da sua mão
          </motion.p>
          <motion.h2
            className="text-white text-2xl md:text-4xl font-bold leading-tight"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Agende sua consulta em{" "}
            <span className="text-[hsl(168,70%,65%)]">menos de 2 minutos</span>{" "}
            pelo app
          </motion.h2>
        </div>

        {/* Pingo fixo com celular — animação sutil de flutuação */}
        <motion.div
          aria-hidden="true"
          className="relative shrink-0 hidden sm:block"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* eslint-disable-next-line no-console */}
          {console.log("Pingo img src:", pingoPhone)}
          <motion.img
            src={pingoPhone}
            alt=""
            loading="lazy"
            className="h-28 md:h-40 lg:h-44 w-auto drop-shadow-[0_12px_24px_rgba(0,0,0,0.35)] select-none"
            animate={{ y: [0, -8, 0], rotate: [0, 1.5, 0, -1.5, 0] }}
            transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
            style={{ transformOrigin: "center bottom" }}
          />
          {/* Brilho sutil atrás do Pingo */}
          <div
            className="absolute inset-0 -z-10 blur-2xl opacity-30 bg-white rounded-full"
            style={{ transform: "scale(1.2)" }}
          />
        </motion.div>
      </div>

      {/* Marquee de ícones na base */}
      <div className="relative py-3 md:py-4 border-t border-white/10">
        <motion.div
          className="flex items-center gap-10 md:gap-16 whitespace-nowrap will-change-transform"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 28, ease: "linear", repeat: Infinity }}
        >
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-2.5 text-white/90 font-medium text-xs md:text-sm uppercase tracking-[0.15em] shrink-0"
              >
                <Icon className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2} />
                <span>{it.label}</span>
                <span className="text-white/30 text-lg">•</span>
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* Fades laterais */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 md:w-24 bg-gradient-to-r from-primary to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 md:w-24 bg-gradient-to-l from-secondary to-transparent" />
    </section>
  );
};

export default PingoRunBanner;
