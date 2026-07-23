import { motion } from "framer-motion";
import { ShieldCheck, Award, Users, Lock, FileCheck, HeartHandshake, Sparkles } from "lucide-react";

const TRUST_ITEMS = [
  { icon: ShieldCheck, label: "Dados criptografados ponta a ponta" },
  { icon: Award, label: "Médicos credenciados CRM" },
  { icon: Users, label: "Consulta por vídeo em HD" },
  { icon: Lock, label: "LGPD compliant" },
  { icon: FileCheck, label: "Receitas com assinatura ICP-Brasil" },
  { icon: HeartHandshake, label: "Suporte humano 24h" },
];

const TrustBanner = () => {
  const items = [...TRUST_ITEMS, ...TRUST_ITEMS];

  return (
    <section
      aria-label="Segurança e credibilidade AloClínica"
      className="relative w-full overflow-hidden border-y border-white/10 bg-[hsl(215,65%,10%)]"
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 -z-0 bg-[radial-gradient(ellipse_at_top,hsl(215,75%,32%,0.45),transparent_60%),radial-gradient(ellipse_at_bottom,hsl(168,50%,40%,0.18),transparent_55%)]" />
      {/* Subtle grid */}
      <div
        aria-hidden
        className="absolute inset-0 -z-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      {/* Cabeçalho */}
      <div className="relative px-6 md:px-12 lg:px-20 pt-7 md:pt-8 pb-3">
        <motion.div
          className="flex items-center justify-center gap-2.5"
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-secondary/20 ring-1 ring-secondary/40">
            <Sparkles className="w-3 h-3 text-secondary" strokeWidth={2.5} />
          </span>
          <p className="text-white/70 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em]">
            Você em boas mãos
          </p>
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-secondary/20 ring-1 ring-secondary/40">
            <Sparkles className="w-3 h-3 text-secondary" strokeWidth={2.5} />
          </span>
        </motion.div>
      </div>

      {/* Marquee de chips */}
      <div className="relative py-5 md:py-6">
        <motion.div
          className="flex items-center gap-3 md:gap-4 whitespace-nowrap will-change-transform"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 32, ease: "linear", repeat: Infinity }}
        >
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <div
                key={i}
                className="group flex items-center gap-2.5 md:gap-3 shrink-0 pl-2 pr-5 py-2 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-sm hover:bg-white/[0.08] hover:border-secondary/40 transition-colors"
              >
                <span className="inline-flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-secondary/30 to-primary/30 ring-1 ring-secondary/40 text-secondary shadow-inner">
                  <Icon className="w-4 h-4 md:w-[18px] md:h-[18px]" strokeWidth={2.5} />
                </span>
                <span className="text-white/90 font-bold text-[11px] md:text-[13px] uppercase tracking-[0.14em]">
                  {it.label}
                </span>
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* Fades laterais */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 md:w-32 bg-gradient-to-r from-[hsl(215,65%,10%)] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 md:w-32 bg-gradient-to-l from-[hsl(215,65%,10%)] to-transparent" />
    </section>
  );
};

export default TrustBanner;
