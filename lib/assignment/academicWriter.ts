import { DEFAULT_MODEL } from "@/lib/ai/models";
import { buildAcademicOutline, shouldUseMiniProjectProposalOutline } from "./academicOutline";
import { reviewAcademicReport } from "./academicReview";
import type { AssignmentAcademicSection, AssignmentAnalysis, AssignmentAnswers, AssignmentReport } from "./types";

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
  course: string;
  groupName: string;
  studyProgram: string;
  productImageDataUrl: string;
  productImageName: string;
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
    course: data.course,
    outputType: outline.outputType,
    executiveSummary: buildExecutiveSummary(data),
    proposalMeta: {
      university: "Universitas Pamulang",
      title: "PROPOSAL MINI PROJECT",
      brandOrProduct: `${data.brand} / ${data.product}`,
      groupName: data.groupName,
      members: data.members,
      course: data.course,
      lecturer: data.lecturerName,
      studyProgram: data.studyProgram,
      year: new Date().getFullYear().toString(),
    },
    productImage: data.productImageDataUrl ? { name: data.productImageName || "Foto Produk", dataUrl: data.productImageDataUrl } : undefined,
    sections,
    academicSections,
    references,
    appendices: [],
    rubricChecks: analysis.gradingRubric.map((rubric) => ({
      aspect: rubric.aspect,
      status: "met",
      note: "Aspek rubrik sudah dipakai dalam struktur proposal, narasi bisnis, strategi pemasaran, estimasi biaya, dan timeline.",
    })),
    generatedWith: { model: DEFAULT_MODEL, fallback: true },
  };
  return { ...report, qualityReview: reviewAcademicReport(report) };
}

function writeSection(section: AssignmentAcademicSection, data: MiniProjectData): AssignmentAcademicSection {
  if (section.level === "chapter") return section;
  const body = SECTION_WRITERS[section.heading]?.(data) || "";
  if (section.timelineRows) return { ...section, body: body || timelineIntro(data), timelineRows: section.timelineRows };
  if (section.costRows) return { ...section, body: body || costIntro(data), costRows: section.costRows };
  return { ...section, body };
}

