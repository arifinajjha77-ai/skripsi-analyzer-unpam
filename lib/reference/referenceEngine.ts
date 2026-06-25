/**
 * SmartCampus — Academic Reference Intelligence Engine
 * Sprint 1: Reference Metadata Model + Verified Database
 *
 * INTEGRITY POLICY:
 *   - Only real, traceable references are included.
 *   - If metadata cannot be confirmed → verified: false (needs_verification).
 *   - DOIs are only included when confirmed. Never fabricated.
 *   - Seminal / classic works (pre-2000 or foundational theory) are flagged
 *     with isClassic: true and are exempt from age-limit rules.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReferenceType =
  | "book"
  | "journal"
  | "proceeding"
  | "thesis"
  | "website"
  | "report"
  | "standard";

/** Runtime validation status — set by referenceValidator.ts */
export type ReferenceStatus =
  | "verified"            // all metadata confirmed, age OK
  | "needs_verification"  // some metadata unconfirmed
  | "too_old"             // exceeds age limit for its type
  | "classic";            // seminal work, exempt from age rules

export type AcademicDisciplineRef =
  | "marketing"
  | "keuangan"
  | "investasi"
  | "akuntansi"
  | "perpajakan"
  | "msdm"
  | "manajemen"
  | "metodologi"
  | "ekonomi"
  | "statistik"
  | "general";

export interface AcademicReference {
  id:            string;
  author:        string;        // "Kotler, Philip & Keller, Kevin Lane"
  year:          number;
  title:         string;
  type:          ReferenceType;
  publisher?:    string;
  city?:         string;
  edition?:      string;
  journal?:      string;
  volume?:       string;
  issue?:        string;
  pages?:        string;
  doi?:          string;
  url?:          string;
  discipline:    AcademicDisciplineRef[];
  keywords:      string[];
  verified:      boolean;       // manually confirmed accuracy
  isClassic?:    boolean;       // age-rule exemption
  classicReason?: string;       // why it's a classic
}

// ─── Verified Reference Database ─────────────────────────────────────────────
// All entries are real published works. verified=true means core metadata
// (author, year, title, publisher) is confirmed.

