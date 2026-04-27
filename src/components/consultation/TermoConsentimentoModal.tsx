import { useEffect, useState } from "react";
import { db } from "@/integrations/supabase/untyped";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const TERMO_VERSION = "1.0";
const TERMO_TYPE = "telemedicine_consent";

interface Props {
  /** Called once accepted (or already accepted previously). */
  onAccepted: () => void;
  /** Called when user explicitly rejects (closes modal). */
  onRejected?: () => void;
}

/**
 * Modal that gates teleconsultation by Termo de Consentimento Telemedicina aceite.
 * Records consent in patient_consents table with IP + user-agent + version.
 * If patient already accepted current version, fires onAccepted immediately.
 */
export default function TermoConsentimentoModal({ onAccepted, onRejected }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) { setLoading(false); return; }
      try {
        const { data } = await (db as any)
          .from("patient_consents")
          .select("id, version, accepted")
          .eq("patient_id", user.id)
          .eq("consent_type", TERMO_TYPE)
          .eq("version", TERMO_VERSION)
          .eq("accepted", true)
          .maybeSingle();
        if (data) {
          onAccepted();
        } else {
          setOpen(true);
        }
      } catch {
        setOpen(true);
      } finally { setLoading(false); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const accept = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await (db as any).from("patient_consents").insert({
        patient_id: user.id,
        consent_type: TERMO_TYPE,
        version: TERMO_VERSION,
        accepted: true,
        accepted_at: new Date().toISOString(),
        ip_address: null, // populated server-side via trigger if available
        user_agent: navigator.userAgent.slice(0, 500),
      });
      if (error) throw error;
      toast.success("Consentimento registrado.");
      setOpen(false);
      onAccepted();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar consentimento");
    } finally { setSubmitting(false); }
  };

  if (loading) return null;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-3xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <AlertDialogTitle>Termo de Consentimento — Telemedicina</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Antes de prosseguir, leia e aceite as condições da consulta por telemedicina.
            Conforme Resolução CFM 2.314/2022 e Lei 14.510/2022.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ScrollArea className="h-72 border rounded-md p-4 text-sm space-y-3">
          <p className="font-medium">Resumo dos pontos principais:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Reconheço que a teleconsulta é atendimento médico válido, regido pela Resolução CFM 2.314/2022.</li>
            <li>Em caso de emergência, devo procurar atendimento presencial imediato (SAMU 192 ou pronto-socorro).</li>
            <li>O médico pode encaminhar para atendimento presencial se julgar necessário.</li>
            <li>Receitas e atestados serão emitidos digitalmente com assinatura eletrônica válida (Lei 14.063/2020).</li>
            <li>Receitas de medicamentos controlados podem requerer assinatura ICP-Brasil.</li>
            <li>Meus dados de saúde serão tratados conforme LGPD (Lei 13.709/2018) e armazenados por 20 anos (CFM 1.821/2007).</li>
            <li>A consulta NÃO será gravada salvo com meu consentimento expresso adicional.</li>
            <li>Posso exercer todos os direitos LGPD via dpo@aloclinica.com.br.</li>
            <li>Posso ser cobrado taxa de no-show (50%) se não comparecer sem cancelamento prévio com 2h de antecedência.</li>
          </ul>
          <p className="text-muted-foreground italic">
            Texto completo do termo:{" "}
            <Link to="/termo-telemedicina" className="text-primary underline" target="_blank" rel="noopener noreferrer">
              ver versão integral (v{TERMO_VERSION})
            </Link>
          </p>
        </ScrollArea>

        <div className="flex items-start gap-2 mt-2">
          <Checkbox id="consent" checked={checked} onCheckedChange={(v) => setChecked(!!v)} />
          <label htmlFor="consent" className="text-sm cursor-pointer">
            Li e concordo com o Termo de Consentimento Livre e Esclarecido para Telemedicina (versão {TERMO_VERSION}).
            Autorizo o tratamento dos meus dados conforme LGPD.
          </label>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onRejected}>Não aceito</AlertDialogCancel>
          <AlertDialogAction onClick={accept} disabled={!checked || submitting}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Concordo e Continuar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