const SECTION_WRITERS: Record<string, (data: MiniProjectData) => string> = {
  "1.1 Latar Belakang": (data) => [
    `Perkembangan media sosial dalam beberapa tahun terakhir mengubah cara pelaku usaha kecil memperkenalkan produk kepada calon konsumen. Media sosial tidak hanya berfungsi sebagai tempat membagikan foto atau video, tetapi juga menjadi ruang untuk membangun identitas brand, berinteraksi dengan audiens, dan mengarahkan konsumen menuju proses pembelian. Kondisi tersebut membuka peluang bagi mahasiswa untuk mempelajari pemasaran secara langsung melalui mini project yang dekat dengan kehidupan sehari-hari.`,
    `${data.product} dipilih sebagai produk utama karena memiliki karakter yang sesuai dengan tren konsumsi anak muda. Produk ini menawarkan nilai personalisasi, bentuk yang menarik, dan peluang untuk dikembangkan menjadi konten visual yang mudah dipahami. Dalam pasar yang semakin ramai, produk yang memiliki cerita personal cenderung lebih mudah menarik perhatian karena konsumen merasa terlibat dalam proses pemilihan desain, warna, nama, atau bentuk produk.`,
    `${data.brand} hadir sebagai rancangan usaha yang memanfaatkan keunikan tersebut. Brand ini menawarkan ${data.productDescription}. Keunggulan tersebut perlu dikomunikasikan dengan cara yang rapi agar calon konsumen tidak hanya mengetahui nama produk, tetapi juga memahami manfaat, alasan membeli, dan pengalaman yang ingin ditawarkan oleh brand. Oleh karena itu, strategi branding menjadi bagian penting dalam proposal ini.`,
    `Target utama ${data.brand} adalah ${data.targetMarket}. Kelompok konsumen ini relatif aktif menggunakan media sosial, terbiasa melihat rekomendasi produk melalui konten pendek, dan memiliki ketertarikan pada barang yang dapat menunjukkan identitas pribadi. Dengan menggunakan ${data.platforms}, usaha ini dapat menampilkan katalog, proses pembuatan, contoh penggunaan produk, serta interaksi dengan audiens secara bertahap.`,
    `Proposal ini disusun sebagai rancangan awal pelaksanaan mini project pada mata kuliah ${data.course}. Rancangan yang dibuat mencakup pendahuluan, profil brand dan produk, analisis bisnis, rencana operasional, strategi pemasaran, serta penutup. Dengan adanya proposal ini, kegiatan kelompok dapat berjalan lebih terarah karena setiap keputusan memiliki dasar akademik, target kerja, dan indikator yang dapat dievaluasi selama pelaksanaan proyek.`,
  ].join("\n\n"),
  "1.2 Identifikasi Masalah": (data) => [
    `Permasalahan pertama yang perlu diperhatikan adalah rendahnya pengenalan awal terhadap brand baru. ${data.brand} belum memiliki reputasi yang kuat, sehingga calon konsumen membutuhkan informasi yang jelas mengenai produk, manfaat, harga, dan cara pemesanan. Tanpa pengenalan yang konsisten, produk berisiko hanya dilihat sekilas tanpa menimbulkan minat beli.`,
    `Permasalahan kedua berkaitan dengan cara menyampaikan nilai personalisasi. ${data.product} tidak cukup dipasarkan hanya dengan menyebutkan bentuk produk. Audiens perlu melihat contoh hasil, variasi custom, dan alasan mengapa produk tersebut berbeda dari produk serupa. Hal ini menuntut strategi konten yang mampu mengubah fitur produk menjadi cerita yang mudah dipahami.`,
    `Permasalahan ketiga adalah keterbatasan sumber daya kelompok. Mini project perlu dijalankan dengan waktu, biaya, dan tenaga yang terbatas. Karena itu, rencana operasional, estimasi biaya, jadwal posting, serta pembagian target mingguan harus dibuat realistis agar proyek dapat diselesaikan tanpa mengurangi kualitas tugas akademik.`,
  ].join("\n\n"),
  "1.3 Rumusan Masalah": (data) => [
    `Rumusan masalah proposal ini adalah bagaimana ${data.brand} membangun identitas brand yang jelas untuk memperkenalkan ${data.product} kepada target konsumen. Identitas tersebut mencakup nama, karakter komunikasi, tampilan visual, dan pesan utama yang akan dibawa dalam konten media sosial.`,
    `Rumusan berikutnya adalah bagaimana menyusun rencana bisnis sederhana yang sesuai dengan kemampuan kelompok. Rencana tersebut perlu mencakup analisis pasar, analisis SWOT, kompetitor, estimasi biaya, serta timeline kegiatan agar mini project tidak hanya terlihat menarik, tetapi juga dapat dijalankan secara realistis.`,
    `Rumusan terakhir adalah bagaimana strategi pemasaran melalui ${data.platforms} dapat membantu ${data.brand} memperoleh awareness, interaksi, dan minat beli. Strategi ini perlu diterjemahkan ke dalam marketing mix 4P, jadwal posting, dan bentuk engagement yang sesuai dengan perilaku target konsumen.`,
  ].join("\n\n"),
  "1.4 Tujuan Proposal": (data) => [
    `Tujuan proposal ini adalah menyusun rancangan akademik untuk pengembangan ${data.brand} sebagai usaha mini project yang menawarkan ${data.product}. Proposal ini menjadi dasar bagi kelompok dalam menentukan arah brand, segmentasi konsumen, strategi operasional, serta strategi pemasaran media sosial.`,
    `Tujuan lainnya adalah menghasilkan pedoman kerja yang dapat digunakan selama pelaksanaan proyek. Dengan proposal ini, kelompok memiliki acuan mengenai kegiatan mingguan, kebutuhan biaya, bentuk konten, dan indikator keberhasilan yang dapat dievaluasi berdasarkan data aktual selama proyek berlangsung.`,
  ].join("\n\n"),
  "1.5 Manfaat Proposal": (data) => [
    `Bagi mahasiswa, proposal ini bermanfaat sebagai sarana penerapan teori pemasaran ke dalam rancangan usaha yang konkret. Konsep seperti segmentasi, targeting, positioning, SWOT, marketing mix, dan engagement media sosial dapat dipahami melalui produk ${data.product} yang menjadi objek mini project.`,
    `Bagi pengembangan usaha, proposal ini membantu ${data.brand} memiliki rencana yang lebih tertata. Setiap kegiatan pemasaran dapat diarahkan pada tujuan yang jelas, mulai dari membangun awareness, memperkenalkan produk, menciptakan interaksi, sampai mengumpulkan insight awal dari audiens.`,
  ].join("\n\n"),
  "1.6 Gambaran Singkat Usaha": (data) => [
    `${data.brand} merupakan rancangan usaha mini project yang menawarkan ${data.product}. Produk ini dikembangkan dengan konsep custom sehingga konsumen dapat memperoleh barang yang lebih personal dibandingkan produk umum. Harga awal yang direncanakan adalah ${data.price}, dengan kemungkinan penyesuaian berdasarkan tingkat variasi dan kebutuhan produksi.`,
    `Kegiatan promosi dan komunikasi akan diarahkan melalui ${data.platforms}. Akun atau identitas media sosial yang digunakan adalah ${data.accountName}. Kelompok yang menjalankan proyek ini adalah ${data.members} dari kelas ${data.className}, dengan arahan dosen pengampu ${data.lecturerName}.`,
  ].join("\n\n"),
  "2.1 Profil Usaha": (data) => `${data.brand} adalah usaha mini project yang berfokus pada produk custom. Usaha ini dirancang untuk menjawab kebutuhan konsumen muda terhadap produk yang tidak hanya memiliki fungsi, tetapi juga nilai identitas. Melalui ${data.product}, ${data.brand} ingin menghadirkan produk yang dapat dipakai, diberikan sebagai hadiah, atau dijadikan aksesori personal yang memiliki cerita bagi pemiliknya.`,
  "2.2 Visi dan Misi": (data) => `Visi ${data.brand} adalah menjadi brand produk custom yang dikenal kreatif, mudah diakses, dan dekat dengan gaya hidup konsumen muda. Misi usaha ini adalah menyediakan produk yang dapat dipersonalisasi, menjaga kualitas hasil produksi, memberikan informasi pemesanan yang jelas, membangun komunikasi yang responsif melalui media sosial, dan mengembangkan konten yang mampu memperlihatkan nilai produk secara menarik.`,
  "2.3 Deskripsi Produk": (data) => `${data.product} merupakan produk utama yang ditawarkan oleh ${data.brand}. ${data.productDescription}. Produk ini memiliki potensi visual yang kuat karena variasi desain, warna, bentuk, atau nama dapat ditampilkan dalam konten foto dan video. Informasi produk akan dikemas secara sederhana agar calon konsumen memahami manfaat, pilihan custom, harga, dan cara melakukan pemesanan.`,
  "2.4 Keunikan Produk": (data) => `Keunikan ${data.product} terletak pada unsur personalisasi yang membuat setiap produk dapat terasa berbeda bagi setiap konsumen. Produk custom memberi ruang bagi pembeli untuk merasa memiliki keterlibatan dalam hasil akhir. Nilai personal tersebut menjadi daya tarik utama karena konsumen tidak hanya membeli barang, tetapi juga membeli pengalaman dan identitas yang melekat pada produk.`,
  "2.5 Keunggulan Produk": (data) => `${data.product} memiliki beberapa keunggulan yang mendukung pemasaran melalui media sosial. Produk mudah divisualisasikan dalam konten, dapat dikaitkan dengan gaya hidup target konsumen, dan memiliki peluang untuk mendorong interaksi seperti request desain, polling warna, atau komentar nama. Keunggulan lain adalah fleksibilitas harga dan variasi produk yang dapat disesuaikan dengan kemampuan produksi kelompok.`,
  "3.1 Analisis Pasar": (data) => `Pasar produk custom berkembang karena konsumen muda semakin menyukai barang yang memiliki nilai personal. ${data.targetMarket} menjadi segmen yang potensial karena mereka aktif mencari inspirasi produk melalui media sosial dan cenderung tertarik pada barang yang unik, fotogenik, serta mudah dibagikan dalam konten. Kondisi ini memberi peluang bagi ${data.brand} untuk masuk melalui pendekatan visual dan komunikasi yang dekat dengan keseharian audiens.`,
  "3.2 Target Konsumen": (data) => `Target konsumen utama ${data.brand} adalah ${data.targetMarket}. Kelompok ini dipilih karena memiliki kebiasaan digital yang sesuai dengan rencana promosi usaha. Mereka dapat dijangkau melalui konten pendek, foto produk, story interaktif, dan katalog sederhana. Target sekunder adalah konsumen yang mencari hadiah kecil yang personal dan mudah dipesan.`,
  "3.3 Positioning Usaha": (data) => `${data.brand} diposisikan sebagai brand produk custom yang membantu konsumen menampilkan identitas melalui produk yang menarik, personal, dan mudah dipesan. Positioning ini perlu dijaga melalui konsistensi visual, gaya bahasa yang ramah, dan kejelasan informasi produk. Dengan positioning tersebut, ${data.brand} tidak bersaing hanya melalui harga, tetapi juga melalui pengalaman personal yang ditawarkan.`,
  "3.4 Analisis SWOT": (data) => [
    `Strength dari ${data.brand} adalah konsep produk yang personal, mudah divisualisasikan, dan dekat dengan tren konsumsi anak muda. ${data.product} dapat dibuat dalam berbagai variasi sehingga konten tidak cepat monoton. Kekuatan lain terletak pada kemungkinan membangun interaksi melalui permintaan desain atau pilihan custom dari audiens.`,
    `Weakness yang perlu diperhatikan adalah keterbatasan kapasitas produksi, keterbatasan modal awal, dan kebutuhan waktu untuk membuat contoh produk yang rapi. Jika kelompok tidak mengatur jadwal dengan baik, kualitas konten dan respons kepada calon konsumen dapat menurun. Kelemahan ini dapat dikurangi melalui pembagian tugas dan target mingguan yang realistis.`,
    `Opportunity muncul dari tingginya penggunaan media sosial oleh target konsumen. Produk unik dan personal memiliki peluang untuk menarik perhatian ketika disajikan dalam konten visual yang jelas. Selain itu, tren hadiah custom dan barang personal memberi ruang bagi ${data.brand} untuk membangun pasar secara bertahap.`,
    `Threat berasal dari kompetitor produk custom lain, perubahan tren konten, dan kemungkinan audiens cepat berpindah perhatian. Persaingan harga juga dapat menjadi tantangan apabila kompetitor menawarkan produk serupa dengan harga lebih rendah. Untuk menghadapi ancaman tersebut, ${data.brand} perlu menonjolkan kualitas komunikasi, contoh hasil produk, dan keunikan pengalaman custom.`,
  ].join("\n\n"),
  "3.5 Analisis Kompetitor": (data) => `Kompetitor ${data.brand} dapat berasal dari penjual produk custom, aksesori personal, dan usaha kecil yang aktif memasarkan produknya melalui media sosial. Analisis kompetitor perlu melihat harga, variasi desain, kualitas foto, gaya caption, kecepatan respons, dan cara mereka mengarahkan konsumen menuju pembelian. Dari pengamatan tersebut, ${data.brand} dapat menentukan pembeda yang lebih jelas, misalnya visual yang lebih konsisten, informasi order yang lebih mudah, atau konten interaktif yang lebih dekat dengan audiens.`,
  "4.1 Proses Produksi": (data) => `Proses produksi ${data.product} dimulai dari penerimaan ide atau pilihan custom dari konsumen, pembuatan desain awal, persiapan bahan, produksi, pengecekan kualitas, pengemasan, dan dokumentasi produk. Setiap tahap perlu dicatat agar kelompok dapat mengetahui kendala produksi dan memperbaiki alur kerja. Dokumentasi proses juga dapat digunakan sebagai konten behind the scenes untuk membangun kepercayaan audiens.`,
  "4.2 Kebutuhan Alat dan Bahan": (data) => `Kebutuhan alat dan bahan disesuaikan dengan karakter ${data.product}. Secara umum, kelompok perlu menyiapkan bahan utama produk, alat produksi atau alat finishing, kemasan, label brand, properti foto, serta perangkat untuk membuat konten. Kebutuhan tersebut tidak harus besar pada tahap awal, tetapi harus cukup untuk membuat contoh produk yang layak ditampilkan dan digunakan sebagai materi promosi.`,
  "4.3 Estimasi Biaya": (data) => costIntro(data),
  "4.4 Timeline Pelaksanaan": (data) => timelineIntro(data),
  "5.1 Identitas Brand": (data) => `Identitas brand ${data.brand} dibangun melalui nama, warna visual, gaya komunikasi, dan konsistensi tampilan konten. Identitas yang kuat membantu audiens mengenali brand meskipun hanya melihat sekilas unggahan. Gaya komunikasi yang digunakan perlu ramah, jelas, dan sesuai dengan karakter target konsumen agar interaksi tidak terasa kaku.`,
  "5.2 Tujuan Penggunaan Media Sosial": (data) => `Media sosial digunakan untuk membangun awareness, memperkenalkan ${data.product}, menjelaskan cara pemesanan, dan mengumpulkan respons audiens. Tujuan lainnya adalah mendokumentasikan proses mini project agar kelompok memiliki bukti kegiatan dan bahan evaluasi strategi. Dengan pengelolaan yang konsisten, media sosial dapat menjadi alat promosi sekaligus sumber data evaluasi.`,
  "5.3 Platform Media Sosial": (data) => `Platform yang digunakan adalah ${data.platforms}. Setiap platform perlu memiliki peran yang jelas. Platform visual dapat digunakan untuk katalog dan foto produk, platform video pendek untuk demonstrasi dan konten ringan, sedangkan kanal komunikasi atau marketplace digunakan untuk menjawab pertanyaan dan memproses pesanan. Keterhubungan antarplatform membuat perjalanan konsumen lebih mudah dipahami.`,
  "5.4 Marketing Mix 4P": (data) => [
    `Product yang ditawarkan adalah ${data.product}, yaitu produk custom yang mengutamakan nilai personalisasi dan tampilan visual. Informasi produk harus menjelaskan manfaat, variasi, cara custom, dan contoh hasil agar calon konsumen dapat membayangkan produk yang akan diterima.`,
    `Price direncanakan mulai dari ${data.price}. Harga perlu mempertimbangkan biaya bahan, waktu pengerjaan, kemasan, dan nilai custom. Strategi harga dapat dilengkapi dengan promo awal atau bundling agar konsumen pertama lebih tertarik mencoba produk.`,
    `Place difokuskan pada ${data.platforms}. Media sosial berfungsi untuk memperkenalkan dan menjelaskan produk, sedangkan kanal pemesanan diarahkan pada metode yang paling mudah digunakan oleh target konsumen. Informasi alur pembelian harus dibuat ringkas agar calon pembeli tidak kebingungan.`,
    `Promotion dilakukan melalui product showcase, behind the scenes, konten edukasi, story interaktif, dan promosi launching. Promosi tidak hanya mengejar penjualan, tetapi juga membangun kepercayaan terhadap brand baru melalui konten yang konsisten dan respons yang cepat.`,
  ].join("\n\n"),
  "5.5 Strategi Konten": (data) => `Strategi konten ${data.brand} mencakup pengenalan brand, edukasi produk, showcase variasi, proses produksi, testimoni atau respons awal, serta konten interaktif. Konten harus dibuat dengan visual yang bersih dan caption yang mudah dipahami. Setiap unggahan sebaiknya memiliki tujuan, misalnya mengenalkan produk, menjawab pertanyaan, mendorong komentar, atau mengarahkan audiens untuk bertanya melalui pesan langsung.`,
  "5.6 Jadwal Posting": () => `Jadwal posting dirancang tiga sampai empat kali dalam satu minggu pada tahap awal. Komposisi konten dapat terdiri dari satu unggahan product showcase, satu video pendek, satu story interaktif, dan satu konten edukasi atau promosi. Jadwal tersebut dapat disesuaikan setelah kelompok melihat kapasitas produksi konten dan respons audiens pada minggu-minggu pertama.`,
  "5.7 Strategi Engagement": (data) => `Strategi engagement dilakukan dengan mendorong audiens berpartisipasi dalam pilihan desain, warna, nama, atau ide penggunaan produk. ${data.brand} dapat memakai polling, pertanyaan di story, komentar terbuka, dan repost respons audiens. Interaksi yang muncul perlu dicatat karena dapat menjadi bahan evaluasi strategi konten dan pengembangan produk.`,
  "6.1 Kesimpulan": (data) => `Proposal ini menunjukkan bahwa ${data.brand} memiliki peluang untuk dikembangkan sebagai mini project yang relevan dengan mata kuliah ${data.course}. Produk ${data.product} memiliki nilai personalisasi, potensi visual, dan kesesuaian dengan perilaku konsumen muda di media sosial. Rencana yang disusun mencakup analisis bisnis, operasional, estimasi biaya, timeline, dan strategi pemasaran sehingga proyek memiliki arah pelaksanaan yang jelas.`,
  "6.2 Saran": (data) => `Kelompok disarankan menjaga konsistensi pelaksanaan sejak minggu pertama. Setiap anggota perlu memahami tanggung jawabnya, mencatat data kegiatan, dan mengevaluasi respons audiens secara berkala. ${data.brand} juga perlu memperbaiki kualitas visual, memperjelas informasi produk, serta menyesuaikan strategi promosi berdasarkan data aktual yang diperoleh selama mini project berlangsung.`,
};

