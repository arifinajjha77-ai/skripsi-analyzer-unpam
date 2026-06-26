import type { EngineResult, MakalahEngineInput, MakalahOutline } from "./types";
import { buildOutlinePrompt, DEFAULT_MODEL } from "./prompts";
import { generateJsonWithOpenAI } from "@/lib/ai/openai";

export async function generateOutline(input: MakalahEngineInput): Promise<EngineResult<MakalahOutline>> {
  const aiOutline = await callOpenAI<MakalahOutline>(buildOutlinePrompt(input));

  if (aiOutline) {
    return { data: normalizeOutline(aiOutline.data, input), meta: { model: aiOutline.model, fallback: false } };
  }

  return { data: buildFallbackOutline(input), meta: { model: DEFAULT_MODEL, fallback: true } };
}

export async function callOpenAI<T>(prompt: string): Promise<{ data: T; model: string } | null> {
  return generateJsonWithOpenAI<T>(prompt);
}

function normalizeOutline(outline: MakalahOutline, input: MakalahEngineInput): MakalahOutline {
  const fallback = buildFallbackOutline(input);
  const chapters = fallback.chapters.map((expected) => {
    const actual = outline.chapters?.find((chapter) => chapter.id === expected.id);
    return {
      ...expected,
      ...actual,
      id: expected.id,
      number: expected.number,
      title: actual?.title?.trim() || expected.title,
      subsections: actual?.subsections?.length ? actual.subsections : expected.subsections,
    };
  });

  return {
    title: outline.title?.trim() || input.judul,
    chapters,
    bibliographyPlan: outline.bibliographyPlan?.length ? outline.bibliographyPlan : fallback.bibliographyPlan,
    appendixPlan: outline.appendixPlan || fallback.appendixPlan,
  };
}

function buildFallbackOutline(input: MakalahEngineInput): MakalahOutline {
  const focus = input.tema || input.judul;
  const primary = input.assignmentAnalysis?.requiredDeliverables.find((item) => item.type === "proposal" || item.type === "makalah")
    || input.assignmentAnalysis?.requiredDeliverables[0];
  const isProposal = primary?.type === "proposal";
  const bab3Title = isProposal ? "PROFIL OBJEK DAN RENCANA PROYEK" : "PEMBAHASAN / PROFIL OBJEK";
  const bab4Title = isProposal ? "STRATEGI DAN RENCANA IMPLEMENTASI" : "STRATEGI / ANALISIS";

  return {
    title: input.judul || input.assignmentAnalysis?.title || "Makalah Akademik",
    chapters: [
      {
        id: "bab1",
        number: "BAB I",
        title: "PENDAHULUAN",
        purpose: "Menjelaskan konteks, rumusan masalah, tujuan, dan manfaat penulisan.",
        subsections: [
          { id: "1.1", title: "Latar Belakang", bullets: [`Konteks akademik ${focus}`, "Urgensi pembahasan", "Keterkaitan dengan mata kuliah"] },
          { id: "1.2", title: "Rumusan Masalah", bullets: ["Pertanyaan utama yang dibahas", "Batasan fokus makalah"] },
          { id: "1.3", title: "Tujuan Penulisan", bullets: ["Tujuan konseptual", "Tujuan praktis"] },
        ],
      },
      {
        id: "bab2",
        number: "BAB II",
        title: "LANDASAN TEORI",
        purpose: "Menyajikan konsep dan teori yang menjadi dasar analisis.",
        subsections: [
          { id: "2.1", title: "Konsep Dasar", bullets: [`Definisi terkait ${focus}`, "Ruang lingkup konsep"] },
          { id: "2.2", title: "Kerangka Teoretis", bullets: ["Teori pendukung", "Hubungan teori dengan kasus"] },
          { id: "2.3", title: "Penelitian atau Literatur Terkait", bullets: ["Temuan literatur", "Posisi makalah"] },
        ],
      },
      {
        id: "bab3",
        number: "BAB III",
        title: bab3Title,
        purpose: "Menguraikan objek, konteks, dan temuan pembahasan utama.",
        subsections: [
          { id: "3.1", title: "Gambaran Umum Objek", bullets: [`Deskripsi ${focus}`, "Karakteristik objek"] },
          { id: "3.2", title: isProposal ? "Rencana Mini Project" : "Kondisi dan Permasalahan", bullets: ["Gejala utama", "Faktor yang memengaruhi"] },
          { id: "3.3", title: isProposal ? "Kebutuhan dan Batasan Pelaksanaan" : "Pembahasan Tematik", bullets: ["Analisis awal", "Keterkaitan dengan teori"] },
        ],
      },
      {
        id: "bab4",
        number: "BAB IV",
        title: bab4Title,
        purpose: "Menyusun analisis dan rekomendasi strategi secara terarah.",
        subsections: [
          { id: "4.1", title: "Analisis Masalah", bullets: ["Akar masalah", "Dampak akademik atau praktis"] },
          { id: "4.2", title: isProposal ? "Strategi Pelaksanaan" : "Alternatif Strategi", bullets: ["Opsi penyelesaian", "Pertimbangan implementasi"] },
          { id: "4.3", title: isProposal ? "Timeline dan Indikator Evaluasi" : "Rekomendasi", bullets: ["Rekomendasi utama", "Alasan pemilihan"] },
        ],
      },
      {
        id: "bab5",
        number: "BAB V",
        title: "PENUTUP",
        purpose: "Merangkum simpulan dan saran.",
        subsections: [
          { id: "5.1", title: "Kesimpulan", bullets: ["Jawaban atas rumusan masalah", "Inti hasil analisis"] },
          { id: "5.2", title: "Saran", bullets: ["Saran akademik", "Saran praktis"] },
        ],
      },
    ],
    bibliographyPlan: [
      "Buku metodologi atau teori utama yang relevan",
      "Artikel jurnal tentang tema makalah",
      "Sumber institusional atau laporan resmi bila diperlukan",
    ],
    appendixPlan: input.assignmentAnalysis?.requiredDeliverables.length
      ? ["Checklist deliverable tugas dosen", "Catatan data asli atau simulasi perencanaan"]
      : input.pedoman ? ["Ringkasan pedoman penulisan"] : [],
  };
}
