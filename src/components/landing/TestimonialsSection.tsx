import { forwardRef, useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ShieldCheck, Heart, Quotes, X } from "@phosphor-icons/react";
import { db } from "@/integrations/supabase/untyped";
import avatarMaria from "@/assets/avatar-maria.png";
import avatarCarlos from "@/assets/avatar-carlos.png";
import avatarAna from "@/assets/avatar-ana.png";
import avatarPedro from "@/assets/avatar-pedro.png";
import avatarJuliana from "@/assets/avatar-juliana.png";
import avatarRenata from "@/assets/avatar-renata.png";
import avatarLucas from "@/assets/avatar-lucas.png";
import avatarCamila from "@/assets/avatar-camila.png";
import avatarMarcos from "@/assets/avatar-marcos.png";
import avatarFernanda from "@/assets/avatar-fernanda.png";

type TestimonialItem = {
  name: string; handle: string; text: string; rating: number;
  avatar: string; verified: boolean; likes: number; time: string;
};

const staticTestimonials: TestimonialItem[] = [
  { name: "Maria Silva", handle: "@maria.silva", text: "Consegui uma consulta com cardiologista em menos de 1 hora. A receita chegou digital na hora. Incrível! 💙", rating: 5, avatar: avatarMaria, verified: true, likes: 342, time: "2h" },
  { name: "Dr. Carlos Mendes", handle: "@dr.carlos", text: "A plataforma facilitou muito meu dia a dia. Atendo de casa com a mesma qualidade do consultório. Recomendo!", rating: 5, avatar: avatarCarlos, verified: true, likes: 518, time: "5h" },
  { name: "Ana Costa", handle: "@ana.costa", text: "Agendei uma consulta avulsa e fui atendida em menos de 30 minutos. Prático e acessível! ❤️", rating: 5, avatar: avatarAna, verified: true, likes: 276, time: "8h" },
  { name: "Pedro Oliveira", handle: "@pedro.oliv", text: "Agendei uma consulta às 23h e fui atendido no dia seguinte às 7h. Praticidade absurda!", rating: 5, avatar: avatarPedro, verified: true, likes: 189, time: "1d" },
  { name: "Juliana Santos", handle: "@ju.santos", text: "Minha mãe de 72 anos conseguiu usar sozinha. Interface super intuitiva e médicos muito atenciosos.", rating: 5, avatar: avatarJuliana, verified: true, likes: 423, time: "1d" },
  { name: "Dra. Renata Lopes", handle: "@dra.renata", text: "Finalmente uma telemedicina que funciona de verdade. Prontuário completo, receita digital, tudo integrado.", rating: 5, avatar: avatarRenata, verified: true, likes: 367, time: "2d" },
  { name: "Lucas Ferreira", handle: "@lucas.f", text: "Estava com dor forte e fui atendido em 15 minutos. O médico foi super atencioso. Nota 10! 🌟", rating: 5, avatar: avatarLucas, verified: true, likes: 298, time: "2d" },
  { name: "Camila Rocha", handle: "@cami.rocha", text: "Uso com meus 3 filhos. O plano família é imbatível. Já economizei muito com deslocamento e tempo.", rating: 5, avatar: avatarCamila, verified: true, likes: 445, time: "3d" },
  { name: "Dr. Marcos Alves", handle: "@dr.marcos", text: "Como médico, a AloClinica me permitiu alcançar pacientes de todo o Brasil. A tecnologia é de ponta.", rating: 5, avatar: avatarMarcos, verified: true, likes: 512, time: "3d" },
  { name: "Fernanda Lima", handle: "@fer.lima", text: "Melhor investimento em saúde que já fiz. Atendimento humanizado mesmo sendo online. Parabéns! 👏", rating: 5, avatar: avatarFernanda, verified: true, likes: 331, time: "4d" },
];

