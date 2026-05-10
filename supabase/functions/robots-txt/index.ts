import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * robots-txt — serve robots.txt dinâmico de app_settings.robots_txt.content
 * Roteamento (front): /robots.txt → essa função
 */

const FALLBACK = `User-agent: *
Allow: /
Sitemap: https://aloclinica.com.br/sitemap.xml
`;

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let content = FALLBACK;
  try {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "robots_txt")
      .maybeSingle();
    if (data?.value?.content) content = data.value.content;
  } catch { /* fallback */ }

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
