import { academicRuns, createFebDocument, febSection, FEB_INDENT } from "@/lib/docx/feb2021";
import { academicTitle, febBodyLine, inferFebProfile, type FebWritingProfile } from "@/lib/templates/feb2021";
import type { ISectionOptions } from "docx";
import {
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  ImageRun,
  Packer,
  SimpleField,
  PageBreak,
  Paragraph,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  WidthType,
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

  const profile = report.writingProfile || inferFebProfile(`${report.outputType} ${report.title}`);
  const doc = createFebDocument({
    sections: buildDocumentSections(report, profile),
    styles: { default: {
      heading1: { run: { font: FONT, size: BODY_SIZE, bold: true, color: "000000" }, paragraph: { alignment: AlignmentType.CENTER } },
      heading2: { run: { font: FONT, size: BODY_SIZE, bold: true, color: "000000" } },
    } },
  }, profile);
  return Packer.toBuffer(doc);
}

function buildDocumentSections(report: AssignmentReport, profile: FebWritingProfile): ISectionOptions[] {
  const line = febBodyLine(profile);
  const sections = [febSection(buildProposalCover(report, profile), "cover")];
  const front: Array<Paragraph | TableOfContents> = [
    heading("KATA PENGANTAR", HeadingLevel.HEADING_1, AlignmentType.CENTER),
    ...paragraphs(buildKataPengantar(report), 360), pageBreak(), ...buildWordToc(),
  ];
  // List tables/figures with Word fields; omit empty lists for documents without them.
  if (report.academicSections?.some((section) => section.costRows?.length || section.timelineRows?.length)) {
    front.push(pageBreak(), heading("DAFTAR TABEL", HeadingLevel.HEADING_1, AlignmentType.CENTER), new TableOfContents("Daftar Tabel", { captionLabel: "Tabel", hyperlink: true }));
  }
  if (report.productImage?.dataUrl) {
    front.push(pageBreak(), heading("DAFTAR GAMBAR", HeadingLevel.HEADING_1, AlignmentType.CENTER), new TableOfContents("Daftar Gambar", { captionLabel: "Gambar", hyperlink: true }));
  }
  sections.push(febSection(front, "front", 1));
  let chapter: Array<Paragraph | Table> = [];
  let first = true;
  let chapterNumber = 0;
  let tableNumber = 0;
  const flush = () => {
    if (!chapter.length) return;
    sections.push(febSection(chapter, "chapter", first ? 1 : undefined));
    first = false;
    chapter = [];
  };
  const entries = report.academicSections?.length
    ? report.academicSections.map((section) => ({ ...section, title: section.heading }))
    : report.sections.map((section) => ({ ...section, level: /^BAB\s+[IVXLC\d]+/i.test(section.title) ? "chapter" : "subheading" }));
  for (const entry of entries) {
    if (/^(DAFTAR PUSTAKA|LAMPIRAN)/i.test(entry.title)) continue;
    if (entry.level === "chapter") {
      flush(); chapterNumber++; tableNumber = 0;
      chapter.push(heading(entry.title, HeadingLevel.HEADING_1, AlignmentType.CENTER));
    } else {
      chapter.push(heading(entry.title, HeadingLevel.HEADING_2, AlignmentType.LEFT));
    }
    if (entry.body) chapter.push(...paragraphs(entry.body, line));
    if (entry.title === "2.3 Deskripsi Produk") chapter.push(...productImageSection(report));
    if ("timelineRows" in entry && entry.timelineRows?.length) {
      chapter.push(caption(`Tabel ${chapterNumber || 1}.${++tableNumber} Rencana Timeline`, "Tabel"), timelineTable(entry.timelineRows), source("Sumber: Rencana Kegiatan Penulis"));
    }
    if ("costRows" in entry && entry.costRows?.length) {
      chapter.push(caption(`Tabel ${chapterNumber || 1}.${++tableNumber} Estimasi Biaya`, "Tabel"), costTable(entry.costRows), source("Sumber: Estimasi Perencanaan Penulis"));
    }
  }
  flush();
  const back: Array<Paragraph> = [];
  if (report.references.length) {
    back.push(heading("DAFTAR PUSTAKA", HeadingLevel.HEADING_1, AlignmentType.CENTER));
    back.push(...[...report.references].sort((a, b) => a.localeCompare(b, "id")).map(referenceParagraph));
  }
  if (report.appendices.length) {
    if (back.length) back.push(pageBreak());
    back.push(heading("LAMPIRAN", HeadingLevel.HEADING_1, AlignmentType.CENTER), ...report.appendices.flatMap((item) => paragraphs(item, line)));
  }
  if (back.length) sections.push(febSection(back, "back"));
  return sections;
}

