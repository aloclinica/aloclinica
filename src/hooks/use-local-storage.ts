import { useState, useCallback } from "react";
import { logError } from "@/lib/logger";

/**
 * Type-safe localStorage hook with SSR safety and JSON serialization.
 * Falls back gracefully if localStorage is unavailable (private mode, etc).
 *
 * @example
 * const [theme, setTheme, removeTheme] = useLocalStorage("theme", "light");
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      logError(`localStorage getItem failed for key: ${key}`, error, { key }, false);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        setStoredValue((prev) => {
          const next = value instanceof Function ? value(prev) : value;
          window.localStorage.setItem(key, JSON.stringify(next));
          return next;
        });
      } catch (error) {
        const isQuotaError = error instanceof Error && error.name === 'QuotaExceededError';
        logError(
          isQuotaError ? 'localStorage quota exceeded' : `localStorage setItem failed for key: ${key}`,
          error,
          { key, isQuotaError },
          isQuotaError // Show toast only if quota exceeded
        );
      }
    },
    [key]
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      logError(`localStorage removeItem failed for key: ${key}`, error, { key }, false);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
