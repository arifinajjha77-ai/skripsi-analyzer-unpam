import { generateJsonWithOpenAI, repairJson } from "@/lib/ai/openai";
import { DEFAULT_MODEL } from "@/lib/ai/models";
import type { AssignmentAnalysis } from "./types";

export async function analyzeAssignmentText(text: string, userNotes = ""): Promise<{ analysis: AssignmentAnalysis; fallback: boolean; model: string }> {
  const prompt = buildAssignmentAnalyzerPrompt(text, userNotes);
  const ai = await generateJsonWithOpenAI<AssignmentAnalysis>(prompt);

  if (ai) {
    return { analysis: normalizeAnalysis(ai.data), fallback: false, model: ai.model };
  }

  const repaired = tryParseRepair(text);
  if (repaired) {
    return { analysis: normalizeAnalysis(repaired), fallback: true, model: DEFAULT_MODEL };
  }

  return { analysis: fallbackMiniProjectAnalysis(), fallback: true, model: DEFAULT_MODEL };
}

function buildAssignmentAnalyzerPrompt(text: string, userNotes: string): string {
  return [
    "Analisis instruksi tugas dosen berikut untuk mahasiswa.",
    "Output wajib JSON valid tanpa markdown, sesuai schema berikut:",
    "{\"title\":\"string\",\"course\":\"string optional\",\"deadline\":\"string optional\",\"summaryForStudent\":\"string\",\"requiredDeliverables\":[{\"name\":\"string\",\"type\":\"proposal|weekly_report|final_report|presentation|makalah|other\",\"description\":\"string\",\"estimatedPages\":number optional,\"requiredSections\":[\"string\"],\"priority\":\"high|medium|low\"}],\"writingRules\":{\"font\":\"string optional\",\"fontSize\":number optional,\"spacing\":\"string optional\",\"margin\":\"string optional\",\"citationStyle\":\"string optional\",\"languageStyle\":\"string optional\"},\"gradingRubric\":[{\"aspect\":\"string\",\"weight\":\"string optional\",\"description\":\"string optional\"}],\"timelineRequirements\":[\"string\"],\"missingInfoQuestions\":[\"string\"],\"suggestedWorkflow\":[{\"step\":number,\"title\":\"string\",\"description\":\"string\"}]}",
    "Ekstrak tugas utama, dokumen yang harus dikumpulkan, format penulisan, rubrik penilaian, deadline, informasi yang kurang, dan urutan pengerjaan tercepat.",
    "Jika tugas meminta proposal, prioritaskan proposal. Jika meminta laporan mingguan atau PPT juga, tampilkan sebagai deliverable/checklist.",
    "Jangan mengarang data performa atau engagement; tandai sebagai simulasi perencanaan jika data asli tidak tersedia.",
    `Catatan user: ${userNotes || "-"}`,
    `Instruksi tugas:\n${text}`,
  ].join("\n\n");
}

function tryParseRepair(text: string): AssignmentAnalysis | null {
  try {
    return JSON.parse(repairJson(text)) as AssignmentAnalysis;
  } catch {
    return null;
  }
}

function normalizeAnalysis(value: Partial<AssignmentAnalysis>): AssignmentAnalysis {
  const fallback = fallbackMiniProjectAnalysis();
  return {
    title: clean(value.title) || fallback.title,
    course: clean(value.course),
    deadline: clean(value.deadline),
    summaryForStudent: clean(value.summaryForStudent) || fallback.summaryForStudent,
    requiredDeliverables: Array.isArray(value.requiredDeliverables) && value.requiredDeliverables.length > 0
      ? value.requiredDeliverables.map((item, index) => ({
        name: clean(item.name) || `Deliverable ${index + 1}`,
        type: item.type || "other",
        description: clean(item.description) || "Dokumen yang perlu disiapkan sesuai instruksi tugas.",
        estimatedPages: typeof item.estimatedPages === "number" ? item.estimatedPages : undefined,
        requiredSections: Array.isArray(item.requiredSections) ? item.requiredSections.filter(Boolean) : [],
        priority: item.priority || "medium",
      }))
      : fallback.requiredDeliverables,
    writingRules: { ...fallback.writingRules, ...(value.writingRules || {}) },
    gradingRubric: Array.isArray(value.gradingRubric) ? value.gradingRubric : fallback.gradingRubric,
    timelineRequirements: Array.isArray(value.timelineRequirements) ? value.timelineRequirements : fallback.timelineRequirements,
    missingInfoQuestions: Array.isArray(value.missingInfoQuestions) ? value.missingInfoQuestions : fallback.missingInfoQuestions,
    suggestedWorkflow: Array.isArray(value.suggestedWorkflow) && value.suggestedWorkflow.length > 0
      ? value.suggestedWorkflow.map((step, index) => ({
        step: Number(step.step) || index + 1,
        title: clean(step.title) || `Langkah ${index + 1}`,
        description: clean(step.description) || "Kerjakan bagian ini secara berurutan.",
      }))
      : fallback.suggestedWorkflow,
  };
}

function fallbackMiniProjectAnalysis(): AssignmentAnalysis {
  return {
    title: "Mini Project Social Media Marketing",
    course: "Social Media Marketing",
    summaryForStudent: "Mahasiswa diminta menyusun proposal mini project pemasaran media sosial, menjelaskan objek atau produk, strategi konten, alur eksekusi, serta indikator evaluasi. Jika data performa belum tersedia, bagian angka ditulis sebagai simulasi perencanaan.",
    requiredDeliverables: [
      {
        name: "Proposal Mini Project",
        type: "proposal",
        description: "Dokumen utama berisi latar belakang, profil objek, strategi media sosial, rencana konten, timeline, dan evaluasi.",
        estimatedPages: 15,
        requiredSections: ["Pendahuluan", "Profil Objek", "Strategi Konten", "Timeline", "Evaluasi", "Penutup"],
        priority: "high",
      },
      {
        name: "Presentasi Ringkas",
        type: "presentation",
        description: "Slide pendukung untuk menjelaskan ide proyek dan strategi utama.",
        estimatedPages: 8,
        requiredSections: ["Masalah", "Target Audiens", "Strategi", "Konten", "Timeline"],
        priority: "medium",
      },
    ],
    writingRules: {
      font: "Times New Roman",
      fontSize: 12,
      spacing: "1.5",
      citationStyle: "APA sederhana",
      languageStyle: "Bahasa Indonesia formal akademik",
    },
    gradingRubric: [
      { aspect: "Kesesuaian instruksi", description: "Dokumen mengikuti deliverable dan format tugas." },
      { aspect: "Kejelasan strategi", description: "Strategi konten dan target audiens dijelaskan logis." },
      { aspect: "Kerapian dokumen", description: "Struktur, bahasa, dan format akademik rapi." },
    ],
    timelineRequirements: ["Prioritaskan proposal terlebih dahulu agar siap dikumpulkan besok."],
    missingInfoQuestions: ["Apa nama produk atau objek yang dipilih?", "Apakah dosen memberi deadline spesifik?", "Apakah ada data performa media sosial asli?"],
    suggestedWorkflow: [
      { step: 1, title: "Tetapkan objek", description: "Tentukan produk, brand, atau studi kasus yang akan dianalisis." },
      { step: 2, title: "Susun proposal", description: "Buat dokumen proposal dengan struktur ringkas dan jelas." },
      { step: 3, title: "Lengkapi simulasi", description: "Gunakan simulasi perencanaan bila data engagement asli belum tersedia." },
      { step: 4, title: "Siapkan presentasi", description: "Ringkas proposal menjadi slide setelah dokumen utama selesai." },
    ],
  };
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
