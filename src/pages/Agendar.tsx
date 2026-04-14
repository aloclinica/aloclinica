import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, ArrowRight, Star, Video, MapPin, Clock, Shield,
  Search, Stethoscope, UserCheck
} from "lucide-react";
import Header from "@/components/landing/Header";
import SEOHead from "@/components/SEOHead";
import { cn } from "@/lib/utils";

const specialties = [
  { name: "Clínico Geral", emoji: "🏥", desc: "Primeiro acolhimento e atendimento geral" },
  { name: "Cardiologia", emoji: "❤️", desc: "Coração e saúde cardiovascular" },
  { name: "Dermatologia", emoji: "🔬", desc: "Pele, acne e estética" },
  { name: "Pediatria", emoji: "👶", desc: "Saúde infantil" },
  { name: "Psicologia", emoji: "🧠", desc: "Saúde mental e terapia" },
  { name: "Neurologia", emoji: "⚡", desc: "Sistema nervoso" },
  { name: "Gastroenterologia", emoji: "🍽️", desc: "Digestão e intestinos" },
  { name: "Endocrinologia", emoji: "🔬", desc: "Diabetes e hormônios" },
  { name: "Urologia", emoji: "💧", desc: "Sistema urinário" },
  { name: "Ginecologia", emoji: "♀️", desc: "Saúde da mulher" },
  { name: "Ortopedia", emoji: "🦵", desc: "Ossos e articulações" },
  { name: "Nutrição", emoji: "🥗", desc: "Dieta e emagrecimento" },
  { name: "Pneumologia", emoji: "💨", desc: "Pulmões e respiração" },
  { name: "Otorrinolaringologia", emoji: "👂", desc: "Ouvidos, nariz, garganta" },
  { name: "Reumatologia", emoji: "🦴", desc: "Articulações e inflamação" },
  { name: "Infectologia", emoji: "🦠", desc: "Infecções" },
  { name: "Alergologia", emoji: "🤧", desc: "Alergias" },
  { name: "Fonoaudiologia", emoji: "🗣️", desc: "Fala e audição" },
];

interface PublicDoctor {
  id: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  crm: string;
  crm_state: string;
  crm_verified: boolean;
  bio: string | null;
  short_description: string | null;
  consultation_price: number | null;
  consultation_duration_min: number | null;
  rating: number | null;
  total_reviews: number | null;
  experience_years: number | null;
  available_now: boolean;
  available_for_telemedicine: boolean | null;
  sub_specialties: string[] | null;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const Agendar = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSpecialty = searchParams.get("especialidade");

  const [search, setSearch] = useState("");
  const [doctors, setDoctors] = useState<PublicDoctor[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter specialties
  const filtered = specialties.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.desc.toLowerCase().includes(search.toLowerCase())
  );

