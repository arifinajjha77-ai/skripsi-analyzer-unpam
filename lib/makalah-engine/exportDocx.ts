import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  PageBreak,
  Paragraph,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  WidthType,
  convertInchesToTwip,
} from "docx";
import type { MakalahDocument, MakalahEngineInput } from "./types";

const FONT = "Times New Roman";
const SIZE = 24;

export async function exportMakalahEngineDocx(document: MakalahDocument): Promise<Buffer> {
  const children: Array<Paragraph | Table | TableOfContents> = [
    ...buildCover(document.input),
    pageBreak(),
    heading("KATA PENGANTAR", HeadingLevel.HEADING_1, AlignmentType.CENTER),
    ...paragraphs(document.kataPengantar),
    pageBreak(),
    heading("DAFTAR ISI", HeadingLevel.HEADING_1, AlignmentType.CENTER),
    new TableOfContents("Daftar Isi", { hyperlink: true, headingStyleRange: "1-3" }),
    pageBreak(),
  ];

  for (const chapter of document.chapters) {
    children.push(heading(`${chapter.number} ${chapter.title}`, HeadingLevel.HEADING_1, AlignmentType.CENTER));
    for (const subsection of chapter.subsections) {
      children.push(heading(`${subsection.id} ${subsection.title}`, HeadingLevel.HEADING_2, AlignmentType.LEFT));
      children.push(...paragraphs(subsection.content));
    }
    children.push(pageBreak());
  }

  children.push(heading("DAFTAR PUSTAKA", HeadingLevel.HEADING_1, AlignmentType.CENTER));
  for (const entry of document.daftarPustaka) children.push(bibliography(entry));

  if (document.lampiran.length > 0) {
    children.push(pageBreak(), heading("LAMPIRAN", HeadingLevel.HEADING_1, AlignmentType.CENTER));
    for (const item of document.lampiran) children.push(body(item));
  }

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: FONT, size: SIZE }, paragraph: { spacing: { line: 360 } } },
      },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: FONT, size: 28, bold: true, color: "111827" },
          paragraph: { spacing: { before: 240, after: 180 }, alignment: AlignmentType.CENTER },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: FONT, size: SIZE, bold: true, color: "111827" },
          paragraph: { spacing: { before: 180, after: 120 } },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.18),
            },
          },
        },
        children: children as Paragraph[],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

function buildCover(input: MakalahEngineInput): Array<Paragraph | Table> {
  const isProposal = /proposal|mini project|clickora|custom clicker|social media marketing/i.test([
    input.judul,
    input.tema,
    input.mataKuliah,
  ].join(" "));
  return [
    center(isProposal ? "PROPOSAL MINI PROJECT" : "MAKALAH", 32, true, 300),
    center(input.judul.toUpperCase(), 30, true, 520),
    center(`Disusun untuk memenuhi tugas mata kuliah ${displayValue(input.mataKuliah, "[Mata Kuliah]")}`, SIZE, false, 360),
    center(`Dosen Pengampu: ${displayValue(input.namaDosen, "[Nama Dosen]")}`, SIZE, false, 360),
    metadataTable(input),
    center(displayValue(input.namaKampus, "[Nama Kampus]").toUpperCase(), SIZE, true, 80),
    center(displayValue(input.fakultas, "[Nama Fakultas]").toUpperCase(), SIZE, true, 80),
    center(displayValue(input.programStudi, "[Program Studi]").toUpperCase(), SIZE, true, 80),
    center(String(new Date().getFullYear()), SIZE, true, 0),
  ];
}

function metadataTable(input: MakalahEngineInput): Table {
  const rows = [
    ["Nama Mahasiswa/Kelompok", displayValue(input.namaMahasiswa, "[Nama Mahasiswa/Kelompok]")],
    ["NIM", displayValue(input.nim, "[NIM]")],
    ["Kelas", displayValue(input.kelas, "[Kelas]")],
    ["Tema/Produk/Studi Kasus", displayValue(input.tema, "[Tema/Produk/Studi Kasus]")],
  ];

  return new Table({
    width: { size: 80, type: WidthType.PERCENTAGE },
    rows: rows.map(([label, value]) => new TableRow({
      children: [
        tableCell(label, true),
        tableCell(value, false),
      ],
    })),
  });
}

function tableCell(text: string, bold: boolean): TableCell {
  return new TableCell({
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "9CA3AF" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "9CA3AF" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "9CA3AF" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "9CA3AF" },
    },
    children: [new Paragraph({ children: [new TextRun({ text, font: FONT, size: SIZE, bold })] })],
  });
}

function paragraphs(text: string): Paragraph[] {
  return text.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean).map((part) => body(part));
}

function body(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 360, after: 120 },
    indent: { firstLine: convertInchesToTwip(0.5) },
    children: [new TextRun({ text, font: FONT, size: SIZE })],
  });
}

function bibliography(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 360, after: 120 },
    indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.5) },
    children: [new TextRun({ text, font: FONT, size: SIZE })],
  });
}

function heading(
  text: string,
  level: (typeof HeadingLevel)[keyof typeof HeadingLevel],
  alignment: (typeof AlignmentType)[keyof typeof AlignmentType]
): Paragraph {
  return new Paragraph({
    heading: level,
    alignment,
    spacing: { before: 180, after: 160 },
    children: [new TextRun({ text, font: FONT, size: level === HeadingLevel.HEADING_1 ? 28 : SIZE, bold: true })],
  });
}

function center(text: string, size: number, bold: boolean, after: number): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after },
    children: [new TextRun({ text, font: FONT, size, bold })],
  });
}

function pageBreak(): Paragraph {
  return new Paragraph({ children: [new PageBreak()] });
}

function displayValue(value: string, placeholder: string): string {
  const trimmed = value?.trim();
  if (!trimmed || /^nama /i.test(trimmed) || /^program studi$/i.test(trimmed) || /^fakultas$/i.test(trimmed) || /^mata kuliah$/i.test(trimmed)) {
    return placeholder;
  }
  return trimmed;
}
