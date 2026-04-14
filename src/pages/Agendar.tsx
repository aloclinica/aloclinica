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
  Search, Stethoscope, UserCheck, BadgePercent,
  ChevronDown, MapPin, GraduationCap, Heart, Zap,
  CalendarCheck, CheckCircle2, HeartPulse,
} from "lucide-react";
import Header from "@/components/landing/Header";
import SEOHead from "@/components/SEOHead";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import LazyAvatar from "@/components/ui/lazy-avatar";

/* ─── Pingo specialty images ─── */
import pingoClinicoGeral from "@/assets/pingo-clinico-geral.png";
import pingoCardiologista from "@/assets/pingo-cardiologista.png";
import pingoDermatologista from "@/assets/pingo-dermatologista.png";
import pingoPediatra from "@/assets/pingo-pediatra.png";
import pingoPsiquiatra from "@/assets/pingo-psiquiatra.png";
import pingoNeurologista from "@/assets/pingo-neurologista.png";
import pingoGastro from "@/assets/pingo-gastro.png";
import pingoEndocrino from "@/assets/pingo-endocrino.png";
import pingoUrologista from "@/assets/pingo-urologista.png";
import pingoGinecologista from "@/assets/pingo-ginecologista.png";
import pingoOrtopedista from "@/assets/pingo-ortopedista.png";
import pingoNutricionista from "@/assets/pingo-nutricionista.png";
import pingoPneumologista from "@/assets/pingo-pneumologista.png";
import pingoOtorrino from "@/assets/pingo-otorrino.png";
import pingoReumatologista from "@/assets/pingo-reumatologista.png";
import pingoInfectologista from "@/assets/pingo-infectologista.png";
import pingoAlergologista from "@/assets/pingo-alergologista.png";
import pingoFonoaudiologo from "@/assets/pingo-fonoaudiologo.png";

/* ─── Specialty catalogue ─── */
const specialties = [
  { name: "Clínico Geral", img: pingoClinicoGeral, color: "from-blue-500/15 to-cyan-500/10 border-blue-200 dark:border-blue-800" },
  { name: "Cardiologia", img: pingoCardiologista, color: "from-red-500/15 to-rose-500/10 border-red-200 dark:border-red-800" },
  { name: "Dermatologia", img: pingoDermatologista, color: "from-pink-500/15 to-fuchsia-500/10 border-pink-200 dark:border-pink-800" },
  { name: "Pediatria", img: pingoPediatra, color: "from-sky-500/15 to-blue-500/10 border-sky-200 dark:border-sky-800" },
  { name: "Psicologia", img: pingoPsiquiatra, color: "from-violet-500/15 to-purple-500/10 border-violet-200 dark:border-violet-800" },
  { name: "Neurologia", img: pingoNeurologista, color: "from-amber-500/15 to-yellow-500/10 border-amber-200 dark:border-amber-800" },
  { name: "Gastroenterologia", img: pingoGastro, color: "from-orange-500/15 to-amber-500/10 border-orange-200 dark:border-orange-800" },
  { name: "Endocrinologia", img: pingoEndocrino, color: "from-teal-500/15 to-emerald-500/10 border-teal-200 dark:border-teal-800" },
  { name: "Urologia", img: pingoUrologista, color: "from-cyan-500/15 to-sky-500/10 border-cyan-200 dark:border-cyan-800" },
  { name: "Ginecologia", img: pingoGinecologista, color: "from-rose-500/15 to-pink-500/10 border-rose-200 dark:border-rose-800" },
  { name: "Ortopedia", img: pingoOrtopedista, color: "from-emerald-500/15 to-green-500/10 border-emerald-200 dark:border-emerald-800" },
  { name: "Nutrição", img: pingoNutricionista, color: "from-lime-500/15 to-green-500/10 border-lime-200 dark:border-lime-800" },
  { name: "Pneumologia", img: pingoPneumologista, color: "from-indigo-500/15 to-blue-500/10 border-indigo-200 dark:border-indigo-800" },
  { name: "Otorrinolaringologia", img: pingoOtorrino, color: "from-purple-500/15 to-indigo-500/10 border-purple-200 dark:border-purple-800" },
  { name: "Reumatologia", img: pingoReumatologista, color: "from-stone-500/15 to-neutral-500/10 border-stone-200 dark:border-stone-800" },
  { name: "Infectologia", img: pingoInfectologista, color: "from-green-500/15 to-emerald-500/10 border-green-200 dark:border-green-800" },
  { name: "Alergologia", img: pingoAlergologista, color: "from-yellow-500/15 to-amber-500/10 border-yellow-200 dark:border-yellow-800" },
  { name: "Fonoaudiologia", img: pingoFonoaudiologo, color: "from-fuchsia-500/15 to-pink-500/10 border-fuchsia-200 dark:border-fuchsia-800" },
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
  education: string | null;
  care_areas?: string[];
}

