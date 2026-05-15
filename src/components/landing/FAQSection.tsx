import { useEffect, useState, forwardRef } from "react";
import { db } from "@/integrations/supabase/untyped";
import { motion, AnimatePresence } from "framer-motion";
import { MagnifyingGlass, ChatCircleDots, Question, ArrowRight, Plus, Stethoscope, FileText, CreditCard, ShieldCheck, UserGear, Sparkle } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const categoryConfig: Record<string, { icon: typeof Question; tone: string; label: string }> = {
  consulta:   { icon: Stethoscope, tone: "from-primary/15 to-primary/5 text-primary",          label: "Consultas" },
  receita:    { icon: FileText,    tone: "from-emerald-500/15 to-emerald-500/5 text-emerald-600", label: "Receitas" },
  plano:      { icon: CreditCard,  tone: "from-violet-500/15 to-violet-500/5 text-violet-600",   label: "Planos" },
  segurança:  { icon: ShieldCheck, tone: "from-amber-500/15 to-amber-500/5 text-amber-600",      label: "Segurança" },
  médico:     { icon: UserGear,    tone: "from-rose-500/15 to-rose-500/5 text-rose-600",         label: "Médicos" },
};

type FaqEntry = { q: string; a: string; category: string };

const staticFaqs: FaqEntry[] = [
  { q: "A consulta por vídeo tem a mesma validade de uma presencial?", a: "Sim! A telemedicina é regulamentada pelo CFM e as consultas realizadas pela AloClinica têm a mesma validade legal de uma consulta presencial, incluindo receitas e atestados.", category: "consulta" },
  { q: "Como funciona a receita digital?", a: "Após a consulta, o médico emite uma receita digital assinada eletronicamente. Você recebe o PDF pelo aplicativo e pode apresentá-la em qualquer farmácia.", category: "receita" },
  { q: "Posso cancelar meu plano a qualquer momento?", a: "Sim, você pode cancelar seu plano mensal a qualquer momento sem multa. O acesso continua até o fim do período pago.", category: "plano" },
  { q: "Quais especialidades estão disponíveis?", a: "Contamos com mais de 20 especialidades, incluindo Cardiologia, Neurologia, Pediatria, Dermatologia, Ortopedia, Clínico Geral e muitas outras.", category: "consulta" },
  { q: "Os dados da minha consulta são sigilosos?", a: "Absolutamente. Todas as consultas são protegidas com criptografia end-to-end e seguimos rigorosamente a LGPD e as normas do CFM para sigilo médico.", category: "segurança" },
  { q: "Sou médico, como faço para atender pela plataforma?", a: "Basta se cadastrar como médico, enviar seu CRM para verificação e configurar sua disponibilidade. Após aprovação, você já pode receber pacientes.", category: "médico" },
  { q: "Quanto tempo leva para receber a receita?", a: "A receita digital é emitida instantaneamente ao final da consulta e fica disponível no seu perfil e por e-mail.", category: "receita" },
  { q: "Posso agendar consulta para dependentes?", a: "Sim! Você pode cadastrar até 5 dependentes e agendar consultas para eles diretamente pelo seu perfil.", category: "consulta" },
];

const categoryOrder = ["all", "consulta", "receita", "plano", "segurança", "médico"];

