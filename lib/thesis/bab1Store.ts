"use client";

const KEY = "bab1_state";

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
  salesData: SalesRow[];
  consumerData: ConsumerRow[];
  competitors: CompetitorRow[];
  fenomena: string;
}

export const defaultBab1State: Bab1State = {
  namaObjek: "",
  jenisUsaha: "",
  lokasi: "",
  salesData: [
    { tahun: "2021", target: "", realisasi: "" },
    { tahun: "2022", target: "", realisasi: "" },
    { tahun: "2023", target: "", realisasi: "" },
  ],
  consumerData: [
    { tahun: "2021", target: "", realisasi: "" },
    { tahun: "2022", target: "", realisasi: "" },
    { tahun: "2023", target: "", realisasi: "" },
  ],
  competitors: [
    { nama: "", produk: "", harga: "" },
  ],
  fenomena: "",
};

export function loadBab1State(): Bab1State {
  if (typeof window === "undefined") return defaultBab1State;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return defaultBab1State;
    return JSON.parse(raw) as Bab1State;
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
