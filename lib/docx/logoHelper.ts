/**
 * Shared DOCX logo + institution header helper.
 * Uses dynamic docx imports to avoid SSR bundle issues.
 * All DOCX exports should use this helper for consistent headers.
 */

import { getActiveTemplate } from "@/lib/templates";

// ─── Logo fetch ────────────────────────────────────────────────────────────────

/**
 * Fetch the campus logo from /public and return as ArrayBuffer.
 * Returns null if fetch fails or runs in non-browser context.
 */
export async function fetchLogoBuffer(logoPath?: string): Promise<ArrayBuffer | null> {
  if (typeof window === "undefined") return null;
  const path = logoPath ?? getActiveTemplate().logo;
  if (!path) return null;
  try {
    const resp = await fetch(path);
    if (!resp.ok) return null;
    return await resp.arrayBuffer();
  } catch {
    return null;
  }
}

// ─── Institution header ────────────────────────────────────────────────────────

export interface InstitutionHeaderOptions {
  logoBuffer: ArrayBuffer | null;
  logoSizePx?: number;
  namaKampus?: string;
  namaFakultas?: string;
  programStudi?: string;
  fontName?: string;
  withRule?: boolean;
}

/**
 * Build standard UNPAM institution header paragraphs using dynamic docx import.
 * Output:
 *   [LOGO]
 *   UNIVERSITAS PAMULANG
 *   FAKULTAS EKONOMI DAN BISNIS
 *   PROGRAM STUDI MANAJEMEN
 *   ───────────────────────────── (rule)
 */
export async function buildInstitutionHeader(opts: InstitutionHeaderOptions) {
  const {
    Paragraph, ImageRun, TextRun, AlignmentType, BorderStyle,
  } = await import("docx");

  const template = getActiveTemplate();
  const kampus   = opts.namaKampus  ?? template.nama.toUpperCase();
  const fakultas = opts.namaFakultas ?? template.namaFakultas.toUpperCase();
  const prodi    = opts.programStudi ?? `PROGRAM STUDI ${template.programStudi.toUpperCase()}`;
  const font     = opts.fontName ?? template.font;
  const sizePx   = opts.logoSizePx ?? 80;

  const paragraphs: InstanceType<typeof Paragraph>[] = [];

  // Logo
  if (opts.logoBuffer) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          new ImageRun({
            data: opts.logoBuffer,
            transformation: { width: sizePx, height: sizePx },
            type: "png",
          }),
        ],
      })
    );
  }

  // Institution text lines
  const lines = [{ text: kampus, size: 28 }, { text: fakultas, size: 24 }, { text: prodi, size: 24 }];
  lines.forEach(({ text, size }, i) => {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: i === lines.length - 1 ? 0 : 40 },
        children: [new TextRun({ text, font, size, bold: true })],
      })
    );
  });

  // Horizontal rule
  if (opts.withRule !== false) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 120, after: 240 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: "000000" } },
        children: [],
      })
    );
  }

  return paragraphs;
}
