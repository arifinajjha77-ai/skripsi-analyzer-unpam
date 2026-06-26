import type { MakalahChapterOutline, MakalahEngineInput, MakalahOutline } from "./types";
export { DEFAULT_MODEL } from "@/lib/ai/models";

export function normalizeInput(input: Partial<MakalahEngineInput>): MakalahEngineInput {
  const assignmentText = [
    input.judul,
    input.tema,
    input.mataKuliah,
    input.pedoman,
    JSON.stringify(input.assignmentAnalysis || {}),
  ].join(" ").toLowerCase();
  const isMiniProjectProposal = /week\s*1|proposal|mini project|social media marketing/.test(assignmentText);
  return {
    judul: clean(input.judul) || (isMiniProjectProposal ? "Proposal Mini Project Social Media Marketing Clickora" : "Makalah Akademik"),
    namaKampus: clean(input.namaKampus) || "[Nama Kampus]",
    fakultas: clean(input.fakultas) || "[Nama Fakultas]",
    programStudi: clean(input.programStudi) || "[Program Studi]",
    mataKuliah: clean(input.mataKuliah) || (isMiniProjectProposal ? "Social Media Marketing" : "[Mata Kuliah]"),
    namaDosen: clean(input.namaDosen) || "[Nama Dosen]",
    namaMahasiswa: clean(input.namaMahasiswa) || "[Nama Mahasiswa/Kelompok]",
    nim: clean(input.nim) || "-",
    kelas: clean(input.kelas) || "-",
    tema: clean(input.tema) || (isMiniProjectProposal ? "Produk Custom Clicker Nama dari brand Clickora" : clean(input.judul) || "studi kasus akademik"),
    jumlahBab: isMiniProjectProposal ? 7 : clamp(Number(input.jumlahBab) || 5, 5, 5),
    targetHalaman: clamp(Number(input.targetHalaman) || 10, 5, 30),
    pedoman: clean(input.pedoman),
    mode: input.mode === "complete" ? "complete" : "fast",
    assignmentAnalysis: input.assignmentAnalysis || null,
  };
}

export function buildOutlinePrompt(input: MakalahEngineInput): string {
  return [
    "Buat outline dokumen akademik berbahasa Indonesia formal.",
    "Output wajib JSON valid tanpa markdown.",
    "Struktur JSON: {\"title\":\"...\",\"chapters\":[{\"id\":\"bab1\",\"number\":\"BAB I\",\"title\":\"PENDAHULUAN\",\"purpose\":\"...\",\"subsections\":[{\"id\":\"1.1\",\"title\":\"...\",\"bullets\":[\"...\"]}]}],\"bibliographyPlan\":[\"...\"],\"appendixPlan\":[\"...\"]}.",
    "Jika tugas adalah Week 1 Proposal Mini Project Social Media Marketing, output utama wajib PROPOSAL MINI PROJECT untuk produk Custom Clicker Nama, brand Clickora, tagline Klik Namamu, Tunjukkan Gayamu, platform Instagram, TikTok, Shopee.",
    "Untuk proposal mini project, wajib 7 BAB: Pendahuluan; Brand & Produk; Target Market; Marketing Mix 4P; Strategi Branding & Media Sosial; Rencana Timeline & Target Mingguan; Penutup.",
    "Jangan menulis Analisis Instruksi Tugas. Jangan menjadikan guideline dosen sebagai tema atau produk.",
    "Setiap bab memiliki 2-4 subbab, judul subbab tidak kosong, dan bullet antar subbab tidak berulang.",
    "Jika analisis tugas dosen meminta proposal, jadikan outline sebagai proposal akademik yang tetap memakai struktur BAB.",
    "Jangan membuat deliverable di luar instruksi tugas dosen; deliverable non-DOCX cukup dicatat sebagai checklist.",
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
    "Jika tugas adalah proposal mini project, tulis sebagai PROPOSAL MINI PROJECT Clickora untuk produk Custom Clicker Nama. Jangan menulis Analisis Instruksi Tugas.",
    "Semua subbab harus terhubung dengan Custom Clicker Nama, brand Clickora, tagline Klik Namamu, Tunjukkan Gayamu, dan platform Instagram, TikTok, Shopee bila relevan.",
    "Jika membahas data performa, engagement, biaya, atau capaian yang tidak diberikan user, tulis sebagai simulasi perencanaan.",
    input.mode === "fast"
      ? "Mode Cepat: ringkas, jelas, cukup untuk dikumpulkan besok, tanpa uraian yang melebar."
      : "Mode Lengkap: lebih detail, argumentasi lebih kuat, dan transisi antarbagian lebih lengkap.",
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
    `Mode generate: ${input.mode === "complete" ? "Mode Lengkap" : "Mode Cepat"}`,
    `Catatan pedoman: ${input.pedoman || "-"}`,
    `Analisis tugas dosen: ${input.assignmentAnalysis ? JSON.stringify(input.assignmentAnalysis) : "-"}`,
  ].join("\n");
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
