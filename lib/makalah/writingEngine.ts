/**
 * SmartCampus V2 — Academic Writing Engine (Sprint 5+6+8+9)
 *
 * Generates discipline-aware academic content for each section of the makalah.
 * - Topic-specific entity knowledge base (Sprint 5)
 * - Contextual citations matched to discipline (Sprint 6)
 * - Automatic comparison tables (Sprint 8)
 * - Paragraph & transition variety (Sprint 9)
 */

import { TopicAnalysis, AcademicDiscipline } from "./topicEngine";
import { AcademicAuthor, getCitationNarrative, getCitationInline } from "./authorEngine";
import { OutlineSection, TableType } from "./outlineEngine";

// ─── Table Types ──────────────────────────────────────────────────────────────

export interface TableCell { value: string; bold?: boolean; }
export interface AcademicTable {
  caption: string;
  headers: string[];
  rows: TableCell[][];
  source: string;
}

// ─── Entity Knowledge Base ────────────────────────────────────────────────────

interface EntityKnowledge {
  definition: string;
  characteristics: string[];
  advantages: string[];
  disadvantages: string[];
  riskLevel?: string;
  returnLevel?: string;
  liquidityLevel?: string;
  detail: string;
}

const ENTITY_KB: Record<string, EntityKnowledge> = {
  saham: {
    definition: "Saham merupakan surat berharga yang menyatakan kepemilikan seseorang atau badan usaha atas suatu perusahaan. Pemegang saham memiliki hak atas aset dan laba perusahaan secara proporsional sesuai jumlah saham yang dimiliki, serta berhak menerima dividen apabila perusahaan memperoleh keuntungan.",
    characteristics: ["Potensi return berupa dividen dan capital gain", "Likuiditas tinggi di pasar sekunder (BEI)", "Nilai investasi dapat berfluktuasi sesuai kinerja perusahaan", "Terdapat dua jenis utama: saham biasa (common stock) dan saham preferen (preferred stock)"],
    advantages: ["Potensi return tinggi jangka panjang", "Likuiditas tinggi — mudah dijual di bursa", "Hak voting dalam RUPS", "Dapat dimulai dengan modal kecil"],
    disadvantages: ["Risiko kerugian modal (capital loss)", "Harga sangat dipengaruhi sentimen pasar", "Tidak ada jaminan dividen", "Membutuhkan pengetahuan analisis fundamental dan teknikal"],
    riskLevel: "Tinggi",
    returnLevel: "Tinggi",
    liquidityLevel: "Tinggi",
    detail: "Di Indonesia, perdagangan saham dilaksanakan melalui Bursa Efek Indonesia (BEI) yang diawasi oleh Otoritas Jasa Keuangan (OJK). Investor dapat membeli saham melalui perusahaan sekuritas (broker) yang terdaftar dan berizin. Harga saham ditentukan oleh mekanisme pasar, yaitu keseimbangan antara penawaran dan permintaan yang terjadi setiap hari perdagangan.",
  },
  emas: {
    definition: "Emas merupakan logam mulia yang telah digunakan sebagai instrumen penyimpan nilai (store of value) sejak ribuan tahun lalu. Dalam konteks investasi modern, emas dikenal sebagai aset safe haven — yakni aset yang nilainya cenderung stabil bahkan menguat ketika kondisi ekonomi tidak menentu.",
    characteristics: ["Nilai intrinsik yang diakui secara global", "Bersifat tangible (dapat dipegang secara fisik)", "Tidak terpengaruh inflasi jangka panjang", "Tersedia dalam berbagai bentuk: emas fisik, emas digital, reksa dana emas, ETF emas"],
    advantages: ["Perlindungan terhadap inflasi (inflation hedge)", "Likuiditas relatif baik di pasar global", "Tidak memiliki risiko gagal bayar (default risk)", "Dapat dibeli dalam jumlah kecil (gram)"],
    disadvantages: ["Tidak menghasilkan pendapatan pasif (tidak ada dividen/bunga)", "Biaya penyimpanan untuk emas fisik", "Return jangka pendek cenderung lebih rendah dibanding saham", "Harga dipengaruhi sentimen global dan nilai tukar USD"],
    riskLevel: "Rendah–Sedang",
    returnLevel: "Sedang",
    liquidityLevel: "Sedang–Tinggi",
    detail: "Di Indonesia, investasi emas dapat dilakukan melalui Pegadaian, Antam, marketplace digital seperti Tokopedia Emas, maupun melalui aplikasi investasi yang menyediakan fitur tabungan emas. Harga emas mengikuti harga pasar internasional (London Bullion Market Association/LBMA) yang dikonversi ke dalam rupiah.",
  },
  deposito: {
    definition: "Deposito merupakan produk simpanan perbankan yang menawarkan tingkat bunga lebih tinggi dibandingkan tabungan biasa, dengan syarat dana disimpan dalam jangka waktu tertentu (1, 3, 6, atau 12 bulan). Nasabah tidak dapat mencairkan deposito sebelum jatuh tempo tanpa dikenakan penalti.",
    characteristics: ["Return berupa bunga tetap yang disepakati di awal", "Dijamin oleh Lembaga Penjamin Simpanan (LPS) hingga Rp 2 miliar per nasabah per bank", "Tersedia dalam berbagai tenor: 1, 3, 6, 12 bulan", "Tidak terpengaruh fluktuasi pasar modal"],
    advantages: ["Return pasti dan dapat diprediksi", "Dijamin LPS sehingga risiko sangat rendah", "Cocok untuk investor konservatif", "Tidak memerlukan pengetahuan pasar yang mendalam"],
    disadvantages: ["Return relatif rendah dibanding instrumen berbasis pasar", "Dana terkunci hingga jatuh tempo", "Nilai riil dapat tergerus inflasi apabila bunga di bawah inflasi", "Minimum investasi biasanya cukup besar (Rp 1–10 juta)"],
    riskLevel: "Sangat Rendah",
    returnLevel: "Rendah–Sedang",
    liquidityLevel: "Rendah",
    detail: "Suku bunga deposito ditetapkan oleh masing-masing bank dengan mengacu pada BI Rate (suku bunga acuan Bank Indonesia). Saat ini, LPS menetapkan tingkat bunga penjaminan yang menjadi batas atas agar deposito tetap mendapat penjaminan penuh. Deposito sangat cocok bagi investor yang mengutamakan keamanan modal (capital preservation).",
  },
  obligasi: {
    definition: "Obligasi adalah surat utang yang diterbitkan oleh pemerintah (Surat Berharga Negara/SBN) atau perusahaan (obligasi korporasi) sebagai instrumen penghimpunan dana. Pemegang obligasi berhak menerima pembayaran bunga (kupon) secara berkala dan pengembalian pokok pada tanggal jatuh tempo.",
    characteristics: ["Memberikan pendapatan tetap berupa kupon", "Memiliki nilai nominal dan tanggal jatuh tempo yang jelas", "Dapat diperdagangkan di pasar sekunder", "Risiko umumnya lebih rendah dibanding saham"],
    advantages: ["Pendapatan tetap dan dapat diprediksi", "Lebih aman dibanding saham untuk investasi menengah-panjang", "Obligasi pemerintah (ORI, SR, SBR) terjamin penuh", "Dapat menjadi diversifikasi portofolio"],
    disadvantages: ["Risiko gagal bayar pada obligasi korporasi", "Risiko suku bunga (harga obligasi berbanding terbalik dengan suku bunga)", "Likuiditas pasar sekunder obligasi lebih rendah dari saham", "Kupon bisa kalah dari inflasi dalam jangka panjang"],
    riskLevel: "Rendah–Sedang",
    returnLevel: "Rendah–Sedang",
    liquidityLevel: "Sedang",
    detail: "Di Indonesia, masyarakat dapat berinvestasi pada Surat Berharga Negara (SBN) seperti Obligasi Ritel Indonesia (ORI), Sukuk Ritel (SR), dan Savings Bond Ritel (SBR) yang ditawarkan pemerintah secara berkala melalui platform digital yang telah ditunjuk Kementerian Keuangan.",
  },
  "reksa dana": {
    definition: "Reksa dana adalah wadah yang digunakan untuk menghimpun dana dari masyarakat pemodal yang selanjutnya diinvestasikan dalam portofolio efek oleh Manajer Investasi (MI) yang berpengalaman. Reksa dana memungkinkan investor dengan modal kecil untuk mengakses diversifikasi portofolio yang biasanya hanya tersedia bagi investor institusional.",
    characteristics: ["Dikelola oleh Manajer Investasi berlisensi", "Diversifikasi otomatis mengurangi risiko spesifik", "Tersedia dalam berbagai jenis: pasar uang, pendapatan tetap, campuran, saham", "Transaksi melalui Agen Penjual Reksa Dana (APERD)"],
    advantages: ["Modal awal kecil (mulai Rp 10.000)", "Dikelola secara profesional oleh MI", "Diversifikasi portofolio otomatis", "Transparansi melalui Nilai Aktiva Bersih (NAB) harian"],
    disadvantages: ["Biaya pengelolaan (management fee)", "Return tidak dijamin", "Kinerja bergantung pada kemampuan Manajer Investasi", "Potensi return lebih rendah dibanding saham langsung"],
    riskLevel: "Bervariasi (sesuai jenis)",
    returnLevel: "Bervariasi",
    liquidityLevel: "Sedang–Tinggi",
    detail: "Reksa dana di Indonesia diawasi oleh OJK dan wajib memiliki Prospektus yang menjelaskan tujuan investasi, kebijakan investasi, dan risiko. NAB (Nilai Aktiva Bersih) reksa dana dihitung dan dipublikasikan setiap hari kerja.",
  },
  reksadana: {
    definition: "Reksa dana adalah wadah yang digunakan untuk menghimpun dana dari masyarakat pemodal yang selanjutnya diinvestasikan dalam portofolio efek oleh Manajer Investasi (MI) yang berpengalaman.",
    characteristics: ["Dikelola oleh Manajer Investasi berlisensi", "Diversifikasi otomatis", "Modal kecil sudah bisa berinvestasi"],
    advantages: ["Modal minimal sangat kecil", "Dikelola profesional", "Beragam pilihan sesuai profil risiko"],
    disadvantages: ["Terkena biaya pengelolaan", "Return tidak pasti", "Bergantung kinerja MI"],
    riskLevel: "Bervariasi",
    returnLevel: "Bervariasi",
    liquidityLevel: "Sedang–Tinggi",
    detail: "Di Indonesia, reksa dana terdaftar dan diawasi oleh OJK. Investor dapat membeli reksa dana melalui bank, sekuritas, maupun platform digital yang terdaftar sebagai APERD.",
  },
  properti: {
    definition: "Investasi properti mencakup pembelian aset berupa tanah, bangunan, atau kombinasi keduanya dengan tujuan memperoleh keuntungan dari kenaikan harga (capital appreciation) maupun pendapatan sewa (rental income).",
    characteristics: ["Aset berwujud (tangible) dengan nilai intrinsik", "Dapat menghasilkan arus kas dari sewa", "Nilai cenderung meningkat dalam jangka panjang", "Regulasi kepemilikan diatur secara hukum"],
    advantages: ["Lindung nilai terhadap inflasi yang kuat", "Pendapatan pasif dari sewa", "Dapat dijadikan agunan pinjaman", "Nilai jangka panjang relatif stabil dan meningkat"],
    disadvantages: ["Modal awal sangat besar", "Likuiditas sangat rendah (sulit dijual cepat)", "Biaya perawatan dan pajak (PBB, BPHTB)", "Risiko kekosongan penyewa"],
    riskLevel: "Sedang",
    returnLevel: "Sedang–Tinggi",
    liquidityLevel: "Sangat Rendah",
    detail: "Pasar properti di Indonesia dipengaruhi oleh faktor lokasi, infrastruktur, kebijakan pemerintah (seperti KPR subsidi), dan kondisi makroekonomi. Daerah strategis dengan pertumbuhan ekonomi tinggi umumnya menunjukkan apresiasi nilai properti yang lebih signifikan.",
  },
  // ── Marketing Entities ────────────────────────────────────────────────────
  promosi: {
    definition: "Promosi merupakan salah satu elemen bauran pemasaran (marketing mix) yang berfungsi untuk mengkomunikasikan informasi tentang produk atau jasa kepada konsumen dengan tujuan mendorong pembelian. Promosi mencakup periklanan, promosi penjualan, hubungan masyarakat, pemasaran langsung, dan penjualan personal.",
    characteristics: ["Menyampaikan pesan kepada target pasar", "Membentuk persepsi dan sikap konsumen", "Mendorong tindakan pembelian", "Membangun brand awareness"],
    advantages: ["Meningkatkan visibilitas merek", "Mendorong penjualan jangka pendek", "Membangun loyalitas pelanggan", "Menginformasikan fitur produk baru"],
    disadvantages: ["Biaya promosi yang relatif tinggi", "Efektivitas sulit diukur secara langsung", "Pesan dapat tidak tersampaikan dengan baik", "Promosi berlebihan dapat merusak brand image"],
    detail: "Dalam era digital, promosi kini semakin beralih ke saluran digital (digital promotion) melalui media sosial, email marketing, search engine advertising, dan konten pemasaran (content marketing). Pemilihan saluran promosi yang tepat bergantung pada profil target konsumen.",
  },
  // ── MSDM Entities ─────────────────────────────────────────────────────────
  rekrutmen: {
    definition: "Rekrutmen adalah proses pencarian dan penarikan calon karyawan yang memenuhi kualifikasi yang dibutuhkan oleh organisasi. Rekrutmen yang efektif menjadi fondasi penting bagi keberhasilan manajemen sumber daya manusia secara keseluruhan.",
    characteristics: ["Mencakup identifikasi kebutuhan tenaga kerja", "Menggunakan berbagai sumber rekrutmen (internal & eksternal)", "Memerlukan deskripsi jabatan (job description) yang jelas", "Menyaring kandidat berdasarkan kualifikasi"],
    advantages: ["Mendapatkan SDM berkualitas sesuai kebutuhan", "Rekrutmen internal meningkatkan motivasi karyawan", "Rekrutmen eksternal membawa perspektif baru", "Membangun talent pool organisasi"],
    disadvantages: ["Membutuhkan waktu dan biaya yang signifikan", "Kesalahan rekrutmen berdampak jangka panjang", "Rekrutmen eksternal berisiko mismatch budaya", "Proses yang panjang dapat kehilangan kandidat terbaik"],
    detail: "Proses rekrutmen meliputi analisis jabatan, penetapan kualifikasi, pengiklanan lowongan, penerimaan lamaran, penyaringan awal, dan penyerahan kandidat terpilih ke tahap seleksi.",
  },
  kinerja: {
    definition: "Kinerja karyawan merupakan hasil kerja secara kualitas dan kuantitas yang dicapai oleh seorang karyawan dalam melaksanakan tugasnya sesuai dengan tanggung jawab yang diberikan kepadanya. Kinerja mencerminkan kontribusi individu terhadap pencapaian tujuan organisasi.",
    characteristics: ["Dapat diukur secara kuantitatif dan kualitatif", "Dipengaruhi oleh motivasi, kemampuan, dan lingkungan kerja", "Dievaluasi melalui sistem penilaian kinerja (performance appraisal)", "Berkaitan erat dengan sistem kompensasi dan pengembangan karir"],
    advantages: ["Memberikan dasar objektif untuk pengambilan keputusan HR", "Mengidentifikasi karyawan berpotensi dan bermasalah", "Mendorong perbaikan berkelanjutan", "Menyelaraskan tujuan individu dengan organisasi"],
    disadvantages: ["Pengukuran kinerja yang tidak tepat menimbulkan ketidakadilan", "Membutuhkan sistem evaluasi yang terstruktur", "Potensi bias dalam penilaian subjektif", "Dapat menimbulkan persaingan tidak sehat"],
    detail: "Metode penilaian kinerja yang umum digunakan antara lain: Management by Objectives (MBO), 360-degree feedback, Balanced Scorecard (BSC), dan Key Performance Indicators (KPI). Pemilihan metode bergantung pada budaya dan struktur organisasi.",
  },
};

