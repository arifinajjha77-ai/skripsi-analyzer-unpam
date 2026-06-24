"use client";

const KEY = "app_settings";

export interface AppSettings {
  namaKampus: string;
  programStudi: string;
  namaMahasiswa: string;
  npm: string;
  namaPembimbing: string;
  namaKoPembimbing: string;
  tahunAjaran: string;
  margin: string;
  spasi: string;
  font: string;
}

export const defaultSettings: AppSettings = {
  namaKampus: "Universitas Pamulang",
  programStudi: "Manajemen",
  namaMahasiswa: "",
  npm: "",
  namaPembimbing: "",
  namaKoPembimbing: "",
  tahunAjaran: "2024/2025",
  margin: "4-3-3-3",
  spasi: "1.5",
  font: "Times New Roman",
};

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}
