import { getBab1References } from "@/lib/bab1-engine/authorMapping";
import { academicRuns, createFebDocument, FEB_INDENT, febSection } from "@/lib/docx/feb2021";
/**
 * BAB I DOCX Export — UNPAM Compliant
 *
 * Complies with UNPAM thesis format:
 * - Direct start: BAB I → PENDAHULUAN → 1.1 Latar Belakang
 * - No cover, no logo, no decorative header/footer, no HR lines
 * - Times New Roman, bold headings (black), 12pt body, 2 line spacing
 * - Table captions above table (bold, centered), source italic below
 * - Margins: top/left 4cm, right/bottom 3cm (UNPAM standard)
 */

import {
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  AlignmentType,
  WidthType,
  ShadingType,
  Tab,
  TabStopType,
} from "docx";
import { Bab1State } from "./bab1Store";
import { ThesisState } from "./store";
import {
  generateLatarBelakangBlocks,
  normalizeBab1State,
  generateManfaatPenelitian,
  generateSistematikaProposal,
  buildSalesTable,
  buildConsumerTable,
  buildCompetitorTable,
  buildObjectLabel,
  GeneratedTable,
} from "./bab1Generator";

// ─── UNPAM Typography Constants ───────────────────────────────────────────────

const FONT = "Times New Roman";
const SIZE_BODY = 24;     // 12pt in half-points
const SIZE_HEADING1 = 24; // 12pt
const SIZE_HEADING2 = 24; // 12pt bold

// ─── Paragraph Helpers ────────────────────────────────────────────────────────

/** BAB heading: centered, bold, uppercase, Times New Roman, black */
function h1(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: SIZE_HEADING1,
        color: "000000",
        font: FONT,
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 0, line: 480 },
    keepNext: true,
  });
}

/** Sub-BAB heading: left-aligned, bold, Times New Roman, black */
function h2(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        size: SIZE_HEADING2,
        color: "000000",
        font: FONT,
      }),
    ],
    alignment: AlignmentType.LEFT,
    spacing: { before: 0, after: 0, line: 480 },
    keepNext: true,
  });
}

/** Body paragraph: justified, first-line indent, Times New Roman, 2 spacing */
function bodyPara(text: string): Paragraph {
  return new Paragraph({
    children: academicRuns(text),
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 0, after: 0, line: 480 },
    indent: { firstLine: FEB_INDENT },
    keepLines: true,
    widowControl: true,
  });
}

/** Table caption: bold, centered, above table — "Tabel X.X Judul Tabel" */
function tableCaption(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24, font: FONT })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 0, line: 240 },
    keepNext: true,
  });
}

/** Source line: italic, left-aligned, below table — "Sumber: ..." */
function sourceNote(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, italics: true, size: 20, font: FONT, color: "555555" })],
    alignment: AlignmentType.LEFT,
    spacing: { before: 0, after: 0, line: 240 },
  });
}

/** Numbered list item */
function listItem(text: string): Paragraph {
  const match = text.match(/^(\d+)\.\s*(.*)$/);
  return new Paragraph({
    children: match ? [new TextRun({ children: [`${match[1]}.`, new Tab()], font: FONT, size: SIZE_BODY }), ...academicRuns(match[2])] : academicRuns(text),
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 0, after: 0, line: 480 },
    indent: { left: FEB_INDENT, hanging: FEB_INDENT },
    tabStops: [{ type: TabStopType.LEFT, position: FEB_INDENT }],
    keepLines: true,
  });
}

function blank(): Paragraph {
  return new Paragraph({ text: "", spacing: { before: 0, after: 0, line: 480 } });
}

// ─── Table Builder ────────────────────────────────────────────────────────────

function buildDocxTable(table: GeneratedTable): Table {
  const colWidth = Math.floor(7937 / table.headers.length);

  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: table.headers.map(
      (h) =>
        new TableCell({
          shading: { type: ShadingType.SOLID, color: "D9E1F2" },
          children: [
            new Paragraph({
              children: [new TextRun({ text: h, bold: true, size: 24, font: FONT })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 0, line: 240 },
            }),
          ],
          width: { size: colWidth, type: WidthType.DXA },
        })
    ),
  });

  const dataRows = table.rows.map(
    (row) =>
      new TableRow({
        cantSplit: true,
        children: row.cols.map(
          (cell, ci) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: academicRuns(cell, table.headers.length > 5 ? 20 : 24),
                  alignment: /^(No|Tahun|Target|Realisasi|Persentase|Rentang Harga)/i.test(table.headers[ci]) ? AlignmentType.RIGHT : AlignmentType.LEFT,
                  spacing: { before: 0, after: 0, line: 240 },
                }),
              ],
              width: { size: colWidth, type: WidthType.DXA },
            })
        ),
      })
  );

  return new Table({
    width: { size: 7937, type: WidthType.DXA },
    rows: [headerRow, ...dataRows],
  });
}

// ─── Rumusan & Tujuan ─────────────────────────────────────────────────────────

function buildRumusan(thesis: ThesisState, namaObjek: string): string[] {
  const { x1, x2, y } = thesis;
  return [
    `1. Apakah ${x1 || "X1"} berpengaruh terhadap ${y || "Y"} pada ${namaObjek}?`,
    `2. Apakah ${x2 || "X2"} berpengaruh terhadap ${y || "Y"} pada ${namaObjek}?`,
    `3. Apakah ${x1 || "X1"} dan ${x2 || "X2"} secara simultan berpengaruh terhadap ${y || "Y"} pada ${namaObjek}?`,
  ];
}

