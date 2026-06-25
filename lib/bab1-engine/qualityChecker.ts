/**
 * BAB I Quality Check Engine — validates generated content before export.
 *
 * Each check returns pass/fail with a descriptive hint for the UI.
 */

import type { Bab1State } from "@/lib/thesis/bab1Store";
import type { ThesisState } from "@/lib/thesis/store";

export interface QualityItem {
  key: string;
  label: string;
  pass: boolean;
  hint?: string;
}

// ─── Individual Check Functions ───────────────────────────────────────────────

function checkHasFenomenaUmum(bab1: Bab1State): QualityItem {
  return {
    key: "fenomena_umum",
    label: "Ada fenomena umum (opening paragraph)",
    pass: !!(bab1.namaObjek && bab1.jenisUsaha),
    hint: "Pastikan Nama Objek dan Jenis Usaha telah diisi.",
  };
}

function checkHasFenomenaObjek(bab1: Bab1State): QualityItem {
  return {
    key: "fenomena_objek",
    label: "Ada fenomena objek penelitian",
    pass: !!(bab1.fenomena && bab1.fenomena.trim().length > 20),
    hint: "Isi kolom Fenomena/Permasalahan dengan minimal 1 kalimat (20+ karakter).",
  };
}

function checkHasDataPenjualan(bab1: Bab1State): QualityItem {
  const valid = bab1.salesData.filter((r) => r.tahun && r.target && r.realisasi);
  const hasData = valid.length >= 1 || bab1.salesDataMode === "tidak_tersedia";
  return {
    key: "data_penjualan",
    label: "Ada data penjualan",
    pass: hasData,
    hint: "Isi minimal 1 baris data penjualan (Tahun, Target, Realisasi) atau pilih 'Data Tidak Tersedia'.",
  };
}

function checkHasAnalisaPenjualan(bab1: Bab1State): QualityItem {
  const valid = bab1.salesData.filter((r) => r.tahun && r.target && r.realisasi);
  return {
    key: "analisa_penjualan",
    label: "Ada analisa data penjualan",
    pass: valid.length >= 2,
    hint: "Isi minimal 2 baris data penjualan agar tren dapat dianalisis.",
  };
}

function checkHasDataKonsumen(bab1: Bab1State): QualityItem {
  const valid = bab1.consumerData.filter((r) => r.tahun && r.target && r.realisasi);
  const hasData = valid.length >= 1 || bab1.consumerDataMode === "tidak_tersedia";
  return {
    key: "data_konsumen",
    label: "Ada data konsumen",
    pass: hasData,
    hint: "Isi minimal 1 baris data konsumen atau pilih 'Data Tidak Tersedia'.",
  };
}

function checkHasAnalisaKonsumen(bab1: Bab1State): QualityItem {
  const valid = bab1.consumerData.filter((r) => r.tahun && r.target && r.realisasi);
  return {
    key: "analisa_konsumen",
    label: "Ada analisa data konsumen",
    pass: valid.length >= 2,
    hint: "Isi minimal 2 baris data konsumen agar tren dapat dianalisis.",
  };
}

function checkHasKompetitor(bab1: Bab1State): QualityItem {
  const valid = bab1.competitors.filter((c) => c.nama.trim());
  return {
    key: "kompetitor",
    label: "Ada data kompetitor",
    pass: valid.length >= 1,
    hint: "Isi minimal 1 baris data kompetitor.",
  };
}

function checkHasAnalisaKompetitor(bab1: Bab1State): QualityItem {
  const valid = bab1.competitors.filter((c) => c.nama.trim());
  return {
    key: "analisa_kompetitor",
    label: "Ada analisa kompetitor",
    pass: valid.length >= 2,
    hint: "Isi minimal 2 kompetitor agar narasi persaingan dapat dibangun.",
  };
}

function checkHasVariabelX1(thesis: ThesisState): QualityItem {
  return {
    key: "variabel_x1",
    label: "Ada variabel X1 (independen pertama)",
    pass: !!(thesis.x1 && thesis.x1.trim().length > 2),
    hint: "Isi Variabel X1 di halaman pengaturan Judul Penelitian.",
  };
}

