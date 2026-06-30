import { generateJsonWithOpenAI } from "@/lib/ai/openai";
import { DEFAULT_MODEL } from "@/lib/ai/models";
import { assignmentAnalysisSchema, type AssignmentAnalysis } from "./types";

type AnalyzePayload = {
  analysis: AssignmentAnalysis;
};

export async function analyzeAssignment(
  extractedText: string,
  userNotes = ""
): Promise<{ analysis: AssignmentAnalysis; model: string; fallback: boolean }> {
  const ai = await generateJsonWithOpenAI<AnalyzePayload>(buildPrompt(extractedText, userNotes));
  if (ai) {
    const parsed = assignmentAnalysisSchema.safeParse(ai.data.analysis);
    if (parsed.success) {
      return { analysis: normalizeAnalysis(parsed.data, extractedText, userNotes), model: ai.model, fallback: false };
    }
  }

  return { analysis: fallbackAnalysis(extractedText, userNotes), model: DEFAULT_MODEL, fallback: true };
}

function buildPrompt(extractedText: string, userNotes: string): string {
  return [
    "Anda adalah engine SmartCampus untuk membaca instruksi tugas dosen secara dinamis.",
    "Jangan mengunci jawaban ke satu mata kuliah atau satu produk. Ekstrak hanya dari dokumen dan catatan user.",
    "Balas JSON valid tanpa markdown dengan bentuk:",
    JSON.stringify({
      analysis: {
        title: "string",
        course: "string optional",
        assignmentType: "string",
        requestedOutput: ["string"],
        reportStructure: ["string"],
        gradingRubric: [{ aspect: "string", weight: "string optional", description: "string optional" }],
        missingData: [{
          id: "camelCase string",
          label: "string",
          question: "string",
          required: true,
          type: "text|textarea|number|date|select",
          placeholder: "string optional",
          options: ["string optional"],
        }],
        summary: "string",
        writingRules: {
          language: "string optional",
          citationStyle: "string optional",
          formatting: "string optional",
          deadline: "string optional",
        },
        assumptions: ["string"],
        deliverables: [{ name: "string", type: "proposal|report|weekly_report|final_report|presentation|essay|worksheet|other", description: "string", priority: "high|medium|low" }],
      },
    }),
    "missingData harus berisi data mahasiswa/proyek yang benar-benar dibutuhkan untuk membuat output. Tanyakan satu fakta per item, bukan pertanyaan gabungan.",
    "Selalu sertakan data inti bila belum jelas: topik/produk/objek, mata kuliah bila tidak ada, nama output utama, identitas penulis/kelompok jika dokumen akademik, target audiens atau data objek bila relevan.",
    "Jika rubrik tidak tertulis, buat rubrik inferensi yang ditandai sebagai asumsi pada field assumptions.",
    `Catatan user:\n${userNotes || "-"}`,
    `Teks tugas dosen:\n${extractedText}`,
  ].join("\n\n");
}

function normalizeAnalysis(value: AssignmentAnalysis, extractedText: string, userNotes: string): AssignmentAnalysis {
  const fallback = fallbackAnalysis(extractedText, userNotes);
  return {
    title: clean(value.title) || fallback.title,
    course: clean(value.course) || fallback.course,
    assignmentType: clean(value.assignmentType) || fallback.assignmentType,
    requestedOutput: nonEmpty(value.requestedOutput, fallback.requestedOutput),
    reportStructure: nonEmpty(value.reportStructure, fallback.reportStructure),
    gradingRubric: value.gradingRubric.length > 0 ? value.gradingRubric : fallback.gradingRubric,
    missingData: value.missingData.length > 0 ? dedupeQuestions(value.missingData) : fallback.missingData,
    summary: clean(value.summary) || fallback.summary,
    writingRules: { ...fallback.writingRules, ...value.writingRules },
    assumptions: nonEmpty(value.assumptions, fallback.assumptions),
    deliverables: value.deliverables.length > 0 ? value.deliverables : fallback.deliverables,
  };
}

