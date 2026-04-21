import { forwardRef, lazy, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, MagnifyingGlass } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/landing/Header";
import SEOHead from "@/components/SEOHead";

const Footer = lazy(() => import("@/components/landing/Footer"));

const specialties = [
  { name: "Cardiologia", emoji: "❤️", image: "/src/assets/pingo-cardiologista.png", desc: "Coração, circulação e saúde cardiovascular", doctors: 45 },
  { name: "Dermatologia", emoji: "🔬", image: "/src/assets/pingo-dermatologista.png", desc: "Pele, acne, envelhecimento e estética", doctors: 38 },
  { name: "Oftalmologia", emoji: "👁️", image: "/src/assets/pingo-oftalmologista.png", desc: "Visão, exames e prescrição de óculos", doctors: 52 },
  { name: "Pediatria", emoji: "👶", image: "/src/assets/pingo-pediatra.png", desc: "Saúde infantil e desenvolvimento", doctors: 41 },
  { name: "Psicologia", emoji: "🧠", image: "/src/assets/pingo-psiquiatra.png", desc: "Saúde mental, terapia e bem-estar", doctors: 67 },
  { name: "Neurologia", emoji: "⚡", image: "/src/assets/pingo-neurologista.png", desc: "Sistema nervoso, dores e distúrbios", doctors: 34 },
  { name: "Gastroenterologia", emoji: "🍽️", image: "/src/assets/pingo-gastroenterologista.png", desc: "Digestão, estômago e intestinos", doctors: 29 },
  { name: "Endocrinologia", emoji: "🔬", image: "/src/assets/pingo-endocrinologista.png", desc: "Diabetes, hormônios e metabolismo", doctors: 26 },
  { name: "Urologia", emoji: "💧", image: "/src/assets/pingo-urologista.png", desc: "Sistema urinário e saúde sexual", doctors: 32 },
  { name: "Otorrinolaringologia", emoji: "👂", image: "/src/assets/pingo-otorrino.png", desc: "Ouvidos, nariz e garganta", doctors: 28 },
  { name: "Reumatologia", emoji: "🦴", image: "/src/assets/pingo-reumatologista.png", desc: "Articulações, ossos e inflamação", doctors: 21 },
  { name: "Pneumologia", emoji: "💨", image: "/src/assets/pingo-pneumologista.png", desc: "Pulmões e sistema respiratório", doctors: 25 },
  { name: "Clínica Geral", emoji: "🏥", image: "/src/assets/pingo-clinico-geral.png", desc: "Atendimento geral e primeiro acolhimento", doctors: 89 },
  { name: "Ginecologia", emoji: "♀️", image: "/src/assets/pingo-ginecologista.png", desc: "Saúde da mulher e reprodutiva", doctors: 44 },
  { name: "Nutrição", emoji: "🥗", image: "/src/assets/pingo-nutricionista.png", desc: "Dietas, emagrecimento e nutrientes", doctors: 36 },
  { name: "Fisioterapia", emoji: "💪", image: "/src/assets/pingo-fisioterapeuta.png", desc: "Reabilitação e movimento", doctors: 42 },
  { name: "Fonoaudiologia", emoji: "🗣️", image: "/src/assets/pingo-fonoaudiologo.png", desc: "Fala, audição e comunicação", doctors: 18 },
  { name: "Ortopedia", emoji: "🦵", image: "/src/assets/pingo-ortopedista.png", desc: "Ossos, articulações e esportes", doctors: 51 },
  { name: "Infectologia", emoji: "🦠", image: "/src/assets/pingo-infectologista.png", desc: "Infecções e doenças infecciosas", doctors: 19 },
  { name: "Oncologia", emoji: "⚕️", image: "/src/assets/pingo-cirurgiao-onco.png", desc: "Câncer e tratamentos oncológicos", doctors: 22 },
  { name: "Nefrologia", emoji: "🫘", image: "/src/assets/spec-nefrologia.png", desc: "Rins e sistema urinário", doctors: 16 },
  { name: "Hepatologia", emoji: "🫀", image: "/src/assets/pingo-gastro.png", desc: "Fígado e doenças hepáticas", doctors: 14 },
  { name: "Alergologia", emoji: "🤧", image: "/src/assets/pingo-alergologista.png", desc: "Alergias e reações adversas", doctors: 23 },
  { name: "Psiquiatria", emoji: "🧠", image: "/src/assets/pingo-psiquiatra.png", desc: "Tratamento de transtornos mentais", doctors: 33 },
  { name: "Geriatria", emoji: "👴", image: "/src/assets/pingo-geriatra.png", desc: "Saúde do idoso e envelhecimento", doctors: 19 },
  { name: "Cirurgia Plástica", emoji: "✨", image: "/src/assets/pingo-cirurgiao-plastico.png", desc: "Procedimentos estéticos e reparadores", doctors: 15 },
  { name: "Acupuntura", emoji: "📍", image: "/src/assets/pingo-acupunturista.png", desc: "Medicina tradicional chinesa", doctors: 12 },
  { name: "Telemedicina 24h", emoji: "📞", image: "/src/assets/pingo-videocall.png", desc: "Atendimento de emergência anytime", doctors: 150 },
];

