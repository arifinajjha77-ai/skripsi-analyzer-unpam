/**
 * SmartCampus — Reference Validator
 * Sprint 3 + 4 + 9: Metadata completeness + age validation + warning engine
 *
 * Validation order:
 *   1. Metadata completeness (required fields present?)
 *   2. Age validity (within limits for the reference type?)
 *   3. Classic exemption check
 *   4. Verified flag check
 *
 * INTEGRITY POLICY:
 *   If any required field is missing → status "needs_verification".
 *   We never silently use incomplete references.
 */

import { AcademicReference, ReferenceStatus } from "./referenceEngine";
import {
  isClassicReference,
  isAgeValid,
  getAgeWarning,
  getAgeStatus,
  AgeStatus,
} from "./referenceRules";

// ─── Field Status ─────────────────────────────────────────────────────────────

export interface FieldStatus {
  field:    string;
  present:  boolean;
  required: boolean;
  value?:   string;
}

// ─── Validation Result ────────────────────────────────────────────────────────

export interface ReferenceValidationResult {
  ref:           AcademicReference;
  status:        ReferenceStatus;
  ageStatus:     AgeStatus;
  ageWarning?:   string;
  fieldStatuses: FieldStatus[];
  isComplete:    boolean;   // all required fields present
  warnings:      string[];  // all warnings combined
}

// ─── Required Fields by Type ──────────────────────────────────────────────────

const REQUIRED_FIELDS: Record<string, string[]> = {
  book:       ["author", "year", "title", "publisher"],
  journal:    ["author", "year", "title", "journal"],
  proceeding: ["author", "year", "title"],
  thesis:     ["author", "year", "title"],
  website:    ["author", "year", "title", "url"],
  report:     ["author", "year", "title"],
  standard:   ["author", "year", "title"],
};

// ─── Metadata Completeness Check ──────────────────────────────────────────────

function checkFields(ref: AcademicReference): FieldStatus[] {
  const required = REQUIRED_FIELDS[ref.type] ?? ["author", "year", "title"];
  const allFields = ["author", "year", "title", "publisher", "journal", "discipline", "keywords"];

  return allFields.map((field) => {
    const value = (ref as unknown as Record<string, unknown>)[field];
    let present = false;

    if (Array.isArray(value)) {
      present = value.length > 0;
    } else if (typeof value === "number") {
      present = !isNaN(value) && value > 0;
    } else if (typeof value === "string") {
      present = value.trim().length > 0;
    }

    return {
      field,
      present,
      required: required.includes(field),
      value: Array.isArray(value) ? value.join(", ") : String(value ?? ""),
    };
  });
}

// ─── Determine Final Status ───────────────────────────────────────────────────

function resolveStatus(
  ref: AcademicReference,
  isComplete: boolean,
  documentYear: number
): ReferenceStatus {
  if (isClassicReference(ref))           return "classic";
  if (!isComplete || !ref.verified)      return "needs_verification";
  if (!isAgeValid(ref, documentYear))    return "too_old";
  return "verified";
}

// ─── Main Validator ───────────────────────────────────────────────────────────

/**
 * Validates a single reference against metadata completeness and age rules.
 */
export function validateReference(
  ref: AcademicReference,
  documentYear = new Date().getFullYear()
): ReferenceValidationResult {
  const fieldStatuses = checkFields(ref);
  const isComplete    = fieldStatuses
    .filter((f) => f.required)
    .every((f) => f.present);

  const ageStatus  = getAgeStatus(ref, documentYear);
  const ageWarning = getAgeWarning(ref, documentYear) ?? undefined;
  const status     = resolveStatus(ref, isComplete, documentYear);

  const warnings: string[] = [];

  if (!ref.verified) {
    warnings.push(
      `Referensi "${ref.author} (${ref.year})" belum diverifikasi secara manual. Periksa kembali metadata sebelum digunakan.`
    );
  }

  const missing = fieldStatuses.filter((f) => f.required && !f.present);
  if (missing.length > 0) {
    warnings.push(
      `Field wajib kosong: ${missing.map((f) => f.field).join(", ")}`
    );
  }

  if (ageWarning) warnings.push(ageWarning);

  return { ref, status, ageStatus, ageWarning, fieldStatuses, isComplete, warnings };
}

/**
 * Validates multiple references at once.
 */
export function validateReferences(
  refs: AcademicReference[],
  documentYear = new Date().getFullYear()
): ReferenceValidationResult[] {
  return refs.map((r) => validateReference(r, documentYear));
}

/**
 * Filters references to only those that are safe to use in a document.
 * "Safe" means: verified + age OK, OR classic.
 */
export function filterSafeReferences(
  refs: AcademicReference[],
  documentYear = new Date().getFullYear()
): AcademicReference[] {
  return refs.filter((r) => {
    const result = validateReference(r, documentYear);
    return result.status === "verified" || result.status === "classic";
  });
}
