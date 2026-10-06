import {
  AlignmentType, Document, Footer, Header, NumberFormat, PageNumber, Paragraph,
  SectionType, TextRun, type IPropertiesOptions, type ISectionOptions,
} from "docx";
import { FEB_2021, febBodyLine, type FebWritingProfile } from "@/lib/templates/feb2021";

export const cmTwips = (cm: number) => Math.round(cm * 1440 / 2.54);
export const FEB_INDENT = cmTwips(FEB_2021.indentCm);

/** Preserve explicitly marked italics and common foreign terms used by the writers. */
export function academicRuns(text: string, size = 24): TextRun[] {
  const foreign = /\*([^*]+)\*|\b(marketing mix|social media marketing|research gap|empirical gap|grand theory|brand awareness|behind the scenes|product showcase|engagement|awareness|targeting|positioning|strength|weakness|opportunity|threat)\b/gi;
  const runs: TextRun[] = [];
  let start = 0;
  for (const match of text.matchAll(foreign)) {
    if (match.index > start) runs.push(new TextRun({ text: text.slice(start, match.index), font: FEB_2021.font, size }));
    runs.push(new TextRun({ text: match[1] || match[2], italics: true, font: FEB_2021.font, size }));
    start = match.index + match[0].length;
  }
  if (start < text.length) runs.push(new TextRun({ text: text.slice(start), font: FEB_2021.font, size }));
  return runs;
}
export const FEB_PAGE = {
  size: { width: cmTwips(21), height: cmTwips(29.7) },
  margin: { top: cmTwips(4), left: cmTwips(4), right: cmTwips(3), bottom: cmTwips(3), header: cmTwips(2), footer: cmTwips(2) },
};

function pageNumber(align: "center" | "right"): Paragraph {
  return new Paragraph({
    alignment: align === "right" ? AlignmentType.RIGHT : AlignmentType.CENTER,
    spacing: { before: 0, after: 0, line: 240 },
    children: [new TextRun({ children: [PageNumber.CURRENT], font: FEB_2021.font, size: 24 })],
  });
}

export function febSection(children: ISectionOptions["children"], region: "cover" | "front" | "chapter" | "back", restart?: number): ISectionOptions {
  const blank = () => new Paragraph({ children: [] });
  const chapter = region === "chapter";
  const cover = region === "cover";
  return {
    properties: {
      type: SectionType.NEXT_PAGE,
      titlePage: chapter,
      page: {
        ...FEB_PAGE,
        pageNumbers: { formatType: region === "front" ? NumberFormat.LOWER_ROMAN : NumberFormat.DECIMAL, ...(restart !== undefined ? { start: restart } : {}) },
      },
    },
    headers: {
      first: new Header({ children: [blank()] }),
      default: new Header({ children: [chapter ? pageNumber("right") : blank()] }),
    },
    footers: {
      first: new Footer({ children: [cover ? blank() : pageNumber("center")] }),
      default: new Footer({ children: [chapter || cover ? blank() : pageNumber("center")] }),
    },
    children,
  };
}

/** Enforce shared A4 geometry/defaults without overriding a paragraph's deliberate
 * single-spaced table, reference, abstract or 1.5-spaced front matter. */
export function createFebDocument(options: IPropertiesOptions, profile: FebWritingProfile = "skripsi"): Document {
  const base = options.styles?.default;
  return new Document({
    ...options,
    creator: "SmartCampus",
    description: FEB_2021.title,
    features: { ...options.features, updateFields: true },
    styles: {
      ...options.styles,
      default: {
        ...base,
        heading1: { ...base?.heading1, run: { ...base?.heading1?.run, font: FEB_2021.font, size: 24, color: "000000", bold: true }, paragraph: { ...base?.heading1?.paragraph, alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0, line: febBodyLine(profile) } } },
        heading2: { ...base?.heading2, run: { ...base?.heading2?.run, font: FEB_2021.font, size: 24, color: "000000", bold: true }, paragraph: { ...base?.heading2?.paragraph, spacing: { before: 0, after: 0, line: febBodyLine(profile) } } },
        heading3: { ...base?.heading3, run: { ...base?.heading3?.run, font: FEB_2021.font, size: 24, color: "000000", bold: true }, paragraph: { ...base?.heading3?.paragraph, spacing: { before: 0, after: 0, line: febBodyLine(profile) } } },
        document: {
          ...base?.document,
          run: { ...base?.document?.run, font: FEB_2021.font, size: 24, color: "000000" },
          paragraph: { ...base?.document?.paragraph, spacing: { before: 0, after: 0, line: febBodyLine(profile), lineRule: "auto" } },
        },
      },
    },
    sections: options.sections.map((section) => ({
      ...section,
      properties: { ...section.properties, page: { ...section.properties?.page, ...FEB_PAGE, pageNumbers: section.properties?.page?.pageNumbers } },
    })),
  });
}
