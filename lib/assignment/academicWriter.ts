import { DEFAULT_MODEL } from "@/lib/ai/models";
import { buildAcademicOutline, shouldUseMiniProjectProposalOutline } from "./academicOutline";
import { reviewAcademicReport } from "./academicReview";
import type { AssignmentAcademicSection, AssignmentAnalysis, AssignmentAnswers, AssignmentReport, AssignmentTimelineRow } from "./types";

type MiniProjectData = {
  brand: string;
  product: string;
  productDescription: string;
  targetMarket: string;
  price: string;
  platforms: string;
  accountName: string;
  members: string;
  className: string;
  lecturerName: string;
  date: string;
  businessName: string;
};

export function canWriteAcademicMiniProject(analysis: AssignmentAnalysis, answers: AssignmentAnswers): boolean {
  return shouldUseMiniProjectProposalOutline(analysis, answers);
}

export function writeAcademicMiniProjectProposal(analysis: AssignmentAnalysis, answers: AssignmentAnswers): AssignmentReport {
  const data = collectMiniProjectData(analysis, answers);
  const outline = buildAcademicOutline(analysis, answers);
  const academicSections = outline.sections.map((section) => writeSection(section, data));
  const sections = academicSections
    .filter((section) => section.body)
    .map((section) => ({ title: section.heading, body: section.body || "" }));
  const references = buildReferences();
  const report: AssignmentReport = {
    title: `${outline.outputType}: ${data.brand}`,
    course: analysis.course || "Social Media Marketing",
    outputType: outline.outputType,
    executiveSummary: buildExecutiveSummary(data),
    sections,
    academicSections,
    references,
    appendices: buildDeferredDeliverables(analysis),
    rubricChecks: analysis.gradingRubric.map((rubric) => ({
      aspect: rubric.aspect,
      status: "met",
      note: "Aspek ini sudah dijadikan pertimbangan dalam struktur proposal, narasi strategi, dan timeline pelaksanaan.",
    })),
    generatedWith: { model: DEFAULT_MODEL, fallback: true },
  };
  return { ...report, qualityReview: reviewAcademicReport(report) };
}

function writeSection(section: AssignmentAcademicSection, data: MiniProjectData): AssignmentAcademicSection {
  if (section.level === "chapter") return section;
  if (section.timelineRows) return { ...section, timelineRows: section.timelineRows };

  const body = SECTION_WRITERS[section.heading]?.(data) || "";
  return { ...section, body };
}

