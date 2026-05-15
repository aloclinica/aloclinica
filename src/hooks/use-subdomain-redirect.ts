import { useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";

/**
 * Maps subdomains to their auth routes and dashboard role params.
 * Configure your DNS/Vercel domains accordingly:
 *   medico.aloclinica.com    → /medico       → /dashboard?role=doctor
 *   paciente.aloclinica.com  → /paciente     → /dashboard?role=patient
 *   admin.aloclinica.com     → /admin        → /dashboard?role=admin
 *   clinica.aloclinica.com   → /clinica      → /dashboard?role=clinic
 *   parceiro.aloclinica.com  → /parceiro     → /dashboard?role=partner
 *   recepcionista.aloclinica.com → /recepcionista → /dashboard?role=receptionist
 *   suporte.aloclinica.com   → /suporte      → /dashboard?role=support
 */

interface SubdomainConfig {
  authRoute: string;
  dashboardRole: string;
}

const SUBDOMAIN_CONFIG: Record<string, SubdomainConfig> = {
  medico:        { authRoute: "/medico",        dashboardRole: "doctor" },
  paciente:      { authRoute: "/paciente",      dashboardRole: "patient" },
  admin:         { authRoute: "/admin",         dashboardRole: "admin" },
  clinica:       { authRoute: "/clinica",       dashboardRole: "clinic" },
  parceiro:      { authRoute: "/parceiro",      dashboardRole: "partner" },
  recepcionista: { authRoute: "/recepcionista", dashboardRole: "receptionist" },
  suporte:       { authRoute: "/suporte",       dashboardRole: "support" },
};

function getSubdomain(): string | null {
  const hostname = window.location.hostname;

  // Skip for localhost / IP / preview URLs
  if (
    hostname === "localhost" ||
    hostname.match(/^\d+\.\d+\.\d+\.\d+$/) ||
    hostname.endsWith(".lovable.app")
  ) {
    return null;
  }

  const parts = hostname.split(".");
  if (parts.length >= 3) {
    const sub = parts[0];
    if (sub !== "www") return sub;
  }

  return null;
}

/**
 * Returns the dashboard role for the current subdomain, or null.
 * Can be used by other modules (e.g. useAuthRedirect).
 */
export function getSubdomainRole(): string | null {
  const sub = getSubdomain();
  if (!sub) return null;
  return SUBDOMAIN_CONFIG[sub]?.dashboardRole ?? null;
}

export function useSubdomainRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const subdomain = getSubdomain();
    if (!subdomain) return;

    const config = SUBDOMAIN_CONFIG[subdomain];
    if (!config) return;

    // On root path → redirect to auth page for this subdomain
    if (location.pathname === "/") {
      navigate(config.authRoute + location.search + location.hash, { replace: true });
      return;
    }

    // On /dashboard (any sub-path) → ensure ?role= matches subdomain
    if (location.pathname.startsWith("/dashboard")) {
      const currentRole = searchParams.get("role");
      if (currentRole !== config.dashboardRole) {
        const newParams = new URLSearchParams(searchParams);
        newParams.set("role", config.dashboardRole);
        navigate(
          location.pathname + "?" + newParams.toString() + location.hash,
          { replace: true }
        );
      }
    }
  }, [navigate, location.pathname, location.search, location.hash, searchParams]);
}