function buildTujuan(thesis: ThesisState, namaObjek: string): string[] {
  const { x1, x2, y } = thesis;
  return [
    `1. Untuk mengetahui pengaruh ${x1 || "X1"} terhadap ${y || "Y"} pada ${namaObjek}.`,
    `2. Untuk mengetahui pengaruh ${x2 || "X2"} terhadap ${y || "Y"} pada ${namaObjek}.`,
    `3. Untuk mengetahui pengaruh ${x1 || "X1"} dan ${x2 || "X2"} secara simultan terhadap ${y || "Y"} pada ${namaObjek}.`,
  ];
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export async function generateBab1Docx(bab1: Bab1State, thesis: ThesisState): Promise<Blob> {
  bab1 = normalizeBab1State(bab1);
  const { namaObjek, lokasi } = bab1;

  const latarBelakangBlocks = generateLatarBelakangBlocks(bab1, thesis);
  const manfaatText = generateManfaatPenelitian(bab1, thesis);

  const rumusan = buildRumusan(thesis, buildObjectLabel(namaObjek || "Objek Penelitian", lokasi));
  const tujuan  = buildTujuan(thesis,  buildObjectLabel(namaObjek || "Objek Penelitian", lokasi));

  const salesTable    = buildSalesTable(bab1.salesData, namaObjek, bab1.salesDataMode ?? "asli");
  const consumerTable = buildConsumerTable(bab1.consumerData, namaObjek, bab1.consumerDataMode ?? "asli");
  const competitorTable = buildCompetitorTable(bab1.competitors);

  const manfaatSections = manfaatText.split("\n\n").map((block) => {
    const lines = block.split("\n");
    const title = lines[0].replace(/\*\*/g, "");
    const body  = lines.slice(1).join(" ");
    return { title, body };
  });

  // ── Table numbering ──────────────────────────────────────────────────────────
  let tableNum = 0;
  const nextTableNum = () => {
    tableNum++;
    return `1.${tableNum}`;
  };

  const tableData = {
    sales: { table: salesTable, source: bab1.salesDataMode === "estimasi" ? `Sumber: ${bab1.catatanKerahasiaan}` : `Sumber: Data ${namaObjek}` },
    consumers: { table: consumerTable, source: bab1.consumerDataMode === "estimasi" ? `Sumber: ${bab1.catatanKerahasiaan}` : `Sumber: Data ${namaObjek}` },
    competitors: { table: competitorTable, source: bab1.competitors.some(c => c.source !== "manual" && c.source !== undefined)
      ? "Sumber: Data referensi awal, perlu diverifikasi terhadap sumber asli"
      : "Sumber: Data kompetitor yang diinput peneliti" },
  };
  const emitted = new Set<string>();
  function tableElements(key: keyof typeof tableData): (Paragraph | Table)[] {
    const { table, source } = tableData[key];
    if (!table.rows.length || emitted.has(key)) return [];
    emitted.add(key);
    return [tableCaption(`Tabel ${nextTableNum()} ${table.caption}`), buildDocxTable(table), sourceNote(source)];
  }
  const latarElements = latarBelakangBlocks.flatMap(({ text, tableAfter }) => [
    bodyPara(text), ...(tableAfter ? tableElements(tableAfter) : []),
  ]);
  // Preserve partially entered data even when it cannot support a trend narrative.
  for (const key of ["sales", "consumers", "competitors"] as const) latarElements.push(...tableElements(key));

  const children: (Paragraph | Table)[] = [
    h1("BAB I"),
    h1("PENDAHULUAN"),
    h2("1.1 Latar Belakang Penelitian"),
    ...latarElements,
    blank(),

    // 1.2 Rumusan Masalah
    h2("1.2 Rumusan Masalah"),
    ...rumusan.map((r) => listItem(r)),
    blank(),

    // 1.3 Tujuan Penelitian
    h2("1.3 Tujuan Penelitian"),
    ...tujuan.map((t) => listItem(t)),
    blank(),

    // 1.4 Manfaat Penelitian
    h2("1.4 Manfaat Penelitian"),
    ...manfaatSections.flatMap(({ title, body }) => [
      new Paragraph({
        children: [new TextRun({ text: title, bold: true, size: SIZE_BODY, font: FONT })],
        spacing: { before: 0, after: 0, line: 480 },
      }),
      bodyPara(body),
    ]),
  ];

  if (bab1.documentType === "proposal-skripsi") {
    children.push(blank(), h2("1.5 Sistematika Penulisan"));
    for (const block of generateSistematikaProposal().split("\n\n")) {
      const [title, ...body] = block.split("\n");
      children.push(h2(title), bodyPara(body.join(" ")));
    }
  }

  const references = getBab1References([thesis.x1, thesis.x2, thesis.y]);
  const bibliography = references.map(text => new Paragraph({ children: academicRuns(text), spacing: { before: 0, after: 0, line: 240 }, indent: { left: FEB_INDENT, hanging: FEB_INDENT } }));

  const doc = createFebDocument({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: SIZE_BODY },
        },
      },
    },
    sections: [febSection(children, "chapter", 1), ...(bibliography.length ? [febSection([h1("DAFTAR PUSTAKA"), ...bibliography], "back")] : [])],
  });

  return Packer.toBlob(doc);
}
