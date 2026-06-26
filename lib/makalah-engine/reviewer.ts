import type { MakalahDocument, ReviewIssue, ReviewReport } from "./types";

const REQUIRED_BAB = ["bab1", "bab2", "bab3", "bab4", "bab5"] as const;

export function reviewMakalah(document: Omit<MakalahDocument, "review">): ReviewReport {
  const issues: ReviewIssue[] = [
    ...checkCompleteStructure(document),
    ...checkEmptyHeadings(document),
    ...checkShortSubsections(document),
    ...checkDuplicateParagraphs(document),
    ...checkObjectiveAlignment(document),
    ...checkConclusionAnswersQuestions(document),
    ...checkGenericSentences(document),
  ];

  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;
  const score = Math.max(0, 100 - errorCount * 25 - warningCount * 10);

  return {
    passed: errorCount === 0,
    score,
    issues,
  };
}

function checkObjectiveAlignment(document: Omit<MakalahDocument, "review">): ReviewIssue[] {
  const bab1 = document.chapters.find((chapter) => chapter.id === "bab1");
  const rumusan = bab1?.subsections.find((item) => /rumusan|masalah/i.test(item.title));
  const tujuan = bab1?.subsections.find((item) => /tujuan/i.test(item.title));
  if (!rumusan || !tujuan) return [];

  const overlap = keywordOverlap(rumusan.content, tujuan.content);
  if (overlap < 0.12) {
    return [{
      type: "misaligned-objectives",
      severity: "warning",
      message: "Rumusan masalah belum cukup selaras dengan tujuan penulisan.",
      location: "BAB I",
    }];
  }
  return [];
}

function checkConclusionAnswersQuestions(document: Omit<MakalahDocument, "review">): ReviewIssue[] {
  const bab1 = document.chapters.find((chapter) => chapter.id === "bab1");
  const bab5 = document.chapters.find((chapter) => chapter.id === "bab5");
  const rumusan = bab1?.subsections.find((item) => /rumusan|masalah/i.test(item.title));
  const kesimpulan = bab5?.subsections.find((item) => /simpulan|kesimpulan/i.test(item.title));
  if (!rumusan || !kesimpulan) return [];

  const overlap = keywordOverlap(rumusan.content, kesimpulan.content);
  if (overlap < 0.1) {
    return [{
      type: "conclusion-mismatch",
      severity: "warning",
      message: "Kesimpulan belum terlihat menjawab rumusan masalah.",
      location: "BAB V",
    }];
  }
  return [];
}

function checkGenericSentences(document: Omit<MakalahDocument, "review">): ReviewIssue[] {
  const genericPatterns = [
    /sangat penting dalam kehidupan/i,
    /di era globalisasi/i,
    /perkembangan zaman/i,
    /memiliki peranan yang sangat penting/i,
    /tidak dapat dipungkiri/i,
  ];
  const text = document.chapters.flatMap((chapter) => chapter.subsections.map((item) => item.content)).join("\n");
  const count = genericPatterns.reduce((sum, pattern) => sum + (text.match(pattern)?.length || 0), 0);
  if (count >= 3) {
    return [{
      type: "generic-sentences",
      severity: "warning",
      message: "Terlalu banyak kalimat generik. Perjelas konteks objek, tugas, atau strategi.",
      location: "Dokumen",
    }];
  }
  return [];
}

function checkCompleteStructure(document: Omit<MakalahDocument, "review">): ReviewIssue[] {
  const present = new Set(document.chapters.map((chapter) => chapter.id));
  return REQUIRED_BAB
    .filter((id) => !present.has(id))
    .map((id) => ({
      type: "incomplete-structure" as const,
      severity: "error" as const,
      message: `Struktur belum lengkap: ${id.toUpperCase()} tidak ditemukan.`,
      location: id,
    }));
}

function checkEmptyHeadings(document: Omit<MakalahDocument, "review">): ReviewIssue[] {
  const issues: ReviewIssue[] = [];
  for (const chapter of document.chapters) {
    if (!chapter.title.trim()) {
      issues.push({ type: "empty-heading", severity: "error", message: "Judul BAB kosong.", location: chapter.number });
    }
    for (const subsection of chapter.subsections) {
      if (!subsection.title.trim()) {
        issues.push({ type: "empty-heading", severity: "error", message: "Judul subbab kosong.", location: subsection.id });
      }
    }
  }
  return issues;
}

function checkShortSubsections(document: Omit<MakalahDocument, "review">): ReviewIssue[] {
  const issues: ReviewIssue[] = [];
  for (const chapter of document.chapters) {
    for (const subsection of chapter.subsections) {
      const wordCount = subsection.content.split(/\s+/).filter(Boolean).length;
      if (wordCount < 80) {
        issues.push({
          type: "short-subsection",
          severity: "warning",
          message: `Subbab terlalu pendek (${wordCount} kata). Tambahkan uraian atau contoh akademik.`,
          location: `${chapter.number} ${subsection.id}`,
        });
      }
    }
  }
  return issues;
}

function checkDuplicateParagraphs(document: Omit<MakalahDocument, "review">): ReviewIssue[] {
  const seen = new Map<string, string>();
  const issues: ReviewIssue[] = [];

  for (const chapter of document.chapters) {
    for (const subsection of chapter.subsections) {
      const paragraphs = subsection.content.split(/\n{2,}/).map(normalizeParagraph).filter((text) => text.length > 60);
      for (const paragraph of paragraphs) {
        const location = `${chapter.number} ${subsection.id}`;
        const duplicateOf = seen.get(paragraph);
        if (duplicateOf) {
          issues.push({
            type: "duplicate-paragraph",
            severity: "warning",
            message: `Paragraf duplikat terdeteksi, mirip dengan ${duplicateOf}.`,
            location,
          });
        } else {
          seen.set(paragraph, location);
        }
      }
    }
  }

  return issues;
}

function normalizeParagraph(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").replace(/[^\p{L}\p{N}\s]/gu, "").trim();
}

function keywordOverlap(source: string, target: string): number {
  const sourceWords = keywords(source);
  const targetWords = keywords(target);
  if (sourceWords.size === 0 || targetWords.size === 0) return 0;
  let match = 0;
  for (const word of sourceWords) {
    if (targetWords.has(word)) match += 1;
  }
  return match / sourceWords.size;
}

function keywords(text: string): Set<string> {
  const stopwords = new Set(["yang", "dan", "atau", "dalam", "untuk", "pada", "dengan", "adalah", "dapat", "sebagai", "ini", "itu", "dari", "ke", "di"]);
  return new Set(
    normalizeParagraph(text)
      .split(/\s+/)
      .filter((word) => word.length > 4 && !stopwords.has(word))
  );
}
