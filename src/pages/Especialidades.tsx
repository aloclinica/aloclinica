import { forwardRef, lazy, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, MagnifyingGlass } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/landing/Header";
import SEOHead from "@/components/SEOHead";
import { PINGO_SPECIALTIES } from "@/constants/specialties-assets";

const Footer = lazy(() => import("@/components/landing/Footer"));

const specialties = [
  { name: "Cardiologia", image: PINGO_SPECIALTIES["Cardiologia"], desc: "Coração, circulação e saúde cardiovascular", doctors: 45 },
  { name: "Dermatologia", image: PINGO_SPECIALTIES["Dermatologia"], desc: "Pele, acne, envelhecimento e estética", doctors: 38 },
  { name: "Oftalmologia", image: PINGO_SPECIALTIES["Oftalmologia"], desc: "Visão, exames e prescrição de óculos", doctors: 52 },
  { name: "Pediatria", image: PINGO_SPECIALTIES["Pediatria"], desc: "Saúde infantil e desenvolvimento", doctors: 41 },
  { name: "Psiquiatria", image: PINGO_SPECIALTIES["Psiquiatria"], desc: "Transtornos mentais e equilíbrio emocional", doctors: 33 },
  { name: "Neurologia", image: PINGO_SPECIALTIES["Neurologia"], desc: "Sistema nervoso, dores e distúrbios", doctors: 34 },
  { name: "Gastroenterologia", image: PINGO_SPECIALTIES["Gastroenterologia"], desc: "Digestão, estômago e intestinos", doctors: 29 },
  { name: "Endocrinologia", image: PINGO_SPECIALTIES["Endocrinologia"], desc: "Diabetes, hormônios e metabolismo", doctors: 26 },
  { name: "Urologia", image: PINGO_SPECIALTIES["Urologia"], desc: "Sistema urinário e saúde sexual", doctors: 32 },
  { name: "Otorrinolaringologia", image: PINGO_SPECIALTIES["Otorrinolaringologia"], desc: "Ouvidos, nariz e garganta", doctors: 28 },
  { name: "Reumatologia", image: PINGO_SPECIALTIES["Reumatologia"], desc: "Articulações, ossos e inflamação", doctors: 21 },
  { name: "Pneumologia", image: PINGO_SPECIALTIES["Pneumologia"], desc: "Pulmões e sistema respiratório", doctors: 25 },
  { name: "Clínico Geral", image: PINGO_SPECIALTIES["Clínico Geral"], desc: "Atendimento geral e primeiro acolhimento", doctors: 89 },
  { name: "Ginecologia", image: PINGO_SPECIALTIES["Ginecologista-obstetra"], desc: "Saúde da mulher e reprodutiva", doctors: 44 },
  { name: "Nutricionista", image: PINGO_SPECIALTIES["Nutricionista"], desc: "Dietas, emagrecimento e alimentação saudável", doctors: 36 },
  { name: "Fisioterapia", image: PINGO_SPECIALTIES["Fisioterapia"], desc: "Reabilitação, movimento e dores físicas", doctors: 42 },
  { name: "Fonoaudiologia", image: PINGO_SPECIALTIES["Fonoaudiologia"], desc: "Fala, audição e comunicação oral", doctors: 18 },
  { name: "Ortopedia", image: PINGO_SPECIALTIES["Ortopedia"], desc: "Ossos, articulações e lesões esportivas", doctors: 51 },
  { name: "Infectologia", image: PINGO_SPECIALTIES["Infectologia"], desc: "Tratamento de infecções e vírus", doctors: 19 },
  { name: "Oncologia", image: PINGO_SPECIALTIES["Oncologia"], desc: "Diagnóstico e tratamento de câncer", doctors: 22 },
  { name: "Nefrologia", image: PINGO_SPECIALTIES["Nefrologia"], desc: "Saúde dos rins e sistema urinário", doctors: 16 },
  { name: "Alergologia", image: PINGO_SPECIALTIES["Alergologista"], desc: "Alergias e reações do sistema imune", doctors: 23 },
  { name: "Geriatria", image: PINGO_SPECIALTIES["Geriatria"], desc: "Saúde do idoso e envelhecimento ativo", doctors: 19 },
  { name: "Cirurgia Plástica", image: PINGO_SPECIALTIES["Cirurgia Plástica"], desc: "Procedimentos estéticos e reparadores", doctors: 15 },
  { name: "Acupuntura", image: PINGO_SPECIALTIES["Acupuntura"], desc: "Alívio de dores e equilíbrio energético", doctors: 12 },
  { name: "Angiologia", image: PINGO_SPECIALTIES["Angiologia"], desc: "Saúde dos vasos sanguíneos e linfáticos", doctors: 14 },
  { name: "Hematologia", image: PINGO_SPECIALTIES["Hematologia"], desc: "Doenças do sangue e medula óssea", doctors: 11 },
  { name: "Mastologia", image: PINGO_SPECIALTIES["Mastologia"], desc: "Saúde das mamas e prevenção", doctors: 13 },
  { name: "Médico de Família", image: PINGO_SPECIALTIES["Médico de família"], desc: "Acompanhamento integral da família", doctors: 27 },
  { name: "Med. do Esporte", image: PINGO_SPECIALTIES["Med. do Esporte"], desc: "Performance e saúde no exercício", doctors: 10 },
  { name: "Cirurgia Vascular", image: PINGO_SPECIALTIES["Cirurgia Vascular"], desc: "Tratamento cirúrgico de veias e artérias", doctors: 9 },
  { name: "Psicologia", image: PINGO_SPECIALTIES["Psiquiatria"], desc: "Saúde mental, terapia e bem-estar", doctors: 67 },
  { name: "Anestesiologia", image: PINGO_SPECIALTIES["Anestesiologia"], desc: "Controle de dor e sedação em cirurgias", doctors: 12 },
  { name: "Cirurgião Dentista", image: "/src/assets/pingo-cirurgiao-dentista.png", desc: "Saúde bucal e procedimentos odontológicos", doctors: 24 },
  { name: "Hepatologia", image: PINGO_SPECIALTIES["Gastroenterologia"], desc: "Diagnóstico e tratamento de doenças do fígado", doctors: 14 },
  { name: "Telemedicina 24h", image: "/src/assets/pingo-videocall.png", desc: "Atendimento imediato a qualquer hora", doctors: 150 },
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
                      className="w-full h-full object-contain pingo-float drop-shadow-sm group-hover:drop-shadow-md transition-all"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallbackIcon = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                        if (fallbackIcon) fallbackIcon.classList.remove('hidden');
                      }}
                    />
                    <div className="fallback-icon hidden text-primary/40">
                      <ArrowRight className="w-10 h-10" weight="thin" />
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" weight="bold" />
                </div>
                <h3 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors text-lg">
                  {specialty.name}
                </h3>
                <p className="text-[13px] text-muted-foreground line-clamp-2 mb-4 leading-snug">
                  {specialty.desc}
                </p>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-wider">
                  {specialty.doctors}+ especialistas
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
