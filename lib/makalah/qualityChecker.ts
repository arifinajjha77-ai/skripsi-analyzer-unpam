/**
 * SmartCampus V2 — Makalah Quality Checker (Sprint 10)
 *
 * Validates the generated makalah against academic quality criteria.
 * Returns a checklist + SmartCampus Academic Score (0–100).
 */

import { TopicAnalysis } from "./topicEngine";
import { MakalahOutput } from "./generator";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CheckStatus = "pass" | "warn" | "fail";

export interface QualityCheck {
  id: string;
  label: string;
  status: CheckStatus;
  hint: string;
  weight: number;  // contribution to total score
  score: number;   // 0–100 for this check
}

export interface MakalahQualityReport {
  checks: QualityCheck[];
  totalScore: number;          // 0–100
  smartCampusScore: number;    // 0–100 (weighted)
  grade: "A" | "B" | "C" | "D";
  summary: string;
  isPublishable: boolean;
}

// ─── Individual Checks ────────────────────────────────────────────────────────

function checkDisciplineDetected(analysis: TopicAnalysis): QualityCheck {
  const pass = analysis.bidang !== "general";
  return {
    id: "discipline",
    label: "Bidang ilmu terdeteksi",
    status: pass ? "pass" : "warn",
    hint: pass
      ? `Bidang terdeteksi: ${analysis.label} (${analysis.subbidang})`
      : "Bidang ilmu tidak spesifik — coba perjelas judul dengan kata kunci bidang ilmu",
    weight: 10,
    score: pass ? 100 : 40,
  };
}

function checkAuthorRelevance(analysis: TopicAnalysis): QualityCheck {
  const hasSpecificAuthors = [
    "investasi", "keuangan", "akuntansi", "perpajakan", "marketing",
    "msdm", "operasional", "manajemen", "kewirausahaan", "pendidikan",
    "hukum", "komunikasi", "psikologi", "bisnis_digital", "informatika",
  ].includes(analysis.bidang);
  return {
    id: "authors",
    label: "Author sesuai bidang",
    status: hasSpecificAuthors ? "pass" : "warn",
    hint: hasSpecificAuthors
      ? `Menggunakan referensi spesifik untuk bidang ${analysis.label}`
      : "Menggunakan referensi umum — bidang ilmu lebih spesifik akan menghasilkan sitasi lebih relevan",
    weight: 15,
    score: hasSpecificAuthors ? 100 : 60,
  };
}

function checkCitationCount(output: MakalahOutput): QualityCheck {
  // Count inline citations in BAB II
  const citationPattern = /\([A-Z][a-zA-Z\s&,.-]+,\s*\d{4}\)/g;
  const allText = output.bab1 + output.bab2 + output.bab3;
  const matches = allText.match(citationPattern) ?? [];
  const unique  = new Set(matches).size;
  const isGood  = unique >= 8;
  const isOK    = unique >= 5;
  return {
    id: "citations",
    label: `Jumlah sitasi cukup (${unique} sitasi)`,
    status: isGood ? "pass" : isOK ? "warn" : "fail",
    hint: isGood
      ? `${unique} sitasi unik ditemukan — memenuhi standar akademik (8–15 sitasi)`
      : `Hanya ${unique} sitasi — idealnya 8–15 sitasi untuk makalah akademik`,
    weight: 15,
    score: isGood ? 100 : isOK ? 70 : 30,
  };
}

function checkBab2Coverage(output: MakalahOutput, analysis: TopicAnalysis): QualityCheck {
  const bab2Lower = output.bab2.toLowerCase();
  const covered = analysis.mustDiscuss.filter((c) =>
    c.toLowerCase().split(" ").some((word) => word.length > 3 && bab2Lower.includes(word))
  );
  const pct = Math.round((covered.length / Math.max(analysis.mustDiscuss.length, 1)) * 100);
  const isGood = pct >= 75;
  const isOK   = pct >= 50;
  return {
    id: "bab2_coverage",
    label: `BAB II membahas topik utama (${pct}%)`,
    status: isGood ? "pass" : isOK ? "warn" : "fail",
    hint: isGood
      ? `Pembahasan mencakup ${pct}% konsep wajib topik ini`
      : `Pembahasan belum mencakup: ${analysis.mustDiscuss.filter((c) => !covered.includes(c)).slice(0, 3).join(", ")}`,
    weight: 20,
    score: pct,
  };
}

function checkBab1Quality(output: MakalahOutput): QualityCheck {
  const bab1 = output.bab1;
  const hasLatarBelakang = bab1.includes("1.1") || bab1.toLowerCase().includes("latar belakang");
  const hasRumusan       = bab1.includes("1.2") || bab1.toLowerCase().includes("rumusan masalah");
  const hasTujuan        = bab1.includes("1.3") || bab1.toLowerCase().includes("tujuan");
  const hasManfaat       = bab1.includes("1.4") || bab1.toLowerCase().includes("manfaat");
  const components       = [hasLatarBelakang, hasRumusan, hasTujuan, hasManfaat];
  const count            = components.filter(Boolean).length;
  const pct              = Math.round((count / 4) * 100);
  return {
    id: "bab1_structure",
    label: `BAB I terstruktur (${count}/4 komponen)`,
    status: count === 4 ? "pass" : count >= 3 ? "warn" : "fail",
    hint: count === 4
      ? "BAB I memiliki semua komponen: Latar Belakang, Rumusan, Tujuan, Manfaat"
      : `Komponen yang hilang: ${["Latar Belakang","Rumusan Masalah","Tujuan","Manfaat"].filter((_, i) => !components[i]).join(", ")}`,
    weight: 10,
    score: pct,
  };
}

