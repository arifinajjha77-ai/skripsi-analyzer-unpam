/**
 * SmartCampus — DOCX Cover Generator
 *
 * Routes to the correct cover renderer based on universityId:
 *   - "unpam"  → buildUnpamDocxCover  (pixel-perfect fixed layout)
 *   - others   → buildGenericDocxCover (template-based)
 *
 * Both renderers use buildUnpamElements / template layouts as their
 * single source of truth — ensuring Preview ≡ DOCX.
 */

import {
  Paragraph,
  TextRun,
  AlignmentType,
  ImageRun,
  PageBreak,
  convertInchesToTwip,
  LineRuleType,
} from "docx";
import { CoverData } from "./types";
import { getUniversityInfo, getTemplate } from "./templates";
import { resolveLogoBuffer } from "./logoStore";
import {
  buildUnpamElements,
  UNPAM_FONT,
  UnpamElem,
} from "./templates/unpam/makalahCover";

// ─── Utilities ────────────────────────────────────────────────────────────────

const CM = (cm: number) => convertInchesToTwip(cm / 2.54);

type RasterType = "jpg" | "png" | "gif" | "bmp";

/** SVG uploads fall back to "png" for DOCX raster compatibility */
export function guessRasterType(dataUrl: string): RasterType {
  if (dataUrl.includes("image/jpeg") || dataUrl.includes("image/jpg")) return "jpg";
  if (dataUrl.includes("image/gif"))  return "gif";
  if (dataUrl.includes("image/bmp"))  return "bmp";
  return "png";
}

// ─── Smart Title Wrapping (used by generic cover) ─────────────────────────────

export function smartWrapTitle(title: string, maxWords = 5): string[] {
  const words = title.trim().split(/\s+/);
  if (words.length <= maxWords) return [words.join(" ")];
  const lines: string[] = [];
  let cur: string[] = [];
  for (const word of words) {
    cur.push(word);
    const atBreak = word.endsWith(",") || word.endsWith(";") || word.endsWith(":");
    if (cur.length >= maxWords || atBreak) { lines.push(cur.join(" ")); cur = []; }
  }
  if (cur.length) lines.push(cur.join(" "));
  return lines;
}

// ─── Generic Paragraph Helpers ────────────────────────────────────────────────

function coverText(text: string, opts: {
  bold?: boolean; size?: number; font?: string; spacing?: number;
} = {}): Paragraph {
  const { bold = false, size = 24, font = "Times New Roman", spacing = 60 } = opts;
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: spacing },
    children: [new TextRun({ text, font, size, bold })],
  });
}

function spacerParagraph(after = 200): Paragraph {
  return new Paragraph({ spacing: { after }, children: [] });
}

function dividerLine(color = "000000"): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    border: { bottom: { color, size: 6, style: "single" as const } },
    children: [],
  });
}

// ─── UNPAM DOCX Renderer ──────────────────────────────────────────────────────

/**
 * Renders the UNPAM pixel-perfect cover from `buildUnpamElements()`.
 * Uses EXACT same data as UnpamCoverPreview — ensures Preview = DOCX.
 */
async function buildUnpamDocxCover(cover: CoverData): Promise<Paragraph[]> {
  const elements  = buildUnpamElements(cover);
  const uniInfo   = getUniversityInfo(cover.universityId);
  const logoBuf   = await resolveLogoBuffer(cover.logoUrl, uniInfo?.logoPath);
  const imgType   = cover.logoUrl ? guessRasterType(cover.logoUrl) : "png";

  // Logo size: 3cm = 85pt → px at 96dpi
  const logoSizePx = Math.round(UNPAM_FONT.logoSizePt * (96 / 72));

  const paras: Paragraph[] = [];

  for (const el of elements) {
    const afterTwip = Math.round(el.afterPt * 20); // pt → twip

    switch (el.type) {

      case "spacer":
        paras.push(new Paragraph({
          spacing: { after: afterTwip },
          children: [],
        }));
        break;

      case "text":
        paras.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: {
            line:     240,                      // single spacing
            lineRule: LineRuleType.EXACT,
            after:    afterTwip,
          },
          children: [new TextRun({
            text:  el.text ?? "",
            font:  UNPAM_FONT.family,
            size:  Math.round(el.sizePt * 2),   // pt → half-pt
            bold:  el.bold,
          })],
        }));
        break;

      case "logo":
        if (logoBuf) {
          paras.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: afterTwip },
            children: [
              new ImageRun({
                data: logoBuf,
                transformation: { width: logoSizePx, height: logoSizePx },
                type: imgType,
              }),
            ],
          }));
        } else {
          // No logo — insert empty spacer of same height
          const logoTwip = Math.round(UNPAM_FONT.logoSizePt * 20);
          paras.push(new Paragraph({ spacing: { after: afterTwip + logoTwip }, children: [] }));
        }
        break;
    }
  }

  paras.push(new Paragraph({ children: [new PageBreak()] }));
  return paras;
}

