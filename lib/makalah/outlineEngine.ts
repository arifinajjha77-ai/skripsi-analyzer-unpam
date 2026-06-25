/**
 * SmartCampus V2 — Dynamic Outline Engine (Sprint 4)
 *
 * Generates a dynamic BAB II outline based on topic analysis.
 * Each section knows its entity, whether it needs a table, and what to discuss.
 */

import { TopicAnalysis, AcademicDiscipline } from "./topicEngine";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OutlineSection {
  number: string;          // "2.1", "2.2", etc.
  title: string;           // Full section title
  entity: string;          // Primary entity this section covers
  sectionType: SectionType;
  needsTable: boolean;     // Whether to auto-generate a comparison table
  tableType?: TableType;   // Type of table if needed
  depth: "intro" | "core" | "analysis" | "comparison" | "conclusion";
}

export type SectionType =
  | "definition"     // Pengertian / Konsep Dasar
  | "theory"         // Teori dan Landasan Ilmiah
  | "entity"         // Specific topic entity (e.g., Saham, Emas)
  | "comparison"     // Perbandingan
  | "implementation" // Implementasi / Penerapan
  | "analysis"       // Analisis dan Pembahasan
  | "casestudy"      // Studi Kasus
  | "conclusion"     // Kesimpulan section-level

export type TableType =
  | "comparison"    // Multiple entities compared (e.g., investasi instruments)
  | "advantages"    // Kelebihan vs Kekurangan
  | "categories"    // Taxonomy / classification
  | "criteria"      // Criteria / indicators
  | "strategies"    // Strategy comparison

// ─── Discipline-Specific Outline Templates ────────────────────────────────────

interface OutlineTemplate {
  sections: Array<{
    titleTemplate: string;  // "{entity}" gets replaced with actual entity
    sectionType: SectionType;
    depth: OutlineSection["depth"];
    needsTable?: boolean;
    tableType?: TableType;
  }>;
}

