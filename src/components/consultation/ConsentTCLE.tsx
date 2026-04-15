import { logError } from "@/lib/logger";
import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Shield, FileCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ConsentTCLEProps {
  appointmentId: string;
  doctorName?: string;
  onConsented: () => void;
}

const TCLE_TEXT = `TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO PARA TELECONSULTA

Conforme a Resolução CFM nº 2.314/2022, que regulamenta a prática da telemedicina no Brasil, declaro que:

1. NATUREZA DO ATENDIMENTO
Estou ciente de que a consulta será realizada por meio de tecnologias digitais de comunicação (teleconsulta), e que este atendimento possui limitações inerentes à ausência do exame físico presencial.

2. SIGILO E PRIVACIDADE
Fui informado(a) de que todos os dados trocados durante a teleconsulta são protegidos e tratados conforme a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018). A plataforma utiliza criptografia de ponta a ponta para garantir o sigilo das informações.

3. CONSENTIMENTO INFORMADO
Autorizo voluntariamente a realização da teleconsulta, estando ciente de que:
• O médico poderá, a seu critério, indicar a necessidade de atendimento presencial caso julgue necessário;
• A teleconsulta não substitui a emergência médica — em caso de urgência, devo procurar atendimento presencial imediato;
• As prescrições eletrônicas emitidas possuem validade legal conforme legislação vigente;
• Posso revogar este consentimento a qualquer momento antes do início do atendimento.

4. GRAVAÇÃO E REGISTRO
Estou ciente de que os dados clínicos relevantes serão registrados em prontuário eletrônico, acessível apenas ao médico responsável e a mim, paciente, conforme previsto na Resolução CFM nº 2.314/2022.

5. DIREITOS DO PACIENTE
Reconheço que tenho o direito de:
• Receber informações claras sobre meu diagnóstico e tratamento;
• Ter acesso ao meu prontuário eletrônico;
• Solicitar encaminhamento para atendimento presencial;
• Revogar este consentimento a qualquer momento.

6. RESPONSABILIDADE TÉCNICA
O profissional de saúde é responsável por garantir a qualidade técnica da teleconsulta, seguindo os protocolos e diretrizes do Conselho Federal de Medicina.`;

const ConsentTCLE = ({ appointmentId, doctorName, onConsented }: ConsentTCLEProps) => {
  const { user } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const listenerAttached = useRef(false);

  const handleScroll = useCallback((e: Event) => {
    const el = e.target as HTMLElement;
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
      setScrolledToEnd(true);
    }
  }, []);

  // Attach scroll listener once to Radix viewport, with proper cleanup
  useEffect(() => {
    const node = scrollContainerRef.current;
    if (!node || listenerAttached.current) return;

    const viewport = node.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return;

    listenerAttached.current = true;
    viewport.addEventListener('scroll', handleScroll);

    // If content fits without scrolling, enable immediately
    if (viewport.scrollHeight <= viewport.clientHeight + 40) {
      setScrolledToEnd(true);
    }

    return () => {
      viewport.removeEventListener('scroll', handleScroll);
      listenerAttached.current = false;
    };
  }, [handleScroll]);

  const handleAccept = async () => {
    if (!user || !accepted || !acceptedPrivacy) return;
    setSubmitting(true);

    try {
      const { error } = await db.from("patient_consents").insert({
        patient_id: user.id,
        appointment_id: appointmentId,
        consent_type: "telemedicine_tcle",
        consent_text: TCLE_TEXT,
        ip_address: null,
        user_agent: navigator.userAgent,
      });

      if (error) throw error;

      toast.success("Consentimento registrado ✅", { description: "Seu TCLE foi aceito e registrado com segurança." });
      onConsented();
    } catch (err: unknown) {
      logError("ConsentTCLE error", err);
      toast.error("Erro ao registrar consentimento", { description: err instanceof Error ? err.message : "Tente novamente." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen bg-background flex items-center justify-center p-4"
    >
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-primary/5 border-b border-border px-6 py-5 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Termo de Consentimento (TCLE)
            </h2>
            <p className="text-sm text-muted-foreground">
              Resolução CFM nº 2.314/2022 — Leia antes de prosseguir
            </p>
          </div>
        </div>

        {/* Doctor info */}
        {doctorName && (
          <div className="px-6 py-3 bg-muted/30 border-b border-border">
            <p className="text-sm text-muted-foreground">
              Teleconsulta com <span className="font-semibold text-foreground">{doctorName}</span>
            </p>
          </div>
        )}

        {/* TCLE content */}
        <div className="px-6 py-4">
          <div ref={scrollContainerRef}>
            <ScrollArea className="h-[300px] rounded-lg border border-border bg-muted/20 p-4">
              <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
                {TCLE_TEXT}
              </pre>
            </ScrollArea>
          </div>

          {!scrolledToEnd && (
            <div className="flex items-center gap-2 mt-2 text-xs text-warning">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Role até o final do documento para habilitar o aceite</span>
            </div>
          )}
        </div>

        {/* Checkboxes */}
        <div className="px-6 pb-2 space-y-3">
          <div className="flex items-start gap-3">
            <Checkbox
              id="accept-tcle"
              checked={accepted}
              onCheckedChange={(v) => setAccepted(v === true)}
              disabled={!scrolledToEnd}
            />
            <Label htmlFor="accept-tcle" className="text-sm leading-snug cursor-pointer">
              Declaro que li e compreendi o Termo de Consentimento Livre e Esclarecido acima
              e autorizo a realização da teleconsulta.
            </Label>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="accept-privacy"
              checked={acceptedPrivacy}
              onCheckedChange={(v) => setAcceptedPrivacy(v === true)}
              disabled={!scrolledToEnd}
            />
            <Label htmlFor="accept-privacy" className="text-sm leading-snug cursor-pointer">
              Concordo com o tratamento dos meus dados conforme a LGPD
              (Lei nº 13.709/2018) e a Política de Privacidade da plataforma.
            </Label>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-5 border-t border-border flex justify-end gap-3">
          <Button
            onClick={handleAccept}
            disabled={!accepted || !acceptedPrivacy || submitting}
            className="gap-2"
            size="lg"
          >
            <FileCheck className="w-4 h-4" />
            {submitting ? "Registrando..." : "Aceitar e Iniciar Consulta"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ConsentTCLE;