  // Load doctors when specialty selected
  useEffect(() => {
    if (!selectedSpecialty) return;
    const fetchDoctors = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("doctor_profiles_public" as any)
        .select("id, full_name, display_name, avatar_url, crm, crm_state, crm_verified, bio, short_description, consultation_price, consultation_duration_min, rating, total_reviews, experience_years, available_now, available_for_telemedicine, sub_specialties")
        .eq("available_for_telemedicine", true);

      if (!error && data) {
        setDoctors(data as unknown as PublicDoctor[]);
      }
      setLoading(false);
    };
    fetchDoctors();
  }, [selectedSpecialty]);

  const handleSelectDoctor = (doctorId: string) => {
    // Redirect to login with return URL containing the doctor and specialty info
    const returnUrl = `/dashboard/schedule?doctor=${doctorId}&specialty=${encodeURIComponent(selectedSpecialty || "")}`;
    navigate(`/paciente/cadastro?redirect=${encodeURIComponent(returnUrl)}`);
  };

  const handleBack = () => {
    setSearchParams({});
    setDoctors([]);
  };

  return (
    <>
      <SEOHead
        title="Agendar Consulta Online | AloClínica"
        description="Escolha a especialidade e o médico ideal para sua teleconsulta. Atendimento por vídeo, rápido e seguro."
      />
      <div className="min-h-screen relative bg-background">
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(210,80%,92%)] via-[hsl(215,65%,88%)] to-[hsl(225,55%,85%)] dark:from-[hsl(210,40%,10%)] dark:via-[hsl(215,35%,13%)] dark:to-[hsl(225,30%,16%)]" />
        </div>
        <Header />

        <div className="pt-24 pb-20 px-4">
          <div className="max-w-5xl mx-auto">
            {/* Progress indicator */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-3 mb-10"
            >
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors",
                !selectedSpecialty ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
              )}>
                <span className="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xs font-bold">1</span>
                Especialidade
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors",
                selectedSpecialty ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                <span className="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xs font-bold">2</span>
                Médico
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-muted text-muted-foreground">
                <span className="w-6 h-6 rounded-full bg-muted-foreground/20 flex items-center justify-center text-xs font-bold">3</span>
                Entrar
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {!selectedSpecialty ? (
                /* ═══════════════ STEP 1: ESPECIALIDADE ═══════════════ */
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-3">
                      Qual especialidade você precisa?
                    </h1>
                    <p className="text-muted-foreground max-w-xl mx-auto">
                      Selecione a área de saúde e veja os médicos disponíveis para teleconsulta
                    </p>
                  </div>

                  {/* Search */}
                  <div className="max-w-md mx-auto mb-8">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar especialidade..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-11 h-12 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filtered.map((spec, i) => (
                      <motion.button
                        key={spec.name}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: (i % 12) * 0.03 }}
                        onClick={() => setSearchParams({ especialidade: spec.name })}
                        className="group text-left p-5 rounded-2xl border border-border/50 bg-card hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                      >
                        <div className="text-2xl mb-2">{spec.emoji}</div>
                        <h3 className="font-semibold text-foreground text-sm mb-1 group-hover:text-primary transition-colors">
                          {spec.name}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">{spec.desc}</p>
                      </motion.button>
                    ))}
                  </div>

                  {filtered.length === 0 && (
                    <p className="text-center text-muted-foreground py-12">Nenhuma especialidade encontrada.</p>
                  )}
                </motion.div>
              ) : (
                /* ═══════════════ STEP 2: MÉDICOS ═══════════════ */
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center gap-3 mb-8">
                    <Button variant="ghost" size="sm" onClick={handleBack} className="rounded-full">
                      <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                    </Button>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                        Médicos em {selectedSpecialty}
                      </h1>
                      <p className="text-sm text-muted-foreground">
                        Escolha o profissional ideal para sua consulta
                      </p>
                    </div>
                  </div>

                  {loading ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1, 2, 3].map((i) => (
                        <Card key={i} className="overflow-hidden">
                          <CardContent className="p-5">
                            <div className="flex items-center gap-4 mb-4">
                              <Skeleton className="w-14 h-14 rounded-full" />
                              <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                              </div>
                            </div>
                            <Skeleton className="h-3 w-full mb-2" />
                            <Skeleton className="h-10 w-full" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : doctors.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-16"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                        <Stethoscope className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-2">Nenhum médico disponível</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        No momento, não há médicos disponíveis para esta especialidade. Tente outra ou volte mais tarde.
                      </p>
                      <Button variant="outline" onClick={handleBack} className="rounded-xl">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Escolher outra especialidade
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {doctors.map((doc, i) => {
                        const name = doc.display_name || doc.full_name || "Médico";
                        const price = doc.consultation_price ?? 89;
                        return (
                          <motion.div
                            key={doc.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                          >
                            <Card className="h-full border-border/50 hover:shadow-xl hover:border-primary/20 transition-all duration-300 group overflow-hidden">
                              <CardContent className="p-5">
                                {/* Header */}
                                <div className="flex items-center gap-3.5 mb-4">
                                  <div className="relative">
                                    {doc.avatar_url ? (
                                      <img
                                        src={doc.avatar_url}
                                        alt={name}
                                        className="w-14 h-14 rounded-full object-cover border-2 border-primary/20"
                                        loading="lazy"
                                      />
                                    ) : (
                                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                                        <span className="text-lg font-bold text-primary">{name[0]}</span>
                                      </div>
                                    )}
                                    {doc.available_now && (
                                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-card rounded-full" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                                      {name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                      CRM {doc.crm}/{doc.crm_state}
                                    </p>
                                    {doc.rating && (
                                      <div className="flex items-center gap-1 mt-0.5">
                                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                        <span className="text-xs font-semibold text-foreground">{doc.rating}</span>
                                        {doc.total_reviews && (
                                          <span className="text-xs text-muted-foreground">({doc.total_reviews})</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Description */}
                                {doc.short_description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{doc.short_description}</p>
                                )}

                                {/* Badges */}
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                  {doc.crm_verified && (
                                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-full border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:bg-emerald-950">
                                      <UserCheck className="w-3 h-3 mr-1" /> Verificado
                                    </Badge>
                                  )}
                                  {doc.available_now && (
                                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-full border-primary/30 text-primary bg-primary/5">
                                      <Clock className="w-3 h-3 mr-1" /> Disponível agora
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-full">
                                    <Video className="w-3 h-3 mr-1" /> Teleconsulta
                                  </Badge>
                                </div>

                                {/* Price + CTA */}
                                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                                  <div>
                                    <p className="text-xs text-muted-foreground">A partir de</p>
                                    <p className="text-lg font-black text-foreground">
                                      R$ {price.toFixed(2).replace(".", ",")}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    className="rounded-xl px-5 font-bold"
                                    onClick={() => handleSelectDoctor(doc.id)}
                                  >
                                    Agendar
                                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Trust footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-6 mt-14 text-xs text-muted-foreground"
            >
              <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-primary" /> Conforme LGPD</span>
              <span className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5 text-primary" /> Vídeo criptografado</span>
              <span className="flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5 text-primary" /> CRM verificado</span>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Agendar;
