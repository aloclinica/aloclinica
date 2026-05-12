/**
 * ThemeApplier — busca tema customizado de app_settings.theme via RPC pública
 * e injeta no documento.documentElement.style como CSS variables
 * (--primary, --secondary, etc — formato HSL compatível Tailwind/shadcn).
 *
 * Cacheia em sessionStorage por 5min pra evitar query a cada navegação.
 */
import { useEffect } from "react";
import { db } from "@/integrations/supabase/untyped";

const CACHE_KEY = "aloc_theme_v1";
const CACHE_TTL_MS = 5 * 60 * 1000;

const VAR_MAP: Record<string, string> = {
  primary: "--primary",
  secondary: "--secondary",
  accent: "--accent",
  destructive: "--destructive",
  background: "--background",
  foreground: "--foreground",
  muted: "--muted",
  border: "--border",
};

export default function ThemeApplier() {
  useEffect(() => {
    const apply = (theme: Record<string, any>) => {
      const root = document.documentElement;
      for (const [k, cssVar] of Object.entries(VAR_MAP)) {
        if (theme[k]) root.style.setProperty(cssVar, theme[k]);
      }
      if (theme.radius) root.style.setProperty("--radius", theme.radius);
      if (theme.font_family) root.style.setProperty("--font-family", theme.font_family);
      if (theme.font_heading) root.style.setProperty("--font-heading", theme.font_heading);
    };

    // Cache local
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?._ts && Date.now() - parsed._ts < CACHE_TTL_MS) {
          apply(parsed.theme);
          return;
        }
      }
    } catch { /* ignore */ }

    (async () => {
      try {
        const { data, error } = await (db as any).rpc("get_active_theme");
        if (!error && data) {
          apply(data);
          try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ _ts: Date.now(), theme: data })); } catch {}
        }
      } catch { /* fail silently — usa tema default do CSS */ }
    })();
  }, []);

  return null;
}
