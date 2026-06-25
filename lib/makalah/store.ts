/**
 * Makalah Store — LocalStorage state for the Makalah module.
 * V2.2: Added cover builder fields (fakultas, universityMode, universityId, logoUrl, tahun).
 */

import { CoverData, PenyusunItem } from "@/lib/cover/types";

const STORAGE_KEY = "smartcampus_makalah_v2";

// Keep AnggotaKelompok for backward compat
export interface AnggotaKelompok {
  nim: string;
  nama: string;
}

export interface MakalahState {
  // ── Cover Builder Fields (V2.2) ──────────────────────────────────
  universityMode: "registered" | "custom";
  universityId: string;          // "unpam" | "ugm" | ... | "custom"
  fakultas: string;
  tahun: string;                 // year on cover (e.g. "2025")
  logoUrl?: string;              // base64 data URL for uploaded logo

  // ── Content Fields ────────────────────────────────────────────────
  judul: string;
  universitas: string;
  programStudi: string;
  mataKuliah: string;
  namaDosen: string;
  kelompok: string;
  anggota: AnggotaKelompok[];
  semester: string;
  tahunAkademik: string;
  kota: string;
  targetHalaman: number;
  topikRingkas: string;
  latar?: string;
  tujuan?: string;
}

export const defaultMakalahState: MakalahState = {
  universityMode: "registered",
  universityId: "unpam",
  fakultas: "",
  tahun: new Date().getFullYear().toString(),
  logoUrl: undefined,
  judul: "",
  universitas: "",
  programStudi: "",
  mataKuliah: "",
  namaDosen: "",
  kelompok: "",
  anggota: [{ nim: "", nama: "" }],
  semester: "",
  tahunAkademik: new Date().getFullYear() + "/" + (new Date().getFullYear() + 1),
  kota: "",
  targetHalaman: 10,
  topikRingkas: "",
};

export function loadMakalahState(): MakalahState {
  if (typeof window === "undefined") return defaultMakalahState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultMakalahState;
    return { ...defaultMakalahState, ...JSON.parse(raw) };
  } catch {
    return defaultMakalahState;
  }
}

export function saveMakalahState(state: MakalahState): void {
  if (typeof window === "undefined") return;
  try {
    // Don't save logoUrl in main state (it's in logoStore)
    const { logoUrl: _, ...rest } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  } catch {
    // ignore quota errors
  }
}

/** Convert MakalahState to CoverData for the Cover Builder */
export function stateToCoverData(state: MakalahState): CoverData {
  return {
    universityMode: state.universityMode,
    universityId: state.universityId,
    universitas: state.universitas,
    fakultas: state.fakultas,
    programStudi: state.programStudi,
    mataKuliah: state.mataKuliah,
    namaDosen: state.namaDosen,
    judul: state.judul,
    kelompok: state.kelompok,
    penyusun: state.anggota.map((a) => ({ nim: a.nim, nama: a.nama } as PenyusunItem)),
    kota: state.kota,
    tahun: state.tahun,
    logoUrl: state.logoUrl,
  };
}

/** Merge CoverData back into MakalahState */
export function coverDataToState(cover: CoverData, state: MakalahState): Partial<MakalahState> {
  return {
    universityMode: cover.universityMode,
    universityId: cover.universityId,
    universitas: cover.universitas,
    fakultas: cover.fakultas,
    programStudi: cover.programStudi,
    mataKuliah: cover.mataKuliah,
    namaDosen: cover.namaDosen,
    judul: cover.judul,
    kelompok: cover.kelompok,
    anggota: cover.penyusun.map((p) => ({ nim: p.nim, nama: p.nama })),
    kota: cover.kota,
    tahun: cover.tahun,
    logoUrl: cover.logoUrl,
  };
}
