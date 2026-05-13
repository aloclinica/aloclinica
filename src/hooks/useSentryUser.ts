import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { identifyUser } from "@/lib/sentry";

/**
 * useSentryUser — propaga o user.id + role primário pra todos os eventos
 * Sentry da sessão. Monte uma única vez no shell autenticado (ex.: Dashboard).
 *
 * Limpa o contexto no logout (cleanup do useEffect).
 */
export function useSentryUser() {
  const { user, roles } = useAuth();
  useEffect(() => {
    if (user) {
      identifyUser({ id: user.id, role: roles[0] });
    } else {
      identifyUser(null);
    }
    return () => identifyUser(null);
  }, [user?.id, roles[0]]);
}
