/** Verified against the uploaded Pedoman Tugas Akhir FEB UNPAM, October 2021.
 * Printed pages 5–12, 19–28 and 39–45; cover examples in appendices 1–3.
 */
export type FebWritingProfile = "proposal-skripsi" | "skripsi" | "makalah" | "komprehensif";

export const FEB_2021 = {
  year: 2021,
  title: "Pedoman Tugas Akhir FEB UNPAM 2021",
  sourceUrl: "/pedoman/feb-unpam-2021.pdf",
  font: "Times New Roman",
  fontSize: 12,
  marginCm: { top: 4, left: 4, right: 3, bottom: 3 },
  headerFooterCm: 2,
  indentCm: 1.5,
  referenceMaxAge: 10,
} as const;

export const FEB_PROFILE_LABELS: Record<FebWritingProfile, string> = {
  "proposal-skripsi": "Proposal skripsi · spasi 2",
  skripsi: "Skripsi · spasi 2",
  makalah: "Tugas kuliah / makalah · spasi 1,5",
  komprehensif: "Makalah komprehensif · spasi 1,5",
};

export function febBodyLine(profile: FebWritingProfile): number {
  return profile === "skripsi" || profile === "proposal-skripsi" ? 480 : 360;
}

export function inferFebProfile(text: string): FebWritingProfile {
  if (/komprehensif/i.test(text)) return "komprehensif";
  if (/proposal\s+(skripsi|penelitian)|seminar\s+proposal|sempro/i.test(text)) return "proposal-skripsi";
  if (/skripsi/i.test(text)) return "skripsi";
  return "makalah";
}

export function academicTitle(text: string): string {
  const connectors = new Set(["dan", "yang", "dalam", "antara", "di", "ke", "dari", "untuk", "pada", "dengan", "atau", "terhadap"]);
  return text.trim().split(/\s+/).map((word, index) => {
    if (connectors.has(word.toLowerCase()) && index > 0) return word.toLowerCase();
    if (/^[A-Z\d.]+$/.test(word) && word.length <= 4) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(" ");
}

export function referenceAgeWarnings(references: string[], year = new Date().getFullYear()): string[] {
  return references.flatMap((entry) => {
    const match = entry.match(/\((\d{4})\)/);
    if (!match) return [`Tahun referensi perlu diperiksa: ${entry}`];
    const age = year - Number(match[1]);
    return age > FEB_2021.referenceMaxAge || age < 0
      ? [`Referensi di luar rentang ${year - FEB_2021.referenceMaxAge}–${year}: ${entry}`]
      : [];
  });
}

export function febWritingInstructions(profile: FebWritingProfile): string {
  return [
    `Acuan: ${FEB_2021.title}.`,
    `A4, Times New Roman 12 pt, margin atas/kiri 4 cm dan kanan/bawah 3 cm; isi spasi ${febBodyLine(profile) / 240}; before/after 0; indentasi 1,5 cm.`,
    "BAB dan judul BAB kapital serta tebal; subbab tebal dengan huruf awal kata kapital kecuali kata penghubung. Istilah asing/daerah ditulis miring.",
    "Kutipan menggunakan body note: kutipan langsung Menurut Nama (Tahun:halaman) “kutipan”; parafrasa Menurut Nama (Tahun) atau (Nama, Tahun). Jangan mengarang kutipan, nomor halaman, DOI, kota penerbit atau data penelitian.",
    "Teori/referensi maksimal 10 tahun terakhir dari tahun penulisan. Daftar pustaka alfabetis, APA sesuai contoh pedoman: Nama. (Tahun). Judul Buku. Kota: Penerbit. Cantumkan hanya metadata terverifikasi; data bibliografis yang belum diketahui perlu dikonfirmasi.",
    profile === "komprehensif" ? "Makalah komprehensif: minimal 30 halaman, minimal 5 referensi buku/jurnal ber-ISBN/ISSN, dan tinjauan kritis minimal 3 jurnal. Jangan mengklaim syarat ini terpenuhi tanpa pemeriksaan." : "Tugas kuliah mengikuti struktur tugas dosen; ketentuan minimal 30 halaman khusus makalah komprehensif, bukan semua tugas.",
  ].join("\n");
}

/** Official quantitative/qualitative structure, printed pages 11 and 25. */
export function febThesisOutline(profile: "skripsi" | "proposal-skripsi", qualitative = false): string[] {
  const outline = [
    "BAB I PENDAHULUAN", "1.1 Latar Belakang Penelitian",
    qualitative ? "1.2 Fokus Penelitian" : "1.2 Rumusan Masalah", "1.3 Tujuan Penelitian", "1.4 Manfaat Penelitian",
    ...(profile === "proposal-skripsi" ? ["1.5 Sistematika Penulisan"] : []),
    "BAB II TINJAUAN PUSTAKA", "2.1 Landasan Teori", "2.2 Penelitian Terdahulu", "2.3 Kerangka Berpikir",
    qualitative ? "2.4 Proposisi Penelitian" : "2.4 Pengembangan Hipotesis",
    "BAB III METODE PENELITIAN", "3.1 Jenis Penelitian", "3.2 Tempat dan Waktu Penelitian",
    ...(qualitative
      ? ["3.3 Instrumen Penelitian", "3.4 Unit Analisis", "3.5 Prosedur Pengumpulan Data", "3.6 Teknik Analisis Data", "3.7 Pemeriksaan Keabsahan Data"]
      : ["3.3 Operasional Variabel Penelitian", "3.4 Populasi dan Sampel", "3.5 Teknik Pengumpulan Data", "3.6 Teknik Analisis Data"]),
    ...(profile === "skripsi" ? ["BAB IV HASIL PENELITIAN DAN PEMBAHASAN", "4.1 Gambaran Umum Objek Penelitian", "4.2 Hasil Penelitian", "4.3 Pembahasan Penelitian", "BAB V PENUTUP", "5.1 Kesimpulan", "5.2 Keterbatasan Penelitian", "5.3 Saran"] : []),
    "DAFTAR PUSTAKA",
  ];
  return outline;
}
