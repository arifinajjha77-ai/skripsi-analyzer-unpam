/**
 * Export BAB IV narasi + Daftar Pustaka as a single DOCX file,
 * formatted according to the active campus template (UNPAM by default).
 */

import type { Reference } from "@/lib/reference-engine";
import { dedupeRefs } from "@/lib/reference-engine";
import { getActiveTemplate, marginTwips, lineSpacingDocx } from "@/lib/templates";

export async function generateBab4Docx(
  narasiText: string,
  refsUsed: Reference[]
): Promise<Blob> {
  const {
    Document, Paragraph, TextRun, HeadingLevel, AlignmentType,
    LineRuleType, LevelFormat, convertInchesToTwip,
  } = await import("docx");

  const template = getActiveTemplate();
  const margins  = marginTwips(template);
  const lineVal  = lineSpacingDocx(template);

  /** Helper: normal paragraph with optional indent */
  function para(
    text: string,
    opts: { bold?: boolean; indent?: boolean; align?: "left" | "center" | "right" | "both" } = {}
  ): InstanceType<typeof Paragraph> {
    return new Paragraph({
      children: [new TextRun({
        text,
        bold: opts.bold ?? false,
        font: template.font,
        size: template.fontSize * 2, // half-points
      })],
      alignment:
        opts.align === "center" ? AlignmentType.CENTER
        : opts.align === "right" ? AlignmentType.RIGHT
        : opts.align === "both"  ? AlignmentType.JUSTIFIED
        : AlignmentType.JUSTIFIED,
      spacing: { line: lineVal, lineRule: LineRuleType.AUTO, after: 0 },
      indent: opts.indent ? { firstLine: convertInchesToTwip(0.5) } : undefined,
    });
  }

  function heading1(text: string): InstanceType<typeof Paragraph> {
    return new Paragraph({
      text,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: {
        before: template.spacingBeforeHeadingPt * 20,
        after:  template.spacingAfterHeadingPt  * 20,
        line: lineVal,
        lineRule: LineRuleType.AUTO,
      },
      children: [new TextRun({ text, bold: true, font: template.font, size: template.fontSize * 2 })],
    });
  }

  function heading2(text: string): InstanceType<typeof Paragraph> {
    return new Paragraph({
      text,
      heading: HeadingLevel.HEADING_2,
      spacing: {
        before: template.spacingBeforeHeadingPt * 20,
        after:  template.spacingAfterHeadingPt  * 20,
        line: lineVal,
        lineRule: LineRuleType.AUTO,
      },
      children: [new TextRun({ text, bold: true, font: template.font, size: template.fontSize * 2 })],
    });
  }

  function spacer(): InstanceType<typeof Paragraph> {
    return new Paragraph({ text: "", spacing: { after: 200 } });
  }

  // Parse the plain-text narasi into paragraphs
  const narasiParas = narasiText.split("\n").flatMap((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed === "---") return [spacer()];
    if (trimmed.startsWith("# ")) return [heading1(trimmed.replace(/^# /, ""))];
    if (trimmed.startsWith("## ")) return [heading2(trimmed.replace(/^## /, ""))];
    if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      return [para(trimmed.replace(/\*\*/g, ""), { bold: true })];
    }
    // Strip remaining bold markers for plain DOCX
    return [para(trimmed.replace(/\*\*/g, ""), { indent: true, align: "both" })];
  });

  // Daftar pustaka section
  const uniqueRefs = dedupeRefs(refsUsed).sort((a, b) => {
    const la = a.penulis[0].split(" ").pop() ?? "";
    const lb = b.penulis[0].split(" ").pop() ?? "";
    return la.localeCompare(lb, "id");
  });

  const daftarPustakaParas = [
    spacer(),
    heading1("DAFTAR PUSTAKA"),
    spacer(),
    ...uniqueRefs.map((ref) =>
      new Paragraph({
        children: [new TextRun({ text: ref.apaFull, font: template.font, size: template.fontSize * 2 })],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: lineVal, lineRule: LineRuleType.AUTO, after: 240 },
        indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.5) },
      })
    ),
  ];

  const doc = new Document({
    numbering: {
      config: [{
        reference: "decimal",
        levels: [{
          level: 0,
          format: LevelFormat.DECIMAL,
          text: "%1.",
          alignment: AlignmentType.LEFT,
        }],
      }],
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: margins.top, right: margins.right,
            bottom: margins.bottom, left: margins.left,
          },
        },
      },
      children: [
        ...narasiParas,
        ...daftarPustakaParas,
      ],
    }],
  });

  const { Packer } = await import("docx");
  return Packer.toBlob(doc);
}
