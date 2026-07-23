import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/integrations/supabase/untyped";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowRight, Info, Stethoscope, Sparkles, AlertTriangle } from "lucide-react";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getPatientNav } from "./patientNav";

interface TriageOption {
  emoji: string;
  label: string;
  hint: string;
  // Nome exato da especialidade — usado para resolver o id na tabela `specialties`.
  specialty: string;
}

// Mapeamento estático (sem IA): sintoma/área principal → especialidade recomendada.
// Nomes alinhados com a tabela `specialties` (mesma grafia usada no cadastro médico).
const TRIAGE_OPTIONS: TriageOption[] = [
  { emoji: "🤒", label: "Gripe, febre ou mal-estar", hint: "Resfriado, febre, dores no corpo", specialty: "Clínico Geral" },
  { emoji: "👂", label: "Garganta, nariz ou ouvido", hint: "Dor de garganta, sinusite, dor de ouvido", specialty: "Otorrinolaringologia" },
  { emoji: "🩹", label: "Pele, alergia ou coceira", hint: "Manchas, alergias, acne, feridas", specialty: "Dermatologia" },
  { emoji: "😰", label: "Ansiedade, estresse ou sono", hint: "Preocupação, insônia, oscilações de humor", specialty: "Psiquiatria" },
  { emoji: "🤢", label: "Dor de barriga ou digestão", hint: "Enjoo, azia, intestino, dor abdominal", specialty: "Gastroenterologia" },
  { emoji: "❤️", label: "Coração ou pressão alta", hint: "Pressão, palpitação, dor no peito", specialty: "Cardiologia" },
  { emoji: "🧒", label: "Saúde da criança", hint: "Sintomas em bebês e crianças", specialty: "Pediatria" },
  { emoji: "🌸", label: "Saúde da mulher", hint: "Menstruação, anticoncepção, saúde íntima", specialty: "Ginecologia e Obstetrícia" },
  { emoji: "⚖️", label: "Tireoide, diabetes ou hormônios", hint: "Peso, glicose, tireoide, hormônios", specialty: "Endocrinologia" },
  { emoji: "🩺", label: "Outro / não tenho certeza", hint: "Comece por uma avaliação geral", specialty: "Clínico Geral" },
];

// Normaliza acentos/caixa para casar nomes vindos do banco com variações de grafia.
const norm = (s: string) =>
  s.normalize("NFD")
   .split("")
   .filter((ch) => { const code = ch.codePointAt(0) ?? 0; return code < 0x0300 || code > 0x036f; })
   .join("")
   .toLowerCase()
   .trim();

const SymptomTriage = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<TriageOption | null>(null);
  const [specialties, setSpecialties] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    let active = true;
    const fetchSpecialties = async () => {
      const { data } = await db.from("specialties").select("id, name").order("name");
      if (active && data) setSpecialties(data as { id: string; name: string }[]);
    };
    fetchSpecialties();
    return () => { active = false; };
  }, []);

  // Resolve o id da especialidade pelo nome; retorna null se não houver casamento confiável.
  const resolveSpecialtyId = (name: string): string | null => {
    const target = norm(name);
    let match = specialties.find((s) => norm(s.name) === target);
    // Casamento parcial: "Ginecologia" ⊂ "Ginecologia e Obstetrícia", etc.
    if (!match) {
      match = specialties.find((s) => {
        const ns = norm(s.name);
        return ns.includes(target) || target.includes(ns);
      });
    }
    return match?.id ?? null;
  };

  const handleSeeDoctors = () => {
    if (!selected) return;
    const id = resolveSpecialtyId(selected.specialty);
    // Convenção do app (ver ReferralSystem): ?specialty=<id>. Se o id não resolver
    // com segurança, cai para ?q=<nome> (busca textual) para não mandar às cegas.
    const target = id
      ? `/dashboard/doctors?specialty=${id}`
      : `/dashboard/doctors?q=${encodeURIComponent(selected.specialty)}`;
    navigate(target);
  };

  return (
    <DashboardLayout title="Orientação de sintomas" nav={getPatientNav("schedule")} role="patient">
      <div className="w-full max-w-xl mx-auto pb-24 md:pb-6">
        {/* Header */}
        <div className="text-center py-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Stethoscope className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Qual é o seu principal sintoma?
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Escolha a opção mais próxima e indicamos a especialidade certa para começar.
          </p>
        </div>

        {!selected ? (
          /* Passo 1 — escolha do sintoma/área */
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
          >
            {TRIAGE_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => setSelected(opt)}
                className="flex items-center gap-3 text-left rounded-2xl border border-border/50 bg-card p-3.5 transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="text-2xl shrink-0" aria-hidden="true">{opt.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">{opt.label}</span>
                  <span className="block text-xs text-muted-foreground truncate">{opt.hint}</span>
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </motion.div>
        ) : (
          /* Passo 2 — especialidade recomendada */
          <motion.div
            key={selected.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-5 text-center space-y-4">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" /> Especialidade recomendada
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl" aria-hidden="true">{selected.emoji}</span>
                  <p className="text-xl font-bold text-foreground">{selected.specialty}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Para “{selected.label.toLowerCase()}”, começar com um(a) especialista em{" "}
                  <span className="font-medium text-foreground">{selected.specialty}</span> costuma ser o melhor caminho.
                </p>

                <div className="space-y-2 pt-1">
                  <Button
                    className="w-full h-12 rounded-xl font-semibold gap-2"
                    onClick={handleSeeDoctors}
                  >
                    <Stethoscope className="w-5 h-5" /> Ver médicos
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full h-10 rounded-xl text-sm text-muted-foreground"
                    onClick={() => setSelected(null)}
                  >
                    Escolher outro sintoma
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Alerta de urgência */}
        <div className="mt-5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-500/5 p-3 text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>
              Sinais graves como dor no peito forte, falta de ar, desmaio ou fala enrolada exigem
              atendimento de <span className="font-semibold">urgência</span> — ligue 192 (SAMU) ou vá ao pronto-socorro.
            </p>
          </div>
        </div>

        {/* Aviso CFM — orientação, não diagnóstico */}
        <div className="mt-3 rounded-xl border border-border/60 bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <p>
              Isto é uma <span className="font-semibold text-foreground">orientação inicial, não um diagnóstico</span>.
              A definição da conduta é sempre do médico durante a consulta.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SymptomTriage;
