/**
 * SOAPNotesPanel — Painel de notas estruturadas SOAP
 *
 * Responsabilidades:
 * - Edição de cada seção S/O/A/P
 * - Auto-save
 * - Formatação
 * - Exportação
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  FileJson,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { SOAPNotes } from "@/hooks/useSOAPNotes";

interface SOAPNotesPanelProps {
  notes: SOAPNotes;
  activeSection: keyof SOAPNotes;
  onUpdateSection: (section: keyof SOAPNotes, content: string) => void;
  onSetActiveSection: (section: keyof SOAPNotes) => void;
  onSave?: () => Promise<boolean>;
  isSaving?: boolean;
  isDirty?: boolean;
  lastSaved?: string | null;
  canEdit?: boolean;
}

const SECTION_INFO = {
  subjective: {
    label: "Subjetivo",
    icon: "👂",
    description: "Relato do paciente sobre sintomas",
    placeholder: "O que o paciente relata?",
  },
  objective: {
    label: "Objetivo",
    icon: "👁️",
    description: "Observações clínicas do médico",
    placeholder: "Quais as observações clínicas?",
  },
  assessment: {
    label: "Avaliação",
    icon: "🔍",
    description: "Diagnóstico e análise",
    placeholder: "Qual a avaliação diagnóstica?",
  },
  plan: {
    label: "Plano",
    icon: "📋",
    description: "Plano de tratamento e retorno",
    placeholder: "Qual o plano de ação?",
  },
};

export function SOAPNotesPanel({
  notes,
  activeSection,
  onUpdateSection,
  onSetActiveSection,
  onSave,
  isSaving = false,
  isDirty = false,
  lastSaved = null,
  canEdit = true,
}: SOAPNotesPanelProps) {
  const [wordCounts, setWordCounts] = useState({
    subjective: 0,
    objective: 0,
    assessment: 0,
    plan: 0,
  });

  // Contar palavras
  useEffect(() => {
    const counts = Object.entries(notes).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: value?.split(/\s+/).filter(Boolean).length || 0,
      }),
      {} as Record<keyof SOAPNotes, number>
    );
    setWordCounts(counts);
  }, [notes]);

  const handleSave = async () => {
    if (onSave) {
      const success = await onSave();
      if (success) {
        toast.success("Notas salvas! ✅");
      } else {
        toast.error("Erro ao salvar notas");
      }
    }
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(notes, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `soap-notes-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Notas SOAP</CardTitle>
            {lastSaved && (
              <p className="text-xs text-muted-foreground mt-1">
                Salvo em {new Date(lastSaved).toLocaleTimeString("pt-BR")}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {isDirty && canEdit && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <AlertCircle className="w-4 h-4 text-amber-600" />
              </motion.div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeSection} onValueChange={(v) => onSetActiveSection(v as keyof SOAPNotes)} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            {Object.entries(SECTION_INFO).map(([key, info]) => (
              <TabsTrigger key={key} value={key} className="text-xs">
                {info.icon}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(SECTION_INFO).map(([key, info]) => (
            <TabsContent
              key={key}
              value={key}
              className="flex-1 flex flex-col overflow-hidden space-y-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{info.label}</p>
                  <p className="text-xs text-muted-foreground">{info.description}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {wordCounts[key as keyof SOAPNotes]} palavras
                </span>
              </div>

              <Textarea
                value={notes[key as keyof SOAPNotes] || ""}
                onChange={(e) => onUpdateSection(key as keyof SOAPNotes, e.target.value)}
                placeholder={info.placeholder}
                disabled={!canEdit || isSaving}
                className="flex-1 resize-none"
              />
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex gap-2 mt-3 pt-3 border-t">
          {canEdit && (
            <Button
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              size="sm"
              className="gap-1"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar
                </>
              )}
            </Button>
          )}

          <Button
            onClick={handleExportJSON}
            variant="outline"
            size="sm"
            className="gap-1"
          >
            <FileJson className="w-4 h-4" />
            JSON
          </Button>

          <Button
            onClick={() => {
              const pdf = `SOAP Notes\n\n${Object.entries(notes)
                .map(([k, v]) => `${k.toUpperCase()}:\n${v}`)
                .join("\n\n")}`;
              const blob = new Blob([pdf], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `soap-notes-${new Date().toISOString().slice(0, 10)}.txt`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            variant="outline"
            size="sm"
            className="gap-1"
          >
            <Download className="w-4 h-4" />
            TXT
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