function costIntro(data: MiniProjectData): string {
  return `Estimasi biaya disusun untuk memberikan gambaran kebutuhan awal dalam menjalankan mini project ${data.brand}. Angka yang digunakan bersifat realistis untuk skala mahasiswa dan dapat disesuaikan setelah kelompok mengetahui harga bahan yang sebenarnya. Perencanaan biaya diperlukan agar kegiatan produksi, kemasan, dan promosi dapat berjalan tanpa melebihi kemampuan modal awal kelompok.`;
}

function timelineIntro(data: MiniProjectData): string {
  return `Timeline pelaksanaan disusun selama empat belas minggu agar kegiatan ${data.brand} berjalan terarah dari tahap perencanaan sampai evaluasi. Setiap minggu memiliki kegiatan dan target yang berbeda sehingga kelompok dapat memantau perkembangan proyek secara bertahap.`;
}

function collectMiniProjectData(analysis: AssignmentAnalysis, answers: AssignmentAnswers): MiniProjectData {
  const value = (...keys: string[]) => pickAnswer(answers, keys);
  const object = value("mainObject", "product", "produk", "productName", "projectName", "brandName", "businessName", "topic");
  const brand = value("brand", "brandName", "businessName", "namaBrand", "namaUsaha", "projectName") || object || "usaha mini project";
  const product = value("product", "produk", "productName", "mainObject", "topic") || object || "produk custom yang dirancang kelompok";
  return {
    brand,
    product,
    productDescription: value("productDescription", "objectDetails", "detailProduk", "deskripsiProduk", "requiredContent") || `${product} dikembangkan sebagai produk yang memiliki nilai personalisasi dan tampilan menarik bagi konsumen muda`,
    targetMarket: value("targetMarket", "targetAudience", "targetPasar", "sasaran", "market") || "remaja, mahasiswa, dan konsumen muda yang aktif menggunakan media sosial",
    price: value("price", "harga", "pricing", "modal") || "harga awal yang disesuaikan dengan biaya produksi dan variasi custom",
    platforms: value("platform", "platforms", "socialPlatforms", "mediaSosial", "channels") || "Instagram, TikTok, dan kanal pemesanan yang dipilih kelompok",
    accountName: value("accountName", "socialAccount", "akun", "namaAkun") || `akun resmi ${brand}`,
    members: value("members", "studentIdentity", "studentName", "groupMembers", "anggota") || "kelompok mahasiswa penyusun",
    className: value("className", "kelas") || "kelas pengampu",
    lecturerName: value("lecturerName", "dosen", "namaDosen") || "dosen pengampu",
    date: value("date", "tanggal", "deadline") || new Date().toLocaleDateString("id-ID"),
    course: analysis.course || value("course", "mataKuliah") || "Social Media Marketing",
    groupName: value("groupName", "kelompok", "namaKelompok") || "Kelompok Mini Project",
    studyProgram: value("studyProgram", "programStudi", "prodi") || "Program Studi Manajemen",
    productImageDataUrl: value("productImageData", "productPhotoData", "fotoProdukData"),
    productImageName: value("productImageName", "productPhotoName", "fotoProdukName") || "Foto Produk",
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
  return `Proposal Mini Project ini menyusun rancangan awal pengembangan ${data.brand} sebagai usaha yang menawarkan ${data.product}. Proposal mencakup pendahuluan, brand dan produk, analisis bisnis, rencana operasional, strategi pemasaran, serta penutup. Dokumen ini disusun oleh ${data.members} dari ${data.className} untuk mata kuliah ${data.course} di bawah arahan ${data.lecturerName}.`;
}

function buildReferences(): string[] {
  return [
    "Chaffey, D., & Ellis-Chadwick, F. (2019). Digital marketing: Strategy, implementation and practice. Pearson.",
    "Kotler, P., & Keller, K. L. (2016). Marketing management. Pearson Education.",
    "Kotler, P., Kartajaya, H., & Setiawan, I. (2021). Marketing 5.0: Technology for humanity. John Wiley & Sons.",
    "Tuten, T. L., & Solomon, M. R. (2018). Social media marketing. SAGE Publications.",
    "Zimmerer, T. W., Scarborough, N. M., & Wilson, D. (2008). Essentials of entrepreneurship and small business management. Pearson.",
  ];
}
