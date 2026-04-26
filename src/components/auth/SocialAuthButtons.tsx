import { useState } from "react";
import { db } from "@/integrations/supabase/untyped";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { GoogleLogo, AppleLogo, SpinnerGap } from "@phosphor-icons/react";
import { logError } from "@/lib/logger";

interface SocialAuthButtonsProps {
  /** Caminho de redirecionamento após login bem-sucedido (sem origin). Default: /dashboard */
  redirectTo?: string;
  /** Texto opcional acima dos botões. */
  label?: string;
  /** Esconde o divisor "ou continue com". */
  hideDivider?: boolean;
  /** Compacto (usado em modais). */
  compact?: boolean;
}

/**
 * Botões premium de login social (Google + Apple) integrados ao Supabase Auth.
 * Usa o cliente untyped (`db`) e redireciona para `${origin}${redirectTo}`.
 */
const SocialAuthButtons = ({
  redirectTo = "/dashboard",
  label = "ou continue com",
  hideDivider = false,
  compact = false,
}: SocialAuthButtonsProps) => {
  const [loading, setLoading] = useState<"google" | "apple" | null>(null);

  const handleOAuth = async (provider: "google" | "apple") => {
    setLoading(provider);
    try {
      const { error } = await db.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}${redirectTo}`,
        },
      });
      if (error) {
        toast.error(`Não foi possível entrar com ${provider === "google" ? "Google" : "Apple"}`, {
          description: error.message,
        });
        setLoading(null);
      }
      // On success, the page will redirect — no need to clear loading.
    } catch (e) {
      logError(`OAuth ${provider} error`, e);
      toast.error("Falha no provedor de login", {
        description: "Tente novamente em instantes.",
      });
      setLoading(null);
    }
  };

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {!hideDivider && (
        <div className="relative my-1 flex items-center gap-3">
          <span className="h-px flex-1 bg-border/70" />
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70 font-semibold">
            {label}
          </span>
          <span className="h-px flex-1 bg-border/70" />
        </div>
      )}

      <div className={compact ? "grid grid-cols-2 gap-2" : "grid grid-cols-1 sm:grid-cols-2 gap-2.5"}>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOAuth("google")}
          disabled={loading !== null}
          className="h-11 rounded-xl border-border/70 bg-background hover:bg-muted/40 hover:border-border font-semibold text-foreground transition-all gap-2.5 shadow-sm"
        >
          {loading === "google" ? (
            <SpinnerGap className="w-4 h-4 animate-spin" weight="bold" />
          ) : (
            <GoogleLogo className="w-[18px] h-[18px] shrink-0" weight="bold" />
          )}
          <span className="text-sm">Google</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => handleOAuth("apple")}
          disabled={loading !== null}
          className="h-11 rounded-xl border-border/70 bg-foreground hover:bg-foreground/90 text-background hover:text-background font-semibold transition-all gap-2.5 shadow-sm"
        >
          {loading === "apple" ? (
            <SpinnerGap className="w-4 h-4 animate-spin" weight="bold" />
          ) : (
            <AppleLogo className="w-[18px] h-[18px] shrink-0" weight="fill" />
          )}
          <span className="text-sm">Apple</span>
        </Button>
      </div>
    </div>
  );
};

export default SocialAuthButtons;