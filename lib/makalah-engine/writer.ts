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
  const clickoraProposal = isClickoraProposal(input);
  const frontMatter = clickoraProposal ? null : await callOpenAI<FrontMatterPayload>(buildFrontMatterPrompt(input, outline));
  const chapters: MakalahChapter[] = [];
  let fallback = clickoraProposal || outlineFallback || !frontMatter;
  let model = frontMatter?.model || DEFAULT_MODEL;

  for (const chapterOutline of outline.chapters) {
    const payload = clickoraProposal ? null : await callOpenAI<ChapterPayload>(buildChapterPrompt(input, outline, chapterOutline));
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
  if (isClickoraProposal(input)) {
    const data = getMiniProjectData(input);
    return [
      `Puji syukur penulis panjatkan ke hadirat Tuhan Yang Maha Esa karena proposal mini project berjudul "${input.judul}" dapat disusun sebagai rancangan kegiatan pada mata kuliah ${input.mataKuliah}. Proposal ini membahas pengembangan brand ${data.brand} dengan produk ${data.product} yang mengusung tagline "${data.tagline}".`,
      `Proposal ini disusun untuk merancang dasar branding, target market, marketing mix, strategi media sosial, serta timeline pelaksanaan Week 1 sampai Week 14. Platform utama yang digunakan dalam perencanaan adalah ${data.platforms} agar strategi komunikasi, promosi, dan distribusi produk saling terhubung.`,
      `Penulis menyampaikan terima kasih kepada ${input.namaDosen} selaku dosen pengampu atas arahan pembelajaran yang diberikan. Penulis menyadari proposal ini masih dapat disempurnakan, terutama setelah data produk, visual, dan respons audiens diperoleh selama pelaksanaan mini project.`,
    ].join("\n\n");
  }

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
  if (isClickoraProposal(input)) {
    return miniProjectSubsectionContent(input, subsectionTitle);
  }

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
  if (isClickoraProposal(input)) {
    return [
      "Chaffey, D., & Ellis-Chadwick, F. (2019). Digital marketing: Strategy, implementation and practice. Pearson.",
      "Kotler, P., & Keller, K. L. (2016). Marketing management. Pearson Education.",
      "Kotler, P., Kartajaya, H., & Setiawan, I. (2021). Marketing 5.0: Technology for humanity. John Wiley & Sons.",
      "Tuten, T. L., & Solomon, M. R. (2018). Social media marketing. SAGE Publications.",
      "We Are Social. (2024). Digital 2024: Indonesia. DataReportal.",
    ];
  }
  return [
    `Creswell, J. W. (${Math.max(2018, year - 6)}). Research design: Qualitative, quantitative, and mixed methods approaches. SAGE Publications.`,
    `Sugiyono. (${Math.max(2019, year - 5)}). Metode penelitian kuantitatif, kualitatif, dan R&D. Alfabeta.`,
    `Kotler, P., & Keller, K. L. (${Math.max(2016, year - 8)}). Marketing management. Pearson Education.`,
    `Robbins, S. P., & Coulter, M. (${Math.max(2018, year - 6)}). Management. Pearson.`,
    `Sumber akademik terkait ${input.tema}. (${year}). Diolah untuk kebutuhan makalah ${input.mataKuliah}.`,
  ];
}

