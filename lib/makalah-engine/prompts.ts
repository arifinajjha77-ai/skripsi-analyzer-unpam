import type { MakalahChapterOutline, MakalahEngineInput, MakalahOutline } from "./types";

export const DEFAULT_MODEL = process.env.SMARTCAMPUS_DEFAULT_MODEL || "gpt-5.4-mini";

export function normalizeInput(input: Partial<MakalahEngineInput>): MakalahEngineInput {
  return {
    judul: clean(input.judul) || "Makalah Akademik",
    namaKampus: clean(input.namaKampus) || "Nama Kampus",
    fakultas: clean(input.fakultas) || "Fakultas",
    programStudi: clean(input.programStudi) || "Program Studi",
    mataKuliah: clean(input.mataKuliah) || "Mata Kuliah",
    namaDosen: clean(input.namaDosen) || "Nama Dosen",
    namaMahasiswa: clean(input.namaMahasiswa) || "Nama Mahasiswa/Kelompok",
    nim: clean(input.nim) || "-",
    kelas: clean(input.kelas) || "-",
    tema: clean(input.tema) || clean(input.judul) || "studi kasus akademik",
    jumlahBab: clamp(Number(input.jumlahBab) || 5, 5, 5),
    targetHalaman: clamp(Number(input.targetHalaman) || 10, 5, 30),
    pedoman: clean(input.pedoman),
  };
}

export function buildOutlinePrompt(input: MakalahEngineInput): string {
  return [
    "Buat outline makalah akademik berbahasa Indonesia formal.",
    "Output wajib JSON valid tanpa markdown.",
    "Struktur JSON: {\"title\":\"...\",\"chapters\":[{\"id\":\"bab1\",\"number\":\"BAB I\",\"title\":\"PENDAHULUAN\",\"purpose\":\"...\",\"subsections\":[{\"id\":\"1.1\",\"title\":\"...\",\"bullets\":[\"...\"]}]}],\"bibliographyPlan\":[\"...\"],\"appendixPlan\":[\"...\"]}.",
    "Wajib ada tepat 5 bab: BAB I Pendahuluan, BAB II Landasan Teori, BAB III Pembahasan / Profil Objek, BAB IV Strategi / Analisis, BAB V Penutup.",
    "Setiap bab memiliki 2-4 subbab, judul subbab tidak kosong, dan bullet antar subbab tidak berulang.",
    inputContext(input),
  ].join("\n\n");
}

export function buildChapterPrompt(
  input: MakalahEngineInput,
  outline: MakalahOutline,
  chapter: MakalahChapterOutline
): string {
  return [
    "Tulis satu bab makalah akademik dalam bahasa Indonesia formal.",
    "Output wajib JSON valid tanpa markdown: {\"subsections\":[{\"id\":\"...\",\"title\":\"...\",\"content\":\"...\"}]}",
    "Setiap content berisi 2-4 paragraf unik, saling terhubung, bukan gaya blog, bukan promosi, dan tidak mengulang kalimat dari subbab lain.",
    "Gunakan istilah akademik secukupnya. Jangan mengarang data numerik spesifik jika tidak diberikan.",
    inputContext(input),
    `Outline lengkap: ${JSON.stringify(outline)}`,
    `Bab yang ditulis: ${JSON.stringify(chapter)}`,
  ].join("\n\n");
}

export function buildFrontMatterPrompt(input: MakalahEngineInput, outline: MakalahOutline): string {
  return [
    "Buat kata pengantar singkat untuk makalah akademik.",
    "Output wajib JSON valid tanpa markdown: {\"kataPengantar\":\"...\"}",
    "Isi 2-3 paragraf formal, menyebut mata kuliah dan dosen bila tersedia, tidak berlebihan.",
    inputContext(input),
    `Outline: ${JSON.stringify(outline)}`,
  ].join("\n\n");
}

function inputContext(input: MakalahEngineInput): string {
  return [
    `Judul: ${input.judul}`,
    `Kampus: ${input.namaKampus}`,
    `Fakultas: ${input.fakultas}`,
    `Program Studi: ${input.programStudi}`,
    `Mata Kuliah: ${input.mataKuliah}`,
    `Dosen: ${input.namaDosen}`,
    `Mahasiswa/Kelompok: ${input.namaMahasiswa}`,
    `NIM: ${input.nim}`,
    `Kelas: ${input.kelas}`,
    `Tema/produk/studi kasus: ${input.tema}`,
    `Jumlah bab: ${input.jumlahBab}`,
    `Target halaman: ${input.targetHalaman}`,
    `Catatan pedoman: ${input.pedoman || "-"}`,
  ].join("\n");
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
