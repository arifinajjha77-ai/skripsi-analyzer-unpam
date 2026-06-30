import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  ImageRun,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  WidthType,
  convertInchesToTwip,
} from "docx";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { reviewAcademicReport } from "./academicReview";
import type { AssignmentCostRow, AssignmentReport, AssignmentTimelineRow } from "./types";

const FONT = "Times New Roman";
const BODY_SIZE = 24;

export async function exportAssignmentDocx(report: AssignmentReport): Promise<Buffer> {
  if (report.academicSections?.length) {
    const review = reviewAcademicReport(report);
    if (!review.passed) {
      throw new Error(`Quality review gagal: ${review.warnings.join("; ")}`);
    }
  }

  const children: Array<Paragraph | Table | TableOfContents> = report.academicSections?.length
    ? buildAcademicDocument(report)
    : buildGenericDocument(report);

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: FONT, size: BODY_SIZE }, paragraph: { spacing: { line: 360 } } },
        heading1: {
          run: { font: FONT, size: 28, bold: true, color: "000000" },
          paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 240, after: 180 } },
        },
        heading2: {
          run: { font: FONT, size: BODY_SIZE, bold: true, color: "000000" },
          paragraph: { alignment: AlignmentType.LEFT, spacing: { before: 180, after: 120 } },
        },
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
    features: {
      updateFields: true,
    },
    sections: [
      {
        footers: {
          first: blankFooter(),
          default: pageNumberFooter(),
        },
        properties: {
          titlePage: true,
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.18),
            },
            pageNumbers: {
              start: 0,
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

function buildAcademicDocument(report: AssignmentReport): Array<Paragraph | Table | TableOfContents> {
  const children: Array<Paragraph | Table | TableOfContents> = [
    ...buildProposalCover(report),
    pageBreak(),
    heading("KATA PENGANTAR", HeadingLevel.HEADING_1, AlignmentType.CENTER),
    ...paragraphs(buildKataPengantar(report)),
    pageBreak(),
    ...buildWordToc(),
    pageBreak(),
  ];

  for (const section of report.academicSections || []) {
    if (section.level === "chapter") {
      children.push(heading(section.heading, HeadingLevel.HEADING_1, AlignmentType.CENTER));
      continue;
    }
    children.push(heading(section.heading, HeadingLevel.HEADING_2, AlignmentType.LEFT));
    if (section.body) children.push(...paragraphs(section.body));
    if (section.heading === "2.3 Deskripsi Produk") children.push(...productImageSection(report));
    if (section.timelineRows?.length) children.push(timelineTable(section.timelineRows));
    if (section.costRows?.length) children.push(costTable(section.costRows));
  }

  children.push(pageBreak(), heading("DAFTAR PUSTAKA", HeadingLevel.HEADING_1, AlignmentType.CENTER));
  for (const reference of report.references) children.push(referenceParagraph(reference));

  return children;
}

function buildProposalCover(report: AssignmentReport): Paragraph[] {
  const meta = report.proposalMeta;
  const university = meta?.university || "Universitas Pamulang";
  const title = meta?.title || "PROPOSAL MINI PROJECT";
  const brandOrProduct = meta?.brandOrProduct || stripWeekOne(report.title);
  const groupName = meta?.groupName || "Kelompok Mini Project";
  const members = meta?.members || "Anggota kelompok";
  const course = meta?.course || report.course;
  const lecturer = meta?.lecturer || "Dosen pengampu";
  const studyProgram = meta?.studyProgram || "Program Studi Manajemen";
  const year = meta?.year || new Date().getFullYear().toString();
  return [
    ...logoParagraphs(),
    center(university.toUpperCase(), 28, true, 260),
    center(title.toUpperCase(), 32, true, 180),
    center("Nama Brand / Produk", BODY_SIZE, true, 60),
    center(brandOrProduct.toUpperCase(), 28, true, 420),
    center("Nama Kelompok", BODY_SIZE, true, 60),
    center(groupName, BODY_SIZE, true, 140),
    center("Nama Anggota", BODY_SIZE, true, 60),
    ...members.split(/\n|,/).map((member) => center(member.trim(), BODY_SIZE, false, 60)).filter((paragraph) => paragraph),
    center(`Mata Kuliah: ${course}`, BODY_SIZE, false, 140),
    center(`Dosen Pengampu: ${lecturer}`, BODY_SIZE, false, 320),
    center(studyProgram.toUpperCase(), BODY_SIZE, true, 80),
    center(year, BODY_SIZE, true, 0),
  ];
}

function logoParagraphs(): Paragraph[] {
  const logoPath = join(process.cwd(), "public", "logo-unpam.png");
  if (existsSync(logoPath)) {
    return [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 180 },
        children: [
          new ImageRun({
            type: "png",
            data: readFileSync(logoPath),
            transformation: { width: 92, height: 92 },
          }),
        ],
      }),
    ];
  }
  return [center("[Logo Universitas Pamulang]", BODY_SIZE, false, 180)];
}

function productImageSection(report: AssignmentReport): Paragraph[] {
  const image = report.productImage;
  if (!image?.dataUrl) return [];
  const parsed = parseDataUrlImage(image.dataUrl);
  if (!parsed) return [];
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 80 },
      children: [
        new ImageRun({
          type: parsed.type,
          data: parsed.data,
          transformation: { width: 360, height: 240 },
        }),
      ],
    }),
    center(`Gambar produk: ${image.name}`, 20, false, 120),
  ];
}

function buildGenericDocument(report: AssignmentReport): Array<Paragraph | Table | TableOfContents> {
  const children: Array<Paragraph | Table | TableOfContents> = [
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

function stripWeekOne(value: string): string {
  return value.replace(/week\s*1/gi, "").replace(/\s{2,}/g, " ").replace(/\s+:/g, ":").trim();
}

function parseDataUrlImage(dataUrl: string): { type: "png" | "jpg" | "gif" | "bmp"; data: Buffer } | null {
  const match = dataUrl.match(/^data:image\/(png|jpe?g|gif|bmp);base64,(.+)$/i);
  if (!match) return null;
  const rawType = match[1].toLowerCase();
  const type = rawType === "jpeg" ? "jpg" : rawType;
  if (type !== "png" && type !== "jpg" && type !== "gif" && type !== "bmp") return null;
  return { type, data: Buffer.from(match[2], "base64") };
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

function buildWordToc(): Array<Paragraph | TableOfContents> {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 360 },
      children: [new TextRun({ text: "DAFTAR ISI", font: FONT, size: 32, bold: true })],
    }),
    new TableOfContents("Daftar Isi", {
      hyperlink: true,
      headingStyleRange: "1-2",
    }),
  ];
}

function blankFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        children: [],
      }),
    ],
  });
}

function pageNumberFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            children: [PageNumber.CURRENT],
            font: FONT,
            size: BODY_SIZE,
          }),
        ],
      }),
    ],
  });
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

function costTable(rows: AssignmentCostRow[]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [tableCell("Uraian Biaya", true), tableCell("Jumlah", true), tableCell("Harga Satuan", true), tableCell("Total", true)] }),
      ...rows.map((row) => new TableRow({ children: [tableCell(row.item, false), tableCell(row.quantity, false), tableCell(row.unitCost, false), tableCell(row.total, false)] })),
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
