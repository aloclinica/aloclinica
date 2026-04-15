import { useEffect, useState, forwardRef, useCallback } from "react";
import { db } from "@/integrations/supabase/untyped";
import { motion, AnimatePresence } from "framer-motion";
import { MagnifyingGlass, ChatCircleDots, Question, ArrowRight, CaretDown, Stethoscope, FileText, CreditCard, ShieldCheck, UserGear } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const categoryConfig: Record<string, { icon: typeof Question; color: string }> = {
  consulta: { icon: Stethoscope, color: "text-blue-500" },
  receita: { icon: FileText, color: "text-emerald-500" },
  plano: { icon: CreditCard, color: "text-violet-500" },
  segurança: { icon: ShieldCheck, color: "text-amber-500" },
  médico: { icon: UserGear, color: "text-rose-500" },
};

type FaqEntry = { q: string; a: string; category: string; };

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

const categories = [
  { key: "all", label: "Todas" },
  { key: "consulta", label: "Consultas" },
  { key: "receita", label: "Receitas" },
  { key: "plano", label: "Planos" },
  { key: "segurança", label: "Segurança" },
  { key: "médico", label: "Médicos" },
];

const FAQSection = forwardRef<HTMLElement>((_, ref) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<FaqEntry[]>(staticFaqs);

  useEffect(() => {
    db
      .from("faq_items")
      .select("question, answer, category")
      .eq("is_active", true)
      .order("order_index")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setFaqs(data.map((d) => ({ q: d.question, a: d.answer, category: d.category ?? "geral" })));
        }
      });
  }, []);

  const filtered = faqs.filter((faq) => {
    const matchSearch = search === "" || faq.q.toLowerCase().includes(search.toLowerCase()) || faq.a.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === "all" || faq.category === activeCategory;
    return matchSearch && matchCategory;
  });

  useEffect(() => {
    if (faqs.length === 0) return;
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map(f => ({
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
    <section id="faq" className="py-16 md:py-28 relative overflow-hidden" aria-labelledby="faq-heading">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/[0.03] blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-secondary/[0.03] blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12 md:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 text-primary text-xs font-bold tracking-wide uppercase mb-5">
            <Question className="w-3.5 h-3.5" weight="fill" />
            Central de ajuda
          </div>
          <h2 id="faq-heading" className="text-3xl md:text-5xl font-extrabold text-foreground mb-4" style={{ lineHeight: "1.1" }}>
            Perguntas frequentes
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto" style={{ textWrap: "balance" } as React.CSSProperties}>
            Encontre respostas rápidas sobre consultas, receitas, planos e segurança.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative mb-8"
          >
            <div className="relative group">
              <MagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60 transition-colors group-focus-within:text-primary" weight="bold" />
              <input
                type="text"
                placeholder="Pesquisar dúvida..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-13 pr-12 py-4 rounded-2xl bg-card border-2 border-border/60 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0 focus:border-primary/40 transition-all duration-300 shadow-sm focus:shadow-lg focus:shadow-primary/5"
                style={{ paddingLeft: "3.25rem" }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs font-medium bg-muted/60 px-2.5 py-1 rounded-lg transition-colors"
                >
                  Limpar
                </button>
              )}
            </div>
          </motion.div>

          {/* Category pills */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="mb-8"
          >
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {categories.map((cat, i) => {
              const isActive = activeCategory === cat.key;
              const count = cat.key === "all" ? faqs.length : faqs.filter((f) => f.category === cat.key).length;
              return (
                <motion.button
                  key={cat.key}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + i * 0.04 }}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-2 active:scale-95 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "bg-card text-muted-foreground border border-border/60 hover:border-primary/30 hover:text-foreground hover:shadow-sm"
                  }`}
                >
                  {cat.label}
                  <span className={`text-[10px] tabular-nums px-1.5 py-0.5 rounded-md font-bold ${
                    isActive ? "bg-white/20" : "bg-muted/80"
                  }`}>
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </div>
          </motion.div>

          {/* Search results count */}
          <AnimatePresence>
            {search && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-muted-foreground mb-4"
              >
                {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} para "<span className="font-semibold text-foreground">{search}</span>"
              </motion.p>
            )}
          </AnimatePresence>

          {/* FAQ Accordion */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((faq, i) => {
                const isOpen = openItem === faq.q;
                const catConfig = categoryConfig[faq.category];
                const CatIcon = catConfig?.icon || Question;

                return (
                  <motion.div
                    key={faq.q}
                    initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ delay: i * 0.04, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    layout
                  >
                    <div
                      className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                        isOpen
                          ? "bg-card border-primary/25 shadow-xl shadow-primary/[0.06]"
                          : "bg-card/80 border-border/50 hover:border-primary/15 hover:shadow-md hover:-translate-y-0.5"
                      }`}
                    >
                      <button
                        onClick={() => setOpenItem(isOpen ? null : faq.q)}
                        className="w-full flex items-center gap-4 px-5 sm:px-6 py-5 text-left cursor-pointer active:scale-[0.995] transition-transform"
                      >
                        {/* Category icon */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 ${
                          isOpen ? "bg-primary/10" : "bg-muted/60"
                        }`}>
                          <CatIcon className={`transition-colors duration-300 ${
                            isOpen ? "text-primary" : (catConfig?.color || "text-muted-foreground")
                          }`} weight="fill" style={{ width: "18px", height: "18px" }} />
                        </div>

                        {/* Question text */}
                        <span className={`flex-1 text-sm sm:text-[15px] font-semibold leading-snug transition-colors duration-200 ${
                          isOpen ? "text-foreground" : "text-foreground/85"
                        }`}>
                          {faq.q}
                        </span>

                        {/* Chevron */}
                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className="shrink-0"
                        >
                          <CaretDown className={`w-5 h-5 transition-colors duration-300 ${
                            isOpen ? "text-primary" : "text-muted-foreground/40"
                          }`} weight="bold" />
                        </motion.div>
                      </button>

                      {/* Answer */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 sm:px-6 pb-5 pl-[4.5rem]">
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {faq.a}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filtered.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-14"
              >
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <MagnifyingGlass className="w-7 h-7 text-muted-foreground/40" weight="bold" />
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Nenhuma pergunta encontrada</p>
                <p className="text-xs text-muted-foreground/60 mb-3">Tente buscar com outros termos</p>
                <button
                  onClick={() => { setSearch(""); setActiveCategory("all"); }}
                  className="text-primary text-xs font-semibold hover:underline underline-offset-2"
                >
                  Limpar filtros
                </button>
              </motion.div>
            )}
          </div>

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, y: 18, filter: "blur(4px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12 text-center relative overflow-hidden rounded-3xl border-2 border-border/50 bg-gradient-to-br from-card to-muted/30 p-8 sm:p-10 shadow-lg"
          >
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-primary/[0.04] blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <ChatCircleDots className="w-7 h-7 text-primary" weight="fill" />
              </div>
              <h3 className="text-xl font-extrabold text-foreground mb-2">Ainda tem dúvidas?</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Nossa equipe de suporte está disponível para ajudar você por chat ou WhatsApp.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Button
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground rounded-2xl px-7 font-bold shadow-lg shadow-primary/20"
                  onClick={() => navigate("/suporte")}
                >
                  Falar com suporte <ArrowRight className="w-4 h-4 ml-1" weight="bold" />
                </Button>
                <Button
                  variant="outline"
                  className="rounded-2xl px-7 font-bold border-2"
                  onClick={() => window.open("https://wa.me/5511999999999", "_blank")}
                >
                  WhatsApp
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
});
FAQSection.displayName = "FAQSection";
export default FAQSection;
