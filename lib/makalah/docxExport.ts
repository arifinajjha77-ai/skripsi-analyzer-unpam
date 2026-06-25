/**
 * SmartCampus V2.2 — Makalah DOCX Exporter
 *
 * Updated to support:
 * - Cover Builder (delegates to lib/cover/docxCover.ts)
 * - Rich section blocks (bab2Sections with tables)
 * - Academic comparison tables (Sprint 8)
 * - UNPAM-compliant formatting
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  PageBreak,
  convertInchesToTwip,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
} from "docx";
import { MakalahState, stateToCoverData } from "./store";
import { MakalahOutput } from "./generator";
import { AcademicTable } from "./writingEngine";
import { buildDocxCover } from "@/lib/cover/docxCover";
import { getUniversityInfo, getTemplate } from "@/lib/cover/templates";

// ─── Constants ────────────────────────────────────────────────────────────────

const FONT    = "Times New Roman";
const SZ      = 24;   // 12pt
const SZ_H1   = 28;   // 14pt
const SZ_H2   = 24;   // 12pt (bold)
const MARGIN_LEFT  = convertInchesToTwip(1.57); // 4cm
const MARGIN_OTHER = convertInchesToTwip(1.18); // 3cm

// ─── Paragraph Helpers ────────────────────────────────────────────────────────

function coverPara(text: string, bold = false, size = SZ): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text, font: FONT, size, bold })],
  });
}

function h1(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 200 },
    children: [new TextRun({ text, font: FONT, size: SZ_H1, bold: true })],
  });
}

function h2(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, font: FONT, size: SZ_H2, bold: true })],
  });
}

function body(text: string, firstIndent = true): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 360, after: 120 },
    indent: firstIndent ? { firstLine: convertInchesToTwip(0.5) } : undefined,
    children: [new TextRun({ text, font: FONT, size: SZ })],
  });
}

function listItem(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 360, after: 60 },
    indent: { left: convertInchesToTwip(0.5) },
    children: [new TextRun({ text, font: FONT, size: SZ })],
  });
}

function tableCaption(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 80 },
    children: [new TextRun({ text, font: FONT, size: SZ, bold: true })],
  });
}

function sourceNote(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { after: 200 },
    children: [new TextRun({ text: `Sumber: ${text}`, font: FONT, size: 20, italics: true })],
  });
}

function emptyLine(): Paragraph {
  return new Paragraph({ spacing: { after: 80 }, children: [] });
}

function pageBreak(): Paragraph {
  return new Paragraph({ children: [new PageBreak()] });
}

// ─── Table Builder ────────────────────────────────────────────────────────────

function buildAcademicTable(tbl: AcademicTable): Paragraph[] {
  const result: Paragraph[] = [];
  result.push(tableCaption(tbl.caption));

  const headerRow = new TableRow({
    children: tbl.headers.map(
      (h) =>
        new TableCell({
          shading: { type: ShadingType.SOLID, color: "2563EB", fill: "2563EB" },
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: h, font: FONT, size: 20, bold: true, color: "FFFFFF" })],
            }),
          ],
        })
    ),
  });

  const dataRows = tbl.rows.map(
    (row) =>
      new TableRow({
        children: row.map(
          (cell) =>
            new TableCell({
              margins: { top: 60, bottom: 60, left: 100, right: 100 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({ text: cell.value, font: FONT, size: 20, bold: cell.bold }),
                  ],
                }),
              ],
            })
        ),
      })
  );

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
        borders: {
          top:    { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
          left:   { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
          right:  { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
        },
  });

  // docx expects Table to be in the children array as a block — we wrap it
  // by pushing the table directly after converting it via a dummy paragraph
  result.push(
    new Paragraph({
      children: [],
      // Attach table as a child in docx — see workaround below
    })
  );

  // Return table separately via a special marker paragraph
  // We'll handle it in the section renderer
  result.push(sourceNote(tbl.source));
  return result;
}

// ─── Text to Paragraphs ───────────────────────────────────────────────────────

function textToParagraphs(text: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  for (const block of text.split("\n\n")) {
    const lines = block.split("\n");
    for (const line of lines) {
      const t = line.trim();
      if (!t) { paragraphs.push(emptyLine()); continue; }
      const isListLine = /^\d+\.\s/.test(t);
      paragraphs.push(isListLine ? listItem(t) : body(t));
    }
  }
  return paragraphs;
}

// ─── Cover (delegated to lib/cover/docxCover.ts) ─────────────────────────────
// buildCover is now async and uses the Cover Builder system

// ─── Section Renderer ─────────────────────────────────────────────────────────

function renderSection(
  text: string,
  tableData?: AcademicTable
): (Paragraph | Table)[] {
  const result: (Paragraph | Table)[] = [];
  const paragraphs = textToParagraphs(text);
  result.push(...paragraphs);

  if (tableData) {
    result.push(tableCaption(tableData.caption));

    const headerRow = new TableRow({
      children: tableData.headers.map(
        (h) =>
          new TableCell({
            shading: { type: ShadingType.SOLID, color: "1E3A5F", fill: "1E3A5F" },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: h, font: FONT, size: 20, bold: true, color: "FFFFFF" })],
              }),
            ],
          })
      ),
    });

    const dataRows = tableData.rows.map((row, rowIdx) =>
      new TableRow({
        children: row.map(
          (cell) =>
            new TableCell({
              shading: rowIdx % 2 === 1
                ? { type: ShadingType.SOLID, color: "F1F5F9", fill: "F1F5F9" }
                : undefined,
              margins: { top: 60, bottom: 60, left: 100, right: 100 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [new TextRun({ text: cell.value, font: FONT, size: 20, bold: cell.bold })],
                }),
              ],
            })
        ),
      })
    );

    result.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [headerRow, ...dataRows],
        borders: {
          top:    { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
          left:   { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
          right:  { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
        },
      })
    );
    result.push(sourceNote(tableData.source));
    result.push(emptyLine());
  }

  return result;
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export async function exportMakalahDocx(
  m: MakalahState,
  output: MakalahOutput
): Promise<Blob> {
  const children: (Paragraph | Table)[] = [];

  // ── Cover — delegated to Cover Builder engine ──────────────────────────────
  const coverData  = stateToCoverData(m);
  const coverPages = await buildDocxCover(coverData);
  children.push(...coverPages);

  // Kata Pengantar
  children.push(h1("KATA PENGANTAR"));
  children.push(...textToParagraphs(output.kataPengantar));
  children.push(pageBreak());

  // Daftar Isi
  children.push(h1("DAFTAR ISI"));
  for (const line of output.daftarIsi.split("\n")) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { line: 360, after: 40 },
        children: [new TextRun({ text: line, font: FONT, size: SZ })],
      })
    );
  }
  children.push(pageBreak());

  // BAB I
  children.push(h1("BAB I\nPENDAHULUAN"));
  for (const block of output.bab1.split(/\n(?=1\.\d+\s)/)) {
    const lines = block.split("\n");
    const first = lines[0].trim();
    if (/^1\.\d+/.test(first)) children.push(h2(first));
    else if (first) children.push(body(first));
    for (const line of lines.slice(1)) {
      const t = line.trim();
      if (!t) { children.push(emptyLine()); continue; }
      if (/^\d+\./.test(t)) children.push(listItem(t));
      else children.push(body(t));
    }
  }
  children.push(pageBreak());

  // BAB II — structured sections with tables
  children.push(h1("BAB II\nPEMBAHASAN"));
  for (const section of output.bab2Sections) {
    children.push(h2(`${section.number} ${section.title}`));
    children.push(...renderSection(section.text, section.tableData));
    children.push(emptyLine());
  }
  children.push(pageBreak());

  // BAB III
  children.push(h1("BAB III\nPENUTUP"));
  for (const block of output.bab3.split(/\n(?=3\.\d+\s)/)) {
    const lines = block.split("\n");
    const first = lines[0].trim();
    if (/^3\.\d+/.test(first)) children.push(h2(first));
    else if (first) children.push(body(first));
    for (const line of lines.slice(1)) {
      const t = line.trim();
      if (!t) { children.push(emptyLine()); continue; }
      if (/^\d+\./.test(t)) children.push(listItem(t));
      else children.push(body(t));
    }
  }
  children.push(pageBreak());

  // Daftar Pustaka
  children.push(h1("DAFTAR PUSTAKA"));
  for (const entry of output.daftarPustaka.split("\n\n")) {
    if (entry.trim()) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 360, after: 120 },
          indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.5) },
          children: [new TextRun({ text: entry.replace(/\*/g, ""), font: FONT, size: SZ })],
        })
      );
    }
  }

  // Use template margins for document
  const uniInfo = getUniversityInfo(m.universityId ?? "unpam");
  const tmpl    = getTemplate(uniInfo?.templateId ?? "generic");

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: tmpl.margins,
          },
        },
        children: children as Paragraph[],
      },
    ],
  });

  return Packer.toBlob(doc);
}
