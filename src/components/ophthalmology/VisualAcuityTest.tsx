import { useState, useCallback } from "react";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, ArrowRight, Check, X, ArrowLeft, ArrowClockwise, Info } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

// Snellen chart rows: [acuity, letters, size_em]
const SNELLEN_ROWS = [
  { acuity: "20/200", letters: ["E"], size: 4.0 },
  { acuity: "20/100", letters: ["F", "P"], size: 2.0 },
  { acuity: "20/70",  letters: ["T", "O", "Z"], size: 1.4 },
  { acuity: "20/50",  letters: ["L", "P", "E", "D"], size: 1.0 },
  { acuity: "20/40",  letters: ["P", "E", "C", "F", "D"], size: 0.8 },
  { acuity: "20/30",  letters: ["E", "D", "F", "C", "Z", "P"], size: 0.6 },
  { acuity: "20/25",  letters: ["F", "E", "L", "O", "P", "Z", "D"], size: 0.5 },
  { acuity: "20/20",  letters: ["D", "E", "F", "P", "O", "T", "E", "C"], size: 0.4 },
];

const OPTOTYPE_DIRECTIONS = ["↑", "←", "→", "↓"];

type TestState = "instruction" | "calibration" | "testing" | "results";
type Eye = "right" | "left";

interface TestResult {
  eye: Eye;
  acuity: string;
  rowsPassed: string[];
}

interface Props {
  onComplete?: (results: { right: string; left: string }) => void;
  appointmentId?: string;
}

