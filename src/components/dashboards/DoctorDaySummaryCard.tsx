/**
 * "Resumo do dia" — IA prepara um briefing executivo para o médico
 * a partir da agenda atual: total, fila, completas, queixas top do dia,
 * casos de severidade alta. Reduz tempo até decisão no início do turno.
 */
import { useState } from "react";
import { db } from "@/integrations/supabase/untyped";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface DoctorAppt {
  id: string;
  status?: string;
  scheduled_at?: string;
  appointment_type?: string;
}

interface Props {
  todayAppts: DoctorAppt[];
  waitingCount: number;
  inProgress: number;
  done: number;
  doctorName?: string;
}

export default function DoctorDaySummaryCard({ todayAppts, waitingCount, inProgress, done, doctorName }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const run = async () => {
    setLoading(true); setText("");
    try {
      const apptIds = todayAppts.map((a) => a.id).slice(0, 30);
      let sympContext = "";
      if (apptIds.length) {
        const { data: syms } = await db.from("pre_consultation_symptoms")
          .select("main_complaint, severity, symptoms")
          .in("appointment_id", apptIds);
        const top: Record<string, number> = {};
        let sevSum = 0, sevN = 0, sevHigh = 0;
        (syms ?? []).forEach((s: any) => {
          const c = (s.main_complaint || "").trim().toLowerCase();
          if (c) top[c] = (top[c] ?? 0) + 1;
          if (typeof s.severity === "number") {
            sevSum += s.severity; sevN++;
            if (s.severity >= 7) sevHigh++;
          }
        });
        const topList = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, c]) => `${n} (${c})`).join("; ");
        const avg = sevN ? (sevSum / sevN).toFixed(1) : "—";
        sympContext = `Queixas mais comuns hoje: ${topList || "—"}\nSeveridade média: ${avg} | casos severos (≥7): ${sevHigh}`;
      }

      const now = new Date();
      const ctx = [
        doctorName ? `Médico: ${doctorName}` : "",
        `Data: ${now.toLocaleDateString("pt-BR")}`,
        `Total hoje: ${todayAppts.length} | Aguardando: ${waitingCount} | Em consulta: ${inProgress} | Concluídas: ${done}`,
        sympContext,
      ].filter(Boolean).join("\n");

      const { data, error } = await db.functions.invoke("clinical-ai", {
        body: {
          task: "ask",
          payload: {
            question: "Faça um briefing executivo do dia para o médico, em markdown, em 4 itens: 1) Resumo geral, 2) Sinais de atenção (severidade/queixas), 3) Próxima ação recomendada agora, 4) Lembretes operacionais. Seja curto e direto, sem diagnosticar.",
            context: ctx,
          },
        },
      });
      if (error) throw error;
      setText((data as any)?.result || "");
    } catch (e: any) {
      toast.error("Não foi possível gerar o resumo", { description: e?.message });
    } finally {
      setLoading(false);
    }
  };

  const copyText = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* */ }
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">Resumo do dia (IA)</p>
          </div>
          <Button size="sm" variant={text ? "outline" : "default"} className="h-8 rounded-xl gap-1.5" onClick={run} disabled={loading}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {loading ? "Analisando…" : text ? "Refazer" : "Gerar"}
          </Button>
        </div>
        {text ? (
          <>
            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground font-sans">{text}</pre>
            <div className="mt-3 pt-2 border-t border-border/40 flex">
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1.5 ml-auto" onClick={copyText}>
                {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />} Copiar
              </Button>
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            Antes do primeiro paciente, gere um briefing: contexto da agenda, queixas comuns do dia e próxima ação sugerida.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