// ─── Transition Variations ────────────────────────────────────────────────────

const OPENING_TRANSITIONS = [
  "Dalam kajian akademik mengenai",
  "Pemahaman mendalam tentang",
  "Salah satu aspek fundamental dalam",
  "Dalam konteks",
  "Sebagai bagian dari",
];

const THEORY_TRANSITIONS = [
  "Menurut para ahli,",
  "Sejumlah teoretisi telah mengkaji hal ini secara mendalam.",
  "Dari perspektif akademik,",
  "Berbagai literatur ilmiah mengungkapkan bahwa",
  "Dalam perspektif ilmiah kontemporer,",
];

const ELABORATION_TRANSITIONS = [
  "Lebih lanjut,",
  "Hal ini diperkuat oleh fakta bahwa",
  "Sejalan dengan pandangan tersebut,",
  "Dalam praktiknya,",
  "Kondisi ini tercermin dari",
];

const CLOSING_TRANSITIONS = [
  "Dengan demikian,",
  "Berdasarkan uraian di atas,",
  "Memahami hal ini menjadi penting karena",
  "Oleh karena itu,",
  "Implikasi dari pemahaman ini adalah",
];

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function strhash(s: string): number {
  let h = 0;
  for (const c of s) h = ((h << 5) - h + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

// ─── Section Content Generators ───────────────────────────────────────────────

function generateDefinitionSection(
  section: OutlineSection,
  analysis: TopicAnalysis,
  author1: AcademicAuthor,
  author2: AcademicAuthor
): string {
  const seed = strhash(section.entity + analysis.bidang);
  const cit1 = getCitationNarrative(author1);
  const cit2 = getCitationInline(author2);

  const opener = pick(OPENING_TRANSITIONS, seed);
  const theoryTrans = pick(THEORY_TRANSITIONS, seed + 1);
  const elabTrans   = pick(ELABORATION_TRANSITIONS, seed + 2);

  return (
    `${opener} ${analysis.label}, pemahaman yang komprehensif terhadap konsep dasar menjadi landasan yang tidak dapat diabaikan. ` +
    `${analysis.label} sebagai suatu bidang keilmuan memiliki cakupan yang luas, mencakup berbagai dimensi teoritis maupun praktis ` +
    `yang saling berkaitan satu sama lain dalam membentuk suatu sistem pengetahuan yang utuh.\n\n` +
    `${theoryTrans} ${cit1} mendefinisikan ${analysis.label.toLowerCase()} sebagai suatu proses yang terstruktur dan sistematis, ` +
    `yang di dalamnya terdapat berbagai elemen yang bekerja secara sinergis untuk mencapai tujuan yang telah ditetapkan. ` +
    `Definisi ini memberikan kerangka konseptual yang jelas dalam memahami kompleksitas bidang ini ` +
    `dari perspektif yang berbeda.\n\n` +
    `${elabTrans} ${cit2} menyatakan bahwa penguasaan konsep dasar ${analysis.label.toLowerCase()} ` +
    `merupakan prasyarat penting bagi penerapan yang efektif dalam konteks nyata. ` +
    `Setiap aspek yang tercakup dalam bidang ini memiliki relevansi yang signifikan, ` +
    `baik dalam tataran akademik maupun dalam kehidupan profesional.`
  );
}

function generateEntitySection(
  section: OutlineSection,
  analysis: TopicAnalysis,
  author1: AcademicAuthor,
  author2: AcademicAuthor
): string {
  const seed    = strhash(section.entity + section.number);
  const cit1    = getCitationNarrative(author1);
  const cit2    = getCitationInline(author2);
  const entity  = section.entity;
  const entityU = entity.charAt(0).toUpperCase() + entity.slice(1);
  const kb      = ENTITY_KB[entity.toLowerCase()];

  if (kb) {
    // Use pre-defined knowledge base content
    const chars  = kb.characteristics.map((c) => `(${c})`).join(", ");
    const advPick = pick(kb.advantages, seed);
    const disPick = pick(kb.disadvantages, seed + 1);

    return (
      `${kb.definition}\n\n` +
      `${cit1} menjelaskan bahwa ${entity.toLowerCase()} memiliki sejumlah karakteristik utama yang membedakannya dari instrumen atau konsep lainnya, antara lain: ` +
      `${kb.characteristics[0]}, ${kb.characteristics[1] ?? "kemudahan akses bagi investor pemula"}, ` +
      `serta ${kb.characteristics[2] ?? "relevansi terhadap kebutuhan finansial jangka panjang"}. ` +
      `Karakteristik-karakteristik ini menjadikan ${entity.toLowerCase()} sebagai pilihan yang relevan ` +
      `dalam berbagai situasi dan profil risiko yang berbeda.\n\n` +
      `${kb.detail}\n\n` +
      `${cit2} menambahkan bahwa dari sisi keunggulan, ${entity.toLowerCase()} menawarkan ${advPick}. ` +
      `Namun demikian, terdapat pula keterbatasan yang perlu dipertimbangkan, yakni ${disPick}. ` +
      `Pemahaman terhadap kedua sisi ini menjadi penting agar pengambilan keputusan dapat dilakukan ` +
      `secara rasional, objektif, dan sesuai dengan kebutuhan serta tujuan yang ingin dicapai.`
    );
  }

  // Generic entity section (no KB entry)
  return (
    `${entityU} merupakan salah satu elemen penting yang tidak dapat dipisahkan dari kajian ${analysis.label.toLowerCase()}. ` +
    `Keberadaannya memiliki pengaruh yang signifikan terhadap dinamika dan perkembangan bidang ini ` +
    `secara keseluruhan.\n\n` +
    `${cit1} mengidentifikasi bahwa dalam kajian ${analysis.label.toLowerCase()}, ` +
    `${entity.toLowerCase()} berperan sebagai komponen krusial yang menghubungkan berbagai aspek ` +
    `teoritis dengan implementasi praktis di lapangan. ` +
    `Tanpa pemahaman yang memadai terhadap ${entity.toLowerCase()}, sulit untuk memperoleh gambaran ` +
    `yang menyeluruh tentang topik yang sedang dikaji.\n\n` +
    `${cit2} lebih lanjut mengungkapkan bahwa ${entity.toLowerCase()} ` +
    `berkembang seiring dengan dinamika perubahan yang terjadi dalam bidang ${analysis.label.toLowerCase()}. ` +
    `Berbagai faktor eksternal maupun internal turut membentuk karakteristik dan peranannya ` +
    `dalam konteks yang lebih luas, sehingga pemahaman yang adaptif dan kontekstual sangat diperlukan ` +
    `dalam mengkaji topik ini secara komprehensif.`
  );
}

function generateComparisonSection(
  section: OutlineSection,
  analysis: TopicAnalysis,
  author1: AcademicAuthor,
  author2: AcademicAuthor
): string {
  const entities = analysis.entities.slice(0, 5);
  const list     = entities.map((e) => e.charAt(0).toUpperCase() + e.slice(1)).join(", ");
  const cit1     = getCitationNarrative(author1);
  const cit2     = getCitationInline(author2);

  return (
    `Dalam rangka memberikan pemahaman yang komprehensif, perbandingan antara ${list} perlu dilakukan ` +
    `secara sistematis. Setiap instrumen atau konsep memiliki karakteristik, keunggulan, dan keterbatasan ` +
    `yang berbeda-beda, sehingga pemilihannya sangat bergantung pada tujuan, kebutuhan, dan kondisi ` +
    `spesifik dari masing-masing konteks.\n\n` +
    `${cit1} menekankan pentingnya analisis komparatif sebagai pendekatan yang valid dalam mengevaluasi ` +
    `berbagai alternatif yang tersedia. Dengan membandingkan ${list} secara objektif, ` +
    `pengambil keputusan dapat memilih opsi yang paling sesuai berdasarkan kriteria yang relevan ` +
    `seperti risiko, return, likuiditas, dan aksesibilitas.\n\n` +
    `${cit2} menambahkan bahwa tidak ada satu instrumen atau pendekatan pun yang secara mutlak unggul ` +
    `di semua dimensi. Setiap pilihan membawa trade-off yang harus dipahami dan diterima ` +
    `sebelum keputusan diambil. Oleh karena itu, pemahaman yang komprehensif terhadap masing-masing ` +
    `komponen menjadi kunci dalam optimalisasi pencapaian tujuan.\n\n` +
    `Tabel berikut menyajikan perbandingan secara lebih terstruktur:`
  );
}

function generateAnalysisSection(
  section: OutlineSection,
  analysis: TopicAnalysis,
  author1: AcademicAuthor,
  author2: AcademicAuthor
): string {
  const seed    = strhash(section.title + analysis.bidang);
  const cit1    = getCitationNarrative(author1);
  const cit2    = getCitationInline(author2);
  const trans1  = pick(THEORY_TRANSITIONS, seed);
  const trans2  = pick(ELABORATION_TRANSITIONS, seed + 1);
  const closing = pick(CLOSING_TRANSITIONS, seed + 2);

  return (
    `${trans1} ${cit1} menguraikan bahwa analisis terhadap ${analysis.label.toLowerCase()} ` +
    `harus mempertimbangkan berbagai faktor yang saling mempengaruhi, baik yang bersifat internal ` +
    `maupun eksternal. Pendekatan analitis yang sistematis memungkinkan identifikasi pola, ` +
    `tren, dan hubungan antar variabel yang mungkin tidak terlihat apabila dikaji secara parsial.\n\n` +
    `${trans2} ${cit2} menegaskan bahwa dalam konteks ${analysis.subbidang}, ` +
    `terdapat dinamika yang kompleks yang mempengaruhi hasil dan efektivitas dari setiap ` +
    `tindakan atau keputusan yang diambil. Pemahaman terhadap dinamika ini sangat krusial ` +
    `bagi pelaku di bidang ini dalam mengantisipasi perubahan dan merancang strategi ` +
    `yang responsif dan berbasis bukti.\n\n` +
    `Berdasarkan kajian literatur yang telah dilakukan, ditemukan beberapa pola yang konsisten ` +
    `dalam bidang ${analysis.label.toLowerCase()}: pertama, terdapat hubungan yang erat antara ` +
    `faktor lingkungan dengan tingkat keberhasilan implementasi; kedua, pendekatan yang adaptif ` +
    `cenderung menghasilkan output yang lebih optimal dibandingkan pendekatan yang kaku; ` +
    `dan ketiga, integrasi berbagai perspektif menghasilkan pemahaman yang lebih mendalam ` +
    `dan penyelesaian masalah yang lebih efektif.\n\n` +
    `${closing} analisis yang komprehensif terhadap aspek-aspek tersebut dapat memberikan ` +
    `landasan yang kuat bagi pengembangan strategi dan kebijakan yang lebih tepat sasaran ` +
    `dalam bidang ${analysis.label.toLowerCase()} ini.`
  );
}

// ─── Table Generators ─────────────────────────────────────────────────────────

export function generateAcademicTable(
  tableType: TableType,
  entities: string[],
  discipline: AcademicDiscipline,
  sectionTitle: string,
  author: AcademicAuthor
): AcademicTable {
  const source = `${author.name} (${author.year}) dan berbagai sumber`;

  if (tableType === "comparison" && entities.length >= 2) {
    // Investasi comparison table
    if (discipline === "investasi") {
      return {
        caption: `Perbandingan Instrumen Investasi: ${entities.map((e) => e.charAt(0).toUpperCase() + e.slice(1)).join(", ")}`,
        headers: ["Instrumen", "Tingkat Risiko", "Potensi Return", "Likuiditas", "Minimum Investasi"],
        rows: entities.map((e) => {
          const kb = ENTITY_KB[e.toLowerCase()];
          return [
            { value: e.charAt(0).toUpperCase() + e.slice(1), bold: true },
            { value: kb?.riskLevel ?? "Sedang" },
            { value: kb?.returnLevel ?? "Sedang" },
            { value: kb?.liquidityLevel ?? "Sedang" },
            { value: e === "properti" ? "Rp 100 juta+" : e === "deposito" ? "Rp 1 juta+" : e === "obligasi" ? "Rp 1 juta" : "Rp 100.000" },
          ];
        }),
        source,
      };
    }

    // Marketing strategy comparison
    if (discipline === "marketing") {
      return {
        caption: "Perbandingan Strategi Pemasaran",
        headers: ["Strategi", "Keunggulan", "Keterbatasan", "Cocok Untuk"],
        rows: [
          [{ value: "Digital Marketing", bold: true }, { value: "Jangkauan luas, terukur" }, { value: "Kompetisi tinggi" }, { value: "Bisnis modern" }],
          [{ value: "Traditional Marketing", bold: true }, { value: "Brand trust tinggi" }, { value: "Biaya mahal, sulit diukur" }, { value: "Produk massal" }],
          [{ value: "Content Marketing", bold: true }, { value: "Organik, berkelanjutan" }, { value: "Butuh waktu lama" }, { value: "Brand building" }],
          [{ value: "Influencer Marketing", bold: true }, { value: "Reach cepat & targeted" }, { value: "Biaya variabel, risiko reputasi" }, { value: "Produk lifestyle" }],
        ],
        source,
      };
    }

    // SWOT Table (manajemen)
    if (discipline === "manajemen") {
      return {
        caption: "Analisis SWOT",
        headers: ["Faktor", "Uraian", "Dampak"],
        rows: [
          [{ value: "Strengths (Kekuatan)", bold: true }, { value: "Keunggulan kompetitif yang dimiliki" }, { value: "Memperkuat posisi di pasar" }],
          [{ value: "Weaknesses (Kelemahan)", bold: true }, { value: "Keterbatasan sumber daya dan kapabilitas" }, { value: "Menghambat pertumbuhan" }],
          [{ value: "Opportunities (Peluang)", bold: true }, { value: "Kondisi eksternal yang menguntungkan" }, { value: "Potensi ekspansi bisnis" }],
          [{ value: "Threats (Ancaman)", bold: true }, { value: "Faktor eksternal yang merugikan" }, { value: "Tekanan terhadap profitabilitas" }],
        ],
        source,
      };
    }

    // Generic comparison
    return {
      caption: `Perbandingan ${sectionTitle}`,
      headers: ["Aspek", ...entities.slice(0, 4).map((e) => e.charAt(0).toUpperCase() + e.slice(1))],
      rows: [
        [{ value: "Karakteristik Utama", bold: true }, ...entities.slice(0, 4).map(() => ({ value: "Lihat penjelasan" }))],
        [{ value: "Keunggulan", bold: true }, ...entities.slice(0, 4).map(() => ({ value: "Bervariasi" }))],
        [{ value: "Keterbatasan", bold: true }, ...entities.slice(0, 4).map(() => ({ value: "Bervariasi" }))],
      ],
      source,
    };
  }

  if (tableType === "advantages") {
    // Kelebihan dan kekurangan
    return {
      caption: `Kelebihan dan Kekurangan ${entities.map((e) => e.charAt(0).toUpperCase() + e.slice(1)).join(", ")}`,
      headers: ["Instrumen / Aspek", "Kelebihan", "Kekurangan"],
      rows: entities.slice(0, 5).map((e) => {
        const kb = ENTITY_KB[e.toLowerCase()];
        return [
          { value: e.charAt(0).toUpperCase() + e.slice(1), bold: true },
          { value: kb?.advantages.slice(0, 2).join("; ") ?? "Efektif dalam kondisi tertentu" },
          { value: kb?.disadvantages.slice(0, 2).join("; ") ?? "Memiliki keterbatasan spesifik" },
        ];
      }),
      source,
    };
  }

  if (tableType === "criteria") {
    const criteriaMap: Record<AcademicDiscipline, { headers: string[]; rows: TableCell[][] }> = {
      msdm: {
        headers: ["Indikator Kinerja", "Metode Pengukuran", "Target"],
        rows: [
          [{ value: "Produktivitas", bold: true }, { value: "Output / Jam Kerja" }, { value: "> 80%" }],
          [{ value: "Absensi", bold: true }, { value: "% Ketidakhadiran" }, { value: "< 5%" }],
          [{ value: "Kualitas Kerja", bold: true }, { value: "Error Rate" }, { value: "< 2%" }],
          [{ value: "Kepuasan Kerja", bold: true }, { value: "Survei Internal" }, { value: "> 4/5" }],
        ],
      },
      perpajakan: {
        headers: ["Jenis Pajak", "Tarif", "Objek Pajak", "Dasar Hukum"],
        rows: [
          [{ value: "PPh Pasal 21", bold: true }, { value: "5%–35%" }, { value: "Penghasilan pegawai" }, { value: "UU No. 36/2008" }],
          [{ value: "PPN", bold: true }, { value: "11%" }, { value: "BKP/JKP" }, { value: "UU No. 42/2009" }],
          [{ value: "PPh Badan", bold: true }, { value: "22%" }, { value: "Laba badan usaha" }, { value: "UU No. 36/2008" }],
          [{ value: "BPHTB", bold: true }, { value: "5%" }, { value: "Perolehan hak atas tanah/bangunan" }, { value: "UU No. 28/2009" }],
        ],
      },
      keuangan: {
        headers: ["Rasio Keuangan", "Formula", "Interpretasi"],
        rows: [
          [{ value: "Current Ratio", bold: true }, { value: "Aset Lancar / Hutang Lancar" }, { value: "> 2x dianggap sehat" }],
          [{ value: "Debt to Equity (DER)", bold: true }, { value: "Total Utang / Ekuitas" }, { value: "< 1x ideal" }],
          [{ value: "Return on Equity (ROE)", bold: true }, { value: "Laba Bersih / Ekuitas" }, { value: "Semakin tinggi semakin baik" }],
          [{ value: "Net Profit Margin", bold: true }, { value: "Laba Bersih / Penjualan" }, { value: "> 10% baik" }],
        ],
      },
      bisnis_digital: {
        headers: ["Metrik Digital", "Definisi", "Standar Industri"],
        rows: [
          [{ value: "CTR (Click-Through Rate)", bold: true }, { value: "Klik / Impresi × 100%" }, { value: "> 2% (Google Ads)" }],
          [{ value: "Conversion Rate", bold: true }, { value: "Konversi / Pengunjung × 100%" }, { value: "2–5% rata-rata" }],
          [{ value: "Cost Per Acquisition (CPA)", bold: true }, { value: "Biaya Total / Jumlah Konversi" }, { value: "Bervariasi per industri" }],
          [{ value: "Return on Ad Spend (ROAS)", bold: true }, { value: "Revenue / Biaya Iklan" }, { value: "> 4x dianggap efisien" }],
        ],
      },
      investasi: {
        headers: ["Kriteria", "Keterangan"],
        rows: [
          [{ value: "Risiko", bold: true }, { value: "Kemungkinan kerugian dari investasi" }],
          [{ value: "Return", bold: true }, { value: "Keuntungan yang diperoleh dari investasi" }],
          [{ value: "Likuiditas", bold: true }, { value: "Kemudahan mencairkan investasi menjadi uang tunai" }],
          [{ value: "Jangka Waktu", bold: true }, { value: "Periode optimal memegang investasi" }],
        ],
      },
      marketing: {
        headers: ["Strategi", "Kelebihan", "Kekurangan"],
        rows: [
          [{ value: "Pull Strategy", bold: true }, { value: "Membangun demand organik" }, { value: "Butuh waktu lama" }],
          [{ value: "Push Strategy", bold: true }, { value: "Cepat meningkatkan penjualan" }, { value: "Biaya promosi tinggi" }],
        ],
      },
      akuntansi: { headers: ["Komponen"], rows: [[{ value: "Lihat teks" }]] },
      perpajakan2: { headers: ["Komponen"], rows: [[{ value: "Lihat teks" }]] },
      msdm2: { headers: ["Komponen"], rows: [[{ value: "Lihat teks" }]] },
      operasional: { headers: ["Komponen"], rows: [[{ value: "Lihat teks" }]] },
      manajemen: { headers: ["Komponen"], rows: [[{ value: "Lihat teks" }]] },
      kewirausahaan: { headers: ["Komponen"], rows: [[{ value: "Lihat teks" }]] },
      ekonomi: { headers: ["Komponen"], rows: [[{ value: "Lihat teks" }]] },
      pendidikan: { headers: ["Komponen"], rows: [[{ value: "Lihat teks" }]] },
      hukum: { headers: ["Komponen"], rows: [[{ value: "Lihat teks" }]] },
      teknik: { headers: ["Komponen"], rows: [[{ value: "Lihat teks" }]] },
      informatika: { headers: ["Komponen"], rows: [[{ value: "Lihat teks" }]] },
      kesehatan: { headers: ["Komponen"], rows: [[{ value: "Lihat teks" }]] },
      psikologi: { headers: ["Komponen"], rows: [[{ value: "Lihat teks" }]] },
      komunikasi: { headers: ["Komponen"], rows: [[{ value: "Lihat teks" }]] },
      general: { headers: ["Aspek", "Keterangan"], rows: [[{ value: "—" }, { value: "Lihat pembahasan" }]] },
    } as Record<string, { headers: string[]; rows: TableCell[][] }>;

    const data = criteriaMap[discipline] ?? criteriaMap.general;
    return {
      caption: `Indikator dan Kriteria ${sectionTitle}`,
      headers: data.headers,
      rows: data.rows,
      source,
    };
  }

  if (tableType === "categories") {
    return {
      caption: `Klasifikasi ${sectionTitle}`,
      headers: ["Kategori", "Deskripsi", "Contoh"],
      rows: [
        [{ value: "Kategori A", bold: true }, { value: "Uraian kategori pertama" }, { value: "Contoh implementasi" }],
        [{ value: "Kategori B", bold: true }, { value: "Uraian kategori kedua" }, { value: "Contoh implementasi" }],
        [{ value: "Kategori C", bold: true }, { value: "Uraian kategori ketiga" }, { value: "Contoh implementasi" }],
      ],
      source,
    };
  }

  if (tableType === "strategies") {
    return {
      caption: `Strategi dalam ${sectionTitle}`,
      headers: ["Strategi", "Kelebihan", "Kekurangan", "Konteks Penerapan"],
      rows: [
        [{ value: "Strategi Diferensiasi", bold: true }, { value: "Keunggulan kompetitif kuat" }, { value: "Biaya R&D tinggi" }, { value: "Pasar premium" }],
        [{ value: "Strategi Cost Leadership", bold: true }, { value: "Kompetitif dalam harga" }, { value: "Margin tipis" }, { value: "Pasar massal" }],
        [{ value: "Strategi Fokus", bold: true }, { value: "Penguasaan ceruk pasar" }, { value: "Pasar terbatas" }, { value: "Niche market" }],
      ],
      source,
    };
  }

  // Default empty table
  return {
    caption: sectionTitle,
    headers: ["Aspek", "Keterangan"],
    rows: [[{ value: "—" }, { value: "Lihat pembahasan di atas" }]],
    source,
  };
}

// ─── Main Section Writer ──────────────────────────────────────────────────────

export interface WrittenSection {
  text: string;
  table?: AcademicTable;
  authorsUsed: string[]; // author IDs used in this section
}

export function writeSection(
  section: OutlineSection,
  analysis: TopicAnalysis,
  availableAuthors: AcademicAuthor[]
): WrittenSection {
  // Pick 2 authors for this section (varied by seed)
  const seed = strhash(section.number + section.entity);
  const a1   = availableAuthors[seed % availableAuthors.length];
  const a2   = availableAuthors[(seed + 1) % availableAuthors.length];

  let text = "";

  switch (section.sectionType) {
    case "definition":
    case "theory":
      text = generateDefinitionSection(section, analysis, a1, a2);
      break;
    case "entity":
      text = generateEntitySection(section, analysis, a1, a2);
      break;
    case "comparison":
      text = generateComparisonSection(section, analysis, a1, a2);
      break;
    case "analysis":
    case "implementation":
    case "casestudy":
    case "conclusion":
    default:
      text = generateAnalysisSection(section, analysis, a1, a2);
      break;
  }

  let table: AcademicTable | undefined;
  if (section.needsTable && section.tableType) {
    table = generateAcademicTable(
      section.tableType,
      analysis.entities,
      analysis.bidang,
      section.title,
      a1
    );
  }

  return {
    text,
    table,
    authorsUsed: [a1.id, a2.id],
  };
}
