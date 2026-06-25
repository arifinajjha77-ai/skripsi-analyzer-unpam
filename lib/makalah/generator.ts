/**
 * SmartCampus V2 — Makalah Generator (Orchestrator)
 *
 * Orchestrates all V2 engines to produce a fully academic makalah:
 * 1. TopicEngine → analyze discipline + entities
 * 2. AuthorEngine → select discipline-specific authors
 * 3. OutlineEngine → generate dynamic BAB II outline
 * 4. WritingEngine → write each section with citations + tables
 * 5. BibliographyEngine → synchronize Daftar Pustaka
 *
 * Also provides BAB I, Kata Pengantar, Daftar Isi using established patterns.
 */

import { MakalahState } from "./store";
import { analyzeTopic, TopicAnalysis } from "./topicEngine";
import { getAuthorsForDiscipline, getCitationNarrative, getCitationInline, AcademicAuthor } from "./authorEngine";
import { generateOutline, generateDaftarIsiFromOutline, OutlineSection } from "./outlineEngine";
import { writeSection, WrittenSection } from "./writingEngine";
import { BibliographyTracker } from "./bibliographyEngine";

// ─── Output Types ─────────────────────────────────────────────────────────────

export interface SectionBlock {
  number: string;
  title: string;
  text: string;
  tableData?: import("./writingEngine").AcademicTable;
}

export interface MakalahOutput {
  // Text sections (for text export / quality checker)
  kataPengantar: string;
  daftarIsi: string;
  bab1: string;
  bab2: string;    // raw text joined for quality check
  bab3: string;
  daftarPustaka: string;

  // Structured sections (for rich DOCX export)
  bab2Sections: SectionBlock[];

  // Topic metadata
  analysis: TopicAnalysis;
  authors: AcademicAuthor[];
  citationCount: number;
}

// ─── Kata Pengantar ───────────────────────────────────────────────────────────

function generateKataPengantar(m: MakalahState): string {
  const date = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const kota = m.kota || "Indonesia";
  return (
    `Puji syukur penulis panjatkan ke hadirat Tuhan Yang Maha Esa atas segala rahmat dan karunia-Nya, ` +
    `sehingga makalah yang berjudul "${m.judul || "makalah ini"}" dapat diselesaikan dengan baik dan tepat waktu.\n\n` +
    `Makalah ini disusun guna memenuhi salah satu tugas pada mata kuliah ${m.mataKuliah || "yang diampu"} ` +
    `yang dibimbing oleh ${m.namaDosen || "Dosen Pengampu"}. ` +
    `Dalam penyusunan makalah ini, penulis menyadari bahwa masih terdapat kekurangan yang memerlukan ` +
    `masukan dan kritik yang konstruktif dari berbagai pihak.\n\n` +
    `Penulis menyampaikan ucapan terima kasih kepada:\n` +
    `1. ${m.namaDosen || "Dosen Pengampu"} yang telah memberikan bimbingan dan arahan;\n` +
    `2. Rekan-rekan ${m.kelompok ? "Kelompok " + m.kelompok : "kelompok"} yang telah bekerja sama;\n` +
    `3. Seluruh pihak yang telah memberikan dukungan dalam penyelesaian makalah ini.\n\n` +
    `Penulis berharap makalah ini dapat memberikan manfaat bagi pengembangan ilmu ` +
    `${m.programStudi || "pengetahuan"} dan menjadi referensi yang berguna.\n\n` +
    `${kota}, ${date}\n\nPenulis,\n\n` +
    `${m.anggota.filter((a) => a.nama).map((a) => a.nama).join("\n") || "Penulis"}`
  );
}

// ─── BAB I Generator ──────────────────────────────────────────────────────────

