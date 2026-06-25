/**
 * UNPAM Makalah Cover — Fixed Layout Template
 *
 * Defines the EXACT element sequence and spacing for UNPAM makalah covers,
 * per pedoman akademik Universitas Pamulang.
 *
 * ┌───────────────────────────────────────────────────────────────┐
 * │                         MAKALAH                               │
 * │                                                               │
 * │        JUDUL MAKALAH YANG CUKUP PANJANG BISA                  │
 * │             AUTO WRAP SAMPAI BEBERAPA BARIS                   │
 * │                                                               │
 * │                   Dosen Pengampu :                            │
 * │              Dr. Aria Aji Priyanto, S.E., M.M.                │
 * │                                                               │
 * │                      [  LOGO  ]                               │
 * │                                                               │
 * │                   Disusun Oleh :                              │
 * │                    Kelompok 5                                 │
 * │              Nama Mahasiswa (NIM)                             │
 * │              Nama Mahasiswa (NIM)                             │
 * │                                                               │
 * │           FAKULTAS EKONOMI DAN BISNIS                         │
 * │              PROGRAM STUDI MANAJEMEN                          │
 * │              UNIVERSITAS PAMULANG                             │
 * │              TANGERANG SELATAN                                │
 * │                     2026                                      │
 * └───────────────────────────────────────────────────────────────┘
 *
 * Design principles:
 * - Fixed layout: element ORDER never changes; only TEXT changes
 * - Single source of truth: `buildUnpamElements()` drives both DOCX and React preview
 * - All spacing in POINTS → × 20 for twip (DOCX) · × (96/72) for px at 96dpi (preview)
 * - Flex spacer calculated dynamically so campus footer always sits at page bottom
 */

import { CoverData } from "@/lib/cover/types";

// ─── Typography & Sizes ───────────────────────────────────────────────────────

export const UNPAM_FONT = {
  family: "Times New Roman",
  body:   12 as const,   // pt — all body text
  makalah: 14 as const,  // pt — "MAKALAH" heading
  logoSizePt: 85,        // pt — logo diameter (3cm ≈ 85pt at 72pt/in)
};

// ─── Spacing (all values in POINTS) ──────────────────────────────────────────
// DOCX:    afterPt × 20    = twip
// Preview: afterPt × 1.333 = px at 96dpi

export const UNPAM_SP = {
  topPad:             28,   // blank space at top of content area
  afterMakalah:       16,   // "MAKALAH" → title
  titleLineGap:        4,   // between wrapped title lines
  afterLastTitleLine: 16,   // last title line → "Dosen Pengampu :"
  afterDosenLabel:     4,   // "Dosen Pengampu :" → dosen name
  afterDosenName:     28,   // dosen name → logo
  afterLogo:          28,   // logo → "Disusun Oleh :"
  afterDisusunLabel:   4,   // "Disusun Oleh :" → kelompok / member
  afterKelompok:       4,   // kelompok → first member
  afterMember:         4,   // between members
  footerLineGap:       4,   // between campus identity lines
};

// A4 usable height with 3cm top + bottom margins:
//   (297 - 30 - 30) mm = 237 mm
//   237 / 25.4 * 72 ≈ 672 pt
const A4_CONTENT_PT = 672;

// Logo occupies ~3cm = 85pt in height
const LOGO_H_PT = UNPAM_FONT.logoSizePt;

// ─── Element Types ────────────────────────────────────────────────────────────

export type UnpamElemType = "spacer" | "text" | "logo";

export interface UnpamElem {
  type:    UnpamElemType;
  text?:   string;
  bold:    boolean;
  sizePt:  number;   // font size (0 for spacer / logo)
  afterPt: number;   // spacing inserted AFTER this element
}

// ─── Smart Title Wrapper ──────────────────────────────────────────────────────

/**
 * Wraps a long title into lines of at most `maxWords` words each.
 * Prefers breaking at punctuation (comma, semicolon) when possible.
 */
function wrapTitle(raw: string, maxWords = 5): string[] {
  const words = raw.trim().split(/\s+/);
  if (words.length <= maxWords) return [words.join(" ")];

  const lines: string[] = [];
  let cur: string[] = [];

  for (const w of words) {
    cur.push(w);
    const naturalBreak = w.endsWith(",") || w.endsWith(";") || w.endsWith(":");
    if (cur.length >= maxWords || naturalBreak) {
      lines.push(cur.join(" "));
      cur = [];
    }
  }
  if (cur.length) lines.push(cur.join(" "));
  return lines;
}