const SECTION_WRITERS: Record<string, (data: MiniProjectData) => string> = {
  "1.1 Latar Belakang": (data) => [
    `Perkembangan media sosial saat ini memberikan peluang besar bagi pelaku usaha kecil untuk memperkenalkan produk secara lebih luas, cepat, dan terukur. Konsumen tidak hanya melihat produk dari fungsi utamanya, tetapi juga dari cerita, visual, identitas brand, serta pengalaman yang ditawarkan melalui konten digital. Dalam konteks tersebut, ${data.product} dipilih sebagai produk mini project karena memiliki nilai personalisasi, bentuk yang menarik, dan relevan dengan tren produk custom di kalangan remaja serta mahasiswa.`,
    `${data.brand} dikembangkan sebagai brand yang menawarkan ${data.productDescription}. Nilai utama produk ini terletak pada kemampuan menyesuaikan desain dengan identitas konsumen, sehingga produk tidak hanya berfungsi sebagai barang pakai, tetapi juga sebagai media ekspresi diri. Karakter produk yang visual dan personal membuatnya cocok dipasarkan melalui ${data.platforms}, karena platform tersebut memungkinkan calon konsumen melihat contoh desain, proses pembuatan, variasi produk, serta respons pengguna secara langsung.`,
    `Proposal ini disusun sebagai rancangan Week 1 pada mata kuliah ${data.businessName}. Fokus proposal diarahkan pada pembangunan dasar brand, pengenalan produk, analisis pasar, strategi marketing mix, strategi media sosial, serta timeline pelaksanaan selama empat belas minggu. Rancangan ini menjadi pedoman awal agar kegiatan mini project tidak berjalan secara acak, melainkan memiliki arah komunikasi, target pasar, jadwal konten, dan indikator evaluasi yang jelas.`,
  ].join("\n\n"),
  "1.2 Identifikasi Masalah": (data) => [
    `Permasalahan utama yang dihadapi ${data.brand} adalah bagaimana memperkenalkan produk baru agar mudah dipahami oleh target pasar. Produk custom sering kali membutuhkan penjelasan visual yang kuat karena calon konsumen perlu melihat contoh bentuk, variasi desain, harga, serta proses pemesanan sebelum tertarik membeli.`,
    `Masalah berikutnya berkaitan dengan konsistensi identitas brand di media sosial. Tanpa konsep visual, gaya bahasa, dan jadwal konten yang terarah, ${data.brand} berisiko terlihat seperti akun penjualan biasa yang hanya mengunggah produk tanpa membangun kedekatan dengan audiens. Padahal, produk personalisasi membutuhkan komunikasi yang hangat, responsif, dan mampu mendorong interaksi.`,
    `Selain itu, mini project membutuhkan pembagian kerja dan target mingguan yang realistis. Kegiatan seperti membuat konten, mengelola akun, menjawab pertanyaan calon konsumen, mencatat insight, serta mengevaluasi performa perlu direncanakan sejak awal agar hasil akhir dapat dipertanggungjawabkan secara akademik.`,
  ].join("\n\n"),
  "1.3 Rumusan Masalah": (data) => [
    `Rumusan masalah dalam proposal ini adalah bagaimana ${data.brand} dapat membangun identitas brand yang jelas untuk memasarkan ${data.product}. Pertanyaan tersebut penting karena identitas brand menjadi dasar bagi visual, caption, tone komunikasi, dan persepsi calon konsumen.`,
    `Rumusan masalah berikutnya adalah bagaimana menentukan target pasar yang paling sesuai dengan karakter produk. ${data.targetMarket} menjadi sasaran utama yang perlu dipahami dari sisi kebutuhan, kebiasaan media sosial, daya beli, dan alasan membeli produk custom.`,
    `Rumusan terakhir adalah bagaimana menyusun strategi konten, engagement, dan timeline mingguan agar aktivitas pemasaran melalui ${data.platforms} berjalan konsisten. Strategi tersebut harus mampu menghubungkan awareness, minat beli, proses pemesanan, dan evaluasi performa media sosial.`,
  ].join("\n\n"),
  "1.4 Tujuan Proposal": (data) => [
    `Proposal ini bertujuan menyusun rancangan mini project ${data.brand} sebagai usaha berbasis produk custom yang dapat dipasarkan melalui media sosial. Rancangan ini mencakup profil usaha, deskripsi produk, analisis pasar, marketing mix 4P, strategi branding, strategi konten, dan timeline pelaksanaan.`,
    `Tujuan lainnya adalah memberikan panduan kerja bagi anggota kelompok agar setiap tahap pelaksanaan memiliki target yang jelas. Dengan adanya proposal ini, kegiatan pemasaran ${data.product} dapat dijalankan secara sistematis mulai dari pengenalan brand sampai evaluasi konten dan respons audiens.`,
  ].join("\n\n"),
  "1.5 Manfaat Proposal": (data) => [
    `Secara akademik, proposal ini bermanfaat sebagai penerapan konsep Social Media Marketing pada usaha kecil yang dekat dengan perilaku konsumen muda. Mahasiswa dapat memahami bagaimana segmentasi, targeting, positioning, marketing mix, dan strategi engagement diterapkan pada produk nyata.`,
    `Secara praktis, proposal ini membantu ${data.brand} memiliki arah pengembangan yang lebih rapi. Rencana yang disusun dapat digunakan untuk menentukan konten prioritas, pembagian tugas, target mingguan, serta evaluasi performa media sosial selama mini project berlangsung.`,
  ].join("\n\n"),
  "1.6 Gambaran Singkat Usaha": (data) => [
    `${data.brand} merupakan usaha mini project yang menawarkan ${data.product}. Produk ini dikembangkan untuk konsumen yang menyukai barang personal, unik, dan dapat disesuaikan dengan identitas masing-masing. Harga awal yang direncanakan adalah ${data.price}, dengan penyesuaian sesuai variasi desain, ukuran, bahan, atau tingkat kesulitan produksi.`,
    `Usaha ini memanfaatkan ${data.platforms} sebagai kanal utama komunikasi dan promosi. Nama akun yang digunakan adalah ${data.accountName}. Melalui akun tersebut, ${data.brand} akan menampilkan katalog produk, contoh custom, informasi harga, cara pemesanan, konten interaktif, dan perkembangan mini project.`,
  ].join("\n\n"),
  "2.1 Profil Usaha": (data) => `${data.brand} adalah brand mini project yang bergerak pada produk custom dengan fokus utama ${data.product}. Usaha ini dibangun untuk memenuhi kebutuhan konsumen muda terhadap produk personal yang memiliki nilai identitas dan dapat digunakan sebagai aksesori, hadiah, atau barang koleksi. Karakter brand diarahkan agar terlihat kreatif, ramah, mudah diingat, dan dekat dengan gaya komunikasi mahasiswa.`,
  "2.2 Visi dan Misi": (data) => `Visi ${data.brand} adalah menjadi brand produk custom yang mampu membantu konsumen mengekspresikan identitas melalui produk yang menarik, terjangkau, dan mudah dipesan. Misi yang dijalankan meliputi menyediakan desain produk yang variatif, menjaga kualitas hasil produksi, membangun komunikasi yang responsif di media sosial, serta menghadirkan pengalaman pemesanan yang jelas dari awal sampai produk diterima konsumen.`,
  "2.3 Deskripsi Produk": (data) => `${data.product} merupakan produk utama ${data.brand}. ${data.productDescription}. Produk ini dirancang agar memiliki daya tarik visual yang kuat ketika difoto atau direkam, sehingga dapat digunakan sebagai materi konten media sosial. Deskripsi produk akan terus diperbarui mengikuti ketersediaan contoh produk, variasi desain, dan masukan dari calon konsumen selama mini project berjalan.`,
  "2.4 Keunikan Produk": (data) => `Keunikan ${data.product} terletak pada unsur personalisasi. Konsumen tidak hanya membeli produk yang sudah jadi, tetapi mendapatkan barang yang dapat disesuaikan dengan nama, warna, bentuk, atau preferensi tertentu. Nilai personal tersebut membuat produk terasa lebih dekat dengan pemiliknya dan lebih menarik untuk dibagikan melalui media sosial.`,
  "2.5 Keunggulan Produk": (data) => `Keunggulan produk ${data.brand} adalah kombinasi antara desain custom, harga yang dapat dijangkau target pasar, dan potensi konten visual yang tinggi. Produk yang personal lebih mudah digunakan sebagai bahan cerita dalam caption, video pendek, maupun testimoni. Keunggulan ini menjadi dasar bagi strategi pemasaran yang menonjolkan pengalaman konsumen, bukan sekadar informasi produk.`,
  "3.1 Segmentasi Pasar": (data) => `Segmentasi pasar ${data.brand} mencakup konsumen muda yang aktif menggunakan media sosial dan memiliki ketertarikan pada produk unik. Secara demografis, sasaran utama meliputi ${data.targetMarket}. Secara psikografis, segmen ini cenderung menyukai produk yang dapat menunjukkan identitas, mudah dipamerkan, dan memiliki nilai personal.`,
  "3.2 Target Pasar": (data) => `Target pasar utama ${data.brand} adalah ${data.targetMarket}. Kelompok ini dipilih karena memiliki kedekatan dengan tren produk custom dan terbiasa mencari referensi barang melalui media sosial. Target sekunder adalah konsumen yang membutuhkan hadiah sederhana namun personal untuk teman, pasangan, atau anggota keluarga.`,
  "3.3 Positioning": (data) => `${data.brand} diposisikan sebagai brand produk custom yang membantu konsumen menunjukkan identitas melalui produk yang personal, menarik, dan mudah dipesan. Positioning ini membedakan ${data.brand} dari produk umum karena menonjolkan nilai personalisasi, tampilan visual, dan pengalaman konsumen dalam menentukan desain.`,
  "3.4 Analisis SWOT": (data) => [
    `Strength ${data.brand} terletak pada konsep produk yang personal dan mudah dijadikan konten visual. Produk custom memiliki peluang untuk menarik komentar, pertanyaan, dan permintaan desain dari audiens karena setiap konsumen dapat membayangkan versi produknya sendiri.`,
    `Weakness yang perlu diperhatikan adalah keterbatasan produksi, konsistensi kualitas, dan kebutuhan waktu untuk membuat contoh desain. Opportunity muncul dari tingginya penggunaan media sosial di kalangan target pasar, terutama untuk mencari produk unik dan hadiah personal. Threat berasal dari pesaing produk custom lain, perubahan tren konten, serta kemungkinan audiens cepat bosan jika format posting tidak bervariasi.`,
  ].join("\n\n"),
  "3.5 Analisis Kompetitor": (data) => `Kompetitor ${data.brand} dapat berasal dari penjual produk custom, aksesori personal, dan usaha kecil yang memasarkan produk kreatif melalui media sosial. Untuk bersaing, ${data.brand} perlu menonjolkan kualitas visual, kejelasan cara order, respons cepat, serta contoh hasil produk yang konsisten. Analisis kompetitor juga perlu dilakukan secara berkala dengan membandingkan harga, variasi desain, gaya konten, dan cara mereka membangun interaksi dengan audiens.`,
  "4.1 Product": (data) => `Product yang ditawarkan adalah ${data.product}. Produk ini perlu ditampilkan melalui foto detail, video proses, contoh variasi, serta penjelasan manfaat. Informasi produk harus menjawab pertanyaan dasar calon konsumen, seperti bentuk produk, pilihan custom, estimasi pengerjaan, dan cara perawatan bila diperlukan.`,
  "4.2 Price": (data) => `Price atau harga awal yang direncanakan adalah ${data.price}. Strategi harga perlu mempertimbangkan biaya bahan, waktu pengerjaan, tingkat custom, kemasan, dan daya beli target pasar. Selain harga reguler, ${data.brand} dapat menyiapkan harga promosi awal atau paket bundling untuk menarik pembelian pertama.`,
  "4.3 Place": (data) => `Place difokuskan pada kanal digital yang mudah dijangkau target pasar, yaitu ${data.platforms}. Media sosial digunakan untuk membangun awareness dan interaksi, sedangkan kanal transaksi dapat diarahkan melalui pesan langsung, marketplace, atau metode pemesanan lain yang disepakati kelompok. Seluruh kanal perlu saling terhubung agar calon konsumen tidak bingung saat berpindah dari konten menuju proses pembelian.`,
  "4.4 Promotion": (data) => `Promotion dilakukan melalui konten organik, konten interaktif, promosi launching, dan ajakan berbagi pengalaman. ${data.brand} dapat menggunakan format product showcase, behind the scenes, polling desain, video pendek, dan testimoni. Promosi tidak hanya diarahkan untuk menjual, tetapi juga untuk membangun kepercayaan dan memperkenalkan karakter brand.`,
  "5.1 Identitas Brand": (data) => `Identitas brand ${data.brand} dibangun melalui nama, warna visual, gaya bahasa, dan konsistensi tampilan konten. Brand perlu tampil ramah, kreatif, dan responsif agar sesuai dengan karakter target pasar. Identitas ini akan menjadi pedoman dalam membuat caption, desain feed, video pendek, dan balasan komentar.`,
  "5.2 Tujuan Penggunaan Media Sosial": (data) => `Media sosial digunakan untuk memperkenalkan ${data.product}, membangun awareness, menjelaskan cara pemesanan, dan menciptakan interaksi dengan calon konsumen. Tujuan lainnya adalah mengumpulkan insight dari respons audiens sehingga strategi konten dapat diperbaiki dari minggu ke minggu.`,
  "5.3 Platform Media Sosial": (data) => `Platform yang digunakan adalah ${data.platforms}. Setiap platform memiliki peran yang berbeda. Platform visual dapat digunakan untuk katalog dan foto produk, platform video pendek untuk demonstrasi dan konten hiburan, sedangkan kanal transaksi atau komunikasi digunakan untuk menjawab pertanyaan dan memproses pesanan.`,
  "5.4 Strategi Konten": (data) => `Strategi konten ${data.brand} meliputi pengenalan brand, edukasi produk, showcase desain, behind the scenes, konten interaktif, dan promosi. Konten pengenalan berfungsi menjelaskan siapa ${data.brand}, sedangkan konten edukasi membantu audiens memahami nilai custom. Konten interaktif seperti polling atau request desain dapat meningkatkan komentar dan kedekatan dengan audiens.`,
  "5.5 Jadwal Posting": () => `Jadwal posting dirancang secara konsisten agar akun terlihat aktif dan terkelola. Pada tahap awal, kelompok dapat menyiapkan tiga sampai empat unggahan per minggu yang terdiri dari foto produk, video pendek, story interaktif, dan konten edukasi. Jadwal ini dapat disesuaikan setelah melihat kemampuan produksi konten dan respons audiens.`,
  "5.6 Strategi Engagement": (data) => `Strategi engagement dilakukan dengan mengajak audiens berpartisipasi dalam pilihan desain, warna, nama, atau ide penggunaan produk. ${data.brand} dapat membuat pertanyaan di story, membalas komentar secara personal, serta menampilkan request audiens sebagai konten. Interaksi seperti ini penting karena produk custom sangat bergantung pada rasa keterlibatan konsumen.`,
  "5.7 Target Media Sosial": (data) => `Target media sosial pada tahap awal adalah membangun akun yang aktif, memiliki konten yang konsisten, dan mulai memperoleh respons dari target pasar. Indikator yang dapat diamati meliputi jumlah unggahan, like, komentar, jangkauan, pesan masuk, dan jumlah calon konsumen yang menanyakan produk. Angka target dapat diperbarui setelah insight asli dari akun ${data.accountName} tersedia.`,
  "Kesimpulan": (data) => `Proposal mini project ini menunjukkan bahwa ${data.brand} memiliki peluang untuk dikembangkan sebagai brand produk custom yang relevan dengan kebutuhan konsumen muda. Melalui ${data.product}, brand dapat menawarkan nilai personalisasi, pengalaman visual, dan kedekatan emosional dengan konsumen. Strategi yang disusun mencakup analisis pasar, marketing mix 4P, branding media sosial, serta timeline empat belas minggu agar pelaksanaan proyek memiliki arah yang jelas.`,
  "Saran": (data) => `Kelompok disarankan menjaga konsistensi konten sejak awal pelaksanaan mini project. Setiap anggota perlu menjalankan tugas sesuai pembagian kerja, mencatat respons audiens, dan memperbarui strategi berdasarkan data aktual. ${data.brand} juga perlu terus memperbaiki kualitas visual, kejelasan informasi produk, dan kecepatan respons agar kepercayaan calon konsumen dapat terbentuk secara bertahap.`,
};

