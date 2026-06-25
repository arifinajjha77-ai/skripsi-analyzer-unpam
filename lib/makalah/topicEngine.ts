/**
 * SmartCampus V2 — Topic Intelligence Engine
 *
 * Sprint 1 + 2: Analyzes a makalah title and returns structured academic metadata:
 * - Detected academic discipline (Sprint 2)
 * - Sub-field, keywords, entities, and outline hints (Sprint 1)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type AcademicDiscipline =
  | "marketing"     | "keuangan"      | "investasi"    | "akuntansi"
  | "perpajakan"    | "msdm"          | "operasional"  | "manajemen"
  | "kewirausahaan" | "ekonomi"       | "pendidikan"   | "hukum"
  | "teknik"        | "informatika"   | "kesehatan"    | "psikologi"
  | "komunikasi"    | "bisnis_digital"| "general";

export interface TopicEntity {
  name: string;
  type: "instrument" | "concept" | "variable" | "method" | "organization";
}

export interface TopicAnalysis {
  bidang: AcademicDiscipline;
  subbidang: string;
  label: string;             // Human-readable discipline name
  keywords: string[];        // Main topic keywords
  supportKeywords: string[]; // Supporting / contextual keywords
  mustDiscuss: string[];     // Concepts that MUST be covered
  entities: string[];        // Key entities extracted from title (for outline)
  isComparison: boolean;     // True if title suggests comparing multiple things
  outlineHints: string[];    // Suggested BAB II section topics
}

// ─── Discipline Detection Patterns ───────────────────────────────────────────

interface DisciplinePattern {
  patterns: RegExp[];
  subbidang: string;
  label: string;
  mustDiscuss: string[];
  supportKeywords: string[];
}

const DISCIPLINE_MAP: Record<AcademicDiscipline, DisciplinePattern> = {
  investasi: {
    patterns: [
      /investasi|saham|emas|deposito|obligasi|reksa\s*dana|portofolio|return|dividen|capital\s*gain|instrumen\s*keuangan|pasar\s*modal|bursa\s*efek|aset/i,
    ],
    subbidang: "Investasi & Pasar Modal",
    label: "Investasi",
    mustDiscuss: ["pengertian investasi", "risiko", "return", "likuiditas", "instrumen investasi"],
    supportKeywords: ["risiko", "return", "likuiditas", "pasar modal", "portofolio", "diversifikasi"],
  },
  keuangan: {
    patterns: [
      /keuangan|laporan\s*keuangan|manajemen\s*keuangan|modal\s*kerja|likuiditas|solvabilitas|profitabilitas|rasio|neraca|laba\s*rugi|arus\s*kas|pembiayaan|pendanaan|valuasi|nilai\s*perusahaan/i,
    ],
    subbidang: "Manajemen Keuangan",
    label: "Keuangan",
    mustDiscuss: ["manajemen keuangan", "laporan keuangan", "analisis rasio", "modal kerja"],
    supportKeywords: ["likuiditas", "solvabilitas", "profitabilitas", "leverage", "ROE", "ROA"],
  },
  akuntansi: {
    patterns: [
      /akuntansi|pembukuan|jurnal|buku\s*besar|neraca\s*saldo|laporan\s*keuangan|audit|pemeriksaan|piutang|hutang|persediaan|penyusutan|amortisasi|standar\s*akuntansi|psak|ifrs/i,
    ],
    subbidang: "Akuntansi Keuangan",
    label: "Akuntansi",
    mustDiscuss: ["siklus akuntansi", "laporan keuangan", "prinsip akuntansi", "pencatatan transaksi"],
    supportKeywords: ["debit", "kredit", "jurnal", "buku besar", "neraca", "laba rugi"],
  },
  perpajakan: {
    patterns: [
      /pajak|perpajakan|ppn|pph|bphtb|tarif\s*pajak|wajib\s*pajak|spt|penghasilan\s*kena\s*pajak|tax|fiscal|bea|cukai|retribusi/i,
    ],
    subbidang: "Perpajakan",
    label: "Perpajakan",
    mustDiscuss: ["pengertian pajak", "dasar hukum", "subjek pajak", "objek pajak", "tarif pajak"],
    supportKeywords: ["wajib pajak", "SPT", "NPWP", "penghasilan kena pajak", "kredit pajak"],
  },
  marketing: {
    patterns: [
      /pemasaran|marketing|bauran\s*pemasaran|promosi|iklan|brand|merek|konsumen|pelanggan|loyalitas|kepuasan|segmentasi|targeting|positioning|distribusi|harga|produk|jasa/i,
    ],
    subbidang: "Manajemen Pemasaran",
    label: "Marketing & Pemasaran",
    mustDiscuss: ["konsep pemasaran", "bauran pemasaran", "segmentasi pasar", "perilaku konsumen"],
    supportKeywords: ["4P", "7P", "STP", "brand equity", "customer satisfaction", "market share"],
  },
  msdm: {
    patterns: [
      /sumber\s*daya\s*manusia|sdm|karyawan|pegawai|rekrutmen|seleksi|pelatihan|pengembangan|kompensasi|gaji|kinerja|motivasi|kepemimpinan|budaya\s*organisasi|disiplin\s*kerja/i,
    ],
    subbidang: "Manajemen Sumber Daya Manusia",
    label: "MSDM",
    mustDiscuss: ["manajemen SDM", "rekrutmen dan seleksi", "pelatihan", "kompensasi", "kinerja"],
    supportKeywords: ["human capital", "kompetensi", "produktivitas", "turnover", "engagement"],
  },
  operasional: {
    patterns: [
      /operasional|manajemen\s*operasi|produksi|kualitas|mutu|supply\s*chain|rantai\s*pasokan|logistik|inventori|persediaan|just\s*in\s*time|lean|six\s*sigma|kapasitas/i,
    ],
    subbidang: "Manajemen Operasional",
    label: "Manajemen Operasional",
    mustDiscuss: ["manajemen operasi", "proses produksi", "pengendalian kualitas", "efisiensi"],
    supportKeywords: ["kapasitas", "throughput", "bottleneck", "SOP", "standar mutu"],
  },
  manajemen: {
    patterns: [
      /manajemen|strategi\s*bisnis|perencanaan\s*strategis|tata\s*kelola|governance|keputusan\s*manajerial|kepemimpinan\s*strategis|inovasi\s*bisnis|transformasi\s*organisasi/i,
    ],
    subbidang: "Manajemen Strategik",
    label: "Manajemen",
    mustDiscuss: ["fungsi manajemen", "perencanaan strategis", "kepemimpinan", "pengambilan keputusan"],
    supportKeywords: ["SWOT", "balanced scorecard", "visi misi", "competitive advantage"],
  },
  kewirausahaan: {
    patterns: [
      /wirausaha|kewirausahaan|startup|umkm|usaha\s*kecil|entrepreneur|bisnis\s*baru|inkubasi|inovasi\s*usaha|usaha\s*mikro|usaha\s*menengah|modal\s*usaha/i,
    ],
    subbidang: "Kewirausahaan & UMKM",
    label: "Kewirausahaan",
    mustDiscuss: ["kewirausahaan", "karakteristik wirausaha", "peluang usaha", "risiko bisnis"],
    supportKeywords: ["business plan", "modal ventura", "pitch deck", "skalabilitas", "ekosistem startup"],
  },
  ekonomi: {
    patterns: [
      /ekonomi|makroekonomi|mikroekonomi|inflasi|deflasi|kebijakan\s*moneter|kebijakan\s*fiskal|gdp|pendapatan\s*nasional|permintaan|penawaran|pasar\s*persaingan|oligopoli|monopoli/i,
    ],
    subbidang: "Ilmu Ekonomi",
    label: "Ekonomi",
    mustDiscuss: ["teori ekonomi", "mekanisme pasar", "kebijakan ekonomi", "indikator ekonomi"],
    supportKeywords: ["PDB", "inflasi", "suku bunga", "pengangguran", "pertumbuhan ekonomi"],
  },
  pendidikan: {
    patterns: [
      /pendidikan|pembelajaran|kurikulum|guru|siswa|mahasiswa|metode\s*mengajar|evaluasi\s*belajar|prestasi\s*akademik|kompetensi\s*guru|literasi|pedagogi|sekolah|universitas/i,
    ],
    subbidang: "Ilmu Pendidikan",
    label: "Pendidikan",
    mustDiscuss: ["konsep pendidikan", "metode pembelajaran", "kurikulum", "evaluasi pendidikan"],
    supportKeywords: ["hasil belajar", "kompetensi", "efektivitas", "inovasi pendidikan"],
  },
  hukum: {
    patterns: [
      /hukum|perundangan|regulasi|undang.undang|peraturan|pidana|perdata|kontrak|perjanjian|hak\s*asasi|keadilan|yurisprudensi|mahkamah|pengadilan|litigasi/i,
    ],
    subbidang: "Ilmu Hukum",
    label: "Hukum",
    mustDiscuss: ["dasar hukum", "asas hukum", "penegakan hukum", "regulasi yang berlaku"],
    supportKeywords: ["pasal", "ayat", "ketentuan", "sanksi", "yurisdiksi"],
  },
  informatika: {
    patterns: [
      /sistem\s*informasi|teknologi\s*informasi|perangkat\s*lunak|software|hardware|database|jaringan|pemrograman|algoritma|aplikasi|website|mobile|cloud|ai|machine\s*learning|data\s*science/i,
    ],
    subbidang: "Teknologi Informasi",
    label: "Informatika & Teknologi",
    mustDiscuss: ["sistem informasi", "teknologi terkini", "implementasi teknologi", "keamanan data"],
    supportKeywords: ["user interface", "UX", "API", "integrasi sistem", "skalabilitas"],
  },
  bisnis_digital: {
    patterns: [
      /digital\s*marketing|e.commerce|marketplace|media\s*sosial|social\s*media|konten|influencer|seo|sem|google|instagram|tiktok|platform\s*digital|transaksi\s*digital|fintech/i,
    ],
    subbidang: "Bisnis & Pemasaran Digital",
    label: "Bisnis Digital",
    mustDiscuss: ["ekosistem digital", "strategi digital marketing", "platform digital", "analitik digital"],
    supportKeywords: ["reach", "engagement", "conversion", "ROAS", "CTR", "funnel pemasaran"],
  },
  teknik: {
    patterns: [
      /teknik\s*sipil|teknik\s*mesin|teknik\s*industri|konstruksi|struktur|material|manufaktur|mekanisme|beban|kekuatan|efisiensi\s*energi|termal|hidro/i,
    ],
    subbidang: "Teknik & Rekayasa",
    label: "Teknik",
    mustDiscuss: ["prinsip teknik", "standar teknis", "analisis teknis", "implementasi"],
    supportKeywords: ["spesifikasi", "standar", "toleransi", "desain", "uji coba"],
  },
  kesehatan: {
    patterns: [
      /kesehatan|medis|farmasi|klinis|pasien|penyakit|pengobatan|terapi|diagnosis|epidemiologi|public\s*health|keperawatan|gizi|nutrisi/i,
    ],
    subbidang: "Ilmu Kesehatan",
    label: "Kesehatan",
    mustDiscuss: ["konsep kesehatan", "faktor risiko", "pencegahan", "pengobatan"],
    supportKeywords: ["prevalensi", "insidensi", "intervensi", "outcome klinis"],
  },
  psikologi: {
    patterns: [
      /psikologi|perilaku|kognisi|emosi|motivasi|kepribadian|mental|stres|konseling|terapi\s*psikologi|well.being|self.efficacy|attachment/i,
    ],
    subbidang: "Psikologi",
    label: "Psikologi",
    mustDiscuss: ["teori psikologi", "perilaku individu", "faktor psikologis", "intervensi psikologis"],
    supportKeywords: ["kognitif", "afektif", "behavioral", "self-concept", "resiliensi"],
  },
  komunikasi: {
    patterns: [
      /komunikasi|media|jurnalistik|public\s*relations|pr|siaran|broadcasting|wacana|retorika|publisistik|hubungan\s*masyarakat|humas|iklan|kampanye/i,
    ],
    subbidang: "Ilmu Komunikasi",
    label: "Komunikasi",
    mustDiscuss: ["teori komunikasi", "model komunikasi", "media komunikasi", "efektivitas pesan"],
    supportKeywords: ["encoding", "decoding", "noise", "feedback", "saluran komunikasi"],
  },
  general: {
    patterns: [/.*/i],
    subbidang: "Kajian Umum",
    label: "Umum",
    mustDiscuss: ["konsep dasar", "landasan teori", "implementasi", "analisis"],
    supportKeywords: ["efektivitas", "efisiensi", "relevansi", "dampak", "kontribusi"],
  },
};

