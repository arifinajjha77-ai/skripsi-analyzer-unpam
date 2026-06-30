import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  PageBreak,
  Paragraph,
  TextRun,
  convertInchesToTwip,
} from "docx";
import type { AssignmentReport } from "./types";

const FONT = "Times New Roman";
const BODY_SIZE = 24;

export async function exportAssignmentDocx(report: AssignmentReport): Promise<Buffer> {
  const children: Paragraph[] = [
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
