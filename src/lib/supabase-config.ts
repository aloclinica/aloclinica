// ⚠️ PRODUÇÃO: Configure as variáveis de ambiente abaixo
// .env.local ou .env.production devem conter:
// VITE_SUPABASE_URL=sua_url_supabase
// VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica

// Validar credenciais obrigatórias
const validateSupabaseEnv = () => {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !key) {
    const missing: string[] = [];
    if (!url) missing.push('VITE_SUPABASE_URL');
    if (!key) missing.push('VITE_SUPABASE_PUBLISHABLE_KEY');

    const error = `❌ [AloClínica] Credenciais Supabase faltando: ${missing.join(', ')}. Configure em .env.local`;
    console.error(error);

    if (import.meta.env.PROD) {
      throw new Error(error);
    }
  }
};

validateSupabaseEnv();

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
export const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || '';
export const SUPABASE_PROJECT_ID =
  SUPABASE_URL ? new URL(SUPABASE_URL).hostname.split(".")[0] : '';
export const SUPABASE_FUNCTIONS_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1` : '';
export const hasExplicitSupabaseEnv = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

if (!hasExplicitSupabaseEnv && import.meta.env.DEV) {
  console.warn('[AloClínica] ⚠️ Supabase não configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY em .env.local');
}
