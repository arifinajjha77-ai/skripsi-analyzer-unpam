import type { MakalahDocument, ReviewIssue, ReviewReport } from "./types";

const REQUIRED_BAB = ["bab1", "bab2", "bab3", "bab4", "bab5"] as const;

export function reviewMakalah(document: Omit<MakalahDocument, "review">): ReviewReport {
  const issues: ReviewIssue[] = [
    ...checkCompleteStructure(document),
    ...checkEmptyHeadings(document),
    ...checkShortSubsections(document),
    ...checkDuplicateParagraphs(document),
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