export const REFERENCE_DB: AcademicReference[] = [

  // ── MANAJEMEN PEMASARAN ─────────────────────────────────────────────────────

  {
    id: "kotler_keller_2016",
    author: "Kotler, Philip & Keller, Kevin Lane",
    year: 2016,
    title: "Marketing Management",
    type: "book",
    edition: "15th",
    publisher: "Pearson Education",
    city: "Hoboken",
    discipline: ["marketing", "manajemen"],
    keywords: ["marketing", "manajemen pemasaran", "pemasaran", "strategi pemasaran"],
    verified: true,
  },
  {
    id: "kotler_armstrong_2018",
    author: "Kotler, Philip & Armstrong, Gary",
    year: 2018,
    title: "Principles of Marketing",
    type: "book",
    edition: "17th",
    publisher: "Pearson Education",
    city: "Hoboken",
    discipline: ["marketing", "manajemen"],
    keywords: ["marketing", "pemasaran", "prinsip pemasaran"],
    verified: true,
  },
  {
    id: "kotler_armstrong_2021",
    author: "Kotler, Philip & Armstrong, Gary",
    year: 2021,
    title: "Principles of Marketing",
    type: "book",
    edition: "18th",
    publisher: "Pearson Education",
    city: "Hoboken",
    discipline: ["marketing", "manajemen"],
    keywords: ["marketing", "pemasaran"],
    verified: true,
  },
  {
    id: "tjiptono_2014",
    author: "Tjiptono, Fandy",
    year: 2014,
    title: "Pemasaran Jasa – Prinsip, Penerapan, dan Penelitian",
    type: "book",
    publisher: "Andi Offset",
    city: "Yogyakarta",
    discipline: ["marketing"],
    keywords: ["jasa", "pemasaran jasa", "kualitas layanan", "kepuasan pelanggan"],
    verified: true,
  },
  {
    id: "tjiptono_chandra_2016",
    author: "Tjiptono, Fandy & Chandra, Gregorius",
    year: 2016,
    title: "Service, Quality & Satisfaction",
    type: "book",
    edition: "4th",
    publisher: "Andi Offset",
    city: "Yogyakarta",
    discipline: ["marketing"],
    keywords: ["kualitas layanan", "kepuasan pelanggan", "service quality", "servqual"],
    verified: true,
  },
  {
    id: "tjiptono_2015",
    author: "Tjiptono, Fandy",
    year: 2015,
    title: "Strategi Pemasaran",
    type: "book",
    edition: "4th",
    publisher: "Andi Offset",
    city: "Yogyakarta",
    discipline: ["marketing"],
    keywords: ["strategi pemasaran", "bauran pemasaran", "marketing mix"],
    verified: true,
  },
  {
    id: "kotler_1967",
    author: "Kotler, Philip",
    year: 1967,
    title: "Marketing Management: Analysis, Planning and Control",
    type: "book",
    edition: "1st",
    publisher: "Prentice-Hall",
    city: "Englewood Cliffs",
    discipline: ["marketing", "manajemen"],
    keywords: ["marketing", "pemasaran", "manajemen pemasaran"],
    verified: true,
    isClassic: true,
    classicReason: "Karya seminal yang mendefinisikan manajemen pemasaran modern",
  },
  {
    id: "shimp_2010",
    author: "Shimp, Terence A.",
    year: 2010,
    title: "Advertising, Promotion, and Other Aspects of Integrated Marketing Communications",
    type: "book",
    edition: "8th",
    publisher: "Cengage Learning",
    city: "Mason",
    discipline: ["marketing"],
    keywords: ["periklanan", "promosi", "komunikasi pemasaran terpadu", "IMC"],
    verified: true,
  },
  {
    id: "belch_2021",
    author: "Belch, George E. & Belch, Michael A.",
    year: 2021,
    title: "Advertising and Promotion: An Integrated Marketing Communications Perspective",
    type: "book",
    edition: "12th",
    publisher: "McGraw-Hill Education",
    city: "New York",
    discipline: ["marketing"],
    keywords: ["periklanan", "promosi", "iklan", "komunikasi pemasaran"],
    verified: true,
  },

  // ── KEUANGAN ─────────────────────────────────────────────────────────────────

  {
    id: "kasmir_2016_laporan",
    author: "Kasmir",
    year: 2016,
    title: "Analisis Laporan Keuangan",
    type: "book",
    edition: "Ed. Revisi",
    publisher: "Rajawali Pers",
    city: "Jakarta",
    discipline: ["keuangan", "akuntansi"],
    keywords: ["laporan keuangan", "analisis keuangan", "rasio keuangan"],
    verified: true,
  },
  {
    id: "kasmir_2014_bank",
    author: "Kasmir",
    year: 2014,
    title: "Bank dan Lembaga Keuangan Lainnya",
    type: "book",
    edition: "Ed. Revisi",
    publisher: "Rajawali Pers",
    city: "Jakarta",
    discipline: ["keuangan"],
    keywords: ["bank", "lembaga keuangan", "perbankan"],
    verified: true,
  },
  {
    id: "brigham_houston_2019",
    author: "Brigham, Eugene F. & Houston, Joel F.",
    year: 2019,
    title: "Fundamentals of Financial Management",
    type: "book",
    edition: "15th",
    publisher: "Cengage Learning",
    city: "Mason",
    discipline: ["keuangan"],
    keywords: ["manajemen keuangan", "financial management", "keuangan"],
    verified: true,
  },
  {
    id: "fahmi_2014",
    author: "Fahmi, Irham",
    year: 2014,
    title: "Manajemen Keuangan Perusahaan dan Pasar Modal",
    type: "book",
    publisher: "Mitra Wacana Media",
    city: "Jakarta",
    discipline: ["keuangan"],
    keywords: ["manajemen keuangan", "pasar modal", "keuangan perusahaan"],
    verified: true,
  },
  {
    id: "husnan_pudjiastuti_2015",
    author: "Husnan, Suad & Pudjiastuti, Enny",
    year: 2015,
    title: "Dasar-Dasar Manajemen Keuangan",
    type: "book",
    edition: "7th",
    publisher: "UPP STIM YKPN",
    city: "Yogyakarta",
    discipline: ["keuangan"],
    keywords: ["manajemen keuangan", "keuangan"],
    verified: true,
  },

  // ── INVESTASI ─────────────────────────────────────────────────────────────────

  {
    id: "tandelilin_2010",
    author: "Tandelilin, Eduardus",
    year: 2010,
    title: "Portofolio dan Investasi: Teori dan Aplikasi",
    type: "book",
    edition: "1st",
    publisher: "Kanisius",
    city: "Yogyakarta",
    discipline: ["investasi", "keuangan"],
    keywords: ["portofolio", "investasi", "saham", "obligasi", "reksa dana"],
    verified: true,
  },
  {
    id: "jogiyanto_2017",
    author: "Jogiyanto, Hartono",
    year: 2017,
    title: "Teori Portofolio dan Analisis Investasi",
    type: "book",
    edition: "11th",
    publisher: "BPFE-Yogyakarta",
    city: "Yogyakarta",
    discipline: ["investasi", "keuangan"],
    keywords: ["portofolio", "investasi", "analisis investasi", "saham"],
    verified: true,
  },
  {
    id: "halim_2015",
    author: "Halim, Abdul",
    year: 2015,
    title: "Analisis Investasi dan Aplikasinya dalam Aset Keuangan dan Aset Riil",
    type: "book",
    edition: "2nd",
    publisher: "Salemba Empat",
    city: "Jakarta",
    discipline: ["investasi", "keuangan"],
    keywords: ["investasi", "analisis investasi", "aset keuangan"],
    verified: true,
  },

  // ── AKUNTANSI ────────────────────────────────────────────────────────────────

  {
    id: "kieso_weygandt_warfield_2019",
    author: "Kieso, Donald E., Weygandt, Jerry J., & Warfield, Terry D.",
    year: 2019,
    title: "Intermediate Accounting",
    type: "book",
    edition: "17th",
    publisher: "Wiley",
    city: "Hoboken",
    discipline: ["akuntansi"],
    keywords: ["akuntansi", "intermediate accounting", "laporan keuangan"],
    verified: true,
  },
  {
    id: "weygandt_kimmel_kieso_2019",
    author: "Weygandt, Jerry J., Kimmel, Paul D., & Kieso, Donald E.",
    year: 2019,
    title: "Financial Accounting: IFRS Edition",
    type: "book",
    edition: "3rd",
    publisher: "Wiley",
    city: "Hoboken",
    discipline: ["akuntansi"],
    keywords: ["akuntansi keuangan", "IFRS", "financial accounting"],
    verified: true,
  },
  {
    id: "hery_2016",
    author: "Hery",
    year: 2016,
    title: "Analisis Laporan Keuangan: Integrated and Comprehensive Edition",
    type: "book",
    publisher: "Grasindo",
    city: "Jakarta",
    discipline: ["akuntansi", "keuangan"],
    keywords: ["laporan keuangan", "analisis laporan keuangan", "rasio keuangan"],
    verified: true,
  },
  {
    id: "hery_2017",
    author: "Hery",
    year: 2017,
    title: "Auditing dan Asurans",
    type: "book",
    publisher: "Grasindo",
    city: "Jakarta",
    discipline: ["akuntansi"],
    keywords: ["auditing", "pemeriksaan akuntansi", "asurans"],
    verified: true,
  },
  {
    id: "mulyadi_2016",
    author: "Mulyadi",
    year: 2016,
    title: "Sistem Akuntansi",
    type: "book",
    edition: "4th",
    publisher: "Salemba Empat",
    city: "Jakarta",
    discipline: ["akuntansi"],
    keywords: ["sistem akuntansi", "akuntansi"],
    verified: true,
  },

  // ── PERPAJAKAN ───────────────────────────────────────────────────────────────

  {
    id: "mardiasmo_2019",
    author: "Mardiasmo",
    year: 2019,
    title: "Perpajakan",
    type: "book",
    edition: "Edisi Terbaru",
    publisher: "Andi Offset",
    city: "Yogyakarta",
    discipline: ["perpajakan", "akuntansi"],
    keywords: ["perpajakan", "pajak", "pajak penghasilan", "PPN", "PPh"],
    verified: true,
  },
  {
    id: "waluyo_2017",
    author: "Waluyo",
    year: 2017,
    title: "Akuntansi Pajak",
    type: "book",
    edition: "6th",
    publisher: "Salemba Empat",
    city: "Jakarta",
    discipline: ["perpajakan", "akuntansi"],
    keywords: ["akuntansi pajak", "perpajakan", "pajak"],
    verified: true,
  },
  {
    id: "resmi_2019",
    author: "Resmi, Siti",
    year: 2019,
    title: "Perpajakan: Teori dan Kasus",
    type: "book",
    edition: "10th",
    publisher: "Salemba Empat",
    city: "Jakarta",
    discipline: ["perpajakan"],
    keywords: ["perpajakan", "pajak", "PPh", "PPN"],
    verified: true,
  },

  // ── MSDM / HRM ───────────────────────────────────────────────────────────────

  {
    id: "hasibuan_2016",
    author: "Hasibuan, Malayu S.P.",
    year: 2016,
    title: "Manajemen Sumber Daya Manusia",
    type: "book",
    edition: "Ed. Revisi",
    publisher: "Bumi Aksara",
    city: "Jakarta",
    discipline: ["msdm", "manajemen"],
    keywords: ["SDM", "sumber daya manusia", "manajemen SDM", "MSDM"],
    verified: true,
  },
  {
    id: "mangkunegara_2017",
    author: "Mangkunegara, A.A. Anwar Prabu",
    year: 2017,
    title: "Manajemen Sumber Daya Manusia Perusahaan",
    type: "book",
    publisher: "PT Remaja Rosdakarya",
    city: "Bandung",
    discipline: ["msdm", "manajemen"],
    keywords: ["SDM", "kinerja", "motivasi", "pengembangan karyawan"],
    verified: true,
  },
  {
    id: "dessler_2017",
    author: "Dessler, Gary",
    year: 2017,
    title: "Human Resource Management",
    type: "book",
    edition: "15th",
    publisher: "Pearson Education",
    city: "Hoboken",
    discipline: ["msdm"],
    keywords: ["HRM", "SDM", "human resource management", "rekrutmen"],
    verified: true,
  },
  {
    id: "rivai_sagala_2013",
    author: "Rivai, Veithzal & Sagala, Ella Jauvani",
    year: 2013,
    title: "Manajemen Sumber Daya Manusia untuk Perusahaan",
    type: "book",
    edition: "3rd",
    publisher: "Rajawali Pers",
    city: "Jakarta",
    discipline: ["msdm", "manajemen"],
    keywords: ["SDM", "sumber daya manusia", "kinerja karyawan"],
    verified: true,
  },
  {
    id: "maslow_1943",
    author: "Maslow, Abraham H.",
    year: 1943,
    title: "A Theory of Human Motivation",
    type: "journal",
    journal: "Psychological Review",
    volume: "50",
    issue: "4",
    pages: "370–396",
    discipline: ["msdm", "manajemen", "general"],
    keywords: ["motivasi", "hierarki kebutuhan", "kebutuhan", "Abraham Maslow"],
    verified: true,
    isClassic: true,
    classicReason: "Teori hierarki kebutuhan Maslow — landasan utama teori motivasi",
  },
  {
    id: "herzberg_1968",
    author: "Herzberg, Frederick",
    year: 1968,
    title: "One More Time: How Do You Motivate Employees?",
    type: "journal",
    journal: "Harvard Business Review",
    volume: "46",
    issue: "1",
    pages: "53–62",
    discipline: ["msdm", "manajemen"],
    keywords: ["motivasi", "teori dua faktor", "hygiene", "satisfier", "Herzberg"],
    verified: true,
    isClassic: true,
    classicReason: "Teori dua faktor Herzberg — salah satu teori motivasi paling berpengaruh",
  },

  // ── MANAJEMEN UMUM ────────────────────────────────────────────────────────────

  {
    id: "robbins_coulter_2018",
    author: "Robbins, Stephen P. & Coulter, Mary",
    year: 2018,
    title: "Management",
    type: "book",
    edition: "14th",
    publisher: "Pearson Education",
    city: "Hoboken",
    discipline: ["manajemen"],
    keywords: ["manajemen", "organisasi", "kepemimpinan", "perencanaan"],
    verified: true,
  },
  {
    id: "porter_1980",
    author: "Porter, Michael E.",
    year: 1980,
    title: "Competitive Strategy: Techniques for Analyzing Industries and Competitors",
    type: "book",
    publisher: "Free Press",
    city: "New York",
    discipline: ["manajemen", "marketing"],
    keywords: ["strategi kompetitif", "analisis industri", "five forces", "Porter"],
    verified: true,
    isClassic: true,
    classicReason: "Model Five Forces Porter — kerangka analisis persaingan bisnis yang paling digunakan",
  },
  {
    id: "porter_1985",
    author: "Porter, Michael E.",
    year: 1985,
    title: "Competitive Advantage: Creating and Sustaining Superior Performance",
    type: "book",
    publisher: "Free Press",
    city: "New York",
    discipline: ["manajemen", "marketing"],
    keywords: ["keunggulan kompetitif", "value chain", "rantai nilai", "strategi"],
    verified: true,
    isClassic: true,
    classicReason: "Konsep value chain Porter — fondasi analisis keunggulan kompetitif",
  },

  // ── EKONOMI UMUM ──────────────────────────────────────────────────────────────

  {
    id: "mankiw_2019",
    author: "Mankiw, N. Gregory",
    year: 2019,
    title: "Principles of Economics",
    type: "book",
    edition: "8th",
    publisher: "Cengage Learning",
    city: "Mason",
    discipline: ["ekonomi"],
    keywords: ["ekonomi", "prinsip ekonomi", "makroekonomi", "mikroekonomi"],
    verified: true,
  },
  {
    id: "sukirno_2016",
    author: "Sukirno, Sadono",
    year: 2016,
    title: "Mikro Ekonomi: Teori Pengantar",
    type: "book",
    edition: "3rd",
    publisher: "Rajawali Pers",
    city: "Jakarta",
    discipline: ["ekonomi"],
    keywords: ["mikroekonomi", "pengantar ekonomi", "permintaan", "penawaran"],
    verified: true,
  },

  // ── METODOLOGI PENELITIAN ────────────────────────────────────────────────────

  {
    id: "sugiyono_2019",
    author: "Sugiyono",
    year: 2019,
    title: "Metode Penelitian Kuantitatif, Kualitatif, dan R&D",
    type: "book",
    publisher: "Alfabeta",
    city: "Bandung",
    discipline: ["metodologi"],
    keywords: ["metodologi penelitian", "kuantitatif", "kualitatif", "R&D", "populasi", "sampel"],
    verified: true,
  },
  {
    id: "sugiyono_2017",
    author: "Sugiyono",
    year: 2017,
    title: "Statistika untuk Penelitian",
    type: "book",
    publisher: "Alfabeta",
    city: "Bandung",
    discipline: ["metodologi", "statistik"],
    keywords: ["statistik", "penelitian", "uji hipotesis", "regresi"],
    verified: true,
  },
  {
    id: "sekaran_bougie_2016",
    author: "Sekaran, Uma & Bougie, Roger",
    year: 2016,
    title: "Research Methods for Business: A Skill-Building Approach",
    type: "book",
    edition: "7th",
    publisher: "Wiley",
    city: "Chichester",
    discipline: ["metodologi"],
    keywords: ["metodologi penelitian", "research methods", "bisnis"],
    verified: true,
  },
  {
    id: "ghozali_2018",
    author: "Ghozali, Imam",
    year: 2018,
    title: "Aplikasi Analisis Multivariate dengan Program IBM SPSS 25",
    type: "book",
    edition: "9th",
    publisher: "Badan Penerbit Universitas Diponegoro",
    city: "Semarang",
    discipline: ["metodologi", "statistik"],
    keywords: ["SPSS", "analisis multivariate", "regresi", "uji validitas", "uji reliabilitas"],
    verified: true,
  },
  {
    id: "arikunto_2019",
    author: "Arikunto, Suharsimi",
    year: 2019,
    title: "Prosedur Penelitian: Suatu Pendekatan Praktik",
    type: "book",
    edition: "Ed. Revisi",
    publisher: "Rineka Cipta",
    city: "Jakarta",
    discipline: ["metodologi"],
    keywords: ["prosedur penelitian", "metodologi", "instrumen penelitian"],
    verified: true,
  },
  {
    id: "arikunto_2013",
    author: "Arikunto, Suharsimi",
    year: 2013,
    title: "Prosedur Penelitian: Suatu Pendekatan Praktik",
    type: "book",
    edition: "Ed. Revisi",
    publisher: "Rineka Cipta",
    city: "Jakarta",
    discipline: ["metodologi"],
    keywords: ["prosedur penelitian", "metodologi", "instrumen"],
    verified: true,
  },

  // ── STATISTIK ────────────────────────────────────────────────────────────────

  {
    id: "santoso_2010",
    author: "Santoso, Singgih",
    year: 2010,
    title: "Statistik Parametrik: Konsep dan Aplikasi dengan SPSS",
    type: "book",
    publisher: "Elex Media Komputindo",
    city: "Jakarta",
    discipline: ["statistik", "metodologi"],
    keywords: ["statistik parametrik", "SPSS", "uji t", "uji F", "regresi"],
    verified: true,
  },

  // ── GENERAL MANAGEMENT CLASSICS ──────────────────────────────────────────────

  {
    id: "drucker_1954",
    author: "Drucker, Peter F.",
    year: 1954,
    title: "The Practice of Management",
    type: "book",
    publisher: "Harper & Brothers",
    city: "New York",
    discipline: ["manajemen", "general"],
    keywords: ["manajemen", "organisasi", "Peter Drucker"],
    verified: true,
    isClassic: true,
    classicReason: "Karya seminal Peter Drucker yang mendefinisikan praktik manajemen modern",
  },
  {
    id: "taylor_1911",
    author: "Taylor, Frederick Winslow",
    year: 1911,
    title: "The Principles of Scientific Management",
    type: "book",
    publisher: "Harper & Brothers",
    city: "New York",
    discipline: ["manajemen", "msdm"],
    keywords: ["manajemen ilmiah", "scientific management", "efisiensi", "Taylor"],
    verified: true,
    isClassic: true,
    classicReason: "Prinsip manajemen ilmiah Taylor — karya perintis manajemen modern",
  },
];

// ─── Lookup Helpers ───────────────────────────────────────────────────────────

/** Get a reference by ID */
export function getReferenceById(id: string): AcademicReference | undefined {
  return REFERENCE_DB.find((r) => r.id === id);
}

/** Get all references for one or more disciplines */
export function getReferencesByDiscipline(
  disciplines: AcademicDisciplineRef[]
): AcademicReference[] {
  return REFERENCE_DB.filter((r) =>
    r.discipline.some((d) => disciplines.includes(d))
  );
}

/** Get all classic references */
export function getClassicReferences(): AcademicReference[] {
  return REFERENCE_DB.filter((r) => r.isClassic);
}

/** Search by keyword (case-insensitive) */
export function searchReferences(query: string): AcademicReference[] {
  const q = query.toLowerCase();
  return REFERENCE_DB.filter(
    (r) =>
      r.title.toLowerCase().includes(q) ||
      r.author.toLowerCase().includes(q) ||
      r.keywords.some((k) => k.toLowerCase().includes(q))
  );
}
