import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  AlignmentType,
  WidthType,
  ShadingType,
  BorderStyle,
} from "docx";
import { Bab1State } from "./bab1Store";
import { ThesisState } from "./store";
import { fetchLogoBuffer, buildInstitutionHeader } from "@/lib/docx/logoHelper";
import {
  generateLatarBelakang,
  generateManfaatPenelitian,
  buildSalesTable,
  buildConsumerTable,
  buildCompetitorTable,
  GeneratedTable,
} from "./bab1Generator";

// ─── helpers ──────────────────────────────────────────────────────────────────

function h1(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28 })],
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 300 },
  });
}

function h2(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 26 })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 200 },
  });
}

function bodyPara(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: 24 })],
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 200, line: 360 },
    indent: { firstLine: 720 },
  });
}

function caption(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 22 })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 150 },
  });
}

function blank(): Paragraph {
  return new Paragraph({ text: "", spacing: { after: 200 } });
}

function buildDocxTable(table: GeneratedTable): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: table.headers.map(
      (h) =>
        new TableCell({
          shading: { type: ShadingType.SOLID, color: "DBEAFE" },
          children: [
            new Paragraph({
              children: [new TextRun({ text: h, bold: true, size: 22 })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 80 },
            }),
          ],
          width: { size: Math.floor(100 / table.headers.length), type: WidthType.PERCENTAGE },
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
                  children: [new TextRun({ text: cell, size: 22 })],
                  alignment: ci === 0 ? AlignmentType.CENTER : AlignmentType.LEFT,
                  spacing: { after: 60 },
                }),
              ],
              width: { size: Math.floor(100 / table.headers.length), type: WidthType.PERCENTAGE },
            })
        ),
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
}

function hr(): Paragraph {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC" } },
    spacing: { after: 200 },
  });
}

// ─── rumusan & tujuan from thesis state ───────────────────────────────────────

function buildRumusan(thesis: ThesisState, namaObjek: string): string[] {
  const { x1, x2, y } = thesis;
  return [
    `1. Apakah ${x1} berpengaruh terhadap ${y} pada ${namaObjek}?`,
    `2. Apakah ${x2} berpengaruh terhadap ${y} pada ${namaObjek}?`,
    `3. Apakah ${x1} dan ${x2} secara simultan berpengaruh terhadap ${y} pada ${namaObjek}?`,
  ];
}

function buildTujuan(thesis: ThesisState, namaObjek: string): string[] {
  const { x1, x2, y } = thesis;
  return [
    `1. Untuk mengetahui pengaruh ${x1} terhadap ${y} pada ${namaObjek}.`,
    `2. Untuk mengetahui pengaruh ${x2} terhadap ${y} pada ${namaObjek}.`,
    `3. Untuk mengetahui pengaruh ${x1} dan ${x2} secara simultan terhadap ${y} pada ${namaObjek}.`,
  ];
}

// ─── main export ──────────────────────────────────────────────────────────────

export async function generateBab1Docx(bab1: Bab1State, thesis: ThesisState): Promise<Blob> {
  const { namaObjek, jenisUsaha, lokasi } = bab1;
  const { x1, x2, y } = thesis;

  const judulText =
    `PENGARUH ${(x1 || "VARIABEL X1").toUpperCase()} DAN ${(x2 || "VARIABEL X2").toUpperCase()} ` +
    `TERHADAP ${(y || "VARIABEL Y").toUpperCase()} PADA ${(namaObjek || "OBJEK").toUpperCase()}`;

  const latarBelakangText = generateLatarBelakang(bab1, thesis);
  const manfaatText = generateManfaatPenelitian(bab1, thesis);

  const rumusan = buildRumusan(thesis, namaObjek);
  const tujuan = buildTujuan(thesis, namaObjek);

  const salesTable = buildSalesTable(bab1.salesData, namaObjek);
  const consumerTable = buildConsumerTable(bab1.consumerData, namaObjek);
  const competitorTable = buildCompetitorTable(bab1.competitors);

  const manfaatSections = manfaatText.split("\n\n").map((block) => {
    const lines = block.split("\n");
    const title = lines[0].replace(/\*\*/g, "");
    const body = lines.slice(1).join(" ");
    return { title, body };
  });

  const latarBelakangParas = latarBelakangText
    .split("\n\n")
    .filter(Boolean)
    .map((p) => bodyPara(p));

  // Institution header with logo
  const logoBuffer = await fetchLogoBuffer();
  const institutionHeader = await buildInstitutionHeader({ logoBuffer, withRule: true });

  const children: (Paragraph | Table)[] = [
    // Institution header
    ...institutionHeader,

    // Cover info
    new Paragraph({
      children: [new TextRun({ text: judulText, bold: true, size: 28 })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `${jenisUsaha} | ${lokasi}`, size: 22, color: "555555" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    hr(),

    // BAB I heading
    h1("BAB I"),
    h1("PENDAHULUAN"),

    // 1.1 Latar Belakang
    h2("1.1 Latar Belakang Penelitian"),
    ...latarBelakangParas,

    // Sales table
    ...(salesTable.rows.length > 0
      ? [
          caption(`Tabel 1.1 ${salesTable.caption}`),
          buildDocxTable(salesTable),
          blank(),
        ]
      : []),

    // Consumer table
    ...(consumerTable.rows.length > 0
      ? [
          caption(`Tabel 1.2 ${consumerTable.caption}`),
          buildDocxTable(consumerTable),
          blank(),
        ]
      : []),

    // Competitor table
    ...(competitorTable.rows.length > 0
      ? [
          caption(`Tabel 1.3 ${competitorTable.caption}`),
          buildDocxTable(competitorTable),
          blank(),
        ]
      : []),

    // 1.2 Rumusan Masalah
    h2("1.2 Rumusan Masalah"),
    ...rumusan.map((r) =>
      new Paragraph({
        children: [new TextRun({ text: r, size: 24 })],
        spacing: { after: 120, line: 360 },
        indent: { left: 360 },
      })
    ),
    blank(),

    // 1.3 Tujuan Penelitian
    h2("1.3 Tujuan Penelitian"),
    ...tujuan.map((t) =>
      new Paragraph({
        children: [new TextRun({ text: t, size: 24 })],
        spacing: { after: 120, line: 360 },
        indent: { left: 360 },
      })
    ),
    blank(),

    // 1.4 Manfaat Penelitian
    h2("1.4 Manfaat Penelitian"),
    ...manfaatSections.flatMap(({ title, body }) => [
      new Paragraph({
        children: [new TextRun({ text: title, bold: true, size: 24 })],
        spacing: { before: 200, after: 100 },
      }),
      bodyPara(body),
    ]),

    // Footer note
    blank(),
    hr(),
    new Paragraph({
      children: [
        new TextRun({
          text: "⚠ Pastikan data berasal dari responden asli. Dokumen ini dibuat menggunakan Skripsi Analyzer UNPAM.",
          size: 18,
          color: "888888",
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 } },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}
