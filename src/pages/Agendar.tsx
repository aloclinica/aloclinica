import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, ArrowRight, Star, Video, Clock, Shield,
  Search, Stethoscope, UserCheck, SlidersHorizontal, TrendingUp, BadgePercent,
  ChevronDown,
} from "lucide-react";
import Header from "@/components/landing/Header";
import SEOHead from "@/components/SEOHead";
import { cn } from "@/lib/utils";

const specialties = [
  { name: "Clínico Geral", emoji: "🏥" },
  { name: "Cardiologia", emoji: "❤️" },
  { name: "Dermatologia", emoji: "🔬" },
  { name: "Pediatria", emoji: "👶" },
  { name: "Psicologia", emoji: "🧠" },
  { name: "Neurologia", emoji: "⚡" },
  { name: "Gastroenterologia", emoji: "🍽️" },
  { name: "Endocrinologia", emoji: "🔬" },
  { name: "Urologia", emoji: "💧" },
  { name: "Ginecologia", emoji: "♀️" },
  { name: "Ortopedia", emoji: "🦵" },
  { name: "Nutrição", emoji: "🥗" },
  { name: "Pneumologia", emoji: "💨" },
  { name: "Otorrinolaringologia", emoji: "👂" },
  { name: "Reumatologia", emoji: "🦴" },
  { name: "Infectologia", emoji: "🦠" },
  { name: "Alergologia", emoji: "🤧" },
  { name: "Fonoaudiologia", emoji: "🗣️" },
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
  care_areas?: string[];
}

type SortMode = "rating" | "price" | "available";

