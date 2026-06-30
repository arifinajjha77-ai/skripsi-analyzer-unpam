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
  TableRow,
  TextRun,
  WidthType,
  convertInchesToTwip,
} from "docx";
import type { AssignmentAcademicSection, AssignmentReport, AssignmentTimelineRow } from "./types";

const FONT = "Times New Roman";
const BODY_SIZE = 24;

export async function exportAssignmentDocx(report: AssignmentReport): Promise<Buffer> {
  const children: Array<Paragraph | Table> = report.academicSections?.length
    ? buildAcademicDocument(report)
    : buildGenericDocument(report);

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: FONT, size: BODY_SIZE }, paragraph: { spacing: { line: 360 } } },
      },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: FONT, size: 28, bold: true },
          paragraph: { spacing: { before: 240, after: 160 } },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: FONT, size: BODY_SIZE, bold: true },
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
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

function buildAcademicDocument(report: AssignmentReport): Array<Paragraph | Table> {
  const children: Array<Paragraph | Table> = [
    center("PROPOSAL MINI PROJECT", 32, true, 280),
    center(report.title.toUpperCase(), 30, true, 460),
    center(`Mata Kuliah: ${report.course}`, BODY_SIZE, false, 260),
    center(String(new Date().getFullYear()), BODY_SIZE, true, 0),
    pageBreak(),
    heading("KATA PENGANTAR", HeadingLevel.HEADING_1, AlignmentType.CENTER),
    ...paragraphs(buildKataPengantar(report)),
    pageBreak(),
    heading("DAFTAR ISI", HeadingLevel.HEADING_1, AlignmentType.CENTER),
    ...buildDaftarIsi(report.academicSections || []),
    pageBreak(),
  ];

  for (const section of report.academicSections || []) {
    if (section.level === "chapter") {
      children.push(heading(section.heading, HeadingLevel.HEADING_1, AlignmentType.CENTER));
      continue;
    }
    children.push(heading(section.heading, HeadingLevel.HEADING_2, AlignmentType.LEFT));
    if (section.body) children.push(...paragraphs(section.body));
    if (section.timelineRows?.length) children.push(timelineTable(section.timelineRows));
  }

  children.push(pageBreak(), heading("DAFTAR PUSTAKA", HeadingLevel.HEADING_1, AlignmentType.CENTER));
  for (const reference of report.references) children.push(referenceParagraph(reference));

  return children;
}

function buildGenericDocument(report: AssignmentReport): Array<Paragraph | Table> {
  const children: Array<Paragraph | Table> = [
    center(report.outputType.toUpperCase(), 30, true, 320),
    center(report.title.toUpperCase(), 30, true, 520),
    center(`Mata Kuliah: ${report.course}`, BODY_SIZE, false, 260),
    center(String(new Date().getFullYear()), BODY_SIZE, true, 0),
    pageBreak(),
    heading("RINGKASAN", HeadingLevel.HEADING_1, AlignmentType.CENTER),
    ...paragraphs(report.executiveSummary),
    pageBreak(),
  ];

  for (const section of report.sections) {
    children.push(heading(section.title.toUpperCase(), HeadingLevel.HEADING_1, AlignmentType.LEFT));
    children.push(...paragraphs(section.body));
  }

  if (report.references.length > 0) {
    children.push(pageBreak(), heading("DAFTAR PUSTAKA", HeadingLevel.HEADING_1, AlignmentType.CENTER));
    for (const reference of report.references) {
      children.push(new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: 360, after: 120 },
        indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.5) },
        children: [new TextRun({ text: reference, font: FONT, size: BODY_SIZE })],
      }));
    }
  }

  if (report.appendices.length > 0) {
    children.push(pageBreak(), heading("LAMPIRAN", HeadingLevel.HEADING_1, AlignmentType.CENTER));
    for (const appendix of report.appendices) children.push(...paragraphs(appendix));
  }

  return children;
}

function paragraphs(text: string): Paragraph[] {
  return text.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean).map((part) => new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 360, after: 140 },
    indent: { firstLine: convertInchesToTwip(0.5) },
    children: [new TextRun({ text: part, font: FONT, size: BODY_SIZE })],
  }));
}

function heading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel], alignment: (typeof AlignmentType)[keyof typeof AlignmentType]): Paragraph {
  return new Paragraph({
    heading: level,
    alignment,
    spacing: { before: 220, after: 140 },
    children: [new TextRun({ text, font: FONT, size: 28, bold: true })],
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

function buildKataPengantar(report: AssignmentReport): string {
  return [
    `Puji syukur penulis panjatkan ke hadirat Tuhan Yang Maha Esa karena proposal berjudul "${report.title}" dapat disusun sebagai bagian dari tugas mata kuliah ${report.course}. Proposal ini disusun untuk memberikan gambaran awal mengenai rencana mini project, strategi pemasaran, serta target pelaksanaan yang akan dilakukan secara bertahap.`,
    "Penyusunan proposal ini diharapkan dapat menjadi pedoman kerja kelompok dalam mengembangkan ide usaha, mengelola media sosial, menyusun konten, dan mengevaluasi respons audiens. Penulis menyadari proposal ini masih dapat disempurnakan setelah memperoleh data aktual selama pelaksanaan mini project.",
  ].join("\n\n");
}

function buildDaftarIsi(sections: AssignmentAcademicSection[]): Paragraph[] {
  const rows = ["KATA PENGANTAR .......................................................... i", "DAFTAR ISI ............................................................... ii"];
  for (const section of sections) rows.push(`${section.heading} ........................................ [hal]`);
  rows.push("DAFTAR PUSTAKA ..................................................... [hal]");
  return rows.map((row) => new Paragraph({
    spacing: { line: 360, after: 80 },
    indent: /^\d+\./.test(row) || /^Kesimpulan|^Saran/.test(row) ? { left: convertInchesToTwip(0.35) } : undefined,
    children: [new TextRun({ text: row, font: FONT, size: BODY_SIZE, bold: /^BAB|^DAFTAR|^KATA/.test(row) })],
  }));
}

function timelineTable(rows: AssignmentTimelineRow[]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [tableCell("Minggu", true), tableCell("Kegiatan", true), tableCell("Target", true)] }),
      ...rows.map((row) => new TableRow({ children: [tableCell(row.week, false), tableCell(row.activity, false), tableCell(row.target, false)] })),
    ],
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
    children: [new Paragraph({ children: [new TextRun({ text, font: FONT, size: BODY_SIZE, bold })] })],
  });
}

function referenceParagraph(reference: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 360, after: 120 },
    indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.5) },
    children: [new TextRun({ text: reference, font: FONT, size: BODY_SIZE })],
  });
}
