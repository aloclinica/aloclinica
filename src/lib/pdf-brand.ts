/**
 * Brand & corporate identity for all generated PDFs.
 * Centralizes legal identification required by CFM 2.314/2022 § documentos
 * médicos (razão social, CNPJ, RT, CRM-PJ) so every receita / atestado /
 * comprovante carries the same legally compliant header & footer.
 *
 * Use:
 *   const doc = new jsPDF({ unit: "mm", format: "a4" });
 *   applyBrandDefaults(doc);
 *   drawBrandHeader(doc, { title: "Receita Médica", documentId: "RX-..." });
 *   // ... content ...
 *   drawBrandFooter(doc, { pageNumbers: true });
 */
import type jsPDF from "jspdf";
import logoBrand from "@/assets/logo-receita.png";

// ── Corporate identity (oficial) ──────────────────────────────────────────────
export const BRAND = {
  name: "AloClínica",
  legalName: "ALO CLINICA MEDICA LTDA",
  cnpj: "66.474.468/0001-26",
  cnae: "86.30-5-03 — Atividade médica ambulatorial",
  city: "Boa Vista — Roraima, Brasil",
  website: "aloclinica.com.br",
  contact: "contato@aloclinica.com.br",
  // Responsável Técnico Médico (CFM 2.314/2022)
  rt: {
    name: "Dra. Tâmara Oliveira Vieira",
    crm: "CRM 2352/RR",
  },
  // Cores oficiais (semantic primary = hsl(215,75%,32%))
  colors: {
    primary: [21, 60, 130] as [number, number, number],      // #153C82
    primaryDark: [12, 38, 84] as [number, number, number],   // #0C2654
    accent: [44, 153, 132] as [number, number, number],      // teal secondary
    gold: [197, 165, 114] as [number, number, number],
    text: [30, 34, 45] as [number, number, number],
    muted: [110, 116, 128] as [number, number, number],
    line: [228, 230, 235] as [number, number, number],
    softBg: [247, 249, 252] as [number, number, number],
  },
} as const;

/** Apply consistent font defaults to a fresh jsPDF instance. */
export const applyBrandDefaults = (doc: jsPDF) => {
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.colors.text);
  // Reasonable global stroke width
  doc.setLineWidth(0.3);
};

interface HeaderOpts {
  /** Big title on the header strip (e.g. "Receita Médica") */
  title: string;
  /** Optional short subtitle ("Receituário digital") */
  subtitle?: string;
  /** Document identifier shown top-right (e.g. "RX-20260616-AB12CD") */
  documentId?: string;
  /** Issue date, defaults to now */
  date?: Date;
  /** Override accent strip color */
  accent?: [number, number, number];
}

/**
 * Brand header — solid colored strip with logo, doc title, ID and date.
 * Height: 30mm. Returns the Y coordinate where content should start.
 */
export const drawBrandHeader = (doc: jsPDF, opts: HeaderOpts): number => {
  const { title, subtitle = "Documento Médico Digital", documentId, date = new Date() } = opts;
  const accent = opts.accent ?? BRAND.colors.primary;
  const W = doc.internal.pageSize.getWidth();
  const HEADER_H = 28;

  // Solid primary strip
  doc.setFillColor(...accent);
  doc.rect(0, 0, W, HEADER_H, "F");

  // Logo (Pingo) — optional, swallow errors
  try {
    doc.addImage(logoBrand, "PNG", 12, 4, 20, 20);
  } catch {
    /* logo opcional */
  }

  // Brand wordmark
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(BRAND.name, 36, 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(220, 230, 245);
  doc.text(subtitle, 36, 19);
  doc.text(`CNPJ ${BRAND.cnpj} · RT ${BRAND.rt.crm}`, 36, 24);

  // Right side — title + doc id + date
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(title.toUpperCase(), W - 12, 13, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(220, 230, 245);
  if (documentId) {
    doc.text(documentId, W - 12, 19, { align: "right" });
  }
  const dt = date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  doc.text(dt, W - 12, 24, { align: "right" });

  // Thin gold accent below
  doc.setDrawColor(...BRAND.colors.gold);
  doc.setLineWidth(0.6);
  doc.line(0, HEADER_H, W, HEADER_H);
  doc.setLineWidth(0.3);

  // Reset text color for downstream content
  doc.setTextColor(...BRAND.colors.text);
  return HEADER_H + 6;
};

interface FooterOpts {
  /** Show "Página X de Y" — defaults to true */
  pageNumbers?: boolean;
  /** Extra compliance line (e.g. "Documento assinado eletronicamente") */
  complianceNote?: string;
}

/**
 * Brand footer — draws on ALL pages currently in the document.
 * Call this AFTER content is fully written.
 */
export const drawBrandFooter = (doc: jsPDF, opts: FooterOpts = {}) => {
  const { pageNumbers = true, complianceNote } = opts;
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const totalPages = doc.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Hairline
    doc.setDrawColor(...BRAND.colors.line);
    doc.setLineWidth(0.2);
    doc.line(12, H - 16, W - 12, H - 16);

    // Compliance + corporate line
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...BRAND.colors.primary);
    doc.text(
      complianceNote ?? "Documento emitido via telemedicina · Resolução CFM 2.314/2022 · Lei 14.510/2022",
      W / 2,
      H - 11,
      { align: "center" },
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...BRAND.colors.muted);
    doc.text(
      `${BRAND.legalName} · CNPJ ${BRAND.cnpj} · RT ${BRAND.rt.name} (${BRAND.rt.crm}) · ${BRAND.website}`,
      W / 2,
      H - 7,
      { align: "center" },
    );

    if (pageNumbers && totalPages > 1) {
      doc.text(`Página ${i} de ${totalPages}`, W - 12, H - 3, { align: "right" });
    }
    doc.setTextColor(...BRAND.colors.text);
  }
};

/**
 * Draws a soft "RASCUNHO" diagonal watermark across the current page.
 * Use for non-finalized documents (drafts).
 */
export const drawDraftWatermark = (doc: jsPDF, label = "RASCUNHO") => {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  doc.saveGraphicsState();
  // jsPDF doesn't expose alpha consistently; use a light gray instead
  doc.setTextColor(220, 222, 228);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(90);
  doc.text(label, W / 2, H / 2, { align: "center", angle: 30 });
  doc.restoreGraphicsState?.();
  doc.setTextColor(...BRAND.colors.text);
};

/** Section title — small uppercase label + thin underline accent. */
export const drawSectionTitle = (doc: jsPDF, label: string, x: number, y: number, width = 80) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.colors.primary);
  doc.text(label.toUpperCase(), x, y);
  doc.setDrawColor(...BRAND.colors.gold);
  doc.setLineWidth(0.5);
  doc.line(x, y + 1.2, x + width, y + 1.2);
  doc.setLineWidth(0.3);
  doc.setTextColor(...BRAND.colors.text);
};
