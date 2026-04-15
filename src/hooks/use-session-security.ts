import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/untyped";

/**
 * Segurança de sessão:
 * - Força logout após inatividade de 4 horas
 * - Detecta mudança de usuário em outra aba
 * - Verifica sessão ao voltar para a aba
 */
export function useSessionSecurity() {
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (!user) return;

    // 1. Auto logout após 4h de inatividade
    let inactivityTimer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        signOut();
      }, 4 * 60 * 60 * 1000);
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart"] as const;
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    // 2. Detectar mudança de usuário em outra aba
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.includes("db") && e.newValue === null) {
        signOut();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // 3. Verificar sessão ao voltar para a aba
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        const { data: { session } } = await db.auth.getSession();
        if (!session) signOut();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(e => window.removeEventListener(e, resetTimer));
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, signOut]);
}
