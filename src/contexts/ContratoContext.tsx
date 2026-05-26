import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { db } from "@/integrations/supabase/untyped";

/**
 * ContratoContext
 * Detecta se o usuário está acessando via subdomínio de parceiro/ação social
 * (ex: parceiros.aloclinica.com.br ou acoes.aloclinica.com.br) e carrega
 * o contrato vinculado. Componentes podem ler `isContratoMode` para pular
 * checkout do MercadoPago e marcar a consulta como paga-por-contrato.
 */

export type ContratoModo = "particular" | "contrato" | "voucher";

export interface ContratoAtivo {
  id: string;
  nome: string;
  tipo: "empresa" | "prefeitura" | "ong" | "plano_proprio";
  modelo_cobranca: "mensal" | "pacote_pre_pago" | "gratuito_patrocinado";
  especialidades_permitidas: string[];
  branding: Record<string, unknown>;
  status: "ativo" | "pausado" | "encerrado";
  subdominio: string | null;
}

interface ContratoCtxValue {
  modo: ContratoModo;
  isContratoMode: boolean;
  isVoucherMode: boolean;
  contratoAtivo: ContratoAtivo | null;
  loading: boolean;
  setVoucherContrato: (c: ContratoAtivo | null) => void;
}

const ContratoContext = createContext<ContratoCtxValue>({
  modo: "particular",
  isContratoMode: false,
  isVoucherMode: false,
  contratoAtivo: null,
  loading: false,
  setVoucherContrato: () => {},
});

/** slug de path /p/:slug, se houver */
function pathSlug(): string | null {
  if (typeof window === "undefined") return null;
  const m = window.location.pathname.match(/^\/p\/([a-z0-9-]+)/i);
  return m ? m[1].toLowerCase() : null;
}

function detectModoFromHost(): ContratoModo {
  if (typeof window === "undefined") return "particular";
  const host = window.location.hostname;
  const isLocal = host === "localhost" || host.endsWith(".lovable.app");
  const sub = host.split(".")[0];
  if (!isLocal && sub === "acoes") return "voucher";   // entra com voucher (resolve depois)
  // parceiros / subdomínio de tenant / domínio próprio / path /p/:slug → resolve_tenant
  return "particular";
}

export function ContratoProvider({ children }: { children: ReactNode }) {
  const [modoInicial] = useState(detectModoFromHost);
  const [modo, setModo] = useState<ContratoModo>(modoInicial);
  const [contratoAtivo, setContratoAtivo] = useState<ContratoAtivo | null>(null);
  const [loading, setLoading] = useState(modoInicial !== "voucher");

  useEffect(() => {
    // Ações sociais resolvem o contrato só após o voucher (setVoucherContrato).
    if (modoInicial === "voucher") { setLoading(false); return; }
    const host = typeof window !== "undefined" ? window.location.hostname : "";
    if (host === "localhost" || host.endsWith(".lovable.app")) {
      // sem tenant em local, a menos que venha por /p/:slug
      if (!pathSlug()) { setLoading(false); return; }
    }
    (async () => {
      // resolve_tenant (SECURITY DEFINER) contorna a RLS admin-only de contratos
      // e cobre subdomínio, path /p/:slug e domínio próprio.
      const { data, error } = await db.rpc("resolve_tenant", {
        p_host: host,
        p_slug: pathSlug(),
      });
      const row = Array.isArray(data) ? data[0] : data;
      if (!error && row) {
        setContratoAtivo({
          id: row.contrato_id,
          nome: row.nome,
          tipo: row.tipo,
          modelo_cobranca: row.modelo_cobranca,
          especialidades_permitidas: row.especialidades_permitidas ?? [],
          branding: row.branding ?? {},
          status: "ativo",
          subdominio: row.subdominio ?? null,
        });
        setModo("contrato");
      }
      setLoading(false);
    })();
  }, [modoInicial]);

  return (
    <ContratoContext.Provider
      value={{
        modo,
        isContratoMode: modo === "contrato",
        isVoucherMode: modo === "voucher",
        contratoAtivo,
        loading,
        setVoucherContrato: setContratoAtivo,
      }}
    >
      {children}
    </ContratoContext.Provider>
  );
}

export const useContrato = () => useContext(ContratoContext);