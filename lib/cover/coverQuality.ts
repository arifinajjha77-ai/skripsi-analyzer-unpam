/**
 * SmartCampus — Cover Quality Checker
 *
 * Validates all 10 required fields of a cover page.
 * Returns a CoverQualityReport with per-field status and an overall completeness flag.
 */

import { CoverData, CoverQualityReport, CoverCheck } from "./types";

interface FieldCheck {
  id: string;
  label: string;
  getValue: (c: CoverData) => string | boolean;
  hint?: string;
}

const FIELD_CHECKS: FieldCheck[] = [
  {
    id: "logo",
    label: "Logo tersedia",
    getValue: (c) =>
      !!(c.logoUrl) ||
      c.universityMode === "registered", // registered universities have built-in logos
    hint: "Upload logo universitas atau pilih universitas terdaftar",
  },
  {
    id: "universitas",
    label: "Nama universitas ada",
    getValue: (c) => c.universitas.trim(),
    hint: "Isi nama universitas yang mengeluarkan makalah",
  },
  {
    id: "fakultas",
    label: "Fakultas ada",
    getValue: (c) => c.fakultas.trim(),
    hint: "Isi nama fakultas (misal: Fakultas Ekonomi dan Bisnis)",
  },
  {
    id: "programStudi",
    label: "Program studi ada",
    getValue: (c) => c.programStudi.trim(),
    hint: "Isi nama program studi (misal: Manajemen Pemasaran)",
  },
  {
    id: "mataKuliah",
    label: "Mata kuliah ada",
    getValue: (c) => c.mataKuliah.trim(),
    hint: "Isi nama mata kuliah yang memberi tugas makalah ini",
  },
  {
    id: "namaDosen",
    label: "Nama dosen ada",
    getValue: (c) => c.namaDosen.trim(),
    hint: "Isi nama dosen pengampu beserta gelar",
  },
  {
    id: "judul",
    label: "Judul makalah ada",
    getValue: (c) => c.judul.trim(),
    hint: "Isi judul makalah yang spesifik dan mencerminkan isi",
  },
  {
    id: "penyusun",
    label: "Nama penyusun ada",
    getValue: (c) => c.penyusun.some((p) => p.nama.trim().length > 0),
    hint: "Tambahkan minimal satu nama penyusun",
  },
  {
    id: "kota",
    label: "Kota ada",
    getValue: (c) => c.kota.trim(),
    hint: "Isi kota tempat makalah disusun",
  },
  {
    id: "tahun",
    label: "Tahun ada",
    getValue: (c) => c.tahun.trim(),
    hint: "Isi tahun penyusunan makalah",
  },
];

export function checkCoverQuality(cover: CoverData): CoverQualityReport {
  const checks: CoverCheck[] = FIELD_CHECKS.map((f) => {
    const value = f.getValue(cover);
    const filled = typeof value === "boolean" ? value : value.length > 0;
    return {
      id: f.id,
      label: f.label,
      status: filled ? "pass" : "missing",
      hint: filled ? undefined : f.hint,
    };
  });

  const passCount    = checks.filter((c) => c.status === "pass").length;
  const missingCount = checks.filter((c) => c.status === "missing").length;

  return {
    checks,
    passCount,
    missingCount,
    isComplete: missingCount === 0,
  };
}
