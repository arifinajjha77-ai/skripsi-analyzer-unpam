/**
 * Makalah Generator — generates all sections of an academic paper (makalah).
 *
 * Reuses SmartCampus Academic Engines:
 * - authorMapping.ts for citations
 * - citationEngine principles for academic tone
 *
 * Output sections:
 *   - Kata Pengantar
 *   - Daftar Isi (auto-generated list)
 *   - BAB I  — Pendahuluan (1.1 Latar Belakang, 1.2 Rumusan Masalah, 1.3 Tujuan, 1.4 Manfaat)
 *   - BAB II — Pembahasan (2.1 Landasan Teori, 2.2 Analisis, 2.3 Implikasi)
 *   - BAB III — Penutup (3.1 Kesimpulan, 3.2 Saran)
 *   - Daftar Pustaka
 */

import { MakalahState } from "./store";

// ─── Helper ───────────────────────────────────────────────────────────────────

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getYear(): number {
  return new Date().getFullYear();
}

// ─── Citation Context ─────────────────────────────────────────────────────────

interface SimpleRef {
  author: string;
  year: number;
  source: string;
}

function buildRefs(judul: string, mataKuliah: string): SimpleRef[] {
  const t = `${judul} ${mataKuliah}`.toLowerCase();

  const refs: SimpleRef[] = [];

  if (/ekonomi|bisnis|manajemen|pemasaran/.test(t)) {
    refs.push({ author: "Kotler & Keller", year: 2022, source: "Manajemen Pemasaran" });
    refs.push({ author: "Tjiptono", year: 2021, source: "Strategi Pemasaran" });
  }
  if (/keuangan|akuntansi|pajak/.test(t)) {
    refs.push({ author: "Kasmir", year: 2022, source: "Analisis Laporan Keuangan" });
    refs.push({ author: "Brigham & Houston", year: 2021, source: "Dasar-Dasar Manajemen Keuangan" });
  }
  if (/hukum|perundangan|regulasi/.test(t)) {
    refs.push({ author: "Mertokusumo", year: 2021, source: "Mengenal Hukum" });
  }
  if (/pendidikan|pembelajaran|kurikulum/.test(t)) {
    refs.push({ author: "Sugiyono", year: 2022, source: "Metode Penelitian Pendidikan" });
    refs.push({ author: "Hamalik", year: 2021, source: "Kurikulum dan Pembelajaran" });
  }
  if (/teknologi|digital|sistem informasi|it/.test(t)) {
    refs.push({ author: "Chaffey & Ellis-Chadwick", year: 2022, source: "Digital Marketing" });
    refs.push({ author: "Kaplan & Haenlein", year: 2022, source: "Social Media" });
  }
  if (/sosial|masyarakat|sosiologi/.test(t)) {
    refs.push({ author: "Soerjono Soekanto", year: 2021, source: "Sosiologi Suatu Pengantar" });
  }
  if (/kesehatan|medis|farmasi/.test(t)) {
    refs.push({ author: "Notoatmodjo", year: 2021, source: "Ilmu Kesehatan Masyarakat" });
  }
  if (/lingkungan|alam|ekologi/.test(t)) {
    refs.push({ author: "Soemarwoto", year: 2021, source: "Ekologi, Lingkungan Hidup dan Pembangunan" });
  }

  // Always include general academic references
  refs.push({ author: "Sugiyono", year: 2022, source: "Metode Penelitian Kuantitatif, Kualitatif, dan R&D" });
  refs.push({ author: "Arikunto", year: 2021, source: "Prosedur Penelitian: Suatu Pendekatan Praktik" });

  // Deduplicate by author
  const seen = new Set<string>();
  return refs.filter((r) => {
    if (seen.has(r.author)) return false;
    seen.add(r.author);
    return true;
  });
}

function citationInline(ref: SimpleRef): string {
  return `(${ref.author}, ${ref.year})`;
}

// ─── Section Generators ───────────────────────────────────────────────────────

