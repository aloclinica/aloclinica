/**
 * useSiteConfig — reads the site_config table and returns a helper to get values.
 *
 * Usage:
 *   const { get, loading } = useSiteConfig();
 *   const heroTitle = get("hero_title", "Saúde ao alcance de todos");
 */
import { useState, useEffect } from "react";
import { db } from "@/integrations/supabase/untyped";
import { warn } from "@/lib/logger";

type ConfigMap = Record<string, string>;

let _cache: ConfigMap | null = null;
let _promise: Promise<ConfigMap> | null = null;

async function fetchConfig(): Promise<ConfigMap> {
  if (_cache) return _cache;
  if (_promise) return _promise;
  _promise = (async () => {
    const { data, error } = await db.from("site_config").select("key, value");
    if (error) {
      warn("[site-config] fetch error", error);
      return {} as ConfigMap;
    }
    const map: ConfigMap = {};
    for (const row of data ?? []) map[row.key] = row.value ?? "";
    _cache = map;
    return map;
  })();
  return _promise;
}

/** Invalidates the in-memory cache (call after admin saves). */
export function invalidateSiteConfig() {
  _cache = null;
  _promise = null;
}

/** React hook — returns { get, loading }. */
export function useSiteConfig() {
  const [config, setConfig] = useState<ConfigMap>(_cache ?? {});
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    if (_cache) { setConfig(_cache); setLoading(false); return; }
    fetchConfig().then((map) => { setConfig(map); setLoading(false); });
  }, []);

  const get = (key: string, fallback = "") => config[key] ?? fallback;
  const enabled = (key: string) => (config[key] ?? "true") === "true";

  return { get, enabled, loading, config };
}
