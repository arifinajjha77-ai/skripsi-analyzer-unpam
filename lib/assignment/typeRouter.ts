import type { AssignmentAnalysis, AssignmentTypeRouter } from "./types";

const ROUTES: Array<{ type: AssignmentTypeRouter; patterns: RegExp[] }> = [
  { type: "LAPORAN_PRAKTIKUM", patterns: [/laporan\s+praktikum/i, /\bpraktikum\b/i, /\blab(oratorium)?\b/i] },
  { type: "BUSINESS_PLAN", patterns: [/business\s+plan/i, /rencana\s+bisnis/i, /proposal\s+bisnis/i, /studi\s+kelayakan\s+usaha/i] },
  { type: "CASE_STUDY", patterns: [/case\s+study/i, /studi\s+kasus/i, /analisis\s+kasus/i] },
  { type: "PRESENTASI", patterns: [/presentasi/i, /\bppt\b/i, /power\s*point/i, /\bslide\b/i] },
  { type: "SKRIPSI", patterns: [/skripsi/i, /proposal\s+penelitian/i, /bab\s+[1i]/i, /variabel\s+[xy]/i] },
  { type: "PKM", patterns: [/\bpkm\b/i, /program\s+kreativitas\s+mahasiswa/i] },
  { type: "JURNAL", patterns: [/artikel\s+jurnal/i, /\bjurnal\b/i, /manuskrip/i] },
  { type: "PROPOSAL", patterns: [/proposal/i, /usulan\s+kegiatan/i, /rancangan\s+proyek/i] },
  { type: "MAKALAH", patterns: [/makalah/i, /paper/i, /esai/i, /essay/i] },
];

export function routeAssignmentType(input: Pick<AssignmentAnalysis, "title" | "assignmentType" | "requestedOutput" | "reportStructure" | "deliverables" | "summary">): AssignmentTypeRouter {
  const text = [
    input.title,
    input.assignmentType,
    input.summary,
    ...input.requestedOutput,
    ...input.reportStructure,
    ...input.deliverables.flatMap((deliverable) => [deliverable.name, deliverable.type, deliverable.description]),
  ].join(" ");

  return ROUTES.find((route) => route.patterns.some((pattern) => pattern.test(text)))?.type || "UNKNOWN";
}

export function defaultStructureForType(type: AssignmentTypeRouter): string[] {
  switch (type) {
    case "PROPOSAL":
      return ["Pendahuluan", "Tujuan", "Objek atau Kegiatan", "Metode/Rencana Kerja", "Timeline", "Penutup"];
    case "MAKALAH":
      return ["Pendahuluan", "Landasan Teori", "Pembahasan", "Kesimpulan", "Daftar Pustaka"];
    case "BUSINESS_PLAN":
      return ["Ringkasan Eksekutif", "Profil Usaha", "Analisis Pasar", "Strategi Operasional dan Pemasaran", "Rencana Keuangan", "Penutup"];
    case "SKRIPSI":
      return ["Latar Belakang", "Rumusan Masalah", "Tujuan Penelitian", "Tinjauan Pustaka", "Metode Penelitian", "Daftar Pustaka"];
    case "PKM":
      return ["Judul dan Ringkasan", "Latar Belakang", "Tujuan", "Metode Pelaksanaan", "Anggaran", "Jadwal Kegiatan"];
    case "LAPORAN_PRAKTIKUM":
      return ["Tujuan Praktikum", "Dasar Teori", "Alat dan Bahan", "Prosedur", "Data dan Pembahasan", "Kesimpulan"];
    case "JURNAL":
      return ["Judul", "Abstrak", "Pendahuluan", "Metode", "Hasil dan Pembahasan", "Kesimpulan", "Daftar Pustaka"];
    case "PRESENTASI":
      return ["Judul", "Latar Belakang", "Poin Utama", "Visual/Data Pendukung", "Kesimpulan"];
    case "CASE_STUDY":
      return ["Ringkasan Kasus", "Identifikasi Masalah", "Analisis Alternatif", "Rekomendasi", "Kesimpulan"];
    case "UNKNOWN":
      return ["Konteks Tugas", "Data Utama", "Pembahasan", "Kesimpulan"];
  }
}