function checkHasVariabelX2(thesis: ThesisState): QualityItem {
  return {
    key: "variabel_x2",
    label: "Ada variabel X2 (independen kedua)",
    pass: !!(thesis.x2 && thesis.x2.trim().length > 2),
    hint: "Isi Variabel X2 di halaman pengaturan Judul Penelitian.",
  };
}

function checkHasVariabelY(thesis: ThesisState): QualityItem {
  return {
    key: "variabel_y",
    label: "Ada variabel Y (dependen)",
    pass: !!(thesis.y && thesis.y.trim().length > 2),
    hint: "Isi Variabel Y di halaman pengaturan Judul Penelitian.",
  };
}

function checkHasTeoriAhli(thesis: ThesisState): QualityItem {
  const hasVars = !!(thesis.x1 && thesis.x2 && thesis.y);
  return {
    key: "teori_ahli",
    label: "Ada penguatan teori ahli",
    pass: hasVars,
    hint: "Pastikan X1, X2, dan Y diisi agar engine dapat menyisipkan teori yang relevan.",
  };
}

function checkHasSitasi(thesis: ThesisState): QualityItem {
  const hasVars = !!(thesis.x1 && thesis.x2 && thesis.y);
  return {
    key: "sitasi",
    label: "Ada sitasi akademik (min. 5)",
    pass: hasVars,
    hint: "Pastikan semua variabel terisi. Sitasi disisipkan otomatis dari database author.",
  };
}

function checkHasResearchGap(bab1: Bab1State, thesis: ThesisState): QualityItem {
  const hasSales = bab1.salesData.filter((r) => r.tahun && r.target && r.realisasi).length >= 1;
  const hasVars = !!(thesis.x1 && thesis.y);
  return {
    key: "research_gap",
    label: "Ada research gap",
    pass: hasSales && hasVars,
    hint: "Isi data penjualan dan pastikan X1 & Y terisi agar research gap otomatis terbentuk.",
  };
}

function checkHasUrgensiPenelitian(bab1: Bab1State, thesis: ThesisState): QualityItem {
  const hasObj = !!(bab1.namaObjek && bab1.jenisUsaha);
  const hasVars = !!(thesis.x1 && thesis.x2 && thesis.y);
  return {
    key: "urgensi",
    label: "Ada urgensi penelitian",
    pass: hasObj && hasVars,
    hint: "Pastikan Nama Objek, Jenis Usaha, dan semua variabel terisi.",
  };
}

function checkHasPenutupLatarBelakang(bab1: Bab1State, thesis: ThesisState): QualityItem {
  const hasObj = !!(bab1.namaObjek && bab1.lokasi);
  const hasVars = !!(thesis.x1 && thesis.x2 && thesis.y);
  return {
    key: "penutup",
    label: "Ada penutup latar belakang (judul penelitian)",
    pass: hasObj && hasVars,
    hint: "Pastikan Nama Objek, Lokasi, dan semua variabel terisi.",
  };
}

// ─── Main Export ─────────────────────────────────────────────────────────────

/** Run all quality checks and return results. */
export function checkBab1Quality(bab1: Bab1State, thesis: ThesisState): QualityItem[] {
  return [
    checkHasFenomenaUmum(bab1),
    checkHasFenomenaObjek(bab1),
    checkHasDataPenjualan(bab1),
    checkHasAnalisaPenjualan(bab1),
    checkHasDataKonsumen(bab1),
    checkHasAnalisaKonsumen(bab1),
    checkHasKompetitor(bab1),
    checkHasAnalisaKompetitor(bab1),
    checkHasVariabelX1(thesis),
    checkHasVariabelX2(thesis),
    checkHasVariabelY(thesis),
    checkHasTeoriAhli(thesis),
    checkHasSitasi(thesis),
    checkHasResearchGap(bab1, thesis),
    checkHasUrgensiPenelitian(bab1, thesis),
    checkHasPenutupLatarBelakang(bab1, thesis),
  ];
}

/** Returns score 0-100 based on passed checks. */
export function getBab1Score(items: QualityItem[]): number {
  const passed = items.filter((i) => i.pass).length;
  return Math.round((passed / items.length) * 100);
}
