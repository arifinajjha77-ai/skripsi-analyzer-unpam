import type { AssignmentAnalysis, AssignmentAnswers, AssignmentAcademicSection, AssignmentCostRow, AssignmentTimelineRow } from "./types";

export type AcademicOutline = {
  kind: "mini_project_proposal" | "generic";
  title: string;
  outputType: string;
  sections: AssignmentAcademicSection[];
};

export function shouldUseMiniProjectProposalOutline(analysis: AssignmentAnalysis, answers: AssignmentAnswers): boolean {
  const text = [
    analysis.course,
    analysis.title,
    analysis.assignmentType,
    analysis.summary,
    analysis.requestedOutput.join(" "),
    analysis.deliverables.map((item) => `${item.name} ${item.description}`).join(" "),
    Object.values(answers).join(" "),
  ].join(" ").toLowerCase();

  return /social\s+media\s+marketing|mini\s+project|proposal\s+mini\s+project|week\s*1/.test(text)
    && /proposal|mini\s+project|week\s*1/.test(text);
}

export function buildAcademicOutline(analysis: AssignmentAnalysis, answers: AssignmentAnswers): AcademicOutline {
  if (shouldUseMiniProjectProposalOutline(analysis, answers)) return buildMiniProjectProposalOutline(analysis);

  return {
    kind: "generic",
    title: analysis.title,
    outputType: analysis.requestedOutput[0] || analysis.assignmentType,
    sections: analysis.reportStructure.map((heading, index) => ({
      heading: index === 0 ? heading.toUpperCase() : heading,
      level: index === 0 ? "chapter" : "subheading",
    })),
  };
}

export function buildMiniProjectProposalOutline(analysis: AssignmentAnalysis): AcademicOutline {
  return {
    kind: "mini_project_proposal",
    title: `Proposal Mini Project Week 1${analysis.course ? ` - ${analysis.course}` : ""}`,
    outputType: "Proposal Mini Project Week 1",
    sections: [
      chapter("BAB I PENDAHULUAN"),
      sub("1.1 Latar Belakang"),
      sub("1.2 Identifikasi Masalah"),
      sub("1.3 Rumusan Masalah"),
      sub("1.4 Tujuan Proposal"),
      sub("1.5 Manfaat Proposal"),
      sub("1.6 Gambaran Singkat Usaha"),
      chapter("BAB II BRAND DAN PRODUK"),
      sub("2.1 Profil Usaha"),
      sub("2.2 Visi dan Misi"),
      sub("2.3 Deskripsi Produk"),
      sub("2.4 Keunikan Produk"),
      sub("2.5 Keunggulan Produk"),
      chapter("BAB III ANALISIS BISNIS"),
      sub("3.1 Analisis Pasar"),
      sub("3.2 Target Konsumen"),
      sub("3.3 Positioning Usaha"),
      sub("3.4 Analisis SWOT"),
      sub("3.5 Analisis Kompetitor"),
      chapter("BAB IV RENCANA OPERASIONAL"),
      sub("4.1 Proses Produksi"),
      sub("4.2 Kebutuhan Alat dan Bahan"),
      { heading: "4.3 Estimasi Biaya", level: "subheading", costRows: buildMiniProjectCosts() },
      { heading: "4.4 Timeline Pelaksanaan", level: "subheading", timelineRows: buildMiniProjectTimeline() },
      chapter("BAB V STRATEGI PEMASARAN"),
      sub("5.1 Identitas Brand"),
      sub("5.2 Tujuan Penggunaan Media Sosial"),
      sub("5.3 Platform Media Sosial"),
      sub("5.4 Marketing Mix 4P"),
      sub("5.5 Strategi Konten"),
      sub("5.6 Jadwal Posting"),
      sub("5.7 Strategi Engagement"),
      chapter("BAB VI PENUTUP"),
      sub("6.1 Kesimpulan"),
      sub("6.2 Saran"),
    ],
  };
}

export function buildMiniProjectTimeline(): AssignmentTimelineRow[] {
  return [
    { week: "1", activity: "Finalisasi ide usaha, identitas brand, deskripsi produk, dan proposal awal.", target: "Proposal Week 1 selesai dan arah proyek disepakati kelompok." },
    { week: "2", activity: "Penyusunan visual brand, akun media sosial, dan konsep katalog produk.", target: "Logo sederhana, bio akun, dan template konten awal tersedia." },
    { week: "3", activity: "Pembuatan contoh produk, foto produk, dan materi pengenalan brand.", target: "Minimal beberapa materi visual siap dipakai untuk konten." },
    { week: "4", activity: "Publikasi konten perkenalan produk dan edukasi nilai personalisasi.", target: "Audiens memahami fungsi, manfaat, dan cara pemesanan produk." },
    { week: "5", activity: "Penguatan product showcase melalui foto, video pendek, dan caption informatif.", target: "Konten produk lebih konsisten dan mudah dipahami calon konsumen." },
    { week: "6", activity: "Uji konten interaktif seperti polling, pertanyaan, atau request desain.", target: "Komentar, balasan, dan respons audiens mulai terkumpul." },
    { week: "7", activity: "Evaluasi konten awal dan perbaikan format posting berdasarkan respons audiens.", target: "Format konten yang paling potensial mulai teridentifikasi." },
    { week: "8", activity: "Optimasi katalog, harga, alur pemesanan, dan highlight informasi produk.", target: "Calon pembeli lebih mudah memahami variasi, harga, dan cara order." },
    { week: "9", activity: "Publikasi konten promosi, testimoni simulasi, dan ide penggunaan produk.", target: "Minat beli dan awareness brand meningkat secara bertahap." },
    { week: "10", activity: "Penguatan engagement dengan challenge, giveaway kecil, atau konten komentar audiens.", target: "Interaksi audiens lebih aktif dan akun terlihat hidup." },
    { week: "11", activity: "Pengumpulan insight media sosial dan catatan performa konten.", target: "Data like, komentar, jangkauan, dan insight awal terdokumentasi." },
    { week: "12", activity: "Penyusunan evaluasi strategi pemasaran dan kendala pelaksanaan.", target: "Kelebihan, kelemahan, dan peluang perbaikan tersusun jelas." },
    { week: "13", activity: "Penyempurnaan laporan akhir, lampiran konten, dan bukti aktivitas media sosial.", target: "Draft laporan akhir siap direview." },
    { week: "14", activity: "Finalisasi laporan, presentasi hasil, dan refleksi mini project.", target: "Laporan akhir dan bahan presentasi siap dikumpulkan." },
  ];
}

export function buildMiniProjectCosts(): AssignmentCostRow[] {
  return [
    { item: "Bahan baku produk/prototipe", quantity: "10 unit", unitCost: "Rp8.000", total: "Rp80.000" },
    { item: "Kemasan sederhana", quantity: "10 pcs", unitCost: "Rp2.500", total: "Rp25.000" },
    { item: "Label/stiker brand", quantity: "1 paket", unitCost: "Rp20.000", total: "Rp20.000" },
    { item: "Properti foto produk", quantity: "1 paket", unitCost: "Rp35.000", total: "Rp35.000" },
    { item: "Biaya promosi awal", quantity: "1 periode", unitCost: "Rp50.000", total: "Rp50.000" },
    { item: "Cadangan operasional", quantity: "1 pos", unitCost: "Rp40.000", total: "Rp40.000" },
  ];
}

function chapter(heading: string): AssignmentAcademicSection {
  return { heading, level: "chapter" };
}

function sub(heading: string): AssignmentAcademicSection {
  return { heading, level: "subheading" };
}
