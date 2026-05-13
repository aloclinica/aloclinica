import { describe, it, expect, vi } from "vitest";
import { captureBreadcrumb, identifyUser, setTag, trackEvent, captureError } from "@/lib/sentry";

/**
 * Sem VITE_SENTRY_DSN nos testes, os helpers devem virar no-ops sem
 * lançar exceção. Cobertura aqui garante que esquecer de configurar
 * o DSN em ambientes (preview, test) não derruba o app.
 */
describe("sentry helpers (DSN absent)", () => {
  it("captureBreadcrumb não lança", () => {
    expect(() => captureBreadcrumb("webrtc", "test", { foo: "bar" })).not.toThrow();
  });

  it("trackEvent não lança", () => {
    expect(() => trackEvent("payment.failed", { reason: "card_declined" })).not.toThrow();
  });

  it("identifyUser aceita null e objeto", () => {
    expect(() => identifyUser({ id: "abc", role: "patient" })).not.toThrow();
    expect(() => identifyUser(null)).not.toThrow();
  });

  it("setTag não lança", () => {
    expect(() => setTag("env", "test")).not.toThrow();
  });

  it("captureError loga no console quando offline", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    captureError(new Error("boom"), { extra: 1 });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
