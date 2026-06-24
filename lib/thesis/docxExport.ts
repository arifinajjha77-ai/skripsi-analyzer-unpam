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
  BorderStyle,
  ShadingType,
} from "docx";
import { VariableQuestionnaire } from "./questionnaire";

interface DocxExportOptions {
  judul: string;
  x1: string;
  x2: string;
  y: string;
  objek: string;
  x1Data: VariableQuestionnaire;
  x2Data: VariableQuestionnaire;
  yData: VariableQuestionnaire;
}

function bold(text: string, size = 24): TextRun {
  return new TextRun({ text, bold: true, size });
}

function normal(text: string, size = 24): TextRun {
  return new TextRun({ text, size });
}

function heading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_2): Paragraph {
  return new Paragraph({ text, heading: level, spacing: { before: 300, after: 150 } });
}

function para(children: TextRun[], spacing = 200): Paragraph {
  return new Paragraph({ children, spacing: { after: spacing } });
}

function hr(): Paragraph {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "888888" } },
    spacing: { after: 200 },
  });
}

const SCALE_LABELS = ["STS\n(1)", "TS\n(2)", "KS\n(3)", "S\n(4)", "SS\n(5)"];

function buildQuestionTable(items: VariableQuestionnaire["items"]): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        shading: { type: ShadingType.SOLID, color: "DBEAFE" },
        width: { size: 5, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [bold("No", 20)], alignment: AlignmentType.CENTER })],
      }),
      new TableCell({
        shading: { type: ShadingType.SOLID, color: "DBEAFE" },
        width: { size: 45, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [bold("Pernyataan", 20)], alignment: AlignmentType.CENTER })],
      }),
      ...SCALE_LABELS.map(
        (label) =>
          new TableCell({
            shading: { type: ShadingType.SOLID, color: "DBEAFE" },
            width: { size: 10, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [bold(label, 18)], alignment: AlignmentType.CENTER })],
          })
      ),
    ],
  });

  const dataRows = items.map(
    (item) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 5, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [normal(String(item.no), 20)], alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [normal(item.statement, 20)] })],
          }),
          ...SCALE_LABELS.map(
            () =>
              new TableCell({
                width: { size: 10, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ children: [normal("", 20)], alignment: AlignmentType.CENTER })],
              })
          ),
        ],
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
}

export async function generateDocx(opts: DocxExportOptions): Promise<Blob> {
  const { judul, x1, x2, y, objek, x1Data, x2Data, yData } = opts;

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 },
          },
        },
        children: [
          // ─── Cover ──────────────────────────────────────────────────
          new Paragraph({
            children: [bold("KUESIONER PENELITIAN", 28)],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [bold(judul.toUpperCase(), 26)],
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
          }),
          hr(),

          // ─── Identitas Responden ─────────────────────────────────────
          heading("IDENTITAS RESPONDEN", HeadingLevel.HEADING_2),
          para([normal("Nama (Opsional) : ............................................")]),
          para([normal("Jenis Kelamin  : ( ) Laki-laki  ( ) Perempuan")]),
          para([normal("Usia           : ............................................")]),
          para([normal("Pekerjaan      : ............................................")]),
          hr(),

          // ─── Petunjuk ───────────────────────────────────────────────
          heading("PETUNJUK PENGISIAN", HeadingLevel.HEADING_2),
          para([
            normal(
              "Mohon Bapak/Ibu/Saudara/i memberikan tanda centang (✓) pada kolom yang sesuai dengan " +
              "pendapat Anda. Tidak ada jawaban benar atau salah. Setiap jawaban yang Anda berikan " +
              "akan dijaga kerahasiaannya dan hanya digunakan untuk keperluan penelitian."
            ),
          ]),
          new Paragraph({
            children: [bold("Keterangan Skala:", 22)],
            spacing: { after: 100 },
          }),
          ...["STS = Sangat Tidak Setuju (1)", "TS = Tidak Setuju (2)", "KS = Kurang Setuju (3)", "S = Setuju (4)", "SS = Sangat Setuju (5)"].map(
            (s) => new Paragraph({ children: [normal(`     ${s}`, 22)], spacing: { after: 80 } })
          ),
          hr(),

          // ─── X1 ─────────────────────────────────────────────────────
          new Paragraph({
            children: [bold(`VARIABEL X1 – ${x1}`, 24)],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
          }),
          new Paragraph({
            children: [normal(`Indikator: ${x1Data.indicators.join(", ")}`, 22)],
            spacing: { after: 200 },
          }),
          buildQuestionTable(x1Data.items),
          new Paragraph({ text: "", spacing: { after: 400 } }),

          // ─── X2 ─────────────────────────────────────────────────────
          new Paragraph({
            children: [bold(`VARIABEL X2 – ${x2}`, 24)],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
          }),
          new Paragraph({
            children: [normal(`Indikator: ${x2Data.indicators.join(", ")}`, 22)],
            spacing: { after: 200 },
          }),
          buildQuestionTable(x2Data.items),
          new Paragraph({ text: "", spacing: { after: 400 } }),

          // ─── Y ──────────────────────────────────────────────────────
          new Paragraph({
            children: [bold(`VARIABEL Y – ${y}`, 24)],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
          }),
          new Paragraph({
            children: [normal(`Indikator: ${yData.indicators.join(", ")}`, 22)],
            spacing: { after: 200 },
          }),
          buildQuestionTable(yData.items),
          new Paragraph({ text: "", spacing: { after: 600 } }),

          // ─── Footer ─────────────────────────────────────────────────
          hr(),
          new Paragraph({
            children: [normal("Terima kasih atas partisipasi Anda. ⚠️ Pastikan data berasal dari responden asli.", 22)],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [normal(`Objek Penelitian: ${objek}`, 20)],
            alignment: AlignmentType.CENTER,
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBlob(doc);
  return buffer;
}