type SortMode = "rating" | "price" | "available";

/* ─── Steps indicator ─── */
const StepIndicator = ({ step }: { step: 1 | 2 }) => (
  <div className="flex items-center justify-center gap-2 mb-6">
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
      step === 1 ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
    )}>
      {step > 1 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-4 h-4 rounded-full bg-primary-foreground/20 flex items-center justify-center text-[10px]">1</span>}
      Especialidade
    </div>
    <div className="w-6 h-px bg-border" />
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
      step === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
    )}>
      <span className="w-4 h-4 rounded-full bg-current/10 flex items-center justify-center text-[10px]">2</span>
      Profissional
    </div>
  </div>
);

/* ─── Format currency ─── */
const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const Agendar = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSpecialty = searchParams.get("especialidade");

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [doctors, setDoctors] = useState<PublicDoctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<SortMode>("rating");
  const [expandedBio, setExpandedBio] = useState<string | null>(null);
  const [showAllSpecs, setShowAllSpecs] = useState(false);

  // Load doctors when a specialty is selected
  useEffect(() => {
    if (!selectedSpecialty) {
      setDoctors([]);
      setLoading(false);
      return;
    }

    const fetchDoctors = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("doctor_profiles_public" as any)
        .select("id, full_name, display_name, avatar_url, crm, crm_state, crm_verified, bio, short_description, consultation_price, consultation_duration_min, rating, total_reviews, experience_years, available_now, available_for_telemedicine, sub_specialties, education")
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
  }, [selectedSpecialty]);

  // Filter + sort
  const filteredDoctors = useMemo(() => {
    let list = [...doctors];
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter((d) => {
        const name = (d.display_name || d.full_name || "").toLowerCase();
        const bio = (d.bio || d.short_description || "").toLowerCase();
        const areas = (d.care_areas ?? []).join(" ").toLowerCase();
        return name.includes(q) || bio.includes(q) || areas.includes(q);
      });
    }
    if (sort === "rating") list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    else if (sort === "price") list.sort((a, b) => (a.consultation_price ?? 89) - (b.consultation_price ?? 89));
    else list.sort((a, b) => (b.available_now ? 1 : 0) - (a.available_now ? 1 : 0));
    return list;
  }, [doctors, debouncedSearch, sort]);

  const handleSelectDoctor = (doctorId: string) => {
    const returnUrl = `/dashboard/schedule?doctor=${doctorId}&specialty=${encodeURIComponent(selectedSpecialty || "Clínico Geral")}`;
    navigate(`/paciente?redirect=${encodeURIComponent(returnUrl)}`);
  };

  const handleSelectSpecialty = (name: string) => {
    setSearch("");
    setSearchParams({ especialidade: name });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToSpecialties = () => {
    setSearchParams({});
    setSearch("");
  };

  const visibleSpecs = showAllSpecs ? specialties : specialties.slice(0, 12);

  return (
    <>
      <SEOHead
        title={selectedSpecialty ? `${selectedSpecialty} — Agendar Teleconsulta | AloClínica` : "Agendar Consulta Online | AloClínica"}
        description="Escolha a especialidade e o médico ideal para sua teleconsulta. Atendimento por vídeo, rápido e seguro."
      />
      <div className="min-h-screen relative bg-background">
        {/* Background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-background to-background" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/[0.04] rounded-full blur-3xl" />
        </div>

        <Header />

        <div className="pt-24 pb-20 px-4">
          <div className="max-w-5xl mx-auto">

            {/* ═══════ STEP 1: SPECIALTIES ═══════ */}
            <AnimatePresence mode="wait">
              {!selectedSpecialty ? (
                <motion.div
                  key="specialties"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <StepIndicator step={1} />

                  {/* Hero */}
                  <div className="text-center mb-10">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4"
                    >
                      <HeartPulse className="w-3.5 h-3.5" />
                      Teleconsulta — Atendimento 100% Online
                    </motion.div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight mb-3">
                      Qual especialidade{" "}
                      <span className="text-gradient-brand">você precisa?</span>
                    </h1>
                    <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base">
                      Selecione a área médica e encontre profissionais verificados prontos para te atender por vídeo.
                    </p>
                  </div>

                  {/* Specialty Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
                    {visibleSpecs.map((spec, i) => (
                      <motion.button
                        key={spec.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        whileHover={{ y: -3, scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleSelectSpecialty(spec.name)}
                        className={cn(
                          "relative flex flex-col items-center gap-2 p-5 rounded-2xl border bg-gradient-to-br transition-all duration-200",
                          "hover:shadow-md hover:border-primary/30 group cursor-pointer",
                          spec.color
                        )}
                      >
                        <img src={spec.img} alt={spec.name} className="w-12 h-12 sm:w-16 sm:h-16 object-contain" loading="lazy" />
                        <span className="text-xs sm:text-sm font-semibold text-foreground text-center leading-tight">
                          {spec.name}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors absolute top-3 right-3 opacity-0 group-hover:opacity-100" />
                      </motion.button>
                    ))}
                  </div>

                  {!showAllSpecs && specialties.length > 12 && (
                    <div className="text-center mt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllSpecs(true)}
                        className="text-primary text-sm gap-1"
                      >
                        Ver mais especialidades
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {/* Trust Badges */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mt-14 pt-8 border-t border-border/40"
                  >
                    {[
                      { icon: Shield, label: "Conforme LGPD" },
                      { icon: Video, label: "Vídeo criptografado" },
                      { icon: UserCheck, label: "CRM verificado" },
                      { icon: CalendarCheck, label: "Agendamento imediato" },
                    ].map(({ icon: Icon, label }) => (
                      <span key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Icon className="w-4 h-4 text-primary" />
                        {label}
                      </span>
                    ))}
                  </motion.div>
                </motion.div>
              ) : (
                /* ═══════ STEP 2: DOCTOR LIST ═══════ */
                <motion.div
                  key="doctors"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <StepIndicator step={2} />

                  {/* Back + Title */}
                  <div className="flex items-center gap-3 mb-6">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleBackToSpecialties}
                      className="rounded-xl shrink-0 h-10 w-10"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="min-w-0">
                      <h1 className="text-xl sm:text-2xl font-black text-foreground truncate">
                        {selectedSpecialty}
                      </h1>
                      <p className="text-xs text-muted-foreground">
                        Escolha um profissional para sua teleconsulta
                      </p>
                    </div>
                  </div>

                  {/* Search + Sort Bar */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nome ou área de atuação..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 h-11 rounded-xl text-sm border-border/60 shadow-sm focus-visible:ring-primary/30"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 bg-muted/50 rounded-xl p-1 shrink-0">
                      {([
                        { key: "rating" as SortMode, label: "Avaliação", icon: Star },
                        { key: "price" as SortMode, label: "Preço", icon: BadgePercent },
                        { key: "available" as SortMode, label: "Online", icon: Zap },
                      ]).map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          onClick={() => setSort(key)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                            sort === key
                              ? "bg-card text-primary shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Icon className="w-3 h-3" />
                          <span className="hidden sm:inline">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Doctor List */}
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Card key={i} variant="elevated" className="overflow-hidden">
                          <CardContent className="p-5 flex gap-5">
                            <Skeleton className="w-20 h-20 rounded-2xl shrink-0" />
                            <div className="space-y-3 flex-1">
                              <Skeleton className="h-5 w-2/3" />
                              <Skeleton className="h-4 w-1/3" />
                              <Skeleton className="h-3 w-full" />
                              <div className="flex gap-2">
                                <Skeleton className="h-7 w-24 rounded-full" />
                                <Skeleton className="h-7 w-20 rounded-full" />
                              </div>
                              <Skeleton className="h-10 w-36" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : filteredDoctors.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-16"
                    >
                      <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                        <Stethoscope className="w-10 h-10 text-primary/60" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-2">
                        Nenhum profissional encontrado
                      </h3>
                      <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
                        {debouncedSearch
                          ? "Tente outro termo de busca ou volte para ver todas as especialidades."
                          : "No momento não há profissionais disponíveis nesta especialidade."}
                      </p>
                      <Button variant="outline" className="rounded-xl" onClick={handleBackToSpecialties}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar às especialidades
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xs text-muted-foreground font-medium">
                        {filteredDoctors.length} {filteredDoctors.length === 1 ? "profissional" : "profissionais"} disponíveis
                      </p>

                      {filteredDoctors.map((doc, i) => {
                        const name = doc.display_name || doc.full_name || "Médico";
                        const price = doc.consultation_price ?? 89;
                        
                        const bioText = doc.bio || doc.short_description;
                        const areas = doc.care_areas ?? [];
                        const subSpecs = doc.sub_specialties ?? [];
                        const isBioExpanded = expandedBio === doc.id;
                        const duration = doc.consultation_duration_min ?? 30;

                        return (
                          <motion.div
                            key={doc.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(i * 0.06, 0.3) }}
                          >
                            <Card
                              variant="interactive"
                              className="overflow-hidden cursor-pointer"
                              onClick={() => handleSelectDoctor(doc.id)}
                            >
                              <CardContent className="p-0">
                                <div className="flex flex-col sm:flex-row">
                                  {/* Avatar Section */}
                                  <div className="sm:w-48 shrink-0 p-4 sm:p-5 flex sm:flex-col items-center gap-4 sm:gap-3 sm:border-r sm:border-border/30 sm:bg-muted/20">
                                    <div className="relative">
                                      {doc.avatar_url ? (
                                        <img
                                          src={doc.avatar_url}
                                          alt={name}
                                          className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl object-cover ring-2 ring-primary/10"
                                          loading="lazy"
                                        />
                                      ) : (
                                        <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-2 ring-primary/10">
                                          <span className="text-2xl sm:text-4xl font-black text-primary/60">{name[0]}</span>
                                        </div>
                                      )}
                                      {doc.available_now && (
                                        <span className="absolute -bottom-1 -right-1 flex h-5 w-5">
                                          <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-60" />
                                          <span className="relative rounded-full h-5 w-5 bg-emerald-500 border-2 border-card" />
                                        </span>
                                      )}
                                    </div>

                                    {/* Rating */}
                                    {doc.rating != null && doc.rating > 0 && (
                                      <div className="flex items-center gap-1.5">
                                        <div className="flex items-center gap-0.5">
                                          {[...Array(5)].map((_, idx) => (
                                            <Star
                                              key={idx}
                                              className={cn(
                                                "w-3 h-3",
                                                idx < Math.round(doc.rating!)
                                                  ? "fill-amber-400 text-amber-400"
                                                  : "text-muted-foreground/20"
                                              )}
                                            />
                                          ))}
                                        </div>
                                        {doc.total_reviews ? (
                                          <span className="text-[10px] text-muted-foreground">({doc.total_reviews})</span>
                                        ) : null}
                                      </div>
                                    )}

                                    {/* Price mobile */}
                                    <div className="sm:hidden flex flex-col items-end ml-auto">
                                      <span className="text-lg font-black text-foreground">{formatBRL(price)}</span>
                                    </div>
                                  </div>

                                  {/* Info Section */}
                                  <div className="flex-1 p-4 sm:p-5 pt-0 sm:pt-5 space-y-3">
                                    {/* Name row */}
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <h3 className="text-lg font-bold text-foreground leading-tight">
                                            {name}
                                          </h3>
                                          {doc.crm_verified && (
                                            <Badge className="bg-emerald-500/10 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] px-2 py-0 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0">
                                              <UserCheck className="w-3 h-3 mr-0.5" /> Verificado
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                          <span className="text-xs text-muted-foreground">
                                            CRM {doc.crm_state} {doc.crm}
                                          </span>
                                          {doc.experience_years && doc.experience_years > 0 && (
                                            <>
                                              <span className="text-muted-foreground/30">•</span>
                                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <GraduationCap className="w-3 h-3" />
                                                {doc.experience_years} anos exp.
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      </div>

                                      {/* Price desktop */}
                                      <div className="hidden sm:flex flex-col items-end shrink-0">
                                        <span className="text-xl font-black text-foreground">{formatBRL(price)}</span>
                                      </div>
                                    </div>

                                    {/* Tags row */}
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-md bg-primary/5 border-primary/20 text-primary font-semibold">
                                        <Video className="w-3 h-3 mr-1" /> Teleconsulta
                                      </Badge>
                                      <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-md border-border/50 text-muted-foreground">
                                        <Clock className="w-3 h-3 mr-1" /> {duration} min
                                      </Badge>
                                      {doc.available_now && (
                                        <Badge className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 font-semibold">
                                          <Zap className="w-3 h-3 mr-0.5" /> Disponível agora
                                        </Badge>
                                      )}
                                    </div>

                                    {/* Care areas */}
                                    {areas.length > 0 && (
                                      <div>
                                        <p className="text-[10px] text-muted-foreground font-medium mb-1.5 uppercase tracking-wider">
                                          Áreas de atuação
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                          {areas.slice(0, 5).map((area) => (
                                            <Badge key={area} variant="outline" className="text-[10px] px-2 py-0.5 rounded-md font-normal border-border/40">
                                              {area}
                                            </Badge>
                                          ))}
                                          {areas.length > 5 && (
                                            <span className="text-[10px] text-primary font-medium self-center">
                                              +{areas.length - 5}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Bio */}
                                    {bioText && (
                                      <div className="border-t border-border/30 pt-2.5">
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                          {isBioExpanded ? bioText : bioText.slice(0, 140)}
                                          {bioText.length > 140 && !isBioExpanded && "… "}
                                          {bioText.length > 140 && (
                                            <button
                                              onClick={(e) => { e.stopPropagation(); setExpandedBio(isBioExpanded ? null : doc.id); }}
                                              className="text-primary font-medium hover:underline ml-0.5 inline"
                                            >
                                              {isBioExpanded ? "menos" : "ver mais"}
                                            </button>
                                          )}
                                        </p>
                                      </div>
                                    )}

                                    {/* CTA */}
                                    <div className="pt-1.5">
                                      <Button
                                        className="rounded-xl px-6 font-bold shadow-sm h-10"
                                        onClick={(e) => { e.stopPropagation(); handleSelectDoctor(doc.id); }}
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

                  {/* Trust badges */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-wrap items-center justify-center gap-6 mt-12 text-xs text-muted-foreground"
                  >
                    <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-primary" /> LGPD</span>
                    <span className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5 text-primary" /> Vídeo seguro</span>
                    <span className="flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5 text-primary" /> CRM verificado</span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
};

export default Agendar;