function buildProposalCover(report: AssignmentReport, profile: FebWritingProfile): Paragraph[] {
  if (profile === "skripsi" || profile === "proposal-skripsi") {
    const student = report.studentMeta;
    return [
      center(report.title.replace(/^proposal skripsi\s*:\s*|^skripsi\s*:\s*/i, "").toUpperCase(), 28, true, 480),
      center(profile === "proposal-skripsi" ? "PROPOSAL SKRIPSI" : "SKRIPSI", 28, true, 480),
      ...logoParagraphs(189),
      center("Ditulis Oleh", 24, false, 0),
      center(student?.name || "[Nama Mahasiswa]", 24, false, 0),
      center(`NIM. ${student?.nim || "[NIM]"}`, 24, false, 480),
      center(`PROGRAM STUDI ${student?.program || "MANAJEMEN"}`.toUpperCase(), 28, true, 0),
      center("FAKULTAS EKONOMI DAN BISNIS", 28, true, 0),
      center("UNIVERSITAS PAMULANG", 28, true, 0),
      center("TANGERANG SELATAN", 28, true, 0),
      center(student?.year || String(new Date().getFullYear()), 28, true, 0),
    ];
  }
  const meta = report.proposalMeta;
  const university = meta?.university || "Universitas Pamulang";
  const title = meta?.title || report.outputType.toUpperCase();
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
    center(studyProgram.toUpperCase(), BODY_SIZE, true, 0),
    center("FAKULTAS EKONOMI DAN BISNIS", BODY_SIZE, true, 0),
    center(university.toUpperCase(), BODY_SIZE, true, 0),
    center("TANGERANG SELATAN", BODY_SIZE, true, 0),
    center(year, BODY_SIZE, true, 0),
  ];
}

function logoParagraphs(size = 92): Paragraph[] {
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
            transformation: { width: size, height: size },
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
    caption(`Gambar 2.1 ${academicTitle(image.name)}`, "Gambar"),
    source("Sumber: Dokumentasi Penulis"),
  ];
}

function paragraphs(text: string, line = 360): Paragraph[] {
  return text.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean).map((part) => new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 0, after: 0, line },
    indent: { firstLine: FEB_INDENT },
    children: academicRuns(part),
  }));
}

function heading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel], alignment: (typeof AlignmentType)[keyof typeof AlignmentType]): Paragraph {
  return new Paragraph({
    heading: level,
    alignment,
    spacing: { before: 0, after: 0, line: 360 },
    keepNext: true,
    children: (level === HeadingLevel.HEADING_1 ? text.toUpperCase().replace(/^(BAB\s+[IVXLC\d]+)\s+/, "$1\n") : academicTitle(text)).split("\n").map((part, index) => new TextRun({ text: part, break: index > 0 ? 1 : undefined, font: FONT, size: BODY_SIZE, bold: true })),
  });
}

function center(text: string, size: number, bold: boolean, after: number): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after, line: 360 },
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
  if (!report.academicSections?.length) return `Puji syukur penulis panjatkan ke hadirat Tuhan Yang Maha Esa sehingga dokumen berjudul “${report.title}” dapat disusun. Dokumen ini disusun untuk mendukung kegiatan akademik penulis.\n\nPenulis menyadari bahwa dokumen ini masih memerlukan pemeriksaan dan penyempurnaan. Kritik dan saran diharapkan untuk meningkatkan kualitas penulisan.`;
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
      children: [new TextRun({ text: "DAFTAR ISI", font: FONT, size: BODY_SIZE, bold: true })],
    }),
    new TableOfContents("Daftar Isi", {
      hyperlink: true,
      headingStyleRange: "1-2",
    }),
  ];
}

function timelineTable(rows: AssignmentTimelineRow[]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: [tableCell("Minggu", true), tableCell("Kegiatan", true), tableCell("Target", true)] }),
      ...rows.map((row) => new TableRow({ children: [tableCell(row.week, false), tableCell(row.activity, false), tableCell(row.target, false)] })),
    ],
  });
}

function costTable(rows: AssignmentCostRow[]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: [tableCell("Uraian Biaya", true), tableCell("Jumlah", true), tableCell("Harga Satuan", true), tableCell("Total", true)] }),
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
    children: [new Paragraph({ spacing: { before: 0, after: 0, line: 240 }, alignment: /^[-+]?\d|^Rp\s/.test(text) ? AlignmentType.RIGHT : AlignmentType.LEFT, children: [new TextRun({ text, font: FONT, size: BODY_SIZE, bold })] })],
  });
}

function referenceParagraph(reference: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 0, after: 0, line: 240 },
    indent: { left: FEB_INDENT, hanging: FEB_INDENT },
    children: [new TextRun({ text: reference, font: FONT, size: BODY_SIZE })],
  });
}

function caption(text: string, label: "Tabel" | "Gambar"): Paragraph {
  // A named sequence is recognized by Word's list-of-tables/figures fields.
  const match = text.match(/^(Tabel|Gambar) (\d+)\.(\d+) (.*)$/);
  return new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0, line: 240 }, keepNext: label === "Tabel",
    children: [new TextRun({ text: match ? `${label} ${match[2]}.` : text, font: FONT, size: BODY_SIZE, bold: label === "Tabel" }),
      ...(match ? [new SimpleField(`SEQ ${label} \\* ARABIC${match[3] === "1" ? " \\r 1" : ""}`, match[3]), new TextRun({ text: ` ${match[4]}`, font: FONT, size: BODY_SIZE, bold: label === "Tabel" })] : [])],
  });
}

function source(text: string): Paragraph {
  return new Paragraph({ spacing: { before: 0, after: 0, line: 240 }, children: [new TextRun({ text, font: FONT, size: 20 })] });
}