const Agendar = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSpecialty = searchParams.get("especialidade");

  const [search, setSearch] = useState("");
  const [doctors, setDoctors] = useState<PublicDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortMode>("rating");
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const [expandedBio, setExpandedBio] = useState<string | null>(null);

  // Load ALL doctors on mount
  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("doctor_profiles_public" as any)
        .select("id, full_name, display_name, avatar_url, crm, crm_state, crm_verified, bio, short_description, consultation_price, consultation_duration_min, rating, total_reviews, experience_years, available_now, available_for_telemedicine, sub_specialties")
        .eq("available_for_telemedicine", true);

      let doctorList = (data as unknown as PublicDoctor[]) ?? [];

      if (doctorList.length > 0) {
        const ids = doctorList.map((d) => d.id);
        const { data: areas } = await supabase
          .from("doctor_care_areas")
          .select("doctor_id, area_name")
          .in("doctor_id", ids);
        if (areas) {
          const areaMap: Record<string, string[]> = {};
          (areas as any[]).forEach((a: any) => {
            if (!areaMap[a.doctor_id]) areaMap[a.doctor_id] = [];
            areaMap[a.doctor_id].push(a.area_name);
          });
          doctorList = doctorList.map((d) => ({ ...d, care_areas: areaMap[d.id] ?? [] }));
        }
      }

      setDoctors(doctorList);
      setLoading(false);
    };
    fetchDoctors();
  }, []);

  // Filter + sort doctors
  const filteredDoctors = useMemo(() => {
    let list = [...doctors];

    // Filter by search (name or specialty)
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((d) => {
        const name = (d.display_name || d.full_name || "").toLowerCase();
        const bio = (d.bio || d.short_description || "").toLowerCase();
        const areas = (d.care_areas ?? []).join(" ").toLowerCase();
        return name.includes(q) || bio.includes(q) || areas.includes(q);
      });
    }

    // Sort
    if (sort === "rating") {
      list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sort === "price") {
      list.sort((a, b) => (a.consultation_price ?? 89) - (b.consultation_price ?? 89));
    } else if (sort === "available") {
      list.sort((a, b) => (b.available_now ? 1 : 0) - (a.available_now ? 1 : 0));
    }

    return list;
  }, [doctors, search, sort]);

  const handleSelectDoctor = (doctorId: string) => {
    const returnUrl = `/dashboard/schedule?doctor=${doctorId}&specialty=${encodeURIComponent(selectedSpecialty || "Clínico Geral")}`;
    navigate(`/paciente?redirect=${encodeURIComponent(returnUrl)}`);
  };

  const handleSelectSpecialty = (name: string) => {
    setSearchParams({ especialidade: name });
  };

  const visibleSpecs = showAllSpecs ? specialties : specialties.slice(0, 8);

  return (
    <>
      <SEOHead
        title={selectedSpecialty ? `${selectedSpecialty} — Agendar Teleconsulta | AloClínica` : "Agendar Consulta Online | AloClínica"}
        description="Escolha a especialidade e o médico ideal para sua teleconsulta. Atendimento por vídeo, rápido e seguro."
      />
      <div className="min-h-screen relative bg-background">
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-background to-background" />
        </div>
        <Header />

        <div className="pt-24 pb-20 px-4">
          <div className="max-w-4xl mx-auto">
            {/* ═══ HEADER ═══ */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-2">
                Agende sua <span className="text-primary">teleconsulta</span>
              </h1>
              <p className="text-muted-foreground max-w-lg mx-auto text-sm">
                Busque por especialidade ou nome do profissional
              </p>
            </motion.div>

            {/* ═══ SEARCH BAR ═══ */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="max-w-2xl mx-auto mb-6"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
                <Input
                  placeholder="Busque por especialidade ou nome do profissional..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 h-13 rounded-2xl text-sm border-border/60 shadow-sm focus-visible:ring-primary/30"
                />
              </div>
            </motion.div>

            {/* ═══ SPECIALTY CHIPS ═══ */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mb-6"
            >
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => setSearchParams({})}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border",
                    !selectedSpecialty
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card text-muted-foreground border-border/50 hover:border-primary/30 hover:text-foreground"
                  )}
                >
                  Todas
                </button>
                {visibleSpecs.map((spec) => (
                  <button
                    key={spec.name}
                    onClick={() => handleSelectSpecialty(spec.name)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border",
                      selectedSpecialty === spec.name
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-card text-muted-foreground border-border/50 hover:border-primary/30 hover:text-foreground"
                    )}
                  >
                    {spec.emoji} {spec.name}
                  </button>
                ))}
                {!showAllSpecs && specialties.length > 8 && (
                  <button
                    onClick={() => setShowAllSpecs(true)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold text-primary hover:bg-primary/5 transition-colors flex items-center gap-1"
                  >
                    +{specialties.length - 8} mais <ChevronDown className="w-3 h-3" />
                  </button>
                )}
              </div>
            </motion.div>

            {/* ═══ SORT FILTERS ═══ */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap items-center gap-2 mb-6"
            >
              <span className="text-xs text-muted-foreground mr-1">Ordenar:</span>
              {([
                { key: "rating" as SortMode, label: "Mais avaliados", icon: Star },
                { key: "price" as SortMode, label: "Menor preço", icon: BadgePercent },
                { key: "available" as SortMode, label: "Disponível agora", icon: Clock },
              ]).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setSort(key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                    sort === key
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "text-muted-foreground border-transparent hover:bg-muted"
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </motion.div>

            {/* ═══ DOCTOR LIST ═══ */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardContent className="p-5 flex gap-5">
                      <Skeleton className="w-24 h-28 rounded-xl shrink-0" />
                      <div className="space-y-3 flex-1">
                        <Skeleton className="h-5 w-2/3" />
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-3 w-1/3" />
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-20 rounded-full" />
                          <Skeleton className="h-6 w-24 rounded-full" />
                        </div>
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-10 w-32" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredDoctors.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Stethoscope className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  Nenhum médico encontrado
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
                  {search
                    ? "Tente outro termo de busca ou escolha outra especialidade."
                    : "No momento não há médicos disponíveis para esta especialidade."}
                </p>
                <Button variant="outline" onClick={() => { setSearch(""); setSearchParams({}); }} className="rounded-xl">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Ver todas as especialidades
                </Button>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {/* Results count */}
                <p className="text-xs text-muted-foreground">
                  {filteredDoctors.length} {filteredDoctors.length === 1 ? "profissional encontrado" : "profissionais encontrados"}
                  {selectedSpecialty ? ` em ${selectedSpecialty}` : ""}
                </p>

                {filteredDoctors.map((doc, i) => {
                  const name = doc.display_name || doc.full_name || "Médico";
                  const price = doc.consultation_price ?? 89;
                  const discountPrice = Math.round(price * 0.7 * 100) / 100;
                  const bioText = doc.bio || doc.short_description;
                  const areas = doc.care_areas ?? [];
                  const subSpecs = doc.sub_specialties ?? [];
                  const isBioExpanded = expandedBio === doc.id;

                  return (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.05, 0.3) }}
                    >
                      <Card className="border-border/50 hover:shadow-lg hover:border-primary/15 transition-all duration-300 group overflow-hidden">
                        <CardContent className="p-0">
                          <div className="flex flex-col sm:flex-row">
                            {/* ── Avatar column ── */}
                            <div className="sm:w-44 shrink-0 p-4 sm:p-5 flex sm:flex-col items-center gap-4 sm:gap-3 sm:border-r sm:border-border/30">
                              <div className="relative">
                                {doc.avatar_url ? (
                                  <img
                                    src={doc.avatar_url}
                                    alt={name}
                                    className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-primary/15"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/15">
                                    <span className="text-2xl sm:text-3xl font-bold text-primary">{name[0]}</span>
                                  </div>
                                )}
                                {doc.available_now && (
                                  <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-card rounded-full" />
                                )}
                              </div>
                              {doc.rating != null && doc.rating > 0 && (
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, idx) => (
                                    <Star
                                      key={idx}
                                      className={cn(
                                        "w-3.5 h-3.5",
                                        idx < Math.round(doc.rating!)
                                          ? "fill-amber-400 text-amber-400"
                                          : "text-muted-foreground/30"
                                      )}
                                    />
                                  ))}
                                  {doc.total_reviews ? (
                                    <span className="text-[11px] text-muted-foreground ml-0.5">({doc.total_reviews})</span>
                                  ) : null}
                                </div>
                              )}
                            </div>

                            {/* ── Info column ── */}
                            <div className="flex-1 p-4 sm:p-5 pt-0 sm:pt-5 space-y-2.5">
                              {/* Name + verified */}
                              <div className="flex items-start gap-2 flex-wrap">
                                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                                  {name}
                                </h3>
                                {doc.crm_verified && (
                                  <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white text-[10px] px-1.5 py-0 rounded-full shrink-0">
                                    <UserCheck className="w-3 h-3 mr-0.5" /> Verificado
                                  </Badge>
                                )}
                              </div>

                              {/* Specialty + online badge */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Badge className="bg-primary/10 hover:bg-primary/10 text-primary border-0 text-[11px] font-semibold rounded-md">
                                  {selectedSpecialty || "Clínico Geral"}
                                </Badge>
                                {doc.available_now && (
                                  <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-600 bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:bg-emerald-950 rounded-md">
                                    <Clock className="w-3 h-3 mr-1" /> Online agora
                                  </Badge>
                                )}
                              </div>

                              {/* CRM */}
                              <p className="text-xs text-muted-foreground">
                                Número de registro: <span className="font-semibold text-foreground">{doc.crm_state} {doc.crm}</span>
                              </p>

                              {/* Prices */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-muted-foreground">Valor:</span>
                                <span className="text-sm font-bold text-foreground">
                                  R$ {price.toFixed(2).replace(".", ",")}
                                </span>
                                <span className="text-xs text-muted-foreground">ou</span>
                                <Badge className="bg-amber-400 hover:bg-amber-400 text-amber-900 text-[11px] font-bold border-0 rounded-md px-2">
                                  R$ {discountPrice.toFixed(2).replace(".", ",")} Cartão de Desconto
                                </Badge>
                              </div>

                              {/* Care areas */}
                              {areas.length > 0 && (
                                <div>
                                  <p className="text-[11px] text-muted-foreground mb-1">Doenças tratadas:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {areas.slice(0, 5).map((area) => (
                                      <Badge key={area} variant="outline" className="text-[10px] px-2 py-0.5 rounded-md font-normal">
                                        {area}
                                      </Badge>
                                    ))}
                                    {areas.length > 5 && (
                                      <span className="text-[10px] text-primary font-medium cursor-pointer hover:underline self-center">
                                        Ver todas
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Sub specialties */}
                              {subSpecs.length > 0 && (
                                <div>
                                  <p className="text-[11px] text-muted-foreground mb-1">Áreas de interesse:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {subSpecs.slice(0, 3).map((spec) => (
                                      <Badge key={spec} variant="outline" className="text-[10px] px-2 py-0.5 rounded-md border-primary/20 text-primary/80 font-normal">
                                        {spec}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Bio */}
                              {bioText && (
                                <div className="border-t border-border/30 pt-2.5 mt-1">
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    {isBioExpanded ? bioText : bioText.slice(0, 150)}
                                    {bioText.length > 150 && !isBioExpanded && "... "}
                                    {bioText.length > 150 && (
                                      <button
                                        onClick={() => setExpandedBio(isBioExpanded ? null : doc.id)}
                                        className="text-primary font-medium hover:underline ml-0.5 inline"
                                      >
                                        {isBioExpanded ? "Ver menos" : "Saiba mais"}
                                      </button>
                                    )}
                                  </p>
                                </div>
                              )}

                              {/* CTA */}
                              <div className="pt-2">
                                <Button
                                  className="rounded-xl px-6 font-bold shadow-sm"
                                  onClick={() => handleSelectDoctor(doc.id)}
                                >
                                  Agendar Consulta
                                  <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* ═══ TRUST FOOTER ═══ */}
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
