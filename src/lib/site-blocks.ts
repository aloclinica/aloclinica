/**
 * Studio — leitura e mutação de site_blocks.
 * Unifica seções/configs/tema do site num único modelo versionado.
 */
import { useEffect, useState, useCallback } from "react";
import { db } from "@/integrations/supabase/untyped";
import { warn } from "@/lib/logger";

export type BlockScope = "section" | "page" | "config" | "theme" | "email";

export type SiteBlock = {
  id: string;
  scope: BlockScope;
  page_slug: string | null;
  block_key: string;
  display_name: string;
  display_order: number;
  is_enabled: boolean;
  schema: { fields?: BlockField[] } & Record<string, any>;
  published: Record<string, any>;
  draft: Record<string, any> | null;
  has_draft: boolean;
  i18n: Record<string, Record<string, any>>;
  last_published_at: string | null;
  last_published_by: string | null;
  updated_at: string;
};

export type BlockField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "richtext" | "image" | "color" | "url" | "number" | "select" | "switch" | "list";
  options?: string[];
  item_schema?: { fields: BlockField[] };
  placeholder?: string;
};

export type BlockVersion = {
  id: string;
  block_id: string;
  version: number;
  locale: string | null;
  snapshot: Record<string, any>;
  change_note: string | null;
  published_at: string;
  published_by: string | null;
};

export async function fetchBlocks(scope?: BlockScope): Promise<SiteBlock[]> {
  let q = (db as any).from("site_blocks").select("*").order("scope").order("page_slug").order("display_order");
  if (scope) q = q.eq("scope", scope);
  const { data, error } = await q;
  if (error) { warn("[site-blocks] fetch", error); return []; }
  return (data ?? []) as SiteBlock[];
}

export async function saveBlockDraft(id: string, draft: Record<string, any>) {
  const { error } = await (db as any)
    .from("site_blocks")
    .update({ draft, has_draft: true })
    .eq("id", id);
  if (error) throw error;
}

export async function discardDraft(id: string) {
  const { error } = await (db as any)
    .from("site_blocks")
    .update({ draft: null, has_draft: false })
    .eq("id", id);
  if (error) throw error;
}

export async function publishBlock(id: string, note?: string) {
  const { data, error } = await (db as any).rpc("publish_site_block", {
    p_block_id: id,
    p_change_note: note ?? null,
  });
  if (error) throw error;
  return data;
}

export async function rollbackBlock(versionId: string) {
  const { data, error } = await (db as any).rpc("rollback_site_block", {
    p_version_id: versionId,
  });
  if (error) throw error;
  return data;
}

export async function fetchBlockVersions(blockId: string): Promise<BlockVersion[]> {
  const { data, error } = await (db as any)
    .from("site_block_versions")
    .select("*")
    .eq("block_id", blockId)
    .order("version", { ascending: false });
  if (error) { warn("[site-blocks] versions", error); return []; }
  return data as BlockVersion[];
}

export async function toggleBlock(id: string, enabled: boolean) {
  const { error } = await (db as any).from("site_blocks").update({ is_enabled: enabled }).eq("id", id);
  if (error) throw error;
}

export async function reorderBlock(id: string, display_order: number) {
  const { error } = await (db as any).from("site_blocks").update({ display_order }).eq("id", id);
  if (error) throw error;
}

export function useBlocks(scope?: BlockScope) {
  const [blocks, setBlocks] = useState<SiteBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const data = await fetchBlocks(scope);
    setBlocks(data);
    setLoading(false);
  }, [scope]);

  useEffect(() => { reload(); }, [reload]);

  return { blocks, loading, reload, setBlocks };
}