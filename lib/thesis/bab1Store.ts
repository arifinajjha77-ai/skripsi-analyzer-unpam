"use client";

const KEY = "bab1_state";

export type DataMode = "asli" | "estimasi" | "tidak_tersedia";

export interface SalesRow {
  tahun: string;
  target: string;
  realisasi: string;
}

export interface ConsumerRow {
  tahun: string;
  target: string;
  realisasi: string;
}

export interface CompetitorRow {
  nama: string;
  produk: string;
  harga: string;
}

export interface Bab1State {
  namaObjek: string;
  jenisUsaha: string;
  lokasi: string;
  salesDataMode: DataMode;
  salesData: SalesRow[];
  consumerDataMode: DataMode;
  consumerData: ConsumerRow[];
  competitors: CompetitorRow[];
  fenomena: string;
  catatanKerahasiaan: string;
}

export const DEFAULT_CATATAN_KERAHASIAAN =
  "Data yang digunakan merupakan data estimasi/disamarkan untuk menjaga kerahasiaan informasi perusahaan.";

export const defaultBab1State: Bab1State = {
  namaObjek: "",
  jenisUsaha: "",
  lokasi: "",
  salesDataMode: "asli",
  salesData: [
    { tahun: "2022", target: "", realisasi: "" },
    { tahun: "2023", target: "", realisasi: "" },
    { tahun: "2024", target: "", realisasi: "" },
  ],
  consumerDataMode: "asli",
  consumerData: [
    { tahun: "2022", target: "", realisasi: "" },
    { tahun: "2023", target: "", realisasi: "" },
    { tahun: "2024", target: "", realisasi: "" },
  ],
  competitors: [
    { nama: "", produk: "", harga: "" },
  ],
  fenomena: "",
  catatanKerahasiaan: DEFAULT_CATATAN_KERAHASIAAN,
};

export function loadBab1State(): Bab1State {
  if (typeof window === "undefined") return defaultBab1State;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return defaultBab1State;
    const parsed = JSON.parse(raw) as Partial<Bab1State>;
    // Merge with defaults for backward compat with data saved before V1.5.2
    return {
      ...defaultBab1State,
      ...parsed,
      salesDataMode: parsed.salesDataMode ?? "asli",
      consumerDataMode: parsed.consumerDataMode ?? "asli",
      catatanKerahasiaan: parsed.catatanKerahasiaan ?? DEFAULT_CATATAN_KERAHASIAAN,
    };
  } catch {
    return defaultBab1State;
  }
}

export function saveBab1State(state: Bab1State): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}