export function generateKataPengantar(m: MakalahState): string {
  const date = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const kota = m.kota || m.universitas?.split(" ").pop() || "Indonesia";

  return (
    `Puji syukur penulis panjatkan ke hadirat Tuhan Yang Maha Esa atas segala rahmat dan karunia-Nya, ` +
    `sehingga makalah yang berjudul "${m.judul || "makalah ini"}" dapat diselesaikan ` +
    `dengan baik dan tepat waktu.\n\n` +
    `Makalah ini disusun guna memenuhi salah satu tugas pada mata kuliah ${m.mataKuliah || "yang diampu"} ` +
    `yang dibimbing oleh ${m.namaDosen || "Dosen Pengampu"}. ` +
    `Dalam penyusunan makalah ini, penulis menyadari bahwa terdapat banyak kekurangan dan keterbatasan ` +
    `pengetahuan, sehingga penulis sangat mengharapkan kritik dan saran yang membangun dari berbagai pihak ` +
    `demi kesempurnaan makalah ini.\n\n` +
    `Pada kesempatan ini, penulis menyampaikan terima kasih yang sebesar-besarnya kepada:\n` +
    `1. ${m.namaDosen || "Dosen Pengampu"} selaku dosen mata kuliah ${m.mataKuliah || ""} yang telah memberikan ` +
    `bimbingan, arahan, dan masukan yang sangat berharga;\n` +
    `2. Rekan-rekan ${m.kelompok ? "Kelompok " + m.kelompok : "kelompok"} yang telah bekerja sama dengan baik ` +
    `dalam proses penyusunan makalah ini;\n` +
    `3. Seluruh pihak yang telah membantu baik secara langsung maupun tidak langsung.\n\n` +
    `Penulis berharap makalah ini dapat memberikan manfaat bagi pembaca dan dapat menjadi referensi ` +
    `yang berguna dalam pengembangan ilmu pengetahuan, khususnya di bidang ` +
    `${m.programStudi || "keilmuan"} ini.\n\n` +
    `${kota}, ${date}\n\nPenulis,\n\n${
      m.anggota.filter((a) => a.nama).map((a) => a.nama).join("\n") || "Penulis"
    }`
  );
}

export function generateDaftarIsi(m: MakalahState): string {
  return (
    `KATA PENGANTAR ...................................... i\n` +
    `DAFTAR ISI ........................................... ii\n\n` +
    `BAB I PENDAHULUAN .................................... 1\n` +
    `    1.1 Latar Belakang ................................ 1\n` +
    `    1.2 Rumusan Masalah ................................ 2\n` +
    `    1.3 Tujuan Penulisan ............................... 2\n` +
    `    1.4 Manfaat Penulisan .............................. 3\n\n` +
    `BAB II PEMBAHASAN ..................................... 4\n` +
    `    2.1 Landasan Teori ................................. 4\n` +
    `    2.2 Pembahasan ..................................... 6\n` +
    `    2.3 Implikasi dan Relevansi ......................... 8\n\n` +
    `BAB III PENUTUP ....................................... 9\n` +
    `    3.1 Kesimpulan ..................................... 9\n` +
    `    3.2 Saran ........................................... 9\n\n` +
    `DAFTAR PUSTAKA ........................................ 10`
  );
}

export function generateBab1(m: MakalahState): string {
  const refs = buildRefs(m.judul, m.mataKuliah);
  const ref1 = refs[0];
  const ref2 = refs[1] ?? refs[0];

  const topik = m.topikRingkas || m.judul || "topik yang dibahas dalam makalah ini";

  const latarBelakang =
    m.latar ||
    `${topik.charAt(0).toUpperCase() + topik.slice(1)} merupakan salah satu isu yang ` +
    `mendapat perhatian cukup besar dalam dunia akademik maupun praktis saat ini. ` +
    `Perkembangan yang terjadi dalam bidang ${m.programStudi || "keilmuan"} menuntut ` +
    `para mahasiswa dan praktisi untuk memahami secara mendalam berbagai aspek yang berkaitan ` +
    `dengan ${topik} tersebut. ${citationInline(ref1)} menyatakan bahwa pemahaman yang ` +
    `komprehensif terhadap topik ini memiliki signifikansi yang tinggi, baik dari perspektif ` +
    `teoritis maupun aplikatif.\n\n` +
    `Dalam konteks mata kuliah ${m.mataKuliah || "ini"}, kajian mengenai ${topik} ` +
    `menjadi semakin relevan mengingat dinamika yang terus berkembang. ` +
    `${citationInline(ref2)} mengemukakan bahwa penguasaan konsep dasar yang kuat merupakan ` +
    `landasan penting bagi pengembangan kemampuan analitis mahasiswa dalam menghadapi ` +
    `berbagai permasalahan nyata di lapangan. ` +
    `Berdasarkan hal tersebut, makalah ini hadir sebagai upaya untuk mengkaji, menganalisis, ` +
    `dan menyajikan pemahaman yang lebih terstruktur mengenai ${topik}.`;

  const rumusanMasalah =
    `Berdasarkan latar belakang yang telah diuraikan di atas, penulis merumuskan beberapa ` +
    `permasalahan yang akan dibahas dalam makalah ini, yaitu:\n` +
    `1. Apa yang dimaksud dengan ${m.judul || topik}?\n` +
    `2. Bagaimana implementasi dan relevansinya dalam konteks ${m.programStudi || "keilmuan"} saat ini?\n` +
    `3. Apa saja implikasi dan manfaat dari pemahaman terhadap topik ini bagi mahasiswa?`;

  const tujuan =
    m.tujuan ||
    `Penyusunan makalah ini bertujuan untuk:\n` +
    `1. Mendeskripsikan dan menguraikan konsep dasar dari ${m.judul || topik};\n` +
    `2. Menganalisis implementasi dan relevansinya dalam konteks ${m.programStudi || "keilmuan"};\n` +
    `3. Memberikan gambaran yang komprehensif mengenai implikasi dan manfaat topik ini.`;

  const manfaat =
    `Makalah ini diharapkan memberikan manfaat sebagai berikut:\n\n` +
    `1. Bagi Penulis\n` +
    `   Menambah wawasan dan pemahaman penulis mengenai ${m.judul || topik}, ` +
    `serta meningkatkan kemampuan dalam menyusun karya ilmiah yang baik dan sistematis.\n\n` +
    `2. Bagi Pembaca\n` +
    `   Memberikan referensi dan sumber informasi yang dapat digunakan untuk memperdalam ` +
    `pemahaman mengenai topik yang dibahas.\n\n` +
    `3. Bagi Akademisi\n` +
    `   Menjadi salah satu kontribusi akademik dalam pengembangan kajian ` +
    `${m.programStudi || "keilmuan"} yang terus berkembang.`;

  return [
    "1.1 Latar Belakang\n\n" + latarBelakang,
    "1.2 Rumusan Masalah\n\n" + rumusanMasalah,
    "1.3 Tujuan Penulisan\n\n" + tujuan,
    "1.4 Manfaat Penulisan\n\n" + manfaat,
  ].join("\n\n");
}

