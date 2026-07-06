/**
 * Quando rodando em app nativo (Capacitor iOS/Android), a rota "/" NÃO deve
 * abrir a landing de marketing — o usuário instalou o app pra usar, não pra
 * ler sobre o produto. Redireciona:
 *   - logado  -> /dashboard (roteador decide médico/paciente/clínica)
 *   - deslogado -> /paciente (tela de login/cadastro do paciente, entrada padrão)
 *
 * No web comum (browser/PWA), renderiza a landing normal (<Index />).
 */
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Index from "@/pages/Index";

export default function NativeHomeGate() {
  const [isNative, setIsNative] = useState<boolean | null>(null);
  const { user, loading } = useAuth();

  useEffect(() => {
    let cancelled = false;
    import("@capacitor/core")
      .then(({ Capacitor }) => { if (!cancelled) setIsNative(Capacitor.isNativePlatform()); })
      .catch(() => { if (!cancelled) setIsNative(false); });
    return () => { cancelled = true; };
  }, []);

  if (isNative === null) return null; // brevíssimo, evita flash da landing no app
  if (!isNative) return <Index />;
  if (loading) return null;
  return <Navigate to={user ? "/dashboard" : "/paciente"} replace />;
}