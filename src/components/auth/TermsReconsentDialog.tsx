import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import { warn } from "@/lib/logger";
import { logConsent } from "@/lib/consent";

const CURRENT_TERMS_VERSION_KEY = "terms_version";

const TermsReconsentDialog = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requiredVersion, setRequiredVersion] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setOpen(false);
      setAccepted(false);
      setRequiredVersion(null);
      return;
    }

    void checkConsent();
  }, [user]);

  const checkConsent = async () => {
    if (!user) return;

    try {
      const { data: setting, error: settingError } = await db
        .from("app_settings" as unknown as never)
        .select("value")
        .eq("key", CURRENT_TERMS_VERSION_KEY)
        .maybeSingle();

      if (settingError) {
        warn("[terms] Falha ao carregar versão dos termos", settingError);
      }

      // Suporta ambos formatos: { version: "1.0", ... } JSONB OR string puro (legado)
      const raw = (setting as { value?: any } | null)?.value;
      const version = typeof raw === "object" && raw?.version
        ? String(raw.version)
        : (typeof raw === "string" ? raw : "1.0.0");
      setRequiredVersion(version);

      // Fonte canônica: consent_logs (é a tabela que o painel de compliance lê).
      const { data: canonical } = await db
        .from("consent_logs")
        .select("id")
        .eq("user_id", user.id)
        .eq("consent_type", "terms_of_use")
        .eq("version", version)
        .eq("accepted", true)
        .maybeSingle();

      if (canonical) {
        setOpen(false);
        return;
      }

      // Fallback (compat): quem já aceitou nas tabelas legadas não é re-perguntado.
      const [{ data: legacyLog }, { data: legacyConsent }] = await Promise.all([
        (db as any)
          .from("user_consent_log")
          .select("id")
          .eq("user_id", user.id)
          .eq("document_type", "terms")
          .eq("version", version)
          .maybeSingle(),
        db
          .from("user_consents")
          .select("id")
          .eq("user_id", user.id)
          .eq("version", version)
          .eq("consent_type", "terms_of_use")
          .maybeSingle(),
      ]);

      setOpen(!legacyLog && !legacyConsent);
    } catch (error) {
      warn("[terms] Erro inesperado ao verificar termos", error);
    }
  };

  const handleAccept = async () => {
    if (!accepted || !user || !requiredVersion) return;

    setSaving(true);

    try {
      // Canônico: grava em consent_logs (aceite imutável, com IP + user agent
      // capturados pelo helper) — é o que aparece na auditoria de compliance.
      // A caixa cobre Termos + Privacidade, então registramos os dois.
      await logConsent({
        type: "terms_of_use",
        userId: user.id,
        version: requiredVersion,
        documentUrl: "/terms",
        metadata: { source: "reconsent_dialog" },
      });
      await logConsent({
        type: "privacy_policy",
        userId: user.id,
        version: requiredVersion,
        documentUrl: "/privacy",
        metadata: { source: "reconsent_dialog" },
      });

      // Compat: mantém a tabela legada user_consents preenchida (não-bloqueante).
      const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : null;
      const { error } = await db.from("user_consents").insert({
        user_id: user.id,
        consent_type: "terms_of_use",
        version: requiredVersion,
        ip_address: null,
        user_agent: userAgent,
      });
      if (error) warn("[terms] insert legacy table falhou (não-bloqueante)", error);

      toast.success("Termos aceitos com sucesso!");
      setOpen(false);
    } catch (error) {
      warn("[terms] Falha ao salvar aceite", error);
      toast.error("Não foi possível salvar a aceitação dos termos.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => setOpen(nextOpen ? true : open)}>
      <DialogContent className="max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Atualização dos Termos de Uso
          </DialogTitle>
          <DialogDescription>
            Nossos Termos de Uso foram atualizados (versão {requiredVersion}). Para continuar usando a plataforma, você precisa aceitar os novos termos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            <p>Principais alterações:</p>
            <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
              <li>Atualização da política de privacidade conforme LGPD</li>
              <li>Novos termos para teleconsulta e prescrição digital</li>
              <li>Política de reembolso e cancelamento revisada</li>
            </ul>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox id="accept-terms" checked={accepted} onCheckedChange={(value) => setAccepted(!!value)} />
            <label htmlFor="accept-terms" className="text-sm cursor-pointer">
              Li e aceito os{" "}
              <a href="/terms" target="_blank" rel="noreferrer" className="text-primary underline">Termos de Uso</a>{" "}
              e a{" "}
              <a href="/privacy" target="_blank" rel="noreferrer" className="text-primary underline">Política de Privacidade</a>{" "}
              atualizados.
            </label>
          </div>

          <Button onClick={handleAccept} disabled={!accepted || saving} className="w-full">
            {saving ? "Salvando..." : "Aceitar e Continuar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TermsReconsentDialog;