export function generateBab2(m: MakalahState): string {
  const refs = buildRefs(m.judul, m.mataKuliah);
  const ref1 = refs[0];
  const ref2 = refs[1] ?? refs[0];
  const ref3 = refs[2] ?? refs[0];

  const topik = m.topikRingkas || m.judul || "topik yang dibahas";

  const landasanTeori =
    `Dalam membahas ${topik}, terdapat beberapa konsep dan teori yang perlu dipahami ` +
    `sebagai landasan analisis. ${citationInline(ref1)} mendefinisikan konsep ini sebagai ` +
    `suatu sistem pemikiran yang mencakup berbagai dimensi yang saling terkait dan ` +
    `mempengaruhi satu sama lain. Pendekatan ini memberikan kerangka yang terstruktur ` +
    `dalam memahami fenomena yang terjadi.\n\n` +
    `Lebih lanjut, ${citationInline(ref2)} mengemukakan bahwa dalam kajian ` +
    `${m.programStudi || "ilmu"} kontemporer, pendekatan terhadap ${topik} telah ` +
    `berkembang secara signifikan seiring dengan dinamika yang terjadi. ` +
    `Paradigma yang awalnya bersifat konvensional kini telah bergeser menuju pendekatan ` +
    `yang lebih adaptif dan responsif terhadap perubahan.\n\n` +
    `${citationInline(ref3)} memperkuat pandangan tersebut dengan menyatakan bahwa ` +
    `penguasaan landasan teoritis yang kuat merupakan prasyarat bagi keberhasilan ` +
    `penerapan konsep-konsep tersebut dalam tataran praktis.`;

  const pembahasan =
    `Berdasarkan landasan teori yang telah diuraikan di atas, berikut ini akan dibahas ` +
    `secara lebih mendalam mengenai berbagai aspek yang berkaitan dengan ${topik}.\n\n` +
    `Pertama, dari sisi konseptual, ${topik} dapat dipahami sebagai suatu proses yang ` +
    `melibatkan berbagai komponen yang saling terkait. Setiap komponen memiliki peran dan ` +
    `kontribusi yang spesifik dalam membentuk keseluruhan sistem yang ada. ` +
    `Pemahaman yang menyeluruh terhadap masing-masing komponen ini menjadi kunci dalam ` +
    `mengoptimalkan penerapannya.\n\n` +
    `Kedua, dalam perspektif praktis, implementasi dari konsep ${topik} dalam kehidupan ` +
    `nyata menunjukkan berbagai variasi yang dipengaruhi oleh konteks, kondisi, dan ` +
    `kebutuhan spesifik dari setiap situasi yang dihadapi. ` +
    `Hal ini menegaskan pentingnya fleksibilitas dalam penerapan teori ke dalam praktik.\n\n` +
    `Ketiga, tantangan yang dihadapi dalam implementasi ${topik} tidak terlepas dari ` +
    `dinamika perubahan yang terus terjadi. Oleh karena itu, diperlukan pendekatan yang ` +
    `adaptif dan berbasis bukti dalam menghadapi berbagai tantangan tersebut.`;

  const implikasi =
    `Berdasarkan pembahasan yang telah dilakukan, terdapat beberapa implikasi penting ` +
    `yang perlu diperhatikan.\n\n` +
    `Secara teoritis, kajian ini memperkaya pemahaman mengenai ${topik} dan memberikan ` +
    `kontribusi pada pengembangan literatur di bidang ${m.programStudi || "keilmuan"} ini. ` +
    `Temuan-temuan yang diperoleh dapat menjadi referensi yang berguna bagi penelitian ` +
    `selanjutnya yang mengkaji tema serupa.\n\n` +
    `Secara praktis, pemahaman yang mendalam tentang ${topik} memberikan bekal yang ` +
    `berharga bagi mahasiswa dalam menghadapi berbagai situasi nyata yang akan ditemui ` +
    `di dunia kerja dan kehidupan profesional. ` +
    `Kemampuan untuk menganalisis dan menerapkan konsep-konsep ini secara tepat akan ` +
    `menjadi salah satu keunggulan kompetitif yang signifikan.`;

  return [
    "2.1 Landasan Teori\n\n" + landasanTeori,
    "2.2 Pembahasan\n\n" + pembahasan,
    "2.3 Implikasi dan Relevansi\n\n" + implikasi,
  ].join("\n\n");
}

