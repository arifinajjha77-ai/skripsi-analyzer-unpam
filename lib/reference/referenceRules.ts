/**
 * SmartCampus — Reference Age Rules & Classic Theory Exceptions
 * Sprint 2: Age validation rules per reference type
 *
 * Rules (per Indonesian academic standards):
 *   Journal   → max 5 years  from document year
 *   Book      → max 10 years from document year
 *   Classic   → EXEMPT — always allowed regardless of age
 *   Proceeding→ max 5 years (same as journal)
 *   Thesis    → max 10 years (same as book)
 *   Website   → max 3 years
 *   Report    → max 5 years
 */

import { AcademicReference, ReferenceType } from "./referenceEngine";

// ─── Age Limits by Type ───────────────────────────────────────────────────────

export const AGE_LIMITS: Record<ReferenceType, number> = {
  journal:    5,
  proceeding: 5,
  report:     5,
  website:    3,
  book:       10,
  thesis:     10,
  standard:   10,
};

// ─── Classic Author Identifiers ───────────────────────────────────────────────
// A reference is considered "classic" if:
// 1. Its `isClassic` flag is true (set in the database), OR
// 2. Its author matches a known classic theorist pattern
//
// Matching uses partial lowercase author string to handle multi-author formats.

const CLASSIC_AUTHOR_PATTERNS: string[] = [
  "kotler, philip",   // early works only — newer Kotler books are NOT classic
  "porter, michael",
  "maslow, abraham",
  "herzberg, frederick",
  "taylor, frederick",
  "drucker, peter",
  "fayol, henri",
  "mayo, elton",
  "mcgregor, douglas",
  "barnard, chester",
  "weber, max",
  "deming, w. edwards",
  "juran, joseph",
];

// References published before this year by classic authors are always exempt
const CLASSIC_CUTOFF_YEAR = 2000;

/**
 * Returns true if a reference should be treated as a classic theory
 * (exempt from age-limit rules).
 */
export function isClassicReference(ref: AcademicReference): boolean {
  // Explicitly flagged in database
  if (ref.isClassic) return true;

  // Classic author + old enough
  const authorLower = ref.author.toLowerCase();
  const isKnownClassicAuthor = CLASSIC_AUTHOR_PATTERNS.some((p) =>
    authorLower.startsWith(p)
  );
  return isKnownClassicAuthor && ref.year < CLASSIC_CUTOFF_YEAR;
}

// ─── Age Calculation ──────────────────────────────────────────────────────────

/**
 * Returns the age of a reference relative to the document year.
 * e.g. documentYear=2026, ref.year=2021 → age=5
 */
export function getReferenceAge(ref: AcademicReference, documentYear: number): number {
  return documentYear - ref.year;
}

/**
 * Returns true if the reference satisfies the age rule for its type.
 * Classic references always return true.
 */
export function isAgeValid(ref: AcademicReference, documentYear: number): boolean {
  if (isClassicReference(ref)) return true;
  const age   = getReferenceAge(ref, documentYear);
  const limit = AGE_LIMITS[ref.type] ?? 10;
  return age <= limit;
}

/**
 * Returns a human-readable warning message when a reference exceeds the age limit.
 * Returns null if age is OK.
 */
export function getAgeWarning(
  ref: AcademicReference,
  documentYear: number
): string | null {
  if (isClassicReference(ref)) return null;
  const age   = getReferenceAge(ref, documentYear);
  const limit = AGE_LIMITS[ref.type] ?? 10;
  if (age <= limit) return null;

  const typeLabel: Record<ReferenceType, string> = {
    journal:    "Jurnal",
    book:       "Buku",
    proceeding: "Prosiding",
    thesis:     "Skripsi/Tesis",
    website:    "Website",
    report:     "Laporan",
    standard:   "Standar",
  };

  const label = typeLabel[ref.type] ?? "Referensi";
  return `${label} "${ref.title.slice(0, 50)}..." (${ref.year}) melebihi batas ${limit} tahun untuk kategori ${label.toLowerCase()}.`;
}

// ─── Reference Status ─────────────────────────────────────────────────────────

export type AgeStatus = "ok" | "too_old" | "classic";

export function getAgeStatus(ref: AcademicReference, documentYear: number): AgeStatus {
  if (isClassicReference(ref)) return "classic";
  return isAgeValid(ref, documentYear) ? "ok" : "too_old";
}
