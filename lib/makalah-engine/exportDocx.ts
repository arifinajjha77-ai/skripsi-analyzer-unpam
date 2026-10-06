import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { academicRuns, createFebDocument, febSection, FEB_INDENT } from "@/lib/docx/feb2021";
import { academicTitle, febBodyLine, inferFebProfile } from "@/lib/templates/feb2021";
import {
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  ImageRun,
  Packer,
  PageBreak,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TableOfContents,
  TextRun,
  WidthType,
} from "docx";
import type { MakalahDocument, MakalahEngineInput } from "./types";

const FONT = "Times New Roman";
const SIZE = 24;

export async function exportMakalahEngineDocx(document: MakalahDocument): Promise<Buffer> {
  const profile = inferFebProfile(`${document.input.judul} ${document.input.tema}`);
  const line = febBodyLine(profile);
  const sections = [
    febSection(buildCover(document.input), "cover"),
    febSection([
      heading("KATA PENGANTAR", HeadingLevel.HEADING_1, AlignmentType.CENTER),
      ...paragraphs(document.kataPengantar, 360), pageBreak(),
      heading("DAFTAR ISI", HeadingLevel.HEADING_1, AlignmentType.CENTER),
      new TableOfContents("Daftar Isi", { hyperlink: true, headingStyleRange: "1-3" }),
    ], "front", 1),
  ];
  for (const [index, chapter] of document.chapters.entries()) {
    const children: Paragraph[] = [heading(`${chapter.number} ${chapter.title}`, HeadingLevel.HEADING_1, AlignmentType.CENTER)];
    for (const subsection of chapter.subsections) {
      children.push(heading(`${subsection.id} ${subsection.title}`, HeadingLevel.HEADING_2, AlignmentType.LEFT), ...paragraphs(subsection.content, line));
    }
    sections.push(febSection(children, "chapter", index === 0 ? 1 : undefined));
  }
  const back = [heading("DAFTAR PUSTAKA", HeadingLevel.HEADING_1, AlignmentType.CENTER),
    ...[...document.daftarPustaka].sort((a, b) => a.localeCompare(b, "id")).map(bibliography)];
  if (document.lampiran.length) back.push(pageBreak(), heading("LAMPIRAN", HeadingLevel.HEADING_1, AlignmentType.CENTER), ...document.lampiran.map((text) => body(text, line)));
  sections.push(febSection(back, "back"));
  return Packer.toBuffer(createFebDocument({ sections }, profile));
}

function buildCover(input: MakalahEngineInput): Array<Paragraph | Table> {
  const profile = inferFebProfile(`${input.judul} ${input.tema}`);
  if (profile === "skripsi" || profile === "proposal-skripsi") {
    const logo = join(process.cwd(), "public", "logo-unpam.png");
    return [
      center(input.judul.toUpperCase(), 28, true, 480),
      center(profile === "skripsi" ? "SKRIPSI" : "PROPOSAL SKRIPSI", 28, true, 480),
      ...(existsSync(logo) ? [new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: "png", data: readFileSync(logo), transformation: { width: 189, height: 189 } })] })] : []),
      center("Ditulis Oleh", 24, false, 0), center(input.namaMahasiswa, 24, false, 0), center(`NIM. ${input.nim}`, 24, false, 480),
      center(`PROGRAM STUDI ${input.programStudi}`.replace(/PROGRAM STUDI PROGRAM STUDI/i, "PROGRAM STUDI").toUpperCase(), 28, true, 0),
      center("FAKULTAS EKONOMI DAN BISNIS", 28, true, 0), center("UNIVERSITAS PAMULANG", 28, true, 0),
      center("TANGERANG SELATAN", 28, true, 0), center(String(new Date().getFullYear()), 28, true, 0),
    ];
  }

  const isProposal = /proposal|mini project/i.test([
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
    center(displayValue(input.fakultas, "FAKULTAS EKONOMI DAN BISNIS").toUpperCase(), SIZE, true, 80),
    center(displayValue(input.programStudi, "PROGRAM STUDI MANAJEMEN").toUpperCase(), SIZE, true, 80),
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
    children: [new Paragraph({ spacing: { before: 0, after: 0, line: 240 }, children: [new TextRun({ text, font: FONT, size: SIZE, bold })] })],
  });
}

function paragraphs(text: string, line = 360): Paragraph[] {
  return text.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean).map((part) => body(part, line));
}

function body(text: string, line = 360): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 0, after: 0, line },
    indent: { firstLine: FEB_INDENT },
    children: academicRuns(text),
  });
}

function bibliography(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 0, after: 0, line: 240 },
    indent: { left: FEB_INDENT, hanging: FEB_INDENT },
    children: academicRuns(text),
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
    spacing: { before: 0, after: 0, line: 360 },
    keepNext: true,
    children: (level === HeadingLevel.HEADING_1 ? text.toUpperCase().replace(/^(BAB\s+[IVXLC\d]+)\s+/, "$1\n") : academicTitle(text)).split("\n").map((part, index) => new TextRun({ text: part, break: index > 0 ? 1 : undefined, font: FONT, size: SIZE, bold: true })),
  });
}

function center(text: string, size: number, bold: boolean, after: number): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after, line: 360 },
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