function fallbackAnalysis(extractedText: string, userNotes: string): AssignmentAnalysis {
  const source = `${extractedText}\n${userNotes}`;
  const course = match(source, /mata\s*kuliah\s*:?\s*([^\n.]+)/i) || match(source, /(social media marketing|manajemen pemasaran|kewirausahaan|statistik|metodologi penelitian)/i);
  const output = match(source, /(proposal[^.\n]*|laporan[^.\n]*|makalah[^.\n]*|presentasi[^.\n]*|mini project[^.\n]*)/i) || "Laporan tugas";
  const isProposal = /proposal|mini project/i.test(output);

  return {
    title: output,
    course,
    assignmentType: isProposal ? "Proposal" : "Tugas Akademik",
    requestedOutput: [output],
    reportStructure: isProposal
      ? ["Pendahuluan", "Profil Objek/Produk", "Analisis Situasi", "Strategi dan Rencana Kerja", "Timeline", "Evaluasi", "Penutup"]
      : ["Pendahuluan", "Pembahasan", "Analisis", "Kesimpulan", "Daftar Pustaka"],
    gradingRubric: [
      { aspect: "Kesesuaian instruksi", description: "Isi dokumen mengikuti output dan struktur tugas dosen." },
      { aspect: "Kelengkapan data", description: "Data objek, identitas, dan rencana kerja disajikan jelas." },
      { aspect: "Kualitas analisis", description: "Argumen logis, relevan dengan mata kuliah, dan tidak mengarang data aktual." },
      { aspect: "Kerapian penulisan", description: "Bahasa formal, struktur rapi, dan siap diekspor ke DOCX." },
    ],
    missingData: [
      {
        id: "mainObject",
        label: "Objek utama",
        question: "Apa produk, topik, brand, kasus, atau objek utama tugas ini?",
        required: true,
        type: "text",
        placeholder: "Contoh: Fidget Clicker Custom Name",
      },
      {
        id: "studentIdentity",
        label: "Identitas penulis",
        question: "Siapa nama mahasiswa atau anggota kelompok yang akan ditulis di dokumen?",
        required: true,
        type: "textarea",
      },
      {
        id: "lecturerName",
        label: "Nama dosen",
        question: "Siapa nama dosen pengampu? Kosongkan dengan tanda '-' jika belum tahu.",
        required: false,
        type: "text",
      },
      {
        id: "objectDetails",
        label: "Detail objek",
        question: "Detail penting apa yang harus saya pakai tentang objek tersebut?",
        required: true,
        type: "textarea",
        placeholder: "Fitur, target pasar, platform, data awal, batasan, atau catatan dosen.",
      },
    ],
    summary: "Instruksi tugas berhasil dibaca dengan mode fallback. SmartCampus akan menggunakan struktur akademik dinamis dan menandai data yang belum tersedia sebagai asumsi atau simulasi.",
    writingRules: {
      language: "Bahasa Indonesia formal akademik",
      citationStyle: "APA sederhana bila referensi diperlukan",
      formatting: "DOCX rapi dengan heading dan paragraf akademik",
    },
    assumptions: ["Rubrik tidak terbaca eksplisit sehingga rubrik disusun sebagai inferensi umum.", "Data performa yang belum diberikan tidak akan diklaim sebagai hasil aktual."],
    deliverables: [{ name: output, type: isProposal ? "proposal" : "report", description: "Dokumen utama sesuai instruksi tugas.", priority: "high" }],
  };
}

function dedupeQuestions(questions: AssignmentAnalysis["missingData"]): AssignmentAnalysis["missingData"] {
  const seen = new Set<string>();
  return questions.filter((question) => {
    const key = question.id.trim() || question.label.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function nonEmpty(values: string[], fallback: string[]): string[] {
  const cleaned = values.map(clean).filter(Boolean);
  return cleaned.length > 0 ? cleaned : fallback;
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function match(source: string, pattern: RegExp): string {
  return source.match(pattern)?.[1]?.trim() || "";
}
