import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import SEOHead from "@/components/SEOHead";

describe("SEOHead", () => {
  it("sets document title with site name suffix", () => {
    render(<SEOHead title="Teleconsulta" />);
    expect(document.title).toContain("Teleconsulta");
    expect(document.title).toContain("AloClínica");
  });

  it("creates og:title meta tag", () => {
    render(<SEOHead title="Test Page" description="A test desc" />);
    const og = document.querySelector('meta[property="og:title"]') as HTMLMetaElement;
    expect(og).toBeTruthy();
    expect(og?.content).toContain("Test Page");
  });

  it("sets canonical link when provided", () => {
    render(<SEOHead canonical="https://example.com/test" />);
    const link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    expect(link?.href).toBe("https://example.com/test");
  });

  it("injects JSON-LD script", () => {
    render(<SEOHead jsonLd={{ "@type": "Organization", name: "AloClínica" }} />);
    const script = document.getElementById("seo-jsonld");
    expect(script).toBeTruthy();
    expect(script?.textContent).toContain("AloClínica");
  });
});
