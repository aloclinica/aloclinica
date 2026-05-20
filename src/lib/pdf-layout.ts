import type jsPDF from "jspdf";

/**
 * Helpers para garantir que textos e QR codes nunca ultrapassem as margens da página A4
 * (independente do tamanho do nome do paciente, médico, observações ou da resolução).
 */

export type SafeTextOpts = {
  /** x inicial (em pt ou mm, mesma unidade do doc) */
  x: number;
  /** y inicial */
  y: number;
  /** largura máxima disponível antes de quebrar / encolher */
  maxWidth: number;
  /** tamanho de fonte desejado */
  fontSize: number;
  /** menor fonte aceita antes de truncar (default 6) */
  minFontSize?: number;
  /** alinhamento jsPDF */
  align?: "left" | "center" | "right";
  /** altura de linha em unidades do doc; default = fontSize * 1.15 / docScale */
  lineHeight?: number;
};

/**
 * Desenha texto garantindo:
 * 1. Quebra automática (splitTextToSize)
 * 2. Redução de fonte se mesmo quebrado o bloco não couber em maxLines
 * 3. Truncamento com "…" como último recurso
 * Retorna o `y` final (após o bloco).
 */
export function drawSafeText(
  doc: jsPDF,
  text: string,
  opts: SafeTextOpts & { maxLines?: number }
): number {
  const { x, y, maxWidth, align } = opts;
  const minFontSize = opts.minFontSize ?? 6;
  const maxLines = opts.maxLines ?? Infinity;

  let fontSize = opts.fontSize;
  let lines: string[] = [];

  // shrink-to-fit
  while (fontSize >= minFontSize) {
    doc.setFontSize(fontSize);
    lines = doc.splitTextToSize(String(text ?? ""), maxWidth);
    if (lines.length <= maxLines) break;
    fontSize -= 0.5;
  }

  // truncate como último recurso
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    const last = lines[lines.length - 1] ?? "";
    lines[lines.length - 1] = last.replace(/.{1,3}$/, "…");
  }

  const lineHeight = opts.lineHeight ?? fontSize * 0.45;
  doc.text(lines, x, y, align ? { align } : undefined);
  return y + lines.length * lineHeight;
}

/**
 * Calcula o tamanho e a posição seguros para um QR code, garantindo que ele:
 *  - Permaneça dentro das margens da página.
 *  - Não ultrapasse o tamanho máximo desejado.
 *  - Tenha um tamanho mínimo legível (>= 18 unidades, ~5 mm).
 */
export function safeQrBox(
  doc: jsPDF,
  desired: { x: number; y: number; size: number },
  margin: number,
  minSize = 18
): { x: number; y: number; size: number } {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const maxByRight = W - margin - desired.x;
  const maxByBottom = H - margin - desired.y;
  const size = Math.max(minSize, Math.min(desired.size, maxByRight, maxByBottom));
  const x = Math.min(desired.x, W - margin - size);
  const y = Math.min(desired.y, H - margin - size);
  return { x, y, size };
}

/** Garante que (x + width) caiba dentro de `pageWidth - margin`. */
export function clampWidth(
  doc: jsPDF,
  x: number,
  desiredWidth: number,
  margin: number
): number {
  const W = doc.internal.pageSize.getWidth();
  return Math.max(10, Math.min(desiredWidth, W - margin - x));
}