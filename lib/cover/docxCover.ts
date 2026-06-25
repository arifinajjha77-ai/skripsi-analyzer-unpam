/**
 * SmartCampus — DOCX Cover Generator
 *
 * Generates a properly formatted academic cover page as docx children[].
 * Used by makalah, and designed to be reused by proposal, laporan PKL, skripsi, etc.
 *
 * Renders exactly what the CoverPreview shows (Smart Title Wrapping, layout order, etc.)
 */

import {
  Paragraph,
  TextRun,
  AlignmentType,
  ImageRun,
  PageBreak,
  convertInchesToTwip,
} from "docx";
import { CoverData } from "./types";
import { getUniversityInfo, getTemplate } from "./templates";
import { resolveLogoBuffer } from "./logoStore";

// ─── Constants ────────────────────────────────────────────────────────────────

const CM = (cm: number) => convertInchesToTwip(cm / 2.54);

// ─── Smart Title Wrapping ─────────────────────────────────────────────────────

/**
 * Splits a long title into lines of max `maxWords` words each.
 * Ensures the title fits the cover width without overflowing.
 */
export function smartWrapTitle(title: string, maxWords = 5): string[] {
  const words = title.trim().split(/\s+/);
  if (words.length <= maxWords) return [words.join(" ")];

  const lines: string[] = [];
  let current: string[] = [];

  for (const word of words) {
    current.push(word);
    // Break at punctuation or when line is full
    const atBreak = word.endsWith(",") || word.endsWith(";") || word.endsWith(":");
    if (current.length >= maxWords || atBreak) {
      lines.push(current.join(" "));
      current = [];
    }
  }
  if (current.length) lines.push(current.join(" "));
  return lines;
}

// ─── Paragraph Builders ───────────────────────────────────────────────────────

function coverText(
  text: string,
  opts: { bold?: boolean; size?: number; font?: string; spacing?: number; upper?: boolean } = {}
): Paragraph {
  const { bold = false, size = 24, font = "Times New Roman", spacing = 60, upper = false } = opts;
  const content = upper ? text.toUpperCase() : text;
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: spacing },
    children: [new TextRun({ text: content, font, size, bold })],
  });
}

function spacerParagraph(after = 200): Paragraph {
  return new Paragraph({ spacing: { after }, children: [] });
}

function dividerLine(color = "000000"): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    border: {
      bottom: { color, size: 6, style: "single" as const },
    },
    children: [],
  });
}

// ─── Logo Paragraph ───────────────────────────────────────────────────────────

// docx ImageRun raster type values (SVG handled separately)
type RasterType = "jpg" | "png" | "gif" | "bmp";

function logoFromBuffer(
  buffer: ArrayBuffer,
  sizeCm: number,
  imgType: RasterType
): Paragraph {
  const sizeEmu = Math.round(sizeCm * 914400 / 2.54); // cm → EMU
  const sizePx  = Math.round(sizeEmu / 9525);          // EMU → pixels (96dpi)
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 160 },
    children: [
      new ImageRun({
        data: buffer,
        transformation: { width: sizePx, height: sizePx },
        type: imgType,
      }),
    ],
  });
}

/** SVG uploads are treated as PNG in DOCX (browsers render them fine as PNG) */
function guessRasterType(dataUrl: string): RasterType {
  if (dataUrl.includes("image/jpeg") || dataUrl.includes("image/jpg")) return "jpg";
  if (dataUrl.includes("image/gif"))  return "gif";
  if (dataUrl.includes("image/bmp"))  return "bmp";
  // SVG and PNG both default to "png" for DOCX compatibility
  return "png";
}

// ─── Main Cover Builder ───────────────────────────────────────────────────────

export async function buildDocxCover(cover: CoverData): Promise<Paragraph[]> {
  const uniInfo  = getUniversityInfo(cover.universityId);
  const template = getTemplate(uniInfo?.templateId ?? "generic");

  const FONT = template.fontTitle;
  const SZ   = template.bodySizePt * 2; // half-points
  const SZ_T = template.titleSizePt * 2;

  // Resolve logo buffer
  const logoBuffer = await resolveLogoBuffer(
    cover.logoUrl,
    uniInfo?.logoPath
  );

  const imgType = cover.logoUrl ? guessRasterType(cover.logoUrl) : "png";

  const children: Paragraph[] = [];

  // Large top spacer
  children.push(spacerParagraph(300));

  // Follow layout order defined in the template
  for (const item of template.layout) {
    switch (item) {
      case "logo":
        if (logoBuffer) {
          children.push(logoFromBuffer(logoBuffer, template.logoSizeCm, imgType));
        } else {
          // Placeholder spacer when no logo
          children.push(spacerParagraph(120));
        }
        break;

      case "universitas":
        if (cover.universitas) {
          children.push(coverText(cover.universitas.toUpperCase(), { bold: true, size: SZ + 2, font: FONT, spacing: 60 }));
        }
        break;

      case "fakultas":
        if (cover.fakultas) {
          children.push(coverText(cover.fakultas, { bold: false, size: SZ, font: FONT, spacing: 40 }));
        }
        break;

      case "programStudi":
        if (cover.programStudi) {
          children.push(coverText(cover.programStudi, { bold: false, size: SZ, font: FONT, spacing: 40 }));
        }
        break;

      case "divider":
        if (template.showDividerLine) {
          children.push(dividerLine(template.dividerColor));
        }
        break;

      case "label_makalah":
        children.push(spacerParagraph(120));
        children.push(coverText("MAKALAH", { bold: true, size: SZ_T, font: FONT, spacing: 80 }));
        break;

      case "judul": {
        children.push(spacerParagraph(80));
        const lines = smartWrapTitle(cover.judul, 6);
        for (const line of lines) {
          children.push(
            coverText(
              template.titleUppercase ? line.toUpperCase() : line,
              { bold: template.titleBold, size: SZ_T, font: FONT, spacing: 40 }
            )
          );
        }
        break;
      }

      case "spacer":
        children.push(spacerParagraph(200));
        break;

      case "penyusun_label":
        children.push(coverText("Disusun oleh:", { bold: false, size: SZ, font: FONT, spacing: 60 }));
        break;

      case "penyusun_list":
        if (cover.kelompok) {
          children.push(coverText(`Kelompok ${cover.kelompok}`, { bold: true, size: SZ, font: FONT, spacing: 60 }));
        }
        for (const p of cover.penyusun.filter((x) => x.nama.trim())) {
          const label = p.nim ? `${p.nama} (${p.nim})` : p.nama;
          children.push(coverText(label, { bold: false, size: SZ, font: FONT, spacing: 40 }));
        }
        break;

      case "kelompok":
        // Handled inside penyusun_list for grouped output
        break;

      case "mata_kuliah_label":
        children.push(spacerParagraph(80));
        if (cover.mataKuliah) {
          children.push(coverText(`Mata Kuliah: ${cover.mataKuliah}`, { bold: false, size: SZ, font: FONT, spacing: 40 }));
        }
        break;

      case "dosen_label":
        if (cover.namaDosen) {
          children.push(coverText(`Dosen Pengampu: ${cover.namaDosen}`, { bold: false, size: SZ, font: FONT, spacing: 40 }));
        }
        break;

      case "kota_tahun":
        children.push(spacerParagraph(80));
        children.push(
          coverText(
            `${cover.kota || "Indonesia"}, ${cover.tahun || new Date().getFullYear().toString()}`,
            { bold: false, size: SZ, font: FONT, spacing: 60 }
          )
        );
        break;
    }
  }

  // Page break after cover
  children.push(new Paragraph({ children: [new PageBreak()] }));

  return children;
}
