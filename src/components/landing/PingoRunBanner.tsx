import { motion } from "framer-motion";
import pingoRun from "@/assets/pingo-clinico-geral.png";
import { Stethoscope, HeartPulse, Pill, Video, Calendar, ShieldCheck } from "lucide-react";

/**
 * Faixa animada com o Pingo correndo da esquerda para a direita,
 * sobre um fundo em gradiente da marca com ícones em marquee de fundo.
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
  // Duplicamos para criar um loop contínuo
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

      {/* Marquee de ícones / textos no fundo */}
      <div className="relative py-6 md:py-7">
        <motion.div
          className="flex items-center gap-12 md:gap-20 whitespace-nowrap will-change-transform"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 28, ease: "linear", repeat: Infinity }}
        >
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-3 text-white/95 font-bold text-sm md:text-base uppercase tracking-[0.18em] shrink-0"
              >
                <Icon className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.2} />
                <span>{it.label}</span>
                <span className="text-white/40 text-xl">•</span>
              </div>
            );
          })}
        </motion.div>

        {/* Pingo correndo sobre o marquee */}
        <motion.div
          aria-hidden="true"
          className="absolute top-1/2 left-0 -translate-y-1/2 will-change-transform"
          initial={{ x: "-15vw" }}
          animate={{ x: ["-15vw", "115vw"] }}
          transition={{ duration: 7, ease: "linear", repeat: Infinity }}
        >
          <motion.img
            src={pingoRun}
            alt=""
            loading="lazy"
            className="h-20 md:h-28 w-auto drop-shadow-[0_8px_18px_rgba(0,0,0,0.35)] select-none"
            animate={{ y: [0, -10, 0], rotate: [-2, 2, -2] }}
            transition={{ duration: 0.45, ease: "easeInOut", repeat: Infinity }}
            style={{ transformOrigin: "center bottom" }}
          />
          {/* Sombra do Pingo no chão */}
          <motion.div
            className="mx-auto -mt-1 h-2 rounded-full bg-black/30 blur-md"
            animate={{ scaleX: [1, 0.7, 1], opacity: [0.45, 0.25, 0.45] }}
            transition={{ duration: 0.45, ease: "easeInOut", repeat: Infinity }}
            style={{ width: "60%" }}
          />
        </motion.div>
      </div>

      {/* Fades laterais */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 md:w-24 bg-gradient-to-r from-primary to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 md:w-24 bg-gradient-to-l from-secondary to-transparent" />
    </section>
  );
};

export default PingoRunBanner;