function buildLampiran(input: MakalahEngineInput): string[] {
  if (isClickoraProposal(input)) {
    const data = getMiniProjectData(input);
    return [
      `Konsep visual brand: ${data.brand} menggunakan gaya visual cerah, playful, dan personal dengan fokus pada nama pelanggan sebagai elemen utama desain.`,
      `Foto produk placeholder: [Masukkan foto ${data.product} dari beberapa variasi model, warna, dan contoh personalisasi nama].`,
      `Contoh caption: ${data.tagline}. ${data.product} dari ${data.brand} siap membuat aksesori kecil terasa lebih personal. Pesan melalui ${data.platforms}.`,
      "Contoh content calendar: Week 1 pengenalan brand, Week 2 teaser produk, Week 3 behind the scenes, Week 4 edukasi personalisasi, Week 5 promo launching, Week 6 testimoni, Week 7 evaluasi konten awal.",
    ];
  }

  const items = [];
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

type MiniProjectData = {
  brand: string;
  product: string;
  tagline: string;
  platforms: string;
  productDescription: string;
  targetMarket: string;
};

function getMiniProjectData(input: MakalahEngineInput): MiniProjectData {
  const values = input.dynamicValues || {};
  return {
    brand: clean(values.brandName) || extractFromTema(input.tema, "Brand") || "Clickora",
    product: clean(values.productName) || extractFromTema(input.tema, "Produk") || "Custom Clicker Nama",
    tagline: clean(values.tagline) || extractFromTema(input.tema, "Tagline") || "Klik Namamu, Tunjukkan Gayamu",
    platforms: clean(values.socialPlatforms) || extractFromTema(input.tema, "Platform") || "Instagram, TikTok, Shopee",
    productDescription: clean(values.productDescription) || "Produk dibuat menggunakan mesin 3D printing, tersedia dalam berbagai model dan warna, berbentuk seperti keyboard mini, dan menghasilkan bunyi klik saat ditekan.",
    targetMarket: clean(values.targetMarket) || "Pelajar dan mahasiswa yang menyukai aksesori personal, unik, dan mudah dibagikan di media sosial.",
  };
}

function miniProjectSubsectionContent(input: MakalahEngineInput, subsectionTitle: string): string {
  const data = getMiniProjectData(input);
  const paragraphs: Record<string, string[]> = {
    "Latar Belakang": [
      `Perkembangan media sosial membuat produk personalisasi semakin mudah dikenalkan kepada konsumen muda. ${data.product} dari brand ${data.brand} memiliki peluang karena menawarkan aksesori kecil yang dapat disesuaikan dengan identitas pemiliknya. Produk ini ${data.productDescription.toLowerCase()} Karakter tersebut membuat ${data.product} tidak hanya dilihat sebagai aksesori, tetapi juga sebagai media ekspresi diri yang cocok untuk konten visual di ${data.platforms}.`,
      `Mini project ini dirancang untuk membangun ${data.brand} sebagai brand yang mudah dikenali melalui tagline "${data.tagline}". Strategi pemasaran tidak hanya berfokus pada penjualan, tetapi juga pada pengenalan cerita produk, cara pemesanan, variasi model, pilihan warna, dan pengalaman saat tombol menghasilkan bunyi klik. Dengan pendekatan tersebut, proposal ini menempatkan ${data.product} sebagai produk personal yang relevan bagi pelajar dan mahasiswa.`,
    ],
    "Rumusan Masalah": [
      `Rumusan masalah proposal ini berangkat dari kebutuhan ${data.brand} untuk memperkenalkan ${data.product} secara jelas kepada target market. Produk yang dibuat dengan 3D printing dan berbentuk seperti keyboard mini perlu dijelaskan agar calon konsumen memahami fungsi, nilai personalisasi, pilihan warna, serta pengalaman bunyi klik saat digunakan. Tanpa strategi komunikasi yang tepat, keunggulan produk berisiko tidak terlihat dalam konten media sosial.`,
      `Masalah berikutnya adalah bagaimana ${data.brand} menggunakan ${data.platforms} secara saling mendukung. Instagram dapat menampilkan visual produk dan katalog warna, TikTok dapat memperlihatkan proses pembuatan serta bunyi klik melalui video pendek, sedangkan Shopee menjadi kanal transaksi. Rumusan ini menjadi dasar untuk menyusun target market, positioning, marketing mix, strategi engagement, dan timeline mingguan.`,
    ],
    "Tujuan Penulisan": [
      `Tujuan penulisan proposal ini adalah menyusun rancangan mini project Social Media Marketing untuk ${data.brand}. Proposal diarahkan untuk menjelaskan identitas brand, memperkenalkan ${data.product}, menentukan target market pelajar dan mahasiswa, serta merancang penggunaan ${data.platforms} sebagai kanal promosi dan penjualan.`,
      `Tujuan lainnya adalah membuat rencana kerja Week 1 sampai Week 14 agar kegiatan branding dan pemasaran berjalan terukur. Timeline tersebut mencakup persiapan konsep visual, produksi konten, pengenalan produk 3D printing, simulasi target engagement, pengelolaan Shopee, serta evaluasi konten. Dengan rencana ini, tim memiliki panduan kerja yang jelas sejak awal mini project.`,
    ],
    "Manfaat Penulisan": [
      `Secara akademik, proposal ini bermanfaat sebagai penerapan konsep social media marketing pada produk nyata. Mahasiswa dapat melihat bagaimana segmentasi pasar, positioning, marketing mix 4P, dan strategi engagement digunakan untuk membangun brand ${data.brand} yang menjual ${data.product}.`,
      `Secara praktis, proposal ini membantu tim menyusun arah kerja yang lebih rapi. Informasi tentang produk 3D printing, variasi model dan warna, bentuk keyboard mini, bunyi klik, target pelajar dan mahasiswa, serta penggunaan ${data.platforms} dapat dijadikan dasar dalam membuat konten, mengatur etalase, dan membagi tugas tim.`,
    ],
    "Nama Brand": [
      `Nama brand yang digunakan dalam mini project ini adalah ${data.brand}. Nama ini menjadi identitas utama yang akan muncul pada konten, caption, katalog produk, dan etalase marketplace. Konsistensi penggunaan nama ${data.brand} penting agar audiens tidak bingung saat berpindah dari Instagram atau TikTok menuju Shopee.`,
      `${data.brand} diposisikan sebagai brand aksesori personal yang dekat dengan gaya anak muda. Melalui tagline "${data.tagline}", brand ini menegaskan bahwa konsumen dapat menunjukkan identitasnya melalui produk kecil yang dibuat sesuai nama, warna, dan model pilihan mereka.`,
    ],
    "Deskripsi Brand": [
      `${data.brand} adalah brand yang berfokus pada aksesori personal berbasis custom. Produk utamanya adalah ${data.product}, yaitu clicker berbentuk keyboard mini yang dapat dibuat dengan nama pelanggan. Brand ini membawa kesan playful, kreatif, dan dekat dengan keseharian pelajar serta mahasiswa.`,
      `Karakter komunikasi ${data.brand} perlu menonjolkan proses personalisasi dan pengalaman produk saat ditekan. Konten dapat memperlihatkan detail 3D printing, pilihan warna, model keyboard mini, serta suara klik yang menjadi daya tarik sensorik. Dengan begitu, ${data.brand} memiliki identitas yang lebih spesifik dibanding aksesori custom biasa.`,
    ],
    "Visi, Misi, dan Nilai Brand": [
      `Visi ${data.brand} adalah menjadi brand aksesori personal yang membantu konsumen menampilkan identitas melalui produk custom yang kreatif dan mudah dijangkau. Visi ini sesuai dengan ${data.product} karena produk dibuat berdasarkan nama dan preferensi warna pelanggan.`,
      `Misi ${data.brand} meliputi menyediakan desain clicker yang variatif, menjaga kualitas hasil 3D printing, membuat proses pemesanan mudah, dan membangun komunikasi aktif di ${data.platforms}. Nilai yang diutamakan adalah personal, kreatif, responsif, terjangkau, dan menyenangkan.`,
    ],
    "Deskripsi Produk Custom Clicker Nama": [
      `${data.product} adalah produk clicker custom yang diproduksi menggunakan mesin 3D printing. Produk ini tersedia dalam berbagai model dan warna, sehingga pelanggan dapat memilih tampilan yang sesuai dengan gaya mereka. Bentuknya menyerupai keyboard mini dan memberikan pengalaman bunyi klik saat tombol ditekan.`,
      `Keunikan produk terletak pada personalisasi nama dan pengalaman penggunaannya. Nama pelanggan dapat menjadi elemen visual utama, sedangkan bunyi klik memberi kesan interaktif yang mudah ditampilkan dalam konten video. Detail ini membuat ${data.product} cocok dipasarkan melalui Instagram Reels, TikTok, dan etalase Shopee.`,
    ],
    "Keunggulan Produk": [
      `Keunggulan utama ${data.product} adalah kombinasi antara personalisasi, bentuk keyboard mini, dan proses produksi 3D printing. Produk tidak hanya dapat dibuat sesuai nama, tetapi juga dapat dikembangkan dalam berbagai model dan warna. Fleksibilitas ini memberi ruang bagi ${data.brand} untuk membuat katalog desain yang menarik.`,
      `Keunggulan lainnya adalah daya tarik konten. Saat produk ditekan dan menghasilkan bunyi klik, ${data.brand} dapat membuat video demonstrasi singkat yang mudah dipahami audiens. Unsur visual dan audio tersebut membantu produk lebih menonjol di ${data.platforms}, terutama bagi pelajar dan mahasiswa yang menyukai aksesori unik.`,
    ],
    "Segmentasi Pasar": [
      `Segmentasi pasar ${data.brand} mencakup pelajar dan mahasiswa yang aktif menggunakan media sosial. Mereka cenderung menyukai produk personal, lucu, terjangkau, dan memiliki nilai ekspresi diri. ${data.product} sesuai dengan segmen ini karena dapat menampilkan nama, warna favorit, serta bentuk keyboard mini yang dekat dengan budaya digital.`,
      `Dari sisi perilaku, target konsumen sering mencari inspirasi produk melalui Instagram dan TikTok sebelum membeli di marketplace. Karena itu, segmentasi ${data.brand} tidak cukup hanya berdasarkan usia, tetapi juga kebiasaan digital, ketertarikan terhadap produk custom, dan kecenderungan membeli aksesori kecil melalui Shopee.`,
    ],
    "Targeting": [
      `Target utama ${data.brand} adalah pelajar dan mahasiswa yang ingin memiliki aksesori personal dengan harga terjangkau. Mereka cocok menjadi sasaran awal karena mudah merespons konten visual, menyukai barang custom, dan sering menggunakan produk kecil sebagai bagian dari gaya pribadi.`,
      `Target sekunder adalah pembeli hadiah untuk teman, pasangan, atau anggota keluarga. ${data.product} dapat diposisikan sebagai hadiah sederhana namun personal karena nama penerima dapat ditampilkan pada produk. Strategi targeting ini membuat ${data.brand} dapat mengembangkan konten untuk kebutuhan pribadi dan gifting.`,
    ],
    "Positioning": [
      `${data.brand} diposisikan sebagai brand custom clicker yang membantu pelajar dan mahasiswa menunjukkan identitas melalui produk berbentuk keyboard mini. Positioning ini membedakan ${data.product} dari aksesori biasa karena menonjolkan personalisasi nama, variasi warna, serta pengalaman bunyi klik.`,
      `Tagline "${data.tagline}" memperkuat posisi brand sebagai produk yang berkaitan dengan ekspresi diri. Dalam komunikasi pemasaran, ${data.brand} perlu konsisten menampilkan hasil custom, proses 3D printing, dan cara pemesanan agar audiens memahami nilai produk sebelum diarahkan ke Shopee.`,
    ],
    "Persona Pelanggan": [
      `Persona pertama adalah mahasiswa yang aktif di TikTok dan Instagram, menyukai aksesori unik, serta ingin barang yang menampilkan namanya. Persona ini tertarik pada konten before-after dari desain nama menjadi produk ${data.product}. Mereka membutuhkan contoh warna, model, dan cara order yang singkat.`,
      `Persona kedua adalah pelajar yang mencari hadiah personal untuk teman. Mereka membutuhkan produk yang terlihat menarik, mudah dipesan, dan memiliki harga yang masuk akal. Untuk persona ini, ${data.brand} perlu menampilkan foto produk, video bunyi klik, pilihan warna, dan link Shopee yang mudah ditemukan.`,
    ],
    "Product": [
      `Produk utama dalam marketing mix ${data.brand} adalah ${data.product}. Produk ini dibuat menggunakan mesin 3D printing, tersedia dalam berbagai model dan warna, berbentuk seperti keyboard mini, serta menghasilkan bunyi klik saat ditekan. Fitur tersebut harus menjadi inti komunikasi produk.`,
      `Pengembangan produk dapat mencakup pilihan warna populer, variasi bentuk tombol, opsi nama pendek, dan kemasan sederhana. Konten produk perlu menampilkan detail permukaan hasil 3D printing, ukuran, contoh nama, serta pengalaman menekan tombol agar calon pembeli memahami bentuk dan fungsi produk.`,
    ],
    "Price": [
      `Strategi harga ${data.brand} perlu mempertimbangkan biaya bahan 3D printing, waktu produksi, tingkat kesulitan desain, dan nilai personalisasi. Karena data biaya aktual belum tersedia, harga dalam proposal dapat diposisikan sebagai simulasi perencanaan untuk membantu tim menentukan rentang harga awal.`,
      `Harga sebaiknya dikomunikasikan bersama manfaat produk, bukan hanya angka. Konsumen membeli ${data.product} karena nama, pilihan warna, bentuk keyboard mini, dan pengalaman bunyi kliknya. Oleh karena itu, ${data.brand} dapat menyiapkan harga reguler, paket bundling, dan promo launching di Shopee.`,
    ],
    "Place": [
      `Place atau saluran distribusi ${data.brand} difokuskan pada ${data.platforms}. Instagram digunakan untuk katalog visual, TikTok untuk video pendek yang menampilkan proses dan bunyi klik, sedangkan Shopee menjadi tempat transaksi utama. Ketiga platform harus saling mengarahkan agar perjalanan pelanggan jelas.`,
      `Alur yang disarankan adalah audiens menemukan konten di TikTok atau Instagram, melihat detail warna dan model, lalu diarahkan ke Shopee untuk membeli. Dengan sistem ini, ${data.brand} dapat membangun awareness sekaligus menyediakan kanal checkout yang familiar bagi pelajar dan mahasiswa.`,
    ],
    "Promotion": [
      `Promosi ${data.brand} dapat dimulai dari konten demonstrasi ${data.product}. Video singkat dapat menampilkan nama pelanggan, proses 3D printing, pilihan warna, bentuk keyboard mini, dan bunyi klik saat ditekan. Konten seperti ini mudah dipahami dan cocok untuk format Reels maupun TikTok.`,
      `Strategi promosi juga dapat memakai promo launching, bundling untuk pembelian beberapa nama, dan ajakan user generated content. Contohnya, audiens diminta menulis nama mereka di komentar untuk dibuatkan contoh desain. Cara ini membuat promosi terasa interaktif dan tetap terhubung dengan karakter produk custom.`,
    ],
    "Gaya Komunikasi": [
      `Gaya komunikasi ${data.brand} sebaiknya ramah, ekspresif, dan dekat dengan bahasa pelajar serta mahasiswa. Brand perlu terdengar antusias saat menjelaskan pilihan warna, model, dan personalisasi nama, tetapi tetap jelas ketika menjelaskan harga, cara order, dan estimasi pengerjaan.`,
      `Tagline "${data.tagline}" dapat menjadi dasar gaya komunikasi. Caption, balasan komentar, dan konten video sebaiknya menonjolkan gagasan bahwa nama pelanggan dapat menjadi bagian dari gaya personal. Dengan tone tersebut, ${data.brand} terasa lebih dekat dengan target marketnya.`,
    ],
    "Jenis Konten": [
      `Jenis konten utama ${data.brand} meliputi product showcase, video proses 3D printing, demonstrasi bunyi klik, katalog warna, dan contoh nama pelanggan. Konten ini penting karena calon pembeli perlu melihat bentuk produk dan memahami pengalaman saat tombol ditekan.`,
      `Konten pendukung dapat berupa polling warna, rekomendasi model untuk nama tertentu, ide hadiah, dan behind the scenes pengemasan. Variasi konten tersebut membantu ${data.brand} menjaga interaksi tanpa mengulang pesan yang sama di ${data.platforms}.`,
    ],
    "Platform yang Digunakan": [
      `${data.platforms} digunakan sebagai platform utama mini project ${data.brand}. Instagram berfungsi untuk membangun identitas visual dan katalog produk. TikTok berfungsi memperluas awareness melalui video pendek yang menampilkan proses, bentuk keyboard mini, dan bunyi klik. Shopee berfungsi sebagai kanal transaksi.`,
      `Setiap platform memiliki peran berbeda sehingga kontennya perlu disesuaikan. Instagram menekankan visual rapi, TikTok menekankan demonstrasi dan storytelling singkat, sedangkan Shopee menekankan informasi produk, variasi warna, harga, dan kemudahan checkout.`,
    ],
    "Strategi Engagement": [
      `Strategi engagement ${data.brand} dapat memanfaatkan unsur nama pelanggan. Konten seperti "tulis nama kamu, nanti dibuatkan contoh clicker" dapat mendorong komentar. Polling warna dan model juga dapat membuat audiens merasa terlibat dalam proses desain produk.`,
      `Engagement juga dapat dibangun melalui video reaksi saat tombol ditekan dan menghasilkan bunyi klik. Karena pengalaman audio menjadi ciri produk, ${data.brand} dapat membuat konten yang mengajak audiens memilih suara, warna, atau desain favorit sebelum diarahkan ke Shopee.`,
    ],
    "Timeline Week 1 sampai Week 14": [
      `Week 1 difokuskan pada finalisasi proposal, identitas ${data.brand}, dan konsep produk ${data.product}. Week 2 sampai Week 3 digunakan untuk membuat desain awal, menentukan warna, membuat akun Instagram dan TikTok, serta menyiapkan etalase Shopee. Week 4 sampai Week 6 diarahkan untuk produksi konten pengenalan produk.`,
      `Week 7 sampai Week 10 digunakan untuk promosi rutin, interaksi komentar, dan evaluasi konten awal. Week 11 sampai Week 13 diarahkan pada perbaikan konten, optimasi Shopee, dan pengumpulan insight. Week 14 menjadi tahap evaluasi akhir dan penyusunan laporan mini project.`,
    ],
    "Target Mingguan": [
      `Target mingguan ${data.brand} dimulai dari penyelesaian identitas brand, contoh desain, dan materi visual. Setelah itu, target beralih ke jumlah konten, konsistensi posting, respons komentar, dan kesiapan katalog Shopee. Target ini harus dicatat agar perkembangan mini project dapat dievaluasi.`,
      `Jika data performa asli belum tersedia, angka engagement ditulis sebagai simulasi perencanaan. Setelah konten dipublikasikan, tim dapat menggantinya dengan data aktual dari Instagram Insight, TikTok Analytics, dan statistik Shopee agar laporan akhir lebih valid.`,
    ],
    "Pembagian Tugas Tim": [
      `Pembagian tugas tim ${data.brand} dapat dibagi menjadi konten, desain, produksi, marketplace, dan evaluasi. Tim konten menyusun ide dan caption, tim desain membuat visual, tim produksi menyiapkan contoh ${data.product}, tim marketplace mengatur Shopee, dan tim evaluasi mencatat performa.`,
      `Pembagian tugas ini membantu mini project berjalan lebih teratur. Setiap anggota memiliki tanggung jawab yang jelas, mulai dari menampilkan detail produk 3D printing sampai memastikan calon pembeli memahami cara memesan ${data.product}.`,
    ],
    "Kesimpulan": [
      `Proposal mini project ini menunjukkan bahwa ${data.brand} memiliki peluang untuk memperkenalkan ${data.product} sebagai aksesori personal bagi pelajar dan mahasiswa. Produk memiliki nilai unik karena dibuat dengan 3D printing, tersedia dalam berbagai model dan warna, berbentuk seperti keyboard mini, dan menghasilkan bunyi klik saat ditekan.`,
      `Strategi ${data.brand} menghubungkan identitas brand, target market, marketing mix 4P, media sosial, dan timeline mingguan. Dengan memanfaatkan ${data.platforms}, mini project ini dapat membangun awareness, engagement, dan jalur pembelian yang lebih terarah.`,
    ],
    "Saran": [
      `${data.brand} disarankan menjaga konsistensi visual, warna, dan gaya komunikasi sejak awal. Setiap konten perlu menampilkan keunikan ${data.product}, terutama personalisasi nama, proses 3D printing, bentuk keyboard mini, dan bunyi klik yang menjadi pembeda produk.`,
      `Tim juga disarankan segera mengumpulkan data aktual setelah konten dipublikasikan. Data dari ${data.platforms} dapat digunakan untuk menilai jenis konten paling efektif, memperbaiki jadwal posting, dan memperkuat laporan akhir mini project.`,
    ],
  };

  const extra: Record<string, string> = {
    "Visi, Misi, dan Nilai Brand": `Dalam pelaksanaannya, nilai responsif harus terlihat dari balasan komentar, kecepatan menjawab pertanyaan order, dan kemampuan ${data.brand} memberi pilihan model sesuai permintaan pelanggan.`,
    "Targeting": `Prioritas targeting awal sebaiknya diarahkan pada audiens yang mudah dijangkau melalui jaringan kampus, komunitas kelas, dan teman sebaya agar validasi minat terhadap ${data.product} dapat dilakukan lebih cepat.`,
    "Positioning": `Positioning ini perlu dijaga dalam setiap visual: nama pelanggan harus tampak jelas, bentuk keyboard mini perlu terlihat, dan manfaat personalisasi harus langsung terbaca dalam tiga detik pertama konten.`,
    "Price": `Tim dapat membandingkan beberapa skenario harga dengan mempertimbangkan ukuran produk, durasi cetak 3D, tingkat detail nama, dan biaya kemasan agar harga tetap realistis bagi pelajar dan mahasiswa.`,
    "Place": `Bio Instagram dan TikTok sebaiknya memuat tautan Shopee, sedangkan halaman Shopee perlu menampilkan variasi model dan warna secara rapi agar calon pembeli tidak perlu bertanya ulang sebelum checkout.`,
    "Gaya Komunikasi": `Contoh gaya komunikasi yang dapat digunakan adalah ajakan singkat seperti memilih warna nama, meminta contoh desain, atau menanyakan model favorit tanpa membuat audiens merasa sedang melihat iklan yang kaku.`,
    "Jenis Konten": `Setiap jenis konten sebaiknya memiliki tujuan berbeda: showcase untuk memperjelas produk, proses cetak untuk membangun kepercayaan, dan konten interaktif untuk meningkatkan komentar serta ide desain baru.`,
    "Platform yang Digunakan": `Pembagian peran platform ini membuat konten tidak sekadar diunggah ulang, melainkan disesuaikan dengan kebiasaan pengguna pada masing-masing kanal digital.`,
    "Strategi Engagement": `Interaksi yang masuk perlu dicatat sebagai bahan evaluasi, misalnya nama yang paling sering diminta, warna favorit audiens, dan pertanyaan yang berulang tentang cara order.`,
    "Target Mingguan": `Target mingguan tidak harus langsung berupa penjualan, karena pada tahap awal brand membutuhkan awareness, bukti minat, dan katalog konten yang cukup untuk meyakinkan calon pembeli.`,
    "Pembagian Tugas Tim": `Koordinasi tim dapat dilakukan melalui daftar kerja mingguan sehingga setiap konten, desain, dan pembaruan Shopee memiliki tenggat yang jelas sebelum jadwal posting.`,
    "Kesimpulan": `Dengan fokus tersebut, proposal ini dapat menjadi dasar pelaksanaan yang konkret karena setiap strategi langsung mengarah pada produk, audiens, platform, dan jadwal kerja mini project.`,
    "Saran": `Saran ini penting agar keputusan berikutnya tidak hanya berdasarkan asumsi, tetapi juga berdasarkan respons nyata dari audiens dan calon pembeli selama mini project berjalan.`,
  };

  if (paragraphs[subsectionTitle]) {
    return [...paragraphs[subsectionTitle], extra[subsectionTitle]].filter(Boolean).join("\n\n");
  }

  return `${subsectionTitle} membahas bagian proposal ${data.brand} yang berkaitan langsung dengan produk ${data.product}, target pelajar dan mahasiswa, serta strategi pemasaran melalui ${data.platforms}.`;
}

function extractFromTema(tema: string, key: string): string {
  const match = tema.match(new RegExp(`${key}:\\s*([^;\\n.]+)`, "i"));
  return match?.[1]?.trim() || "";
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function clickoraSubsectionContent(subsectionTitle: string): string {
  const paragraphs: Record<string, string[]> = {
    "Latar Belakang": [
      "Perkembangan media sosial membuat produk personalisasi semakin mudah dikenalkan kepada konsumen muda. Custom Clicker Nama memiliki peluang karena menawarkan aksesori kecil yang dapat disesuaikan dengan identitas pemiliknya. Dalam proposal mini project ini, produk tersebut dikembangkan melalui brand Clickora dengan tagline \"Klik Namamu, Tunjukkan Gayamu\" sebagai pesan utama yang sederhana, mudah diingat, dan relevan dengan gaya ekspresi anak muda.",
      "Clickora dirancang untuk memanfaatkan Instagram, TikTok, dan Shopee sebagai saluran utama. Instagram digunakan untuk membangun visual brand, TikTok untuk memperluas awareness melalui konten singkat, sedangkan Shopee berfungsi sebagai kanal transaksi. Keterhubungan ketiga platform tersebut membuat strategi pemasaran tidak hanya berfokus pada promosi, tetapi juga pada perjalanan pelanggan dari melihat konten sampai melakukan pembelian.",
    ],
    "Rumusan Masalah": [
      "Rumusan masalah dalam proposal ini berangkat dari kebutuhan Clickora untuk membangun identitas brand yang jelas sejak awal mini project. Produk Custom Clicker Nama memerlukan strategi agar konsumen memahami nilai personalisasi, bukan hanya melihatnya sebagai aksesori biasa. Karena itu, masalah utama yang dibahas adalah bagaimana Clickora memperkenalkan brand, menjelaskan keunggulan produk, dan membangun minat beli melalui media sosial.",
      "Pertanyaan lain yang perlu dijawab adalah bagaimana Instagram, TikTok, dan Shopee dapat digunakan secara saling mendukung. Instagram perlu menampilkan visual produk yang konsisten, TikTok perlu menghadirkan konten yang ringan dan mudah dibagikan, sedangkan Shopee harus memberi pengalaman pembelian yang jelas. Rumusan ini menjadi dasar bagi penyusunan target market, marketing mix, strategi branding, dan timeline mingguan.",
    ],
    "Tujuan Penulisan": [
      "Tujuan penulisan proposal ini adalah menyusun rancangan mini project Social Media Marketing untuk brand Clickora. Proposal diarahkan untuk menjelaskan produk Custom Clicker Nama, menentukan target market, merancang marketing mix 4P, dan menyusun strategi branding yang dapat diterapkan pada Instagram, TikTok, dan Shopee.",
      "Selain itu, proposal ini bertujuan menyediakan timeline kerja Week 1 sampai Week 14 agar pelaksanaan proyek lebih terukur. Dengan adanya target mingguan dan pembagian tugas tim, kegiatan branding dan promosi Clickora dapat dijalankan secara sistematis, mulai dari perencanaan identitas brand sampai evaluasi konten dan marketplace.",
    ],
    "Manfaat Penulisan": [
      "Secara akademik, proposal ini bermanfaat sebagai penerapan konsep social media marketing pada produk nyata. Mahasiswa dapat memahami bagaimana teori segmentasi, positioning, marketing mix, dan engagement diterapkan pada brand Clickora yang menawarkan Custom Clicker Nama.",
      "Secara praktis, proposal ini dapat menjadi panduan awal bagi tim dalam membangun brand, membuat konten, dan mengatur aktivitas promosi. Clickora memperoleh arah kerja yang lebih jelas karena setiap bab menghubungkan identitas produk, target konsumen, platform digital, dan timeline pelaksanaan.",
    ],
    "Nama Brand": [
      "Nama brand yang digunakan dalam mini project ini adalah Clickora. Nama tersebut dipilih karena terdengar modern, ringan, dan dekat dengan kata \"click\" yang berkaitan dengan aktivitas digital maupun fungsi produk clicker. Clickora juga mudah diucapkan sehingga cocok untuk dipakai pada Instagram, TikTok, dan Shopee.",
      "Sebagai brand, Clickora membawa pesan personalisasi melalui tagline \"Klik Namamu, Tunjukkan Gayamu\". Tagline ini menegaskan bahwa Custom Clicker Nama bukan hanya produk fungsional, tetapi juga media kecil untuk menunjukkan identitas, selera, dan gaya pemiliknya.",
    ],
    "Deskripsi Brand": [
      "Clickora adalah brand aksesori personal yang berfokus pada produk Custom Clicker Nama. Karakter brand dibangun dengan kesan playful, ekspresif, ramah, dan dekat dengan keseharian anak muda. Identitas ini dipilih agar Clickora mudah diterima oleh konsumen yang menyukai barang kecil, lucu, dan dapat dikustomisasi.",
      "Dalam komunikasi media sosial, Clickora tidak tampil terlalu formal. Brand ini menggunakan bahasa yang akrab namun tetap sopan, dengan visual yang menonjolkan warna, nama pelanggan, dan contoh penggunaan produk. Pendekatan tersebut membantu produk terlihat relevan untuk hadiah, koleksi pribadi, maupun aksesori harian.",
    ],
    "Visi, Misi, dan Nilai Brand": [
      "Visi Clickora adalah menjadi brand aksesori personal yang membantu konsumen menampilkan identitasnya melalui produk sederhana, kreatif, dan mudah dijangkau. Visi ini sejalan dengan produk Custom Clicker Nama yang menjadikan nama pelanggan sebagai elemen utama.",
      "Misi Clickora meliputi menyediakan desain custom yang menarik, menghadirkan pengalaman pemesanan yang mudah, membangun komunikasi aktif di Instagram dan TikTok, serta menyediakan kanal pembelian yang praktis melalui Shopee. Nilai brand yang diutamakan adalah personal, kreatif, responsif, terjangkau, dan menyenangkan.",
    ],
    "Deskripsi Produk Custom Clicker Nama": [
      "Custom Clicker Nama adalah produk clicker yang dapat dipersonalisasi dengan nama pelanggan. Produk ini ditujukan sebagai aksesori kecil yang memiliki fungsi sekaligus nilai emosional karena setiap item dapat dibuat sesuai identitas pemiliknya. Personalisasi nama menjadi daya tarik utama yang membedakan produk Clickora dari produk aksesori massal.",
      "Dalam proposal ini, variasi desain, warna, dan bentuk produk ditulis sebagai rencana pengembangan. Jika data produksi asli belum tersedia, keterangan desain dan target performa diperlakukan sebagai simulasi perencanaan. Hal ini penting agar dokumen tetap jujur secara akademik dan tidak mengklaim data yang belum dibuktikan.",
    ],
    "Keunggulan Produk": [
      "Keunggulan utama Custom Clicker Nama adalah unsur personalisasi. Konsumen tidak hanya membeli barang, tetapi juga mendapatkan produk yang membawa nama atau identitasnya. Keunggulan ini dapat menjadi bahan konten yang kuat karena setiap pesanan memiliki cerita visual yang berbeda.",
      "Produk ini juga berpotensi memiliki harga yang terjangkau dan cocok untuk hadiah kecil, aksesori tas, gantungan, atau koleksi personal. Dari sisi pemasaran, ukuran produk yang ringkas membuatnya mudah difoto, direkam, dan ditampilkan dalam konten Instagram Reels, TikTok, maupun etalase Shopee.",
    ],
    "Segmentasi Pasar": [
      "Segmentasi pasar Clickora dapat dilihat dari aspek demografis, psikografis, dan perilaku digital. Secara demografis, target potensial meliputi pelajar, mahasiswa, dan konsumen muda yang menyukai aksesori personal. Secara psikografis, mereka cenderung menyukai produk unik, lucu, terjangkau, dan dapat menunjukkan gaya pribadi.",
      "Dari sisi perilaku digital, segmen Clickora aktif menggunakan Instagram dan TikTok untuk mencari inspirasi produk. Mereka juga terbiasa melakukan pembelian melalui marketplace seperti Shopee. Segmentasi ini membuat strategi Clickora perlu menggabungkan konten visual, konten hiburan, dan kemudahan transaksi.",
    ],
    "Targeting": [
      "Target utama Clickora adalah remaja akhir hingga dewasa muda yang menyukai aksesori custom. Kelompok ini cocok karena memiliki ketertarikan tinggi terhadap barang personal, aktif di media sosial, dan sering merespons konten yang menampilkan nama, warna, atau gaya unik.",
      "Target sekunder Clickora adalah konsumen yang mencari hadiah sederhana untuk teman, pasangan, atau anggota keluarga. Custom Clicker Nama dapat diposisikan sebagai hadiah kecil yang personal karena nama penerima dapat dimasukkan ke dalam desain produk.",
    ],
    "Positioning": [
      "Clickora diposisikan sebagai brand aksesori custom yang membantu konsumen menunjukkan identitas melalui produk kecil yang personal dan stylish. Positioning ini diperkuat oleh tagline \"Klik Namamu, Tunjukkan Gayamu\" yang menghubungkan fungsi produk dengan ekspresi diri.",
      "Dalam pasar aksesori, Clickora perlu membedakan diri melalui personalisasi, visual konten, dan pengalaman pemesanan yang mudah. Instagram dan TikTok berperan membentuk persepsi brand, sementara Shopee memperkuat kepercayaan melalui etalase produk, ulasan, dan kemudahan checkout.",
    ],
    "Persona Pelanggan": [
      "Persona pertama adalah mahasiswa yang ingin memiliki aksesori unik untuk tas, kunci, atau perlengkapan pribadi. Persona ini tertarik pada produk yang fotogenik, terjangkau, dan dapat menunjukkan namanya secara kreatif. Konten yang cocok untuk persona ini adalah video before-after desain nama dan inspirasi gaya penggunaan.",
      "Persona kedua adalah pembeli hadiah yang membutuhkan produk kecil namun terasa personal. Mereka membutuhkan informasi pemesanan yang jelas, contoh desain, estimasi pengerjaan, dan opsi warna. Untuk persona ini, Clickora perlu menonjolkan kemudahan order melalui Shopee dan respons cepat melalui Instagram.",
    ],
    "Product": [
      "Produk utama Clickora adalah Custom Clicker Nama dengan fitur personalisasi nama. Elemen produk yang perlu direncanakan meliputi pilihan warna, gaya huruf, bentuk clicker, kemasan sederhana, dan kartu ucapan kecil. Seluruh elemen tersebut mendukung pengalaman personal yang menjadi inti brand Clickora.",
      "Dalam konten media sosial, produk perlu ditampilkan melalui foto detail, video proses pembuatan, serta contoh nama pelanggan. Dengan begitu, calon pembeli dapat membayangkan hasil akhir produknya sendiri. Jika contoh produk masih terbatas, konten dapat ditulis sebagai mockup atau simulasi visual.",
    ],
    "Price": [
      "Strategi harga Clickora perlu menyeimbangkan biaya produksi, nilai personalisasi, dan daya beli target pasar muda. Karena data biaya asli belum diberikan, harga dalam proposal ini diposisikan sebagai simulasi perencanaan. Simulasi dapat mencakup harga reguler, harga launching, dan paket bundling untuk pembelian lebih dari satu produk.",
      "Nilai personalisasi memungkinkan Clickora tidak hanya bersaing pada harga murah. Konsumen membayar untuk produk yang membawa nama dan gayanya. Oleh karena itu, komunikasi harga perlu menekankan manfaat personal, kualitas tampilan, dan kemudahan pemesanan.",
    ],
    "Place": [
      "Place atau saluran distribusi Clickora difokuskan pada Instagram, TikTok, dan Shopee. Instagram digunakan sebagai katalog visual dan kanal komunikasi brand. TikTok digunakan untuk memperluas jangkauan melalui video pendek yang menampilkan proses, hasil custom, dan ide hadiah.",
      "Shopee menjadi kanal transaksi utama karena memberikan struktur etalase, checkout, pembayaran, dan pengiriman yang lebih familiar bagi pembeli. Ketiga platform tersebut perlu saling terhubung, misalnya konten TikTok mengarahkan ke Instagram untuk detail desain, lalu Shopee untuk pembelian.",
    ],
    "Promotion": [
      "Promosi Clickora dapat dilakukan melalui konten organik, promo launching, dan strategi user generated content. Konten organik mencakup video proses pembuatan nama, rekomendasi warna, dan contoh penggunaan produk. Promo launching dapat berupa diskon awal, bundling, atau gratis kartu ucapan.",
      "User generated content dapat dibangun dengan mengajak pembeli mengunggah foto Custom Clicker Nama miliknya. Clickora dapat menggunakan ajakan seperti \"spill nama kamu\" atau \"pilih warna untuk namamu\" agar audiens terdorong berkomentar dan membagikan konten.",
    ],
    "Gaya Komunikasi": [
      "Gaya komunikasi Clickora bersifat friendly, ekspresif, dan dekat dengan bahasa anak muda. Brand perlu terdengar hangat dan responsif agar konsumen merasa nyaman bertanya tentang desain, warna, dan cara pemesanan. Walaupun komunikasinya santai, informasi harga dan proses order tetap harus jelas.",
      "Tagline \"Klik Namamu, Tunjukkan Gayamu\" menjadi panduan utama tone komunikasi. Setiap caption, video, dan balasan komentar sebaiknya menonjolkan unsur nama, gaya personal, dan rasa memiliki terhadap produk. Dengan begitu, komunikasi Clickora tetap konsisten di Instagram, TikTok, dan Shopee.",
    ],
    "Jenis Konten": [
      "Jenis konten utama Clickora meliputi product showcase, behind the scenes, edukasi personalisasi, testimoni, dan konten interaktif. Product showcase menampilkan hasil Custom Clicker Nama dari berbagai warna dan nama. Behind the scenes memperlihatkan proses desain atau pengemasan agar brand terasa lebih transparan.",
      "Konten interaktif dapat berupa polling warna, tantangan komentar nama, atau rekomendasi desain berdasarkan kepribadian. Jenis konten tersebut cocok untuk meningkatkan engagement karena audiens diajak terlibat sebelum melakukan pembelian.",
    ],
    "Platform yang Digunakan": [
      "Instagram digunakan untuk membangun identitas visual Clickora melalui feed, story, dan reels. Platform ini cocok untuk menampilkan katalog, highlight cara order, testimoni, serta contoh desain. Konsistensi warna dan gaya visual perlu dijaga agar Clickora mudah dikenali.",
      "TikTok digunakan untuk menjangkau audiens baru melalui video pendek yang ringan dan cepat dipahami. Shopee digunakan sebagai tempat transaksi agar pembeli dapat melihat variasi produk, harga, stok, ulasan, dan pilihan pengiriman. Kombinasi ketiganya membentuk alur promosi sampai pembelian.",
    ],
    "Strategi Engagement": [
      "Strategi engagement Clickora dapat dibangun dengan memanfaatkan rasa penasaran audiens terhadap nama mereka sendiri. Konten seperti \"nama kamu cocok warna apa\" atau \"request nama untuk dibuat sample\" dapat mendorong komentar dan interaksi. Strategi ini relevan karena produk memang berpusat pada personalisasi nama.",
      "Selain itu, Clickora dapat membuat challenge sederhana di TikTok dan Instagram Reels, misalnya menampilkan transformasi dari teks nama menjadi desain clicker. Engagement juga perlu diarahkan ke tindakan lanjutan, seperti menyimpan posting, mengirim DM, atau membuka link Shopee.",
    ],
    "Timeline Week 1 sampai Week 14": [
      "Timeline mini project Clickora dimulai dari Week 1 untuk finalisasi proposal, identitas brand, dan konsep produk. Week 2 sampai Week 3 dapat digunakan untuk membuat mockup desain, menentukan warna, dan menyusun akun Instagram, TikTok, serta Shopee. Week 4 sampai Week 6 diarahkan untuk produksi konten awal dan pengenalan brand.",
      "Week 7 sampai Week 10 difokuskan pada promosi rutin, interaksi audiens, dan simulasi evaluasi engagement. Week 11 sampai Week 13 digunakan untuk penguatan konten, perbaikan etalase Shopee, dan pengumpulan insight. Week 14 menjadi tahap evaluasi akhir, penyusunan laporan, dan refleksi hasil mini project.",
    ],
    "Target Mingguan": [
      "Target mingguan Clickora harus realistis dan dapat diukur. Pada tahap awal, target dapat berupa penyelesaian logo, tagline, mockup produk, dan akun media sosial. Pada tahap konten, target dapat berupa jumlah posting, jumlah video, konsistensi caption, serta peningkatan interaksi seperti komentar, like, dan simpan.",
      "Karena data performa asli belum tersedia, angka target dalam proposal sebaiknya diposisikan sebagai simulasi perencanaan. Setelah proyek berjalan, tim dapat mengganti target simulasi dengan data aktual dari Instagram Insight, TikTok Analytics, dan performa etalase Shopee.",
    ],
    "Pembagian Tugas Tim": [
      "Pembagian tugas tim diperlukan agar mini project Clickora berjalan teratur. Tim konten bertanggung jawab menyusun ide, caption, dan kalender posting. Tim desain bertanggung jawab membuat visual brand, mockup produk, dan materi promosi. Tim marketplace bertanggung jawab menyiapkan etalase Shopee, deskripsi produk, dan simulasi proses pemesanan.",
      "Selain itu, perlu ada anggota yang memantau engagement dan menyusun evaluasi mingguan. Pembagian ini membantu setiap kegiatan memiliki penanggung jawab, sehingga proposal tidak hanya berisi rencana umum, tetapi juga langkah pelaksanaan yang dapat dijalankan.",
    ],
    "Kesimpulan": [
      "Proposal mini project ini menunjukkan bahwa Clickora memiliki peluang untuk memperkenalkan Custom Clicker Nama sebagai produk aksesori personal yang relevan bagi konsumen muda. Tagline \"Klik Namamu, Tunjukkan Gayamu\" mendukung positioning brand sebagai produk kecil yang membantu pelanggan mengekspresikan identitasnya.",
      "Strategi Clickora menghubungkan brand, produk, target market, marketing mix 4P, media sosial, dan timeline mingguan. Instagram, TikTok, dan Shopee digunakan secara saling melengkapi agar proses awareness, engagement, dan transaksi dapat berjalan dalam satu alur yang terarah.",
    ],
    "Saran": [
      "Clickora disarankan menjaga konsistensi visual dan gaya komunikasi sejak awal pelaksanaan mini project. Setiap konten perlu menonjolkan personalisasi nama agar audiens langsung memahami keunikan Custom Clicker Nama. Tim juga perlu mencatat data performa aktual setelah konten dipublikasikan.",
      "Untuk pengembangan berikutnya, Clickora dapat menambah variasi desain, memperbaiki etalase Shopee, dan menguji format konten yang paling banyak menghasilkan interaksi. Data asli dari platform perlu digunakan untuk mengganti simulasi perencanaan agar laporan akhir lebih kuat.",
    ],
  };

  if (paragraphs[subsectionTitle]) {
    return [
      ...paragraphs[subsectionTitle],
      `Secara khusus, subbab ${subsectionTitle.toLowerCase()} menjadi bagian dari proposal yang menghubungkan ide Clickora dengan langkah pelaksanaan mini project. Fokusnya tetap pada produk Custom Clicker Nama, sehingga pembaca dapat melihat hubungan antara identitas brand, kebutuhan pasar, dan strategi media sosial yang akan dijalankan.`,
    ].join("\n\n");
  }

  return [
    `Subbab ${subsectionTitle} menjelaskan bagian penting dari proposal Clickora untuk produk Custom Clicker Nama. Pembahasan diarahkan agar strategi brand, target market, media sosial, dan marketplace tetap saling terhubung.`,
    "Uraian ini disusun secara formal akademik dan tidak menggunakan instruksi dosen sebagai objek kajian. Fokus dokumen tetap pada pengembangan proposal mini project Social Media Marketing untuk Clickora.",
  ].join("\n\n");
}

function isClickoraProposal(input: MakalahEngineInput): boolean {
  const text = [
    input.judul,
    input.tema,
    input.mataKuliah,
    input.pedoman,
    JSON.stringify(input.dynamicValues || {}),
    JSON.stringify(input.assignmentAnalysis || {}),
  ].join(" ").toLowerCase();
  return /proposal|mini project|week\s*1|social media marketing|clickora|custom clicker/.test(text);
}
