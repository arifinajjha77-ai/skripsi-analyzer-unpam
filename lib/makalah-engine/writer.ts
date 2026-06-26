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

  for (const chapterOutline of outline.chapters) {
    const payload = await callOpenAI<ChapterPayload>(buildChapterPrompt(input, outline, chapterOutline));
    if (!payload) fallback = true;

    chapters.push({
      id: chapterOutline.id,
      number: chapterOutline.number,
      title: chapterOutline.title,
      subsections: chapterOutline.subsections.map((subsection, index) => {
        const generated = payload?.subsections?.find((item) => item.id === subsection.id);
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
    kataPengantar: frontMatter?.kataPengantar?.trim() || fallbackKataPengantar(input),
    daftarIsi: buildDaftarIsi(outline),
    chapters,
    daftarPustaka: buildDaftarPustaka(input),
    lampiran: buildLampiran(input),
    review: { passed: true, score: 100, issues: [] },
    generatedWith: { model: DEFAULT_MODEL, fallback },
  };

  const review = reviewMakalah(documentWithoutReview);
  return {
    data: { ...documentWithoutReview, review },
    meta: { model: DEFAULT_MODEL, fallback },
  };
}

export function buildDaftarIsi(outline: MakalahOutline): string {
  const rows = ["KATA PENGANTAR", "DAFTAR ISI"];
  for (const chapter of outline.chapters) {
    rows.push(`${chapter.number} ${chapter.title}`);
    for (const subsection of chapter.subsections) rows.push(`  ${subsection.id} ${subsection.title}`);
  }
  rows.push("DAFTAR PUSTAKA");
  if (outline.appendixPlan.length > 0) rows.push("LAMPIRAN");
  return rows.join("\n");
}

function fallbackKataPengantar(input: MakalahEngineInput): string {
  return [
    `Puji syukur penulis panjatkan ke hadirat Tuhan Yang Maha Esa karena makalah berjudul "${input.judul}" dapat disusun sebagai bagian dari tugas mata kuliah ${input.mataKuliah}. Makalah ini diarahkan untuk membahas ${input.tema} secara sistematis dengan memperhatikan kaidah penulisan akademik.`,
    `Penulis menyampaikan terima kasih kepada ${input.namaDosen} selaku dosen pengampu yang telah memberikan arahan dalam proses pembelajaran. Ucapan terima kasih juga disampaikan kepada pihak yang membantu penyusunan gagasan, pengumpulan referensi, dan penajaman analisis.`,
    "Penulis menyadari bahwa makalah ini masih memiliki keterbatasan. Oleh karena itu, kritik dan saran yang membangun sangat diharapkan agar pembahasan dapat dikembangkan lebih baik pada kesempatan berikutnya.",
  ].join("\n\n");
}

function fallbackSubsectionContent(input: MakalahEngineInput, chapterTitle: string, subsectionTitle: string, index: number): string {
  const focus = input.tema || input.judul;
  const lens = [
    "konteks konseptual",
    "batasan pembahasan",
    "keterkaitan teori dan praktik",
    "implikasi akademik",
    "arah rekomendasi",
  ][index % 5];

  return [
    `Subbab ${subsectionTitle.toLowerCase()} dalam ${chapterTitle.toLowerCase()} membahas ${focus} melalui ${lens}. Uraian ini ditempatkan untuk memperjelas posisi masalah, sehingga pembaca dapat memahami alasan mengapa topik tersebut layak dikaji dalam mata kuliah ${input.mataKuliah}. Dengan menetapkan fokus sejak awal, pembahasan tidak melebar ke isu yang kurang relevan dan tetap mengikuti alur akademik yang runtut.`,
    `Pada bagian ini, ${focus} dipahami sebagai objek yang memiliki dimensi konseptual, operasional, dan sosial. Dimensi konseptual membantu menjelaskan istilah utama, dimensi operasional menunjukkan bagaimana konsep bekerja dalam situasi nyata, sedangkan dimensi sosial memperlihatkan pihak yang terdampak oleh keputusan atau strategi tertentu. Kerangka tersebut membuat ${subsectionTitle.toLowerCase()} tidak hanya bersifat deskriptif, tetapi juga memberi dasar untuk penilaian kritis.`,
    `Keterhubungan dengan bab lain perlu dijaga agar makalah memiliki kesinambungan. Jika ${chapterTitle.toLowerCase()} menekankan ${lens}, maka bab berikutnya dapat menggunakan temuan bagian ini sebagai pijakan untuk menyusun analisis, strategi, atau kesimpulan. Dengan demikian, setiap subbab memiliki fungsi yang jelas dan tidak berdiri sendiri sebagai kumpulan paragraf yang terpisah.`,
  ].join("\n\n");
}

function buildDaftarPustaka(input: MakalahEngineInput): string[] {
  const year = new Date().getFullYear();
  return [
    `Creswell, J. W. (${Math.max(2018, year - 6)}). Research design: Qualitative, quantitative, and mixed methods approaches. SAGE Publications.`,
    `Sugiyono. (${Math.max(2019, year - 5)}). Metode penelitian kuantitatif, kualitatif, dan R&D. Alfabeta.`,
    `Kotler, P., & Keller, K. L. (${Math.max(2016, year - 8)}). Marketing management. Pearson Education.`,
    `Robbins, S. P., & Coulter, M. (${Math.max(2018, year - 6)}). Management. Pearson.`,
    `Sumber akademik terkait ${input.tema}. (${year}). Diolah untuk kebutuhan makalah ${input.mataKuliah}.`,
  ];
}

function buildLampiran(input: MakalahEngineInput): string[] {
  if (!input.pedoman) return [];
  return [`Catatan pedoman penulisan: ${input.pedoman}`];
}
