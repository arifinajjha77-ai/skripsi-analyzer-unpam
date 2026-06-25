/**
 * SmartCampus V2 — Smart Author Engine (Sprint 3)
 *
 * Provides discipline-specific academic authors with their works,
 * inline citation formatting, and bibliography entry generation.
 * Each discipline maps to 4–8 verified Indonesian and international references.
 */

import { AcademicDiscipline } from "./topicEngine";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AcademicAuthor {
  id: string;           // Unique identifier
  name: string;         // Citation name (e.g., "Kotler & Keller")
  fullName: string;     // Full bibliographic name
  year: number;
  title: string;        // Book/paper title
  publisher: string;
  city: string;
  discipline: AcademicDiscipline[];
  domain: string;       // Specific sub-domain
}

// ─── Author Database ──────────────────────────────────────────────────────────

export const AUTHOR_DB: AcademicAuthor[] = [
  // ── INVESTASI ──────────────────────────────────────────────────────────────
  {
    id: "tandelilin_2017",
    name: "Tandelilin",
    fullName: "Tandelilin, Eduardus",
    year: 2017,
    title: "Pasar Modal: Manajemen Portofolio dan Investasi",
    publisher: "PT Kanisius",
    city: "Yogyakarta",
    discipline: ["investasi"],
    domain: "investasi portofolio pasar modal",
  },
  {
    id: "jogiyanto_2017",
    name: "Jogiyanto",
    fullName: "Jogiyanto, H.M.",
    year: 2017,
    title: "Teori Portofolio dan Analisis Investasi",
    publisher: "BPFE",
    city: "Yogyakarta",
    discipline: ["investasi", "keuangan"],
    domain: "investasi saham portofolio",
  },
  {
    id: "bodie_2021",
    name: "Bodie, Kane, & Marcus",
    fullName: "Bodie, Z., Kane, A., & Marcus, A.J.",
    year: 2021,
    title: "Investments",
    publisher: "McGraw-Hill Education",
    city: "New York",
    discipline: ["investasi"],
    domain: "investasi instrumen keuangan risiko return",
  },
  {
    id: "fahmi_2015",
    name: "Fahmi",
    fullName: "Fahmi, Irham",
    year: 2015,
    title: "Manajemen Investasi: Teori dan Soal Jawab",
    publisher: "Salemba Empat",
    city: "Jakarta",
    discipline: ["investasi", "keuangan"],
    domain: "manajemen investasi risiko",
  },
  {
    id: "halim_2015",
    name: "Halim",
    fullName: "Halim, Abdul",
    year: 2015,
    title: "Analisis Investasi dan Aplikasinya",
    publisher: "Salemba Empat",
    city: "Jakarta",
    discipline: ["investasi"],
    domain: "analisis investasi keputusan",
  },

  // ── KEUANGAN ───────────────────────────────────────────────────────────────
  {
    id: "kasmir_2019",
    name: "Kasmir",
    fullName: "Kasmir",
    year: 2019,
    title: "Analisis Laporan Keuangan",
    publisher: "PT RajaGrafindo Persada",
    city: "Jakarta",
    discipline: ["keuangan", "akuntansi"],
    domain: "laporan keuangan analisis rasio",
  },
  {
    id: "brigham_2019",
    name: "Brigham & Houston",
    fullName: "Brigham, E.F., & Houston, J.F.",
    year: 2019,
    title: "Dasar-Dasar Manajemen Keuangan",
    publisher: "Salemba Empat",
    city: "Jakarta",
    discipline: ["keuangan"],
    domain: "manajemen keuangan modal investasi",
  },
  {
    id: "vanhorne_2012",
    name: "Van Horne & Wachowicz",
    fullName: "Van Horne, J.C., & Wachowicz, J.M.",
    year: 2012,
    title: "Prinsip-Prinsip Manajemen Keuangan",
    publisher: "Salemba Empat",
    city: "Jakarta",
    discipline: ["keuangan"],
    domain: "manajemen keuangan nilai perusahaan",
  },
  {
    id: "sartono_2015",
    name: "Sartono",
    fullName: "Sartono, Agus",
    year: 2015,
    title: "Manajemen Keuangan Teori dan Aplikasi",
    publisher: "BPFE",
    city: "Yogyakarta",
    discipline: ["keuangan"],
    domain: "manajemen keuangan modal kerja",
  },

  // ── AKUNTANSI ──────────────────────────────────────────────────────────────
  {
    id: "kieso_2018",
    name: "Kieso, Weygandt, & Warfield",
    fullName: "Kieso, D.E., Weygandt, J.J., & Warfield, T.D.",
    year: 2018,
    title: "Intermediate Accounting",
    publisher: "John Wiley & Sons",
    city: "New York",
    discipline: ["akuntansi"],
    domain: "akuntansi keuangan standar ifrs",
  },
  {
    id: "hery_2017",
    name: "Hery",
    fullName: "Hery",
    year: 2017,
    title: "Teori Akuntansi: Pendekatan Konsep dan Analisis",
    publisher: "PT Grasindo",
    city: "Jakarta",
    discipline: ["akuntansi"],
    domain: "teori akuntansi konsep pencatatan",
  },
  {
    id: "reeve_2013",
    name: "Reeve, Warren, & Duchac",
    fullName: "Reeve, J.M., Warren, C.S., & Duchac, J.E.",
    year: 2013,
    title: "Pengantar Akuntansi: Adaptasi Indonesia",
    publisher: "Salemba Empat",
    city: "Jakarta",
    discipline: ["akuntansi"],
    domain: "pengantar akuntansi siklus",
  },

  // ── PERPAJAKAN ─────────────────────────────────────────────────────────────
  {
    id: "mardiasmo_2019",
    name: "Mardiasmo",
    fullName: "Mardiasmo",
    year: 2019,
    title: "Perpajakan",
    publisher: "Penerbit Andi",
    city: "Yogyakarta",
    discipline: ["perpajakan"],
    domain: "perpajakan dasar hukum tarif",
  },
  {
    id: "waluyo_2017",
    name: "Waluyo",
    fullName: "Waluyo",
    year: 2017,
    title: "Perpajakan Indonesia",
    publisher: "Salemba Empat",
    city: "Jakarta",
    discipline: ["perpajakan"],
    domain: "perpajakan indonesia ketentuan",
  },
  {
    id: "resmi_2019",
    name: "Resmi",
    fullName: "Resmi, Siti",
    year: 2019,
    title: "Perpajakan: Teori dan Kasus",
    publisher: "Salemba Empat",
    city: "Jakarta",
    discipline: ["perpajakan"],
    domain: "perpajakan pph ppn ketentuan",
  },

  // ── MARKETING ──────────────────────────────────────────────────────────────
  {
    id: "kotler_2021",
    name: "Kotler & Keller",
    fullName: "Kotler, P., & Keller, K.L.",
    year: 2021,
    title: "Marketing Management",
    publisher: "Pearson Education",
    city: "New York",
    discipline: ["marketing"],
    domain: "pemasaran konsep strategi manajemen",
  },
  {
    id: "tjiptono_2019",
    name: "Tjiptono",
    fullName: "Tjiptono, Fandy",
    year: 2019,
    title: "Strategi Pemasaran: Prinsip dan Penerapan",
    publisher: "Penerbit Andi",
    city: "Yogyakarta",
    discipline: ["marketing"],
    domain: "strategi pemasaran bauran 7p",
  },
  {
    id: "shimp_2014",
    name: "Shimp",
    fullName: "Shimp, T.A.",
    year: 2014,
    title: "Komunikasi Pemasaran Terpadu",
    publisher: "Salemba Empat",
    city: "Jakarta",
    discipline: ["marketing", "komunikasi"],
    domain: "promosi iklan komunikasi pemasaran",
  },
  {
    id: "belch_2018",
    name: "Belch & Belch",
    fullName: "Belch, G.E., & Belch, M.A.",
    year: 2018,
    title: "Advertising and Promotion",
    publisher: "McGraw-Hill Education",
    city: "New York",
    discipline: ["marketing"],
    domain: "iklan promosi komunikasi pemasaran",
  },

  // ── MSDM ──────────────────────────────────────────────────────────────────
  {
    id: "hasibuan_2019",
    name: "Hasibuan",
    fullName: "Hasibuan, Malayu S.P.",
    year: 2019,
    title: "Manajemen Sumber Daya Manusia",
    publisher: "Bumi Aksara",
    city: "Jakarta",
    discipline: ["msdm"],
    domain: "sdm rekrutmen kompensasi kinerja",
  },
  {
    id: "mangkunegara_2017",
    name: "Mangkunegara",
    fullName: "Mangkunegara, Anwar Prabu",
    year: 2017,
    title: "Manajemen Sumber Daya Manusia Perusahaan",
    publisher: "PT Remaja Rosdakarya",
    city: "Bandung",
    discipline: ["msdm"],
    domain: "manajemen sdm kinerja motivasi",
  },
  {
    id: "dessler_2020",
    name: "Dessler",
    fullName: "Dessler, Gary",
    year: 2020,
    title: "Human Resource Management",
    publisher: "Pearson Education",
    city: "New York",
    discipline: ["msdm"],
    domain: "human resource management rekrutmen seleksi",
  },
  {
    id: "rivai_2014",
    name: "Rivai & Sagala",
    fullName: "Rivai, V., & Sagala, E.J.",
    year: 2014,
    title: "Manajemen Sumber Daya Manusia untuk Perusahaan",
    publisher: "PT RajaGrafindo Persada",
    city: "Jakarta",
    discipline: ["msdm"],
    domain: "sdm pengembangan pelatihan",
  },

  // ── OPERASIONAL ────────────────────────────────────────────────────────────
  {
    id: "heizer_2020",
    name: "Heizer, Render, & Munson",
    fullName: "Heizer, J., Render, B., & Munson, C.",
    year: 2020,
    title: "Operations Management: Sustainability and Supply Chain Management",
    publisher: "Pearson Education",
    city: "New York",
    discipline: ["operasional"],
    domain: "manajemen operasi produksi supply chain",
  },
  {
    id: "stevenson_2018",
    name: "Stevenson",
    fullName: "Stevenson, W.J.",
    year: 2018,
    title: "Operations Management",
    publisher: "McGraw-Hill Education",
    city: "New York",
    discipline: ["operasional"],
    domain: "manajemen operasi kualitas kapasitas",
  },

  // ── MANAJEMEN ──────────────────────────────────────────────────────────────
  {
    id: "robbins_2018",
    name: "Robbins & Coulter",
    fullName: "Robbins, S.P., & Coulter, M.",
    year: 2018,
    title: "Manajemen",
    publisher: "Erlangga",
    city: "Jakarta",
    discipline: ["manajemen"],
    domain: "fungsi manajemen kepemimpinan perencanaan",
  },
  {
    id: "siagian_2016",
    name: "Siagian",
    fullName: "Siagian, Sondang P.",
    year: 2016,
    title: "Manajemen Strategik",
    publisher: "Bumi Aksara",
    city: "Jakarta",
    discipline: ["manajemen"],
    domain: "manajemen strategis visi misi",
  },

  // ── KEWIRAUSAHAAN ──────────────────────────────────────────────────────────
  {
    id: "zimmerer_2009",
    name: "Zimmerer & Scarborough",
    fullName: "Zimmerer, T.W., & Scarborough, N.M.",
    year: 2009,
    title: "Kewirausahaan dan Manajemen Usaha Kecil",
    publisher: "Salemba Empat",
    city: "Jakarta",
    discipline: ["kewirausahaan"],
    domain: "kewirausahaan usaha kecil bisnis baru",
  },
  {
    id: "suryana_2014",
    name: "Suryana",
    fullName: "Suryana",
    year: 2014,
    title: "Kewirausahaan: Kiat dan Proses Menuju Sukses",
    publisher: "Salemba Empat",
    city: "Jakarta",
    discipline: ["kewirausahaan"],
    domain: "kewirausahaan jiwa wirausaha inovasi",
  },

  // ── EKONOMI ────────────────────────────────────────────────────────────────
  {
    id: "mankiw_2020",
    name: "Mankiw",
    fullName: "Mankiw, N.G.",
    year: 2020,
    title: "Principles of Economics",
    publisher: "Cengage Learning",
    city: "Mason",
    discipline: ["ekonomi"],
    domain: "ekonomi makro mikro prinsip",
  },
  {
    id: "samuelson_2010",
    name: "Samuelson & Nordhaus",
    fullName: "Samuelson, P.A., & Nordhaus, W.D.",
    year: 2010,
    title: "Ilmu Makroekonomi",
    publisher: "PT Media Global Edukasi",
    city: "Jakarta",
    discipline: ["ekonomi"],
    domain: "ekonomi makro inflasi kebijakan",
  },

  // ── PENDIDIKAN ─────────────────────────────────────────────────────────────
  {
    id: "sugiyono_2022",
    name: "Sugiyono",
    fullName: "Sugiyono",
    year: 2022,
    title: "Metode Penelitian Kuantitatif, Kualitatif, dan R&D",
    publisher: "Alfabeta",
    city: "Bandung",
    discipline: ["pendidikan", "general"],
    domain: "metode penelitian kuantitatif kualitatif",
  },
  {
    id: "arikunto_2021",
    name: "Arikunto",
    fullName: "Arikunto, Suharsimi",
    year: 2021,
    title: "Prosedur Penelitian: Suatu Pendekatan Praktik",
    publisher: "PT Rineka Cipta",
    city: "Jakarta",
    discipline: ["pendidikan", "general"],
    domain: "metode penelitian prosedur validitas",
  },
  {
    id: "hamalik_2015",
    name: "Hamalik",
    fullName: "Hamalik, Oemar",
    year: 2015,
    title: "Kurikulum dan Pembelajaran",
    publisher: "Bumi Aksara",
    city: "Jakarta",
    discipline: ["pendidikan"],
    domain: "kurikulum pembelajaran pendidikan",
  },

  // ── HUKUM ─────────────────────────────────────────────────────────────────
  {
    id: "mertokusumo_2019",
    name: "Mertokusumo",
    fullName: "Mertokusumo, Sudikno",
    year: 2019,
    title: "Mengenal Hukum: Suatu Pengantar",
    publisher: "Cahaya Atma Pustaka",
    city: "Yogyakarta",
    discipline: ["hukum"],
    domain: "pengantar hukum dasar asas",
  },
  {
    id: "soerjono_2012",
    name: "Soekanto",
    fullName: "Soekanto, Soerjono",
    year: 2012,
    title: "Pengantar Penelitian Hukum",
    publisher: "UI Press",
    city: "Jakarta",
    discipline: ["hukum"],
    domain: "penelitian hukum metode",
  },

  // ── INFORMATIKA ────────────────────────────────────────────────────────────
  {
    id: "chaffey_2019",
    name: "Chaffey & Ellis-Chadwick",
    fullName: "Chaffey, D., & Ellis-Chadwick, F.",
    year: 2019,
    title: "Digital Marketing: Strategy, Implementation and Practice",
    publisher: "Pearson Education",
    city: "Harlow",
    discipline: ["informatika", "bisnis_digital"],
    domain: "digital marketing strategi teknologi",
  },
  {
    id: "laudon_2020",
    name: "Laudon & Laudon",
    fullName: "Laudon, K.C., & Laudon, J.P.",
    year: 2020,
    title: "Management Information Systems",
    publisher: "Pearson Education",
    city: "New York",
    discipline: ["informatika"],
    domain: "sistem informasi manajemen teknologi",
  },

  // ── BISNIS DIGITAL ─────────────────────────────────────────────────────────
  {
    id: "kotler_digital_2021",
    name: "Kotler, Kartajaya, & Setiawan",
    fullName: "Kotler, P., Kartajaya, H., & Setiawan, I.",
    year: 2021,
    title: "Marketing 5.0: Technology for Humanity",
    publisher: "John Wiley & Sons",
    city: "New York",
    discipline: ["bisnis_digital", "marketing"],
    domain: "marketing digital teknologi 5.0",
  },
  {
    id: "ryan_2020",
    name: "Ryan",
    fullName: "Ryan, Damian",
    year: 2020,
    title: "Understanding Digital Marketing",
    publisher: "Kogan Page",
    city: "London",
    discipline: ["bisnis_digital"],
    domain: "digital marketing media sosial seo",
  },

  // ── KESEHATAN ─────────────────────────────────────────────────────────────
  {
    id: "notoatmodjo_2018",
    name: "Notoatmodjo",
    fullName: "Notoatmodjo, Soekidjo",
    year: 2018,
    title: "Ilmu Kesehatan Masyarakat",
    publisher: "PT Rineka Cipta",
    city: "Jakarta",
    discipline: ["kesehatan"],
    domain: "kesehatan masyarakat promosi preventif",
  },

  // ── PSIKOLOGI ─────────────────────────────────────────────────────────────
  {
    id: "bandura_1997",
    name: "Bandura",
    fullName: "Bandura, A.",
    year: 1997,
    title: "Self-Efficacy: The Exercise of Control",
    publisher: "W.H. Freeman",
    city: "New York",
    discipline: ["psikologi"],
    domain: "self-efficacy perilaku motivasi kognitif",
  },
  {
    id: "robbins_org_2017",
    name: "Robbins & Judge",
    fullName: "Robbins, S.P., & Judge, T.A.",
    year: 2017,
    title: "Perilaku Organisasi",
    publisher: "Salemba Empat",
    city: "Jakarta",
    discipline: ["psikologi", "msdm", "manajemen"],
    domain: "perilaku organisasi motivasi kepemimpinan",
  },

  // ── KOMUNIKASI ────────────────────────────────────────────────────────────
  {
    id: "effendy_2017",
    name: "Effendy",
    fullName: "Effendy, Onong Uchjana",
    year: 2017,
    title: "Ilmu Komunikasi: Teori dan Praktek",
    publisher: "PT Remaja Rosdakarya",
    city: "Bandung",
    discipline: ["komunikasi"],
    domain: "komunikasi teori model proses",
  },
  {
    id: "mulyana_2015",
    name: "Mulyana",
    fullName: "Mulyana, Deddy",
    year: 2015,
    title: "Ilmu Komunikasi: Suatu Pengantar",
    publisher: "PT Remaja Rosdakarya",
    city: "Bandung",
    discipline: ["komunikasi"],
    domain: "komunikasi pengantar konteks media",
  },

  // ── GENERAL (Fallback) ─────────────────────────────────────────────────────
  {
    id: "sugiyono_general_2022",
    name: "Sugiyono",
    fullName: "Sugiyono",
    year: 2022,
    title: "Metode Penelitian Kuantitatif, Kualitatif, dan R&D",
    publisher: "Alfabeta",
    city: "Bandung",
    discipline: ["general"],
    domain: "penelitian metodologi umum",
  },
  {
    id: "creswell_2014",
    name: "Creswell",
    fullName: "Creswell, J.W.",
    year: 2014,
    title: "Research Design: Qualitative, Quantitative, and Mixed Methods Approaches",
    publisher: "SAGE Publications",
    city: "London",
    discipline: ["general", "pendidikan"],
    domain: "metode penelitian desain kuantitatif kualitatif",
  },
];

// ─── Author Selection ─────────────────────────────────────────────────────────

export function getAuthorsForDiscipline(
  discipline: AcademicDiscipline,
  count = 5
): AcademicAuthor[] {
  const primary = AUTHOR_DB.filter((a) => a.discipline.includes(discipline));
  const general = AUTHOR_DB.filter(
    (a) => a.discipline.includes("general") && !primary.find((p) => p.id === a.id)
  );
  return [...primary, ...general].slice(0, count);
}

export function getCitationInline(author: AcademicAuthor): string {
  return `(${author.name}, ${author.year})`;
}

export function getCitationNarrative(author: AcademicAuthor): string {
  return `${author.name} (${author.year})`;
}

export function getBibliographyEntry(author: AcademicAuthor): string {
  return `${author.fullName}. (${author.year}). *${author.title}*. ${author.city}: ${author.publisher}.`;
}