// ─── Comparison Entity Detection ─────────────────────────────────────────────

// Entities that, when multiple appear in a title, indicate a comparison paper
const KNOWN_ENTITIES: Record<string, string[]> = {
  investasi: ["saham", "emas", "deposito", "obligasi", "reksa dana", "reksadana", "properti", "kripto", "crypto", "bitcoin", "aset"],
  keuangan: ["hutang", "ekuitas", "modal", "kas", "piutang", "aset lancar", "aset tetap"],
  marketing: ["promosi", "harga", "produk", "distribusi", "tempat", "people", "proses", "bukti fisik"],
  msdm: ["rekrutmen", "seleksi", "pelatihan", "pengembangan", "kompensasi", "kinerja", "motivasi"],
  perpajakan: ["pph", "ppn", "bphtb", "cukai", "pajak daerah", "pajak pusat"],
  ekonomi: ["inflasi", "deflasi", "resesi", "ekspansif", "kontraktif", "fiskal", "moneter"],
};

function detectEntities(judul: string, discipline: AcademicDiscipline): string[] {
  const lower = judul.toLowerCase();
  const domainEntities = KNOWN_ENTITIES[discipline] ?? [];
  const found: string[] = [];

  for (const entity of domainEntities) {
    if (lower.includes(entity)) {
      found.push(entity);
    }
  }

  // Also extract capitalized words / specific nouns from title
  const words = judul.split(/\s+/);
  for (const word of words) {
    const w = word.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (w.length > 3 && !["dengan", "dalam", "pada", "untuk", "yang", "dan", "atau", "terhadap", "antara", "analisis", "perbandingan", "pengaruh", "hubungan", "studi", "kajian"].includes(w)) {
      if (!found.includes(w)) found.push(w);
    }
  }

  return found.slice(0, 8); // max 8 entities
}