const DISCIPLINE_TEMPLATES: Record<AcademicDiscipline, OutlineTemplate> = {
  investasi: {
    sections: [
      { titleTemplate: "Tinjauan Investasi",              sectionType: "definition",     depth: "intro" },
      { titleTemplate: "Instrumen Investasi",             sectionType: "theory",         depth: "intro" },
      // Entity sections injected dynamically
      { titleTemplate: "Perbandingan Instrumen Investasi",sectionType: "comparison",     depth: "comparison", needsTable: true, tableType: "comparison" },
      { titleTemplate: "Faktor-Faktor yang Mempengaruhi Keputusan Investasi", sectionType: "analysis", depth: "analysis" },
    ],
  },
  keuangan: {
    sections: [
      { titleTemplate: "Manajemen Keuangan",              sectionType: "definition",     depth: "intro" },
      { titleTemplate: "Laporan Keuangan",                sectionType: "entity",         depth: "core" },
      { titleTemplate: "Analisis Rasio Keuangan",         sectionType: "analysis",       depth: "core", needsTable: true, tableType: "categories" },
      { titleTemplate: "Modal Kerja",                     sectionType: "entity",         depth: "core" },
      { titleTemplate: "Keputusan Keuangan",              sectionType: "analysis",       depth: "analysis" },
    ],
  },
  akuntansi: {
    sections: [
      { titleTemplate: "Konsep Dasar Akuntansi",          sectionType: "definition",     depth: "intro" },
      { titleTemplate: "Siklus Akuntansi",                sectionType: "entity",         depth: "core" },
      { titleTemplate: "Laporan Keuangan",                sectionType: "entity",         depth: "core", needsTable: true, tableType: "categories" },
      { titleTemplate: "Standar Akuntansi Keuangan",      sectionType: "theory",         depth: "core" },
      { titleTemplate: "Analisis Laporan Keuangan",       sectionType: "analysis",       depth: "analysis" },
    ],
  },
  perpajakan: {
    sections: [
      { titleTemplate: "Pengertian dan Fungsi Pajak",     sectionType: "definition",     depth: "intro" },
      { titleTemplate: "Dasar Hukum Perpajakan",          sectionType: "theory",         depth: "intro" },
      // Entity sections (jenis pajak) injected dynamically
      { titleTemplate: "Subjek dan Objek Pajak",          sectionType: "entity",         depth: "core", needsTable: true, tableType: "categories" },
      { titleTemplate: "Tarif dan Mekanisme Perhitungan", sectionType: "analysis",       depth: "analysis", needsTable: true, tableType: "criteria" },
      { titleTemplate: "Kepatuhan dan Sanksi Perpajakan", sectionType: "analysis",       depth: "analysis" },
    ],
  },
  marketing: {
    sections: [
      { titleTemplate: "Konsep Dasar Pemasaran",          sectionType: "definition",     depth: "intro" },
      { titleTemplate: "Bauran Pemasaran (Marketing Mix)",sectionType: "theory",         depth: "core", needsTable: true, tableType: "categories" },
      { titleTemplate: "Segmentasi, Targeting, dan Positioning", sectionType: "entity", depth: "core" },
      { titleTemplate: "Perilaku Konsumen",               sectionType: "entity",         depth: "core" },
      { titleTemplate: "Strategi Pemasaran",              sectionType: "analysis",       depth: "analysis", needsTable: true, tableType: "strategies" },
    ],
  },
  msdm: {
    sections: [
      { titleTemplate: "Manajemen Sumber Daya Manusia",   sectionType: "definition",     depth: "intro" },
      { titleTemplate: "Rekrutmen dan Seleksi",            sectionType: "entity",         depth: "core" },
      { titleTemplate: "Pelatihan dan Pengembangan",       sectionType: "entity",         depth: "core" },
      { titleTemplate: "Kompensasi dan Motivasi",          sectionType: "entity",         depth: "core" },
      { titleTemplate: "Penilaian Kinerja Karyawan",       sectionType: "analysis",       depth: "analysis", needsTable: true, tableType: "criteria" },
    ],
  },
  operasional: {
    sections: [
      { titleTemplate: "Manajemen Operasi",               sectionType: "definition",     depth: "intro" },
      { titleTemplate: "Proses Produksi dan Kapasitas",   sectionType: "entity",         depth: "core" },
      { titleTemplate: "Manajemen Kualitas",              sectionType: "entity",         depth: "core", needsTable: true, tableType: "criteria" },
      { titleTemplate: "Supply Chain Management",         sectionType: "entity",         depth: "core" },
      { titleTemplate: "Efisiensi Operasional",           sectionType: "analysis",       depth: "analysis" },
    ],
  },
  manajemen: {
    sections: [
      { titleTemplate: "Konsep dan Fungsi Manajemen",     sectionType: "definition",     depth: "intro" },
      { titleTemplate: "Perencanaan Strategis",           sectionType: "entity",         depth: "core" },
      { titleTemplate: "Kepemimpinan dan Pengambilan Keputusan", sectionType: "entity",  depth: "core" },
      { titleTemplate: "Pengendalian dan Evaluasi",       sectionType: "analysis",       depth: "analysis" },
      { titleTemplate: "Analisis Lingkungan Bisnis (SWOT)", sectionType: "analysis",     depth: "analysis", needsTable: true, tableType: "comparison" },
    ],
  },
  kewirausahaan: {
    sections: [
      { titleTemplate: "Konsep Kewirausahaan",            sectionType: "definition",     depth: "intro" },
      { titleTemplate: "Karakteristik dan Jiwa Wirausaha",sectionType: "entity",         depth: "core" },
      { titleTemplate: "Peluang dan Ide Bisnis",          sectionType: "entity",         depth: "core" },
      { titleTemplate: "Model Bisnis dan Business Plan",  sectionType: "entity",         depth: "core", needsTable: true, tableType: "categories" },
      { titleTemplate: "Risiko dan Tantangan Wirausaha",  sectionType: "analysis",       depth: "analysis" },
    ],
  },
  ekonomi: {
    sections: [
      { titleTemplate: "Pengertian dan Ruang Lingkup Ekonomi", sectionType: "definition", depth: "intro" },
      { titleTemplate: "Mekanisme Permintaan dan Penawaran", sectionType: "entity",      depth: "core" },
      { titleTemplate: "Kebijakan Ekonomi",               sectionType: "entity",         depth: "core" },
      { titleTemplate: "Indikator Ekonomi Makro",         sectionType: "analysis",       depth: "analysis", needsTable: true, tableType: "criteria" },
      { titleTemplate: "Isu Ekonomi Kontemporer",         sectionType: "analysis",       depth: "analysis" },
    ],
  },
  pendidikan: {
    sections: [
      { titleTemplate: "Konsep Pendidikan",               sectionType: "definition",     depth: "intro" },
      { titleTemplate: "Teori Belajar dan Pembelajaran",  sectionType: "theory",         depth: "core" },
      { titleTemplate: "Kurikulum dan Metode Pengajaran", sectionType: "entity",         depth: "core", needsTable: true, tableType: "comparison" },
      { titleTemplate: "Evaluasi Hasil Belajar",          sectionType: "analysis",       depth: "analysis" },
      { titleTemplate: "Inovasi dalam Pendidikan",        sectionType: "analysis",       depth: "analysis" },
    ],
  },
  hukum: {
    sections: [
      { titleTemplate: "Pengertian dan Asas Hukum",       sectionType: "definition",     depth: "intro" },
      { titleTemplate: "Sumber dan Dasar Hukum",          sectionType: "theory",         depth: "core" },
      { titleTemplate: "Ketentuan Hukum yang Berlaku",    sectionType: "entity",         depth: "core", needsTable: true, tableType: "categories" },
      { titleTemplate: "Penegakan Hukum",                 sectionType: "analysis",       depth: "analysis" },
      { titleTemplate: "Perlindungan Hukum",              sectionType: "analysis",       depth: "analysis" },
    ],
  },
  teknik: {
    sections: [
      { titleTemplate: "Konsep Teknis Dasar",             sectionType: "definition",     depth: "intro" },
      { titleTemplate: "Standar dan Spesifikasi Teknis",  sectionType: "theory",         depth: "core", needsTable: true, tableType: "criteria" },
      { titleTemplate: "Metode dan Pendekatan Teknis",    sectionType: "entity",         depth: "core" },
      { titleTemplate: "Analisis Teknis",                 sectionType: "analysis",       depth: "analysis" },
      { titleTemplate: "Implementasi dan Uji Coba",       sectionType: "implementation", depth: "analysis" },
    ],
  },
  informatika: {
    sections: [
      { titleTemplate: "Sistem Informasi dan Teknologi",  sectionType: "definition",     depth: "intro" },
      { titleTemplate: "Arsitektur Sistem",               sectionType: "entity",         depth: "core" },
      { titleTemplate: "Keamanan dan Privasi Data",       sectionType: "entity",         depth: "core" },
      { titleTemplate: "Implementasi Teknologi",          sectionType: "implementation", depth: "core", needsTable: true, tableType: "comparison" },
      { titleTemplate: "Analisis Sistem",                 sectionType: "analysis",       depth: "analysis" },
    ],
  },
  kesehatan: {
    sections: [
      { titleTemplate: "Konsep Kesehatan",                sectionType: "definition",     depth: "intro" },
      { titleTemplate: "Faktor Risiko dan Penyebab",      sectionType: "entity",         depth: "core" },
      { titleTemplate: "Pencegahan dan Promosi Kesehatan",sectionType: "entity",         depth: "core" },
      { titleTemplate: "Penatalaksanaan",                 sectionType: "analysis",       depth: "analysis", needsTable: true, tableType: "criteria" },
      { titleTemplate: "Kebijakan Kesehatan",             sectionType: "analysis",       depth: "analysis" },
    ],
  },
  psikologi: {
    sections: [
      { titleTemplate: "Konsep Psikologis Dasar",         sectionType: "definition",     depth: "intro" },
      { titleTemplate: "Teori Perilaku dan Kognisi",      sectionType: "theory",         depth: "core" },
      { titleTemplate: "Faktor Psikologis yang Berpengaruh", sectionType: "entity",      depth: "core" },
      { titleTemplate: "Pendekatan dan Intervensi",       sectionType: "analysis",       depth: "analysis", needsTable: true, tableType: "comparison" },
      { titleTemplate: "Implikasi Psikologis",            sectionType: "analysis",       depth: "analysis" },
    ],
  },
  komunikasi: {
    sections: [
      { titleTemplate: "Konsep dan Teori Komunikasi",     sectionType: "definition",     depth: "intro" },
      { titleTemplate: "Model Komunikasi",                sectionType: "theory",         depth: "core", needsTable: true, tableType: "comparison" },
      { titleTemplate: "Media dan Saluran Komunikasi",    sectionType: "entity",         depth: "core" },
      { titleTemplate: "Komunikasi Efektif",              sectionType: "analysis",       depth: "analysis" },
      { titleTemplate: "Strategi Komunikasi",             sectionType: "analysis",       depth: "analysis" },
    ],
  },
  bisnis_digital: {
    sections: [
      { titleTemplate: "Ekosistem Bisnis Digital",        sectionType: "definition",     depth: "intro" },
      { titleTemplate: "Platform dan Media Digital",      sectionType: "entity",         depth: "core", needsTable: true, tableType: "comparison" },
      { titleTemplate: "Strategi Pemasaran Digital",      sectionType: "entity",         depth: "core" },
      { titleTemplate: "Analitik dan Pengukuran Digital", sectionType: "analysis",       depth: "analysis", needsTable: true, tableType: "criteria" },
      { titleTemplate: "Tren dan Inovasi Digital",        sectionType: "analysis",       depth: "analysis" },
    ],
  },
  general: {
    sections: [
      { titleTemplate: "Konsep dan Definisi",             sectionType: "definition",     depth: "intro" },
      { titleTemplate: "Landasan Teori",                  sectionType: "theory",         depth: "core" },
      { titleTemplate: "Pendekatan dan Metodologi",       sectionType: "entity",         depth: "core" },
      { titleTemplate: "Analisis dan Pembahasan",         sectionType: "analysis",       depth: "analysis" },
      { titleTemplate: "Implikasi dan Relevansi",         sectionType: "analysis",       depth: "analysis" },
    ],
  },
};

