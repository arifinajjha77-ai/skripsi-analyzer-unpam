import { generateJsonWithOpenAI } from "@/lib/ai/openai";
import { DEFAULT_MODEL } from "@/lib/ai/models";
import { buildAnsweredFacts } from "./missingData";
import { assignmentReportSchema, type AssignmentAnalysis, type AssignmentAnswers, type AssignmentReport } from "./types";

type ReportPayload = {
  report: AssignmentReport;
};

export async function generateAssignmentReport(
  analysis: AssignmentAnalysis,
  answers: AssignmentAnswers,
  optionalNotes = ""
): Promise<AssignmentReport> {
  const ai = await generateJsonWithOpenAI<ReportPayload>(buildPrompt(analysis, answers, optionalNotes));
  if (ai) {
    const parsed = assignmentReportSchema.safeParse(ai.data.report);
    if (parsed.success) {
      return { ...parsed.data, generatedWith: { model: ai.model, fallback: false } };
    }
  }

  return fallbackReport(analysis, answers);
}

function buildPrompt(analysis: AssignmentAnalysis, answers: AssignmentAnswers, optionalNotes: string): string {
  return [
    "Anda adalah SmartCampus Dynamic Assignment Workspace.",
    "Generate proposal/laporan berdasarkan analisis instruksi tugas dan jawaban user. Jangan hardcode produk tertentu.",
    "Jika data performa, angka penjualan, atau engagement tidak diberikan, tulis sebagai simulasi/rencana, bukan fakta aktual.",
    "Gunakan Bahasa Indonesia formal akademik. Buat isi siap diekspor ke DOCX.",
    "Balas JSON valid tanpa markdown dengan bentuk:",
    JSON.stringify({
      report: {
        title: "string",
        course: "string",
        outputType: "string",
        executiveSummary: "string",
        sections: [{ title: "string", body: "string multi paragraph" }],
        references: ["string"],
        appendices: ["string"],
        rubricChecks: [{ aspect: "string", status: "met|partial|missing", note: "string" }],
        generatedWith: { model: "string", fallback: false },
      },
    }),
    "Rubric awareness: setiap aspek rubrik harus dipakai sebagai checklist kualitas. Tulis isi dokumen agar memenuhi rubrik, lalu isi rubricChecks secara jujur.",
    `Analisis tugas:\n${JSON.stringify(analysis, null, 2)}`,
    `Jawaban user:\n${JSON.stringify(answers, null, 2)}`,
    `Catatan tambahan:\n${optionalNotes || "-"}`,
  ].join("\n\n");
}

function fallbackReport(analysis: AssignmentAnalysis, answers: AssignmentAnswers): AssignmentReport {
  const facts = buildAnsweredFacts(analysis, answers);
  const object = answers.mainObject || answers.productName || answers.topic || answers.brandName || facts[0]?.value || "Objek tugas";
  const course = analysis.course || answers.course || "Mata Kuliah";
  const outputType = analysis.deliverables.find((item) => item.priority === "high")?.name || analysis.requestedOutput[0] || analysis.assignmentType;

  const sections = analysis.reportStructure.map((title, index) => ({
    title,
    body: buildFallbackSection(title, index, analysis, facts, object, course),
  }));

  return {
    title: `${outputType}: ${object}`,
    course,
    outputType,
    executiveSummary: `${outputType} ini disusun untuk memenuhi tugas ${course}. Dokumen membahas ${object} dengan mengikuti instruksi dosen, struktur laporan, dan rubrik yang telah dianalisis SmartCampus.`,
    sections,
    references: buildReferences(course),
    appendices: [
      "Lampiran data pendukung dapat ditambahkan setelah user memiliki file, visual, data survei, atau insight platform yang asli.",
      "Angka target yang belum memiliki bukti aktual harus diposisikan sebagai simulasi perencanaan.",
    ],
    rubricChecks: buildRubricChecks(analysis, sections),
    generatedWith: { model: DEFAULT_MODEL, fallback: true },
  };
}

function buildFallbackSection(
  title: string,
  index: number,
  analysis: AssignmentAnalysis,
  facts: Array<{ label: string; value: string }>,
  object: string,
  course: string
): string {
  const factText = facts.length > 0
    ? facts.map((fact) => `${fact.label}: ${fact.value}`).join("; ")
    : "Data detail masih terbatas sehingga pembahasan memakai asumsi akademik yang wajar.";
  const rubric = analysis.gradingRubric.map((item) => item.aspect).join(", ");
  const paragraphs = [
    `${title} membahas ${object} dalam konteks ${course}. Bagian ini disusun agar dokumen tetap mengikuti instruksi tugas, terutama output ${analysis.requestedOutput.join(", ")} dan struktur yang diminta dosen.`,
    `Data yang digunakan pada bagian ini meliputi ${factText}. Apabila ada data yang belum tersedia, informasi tersebut tidak dinyatakan sebagai hasil aktual, melainkan sebagai rencana, asumsi, atau simulasi yang dapat diperbarui setelah data asli tersedia.`,
    `Fokus penulisan pada bagian ini diarahkan pada ${analysis.gradingRubric[index % Math.max(1, analysis.gradingRubric.length)]?.aspect || "kelengkapan pembahasan"}. Dengan demikian, pembahasan tetap terhubung dengan rubrik penilaian seperti ${rubric || "kesesuaian instruksi dan kualitas analisis"}.`,
  ];
  return paragraphs.join("\n\n");
}

function buildReferences(course: string): string[] {
  const lower = course.toLowerCase();
  if (lower.includes("marketing") || lower.includes("pemasaran")) {
    return [
      "Kotler, P., & Keller, K. L. (2016). Marketing management. Pearson Education.",
      "Tuten, T. L., & Solomon, M. R. (2018). Social media marketing. SAGE Publications.",
      "Chaffey, D., & Ellis-Chadwick, F. (2019). Digital marketing: Strategy, implementation and practice. Pearson.",
    ];
  }
  return [
    "Creswell, J. W. (2018). Research design: Qualitative, quantitative, and mixed methods approaches. SAGE Publications.",
    "Sugiyono. (2019). Metode penelitian kuantitatif, kualitatif, dan R&D. Alfabeta.",
    "Referensi tambahan disesuaikan dengan topik dan instruksi dosen.",
  ];
}

function buildRubricChecks(analysis: AssignmentAnalysis, sections: Array<{ title: string; body: string }>): AssignmentReport["rubricChecks"] {
  const body = sections.map((section) => `${section.title}\n${section.body}`).join("\n").toLowerCase();
  return analysis.gradingRubric.map((rubric) => {
    const tokens = rubric.aspect.toLowerCase().split(/\W+/).filter((token) => token.length > 4);
    const hits = tokens.filter((token) => body.includes(token)).length;
    const status = hits > 0 || body.includes("rubrik") ? "partial" : "partial";
    return {
      aspect: rubric.aspect,
      status,
      note: "Sudah dipertimbangkan dalam struktur dan narasi dasar. Perlu review manual untuk penilaian final.",
    };
  });
}
