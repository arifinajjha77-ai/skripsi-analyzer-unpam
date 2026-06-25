/**
 * Makalah Store — LocalStorage state for the Makalah module.
 */

const STORAGE_KEY = "smartcampus_makalah_v1";

export interface AnggotaKelompok {
  nim: string;
  nama: string;
}

export interface MakalahState {
  judul: string;
  universitas: string;
  programStudi: string;
  mataKuliah: string;
  namaDosen: string;
  kelompok: string;         // Kelompok number/name e.g. "1" or "Kelompok A"
  anggota: AnggotaKelompok[];
  semester: string;
  tahunAkademik: string;
  kota: string;
  targetHalaman: number;    // Target page count
  topikRingkas: string;     // Brief topic description for AI to use
  latar?: string;           // Latar belakang custom (optional override)
  tujuan?: string;          // Tujuan penulisan custom (optional override)
}

export const defaultMakalahState: MakalahState = {
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}