// ─── Outline Generator ────────────────────────────────────────────────────────

export function generateOutline(analysis: TopicAnalysis): OutlineSection[] {
  const template = DISCIPLINE_TEMPLATES[analysis.bidang];
  const result: OutlineSection[] = [];
  let sectionNum = 1;

  if (analysis.isComparison && analysis.entities.length >= 2) {
    // ── Comparison Mode: 2.1 Intro, 2.2...2.N Entity sections, then comparison ──
    result.push({
      number: `2.${sectionNum++}`,
      title: `Tinjauan Umum ${analysis.label}`,
      entity: analysis.label,
      sectionType: "definition",
      depth: "intro",
      needsTable: false,
    });

    // One section per entity
    for (const entity of analysis.entities.slice(0, 5)) {
      result.push({
        number: `2.${sectionNum++}`,
        title: entity.charAt(0).toUpperCase() + entity.slice(1),
        entity,
        sectionType: "entity",
        depth: "core",
        needsTable: false,
      });
    }

    // Comparison section
    result.push({
      number: `2.${sectionNum++}`,
      title: `Perbandingan ${analysis.entities.slice(0, 3).map((e) => e.charAt(0).toUpperCase() + e.slice(1)).join(", ")}`,
      entity: analysis.entities.join(","),
      sectionType: "comparison",
      depth: "comparison",
      needsTable: true,
      tableType: "comparison",
    });

    // Analysis / Advantages
    result.push({
      number: `2.${sectionNum++}`,
      title: "Kelebihan, Kekurangan, dan Faktor Pertimbangan",
      entity: analysis.entities.join(","),
      sectionType: "analysis",
      depth: "analysis",
      needsTable: true,
      tableType: "advantages",
    });

  } else {
    // ── Topic-Based Mode: use discipline template ──
    for (const s of template.sections) {
      result.push({
        number: `2.${sectionNum++}`,
        title: s.titleTemplate,
        entity: analysis.entities[0] ?? analysis.label,
        sectionType: s.sectionType,
        depth: s.depth,
        needsTable: s.needsTable ?? false,
        tableType: s.tableType,
      });
    }

    // Insert specific entity sections if entities present and not comparison
    if (analysis.entities.length > 0 && !analysis.isComparison) {
      // Insert after definition/theory (position 2)
      const entitySections: OutlineSection[] = analysis.entities.slice(0, 2).map((e) => ({
        number: `2.${sectionNum++}`,
        title: `${e.charAt(0).toUpperCase() + e.slice(1)} dalam Konteks ${analysis.label}`,
        entity: e,
        sectionType: "entity" as SectionType,
        depth: "core" as const,
        needsTable: false,
      }));
      result.splice(2, 0, ...entitySections);
    }
  }

  // Re-number after any insertions
  result.forEach((s, i) => { s.number = `2.${i + 1}`; });

  return result;
}