// ─── Main Analysis Function ───────────────────────────────────────────────────

export function analyzeTopic(judul: string): TopicAnalysis {
  const lower = judul.toLowerCase();

  // Detect discipline (priority order)
  const priorityOrder: AcademicDiscipline[] = [
    "investasi", "perpajakan", "akuntansi", "keuangan",
    "bisnis_digital", "marketing", "msdm", "operasional",
    "kewirausahaan", "informatika", "komunikasi", "psikologi",
    "kesehatan", "hukum", "teknik", "pendidikan",
    "manajemen", "ekonomi", "general",
  ];

  let detected: AcademicDiscipline = "general";
  for (const disc of priorityOrder) {
    const { patterns } = DISCIPLINE_MAP[disc];
    if (disc === "general") { detected = "general"; break; }
    if (patterns.some((p) => p.test(lower))) {
      detected = disc;
      break;
    }
  }

  const def = DISCIPLINE_MAP[detected];
  const entities = detectEntities(judul, detected);

  // Detect comparison intent
  const comparisonIndicators = /perbandingan|membandingkan|versus|vs\b|perbedaan\s+antara|antara .+ dan .+|komparasi/i;
  const isComparison = comparisonIndicators.test(judul) || entities.length >= 2;

  // Build keyword list from title words + discipline support keywords
  const titleWords = judul
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !["dengan", "dalam", "pada", "untuk", "yang", "dan", "atau", "terhadap", "antara", "analisis", "perbandingan", "pengaruh", "hubungan", "studi", "kajian", "peran", "faktor"].includes(w));

  const keywords = Array.from(new Set([...entities.slice(0, 4), ...titleWords.slice(0, 4)])).slice(0, 6);

  // Build outline hints from entities + mustDiscuss
  const outlineHints: string[] = [];
  if (isComparison && entities.length >= 2) {
    outlineHints.push(`Pengertian ${def.label}`);
    for (const e of entities.slice(0, 5)) {
      outlineHints.push(e.charAt(0).toUpperCase() + e.slice(1));
    }
    outlineHints.push("Perbandingan");
    outlineHints.push("Kelebihan dan Kekurangan");
  } else {
    outlineHints.push(`Pengertian dan Konsep ${def.label}`);
    outlineHints.push(`Teori dan Landasan Ilmiah`);
    outlineHints.push(`Implementasi dan Aplikasi`);
    outlineHints.push(`Analisis dan Pembahasan`);
    if (entities.length > 0) {
      outlineHints.push(`Studi Kasus: ${entities[0].charAt(0).toUpperCase() + entities[0].slice(1)}`);
    }
  }

  return {
    bidang: detected,
    subbidang: def.subbidang,
    label: def.label,
    keywords,
    supportKeywords: def.supportKeywords,
    mustDiscuss: def.mustDiscuss,
    entities,
    isComparison,
    outlineHints,
  };
}
