/**
 * SmartCampus — Reference Intelligence Engine
 * Public API — Sprint 10: Future-ready modular exports
 *
 * All academic modules (Makalah, Proposal, Skripsi, Jurnal, etc.)
 * should import from this index rather than individual files.
 *
 * Usage example:
 *   import { CitationTracker, getReferencesByDiscipline, checkReferenceQuality } from "@/lib/reference";
 *
 *   const tracker = new CitationTracker();
 *   const refs    = getReferencesByDiscipline(["marketing"]);
 *   tracker.cite("kotler_keller_2016");
 *   const report  = checkReferenceQuality(tracker.getCitedRefs(), 2026, tracker);
 *   const biblio  = tracker.buildBibliography();
 */

// ── Types ─────────────────────────────────────────────────────────────────────
export type { AcademicReference, ReferenceType, ReferenceStatus, AcademicDisciplineRef } from "./referenceEngine";
export type { AgeStatus } from "./referenceRules";
export type { FieldStatus, ReferenceValidationResult } from "./referenceValidator";
export type { CitationUsage, SyncReport } from "./citationSynchronizer";
export type { ReferenceQualitySummary } from "./referenceChecker";

// ── Reference Engine (Sprint 1) ───────────────────────────────────────────────
export {
  REFERENCE_DB,
  getReferenceById,
  getReferencesByDiscipline,
  getClassicReferences,
  searchReferences,
} from "./referenceEngine";

// ── Reference Rules (Sprint 2) ────────────────────────────────────────────────
export {
  AGE_LIMITS,
  isClassicReference,
  getReferenceAge,
  isAgeValid,
  getAgeWarning,
  getAgeStatus,
} from "./referenceRules";

// ── Reference Validator (Sprint 3 + 4 + 9) ────────────────────────────────────
export {
  validateReference,
  validateReferences,
  filterSafeReferences,
} from "./referenceValidator";

// ── Bibliography Builder (Sprint 7) ───────────────────────────────────────────
export {
  formatAPA,
  buildBibliography,
  buildBibliographyWithMeta,
} from "./bibliographyBuilder";

// ── Citation Synchronizer (Sprint 6) ──────────────────────────────────────────
export {
  CitationTracker,
  findOrphanRefs,
  findMissingRefs,
} from "./citationSynchronizer";

// ── Reference Checker (Sprint 8 + 5) ─────────────────────────────────────────
export {
  checkReferenceQuality,
  checkDisciplineAlignment,
} from "./referenceChecker";

// ─── Convenience: get valid references for a discipline + year ────────────────

import { getReferencesByDiscipline, AcademicDisciplineRef } from "./referenceEngine";
import { filterSafeReferences } from "./referenceValidator";

/**
 * One-call helper: get age-valid, verified references for a given discipline.
 * This is the primary entry point for content generation engines.
 */
export function getValidReferences(
  disciplines: AcademicDisciplineRef[],
  documentYear = new Date().getFullYear()
) {
  const pool = getReferencesByDiscipline(disciplines);
  return filterSafeReferences(pool, documentYear);
}
