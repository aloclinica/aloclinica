import { motion } from "framer-motion";
import { Stethoscope, HeartPulse, Pill, Video, Calendar, ShieldCheck, ArrowRight, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import appHealthImage from "@/assets/pingo-generated/generated-telemedicine.jpg";

/**
 * Banner premium com gradiente mesh, chips de vidro no marquee
 * e o Pingo flutuando à direita.
 */
const MARQUEE_ITEMS = [
  { icon: Stethoscope, label: "Consulta 24h", dot: "bg-emerald-400", pulse: true },
  { icon: Video, label: "Por vídeo", dot: "bg-cyan-400" },
  { icon: Pill, label: "Receita digital", dot: "bg-purple-400" },
  { icon: HeartPulse, label: "30+ especialidades", dot: "bg-amber-400" },
  { icon: Calendar, label: "Agendamento rápido", dot: "bg-blue-400" },
  { icon: ShieldCheck, label: "Atendimento seguro", dot: "bg-pink-400" },
];

const PingoRunBanner = () => {
  const navigate = useNavigate();
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

  return (
    <section
      aria-label="Destaques AloClínica"
      className="relative w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8"
    >
      <div
        className="relative mx-auto max-w-7xl overflow-hidden rounded-lg shadow-2xl flex flex-col justify-between min-h-[320px] md:min-h-[360px]"
        style={{
          background:
            "linear-gradient(135deg, hsl(218, 86%, 18%) 0%, hsl(213, 86%, 35%) 48%, hsl(204, 94%, 58%) 100%)",
        }}
      >
        <img
          src={appHealthImage}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[58%] object-cover object-right opacity-95 md:block"
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#06245f] via-[#06439d]/95 to-[#06439d]/20" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#04173d]/70 to-transparent" />

        {/* Pontilhado */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.15] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.6) 0.8px, transparent 0.8px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* Conteúdo */}
        <div className="relative z-10 flex flex-1 items-center px-6 md:px-12 py-8 md:py-10 gap-6">
          <div className="flex-1 flex flex-col gap-4 max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-extrabold tracking-[0.2em] text-cyan-200 uppercase">
                Na palma da sua mão
              </span>
            </motion.div>

            <motion.h2
              className="text-white text-2xl sm:text-3xl md:text-4xl font-extrabold leading-[1.15] tracking-tight"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Agende sua consulta em{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-300">
                menos de 2 minutos
              </span>{" "}
              pelo app
            </motion.h2>

            <motion.div
              className="flex items-center gap-4 mt-1"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <button
                type="button"
                onClick={() => navigate("/agendar")}
                className="group px-6 md:px-7 py-3 bg-white text-[hsl(215,75%,32%)] font-bold rounded-lg shadow-xl hover:shadow-cyan-500/30 hover:-translate-y-0.5 transition-all flex items-center gap-2 text-sm md:text-base"
              >
                Agendar agora
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
              </button>
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="text-white font-bold text-sm">Médicos verificados no CFM</span>
                <span className="text-white/60 text-[10px] uppercase tracking-wider">
                  Receita digital válida
                </span>
              </div>
            </motion.div>
          </div>

          <div className="hidden md:block flex-1" />
        </div>

        {/* Marquee com chips de vidro */}
        <div className="relative z-20 h-14 bg-black/15 backdrop-blur-xl border-t border-white/10 overflow-hidden flex items-center">
          <motion.div
            className="flex items-center gap-4 md:gap-6 whitespace-nowrap will-change-transform px-4"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 32, ease: "linear", repeat: Infinity }}
          >
            {items.map((it, i) => {
              const Icon = it.icon;
              return (
                <div
                  key={i}
                  className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 shrink-0"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${it.dot} ${it.pulse ? "animate-pulse" : ""}`}
                  />
                  <Icon className="w-3.5 h-3.5 text-white/70" strokeWidth={2.2} />
                  <span className="text-white/90 font-bold text-[10px] md:text-[11px] tracking-widest uppercase">
                    {it.label}
                  </span>
                </div>
              );
            })}
          </motion.div>

          {/* Fades laterais sobre o marquee */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-black/30 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black/30 to-transparent" />
        </div>
      </div>
    </section>
  );
};

export default PingoRunBanner;
