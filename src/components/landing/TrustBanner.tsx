import { motion } from "framer-motion";
import { ShieldCheck, Award, Users, Lock, FileCheck, HeartHandshake } from "lucide-react";

const TRUST_ITEMS = [
  { icon: ShieldCheck, label: "Dados criptografados" },
  { icon: Award, label: "Médicos credenciados CRM" },
  { icon: Users, label: "+50 mil pacientes atendidos" },
  { icon: Lock, label: "LGPD compliant" },
  { icon: FileCheck, label: "Receitas com assinatura ICP-Brasil" },
  { icon: HeartHandshake, label: "Suporte humano 24h" },
];

const TrustBanner = () => {
  const items = [...TRUST_ITEMS, ...TRUST_ITEMS];

  return (
    <section
      aria-label="Segurança e credibilidade AloClínica"
      className="relative w-full overflow-hidden border-y border-primary/20 bg-gradient-to-r from-[hsl(215,60%,18%)] via-[hsl(215,60%,12%)] to-[hsl(215,60%,18%)]"
    >
      {/* Padrão de malha sutil */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Cabeçalho */}
      <div className="relative px-6 md:px-12 lg:px-20 pt-5 md:pt-6 pb-2">
        <motion.p
          className="text-white/50 text-[10px] md:text-xs font-bold uppercase tracking-[0.25em] text-center"
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          Você em boas mãos
        </motion.p>
      </div>

      {/* Marquee de ícones */}
      <div className="relative py-4 md:py-5">
        <motion.div
          className="flex items-center gap-8 md:gap-14 whitespace-nowrap will-change-transform"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 26, ease: "linear", repeat: Infinity }}
        >
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-2.5 md:gap-3 text-white/90 font-semibold text-xs md:text-sm uppercase tracking-[0.12em] shrink-0"
              >
                <span className="inline-flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full bg-secondary/20 text-secondary">
                  <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={2.5} />
                </span>
                <span>{it.label}</span>
                <span className="text-white/20 text-lg md:text-xl">•</span>
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* Fades laterais */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-14 md:w-20 bg-gradient-to-r from-[hsl(215,60%,18%)] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-14 md:w-20 bg-gradient-to-l from-[hsl(215,60%,18%)] to-transparent" />
    </section>
  );
};

export default TrustBanner;
