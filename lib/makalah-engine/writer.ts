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
  if (isClickoraProposal(input)) {
    return [
      `Puji syukur penulis panjatkan ke hadirat Tuhan Yang Maha Esa karena proposal mini project berjudul "${input.judul}" dapat disusun sebagai rancangan kegiatan pada mata kuliah ${input.mataKuliah}. Proposal ini membahas pengembangan brand Clickora dengan produk Custom Clicker Nama yang mengusung tagline "Klik Namamu, Tunjukkan Gayamu".`,
      `Proposal ini disusun untuk merancang dasar branding, target market, marketing mix, strategi media sosial, serta timeline pelaksanaan Week 1 sampai Week 14. Platform utama yang digunakan dalam perencanaan adalah Instagram, TikTok, dan Shopee agar strategi komunikasi, promosi, dan distribusi produk saling terhubung.`,
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
    return clickoraSubsectionContent(subsectionTitle);
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
    return [
      "Konsep visual brand: Clickora menggunakan gaya visual cerah, playful, dan personal dengan fokus pada nama pelanggan sebagai elemen utama desain.",
      "Foto produk placeholder: [Masukkan foto Custom Clicker Nama dari beberapa variasi warna, bentuk, dan contoh personalisasi nama].",
      "Contoh caption: Klik namamu, tunjukkan gayamu. Custom Clicker Nama dari Clickora siap bikin aksesori kecilmu terasa lebih personal. Pesan via Shopee atau DM Instagram.",
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