const Especialidades = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredSpecialties = useMemo(() => {
    return specialties.filter((spec) => {
      const matchesSearch = spec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spec.desc.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || spec.name === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const categories = Array.from(new Set(specialties.map((s) => s.name.charAt(0)))).sort();

  return (
    <div ref={ref} className="relative min-h-screen bg-background">
      <div className="absolute inset-0 -z-10 bg-[image:var(--landing-bg)] pointer-events-none" />

      <SEOHead
        title="Especialidades Médicas | AloClínica - 30+ Áreas de Saúde"
        description="Conheça as 30+ especialidades disponíveis na AloClínica. De Cardiologia a Psicologia, encontre o médico ideal."
        canonical="https://aloclinica.com.br/especialidades"
      />

      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
              30+ Especialidades
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-6">
              Encontre o <span className="text-primary">Especialista Ideal</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              De Cardiologia a Psicologia, temos médicos especializados em todas as áreas de saúde.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <div className="max-w-2xl mx-auto">
            <div className="relative mb-6">
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" weight="bold" />
              <Input
                type="text"
                placeholder="Procure por especialidade ou sintoma..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 rounded-xl text-base"
              />
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => setSelectedCategory(null)}
              >
                Todas ({specialties.length})
              </Button>
              {Array.from(new Set(specialties.map((s) => s.name.charAt(0))))
                .sort()
                .map((letter) => (
                  <Button
                    key={letter}
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() =>
                      setSelectedCategory(
                        selectedCategory === letter ? null : letter
                      )
                    }
                  >
                    {letter}
                  </Button>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* Specialties Grid */}
      <section className="py-20 px-4">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <div className="mb-6">
            <p className="text-muted-foreground text-center">
              Exibindo <span className="font-semibold text-foreground">{filteredSpecialties.length}</span> especialidades
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSpecialties.map((specialty, i) => (
              <motion.button
                key={specialty.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (i % 12) * 0.05 }}
                onClick={() => navigate(`/agendar?especialidade=${encodeURIComponent(specialty.name)}`)}
                className="group relative overflow-hidden text-left p-6 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="relative w-20 h-20 bg-primary/5 rounded-2xl flex items-center justify-center overflow-hidden group-hover:bg-primary/10 transition-colors">
                    <img 
                      src={specialty.image} 
                      alt={`Pingo ${specialty.name}`}
                      className="w-full h-full object-contain pingo-float"
                      onError={(e) => {
                        // Fallback to emoji if image fails to load
                        e.currentTarget.style.display = 'none';
                        const emojiSpan = e.currentTarget.parentElement?.querySelector('.emoji-fallback');
                        if (emojiSpan) emojiSpan.classList.remove('hidden');
                      }}
                    />
                    <span className="emoji-fallback hidden text-4xl">{specialty.emoji}</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" weight="bold" />
                </div>
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {specialty.name}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                  {specialty.desc}
                </p>
                <div className="inline-flex items-center gap-1 text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {specialty.doctors}+ médicos
                </div>
              </motion.button>
            ))}
          </div>

          {filteredSpecialties.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-muted-foreground text-lg">
                Nenhuma especialidade encontrada. Tente outra busca.
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { metric: "30+", label: "Especialidades" },
              { metric: "500+", label: "Médicos" },
              { metric: "24h", label: "Disponibilidade" },
              { metric: "4.9★", label: "Avaliação" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-3xl sm:text-4xl font-extrabold text-primary mb-2">
                  {item.metric}
                </div>
                <p className="text-muted-foreground text-sm">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden bg-gradient-hero shadow-elevated"
          >
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary-foreground)/0.22),transparent_38%),radial-gradient(circle_at_bottom_right,hsl(var(--primary-foreground)/0.14),transparent_34%)]" />
            <div className="relative z-10 flex flex-col items-center justify-center gap-6 px-6 sm:px-10 py-16 sm:py-20 text-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-primary-foreground mb-2">
                  Pronto para uma consulta?
                </h2>
                <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
                  Escolha uma especialidade e agende com o primeiro médico disponível.
                </p>
              </div>
              <Button
                size="lg"
                className="bg-background text-primary hover:bg-background/95 rounded-2xl px-8 gap-2.5 font-extrabold"
                onClick={() => navigate("/paciente/cadastro")}
              >
                Agendar Agora
                <ArrowRight className="w-5 h-5" weight="bold" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
});

Especialidades.displayName = "Especialidades";
export default Especialidades;
