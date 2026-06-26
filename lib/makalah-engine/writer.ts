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
          content: generated?.content?.trim() || fallbackSubsectionContent(input, chapterOutline.title, subsection.title, index, chapterOutline.id),
        };
      }),
    });
  }

  let documentWithoutReview = {
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

  let review = reviewMakalah(documentWithoutReview);
  if (review.issues.some((issue) => issue.type === "duplicate-paragraph")) {
    documentWithoutReview = { ...documentWithoutReview, chapters: rewriteDuplicateParagraphsOnce(documentWithoutReview.chapters) };
    review = reviewMakalah(documentWithoutReview);
  }

  return {
    data: { ...documentWithoutReview, review },
    meta: { model, fallback },
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

function fallbackSubsectionContent(
  input: MakalahEngineInput,
  chapterTitle: string,
  subsectionTitle: string,
  index: number,
  chapterId: string
): string {
  const focus = input.tema || input.judul;
  const modeNote = input.mode === "fast"
    ? "Karena mode cepat digunakan, uraian diarahkan pada prioritas yang paling siap dipakai untuk pengumpulan dalam waktu dekat."
    : "Karena mode lengkap digunakan, uraian memberi ruang lebih besar pada penjelasan konsep, alasan, dan keterkaitan antarbagian.";
  const assignmentNote = input.assignmentAnalysis
    ? `Bagian ini mengikuti instruksi tugas "${input.assignmentAnalysis.title}" dan tidak menambahkan deliverable di luar daftar tugas dosen.`
    : "Bagian ini mengikuti struktur makalah akademik umum dengan tetap menjaga fokus pada objek kajian.";
  const lens = [
    `${chapterId} konteks konseptual`,
    `${chapterId} batasan pembahasan`,
    `${chapterId} keterkaitan teori dan praktik`,
    `${chapterId} implikasi akademik`,
    `${chapterId} arah rekomendasi`,
  ][index % 5];

  return [
    `Subbab ${subsectionTitle.toLowerCase()} dalam ${chapterTitle.toLowerCase()} membahas ${focus} melalui ${lens}. ${assignmentNote} Uraian ini ditempatkan untuk memperjelas posisi masalah, sehingga pembaca memahami alasan topik tersebut layak dikaji dalam mata kuliah ${input.mataKuliah}. Dengan menetapkan fokus sejak awal, pembahasan tidak melebar ke isu yang kurang relevan dan tetap mengikuti alur akademik yang runtut.`,
    `Pada bagian ini, ${focus} dipahami sebagai objek yang memiliki dimensi konseptual, operasional, dan sosial. Dimensi konseptual membantu menjelaskan istilah utama, dimensi operasional menunjukkan bagaimana konsep bekerja dalam situasi nyata, sedangkan dimensi sosial memperlihatkan pihak yang terdampak oleh keputusan atau strategi tertentu. ${modeNote}`,
    `Keterhubungan dengan bab lain perlu dijaga agar dokumen memiliki kesinambungan. Jika ${chapterTitle.toLowerCase()} menekankan ${lens}, maka bab berikutnya dapat menggunakan temuan bagian ini sebagai pijakan untuk menyusun analisis, strategi, atau kesimpulan. Apabila data performa belum diberikan, angka dan target ditulis sebagai simulasi perencanaan, bukan klaim hasil nyata.`,
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
    "Tambahkan sumber jurnal, buku, atau pedoman dosen yang benar-benar digunakan sebelum dokumen dikumpulkan.",
  ];
}

function buildLampiran(input: MakalahEngineInput): string[] {
  const items = [];
  if (input.pedoman) items.push(`Catatan pedoman penulisan: ${input.pedoman}`);
  if (input.assignmentAnalysis?.requiredDeliverables.length) {
    items.push(`Checklist deliverable: ${input.assignmentAnalysis.requiredDeliverables.map((item) => item.name).join(", ")}.`);
  }
  items.push("Lampiran data pendukung dapat ditambahkan setelah mahasiswa memiliki data asli dari objek kajian.");
  return items;
}

function rewriteDuplicateParagraphsOnce(chapters: MakalahChapter[]): MakalahChapter[] {
  const seen = new Set<string>();
  return chapters.map((chapter) => ({
    ...chapter,
    subsections: chapter.subsections.map((subsection) => {
      const paragraphs = subsection.content.split(/\n{2,}/);
      const rewritten = paragraphs.map((paragraph, index) => {
        const key = paragraph.toLowerCase().replace(/\s+/g, " ").trim();
        if (!key || !seen.has(key)) {
          if (key) seen.add(key);
          return paragraph;
        }
        return `Pada ${subsection.id}, pembahasan dipertegas melalui sudut pandang yang berbeda dari bagian sebelumnya. Fokusnya adalah menempatkan ${subsection.title.toLowerCase()} sebagai dasar pengambilan keputusan akademik, sehingga uraian tidak mengulang paragraf lama dan tetap mendukung alur ${chapter.number}. Penjelasan ini juga membantu pembaca melihat kontribusi subbab terhadap simpulan akhir.`;
      });
      return { ...subsection, content: rewritten.join("\n\n") };
    }),
  }));
}
