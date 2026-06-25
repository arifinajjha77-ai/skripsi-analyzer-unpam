/**
 * SmartCampus — Citation Synchronizer
 * Sprint 6 + 7: Citation tracking, orphan detection, deduplication
 *
 * Rules:
 *   - If a reference is cited → it MUST appear in the bibliography.
 *   - If a reference is NOT cited → it must NOT appear in the bibliography.
 *   - Same reference cited multiple times → appears once in bibliography.
 *
 * Usage:
 *   const tracker = new CitationTracker(REFERENCE_DB);
 *   tracker.cite("kotler_keller_2016");
 *   tracker.cite("sugiyono_2019");
 *   const bibliography = tracker.buildBibliography();
 *   const report       = tracker.getSyncReport();
 */

import { AcademicReference, getReferenceById } from "./referenceEngine";
import { buildBibliography, buildBibliographyWithMeta } from "./bibliographyBuilder";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CitationUsage {
  refId:    string;
  context?: string;     // optional: where it was cited (e.g. "BAB II, section 2.1")
  count:    number;     // how many times cited
}

export interface SyncReport {
  cited:          AcademicReference[];  // refs that are cited
  uncited:        AcademicReference[];  // refs in bibliography but never cited (orphans)
  missing:        string[];             // cited IDs not found in database
  citationCount:  number;
  uniqueCount:    number;               // deduplicated count
  isSync:         boolean;             // cited = bibliography (no orphans, no missing)
  warnings:       string[];
}

// ─── CitationTracker Class ────────────────────────────────────────────────────

export class CitationTracker {
  private usageMap: Map<string, CitationUsage> = new Map();
  private allRefs:  AcademicReference[];

  constructor(allRefs: AcademicReference[] = []) {
    this.allRefs = allRefs;
  }

  /** Record a citation. Can be called multiple times for the same ID. */
  cite(refId: string, context?: string): this {
    const existing = this.usageMap.get(refId);
    if (existing) {
      existing.count++;
      if (context && !existing.context?.includes(context)) {
        existing.context = (existing.context ? existing.context + "; " : "") + context;
      }
    } else {
      this.usageMap.set(refId, { refId, context, count: 1 });
    }
    return this;
  }

  /** Record multiple citations at once */
  citeAll(refIds: string[], context?: string): this {
    for (const id of refIds) this.cite(id, context);
    return this;
  }

  /** Clear all tracked citations */
  reset(): this {
    this.usageMap.clear();
    return this;
  }

  /** Get all citation usages */
  getUsages(): CitationUsage[] {
    return Array.from(this.usageMap.values());
  }

  /** Get unique cited reference IDs */
  getCitedIds(): string[] {
    return Array.from(this.usageMap.keys());
  }

  /** Get resolved AcademicReference objects for all cited IDs */
  getCitedRefs(): AcademicReference[] {
    const result: AcademicReference[] = [];
    for (const id of this.usageMap.keys()) {
      const ref = getReferenceById(id) ??
                  this.allRefs.find((r) => r.id === id);
      if (ref) result.push(ref);
    }
    return result;
  }

  /** Get IDs that were cited but not found in the database */
  getMissingIds(): string[] {
    return Array.from(this.usageMap.keys()).filter(
      (id) => !getReferenceById(id) && !this.allRefs.some((r) => r.id === id)
    );
  }

  /**
   * Build deduplicated, alphabetically sorted bibliography from cited references.
   * Sprint 7: Sugiyono cited 5× → 1 entry in Daftar Pustaka.
   */
  buildBibliography(): string[] {
    return buildBibliography(this.getCitedRefs());
  }

  buildBibliographyWithMeta() {
    return buildBibliographyWithMeta(this.getCitedRefs());
  }

  /**
   * Sprint 6: Sync validation.
   * Returns a report showing what's cited, what's missing, and any orphans.
   * "Orphan" = a reference given to this tracker's allRefs but never cited.
   */
  getSyncReport(): SyncReport {
    const cited   = this.getCitedRefs();
    const missing = this.getMissingIds();

    // Refs that are available but never cited
    const citedIds = new Set(this.usageMap.keys());
    const uncited  = this.allRefs.filter((r) => !citedIds.has(r.id));

    const warnings: string[] = [];

    if (missing.length > 0) {
      warnings.push(
        `${missing.length} ID sitasi tidak ditemukan di database: ${missing.join(", ")}`
      );
    }
    if (uncited.length > 0) {
      warnings.push(
        `${uncited.length} referensi tersedia namun tidak pernah disitasi (referensi yatim).`
      );
    }

    return {
      cited,
      uncited,
      missing,
      citationCount: Array.from(this.usageMap.values()).reduce((s, u) => s + u.count, 0),
      uniqueCount:   this.usageMap.size,
      isSync:        missing.length === 0 && uncited.length === 0,
      warnings,
    };
  }

  /** Total number of in-text citation events (same ref counted multiple times) */
  get totalCitations(): number {
    return Array.from(this.usageMap.values()).reduce((s, u) => s + u.count, 0);
  }

  /** Number of unique references cited */
  get uniqueCitations(): number {
    return this.usageMap.size;
  }
}

// ─── Standalone Helpers ───────────────────────────────────────────────────────

/**
 * Given a set of cited IDs and a pool of available refs,
 * return refs that appear in bibliography but were never cited (orphans).
 */
export function findOrphanRefs(
  bibliographyRefs: AcademicReference[],
  citedIds: Set<string>
): AcademicReference[] {
  return bibliographyRefs.filter((r) => !citedIds.has(r.id));
}

/**
 * Given a set of cited IDs and a reference database,
 * return IDs that were cited but not found in the database.
 */
export function findMissingRefs(
  citedIds: string[],
  db: AcademicReference[]
): string[] {
  const dbIds = new Set(db.map((r) => r.id));
  return citedIds.filter((id) => !dbIds.has(id));
}
