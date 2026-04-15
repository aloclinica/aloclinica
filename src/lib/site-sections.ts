/**
 * useSiteSections — loads the site_sections registry from Supabase.
 *
 * Each section has: key, display_name, display_order, is_enabled, config (JSONB), schema (JSONB).
 * The landing page uses this to decide WHICH sections to render, in WHICH order,
 * and to pass `config` as props to each landing component.
 *
 * Falls back to null when DB is unavailable, in which case the landing page should
 * render its hardcoded default ordering.
 */
import { useEffect, useState } from "react";
import { db } from "@/integrations/supabase/untyped";
import { warn } from "@/lib/logger";

export type SiteSection = {
  id: string;
  key: string;
  display_name: string;
  display_order: number;
  is_enabled: boolean;
  config: Record<string, any>;
  schema: Record<string, any>;
};

let _cache: SiteSection[] | null = null;
let _promise: Promise<SiteSection[]> | null = null;

export async function fetchSiteSections(): Promise<SiteSection[]> {
  if (_cache) return _cache;
  if (_promise) return _promise;
  _promise = (db as any)
    .from("site_sections")
    .select("id, key, display_name, display_order, is_enabled, config, schema")
    .order("display_order", { ascending: true })
    .then(({ data, error }: any) => {
      if (error) {
        warn("[site-sections] fetch error", error);
        return [] as SiteSection[];
      }
      _cache = (data ?? []) as SiteSection[];
      return _cache;
    });
  return _promise!;
}

export function invalidateSiteSections() {
  _cache = null;
  _promise = null;
}

/** Hook: returns the list of sections keyed by `key`. */
export function useSiteSections() {
  const [sections, setSections] = useState<SiteSection[] | null>(_cache);
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    let mounted = true;
    fetchSiteSections().then((data) => {
      if (!mounted) return;
      setSections(data);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const byKey = (key: string): SiteSection | undefined =>
    sections?.find((s) => s.key === key);

  const configOf = <T = Record<string, any>>(key: string, fallback: T): T => {
    const s = byKey(key);
    if (!s || !s.config || typeof s.config !== "object") return fallback;
    return { ...fallback, ...(s.config as any) } as T;
  };

  const enabled = (key: string): boolean => {
    const s = byKey(key);
    return s ? s.is_enabled : true;
  };

  return { sections, loading, byKey, configOf, enabled };
}
