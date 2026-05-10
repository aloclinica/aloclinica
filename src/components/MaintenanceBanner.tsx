/**
 * MaintenanceBanner — banner global mostrado quando admin ativou modo manutenção.
 *
 * Lê `app_settings.maintenance_mode` via RPC pública. Se enabled=true:
 *   - Mostra banner amarelo no topo
 *   - Mensagem custom + ETA (se setado)
 *   - allow_admin=true: admin ainda navega normalmente
 *   - allow_admin=false: usuários comuns bloqueados (ainda em estudo, hoje só banner)
 */
import { useEffect, useState } from "react";
import { db } from "@/integrations/supabase/untyped";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type MaintenanceConfig = {
  enabled?: boolean;
  message?: string;
  expected_back_at?: string | null;
  allow_admin?: boolean;
};

export function MaintenanceBanner() {
  const { roles } = useAuth();
  const [cfg, setCfg] = useState<MaintenanceConfig | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchCfg = async () => {
      try {
        const { data, error } = await (db as any).rpc("get_maintenance_status");
        if (!error && !cancelled) setCfg(data as MaintenanceConfig);
      } catch {}
    };
    fetchCfg();
    // Re-checa a cada 60s pra detectar mudanças
    const id = setInterval(fetchCfg, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  if (!cfg?.enabled || dismissed) return null;

  const isAdmin = roles?.includes("admin");
  const eta = cfg.expected_back_at ? new Date(cfg.expected_back_at) : null;
  const etaText = eta ? format(eta, "dd/MM 'às' HH:mm", { locale: ptBR }) : null;

  return (
    <div
      role="alert"
      className="sticky top-0 z-50 bg-amber-500 text-amber-950 px-4 py-2 shadow-md"
    >
      <div className="max-w-7xl mx-auto flex items-center gap-3 text-sm">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <div className="flex-1">
          <strong>Modo manutenção:</strong>{" "}
          {cfg.message || "Estamos fazendo melhorias na plataforma. Algumas funções podem estar indisponíveis."}
          {etaText && (
            <>
              {" — "}previsão de retorno: <strong>{etaText}</strong>
            </>
          )}
          {isAdmin && (
            <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-amber-700 text-amber-50 font-bold">
              VOCÊ É ADMIN — pode usar normalmente
            </span>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-amber-600 rounded"
          aria-label="Dispensar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default MaintenanceBanner;