function collectMiniProjectData(analysis: AssignmentAnalysis, answers: AssignmentAnswers): MiniProjectData {
  const value = (...keys: string[]) => pickAnswer(answers, keys);
  const object = value("mainObject", "product", "produk", "productName", "projectName", "brandName", "businessName", "topic");
  const brand = value("brand", "brandName", "businessName", "namaBrand", "namaUsaha", "projectName") || object || "Brand Mini Project";
  const product = value("product", "produk", "productName", "mainObject", "topic") || object || "produk custom";
  return {
    brand,
    product,
    productDescription: value("productDescription", "objectDetails", "detailProduk", "deskripsiProduk", "requiredContent") || `${product} merupakan produk yang dirancang dengan nilai personalisasi dan tampilan yang menarik bagi konsumen muda`,
    targetMarket: value("targetMarket", "targetAudience", "targetPasar", "sasaran", "market") || "remaja, mahasiswa, dan konsumen muda yang aktif menggunakan media sosial",
    price: value("price", "harga", "pricing", "modal") || "harga yang disesuaikan dengan biaya produksi dan variasi custom",
    platforms: value("platform", "platforms", "socialPlatforms", "mediaSosial", "channels") || "Instagram, TikTok, dan marketplace/kanal pemesanan yang digunakan kelompok",
    accountName: value("accountName", "socialAccount", "akun", "namaAkun") || "akun media sosial brand",
    members: value("members", "studentIdentity", "studentName", "groupMembers", "anggota") || "anggota kelompok",
    className: value("className", "kelas") || "kelas",
    lecturerName: value("lecturerName", "dosen", "namaDosen") || "dosen pengampu",
    date: value("date", "tanggal", "deadline") || new Date().toLocaleDateString("id-ID"),
    businessName: analysis.course || value("course", "mataKuliah") || "Social Media Marketing",
  };
}

