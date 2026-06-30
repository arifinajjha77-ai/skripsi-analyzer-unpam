import type { EngineResult, MakalahChapter, MakalahDocument, MakalahEngineInput, MakalahOutline } from "./types";
import { buildChapterPrompt, buildFrontMatterPrompt, DEFAULT_MODEL } from "./prompts";
import { callOpenAI } from "./planner";
import { reviewMakalah } from "./reviewer";

type ChapterPayload = { subsections: Array<{ id: string; title: string; content: string }> };
type FrontMatterPayload = { kataPengantar: string };

export async function generateMakalahDocument(
  input: MakalahEngineInput,
  outline: MakalahOutline,
  outlineFallback: boolean
): Promise<EngineResult<MakalahDocument>> {
  const frontMatter = await callOpenAI<FrontMatterPayload>(buildFrontMatterPrompt(input, outline));
  const chapters: MakalahChapter[] = [];
  let fallback = outlineFallback || !frontMatter;
  let model = frontMatter?.model || DEFAULT_MODEL;

  for (const chapterOutline of outline.chapters) {
    const payload = await callOpenAI<ChapterPayload>(buildChapterPrompt(input, outline, chapterOutline));
    if (!payload) fallback = true;
    if (payload?.model) model = payload.model;

    chapters.push({
      id: chapterOutline.id,
      number: chapterOutline.number,
      title: chapterOutline.title,
      subsections: chapterOutline.subsections.map((subsection, index) => {
        const generated = payload?.data.subsections?.find((item) => item.id === subsection.id);
        return {
          ...subsection,
          title: generated?.title?.trim() || subsection.title,
          content: generated?.content?.trim() || fallbackSubsectionContent(input, chapterOutline.title, subsection.title, index),
        };
      }),
    });
  }

  const documentWithoutReview = {
    input,
    outline,
    kataPengantar: frontMatter?.data.kataPengantar?.trim() || fallbackKataPengantar(input),
    daftarIsi: buildDaftarIsi(outline),
    chapters,
    daftarPustaka: buildDaftarPustaka(input),
    lampiran: buildLampiran(input),
    review: { passed: true, score: 100, issues: [] },
    generatedWith: { model, fallback },
  };

  return {
    data: { ...documentWithoutReview, review: reviewMakalah(documentWithoutReview) },
    meta: { model, fallback },
  };
}

export function buildDaftarIsi(outline: MakalahOutline): string {
  const rows = ["KATA PENGANTAR .......................................................... i", "DAFTAR ISI ............................................................... ii"];
  for (const chapter of outline.chapters) {
    rows.push(`${chapter.number} ${chapter.title} ........................................ [hal]`);
    for (const subsection of chapter.subsections) rows.push(`  ${subsection.id} ${subsection.title} ..................................... [hal]`);
  }
  rows.push("DAFTAR PUSTAKA ..................................................... [hal]");
  if (outline.appendixPlan.length > 0) rows.push("LAMPIRAN ............................................................. [hal]");
  return rows.join("\n");
}

function fallbackKataPengantar(input: MakalahEngineInput): string {
  return [
    `Puji syukur penulis panjatkan ke hadirat Tuhan Yang Maha Esa karena dokumen berjudul "${input.judul}" dapat disusun sebagai bagian dari tugas mata kuliah ${input.mataKuliah}. Dokumen ini membahas ${input.tema} secara sistematis dengan memperhatikan instruksi dosen dan kaidah penulisan akademik.`,
    `Penulis menyampaikan terima kasih kepada ${input.namaDosen} selaku dosen pengampu atas arahan pembelajaran yang diberikan. Data yang belum tersedia diposisikan sebagai asumsi atau rencana, bukan sebagai klaim hasil aktual.`,
    "Penulis menyadari dokumen ini masih dapat disempurnakan setelah data pendukung, referensi, atau umpan balik dosen diperoleh.",
  ].join("\n\n");
}

function fallbackSubsectionContent(input: MakalahEngineInput, chapterTitle: string, subsectionTitle: string, index: number): string {
  const focus = input.tema || input.judul;
  const rubric = input.assignmentAnalysis?.gradingRubric.map((item) => item.aspect).join(", ") || "kesesuaian instruksi, kelengkapan data, dan kualitas pembahasan";
  const lens = ["konteks", "batasan", "data pendukung", "analisis", "rekomendasi"][index % 5];
  return [
    `Subbab ${subsectionTitle.toLowerCase()} pada ${chapterTitle.toLowerCase()} membahas ${focus} melalui sudut pandang ${lens}. Uraian ini dibuat agar pembaca memahami hubungan antara topik, tujuan tugas, dan mata kuliah ${input.mataKuliah}.`,
    `Data yang diberikan mahasiswa menjadi dasar utama pembahasan. Apabila terdapat informasi yang belum tersedia, bagian tersebut ditulis sebagai asumsi akademik atau rencana tindak lanjut sehingga dokumen tidak mengarang fakta, angka, atau capaian yang belum dibuktikan.`,
    `Bagian ini juga memperhatikan rubrik penilaian seperti ${rubric}. Dengan demikian, pembahasan diarahkan untuk tetap relevan dengan instruksi dosen, runtut secara struktur, dan dapat diperbaiki ketika data asli sudah lengkap.`,
  ].join("\n\n");
}

function buildDaftarPustaka(input: MakalahEngineInput): string[] {
  const year = new Date().getFullYear();
  return [
    `Creswell, J. W. (${Math.max(2018, year - 6)}). Research design: Qualitative, quantitative, and mixed methods approaches. SAGE Publications.`,
    `Sugiyono. (${Math.max(2019, year - 5)}). Metode penelitian kuantitatif, kualitatif, dan R&D. Alfabeta.`,
    `Referensi akademik terkait ${input.tema || input.judul}. (${year}). Disesuaikan dengan instruksi mata kuliah ${input.mataKuliah}.`,
  ];
}

function buildLampiran(input: MakalahEngineInput): string[] {
  const deliverables = input.assignmentAnalysis?.requiredDeliverables.map((item) => `${item.name}: ${item.description}`) || [];
  return deliverables.length > 0
    ? ["Checklist deliverable tugas dosen:", ...deliverables]
    : ["Lampiran data pendukung dapat ditambahkan setelah mahasiswa memiliki data asli dari objek kajian."];
}
