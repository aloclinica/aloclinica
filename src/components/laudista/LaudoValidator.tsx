import { useState, useCallback } from "react";
import { db } from "@/integrations/supabase/untyped";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Info, Zap, TrendingUp as TrendUp } from "lucide-react";
import { toast } from "sonner";

interface ValidationIssue {
  type: string;
  severity: "error" | "warning" | "info";
  message: string;
}

interface ValidationResult {
  is_valid: boolean;
  score: number;
  issues: ValidationIssue[];
  suggestions: string[];
  metadata: {
    has_technique: boolean;
    has_findings: boolean;
    has_conclusion: boolean;
    estimated_quality: "excellent" | "good" | "fair" | "poor";
    word_count: number;
  };
}

interface LaudoValidatorProps {
  laudoText: string;
  examType?: string;
  onValidationComplete?: (result: ValidationResult) => void;
  isLoading?: boolean;
}

const getSeverityColor = (severity: string) => {
  if (severity === "error") return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400";
  if (severity === "warning") return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400";
  return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400";
};

const getSeverityIcon = (severity: string) => {
  if (severity === "error") return <AlertCircle className="w-4 h-4" />;
  if (severity === "warning") return <AlertCircle className="w-4 h-4" />;
  return <Info className="w-4 h-4" />;
};

const getQualityColor = (quality: string) => {
  if (quality === "excellent") return "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (quality === "good") return "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300";
  if (quality === "fair") return "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300";
  return "bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-300";
};

const getQualityLabel = (quality: string) => {
  const labels: Record<string, string> = {
    excellent: "Excelente",
    good: "Bom",
    fair: "Aceitável",
    poor: "Ruim",
  };
  return labels[quality] || "Desconhecido";
};

export function LaudoValidator({ laudoText, examType, onValidationComplete, isLoading: externalLoading }: LaudoValidatorProps) {
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const isLoading = validating || externalLoading;

  const validate = useCallback(async () => {
    if (!laudoText || laudoText.trim().length === 0) {
      toast.error("Adicione conteúdo ao laudo antes de validar");
      return;
    }

    setValidating(true);
    try {
      const { data, error } = await db.functions.invoke("validate-laudo", {
        body: {
          laudo_text: laudoText,
          exam_type: examType,
        },
      });

      if (error) throw error;

      setResult(data);
      onValidationComplete?.(data);

      if (data.is_valid) {
        toast.success(`Laudo validado! Score: ${data.score}/100`);
      } else {
        toast.warning(`Laudo precisa de ajustes. Score: ${data.score}/100`);
      }
    } catch (err) {
      console.error("Validation error:", err);
      toast.error("Erro ao validar laudo");
    } finally {
      setValidating(false);
    }
  }, [laudoText, examType, onValidationComplete]);

  if (!result) {
    return (
      <Button
        onClick={validate}
        disabled={isLoading || !laudoText}
        size="sm"
        className="gap-2"
        variant="outline"
      >
        <Zap className="w-4 h-4" />
        {isLoading ? "Validando..." : "Validar Laudo"}
      </Button>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="space-y-4"
      >
        {/* Score Card */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                {result.is_valid ? (
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">VALIDAÇÃO</p>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {result.is_valid ? "Laudo Válido ✓" : "Ajustes Necessários"}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <span className="font-bold">{result.score}/100</span>
                    </Badge>
                    <Badge className={`${getQualityColor(result.metadata.estimated_quality)}`}>
                      {getQualityLabel(result.metadata.estimated_quality)}
                    </Badge>
                  </div>
                </div>
              </div>

              <Button
                onClick={validate}
                disabled={isLoading}
                size="sm"
                variant="ghost"
                className="text-xs"
              >
                Re-validar
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.score}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full ${
                    result.score >= 80
                      ? "bg-emerald-500"
                      : result.score >= 60
                      ? "bg-blue-500"
                      : result.score >= 40
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Checklist de Estrutura */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Estrutura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Técnica", value: result.metadata.has_technique },
              { label: "Achados", value: result.metadata.has_findings },
              { label: "Conclusão", value: result.metadata.has_conclusion },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                {item.value ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400 font-medium">✗</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Issues */}
        {result.issues.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Problemas ({result.issues.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {result.issues.map((issue, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex gap-3 p-3 rounded-lg border ${getSeverityColor(issue.severity)}`}
                >
                  {getSeverityIcon(issue.severity)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium capitalize">{issue.type}</p>
                    <p className="text-xs mt-0.5">{issue.message}</p>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Suggestions */}
        {result.suggestions.length > 0 && (
          <Card className="border-border/50 border-emerald-200 dark:border-emerald-900/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <TrendUp className="w-4 h-4" /> Sugestões de Melhoria
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {result.suggestions.map((suggestion, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30"
                >
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold flex-shrink-0">•</span>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">{suggestion}</p>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Card className="border-border/50">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">
              📊 <span className="font-medium">{result.metadata.word_count}</span> palavras
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

export default LaudoValidator;