// ─── Element Builder ──────────────────────────────────────────────────────────

/**
 * Builds the ordered list of cover elements from CoverData.
 * This is the single source of truth used by both the DOCX renderer
 * and the React preview — ensuring they are always identical.
 */
export function buildUnpamElements(cover: CoverData): UnpamElem[] {
  const sp = UNPAM_SP;
  const ft = UNPAM_FONT;
  const els: UnpamElem[] = [];

  // ── 1. Top padding ────────────────────────────────────────────────────────
  els.push({ type: "spacer", bold: false, sizePt: 0, afterPt: sp.topPad });

  // ── 2. "MAKALAH" ─────────────────────────────────────────────────────────
  els.push({ type: "text", text: "MAKALAH", bold: true, sizePt: ft.makalah, afterPt: sp.afterMakalah });

  // ── 3. Judul (UPPERCASE · BOLD · AUTO-WRAP) ───────────────────────────────
  const rawTitle  = (cover.judul || "JUDUL MAKALAH").toUpperCase();
  const titleLines = wrapTitle(rawTitle, 5);
  for (let i = 0; i < titleLines.length; i++) {
    const isLast = i === titleLines.length - 1;
    els.push({
      type: "text", text: titleLines[i],
      bold: true, sizePt: ft.body,
      afterPt: isLast ? sp.afterLastTitleLine : sp.titleLineGap,
    });
  }

  // ── 4. Dosen Pengampu ─────────────────────────────────────────────────────
  els.push({ type: "text", text: "Dosen Pengampu :", bold: false, sizePt: ft.body, afterPt: sp.afterDosenLabel });
  els.push({ type: "text", text: cover.namaDosen || "—", bold: false, sizePt: ft.body, afterPt: sp.afterDosenName });

  // ── 5. Logo ───────────────────────────────────────────────────────────────
  els.push({ type: "logo", bold: false, sizePt: 0, afterPt: sp.afterLogo });

  // ── 6. Disusun Oleh ───────────────────────────────────────────────────────
  els.push({ type: "text", text: "Disusun Oleh :", bold: false, sizePt: ft.body, afterPt: sp.afterDisusunLabel });

  if (cover.kelompok) {
    els.push({ type: "text", text: `Kelompok ${cover.kelompok}`, bold: false, sizePt: ft.body, afterPt: sp.afterKelompok });
  }

  const members = cover.penyusun.filter((p) => p.nama.trim());
  for (const m of members) {
    els.push({
      type: "text",
      text: m.nim ? `${m.nama} (${m.nim})` : m.nama,
      bold: false, sizePt: ft.body,
      afterPt: sp.afterMember,
    });
  }

  // ── Flex Spacer — pushes campus footer to page bottom ────────────────────
  // Sum all non-footer element heights so far
  let usedPt = 0;
  for (const el of els) {
    if      (el.type === "text")   usedPt += el.sizePt * 1.25 + el.afterPt;
    else if (el.type === "spacer") usedPt += el.afterPt;
    else if (el.type === "logo")   usedPt += LOGO_H_PT + el.afterPt;
  }
  // Campus footer: 5 lines
  const footerLinePt = ft.body * 1.25 + sp.footerLineGap;
  const footerPt     = 5 * footerLinePt;
  const flexPt       = Math.max(A4_CONTENT_PT - usedPt - footerPt, 8);
  els.push({ type: "spacer", bold: false, sizePt: 0, afterPt: flexPt });

  // ── 7. Campus Identity Footer ─────────────────────────────────────────────
  const footer = [
    (cover.fakultas    || "FAKULTAS EKONOMI DAN BISNIS").toUpperCase(),
    ("PROGRAM STUDI "  + (cover.programStudi || "MANAJEMEN")).toUpperCase(),
    (cover.universitas || "UNIVERSITAS PAMULANG").toUpperCase(),
    (cover.kota        || "TANGERANG SELATAN").toUpperCase(),
    cover.tahun        || String(new Date().getFullYear()),
  ];
  for (const line of footer) {
    els.push({ type: "text", text: line, bold: false, sizePt: ft.body, afterPt: sp.footerLineGap });
  }

  return els;
}