function generateBab1(m: MakalahState, analysis: TopicAnalysis, authors: AcademicAuthor[]): string {
  const a1 = authors[0];
  const a2 = authors[1] ?? authors[0];
  const topik   = m.topikRingkas || m.judul || "topik ini";
  const cit1    = getCitationNarrative(a1);
  const cit2    = getCitationInline(a2);

  const latar =
    m.latar ||
    `${analysis.label} merupakan bidang yang terus berkembang seiring dengan perubahan dinamika ` +
    `sosial, ekonomi, dan teknologi yang berlangsung secara simultan. ` +
    `Kajian tentang ${topik} menjadi semakin relevan mengingat kompleksitas permasalahan ` +
    `yang dihadapi oleh berbagai pihak, baik di tingkat individu, organisasi, maupun kebijakan publik.\n\n` +
    `${cit1} menegaskan bahwa pemahaman yang komprehensif terhadap ${analysis.label.toLowerCase()} ` +
    `merupakan fondasi penting dalam pengambilan keputusan yang rasional dan berbasis bukti. ` +
    `Berbagai penelitian telah menunjukkan bahwa penguasaan konsep dan teori yang kuat ` +
    `dalam bidang ini memiliki korelasi positif dengan keberhasilan penerapannya di lapangan.\n\n` +
    `Berdasarkan hal tersebut, makalah ini hadir untuk mengkaji secara akademik mengenai ${topik}, ` +
    `dengan harapan dapat memberikan kontribusi terhadap pemahaman yang lebih utuh ` +
    `mengenai bidang ${analysis.subbidang} ini. ${cit2} menyatakan bahwa kajian semacam ini ` +
    `penting dilakukan secara berkala mengingat perkembangan yang terus berlangsung.`;

  const rumusan =
    `Berdasarkan latar belakang di atas, penulis merumuskan masalah sebagai berikut:\n` +
    `1. Apa yang dimaksud dengan ${m.judul || topik} dalam konteks ${analysis.label}?\n` +
    `2. Bagaimana ${analysis.entities.slice(0, 2).join(" dan ") || "implementasi"} dari konsep tersebut dapat dipahami secara akademik?\n` +
    `3. Apa saja implikasi dan relevansi dari kajian ini terhadap praktik di bidang ${analysis.label.toLowerCase()}?`;

  const tujuan =
    m.tujuan ||
    `Makalah ini bertujuan untuk:\n` +
    `1. Mendeskripsikan dan menguraikan konsep dasar dari ${m.judul || topik};\n` +
    `2. Menganalisis berbagai aspek ${analysis.entities.slice(0, 2).join(" dan ") || "implementasi"} secara akademik;\n` +
    `3. Memberikan gambaran komprehensif mengenai implikasi dan relevansi topik ini.`;

  const manfaat =
    `Manfaat yang diharapkan dari makalah ini adalah:\n\n` +
    `1. Bagi Penulis\n` +
    `   Menambah wawasan dan meningkatkan kemampuan analisis dalam bidang ${analysis.label.toLowerCase()}.\n\n` +
    `2. Bagi Pembaca\n` +
    `   Menyediakan referensi akademik yang dapat digunakan untuk memahami ${topik} lebih mendalam.\n\n` +
    `3. Bagi Akademisi\n` +
    `   Menjadi kontribusi dalam pengembangan kajian ${analysis.subbidang}.`;

  return [
    "1.1 Latar Belakang\n\n" + latar,
    "1.2 Rumusan Masalah\n\n" + rumusan,
    "1.3 Tujuan Penulisan\n\n" + tujuan,
    "1.4 Manfaat Penulisan\n\n" + manfaat,
  ].join("\n\n");
}

// ─── BAB III Generator ────────────────────────────────────────────────────────