// ─── Generic DOCX Cover ───────────────────────────────────────────────────────

async function buildGenericDocxCover(cover: CoverData): Promise<Paragraph[]> {
  const uniInfo  = getUniversityInfo(cover.universityId);
  const template = getTemplate(uniInfo?.templateId ?? "generic");

  const FONT = template.fontTitle;
  const SZ   = template.bodySizePt * 2;
  const SZ_T = template.titleSizePt * 2;

  const logoBuffer = await resolveLogoBuffer(cover.logoUrl, uniInfo?.logoPath);
  const imgType    = cover.logoUrl ? guessRasterType(cover.logoUrl) : "png";

  const children: Paragraph[] = [];
  children.push(spacerParagraph(300));

  for (const item of template.layout) {
    switch (item) {
      case "logo":
        if (logoBuffer) {
          const sizeEmu = Math.round(template.logoSizeCm * 914400 / 2.54);
          const sizePx  = Math.round(sizeEmu / 9525);
          children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 160 },
            children: [new ImageRun({ data: logoBuffer, transformation: { width: sizePx, height: sizePx }, type: imgType })],
          }));
        } else {
          children.push(spacerParagraph(120));
        }
        break;
      case "universitas":
        if (cover.universitas) children.push(coverText(cover.universitas.toUpperCase(), { bold: true, size: SZ + 2, font: FONT, spacing: 60 }));
        break;
      case "fakultas":
        if (cover.fakultas) children.push(coverText(cover.fakultas, { bold: false, size: SZ, font: FONT, spacing: 40 }));
        break;
      case "programStudi":
        if (cover.programStudi) children.push(coverText(cover.programStudi, { bold: false, size: SZ, font: FONT, spacing: 40 }));
        break;
      case "divider":
        if (template.showDividerLine) children.push(dividerLine(template.dividerColor));
        break;
      case "label_makalah":
        children.push(spacerParagraph(120));
        children.push(coverText("MAKALAH", { bold: true, size: SZ_T, font: FONT, spacing: 80 }));
        break;
      case "judul": {
        children.push(spacerParagraph(80));
        const lines = smartWrapTitle(cover.judul, 6);
        for (const line of lines) {
          children.push(coverText(
            template.titleUppercase ? line.toUpperCase() : line,
            { bold: template.titleBold, size: SZ_T, font: FONT, spacing: 40 }
          ));
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
        if (cover.kelompok) children.push(coverText(`Kelompok ${cover.kelompok}`, { bold: true, size: SZ, font: FONT, spacing: 60 }));
        for (const p of cover.penyusun.filter((x) => x.nama.trim())) {
          children.push(coverText(p.nim ? `${p.nama} (${p.nim})` : p.nama, { bold: false, size: SZ, font: FONT, spacing: 40 }));
        }
        break;
      case "kelompok":
        break;
      case "mata_kuliah_label":
        children.push(spacerParagraph(80));
        if (cover.mataKuliah) children.push(coverText(`Mata Kuliah: ${cover.mataKuliah}`, { bold: false, size: SZ, font: FONT, spacing: 40 }));
        break;
      case "dosen_label":
        if (cover.namaDosen) children.push(coverText(`Dosen Pengampu: ${cover.namaDosen}`, { bold: false, size: SZ, font: FONT, spacing: 40 }));
        break;
      case "kota_tahun":
        children.push(spacerParagraph(80));
        children.push(coverText(
          `${cover.kota || "Indonesia"}, ${cover.tahun || new Date().getFullYear().toString()}`,
          { bold: false, size: SZ, font: FONT, spacing: 60 }
        ));
        break;
    }
  }

  children.push(new Paragraph({ children: [new PageBreak()] }));
  return children;
}

// ─── Router ───────────────────────────────────────────────────────────────────

/**
 * Main entry point. Routes to the correct cover renderer.
 * UNPAM uses a pixel-perfect fixed layout; all others use the generic template engine.
 */
export async function buildDocxCover(cover: CoverData): Promise<Paragraph[]> {
  if (cover.universityId === "unpam") {
    return buildUnpamDocxCover(cover);
  }
  return buildGenericDocxCover(cover);
}
