/**
 * SmartCampus V2 — Bibliography Engine (Sprint 7)
 *
 * Tracks which authors are actually cited in the generated text,
 * and produces a clean, synchronized Daftar Pustaka.
 *
 * Rules enforced:
 * - Every in-text citation has a bibliography entry
 * - No bibliography entry exists without an in-text citation
 * - Sorted alphabetically by author family name
 */

import { AcademicAuthor, getBibliographyEntry } from "./authorEngine";

// ─── Bibliography Tracker ─────────────────────────────────────────────────────

export class BibliographyTracker {
  private usedIds = new Set<string>();
  private authorMap: Map<string, AcademicAuthor>;

  constructor(authors: AcademicAuthor[]) {
    this.authorMap = new Map(authors.map((a) => [a.id, a]));
  }

  markUsed(ids: string[]) {
    for (const id of ids) this.usedIds.add(id);
  }

  getUsedAuthors(): AcademicAuthor[] {
    const result: AcademicAuthor[] = [];
    for (const id of this.usedIds) {
      const a = this.authorMap.get(id);
      if (a) result.push(a);
    }
    // Sort by family name of first author
    return result.sort((a, b) => {
      const nameA = a.fullName.split(",")[0].trim().toLowerCase();
      const nameB = b.fullName.split(",")[0].trim().toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }

  generateDaftarPustaka(): string {
    const authors = this.getUsedAuthors();
    if (authors.length === 0) return "";
    return authors
      .map((a) => getBibliographyEntry(a))
      .join("\n\n");
  }

  getCitationCount(): number {
    return this.usedIds.size;
  }
}
