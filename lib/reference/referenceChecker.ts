/**
 * SmartCampus — Reference Quality Checker
 * Sprint 8: Reference quality report panel
 *
 * Produces a ReferenceQualityReport similar to:
 *   Academic References
 *   ✔ Valid            18
 *   ⚠ Terlalu Lama      1
 *   ⚠ Belum Diverifikasi 0
 *   ★ Classic Theory    2
 *   Skor               98%
 */

import { AcademicReference, AcademicDisciplineRef } from "./referenceEngine";
import { validateReference, ReferenceValidationResult } from "./referenceValidator";
import { isClassicReference } from "./referenceRules";
import { CitationTracker } from "./citationSynchronizer";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReferenceQualitySummary {
  total:              number;
  verified:           number;
  tooOld:             number;
  needsVerification:  number;
  classic:            number;
  orphans:            number;        // in bibliography but never cited
  missing:            number;        // cited but not in database
  score:              number;        // 0–100
  grade:              "A" | "B" | "C" | "D";
  isPublishable:      boolean;
  recommendations:    string[];
  validations:        ReferenceValidationResult[];
  warnings:           string[];
}

// ─── Score Calculation ────────────────────────────────────────────────────────

function computeScore(
  total: number,
  verified: number,
  tooOld: number,
  needsVer: number,
  orphans: number,
  missing: number
): number {
  if (total === 0) return 0;
  let score = 100;
  const safeTotal = Math.max(total, 1);

  // Penalty per too-old reference: -5 pts each, max -25
  score -= Math.min((tooOld  / safeTotal) * 50, 25);
  // Penalty per unverified: -3 pts each, max -15
  score -= Math.min((needsVer / safeTotal) * 30, 15);
  // Penalty for orphans: -5 pts each
  score -= Math.min(orphans * 5, 20);
  // Penalty for missing: -8 pts each
  score -= Math.min(missing * 8, 40);

  return Math.max(0, Math.round(score));
}

function scoreToGrade(score: number): "A" | "B" | "C" | "D" {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  return "D";
}

// ─── Recommendations ──────────────────────────────────────────────────────────

function buildRecommendations(summary: Omit<ReferenceQualitySummary, "recommendations" | "grade" | "isPublishable">): string[] {
  const recs: string[] = [];

  if (summary.tooOld > 0) {
    recs.push(
      `Ganti ${summary.tooOld} referensi yang terlalu lama dengan edisi terbaru atau referensi lebih baru.`
    );
  }
  if (summary.needsVerification > 0) {
    recs.push(
      `${summary.needsVerification} referensi perlu diverifikasi: periksa nama penulis, tahun, dan penerbit secara manual.`
    );
  }
  if (summary.orphans > 0) {
    recs.push(
      `Hapus ${summary.orphans} referensi dari daftar pustaka yang tidak pernah disitasi dalam teks (referensi yatim).`
    );
  }
  if (summary.missing > 0) {
    recs.push(
      `${summary.missing} sitasi tidak ditemukan dalam database — pastikan referensi dimasukkan ke daftar pustaka.`
    );
  }
  if (summary.total < 10) {
    recs.push("Idealnya makalah/skripsi memiliki minimal 10 referensi. Tambahkan lebih banyak sumber.");
  }
  if (summary.total >= 10 && summary.verified === summary.total - summary.classic) {
    recs.push("Referensi sudah lengkap dan terverifikasi. Pastikan semua sitasi muncul dalam teks.");
  }

  return recs;
}

// ─── Main Checker ─────────────────────────────────────────────────────────────

/**
 * Sprint 8: Check the overall quality of a reference set.
 *
 * @param refs          - All references intended for use
 * @param documentYear  - Year of the document (for age rule calculation)
 * @param tracker       - Optional citation tracker (for sync validation)
 */
export function checkReferenceQuality(
  refs: AcademicReference[],
  documentYear = new Date().getFullYear(),
  tracker?: CitationTracker
): ReferenceQualitySummary {
  const validations = refs.map((r) => validateReference(r, documentYear));

  const verified         = validations.filter((v) => v.status === "verified").length;
  const tooOld           = validations.filter((v) => v.status === "too_old").length;
  const needsVerification = validations.filter((v) => v.status === "needs_verification").length;
  const classic          = validations.filter((v) => v.status === "classic").length;

  let orphans = 0;
  let missing = 0;
  const warnings: string[] = [];

  if (tracker) {
    const syncReport = tracker.getSyncReport();
    orphans = syncReport.uncited.length;
    missing = syncReport.missing.length;
    warnings.push(...syncReport.warnings);
  }

  // Collect per-ref warnings
  for (const v of validations) {
    warnings.push(...v.warnings);
  }

  const score = computeScore(refs.length, verified, tooOld, needsVerification, orphans, missing);
  const grade = scoreToGrade(score);

  const baseSummary = {
    total:              refs.length,
    verified,
    tooOld,
    needsVerification,
    classic,
    orphans,
    missing,
    score,
    validations,
    warnings: [...new Set(warnings)], // deduplicate
  };

  const recommendations = buildRecommendations(baseSummary);

  return {
    ...baseSummary,
    grade,
    isPublishable: score >= 75 && missing === 0,
    recommendations,
  };
}

// ─── Discipline Filter ────────────────────────────────────────────────────────

/**
 * Sprint 5: Warn if a reference's discipline doesn't match the document discipline.
 */
export function checkDisciplineAlignment(
  refs: AcademicReference[],
  targetDisciplines: AcademicDisciplineRef[]
): { ref: AcademicReference; warning: string }[] {
  const warnings: { ref: AcademicReference; warning: string }[] = [];

  for (const ref of refs) {
    const hasMatch = ref.discipline.some(
      (d) => targetDisciplines.includes(d) || d === "general" || d === "metodologi" || d === "statistik"
    );
    if (!hasMatch) {
      warnings.push({
        ref,
        warning: `"${ref.author} (${ref.year})" (bidang: ${ref.discipline.join(", ")}) tidak relevan untuk dokumen dengan bidang: ${targetDisciplines.join(", ")}.`,
      });
    }
  }

  return warnings;
}
