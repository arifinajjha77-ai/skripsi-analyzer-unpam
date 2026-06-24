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
import { KarakteristikResult, QualityReport, FreqRow } from "./types";

function h2(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 26 })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
  });
}

function bodyP(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: 24 })],
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 180, line: 360 },
    indent: { firstLine: 720 },
  });
}

function captionP(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 22 })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 120 },
  });
}

function buildFreqTable(rows: FreqRow[]): Table {
  const headers = ["Kategori", "Frekuensi", "Persentase"];
  const widths = [60, 20, 20];

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) =>
      new TableCell({
        shading: { type: ShadingType.SOLID, color: "DBEAFE" },
        width: { size: widths[i], type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 22 })], alignment: AlignmentType.CENTER, spacing: { after: 60 } })],
      })
    ),
  });

  const dataRows = rows.map((r, i) =>
    new TableRow({
      children: [
        new TableCell({
          shading: i % 2 === 1 ? { type: ShadingType.SOLID, color: "F8FAFC" } : undefined,
          width: { size: 60, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: r.kategori, size: 22 })], spacing: { after: 60 } })],
        }),
        new TableCell({
          shading: i % 2 === 1 ? { type: ShadingType.SOLID, color: "F8FAFC" } : undefined,
          width: { size: 20, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: String(r.frekuensi), size: 22 })], alignment: AlignmentType.CENTER, spacing: { after: 60 } })],
        }),
        new TableCell({
          shading: i % 2 === 1 ? { type: ShadingType.SOLID, color: "F8FAFC" } : undefined,
          width: { size: 20, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: r.persentase, size: 22 })], alignment: AlignmentType.CENTER, spacing: { after: 60 } })],
        }),
      ],
    })
  );

  // Total row
  const totalFreq = rows.reduce((s, r) => s + r.frekuensi, 0);
  const totalRow = new TableRow({
    children: [
      new TableCell({
        shading: { type: ShadingType.SOLID, color: "EFF6FF" },
        width: { size: 60, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: "Total", bold: true, size: 22 })], spacing: { after: 60 } })],
      }),
      new TableCell({
        shading: { type: ShadingType.SOLID, color: "EFF6FF" },
        width: { size: 20, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: String(totalFreq), bold: true, size: 22 })], alignment: AlignmentType.CENTER, spacing: { after: 60 } })],
      }),
      new TableCell({
        shading: { type: ShadingType.SOLID, color: "EFF6FF" },
        width: { size: 20, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: "100%", bold: true, size: 22 })], alignment: AlignmentType.CENTER, spacing: { after: 60 } })],
      }),
    ],
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows, totalRow],
  });
}

function blank(): Paragraph {
  return new Paragraph({ text: "", spacing: { after: 160 } });
}

export async function generateKarakteristikDocx(
  result: KarakteristikResult,
  report: QualityReport
): Promise<Blob> {
  const sections: (Paragraph | Table)[] = [
    new Paragraph({
      children: [new TextRun({ text: "KARAKTERISTIK RESPONDEN", bold: true, size: 28 })],
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Jumlah Responden: ${report.totalResponden}  |  Data Lengkap: ${report.completeResponden} (${report.completenessPercent}%)`,
          size: 22,
          color: "444444",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 500 },
    }),
  ];

  let tableNo = 1;

  // Jenis Kelamin
  if (result.jenisKelamin.length > 0) {
    const [first] = result.jenisKelamin;
    sections.push(
      h2("Jenis Kelamin"),
      captionP(`Tabel ${tableNo++}. Karakteristik Responden Berdasarkan Jenis Kelamin`),
      buildFreqTable(result.jenisKelamin),
      blank(),
      bodyP(
        `Berdasarkan Tabel di atas, responden terbanyak berdasarkan jenis kelamin adalah ${first.kategori} ` +
        `sebanyak ${first.frekuensi} orang atau ${first.persentase} dari total ${report.totalResponden} responden.`
      )
    );
  }

  // Usia
  if (result.usia.length > 0) {
    const sorted = [...result.usia].filter((u) => u.kategori !== "Tidak diisi").sort((a, b) => b.frekuensi - a.frekuensi);
    sections.push(
      h2("Usia"),
      captionP(`Tabel ${tableNo++}. Karakteristik Responden Berdasarkan Usia`),
      buildFreqTable(result.usia),
      blank(),
      bodyP(
        sorted.length > 0
          ? `Berdasarkan data usia responden, kelompok usia terbanyak adalah ${sorted[0].kategori} ` +
            `sebanyak ${sorted[0].frekuensi} orang (${sorted[0].persentase}).`
          : "Data usia responden tersedia pada tabel di atas."
      )
    );
  }

  // Pendidikan
  if (result.pendidikan.length > 0) {
    const [first] = result.pendidikan;
    sections.push(
      h2("Pendidikan Terakhir"),
      captionP(`Tabel ${tableNo++}. Karakteristik Responden Berdasarkan Pendidikan`),
      buildFreqTable(result.pendidikan),
      blank(),
      bodyP(
        `Berdasarkan data pendidikan responden, tingkat pendidikan terbanyak adalah ${first.kategori} ` +
        `sebanyak ${first.frekuensi} orang (${first.persentase}).`
      )
    );
  }

  // Pekerjaan
  if (result.pekerjaan.length > 0) {
    const [first] = result.pekerjaan;
    sections.push(
      h2("Pekerjaan"),
      captionP(`Tabel ${tableNo++}. Karakteristik Responden Berdasarkan Pekerjaan`),
      buildFreqTable(result.pekerjaan),
      blank(),
      bodyP(
        `Berdasarkan data pekerjaan, jenis pekerjaan yang paling banyak dimiliki responden adalah ${first.kategori} ` +
        `sebanyak ${first.frekuensi} orang (${first.persentase}).`
      )
    );
  }

  // Footer
  sections.push(
    blank(),
    new Paragraph({
      children: [new TextRun({ text: "⚠ Pastikan data berasal dari responden asli. Dokumen dibuat menggunakan Skripsi Analyzer UNPAM.", size: 18, color: "888888" })],
      alignment: AlignmentType.CENTER,
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 } } },
        children: sections,
      },
    ],
  });

  return Packer.toBlob(doc);
}
