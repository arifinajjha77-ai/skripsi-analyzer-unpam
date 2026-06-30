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
    ...(report.academicSections || []).map((section) => `${section.heading}\n${section.body || ""}\n${section.timelineRows?.map((row) => `${row.week} ${row.activity} ${row.target}`).join("\n") || ""}\n${section.costRows?.map((row) => `${row.item} ${row.quantity} ${row.unitCost} ${row.total}`).join("\n") || ""}`),
    ...report.sections.map((section) => `${section.title}\n${section.body}`),
    report.references.join("\n"),
  ].join("\n");
  const lower = text.toLowerCase();

  const checks = [
    ...FORBIDDEN_PHRASES.map((phrase) => ({ label: `Tidak mengandung frasa generik: "${phrase}"`, passed: !lower.includes(phrase.toLowerCase()) })),
    { label: "Tidak mengandung frasa generik: \"Pada bagian ini akan dijelaskan\"", passed: !lower.includes("pada bagian ini akan dijelaskan") },
    { label: "Tidak mengandung placeholder", passed: !/\[hal\]|lorem ipsum|isi dapat disesuaikan|\[nama|\[kelas|\[nim|\[dosen/i.test(text) },
    { label: "KATA PENGANTAR tersedia", passed: lower.includes("kata pengantar") || Boolean(report.academicSections?.length) },
    { label: "DAFTAR ISI tersedia", passed: Boolean(report.academicSections?.length) },
    { label: "BAB I-VI lengkap", passed: ["BAB I", "BAB II", "BAB III", "BAB IV", "BAB V", "BAB VI"].every((chapter) => text.includes(chapter)) },
    { label: "Marketing Mix 4P lengkap", passed: ["Product", "Price", "Place", "Promotion"].every((term) => lower.includes(term.toLowerCase())) },
    { label: "SWOT tersedia", passed: lower.includes("swot") && ["strength", "weakness", "opportunity", "threat"].every((term) => lower.includes(term)) },
    { label: "Estimasi biaya tersedia", passed: lower.includes("estimasi biaya") && lower.includes("rp") },
    { label: "Timeline tersedia", passed: lower.includes("minggu") && lower.includes("target") },
    { label: "Daftar pustaka tersedia", passed: report.references.length > 0 || lower.includes("daftar pustaka") },
    { label: "Minimal 5 referensi APA", passed: report.references.length >= 5 },
  ];

  const warnings = checks.filter((check) => !check.passed).map((check) => check.label);
  return { passed: warnings.length === 0, warnings, checks };
}
