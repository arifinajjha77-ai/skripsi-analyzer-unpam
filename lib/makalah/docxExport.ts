/**
 * SmartCampus V2.5 — Makalah DOCX Exporter
 *
 * Changes in V2.5:
 *   - Replace manual h1/h2 with HeadingLevel-aware headings (TOC-detectable)
 *   - Replace manual daftarIsi string with real Word TOC field
 *   - Add document heading styles (black TNR — override Word's default blue)
 *   - Backward compatible: MakalahOutput.daftarIsi still available for UI preview
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
  TableOfContents,
} from "docx";
import { MakalahState, stateToCoverData } from "./store";
import { MakalahOutput } from "./generator";
import { AcademicTable } from "./writingEngine";
import { buildDocxCover } from "@/lib/cover/docxCover";
import { getUniversityInfo, getTemplate } from "@/lib/cover/templates";
import {
  buildH1,
  buildH2,
  buildTocSection,
  buildDocumentStyles,
  UNPAM_TOC_STYLE,
} from "@/lib/toc/tocEngine";

// ─── Constants ────────────────────────────────────────────────────────────────

const FONT = "Times New Roman";
const SZ   = 24;  // 12pt in half-points

// ─── Body Paragraph Builders ──────────────────────────────────────────────────

function body(text: string, firstIndent = true): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing:   { line: 360, after: 120 },
    indent:    firstIndent ? { firstLine: convertInchesToTwip(0.5) } : undefined,
    children:  [new TextRun({ text, font: FONT, size: SZ })],
  });
}

function listItem(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing:   { line: 360, after: 60 },
    indent:    { left: convertInchesToTwip(0.5) },
    children:  [new TextRun({ text, font: FONT, size: SZ })],
  });
}

function tableCaption(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing:   { before: 120, after: 80 },
    children:  [new TextRun({ text, font: FONT, size: SZ, bold: true })],
  });
}

function sourceNote(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing:   { after: 200 },
    children:  [new TextRun({ text: `Sumber: ${text}`, font: FONT, size: 20, italics: true })],
  });
}

function emptyLine(): Paragraph {
  return new Paragraph({ spacing: { after: 80 }, children: [] });
}

function pageBreak(): Paragraph {
  return new Paragraph({ children: [new PageBreak()] });
}

// ─── Table Builder ────────────────────────────────────────────────────────────

function buildAcademicTable(tbl: AcademicTable): (Paragraph | Table)[] {
  const result: (Paragraph | Table)[] = [];
  result.push(tableCaption(tbl.caption));

  const headerRow = new TableRow({
    children: tbl.headers.map(
      (h) =>
        new TableCell({
          shading:  { type: ShadingType.SOLID, color: "2563EB", fill: "2563EB" },
          margins:  { top: 60, bottom: 60, left: 100, right: 100 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children:  [new TextRun({ text: h, font: FONT, size: 20, bold: true, color: "FFFFFF" })],
            }),
          ],
        })
    ),
  });

  const dataRows = tbl.rows.map(
    (row, ri) =>
      new TableRow({
        children: row.map(
          (wCell, ci) =>
            new TableCell({
              shading: ri % 2 === 1 ? { type: ShadingType.SOLID, color: "F8FAFC", fill: "F8FAFC" } : undefined,
              margins: { top: 60, bottom: 60, left: 100, right: 100 },
              children: [
                new Paragraph({
                  alignment: ci === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
                  children:  [new TextRun({ text: wCell.value, font: FONT, size: 20, bold: wCell.bold ?? false })],
                }),
              ],
              borders: {
                top:    { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
                left:   { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
                right:  { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
              },
            })
        ),
      })
  );

  const table = new Table({
    width:   { size: 100, type: WidthType.PERCENTAGE },
    rows:    [headerRow, ...dataRows],
    borders: {
      top:    { style: BorderStyle.SINGLE, size: 4, color: "2563EB" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "2563EB" },
      left:   { style: BorderStyle.SINGLE, size: 4, color: "2563EB" },
      right:  { style: BorderStyle.SINGLE, size: 4, color: "2563EB" },
    },
  });

  result.push(table);
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

// ─── Section Renderer ─────────────────────────────────────────────────────────

function renderSection(
  text: string,
  tableData?: AcademicTable
): (Paragraph | Table)[] {
  const result: (Paragraph | Table)[] = [];
  result.push(...textToParagraphs(text));

  if (tableData) {
    result.push(tableCaption(tableData.caption));

    const headerRow = new TableRow({
      children: tableData.headers.map(
        (h) =>
          new TableCell({
            shading:  { type: ShadingType.SOLID, color: "1E3A5F", fill: "1E3A5F" },
            margins:  { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children:  [new TextRun({ text: h, font: FONT, size: 20, bold: true, color: "FFFFFF" })],
              }),
            ],
          })
      ),
    });

    const dataRows = tableData.rows.map(
      (row, ri) =>
        new TableRow({
          children: row.map(
            (wCell, ci) =>
              new TableCell({
                shading: ri % 2 === 1 ? { type: ShadingType.SOLID, color: "F1F5F9", fill: "F1F5F9" } : undefined,
                margins: { top: 60, bottom: 60, left: 100, right: 100 },
                children: [
                  new Paragraph({
                    alignment: ci === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
                    children:  [new TextRun({ text: wCell.value, font: FONT, size: 20, bold: wCell.bold ?? false })],
                  }),
                ],
                borders: {
                  top:    { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
                  left:   { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
                  right:  { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
                },
              })
          ),
        })
    );

    const tbl = new Table({
      width:   { size: 100, type: WidthType.PERCENTAGE },
      rows:    [headerRow, ...dataRows],
      borders: {
        top:    { style: BorderStyle.SINGLE, size: 4, color: "1E3A5F" },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "1E3A5F" },
        left:   { style: BorderStyle.SINGLE, size: 4, color: "1E3A5F" },
        right:  { style: BorderStyle.SINGLE, size: 4, color: "1E3A5F" },
      },
    });

    result.push(new Paragraph({ children: [], spacing: { after: 0 } }));
    result.push(new Paragraph({ children: [], spacing: { after: 0 } }));
    result.push(new Paragraph({ children: [], spacing: { after: 0 } }));
    result.push(new Paragraph({ children: [], spacing: { after: 0 } }));
    result.push(sourceNote(tableData.source));
  }
  return result;
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export async function exportMakalahDocx(
  m:      MakalahState,
  output: MakalahOutput
): Promise<Blob> {
  // V2.5: children accepts Paragraph | Table | TableOfContents
  // Cast to unknown[] then to Paragraph[] for the Document constructor
  const children: (Paragraph | Table | TableOfContents)[] = [];

  // ── Cover ──────────────────────────────────────────────────────────────────
  const coverData  = stateToCoverData(m);
  const coverPages = await buildDocxCover(coverData);
  children.push(...coverPages);

  // ── Kata Pengantar ─────────────────────────────────────────────────────────
  // buildH1 uses HeadingLevel.HEADING_1 — appears in TOC
  children.push(buildH1("KATA PENGANTAR", UNPAM_TOC_STYLE));
  children.push(...textToParagraphs(output.kataPengantar));
  children.push(pageBreak());

  // ── DAFTAR ISI — Word-native TOC field ────────────────────────────────────
  // V2.5: Replace manual text TOC with real Word TOC field.
  // The TOC field scans Heading 1–3 paragraphs and generates entries with:
  //   - Leader dots (…..) automatically
  //   - Right-aligned page numbers automatically
  //   - Correct indentation per heading level
  //   - Updateable by right-clicking in Word → "Update Field"
  //
  // NOTE: output.daftarIsi is still generated by the AI engine for UI preview;
  //       it is intentionally NOT used here to avoid hardcoded page numbers.
  children.push(...buildTocSection(UNPAM_TOC_STYLE));

  // ── BAB I ──────────────────────────────────────────────────────────────────
  children.push(buildH1("BAB I PENDAHULUAN", UNPAM_TOC_STYLE));
  for (const block of output.bab1.split(/\n(?=1\.\d+\s)/)) {
    const lines = block.split("\n");
    const first = lines[0].trim();
    if (/^1\.\d+/.test(first)) children.push(buildH2(first, UNPAM_TOC_STYLE));
    else if (first) children.push(body(first));
    for (const line of lines.slice(1)) {
      const t = line.trim();
      if (!t) { children.push(emptyLine()); continue; }
      if (/^\d+\./.test(t)) children.push(listItem(t));
      else children.push(body(t));
    }
  }
  children.push(pageBreak());

  // ── BAB II ─────────────────────────────────────────────────────────────────
  children.push(buildH1("BAB II PEMBAHASAN", UNPAM_TOC_STYLE));
  for (const section of output.bab2Sections) {
    children.push(buildH2(`${section.number} ${section.title}`, UNPAM_TOC_STYLE));
    children.push(...renderSection(section.text, section.tableData));
    children.push(emptyLine());
  }
  children.push(pageBreak());

  // ── BAB III ────────────────────────────────────────────────────────────────
  children.push(buildH1("BAB III PENUTUP", UNPAM_TOC_STYLE));
  for (const block of output.bab3.split(/\n(?=3\.\d+\s)/)) {
    const lines = block.split("\n");
    const first = lines[0].trim();
    if (/^3\.\d+/.test(first)) children.push(buildH2(first, UNPAM_TOC_STYLE));
    else if (first) children.push(body(first));
    for (const line of lines.slice(1)) {
      const t = line.trim();
      if (!t) { children.push(emptyLine()); continue; }
      if (/^\d+\./.test(t)) children.push(listItem(t));
      else children.push(body(t));
    }
  }
  children.push(pageBreak());

  // ── DAFTAR PUSTAKA ─────────────────────────────────────────────────────────
  children.push(buildH1("DAFTAR PUSTAKA", UNPAM_TOC_STYLE));
  for (const entry of output.daftarPustaka.split("\n\n")) {
    if (entry.trim()) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing:   { line: 360, after: 120 },
          indent:    { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.5) },
          children:  [new TextRun({ text: entry.replace(/\*/g, ""), font: FONT, size: SZ })],
        })
      );
    }
  }

  // ── Document configuration ─────────────────────────────────────────────────
  const uniInfo = getUniversityInfo(m.universityId ?? "unpam");
  const tmpl    = getTemplate(uniInfo?.templateId ?? "generic");

  // V2.5: Include heading style overrides so headings look academic (black TNR, not blue)
  const headingStyles = buildDocumentStyles(UNPAM_TOC_STYLE);

  const doc = new Document({
    styles: headingStyles,
    sections: [
      {
        properties: {
          page: {
            margin: tmpl.margins,
          },
        },
        // Cast: docx accepts Paragraph | Table | TableOfContents in children
        children: children as unknown as Paragraph[],
      },
    ],
  });

  return Packer.toBlob(doc);
}
