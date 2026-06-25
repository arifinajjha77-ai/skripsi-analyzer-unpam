import type { InsightReport, StatusLevel } from "./analyzer";
import { getActiveTemplate, marginTwips, lineSpacingDocx } from "@/lib/templates";

const STATUS_LABEL: Record<StatusLevel, string> = {
  sangat_baik:     "Sangat Baik",
  baik:            "Baik",
  cukup:           "Cukup",
  perlu_perbaikan: "Perlu Perbaikan",
  belum_layak:     "Belum Layak",
};

export async function generateInsightDocx(
  insight: InsightReport,
  skor: number,
  statusLabel: StatusLevel,
  namaFile?: string
): Promise<Blob> {
  const {
    Document, Paragraph, TextRun, HeadingLevel, AlignmentType,
    LineRuleType, BorderStyle, convertInchesToTwip,
  } = await import("docx");
  const { Packer } = await import("docx");

  const template  = getActiveTemplate();
  const margins   = marginTwips(template);
  const lineVal   = lineSpacingDocx(template);
  const halfPt    = template.fontSize * 2;

  // ── paragraph factories ─────────────────────────────────────────────────

  function normal(text: string, indent = true): InstanceType<typeof Paragraph> {
    return new Paragraph({
      children: [new TextRun({ text, font: template.font, size: halfPt })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { line: lineVal, lineRule: LineRuleType.AUTO, after: 120 },
      indent: indent ? { firstLine: convertInchesToTwip(0.5) } : undefined,
    });
  }

  function bullet(text: string): InstanceType<typeof Paragraph> {
    return new Paragraph({
      children: [new TextRun({ text: `• ${text}`, font: template.font, size: halfPt })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { line: lineVal, lineRule: LineRuleType.AUTO, after: 80 },
      indent: { left: convertInchesToTwip(0.5) },
    });
  }

  function numbered(text: string, num: number): InstanceType<typeof Paragraph> {
    return new Paragraph({
      children: [new TextRun({ text: `${num}. ${text}`, font: template.font, size: halfPt })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { line: lineVal, lineRule: LineRuleType.AUTO, after: 80 },
      indent: { left: convertInchesToTwip(0.5) },
    });
  }

  function h1(text: string): InstanceType<typeof Paragraph> {
    return new Paragraph({
      children: [new TextRun({ text, bold: true, font: template.font, size: halfPt + 4, allCaps: true })],
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: {
        before: template.spacingBeforeHeadingPt * 20,
        after: template.spacingAfterHeadingPt * 20,
        line: lineVal, lineRule: LineRuleType.AUTO,
      },
    });
  }

  function h2(text: string): InstanceType<typeof Paragraph> {
    return new Paragraph({
      children: [new TextRun({ text, bold: true, font: template.font, size: halfPt + 2 })],
      heading: HeadingLevel.HEADING_2,
      spacing: {
        before: template.spacingBeforeHeadingPt * 20,
        after: template.spacingAfterHeadingPt * 20,
        line: lineVal, lineRule: LineRuleType.AUTO,
      },
    });
  }

  function spacer(): InstanceType<typeof Paragraph> {
    return new Paragraph({ text: "", spacing: { after: 160 } });
  }

  function divider(): InstanceType<typeof Paragraph> {
    return new Paragraph({
      text: "",
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC", space: 1 } },
      spacing: { after: 200 },
    });
  }

  // ── Build content ───────────────────────────────────────────────────────

  const children: InstanceType<typeof Paragraph>[] = [];

  // Cover
  children.push(h1("LAPORAN KELAYAKAN DATA PENELITIAN"));
  children.push(normal(`Skor Kelayakan: ${skor}/100 — ${STATUS_LABEL[statusLabel]}`, false));
  children.push(normal(`Template: ${template.nama} · ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`, false));
  children.push(divider());

  // 1. Ringkasan
  children.push(h2("1. Ringkasan Hasil"));
  children.push(normal(insight.ringkasan));
  children.push(spacer());

  // 2. Yang Sudah Baik
  children.push(h2("2. Hal yang Sudah Baik"));
  if (insight.yangBaik.length > 0) {
    insight.yangBaik.forEach((item) => children.push(bullet(item)));
  } else {
    children.push(normal("Belum ada komponen yang berada dalam kondisi baik."));
  }
  children.push(spacer());

  // 3. Yang Perlu Diperhatikan
  children.push(h2("3. Hal yang Perlu Diperhatikan"));
  if (insight.yangPerluDiperhatikan.length > 0) {
    insight.yangPerluDiperhatikan.forEach((item) => children.push(bullet(item)));
  } else {
    children.push(normal("Tidak ditemukan masalah yang perlu diperhatikan. Data Anda dalam kondisi baik."));
  }
  children.push(spacer());

  // 4. Kemungkinan Penyebab
  children.push(h2("4. Kemungkinan Penyebab"));
  insight.kemungkinanPenyebab.forEach((item) => children.push(bullet(item)));
  children.push(spacer());

  // 5. Saran Perbaikan
  children.push(h2("5. Saran Perbaikan"));
  insight.saranPerbaikan.forEach((item, i) => children.push(numbered(item, i + 1)));
  children.push(spacer());

  // 6. Kesimpulan Akhir
  children.push(h2("6. Kesimpulan Akhir"));
  children.push(normal(insight.kesimpulanAkhir));
  children.push(divider());

  // Footer
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "⚠ Laporan ini bersifat panduan awal berbasis algoritma. Selalu konsultasikan hasil dengan dosen pembimbing Anda.",
          italics: true,
          font: template.font,
          size: (template.fontSize - 1) * 2,
          color: "888888",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 240 },
    })
  );

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: margins.top, right: margins.right,
            bottom: margins.bottom, left: margins.left,
          },
        },
      },
      children,
    }],
  });

  return Packer.toBlob(doc);
}

/** Build plain-text version for clipboard copy */
export function buildInsightPlainText(
  insight: InsightReport,
  skor: number,
  statusLabel: StatusLevel
): string {
  const status = STATUS_LABEL[statusLabel];
  const lines: string[] = [];

  lines.push(`LAPORAN INSIGHT DATA PENELITIAN`);
  lines.push(`Skor Kelayakan: ${skor}/100 — ${status}`);
  lines.push("=".repeat(60));

  lines.push("\n1. RINGKASAN HASIL\n");
  lines.push(insight.ringkasan);

  lines.push("\n2. HAL YANG SUDAH BAIK\n");
  insight.yangBaik.forEach((item) => lines.push(`✔ ${item}`));

  lines.push("\n3. HAL YANG PERLU DIPERHATIKAN\n");
  if (insight.yangPerluDiperhatikan.length > 0) {
    insight.yangPerluDiperhatikan.forEach((item) => lines.push(`⚠ ${item}`));
  } else {
    lines.push("Tidak ditemukan masalah yang perlu diperhatikan.");
  }

  lines.push("\n4. KEMUNGKINAN PENYEBAB\n");
  insight.kemungkinanPenyebab.forEach((item) => lines.push(`• ${item}`));

  lines.push("\n5. SARAN PERBAIKAN\n");
  insight.saranPerbaikan.forEach((item, i) => lines.push(`${i + 1}. ${item}`));

  lines.push("\n6. KESIMPULAN AKHIR\n");
  lines.push(insight.kesimpulanAkhir);

  return lines.join("\n");
}