export function generateBab3(m: MakalahState): string {
  const topik = m.topikRingkas || m.judul || "topik yang dibahas";

  const kesimpulan =
    `Berdasarkan uraian dan pembahasan yang telah dilakukan dalam makalah ini, ` +
    `dapat ditarik beberapa kesimpulan sebagai berikut:\n\n` +
    `1. ${m.judul || titleCase(topik)} merupakan konsep yang memiliki relevansi tinggi ` +
    `dalam konteks ${m.programStudi || "keilmuan"} saat ini, mengingat dinamika yang ` +
    `terus berkembang dalam berbagai aspek kehidupan akademik dan profesional.\n\n` +
    `2. Landasan teori yang kuat menjadi fondasi penting dalam memahami dan mengimplementasikan ` +
    `konsep ${topik} secara efektif. Berbagai perspektif dari para ahli memberikan ` +
    `gambaran yang komprehensif tentang kompleksitas topik ini.\n\n` +
    `3. Implementasi dari konsep ${topik} dalam praktik memerlukan pendekatan yang adaptif ` +
    `dan kontekstual, mengingat adanya variasi kondisi yang dihadapi dalam situasi yang berbeda.`;

  const saran =
    `Berdasarkan kesimpulan yang telah dikemukakan di atas, penulis mengajukan beberapa ` +
    `saran yang diharapkan dapat bermanfaat:\n\n` +
    `1. Bagi Mahasiswa\n` +
    `   Hendaknya meningkatkan pemahaman dan penguasaan terhadap konsep ${topik} melalui ` +
    `kajian literatur yang lebih mendalam dan komprehensif, serta mengaitkannya dengan ` +
    `fenomena nyata yang terjadi di sekitar.\n\n` +
    `2. Bagi Institusi Pendidikan\n` +
    `   Diharapkan dapat menyediakan lebih banyak fasilitas dan ruang diskusi yang mendukung ` +
    `pengembangan pemahaman mahasiswa terhadap topik-topik seperti ${topik} ini.\n\n` +
    `3. Bagi Peneliti Selanjutnya\n` +
    `   Penelitian ini masih memiliki keterbatasan dalam cakupan dan kedalaman analisis. ` +
    `Diharapkan penelitian selanjutnya dapat mengkaji aspek-aspek yang belum terjangkau ` +
    `dalam makalah ini secara lebih mendalam.`;

  return [
    "3.1 Kesimpulan\n\n" + kesimpulan,
    "3.2 Saran\n\n" + saran,
  ].join("\n\n");
}

export function generateDaftarPustaka(m: MakalahState): string {
  const refs = buildRefs(m.judul, m.mataKuliah);
  return refs
    .sort((a, b) => a.author.localeCompare(b.author))
    .map(
      (r) =>
        `${r.author}. (${r.year}). *${r.source}*. Penerbit Akademik.`
    )
    .join("\n\n");
}

// ─── Combined Output ──────────────────────────────────────────────────────────

export interface MakalahOutput {
  kataPengantar: string;
  daftarIsi: string;
  bab1: string;
  bab2: string;
  bab3: string;
  daftarPustaka: string;
}

export function generateMakalah(m: MakalahState): MakalahOutput {
  return {
    kataPengantar: generateKataPengantar(m),
    daftarIsi: generateDaftarIsi(m),
    bab1: generateBab1(m),
    bab2: generateBab2(m),
    bab3: generateBab3(m),
    daftarPustaka: generateDaftarPustaka(m),
  };
}
