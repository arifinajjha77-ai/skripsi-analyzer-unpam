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
} from "docx";
import { ThesisState } from "./store";
import { getQuestionnaire } from "./questionnaire";

interface OperasionalRow {
  variabel: string;
  variabelKey: string;
  indikator: string;
  pernyataan: string;
  item: string;
  skala: string;
}

function buildRows(thesis: ThesisState): OperasionalRow[] {
  const entries: { key: string; name: string; varKey: string }[] = [
    { key: thesis.x1, name: thesis.x1, varKey: "X1" },
    { key: thesis.x2, name: thesis.x2, varKey: "X2" },
    { key: thesis.y, name: thesis.y, varKey: "Y" },
  ].filter((e) => e.key);

  const rows: OperasionalRow[] = [];

  for (const { key, name, varKey } of entries) {
    const q = getQuestionnaire(key);
    if (!q) continue;
    for (const item of q.items) {
      rows.push({
        variabel: name,
        variabelKey: varKey,
        indikator: item.indicator,
        pernyataan: item.statement,
        item: `${varKey}.${item.no}`,
        skala: "Likert 1–5",
      });
    }
  }

  return rows;
}

function makeCell(text: string, width: number, isHeader = false, bg = "FFFFFF"): TableCell {
  return new TableCell({
    shading: isHeader ? { type: ShadingType.SOLID, color: "DBEAFE" } : { type: ShadingType.SOLID, color: bg },
    width: { size: width, type: WidthType.PERCENTAGE },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: isHeader, size: isHeader ? 20 : 20 })],
        alignment: AlignmentType.LEFT,
        spacing: { after: 60 },
      }),
    ],
  });
}

export async function generateOperasionalDocx(thesis: ThesisState): Promise<Blob> {
  const rows = buildRows(thesis);

  const judul =
    thesis.x1 && thesis.x2 && thesis.y
      ? `Pengaruh ${thesis.x1} dan ${thesis.x2} Terhadap ${thesis.y}`
      : "Operasional Variabel Penelitian";

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      makeCell("No", 5, true),
      makeCell("Variabel", 15, true),
      makeCell("Indikator", 20, true),
      makeCell("Pernyataan", 40, true),
      makeCell("Item", 10, true),
      makeCell("Skala", 10, true),
    ],
  });

  const dataRows = rows.map((r, i) =>
    new TableRow({
      children: [
        makeCell(String(i + 1), 5, false, i % 2 === 0 ? "FFFFFF" : "F8FAFC"),
        makeCell(`${r.variabelKey} – ${r.variabel}`, 15, false, i % 2 === 0 ? "FFFFFF" : "F8FAFC"),
        makeCell(r.indikator, 20, false, i % 2 === 0 ? "FFFFFF" : "F8FAFC"),
        makeCell(r.pernyataan, 40, false, i % 2 === 0 ? "FFFFFF" : "F8FAFC"),
        makeCell(r.item, 10, false, i % 2 === 0 ? "FFFFFF" : "F8FAFC"),
        makeCell(r.skala, 10, false, i % 2 === 0 ? "FFFFFF" : "F8FAFC"),
      ],
    })
  );

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });

  // Summary paragraphs
  const uniqueVars = [...new Set(rows.map((r) => r.variabelKey))].length;
  const uniqueIndicators = [...new Set(rows.map((r) => r.indikator))].length;

  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 1440, right: 1080, bottom: 1440, left: 1800 } },
        },
        children: [
          new Paragraph({
            children: [new TextRun({ text: "OPERASIONAL VARIABEL PENELITIAN", bold: true, size: 28 })],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: judul, size: 24, color: "555555" })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Jumlah Variabel: ${uniqueVars}  |  Jumlah Indikator: ${uniqueIndicators}  |  Jumlah Item: ${rows.length}`,
                size: 22,
                bold: true,
              }),
            ],
            spacing: { after: 300 },
          }),
          table,
          new Paragraph({ text: "", spacing: { after: 400 } }),
          new Paragraph({
            children: [
              new TextRun({
                text: "⚠ Pastikan data berasal dari responden asli. Dokumen dibuat menggunakan Skripsi Analyzer UNPAM.",
                size: 18,
                color: "888888",
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
}
