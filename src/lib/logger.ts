const isDev = import.meta.env.DEV;
let toastFn: ((type: 'error' | 'warn', message: string, description?: string) => void) | null = null;

// Registrar função de toast (chamar de um componente no root)
export const registerErrorToast = (fn: typeof toastFn) => {
  toastFn = fn;
};

export const log = (...args: unknown[]) => { if (isDev) console.log(...args); };
export const warn = (...args: unknown[]) => { if (isDev) console.warn(...args); };

/**
 * Production-ready error logger com toast opcional.
 * - In dev: logs to console with full context.
 * - In prod: sends to Sentry (when DSN is configured) AND logs to console.
 * - Mostra toast se registrado.
 */
export const logError = (
  message: string,
  error?: unknown,
  context?: Record<string, unknown>,
  showToast = true,
) => {
  const ts = new Date().toISOString();
  const errorMsg = error instanceof Error ? error.message : String(error || '');

  if (isDev) {
    console.error(`[AloMédico] ${message}`, { error, context, ts });
  } else {
    // Always log in prod so server-side tools (e.g. Cloudflare Workers) can capture
    console.error(`[AloMédico] ${message}`, ts, context ?? "");

    // Wire to Sentry when DSN is configured
    if (error instanceof Error) {
      import("@/lib/sentry").then(m => m.captureError(error, { message, ts, ...context })).catch(() => {});
    } else if (error !== undefined && error !== null) {
      import("@/lib/sentry").then(m => m.captureError(new Error(String(error)), { message, ts, ...context })).catch(() => {});
    }
  }

  // Mostrar toast se registrado
  if (showToast && toastFn) {
    toastFn('error', message, errorMsg || undefined);
  }
};
