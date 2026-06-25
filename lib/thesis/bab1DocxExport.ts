/**
 * BAB I DOCX Export — UNPAM Compliant
 *
 * Complies with UNPAM thesis format:
 * - Direct start: BAB I → PENDAHULUAN → 1.1 Latar Belakang
 * - No cover, no logo, no decorative header/footer, no HR lines
 * - Times New Roman, bold headings (black), 12pt body, 1.5 line spacing
 * - Table captions above table (bold, centered), source italic below
 * - Margins: top/right/bottom 3cm, left 4cm (UNPAM standard)
 */

import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  AlignmentType,
  WidthType,
  ShadingType,
} from "docx";
import { Bab1State } from "./bab1Store";
import { ThesisState } from "./store";
import {
  generateLatarBelakang,
  generateManfaatPenelitian,
  buildSalesTable,
  buildConsumerTable,
  buildCompetitorTable,
  buildObjectLabel,
  GeneratedTable,
} from "./bab1Generator";

// ─── UNPAM Typography Constants ───────────────────────────────────────────────

const FONT = "Times New Roman";
const SIZE_BODY = 24;     // 12pt in half-points
const SIZE_HEADING1 = 28; // 14pt
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
    spacing: { before: 480, after: 240 },
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
    spacing: { before: 360, after: 180 },
  });
}

/** Body paragraph: justified, first-line indent, Times New Roman, 1.5 spacing */
function bodyPara(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: SIZE_BODY, font: FONT })],
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 200, line: 360 },
    indent: { firstLine: 720 },
  });
}

/** Table caption: bold, centered, above table — "Tabel X.X Judul Tabel" */
function tableCaption(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 22, font: FONT })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 120 },
  });
}

/** Source line: italic, left-aligned, below table — "Sumber: ..." */
function sourceNote(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, italics: true, size: 20, font: FONT, color: "555555" })],
    alignment: AlignmentType.LEFT,
    spacing: { before: 80, after: 160 },
  });
}

/** Numbered list item */
function listItem(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: SIZE_BODY, font: FONT })],
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: 360 },
    indent: { left: 720, hanging: 360 },
  });
}

function blank(): Paragraph {
  return new Paragraph({ text: "", spacing: { after: 120 } });
}

// ─── Table Builder ────────────────────────────────────────────────────────────

function buildDocxTable(table: GeneratedTable): Table {
  const colWidth = Math.floor(9000 / table.headers.length);

  const headerRow = new TableRow({
    tableHeader: true,
    children: table.headers.map(
      (h) =>
        new TableCell({
          shading: { type: ShadingType.SOLID, color: "D9E1F2" },
          children: [
            new Paragraph({
              children: [new TextRun({ text: h, bold: true, size: 22, font: FONT })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 80 },
            }),
          ],
          width: { size: colWidth, type: WidthType.DXA },
        })
    ),
  });

  const dataRows = table.rows.map(
    (row) =>
      new TableRow({
        children: row.cols.map(
          (cell, ci) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: cell, size: 22, font: FONT })],
                  alignment: ci === 0 ? AlignmentType.CENTER : AlignmentType.LEFT,
                  spacing: { after: 60 },
                }),
              ],
              width: { size: colWidth, type: WidthType.DXA },
            })
        ),
      })
  );

  return new Table({
    width: { size: 9000, type: WidthType.DXA },
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
  const { namaObjek, lokasi } = bab1;

  const latarBelakangText = generateLatarBelakang(bab1, thesis);
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

  const latarBelakangParas = latarBelakangText
    .split("\n\n")
    .filter(Boolean)
    .map((p) => bodyPara(p));

  // ── Table numbering ──────────────────────────────────────────────────────────
  let tableNum = 0;
  const nextTableNum = () => {
    tableNum++;
    return `1.${tableNum}`;
  };

  // ── Document sections ────────────────────────────────────────────────────────
  const children: (Paragraph | Table)[] = [
    // BAB I PENDAHULUAN — no cover, no logo, start directly
    h1("BAB I"),
    h1("PENDAHULUAN"),

    // 1.1 Latar Belakang
    h2("1.1 Latar Belakang Penelitian"),
    ...latarBelakangParas,

    // Sales table
    ...(salesTable.rows.length > 0
      ? [
          tableCaption(`Tabel ${nextTableNum()} ${salesTable.caption}`),
          buildDocxTable(salesTable),
          sourceNote(
            bab1.salesDataMode !== "asli" && bab1.catatanKerahasiaan
              ? `Sumber: ${bab1.catatanKerahasiaan}`
              : `Sumber: Data ${namaObjek}`
          ),
          blank(),
        ]
      : []),

    // Consumer table
    ...(consumerTable.rows.length > 0
      ? [
          tableCaption(`Tabel ${nextTableNum()} ${consumerTable.caption}`),
          buildDocxTable(consumerTable),
          sourceNote(
            bab1.consumerDataMode !== "asli" && bab1.catatanKerahasiaan
              ? `Sumber: ${bab1.catatanKerahasiaan}`
              : `Sumber: Data ${namaObjek}`
          ),
          blank(),
        ]
      : []),

    // Competitor table
    ...(competitorTable.rows.length > 0
      ? [
          tableCaption(`Tabel ${nextTableNum()} ${competitorTable.caption}`),
          buildDocxTable(competitorTable),
          sourceNote(
            bab1.competitors.some(
              (c) => c.source === "estimasi" || c.source === "google" || c.source === "marketplace"
            )
              ? "Sumber: Data referensi awal, diverifikasi ulang sebelum digunakan"
              : `Sumber: Observasi lapangan peneliti`
          ),
          blank(),
        ]
      : []),

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
        spacing: { before: 200, after: 80 },
      }),
      bodyPara(body),
    ]),
  ];

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: SIZE_BODY },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              // UNPAM: left 4cm, others 3cm — in twips (1cm ≈ 567 twips)
              top: 1701,    // ~3cm
              right: 1701,  // ~3cm
              bottom: 1701, // ~3cm
              left: 2268,   // ~4cm
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}