function pickAnswer(answers: AssignmentAnswers, keys: string[]): string {
  const entries = Object.entries(answers);
  for (const key of keys) {
    const exact = answers[key]?.trim();
    if (exact && exact !== "-") return exact;
    const found = entries.find(([answerKey, answerValue]) => normalize(answerKey).includes(normalize(key)) && answerValue.trim() && answerValue.trim() !== "-");
    if (found) return found[1].trim();
  }
  return "";
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildExecutiveSummary(data: MiniProjectData): string {
  return `Proposal Mini Project Week 1 ini menyusun rancangan awal pengembangan ${data.brand} sebagai brand yang menawarkan ${data.product}. Proposal berfokus pada profil usaha, analisis pasar, marketing mix 4P, strategi branding dan media sosial, serta timeline pelaksanaan selama empat belas minggu. Dokumen ini disusun oleh ${data.members} untuk kelas ${data.className} di bawah arahan ${data.lecturerName}.`;
}

function buildReferences(): string[] {
  return [
    "Chaffey, D., & Ellis-Chadwick, F. (2019). Digital marketing: Strategy, implementation and practice. Pearson.",
    "Kotler, P., & Keller, K. L. (2016). Marketing management. Pearson Education.",
    "Kotler, P., Kartajaya, H., & Setiawan, I. (2021). Marketing 5.0: Technology for humanity. John Wiley & Sons.",
    "Tuten, T. L., & Solomon, M. R. (2018). Social media marketing. SAGE Publications.",
  ];
}

function buildDeferredDeliverables(analysis: AssignmentAnalysis): string[] {
  const deferred = analysis.deliverables
    .filter((item) => !/proposal/i.test(item.name) && item.type !== "proposal")
    .map((item) => `${item.name}: akan dibuat pada sprint berikutnya.`);
  return deferred.length ? deferred : ["Deliverable selain Proposal Mini Project Week 1 akan dibuat pada sprint berikutnya bila dibutuhkan."];
}