const FAQSection = forwardRef<HTMLElement>((_, ref) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<FaqEntry[]>(staticFaqs);

  useEffect(() => {
    db.from("faq_items")
      .select("question, answer, category")
      .eq("is_active", true)
      .order("order_index")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setFaqs(data.map((d) => ({ q: d.question, a: d.answer, category: d.category ?? "geral" })));
        }
      });
  }, []);

  const filtered = faqs.filter((f) => {
    const s = search.toLowerCase();
    const matchSearch = !s || f.q.toLowerCase().includes(s) || f.a.toLowerCase().includes(s);
    const matchCat = activeCategory === "all" || f.category === activeCategory;
    return matchSearch && matchCat;
  });

  useEffect(() => {
    if (faqs.length === 0) return;
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };
    document.getElementById("faq-jsonld")?.remove();
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(jsonLd);
    script.id = "faq-jsonld";
    document.head.appendChild(script);
    return () => { document.getElementById("faq-jsonld")?.remove(); };
  }, [faqs]);

  return (
    <section id="faq" ref={ref} className="py-20 md:py-32 relative overflow-hidden bg-gradient-to-b from-background via-muted/20 to-background" aria-labelledby="faq-heading">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 -left-24 w-[480px] h-[480px] rounded-full bg-primary/[0.06] blur-3xl" />
        <div className="absolute bottom-10 -right-24 w-[520px] h-[520px] rounded-full bg-secondary/[0.06] blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-[380px_1fr] gap-10 lg:gap-16 max-w-6xl mx-auto">
          {/* LEFT — sticky info column */}
          <aside className="lg:sticky lg:top-24 lg:self-start space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold tracking-wider uppercase mb-5">
                <Sparkle className="w-3.5 h-3.5" weight="fill" />
                Central de ajuda
              </div>
              <h2
                id="faq-heading"
                className="text-4xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight"
                style={{ lineHeight: "1.05" }}
              >
                Perguntas
                <br />
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  frequentes
                </span>
              </h2>
              <p className="text-muted-foreground text-[15px] leading-relaxed mb-6">
                Tire suas dúvidas sobre consultas, receitas, planos e segurança. Se precisar de mais ajuda, fale com a gente.
              </p>

              {/* Search */}
              <div className="relative group mb-6">
                <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" weight="bold" style={{ width: 18, height: 18 }} />
                <input
                  type="text"
                  placeholder="Buscar uma dúvida..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-border/70 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                />
              </div>

              {/* Categories — vertical list */}
              <div className="space-y-1.5">
                {categoryOrder.map((key) => {
                  const isActive = activeCategory === key;
                  const cfg = categoryConfig[key];
                  const label = key === "all" ? "Todas as perguntas" : cfg?.label ?? key;
                  const Icon = cfg?.icon;
                  const count = key === "all" ? faqs.length : faqs.filter((f) => f.category === key).length;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveCategory(key)}
                      className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                          : "hover:bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {Icon ? (
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isActive ? "bg-primary-foreground/15" : "bg-muted/70 group-hover:bg-muted"
                        }`}>
                          <Icon weight="fill" style={{ width: 14, height: 14 }} />
                        </div>
                      ) : (
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive ? "bg-primary-foreground/15" : "bg-muted/70"
                        }`}>
                          <Question weight="fill" style={{ width: 14, height: 14 }} />
                        </div>
                      )}
                      <span className="flex-1 text-sm font-semibold">{label}</span>
                      <span className={`text-[11px] tabular-nums font-bold px-2 py-0.5 rounded-md ${
                        isActive ? "bg-primary-foreground/20" : "bg-muted/80"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </aside>

          {/* RIGHT — accordion */}
          <div>
            <AnimatePresence>
              {search && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-muted-foreground mb-3"
                >
                  {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} para "<span className="font-semibold text-foreground">{search}</span>"
                </motion.p>
              )}
            </AnimatePresence>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filtered.map((faq, i) => {
                  const isOpen = openItem === faq.q;
                  const cfg = categoryConfig[faq.category];
                  const CatIcon = cfg?.icon || Question;
                  return (
                    <motion.div
                      key={faq.q}
                      initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ delay: i * 0.035, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      layout
                      className={`group rounded-2xl border transition-all duration-300 overflow-hidden ${
                        isOpen
                          ? "bg-card border-primary/30 shadow-2xl shadow-primary/[0.08]"
                          : "bg-card/70 backdrop-blur-sm border-border/50 hover:border-primary/20 hover:shadow-md"
                      }`}
                    >
                      <button
                        onClick={() => setOpenItem(isOpen ? null : faq.q)}
                        className="w-full flex items-start gap-4 px-5 sm:px-6 py-5 text-left"
                      >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br transition-all duration-300 ${cfg?.tone || "from-muted to-muted/50 text-muted-foreground"} ${isOpen ? "scale-110 shadow-md" : ""}`}>
                          <CatIcon weight="fill" style={{ width: 18, height: 18 }} />
                        </div>
                        <span className={`flex-1 text-[15px] sm:text-base font-semibold leading-snug pt-1.5 transition-colors ${
                          isOpen ? "text-foreground" : "text-foreground/85 group-hover:text-foreground"
                        }`}>
                          {faq.q}
                        </span>
                        <motion.div
                          animate={{ rotate: isOpen ? 45 : 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                            isOpen ? "bg-primary text-primary-foreground" : "bg-muted/70 text-muted-foreground group-hover:bg-muted"
                          }`}
                        >
                          <Plus weight="bold" style={{ width: 16, height: 16 }} />
                        </motion.div>
                      </button>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 sm:px-6 pb-6 pl-[4.75rem]">
                              <div className="h-px bg-gradient-to-r from-border to-transparent mb-4" />
                              <p className="text-[14.5px] text-muted-foreground leading-relaxed">
                                {faq.a}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {filtered.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16 rounded-2xl border border-dashed border-border/60 bg-card/40"
                >
                  <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
                    <MagnifyingGlass className="w-6 h-6 text-muted-foreground/50" weight="bold" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">Nenhuma pergunta encontrada</p>
                  <p className="text-xs text-muted-foreground mb-4">Tente outros termos ou outra categoria</p>
                  <button
                    onClick={() => { setSearch(""); setActiveCategory("all"); }}
                    className="text-primary text-xs font-bold hover:underline underline-offset-2"
                  >
                    Limpar filtros
                  </button>
                </motion.div>
              )}
            </div>

            {/* Contact CTA */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 relative overflow-hidden rounded-3xl p-7 sm:p-9 bg-gradient-to-br from-primary via-primary to-secondary text-primary-foreground shadow-xl shadow-primary/20"
            >
              <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-white/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-10 w-44 h-44 rounded-full bg-white/5 blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0 ring-1 ring-white/20">
                  <ChatCircleDots className="w-7 h-7" weight="fill" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-extrabold mb-1">Ainda tem dúvidas?</h3>
                  <p className="text-sm text-primary-foreground/80">
                    Nossa equipe responde por chat ou WhatsApp, todos os dias.
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    onClick={() => navigate("/suporte")}
                    className="bg-white text-primary hover:bg-white/90 rounded-xl px-5 font-bold"
                  >
                    Suporte <ArrowRight className="w-4 h-4 ml-1" weight="bold" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open("https://wa.me/5511999999999", "_blank")}
                    className="rounded-xl px-5 font-bold border-2 border-white/40 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
                  >
                    WhatsApp
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
});
FAQSection.displayName = "FAQSection";
export default FAQSection;