export default function VisualAcuityTest({ onComplete, appointmentId }: Props) {
  const { user } = useAuth();
  const [state, setState] = useState<TestState>("instruction");
  const [currentEye, setCurrentEye] = useState<Eye>("right");
  const [currentRowIdx, setCurrentRowIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [rowResults, setRowResults] = useState<{ acuity: string; correct: boolean }[]>([]);
  const [results, setResults] = useState<{ right?: string; left?: string }>({});
  const [currentLetterIdx, setCurrentLetterIdx] = useState(0);
  const [letterResults, setLetterResults] = useState<boolean[]>([]);
  const [saving, setSaving] = useState(false);

  const currentRow = SNELLEN_ROWS[currentRowIdx];
  const currentLetter = currentRow?.letters[currentLetterIdx];

  const handleLetterResponse = (correct: boolean) => {
    const newLetterResults = [...letterResults, correct];
    const nextLetterIdx = currentLetterIdx + 1;

    if (nextLetterIdx >= currentRow.letters.length) {
      // Row complete
      const rowCorrect = newLetterResults.filter(Boolean).length >= Math.ceil(currentRow.letters.length * 0.6);
      const newRowResults = [...rowResults, { acuity: currentRow.acuity, correct: rowCorrect }];

      if (rowCorrect && currentRowIdx < SNELLEN_ROWS.length - 1) {
        // Move to harder row
        setRowResults(newRowResults);
        setCurrentRowIdx(r => r + 1);
        setCurrentLetterIdx(0);
        setLetterResults([]);
      } else {
        // Test complete for this eye
        const lastCorrectRow = newRowResults.filter(r => r.correct).pop();
        const acuity = lastCorrectRow?.acuity ?? "20/200";

        const newResults = { ...results, [currentEye]: acuity };
        setResults(newResults);

        if (currentEye === "right") {
          // Switch to left eye
          setCurrentEye("left");
          setCurrentRowIdx(0);
          setCurrentLetterIdx(0);
          setLetterResults([]);
          setRowResults([]);
          toast.success(`Olho direito: ${acuity}. Agora o olho esquerdo.`);
        } else {
          // Both eyes done
          setState("results");
          toast.success("Teste concluído!");
          if (onComplete) onComplete({ right: newResults.right ?? "N/A", left: acuity });
        }
      }
      return;
    }

    setCurrentLetterIdx(nextLetterIdx);
    setLetterResults(newLetterResults);
  };

  const saveResults = async () => {
    if (!user) return;
    setSaving(true);
    await db.from("visual_acuity_results" as any).insert({
      patient_id: user.id,
      appointment_id: appointmentId ?? null,
      right_eye_distance: results.right ?? null,
      left_eye_distance: results.left ?? null,
      tested_by_patient: true,
    });
    toast.success("Resultado salvo no seu prontuário!");
    setSaving(false);
  };

  const reset = () => {
    setState("instruction");
    setCurrentEye("right");
    setCurrentRowIdx(0);
    setCurrentLetterIdx(0);
    setLetterResults([]);
    setRowResults([]);
    setResults({});
  };

  const acuityToScore = (a?: string) => {
    if (!a) return 0;
    const [, denom] = a.split("/").map(Number);
    return Math.round((20 / denom) * 100);
  };

  const getAcuityLabel = (a?: string) => {
    if (!a) return "—";
    const score = acuityToScore(a);
    if (score >= 100) return "Normal";
    if (score >= 70)  return "Leve redução";
    if (score >= 40)  return "Moderada";
    return "Significativa";
  };

  const getAcuityColor = (a?: string) => {
    const score = acuityToScore(a);
    if (score >= 100) return "text-emerald-600";
    if (score >= 70)  return "text-amber-500";
    return "text-red-500";
  };

  return (
    <div className="max-w-sm mx-auto">
      <AnimatePresence mode="wait">

        {/* INSTRUCTION */}
        {state === "instruction" && (
          <motion.div key="instruction" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="space-y-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center mx-auto">
              <Eye size={32} weight="fill" className="text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Teste de Acuidade Visual</h3>
              <p className="text-sm text-muted-foreground mt-1">Escala de Snellen digital</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 p-4 text-left space-y-2">
              <p className="text-sm font-semibold flex items-center gap-1.5"><Info size={14} className="text-blue-500" /> Como realizar o teste</p>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>• Posicione-se a <strong>60cm</strong> da tela</li>
                <li>• Tampe o <strong>olho esquerdo</strong> primeiro, teste o direito</li>
                <li>• Para cada linha, indique se consegue ler as letras</li>
                <li>• Use óculos/lentes se os usa normalmente</li>
                <li>• <strong>Este teste não substitui exame com oftalmologista</strong></li>
              </ul>
            </div>
            <Button onClick={() => setState("testing")} className="w-full gap-2">
              Iniciar Teste <ArrowRight size={16} />
            </Button>
          </motion.div>
        )}

        {/* TESTING */}
        {state === "testing" && (
          <motion.div key="testing" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="space-y-5">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <Badge variant="outline" className={cn("text-xs font-bold", currentEye === "right" ? "border-blue-200 text-blue-600" : "border-violet-200 text-violet-600")}>
                  {currentEye === "right" ? "👁 Olho Direito" : "👁 Olho Esquerdo"}
                </Badge>
              </div>
              <Badge variant="outline" className="text-xs">{currentRow.acuity}</Badge>
            </div>

            {/* Progress */}
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Linha {currentRowIdx + 1} de {SNELLEN_ROWS.length}</span>
                <span>Letra {currentLetterIdx + 1} de {currentRow.letters.length}</span>
              </div>
              <Progress value={((currentRowIdx * currentRow.letters.length + currentLetterIdx) / (SNELLEN_ROWS.length * 5)) * 100} className="h-2" />
            </div>

            {/* Snellen Letter */}
            <div className="flex items-center justify-center py-8 rounded-2xl border-2 border-border bg-white dark:bg-neutral-950 select-none">
              <motion.span
                key={`${currentRowIdx}-${currentLetterIdx}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ fontSize: `${currentRow.size * 2.5}rem`, fontFamily: "serif", fontWeight: "bold", letterSpacing: "0.1em" }}
                className="text-foreground"
              >
                {currentLetter}
              </motion.span>
            </div>

            {/* Previous letter indicators */}
            {letterResults.length > 0 && (
              <div className="flex items-center gap-1 justify-center flex-wrap">
                {letterResults.map((r, i) => (
                  <div key={i} className={cn("w-5 h-5 rounded-full flex items-center justify-center", r ? "bg-emerald-100" : "bg-red-100")}>
                    {r ? <Check size={10} className="text-emerald-600" /> : <X size={10} className="text-red-600" />}
                  </div>
                ))}
              </div>
            )}

            {/* Response buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleLetterResponse(true)}
                className="h-14 gap-2 border-emerald-200 hover:bg-emerald-50 text-emerald-700 font-semibold"
              >
                <Check size={18} weight="bold" /> Consegui ler
              </Button>
              <Button
                variant="outline"
                onClick={() => handleLetterResponse(false)}
                className="h-14 gap-2 border-red-200 hover:bg-red-50 text-red-700 font-semibold"
              >
                <X size={18} weight="bold" /> Não consegui
              </Button>
            </div>

            {/* Instruction */}
            <p className="text-xs text-center text-muted-foreground">
              {currentEye === "right" ? "Tampe o olho esquerdo. Leia a letra acima." : "Tampe o olho direito. Leia a letra acima."}
            </p>
          </motion.div>
        )}

        {/* RESULTS */}
        {state === "results" && (
          <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-5">

            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mx-auto mb-3">
                <Check size={28} weight="bold" className="text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Teste Concluído</h3>
              <p className="text-xs text-muted-foreground mt-1">Resultados preliminares — consulte um oftalmologista</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Olho Direito", value: results.right, icon: "R" },
                { label: "Olho Esquerdo", value: results.left, icon: "L" },
              ].map(({ label, value, icon }) => (
                <div key={label} className="rounded-2xl border border-border bg-card p-4 text-center">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mx-auto mb-2 text-sm font-bold">{icon}</div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-widest">{label}</p>
                  <p className={cn("text-2xl font-black mt-1", getAcuityColor(value))}>{value ?? "N/A"}</p>
                  <p className={cn("text-[11px] font-semibold mt-0.5", getAcuityColor(value))}>{getAcuityLabel(value)}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 p-3 flex gap-2.5">
              <Info size={15} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Resultados abaixo de 20/30 indicam possível necessidade de correção óptica.
                Este é um teste de triagem — procure um oftalmologista para avaliação completa.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={reset} className="flex-1 gap-2">
                <ArrowClockwise size={14} /> Refazer
              </Button>
              <Button onClick={saveResults} disabled={saving} className="flex-1 gap-2">
                <Check size={14} /> {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