function checkBab3Quality(output: MakalahOutput): QualityCheck {
  const bab3       = output.bab3.toLowerCase();
  const hasKesimpulan = bab3.includes("kesimpulan");
  const hasSaran      = bab3.includes("saran");
  const hasContent    = bab3.length > 500;
  const pass = hasKesimpulan && hasSaran && hasContent;
  return {
    id: "bab3_structure",
    label: "BAB III memiliki Kesimpulan & Saran",
    status: pass ? "pass" : "warn",
    hint: pass
      ? "BAB III lengkap dengan kesimpulan dan saran"
      : "BAB III perlu diperlengkap dengan kesimpulan dan saran yang substantif",
    weight: 10,
    score: pass ? 100 : 50,
  };
}

function checkBibliographySync(output: MakalahOutput): QualityCheck {
  // Check that bibliography exists and has multiple entries
  const hasBiblio = output.daftarPustaka.length > 100;
  const entries   = output.daftarPustaka.split("\n\n").filter((e) => e.trim().length > 20);
  const isGood    = hasBiblio && entries.length >= 5;
  return {
    id: "bibliography",
    label: `Daftar Pustaka tersinkronisasi (${entries.length} entri)`,
    status: isGood ? "pass" : entries.length >= 3 ? "warn" : "fail",
    hint: isGood
      ? `${entries.length} referensi tercantum dalam Daftar Pustaka`
      : "Daftar Pustaka perlu diperlengkap — minimum 5 referensi akademik",
    weight: 10,
    score: isGood ? 100 : Math.min(80, entries.length * 15),
  };
}

function checkHumanWriting(output: MakalahOutput): QualityCheck {
  const allText = output.bab2;
  // Check for banned generic AI phrases
  const bannedPhrases = [
    "topik ini merupakan",
    "pada era modern",
    "di era globalisasi",
    "semakin berkembang pesat",
    "tidak dapat dipungkiri bahwa",
    "sebagai kesimpulan dari uraian di atas",
  ];
  const found = bannedPhrases.filter((p) => allText.toLowerCase().includes(p));
  const hasVariedTransitions = /lebih lanjut|sejalan dengan|hal ini diperkuat|dalam praktiknya|berdasarkan/i.test(allText);
  const isGood = found.length === 0 && hasVariedTransitions;
  return {
    id: "human_writing",
    label: "Gaya penulisan akademik & natural",
    status: isGood ? "pass" : found.length > 2 ? "fail" : "warn",
    hint: isGood
      ? "Gaya penulisan bervariasi dan tidak terasa template"
      : found.length > 0
        ? `Kalimat terlalu generik ditemukan: "${found[0]}"`
        : "Transisi antar paragraf perlu lebih bervariasi",
    weight: 10,
    score: isGood ? 100 : Math.max(40, 100 - found.length * 20),
  };
}

function checkOutlineConsistency(output: MakalahOutput): QualityCheck {
  // Check that section numbers appear in BAB II
  const sectionPattern = /2\.\d+\s+[A-Z]/g;
  const sections = output.bab2.match(sectionPattern) ?? [];
  const isGood = sections.length >= 3;
  return {
    id: "outline_consistency",
    label: `Outline BAB II konsisten (${sections.length} sub-bab)`,
    status: isGood ? "pass" : "warn",
    hint: isGood
      ? `${sections.length} sub-bab ditemukan dalam BAB II`
      : "Sub-bab BAB II terlalu sedikit — idealnya 4–6 sub-bab untuk makalah yang komprehensif",
    weight: 10,
    score: isGood ? 100 : 60,
  };
}

// ─── Main Checker ─────────────────────────────────────────────────────────────

export function checkMakalahQuality(
  output: MakalahOutput,
  analysis: TopicAnalysis
): MakalahQualityReport {
  const checks: QualityCheck[] = [
    checkDisciplineDetected(analysis),
    checkAuthorRelevance(analysis),
    checkCitationCount(output),
    checkBab2Coverage(output, analysis),
    checkBab1Quality(output),
    checkBab3Quality(output),
    checkBibliographySync(output),
    checkHumanWriting(output),
    checkOutlineConsistency(output),
  ];

  // Weighted score
  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const weightedScore = checks.reduce((sum, c) => sum + (c.score * c.weight) / totalWeight, 0);
  const totalScore    = Math.round(weightedScore);
  const smartCampusScore = Math.min(100, Math.round(totalScore * 1.05)); // slight bonus for using SmartCampus

  const grade: MakalahQualityReport["grade"] =
    totalScore >= 85 ? "A" :
    totalScore >= 70 ? "B" :
    totalScore >= 55 ? "C" : "D";

  const passingChecks = checks.filter((c) => c.status === "pass").length;
  const failingChecks = checks.filter((c) => c.status === "fail").length;

  const summary =
    totalScore >= 85
      ? `Makalah berkualitas tinggi — ${passingChecks}/${checks.length} kriteria terpenuhi. Siap dikumpulkan.`
      : totalScore >= 70
        ? `Makalah cukup baik — ${passingChecks}/${checks.length} kriteria terpenuhi. Beberapa aspek dapat diperkuat.`
        : `Makalah perlu perbaikan — ${failingChecks} kriteria tidak terpenuhi. Tinjau saran di bawah.`;

  return {
    checks,
    totalScore,
    smartCampusScore,
    grade,
    summary,
    isPublishable: totalScore >= 70,
  };
}
