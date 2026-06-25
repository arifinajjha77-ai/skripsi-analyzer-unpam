/**
 * Makalah DOCX Exporter
 *
 * Generates a properly formatted Word document for an academic Makalah.
 * Follows standard Indonesian academic paper formatting:
 * - Times New Roman 12pt, 1.5 line spacing
 * - Margins: 4cm left, 3cm others
 * - Cover page, Kata Pengantar, Daftar Isi, BAB I–III, Daftar Pustaka
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  PageBreak,
  TableOfContents,
  LevelFormat,
  convertInchesToTwip,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";
import { MakalahState } from "./store";
import { MakalahOutput } from "./generator";

// ─── Constants ────────────────────────────────────────────────────────────────

const FONT   = "Times New Roman";
const SZ     = 24; // 12pt = 24 half-points
const SZ_H1  = 28; // 14pt for BAB headings
const SZ_H2  = 24; // 12pt for section headings
const SZ_COVER_TITLE = 28;
const SZ_COVER_INFO  = 24;

const MARGIN_LEFT  = convertInchesToTwip(1.57); // ~4cm
const MARGIN_OTHER = convertInchesToTwip(1.18); // ~3cm

// ─── Paragraph Helpers ────────────────────────────────────────────────────────

function coverTitle(text: string, sz = SZ_COVER_TITLE): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text, font: FONT, size: sz, bold: true })],
  });
}

function coverInfo(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [new TextRun({ text, font: FONT, size: SZ_COVER_INFO })],
  });
}

function babHeading(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 200 },
    children: [new TextRun({ text, font: FONT, size: SZ_H1, bold: true })],
  });
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 160, after: 120 },
    children: [new TextRun({ text, font: FONT, size: SZ_H2, bold: true })],
  });
}

function bodyPara(text: string, center = false): Paragraph {
  return new Paragraph({
    alignment: center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    spacing: { line: 360, after: 120 }, // 1.5 spacing
    indent: { firstLine: convertInchesToTwip(0.5) },
    children: [new TextRun({ text, font: FONT, size: SZ })],
  });
}

function pageBreak(): Paragraph {
  return new Paragraph({
    children: [new PageBreak()],
  });
}

function emptyLine(): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text: "", font: FONT, size: SZ })],
  });
}

function tocLine(label: string, dots: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 360, after: 40 },
    children: [new TextRun({ text: `${label} ${dots}`, font: FONT, size: SZ })],
  });
}

// ─── Text to Paragraphs ───────────────────────────────────────────────────────

function textToParagraphs(text: string): Paragraph[] {
  const blocks = text.split("\n\n");
  const result: Paragraph[] = [];

  for (const block of blocks) {
    const lines = block.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        result.push(emptyLine());
        continue;
      }
      // Numbered list items (1. 2. 3.)
      const isListItem = /^\d+\./.test(trimmed);
      result.push(
        new Paragraph({
          alignment: isListItem ? AlignmentType.LEFT : AlignmentType.JUSTIFIED,
          spacing: { line: 360, after: 80 },
          indent: isListItem
            ? { left: convertInchesToTwip(0.5) }
            : { firstLine: convertInchesToTwip(0.5) },
          children: [new TextRun({ text: trimmed, font: FONT, size: SZ })],
        })
      );
    }
  }

  return result;
}

// ─── Section Block ────────────────────────────────────────────────────────────

function renderSection(heading: string, content: string): Paragraph[] {
  // Split content by sub-sections (e.g. "1.1 ...")
  const parts = content.split(/\n(?=\d+\.\d+\s)/);
  const result: Paragraph[] = [];

  if (heading) result.push(babHeading(heading));

  for (const part of parts) {
    const lines = part.split("\n");
    const firstLine = lines[0].trim();
    const rest = lines.slice(1).join("\n").trim();

    if (/^\d+\.\d+/.test(firstLine)) {
      result.push(sectionHeading(firstLine));
    } else if (firstLine) {
      result.push(...textToParagraphs(firstLine));
    }

    if (rest) result.push(...textToParagraphs(rest));
  }

  return result;
}

// ─── Cover Page ───────────────────────────────────────────────────────────────

function buildCover(m: MakalahState): Paragraph[] {
  const paras: Paragraph[] = [];

  paras.push(new Paragraph({ spacing: { after: 800 }, children: [] }));
  paras.push(coverTitle("MAKALAH", SZ_H1));
  paras.push(new Paragraph({ spacing: { after: 400 }, children: [] }));
  paras.push(coverTitle(`"${m.judul || "Judul Makalah"}"`, SZ_COVER_TITLE));
  paras.push(new Paragraph({ spacing: { after: 800 }, children: [] }));

  paras.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: "Diajukan untuk Memenuhi Tugas Mata Kuliah",
          font: FONT,
          size: SZ,
        }),
      ],
    })
  );
  paras.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: m.mataKuliah || "Mata Kuliah",
          font: FONT,
          size: SZ,
          bold: true,
        }),
      ],
    })
  );
  paras.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: `Dosen Pengampu: ${m.namaDosen || "Nama Dosen"}`,
          font: FONT,
          size: SZ,
        }),
      ],
    })
  );

  paras.push(new Paragraph({ spacing: { after: 600 }, children: [] }));

  // Members
  if (m.anggota.some((a) => a.nama)) {
    paras.push(coverInfo("Disusun oleh:"));
    if (m.kelompok) {
      paras.push(coverInfo(`Kelompok ${m.kelompok}`));
    }
    for (const anggota of m.anggota.filter((a) => a.nama)) {
      paras.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: anggota.nim ? `${anggota.nama} (${anggota.nim})` : anggota.nama,
              font: FONT,
              size: SZ,
            }),
          ],
        })
      );
    }
  }

  paras.push(new Paragraph({ spacing: { after: 600 }, children: [] }));
  paras.push(coverInfo(m.programStudi || "Program Studi"));
  paras.push(coverInfo(m.universitas || "Universitas"));
  if (m.tahunAkademik) {
    paras.push(coverInfo(`Tahun Akademik ${m.tahunAkademik}`));
  }

  return paras;
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export async function exportMakalahDocx(
  m: MakalahState,
  output: MakalahOutput
): Promise<Blob> {
  const children: Paragraph[] = [];

  // ── Cover ──────────────────────────────────────────────────────────────
  children.push(...buildCover(m));
  children.push(pageBreak());

  // ── Kata Pengantar ─────────────────────────────────────────────────────
  children.push(babHeading("KATA PENGANTAR"));
  children.push(...textToParagraphs(output.kataPengantar));
  children.push(pageBreak());

  // ── Daftar Isi ─────────────────────────────────────────────────────────
  children.push(babHeading("DAFTAR ISI"));
  const tocLines = output.daftarIsi.split("\n");
  for (const line of tocLines) {
    if (line.trim()) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { line: 360, after: 40 },
          children: [new TextRun({ text: line, font: FONT, size: SZ })],
        })
      );
    }
  }
  children.push(pageBreak());

  // ── BAB I ──────────────────────────────────────────────────────────────
  children.push(...renderSection("BAB I\nPENDAHULUAN", output.bab1));
  children.push(pageBreak());

  // ── BAB II ─────────────────────────────────────────────────────────────
  children.push(...renderSection("BAB II\nPEMBAHASAN", output.bab2));
  children.push(pageBreak());

  // ── BAB III ────────────────────────────────────────────────────────────
  children.push(...renderSection("BAB III\nPENUTUP", output.bab3));
  children.push(pageBreak());

  // ── Daftar Pustaka ─────────────────────────────────────────────────────
  children.push(babHeading("DAFTAR PUSTAKA"));
  const pustaka = output.daftarPustaka.split("\n\n");
  for (const entry of pustaka) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    children.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: 360, after: 120 },
        indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.5) },
        children: [new TextRun({ text: trimmed.replace(/\*/g, ""), font: FONT, size: SZ })],
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top:    MARGIN_OTHER,
              right:  MARGIN_OTHER,
              bottom: MARGIN_OTHER,
              left:   MARGIN_LEFT,
            },
          },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBlob(doc);
  return buffer;
}