const TestimonialsSection = forwardRef<HTMLElement>((_, ref) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [viewed, setViewed] = useState<Set<number>>(new Set());
  const [allTestimonials, setAllTestimonials] = useState<TestimonialItem[]>(staticTestimonials);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    db
      .from("testimonials")
      .select("*")
      .eq("is_active", true)
      .order("order_index")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setAllTestimonials(data.map((d) => ({
            name: d.name,
            handle: `@${d.name.split(" ")[0].toLowerCase()}`,
            text: d.text,
            rating: d.rating,
            avatar: d.avatar_url || avatarMaria,
            verified: true,
            likes: Math.floor(Math.random() * 500) + 100,
            time: "recente",
          })));
        }
      });
  }, []);

  const openStory = useCallback((idx: number) => {
    setOpenIndex(idx);
    setViewed(prev => new Set(prev).add(idx));
  }, []);

  const t = openIndex !== null ? allTestimonials[openIndex] : null;

  return (
    <section id="depoimentos" className="py-12 md:py-24 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 md:mb-12"
        >
          <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-3">
            O que dizem sobre a{" "}
            <span className="text-gradient">AloClinica</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Toque em um story para ler o depoimento.
          </p>
        </motion.div>

        {/* Stories row */}
        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 justify-start md:justify-center scrollbar-none px-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {allTestimonials.map((item, i) => (
            <motion.button
              key={i}
              onClick={() => openStory(i)}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04, type: "spring", stiffness: 200, damping: 15 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer"
            >
              <div
                className={`w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-full p-[3px] transition-all duration-300 ${
                  viewed.has(i)
                    ? "bg-muted-foreground/20"
                    : "bg-gradient-to-br from-primary via-secondary to-primary"
                } group-hover:shadow-lg group-hover:shadow-primary/20`}
              >
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-full h-full rounded-full object-cover border-[3px] border-card"
                  loading="lazy" decoding="async" />
              </div>
              <span className="text-[11px] font-medium max-w-[72px] sm:max-w-20 truncate text-muted-foreground group-hover:text-foreground transition-colors">
                {item.name.split(" ")[0]}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Story popup overlay */}
        <AnimatePresence>
          {openIndex !== null && t && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 backdrop-blur-sm p-4"
              onClick={() => setOpenIndex(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="card-interactive w-full max-w-sm rounded-2xl border border-border/40 bg-card overflow-hidden shadow-elevated"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Progress bar */}
                <div className="flex gap-0.5 px-3 pt-3">
                  {allTestimonials.map((_, i) => (
                    <div key={i} className="flex-1 h-[3px] rounded-full overflow-hidden bg-muted-foreground/10">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          i <= openIndex ? "bg-primary w-full" : "w-0"
                        }`}
                      />
                    </div>
                  ))}
                </div>

                {/* Header */}
                <div className="flex items-center gap-3 p-4">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-br from-primary to-secondary">
                      <img
                        src={t.avatar}
                        alt={t.name}
                        className="w-full h-full rounded-full object-cover border-2 border-card" loading="lazy" decoding="async" />
                    </div>
                    {t.verified && (
                      <ShieldCheck className="w-4 h-4 text-primary absolute -bottom-0.5 -right-0.5 bg-card rounded-full" weight="fill" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.handle}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground/50 mr-1">{t.time}</span>
                  <button
                    onClick={() => setOpenIndex(null)}
                    className="p-1.5 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground"
                  >
                    <X className="w-4 h-4" weight="bold" />
                  </button>
                </div>

                {/* Body */}
                <div className="px-5 pb-4">
                  <Quotes className="w-6 h-6 text-primary/15 mb-2" weight="fill" />
                  <p className="text-[15px] text-foreground leading-relaxed">{t.text}</p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 pb-5">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 text-warning" weight="fill" />
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Heart className="w-3.5 h-3.5" weight="bold" />
                    <span className="text-xs">{t.likes}</span>
                  </div>
                </div>

                {/* Nav buttons */}
                <div className="flex border-t border-border/40">
                  <button
                    disabled={openIndex === 0}
                    onClick={() => openStory(openIndex - 1)}
                    className="flex-1 py-3 text-xs font-semibold text-primary hover:bg-muted/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ← Anterior
                  </button>
                  <div className="w-px bg-border/40" />
                  <button
                    disabled={openIndex === allTestimonials.length - 1}
                    onClick={() => openStory(openIndex + 1)}
                    className="flex-1 py-3 text-xs font-semibold text-primary hover:bg-muted/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Próximo →
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
});
TestimonialsSection.displayName = "TestimonialsSection";
export default TestimonialsSection;
