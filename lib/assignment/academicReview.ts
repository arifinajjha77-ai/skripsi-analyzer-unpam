import type { AssignmentQualityReview, AssignmentReport } from "./types";

const FORBIDDEN_PHRASES = [
  "Bagian ini membahas",
  "Data yang digunakan",
  "Fokus penulisan",
];

export function reviewAcademicReport(report: AssignmentReport): AssignmentQualityReview {
  const text = [
    report.title,
    report.executiveSummary,
    ...(report.academicSections || []).map((section) => `${section.heading}\n${section.body || ""}\n${section.timelineRows?.map((row) => `${row.week} ${row.activity} ${row.target}`).join("\n") || ""}`),
    ...report.sections.map((section) => `${section.title}\n${section.body}`),
    report.references.join("\n"),
  ].join("\n");
  const lower = text.toLowerCase();

  const checks = [
    ...FORBIDDEN_PHRASES.map((phrase) => ({ label: `Tidak mengandung frasa generik: "${phrase}"`, passed: !lower.includes(phrase.toLowerCase()) })),
    { label: "BAB I-VII lengkap", passed: ["BAB I", "BAB II", "BAB III", "BAB IV", "BAB V", "BAB VI", "BAB VII"].every((chapter) => text.includes(chapter)) },
    { label: "Marketing Mix 4P lengkap", passed: ["Product", "Price", "Place", "Promotion"].every((term) => lower.includes(term.toLowerCase())) },
    { label: "SWOT tersedia", passed: lower.includes("swot") && ["strength", "weakness", "opportunity", "threat"].some((term) => lower.includes(term)) },
    { label: "Timeline tersedia", passed: lower.includes("minggu") && lower.includes("target") },
    { label: "Daftar pustaka tersedia", passed: report.references.length > 0 || lower.includes("daftar pustaka") },
  ];

  const warnings = checks.filter((check) => !check.passed).map((check) => check.label);
  return { passed: warnings.length === 0, warnings, checks };
}