function generateBab3(m: MakalahState, analysis: TopicAnalysis): string {
  const topik = m.topikRingkas || m.judul || "topik ini";

  const kesimpulan =
    `Berdasarkan pembahasan yang telah dilakukan, dapat ditarik beberapa kesimpulan sebagai berikut:\n\n` +
    `1. ${analysis.label} sebagai bidang keilmuan memiliki relevansi yang tinggi dalam konteks kehidupan ` +
    `akademik dan profesional, khususnya dalam kajian mengenai ${topik}.\n\n` +
    `2. ${analysis.entities.length > 0
        ? `Analisis terhadap ${analysis.entities.slice(0, 3).map((e) => e.charAt(0).toUpperCase() + e.slice(1)).join(", ")} menunjukkan bahwa setiap komponen memiliki karakteristik unik yang perlu dipahami secara mendalam sebelum keputusan diambil.`
        : `Landasan teori yang kuat terbukti menjadi fondasi penting dalam pemahaman dan implementasi konsep ${analysis.label.toLowerCase()} yang efektif.`}\n\n` +
    `3. Penerapan konsep ${analysis.label.toLowerCase()} yang tepat dan kontekstual membutuhkan ` +
    `pemahaman terhadap berbagai faktor yang saling mempengaruhi, ` +
    `serta pendekatan yang fleksibel dan adaptif terhadap perubahan yang terjadi.`;

  const saran =
    `Berdasarkan kesimpulan di atas, penulis mengajukan saran sebagai berikut:\n\n` +
    `1. Bagi Mahasiswa\n` +
    `   Hendaknya memperdalam pemahaman terhadap ${topik} melalui kajian literatur yang lebih komprehensif ` +
    `dan mengaitkannya dengan fenomena nyata dalam kehidupan sehari-hari.\n\n` +
    `2. Bagi Institusi Pendidikan\n` +
    `   Diharapkan menyediakan lebih banyak materi pembelajaran dan diskusi akademik ` +
    `yang berkaitan dengan ${analysis.label.toLowerCase()} agar mahasiswa dapat ` +
    `mengembangkan kompetensi yang relevan dengan kebutuhan dunia kerja.\n\n` +
    `3. Bagi Peneliti Selanjutnya\n` +
    `   Makalah ini masih terbatas dalam cakupan dan kedalaman analisis. ` +
    `Diharapkan penelitian selanjutnya dapat mengeksplorasi aspek yang belum tercakup, ` +
    `khususnya melalui penelitian empiris yang melibatkan data primer yang lebih kaya.`;

  return [
    "3.1 Kesimpulan\n\n" + kesimpulan,
    "3.2 Saran\n\n" + saran,
  ].join("\n\n");
}

// ─── Main Generate Function ───────────────────────────────────────────────────

export function generateMakalah(m: MakalahState): MakalahOutput {
  // ── 1. Topic Intelligence ──────────────────────────────────────────────────
  const analysis = analyzeTopic(m.judul || m.topikRingkas || m.mataKuliah || "");

  // ── 2. Author Selection ────────────────────────────────────────────────────
  const authors = getAuthorsForDiscipline(analysis.bidang, 8);
  const tracker = new BibliographyTracker(authors);

  // ── 3. Dynamic Outline ────────────────────────────────────────────────────
  const outline: OutlineSection[] = generateOutline(analysis);

  // ── 4. Write Each BAB II Section ──────────────────────────────────────────
  const bab2Sections: SectionBlock[] = [];
  for (const section of outline) {
    const written: WrittenSection = writeSection(section, analysis, authors);
    tracker.markUsed(written.authorsUsed);
    bab2Sections.push({
      number: section.number,
      title: section.title,
      text: written.text,
      tableData: written.table,
    });
  }

  // ── 5. BAB I + Kata Pengantar + BAB III ──────────────────────────────────
  const kataPengantar = generateKataPengantar(m);
  const bab1          = generateBab1(m, analysis, authors);
  const bab3          = generateBab3(m, analysis);

  // Mark BAB I authors as used too
  tracker.markUsed([authors[0].id, authors[1]?.id ?? authors[0].id]);

  // ── 6. Synchronized Daftar Pustaka ────────────────────────────────────────
  const daftarPustaka = tracker.generateDaftarPustaka();

  // ── 7. Flat BAB II text (for quality checker + simple text display) ───────
  const bab2Text = bab2Sections
    .map((s) => `${s.number} ${s.title}\n\n${s.text}`)
    .join("\n\n");

  return {
    kataPengantar,
    daftarIsi: generateDaftarIsiFromOutline(outline),
    bab1,
    bab2: bab2Text,
    bab2Sections,
    bab3,
    daftarPustaka,
    analysis,
    authors,
    citationCount: tracker.getCitationCount(),
  };
}
