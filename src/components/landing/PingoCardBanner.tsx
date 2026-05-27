import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Clock, Users, Pill, ArrowRight, Sparkles } from "lucide-react";
import pingoCartao from "@/assets/pingo-cartao.png";
import logoPingo from "@/assets/logo-pingo.png";

const benefits = [
  { icon: Clock, label: "Consultas 24h", hint: "Atendimento imediato" },
  { icon: Pill, label: "Desconto Farmácia", hint: "Até 70% off" },
  { icon: Users, label: "Toda a família", hint: "Até 4 dependentes" },
  { icon: ShieldCheck, label: "Prioridade", hint: "Fila preferencial" },
];

const PingoCardBanner = () => {
  const navigate = useNavigate();

  return (
    <section
      aria-label="Pingo Card - Cartão de saúde digital"
      className="relative w-full px-4 sm:px-6 lg:px-8 py-16"
    >
      <div
        className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] md:rounded-[3rem] border border-white/10 shadow-2xl"
        style={{
          background:
            "linear-gradient(135deg, hsl(220, 85%, 18%) 0%, hsl(215, 80%, 28%) 35%, hsl(210, 75%, 38%) 70%, hsl(200, 85%, 48%) 100%)",
          boxShadow:
            "0 40px 80px -30px hsl(215, 90%, 30% / 0.6), 0 0 0 1px hsl(215, 80%, 60% / 0.15)",
        }}
      >
        {/* Atmospheric glows — blue brand */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 right-0 w-2/3 h-full opacity-70"
          style={{ background: "radial-gradient(at 65% 35%, hsl(195, 100%, 65% / 0.35), transparent 60%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-32 w-[34rem] h-[34rem] rounded-full blur-[140px]"
          style={{ background: "hsl(190, 100%, 60% / 0.28)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/4 right-1/4 w-80 h-80 rounded-full blur-[100px] opacity-60"
          style={{ background: "hsl(180, 95%, 60% / 0.22)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/3 w-96 h-96 rounded-full blur-[130px] opacity-50"
          style={{ background: "hsl(225, 90%, 55% / 0.4)" }}
        />

        {/* Stardust texture */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.7) 0.6px, transparent 0.6px)",
            backgroundSize: "18px 18px",
          }}
        />


        <div className="relative z-10 grid lg:grid-cols-12 items-center gap-8 lg:gap-6 p-8 md:p-12 lg:p-16">
          {/* Left content */}
          <div className="flex flex-col gap-7 lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md w-fit"
            >
              <span
                className="flex h-2 w-2 rounded-full animate-pulse"
                style={{
                  background: "hsl(200, 95%, 60%)",
                  boxShadow: "0 0 10px hsl(200, 95%, 60%)",
                }}
              />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: "hsl(200, 90%, 80%)" }}>
                Novo • Pingo Card
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="space-y-4"
            >
              <h2 className="text-5xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.05] tracking-tight drop-shadow-[0_2px_20px_rgba(0,0,0,0.3)]">
                Seu cartão de
                <br />
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, hsl(180, 100%, 85%) 0%, hsl(195, 100%, 80%) 50%, hsl(210, 100%, 88%) 100%)",
                  }}
                >
                  saúde digital.
                </span>
              </h2>
              <p className="text-base md:text-lg text-sky-100/85 max-w-lg leading-relaxed">
                Com o Pingo Card você e sua família têm acesso a consultas
                online 24h, descontos em farmácias e atendimento prioritário
                com especialistas — tudo em um único cartão digital.
              </p>
            </motion.div>

            {/* Benefit chips */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="grid grid-cols-2 gap-3 max-w-lg"
            >
              {benefits.map(({ icon: Icon, label, hint }) => (
                <div
                  key={label}
                  className="group flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.08] border border-white/15 backdrop-blur-xl transition-all hover:bg-white/[0.14] hover:border-white/30 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-10px_hsl(200,100%,50%/0.5)]"
                >
                  <div
                    className="w-9 h-9 flex items-center justify-center rounded-xl shrink-0 ring-1 ring-white/20 group-hover:ring-white/40 transition"
                    style={{
                      background:
                        "linear-gradient(135deg, hsl(195, 100%, 65% / 0.4), hsl(215, 100%, 60% / 0.25))",
                    }}
                  >
                    <Icon
                      className="w-4 h-4"
                      style={{ color: "hsl(190, 100%, 85%)" }}
                      strokeWidth={2.5}
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-white leading-tight">
                      {label}
                    </span>
                    <span className="text-[10.5px] text-sky-200/70 leading-tight mt-0.5">
                      {hint}
                    </span>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-2"
            >
              <button
                type="button"
                onClick={() => navigate("/pingo-card")}
                className="group relative w-full sm:w-auto"
              >
                <div
                  aria-hidden
                  className="absolute -inset-1 rounded-2xl blur-lg opacity-40 group-hover:opacity-80 transition duration-500"
                  style={{ background: "linear-gradient(90deg, hsl(180,100%,60%), hsl(210,100%,60%), hsl(225,100%,65%))" }}
                />
                <div
                  className="relative flex items-center justify-center gap-3 px-10 py-5 rounded-2xl text-white font-bold text-base md:text-lg transition-transform group-hover:-translate-y-0.5"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(210, 100%, 55%) 0%, hsl(195, 100%, 50%) 50%, hsl(185, 100%, 45%) 100%)",
                    boxShadow:
                      "0 18px 45px -12px hsl(200, 100%, 50% / 0.8), inset 0 1px 0 rgba(255,255,255,0.25)",
                  }}
                >
                  <Sparkles className="w-4 h-4 opacity-90" strokeWidth={2.5} />
                  Assinar agora · R$ 29/mês
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
                </div>
              </button>
              <button
                type="button"
                onClick={() => navigate("/pingo-card")}
                className="group text-sky-100/90 hover:text-white font-bold flex items-center gap-2 transition-colors tracking-wide text-sm"
              >
                Saber mais
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
              </button>
            </motion.div>

            {/* Trust line */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-center gap-4 pt-1 text-[11px] text-sky-100/70"
            >
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" style={{ color: "hsl(190, 100%, 80%)" }} strokeWidth={2.5} />
                Sem fidelidade
              </div>
              <span className="w-1 h-1 rounded-full bg-sky-300/40" />
              <div>Cancele quando quiser</div>
              <span className="w-1 h-1 rounded-full bg-sky-300/40" />
              <div>+12 mil famílias</div>
            </motion.div>
          </div>

          {/* Right — mascot + floating card */}
          <div className="relative flex justify-center lg:justify-end items-end min-h-[380px] lg:min-h-[500px] lg:col-span-5">
            <div className="relative w-full max-w-[520px] h-full flex items-end justify-center">
              {/* Soft radial spotlight behind mascot */}
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at 55% 55%, hsl(215, 90%, 55% / 0.25), transparent 60%)",
                }}
              />
              {/* Rim light */}
              <div
                aria-hidden
                className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[120%] h-[60%] rounded-full blur-[80px] opacity-60"
                style={{ background: "radial-gradient(at 50% 70%, hsl(215, 90%, 55% / 0.35), transparent 70%)" }}
              />
              <div
                aria-hidden
                className="absolute bottom-[15%] right-0 w-32 h-32 rounded-full blur-[60px]"
                style={{ background: "hsl(200, 95%, 60% / 0.25)" }}
              />
              {/* Ground shadow under mascot */}
              <div
                aria-hidden
                className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[70%] h-6 rounded-[50%] blur-xl opacity-70"
                style={{ background: "radial-gradient(ellipse, rgba(0,0,0,0.7), transparent 70%)" }}
              />

              {/* Mascot showcase — framed in glass to absorb any photo background */}
              <motion.div
                className="relative z-10 w-full rounded-[2rem] overflow-hidden"
                style={{
                  background:
                    "linear-gradient(160deg, hsl(215, 60%, 92%) 0%, hsl(200, 70%, 96%) 100%)",
                  boxShadow:
                    "0 30px 60px -20px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.5)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
              >
                {/* inner radial glow */}
                <div
                  aria-hidden
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(ellipse at 50% 40%, hsl(215, 90%, 70% / 0.35), transparent 65%)",
                  }}
                />
                <img
                  src={pingoCartao}
                  alt="Pingo segurando o Pingo Card"
                  loading="lazy"
                  className="relative w-full h-auto select-none"
                  draggable={false}
                />
              </motion.div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PingoCardBanner;