// ─── Daftar Isi Generator ─────────────────────────────────────────────────────

export function generateDaftarIsiFromOutline(sections: OutlineSection[]): string {
  const lines: string[] = [
    "KATA PENGANTAR ............................................. i",
    "DAFTAR ISI ................................................. ii",
    "",
    "BAB I PENDAHULUAN ........................................... 1",
    "    1.1 Latar Belakang ...................................... 1",
    "    1.2 Rumusan Masalah ..................................... 2",
    "    1.3 Tujuan Penulisan .................................... 3",
    "    1.4 Manfaat Penulisan ................................... 3",
    "",
    "BAB II PEMBAHASAN ........................................... 4",
  ];

  let page = 4;
  for (const s of sections) {
    const dots = ".".repeat(Math.max(4, 42 - s.title.length - s.number.length));
    lines.push(`    ${s.number} ${s.title} ${dots} ${page++}`);
  }

  lines.push("");
  lines.push("BAB III PENUTUP ......................................... " + (page + 2));
  lines.push("    3.1 Kesimpulan .................................... " + (page + 2));
  lines.push("    3.2 Saran ......................................... " + (page + 3));
  lines.push("");
  lines.push("DAFTAR PUSTAKA .......................................... " + (page + 4));

  return lines.join("\n");
}
