/**
 * Opening Paragraph Engine — selects a contextual academic opening for BAB I.
 *
 * Rules:
 * - Never start with "Di era…", "Pada saat ini…", "Dalam perkembangan…"
 * - Selection is based on research variables + jenisUsaha context
 * - Uses seeded determinism so the same research always produces the same opening
 * - 18 distinct templates across 9 categories to avoid template feeling
 */

export type OpeningCategory =
  | "digital_media"
  | "influencer"
  | "price"
  | "quality_product"
  | "quality_service"
  | "brand"
  | "distribution"
  | "consumer_decision"
  | "general";

// ─── 18 Opening Templates ──────────────────────────────────────────────────────

const OPENINGS: Record<OpeningCategory, string[]> = {
  digital_media: [
    (usaha: string) =>
      `Pertumbuhan pengguna internet dan media sosial di Indonesia terus meningkat secara signifikan dari tahun ke tahun. ` +
      `Data Asosiasi Penyelenggara Jasa Internet Indonesia (APJII) menunjukkan bahwa penetrasi internet di Indonesia ` +
      `telah mencapai lebih dari 78 persen penduduk, sehingga aktivitas konsumen dalam mencari informasi dan membuat ` +
      `keputusan pembelian semakin banyak dilakukan melalui platform digital. Kondisi ini menciptakan peluang strategis ` +
      `bagi pelaku usaha di bidang ${usaha || "pemasaran"} untuk mengoptimalkan kehadiran digitalnya dalam menjangkau ` +
      `konsumen yang lebih luas (Chaffey & Ellis-Chadwick, 2022).`,

    (usaha: string) =>
      `Transformasi perilaku konsumen yang dipicu oleh meluasnya penggunaan platform media sosial telah mengubah ` +
      `lanskap persaingan bisnis secara fundamental. Konsumen kini memiliki akses yang lebih mudah terhadap informasi ` +
      `produk, ulasan pengguna, dan perbandingan harga sebelum melakukan pembelian. Fenomena ini mendorong pelaku ` +
      `usaha di bidang ${usaha || "pemasaran"} untuk merancang strategi komunikasi yang lebih adaptif dan responsif ` +
      `terhadap kebiasaan konsumen di ruang digital (Kaplan & Haenlein, 2022).`,

    (usaha: string) =>
      `Kemajuan teknologi informasi yang berlangsung pesat telah membuka babak baru dalam aktivitas pemasaran di Indonesia. ` +
      `Platform media sosial seperti Instagram, TikTok, dan YouTube kini menjadi arena utama bagi konsumen untuk ` +
      `menemukan dan mengevaluasi produk sebelum memutuskan pembelian. Bagi pelaku usaha di bidang ` +
      `${usaha || "pemasaran"}, kemampuan untuk memanfaatkan kanal digital secara efektif menjadi salah satu ` +
      `keunggulan kompetitif yang menentukan keberlangsungan usaha (Kotler et al., 2022).`,
  ] as unknown as string[],

  influencer: [
    (usaha: string) =>
      `Praktik pemasaran melalui figur berpengaruh di media sosial atau yang dikenal sebagai influencer marketing ` +
      `telah berkembang menjadi salah satu strategi yang paling banyak diadopsi oleh pelaku usaha dalam beberapa ` +
      `tahun terakhir. Konsumen menunjukkan kecenderungan yang lebih tinggi untuk mempercayai rekomendasi dari ` +
      `individu yang mereka ikuti di media sosial dibandingkan dengan iklan konvensional. Hal ini menjadikan ` +
      `influencer marketing sebagai instrumen pemasaran yang efektif bagi pelaku usaha di bidang ` +
      `${usaha || "pemasaran"} untuk meningkatkan jangkauan dan daya tarik produknya (Shimp & Andrews, 2023).`,

    (usaha: string) =>
      `Pergeseran kepercayaan konsumen dari media konvensional menuju rekomendasi berbasis komunitas digital ` +
      `menjadi fenomena yang semakin terasa dalam perilaku belanja masyarakat Indonesia. Peran kreator konten ` +
      `dan opinion leader di platform digital dalam membentuk persepsi konsumen terhadap suatu produk atau ` +
      `merek tidak dapat lagi diabaikan oleh pelaku usaha. Kondisi ini mendorong pelaku usaha di bidang ` +
      `${usaha || "pemasaran"} untuk mengintegrasikan strategi endorsement digital sebagai bagian dari ` +
      `rencana pemasaran yang komprehensif (Kotler et al., 2022).`,
  ] as unknown as string[],

  price: [
    (usaha: string) =>
      `Keterbukaan informasi yang semakin meluas memberi konsumen kemampuan untuk membandingkan harga produk ` +
      `dari berbagai penyedia secara lebih mudah dan cepat. Dalam konteks persaingan usaha yang semakin ketat, ` +
      `penetapan harga yang kompetitif bukan lagi sekadar keunggulan, melainkan prasyarat agar suatu usaha ` +
      `dapat bertahan dan berkembang. Pelaku usaha di bidang ${usaha || "pemasaran"} dituntut untuk merancang ` +
      `strategi penetapan harga yang mampu memberikan nilai terbaik bagi konsumen sekaligus menjaga ` +
      `profitabilitas perusahaan (Tjiptono & Chandra, 2022).`,

    (usaha: string) =>
      `Sensitivitas konsumen terhadap harga merupakan salah satu faktor paling berpengaruh dalam proses ` +
      `pengambilan keputusan pembelian. Harga tidak semata-mata mencerminkan biaya produksi, melainkan juga ` +
      `persepsi nilai yang dirasakan oleh konsumen terhadap produk atau jasa yang ditawarkan. Dalam lingkungan ` +
      `persaingan yang semakin intens, kemampuan pelaku usaha di bidang ${usaha || "pemasaran"} untuk ` +
      `mengelola kebijakan harga secara cermat menjadi kunci dalam mempertahankan pangsa pasar ` +
      `(Kotler & Armstrong, 2021).`,
  ] as unknown as string[],

  quality_product: [
    (usaha: string) =>
      `Meningkatnya daya kritis konsumen dalam mengevaluasi produk sebelum melakukan pembelian menempatkan ` +
      `kualitas sebagai salah satu dimensi paling utama yang dipertimbangkan. Konsumen tidak lagi memandang ` +
      `harga sebagai satu-satunya acuan dalam menilai kelayakan suatu produk, melainkan memberikan perhatian ` +
      `yang sama besarnya terhadap performa, keandalan, dan daya tahan produk tersebut. Tantangan ini menuntut ` +
      `pelaku usaha di bidang ${usaha || "industri"} untuk menjadikan standar kualitas sebagai fondasi ` +
      `utama dalam setiap proses produksi (Kotler & Armstrong, 2021).`,

    (usaha: string) =>
      `Konsistensi kualitas produk menjadi faktor pembeda yang signifikan di tengah pasar yang semakin ` +
      `dipenuhi oleh pilihan produk serupa. Konsumen yang merasa puas terhadap kualitas suatu produk ` +
      `cenderung untuk melakukan pembelian ulang dan merekomendasikannya kepada orang-orang di sekitarnya. ` +
      `Dalam hal ini, pelaku usaha di bidang ${usaha || "industri"} memiliki tanggung jawab untuk ` +
      `memastikan bahwa standar kualitas yang dijanjikan dapat terpenuhi secara konsisten pada ` +
      `setiap unit produk yang dihasilkan (Kotler & Keller, 2022).`,
  ] as unknown as string[],

  quality_service: [
    (usaha: string) =>
      `Kualitas pelayanan menjadi salah satu dimensi yang paling langsung dirasakan oleh konsumen ` +
      `dalam setiap interaksi dengan perusahaan. Pengalaman pelayanan yang memuaskan tidak hanya ` +
      `mendorong konsumen untuk kembali, tetapi juga menciptakan efek berantai melalui rekomendasi ` +
      `dari mulut ke mulut. Bagi pelaku usaha di bidang ${usaha || "jasa"}, peningkatan standar ` +
      `pelayanan secara berkelanjutan merupakan investasi strategis yang berdampak langsung terhadap ` +
      `pertumbuhan bisnis jangka panjang (Parasuraman et al., 2022).`,

    (usaha: string) =>
      `Persaingan dalam industri jasa yang semakin kompetitif menempatkan kualitas pelayanan sebagai ` +
      `variabel kritis dalam membangun keunggulan bersaing. Konsumen saat ini memiliki ekspektasi ` +
      `yang semakin tinggi terhadap responsivitas, keandalan, dan empati yang ditunjukkan oleh ` +
      `penyedia jasa dalam melayani kebutuhan mereka. Pelaku usaha di bidang ${usaha || "jasa"} ` +
      `yang mampu secara konsisten memenuhi atau melampaui ekspektasi tersebut akan memiliki posisi ` +
      `yang lebih kuat dalam mempertahankan loyalitas konsumen (Zeithaml et al., 2022).`,
  ] as unknown as string[],

  brand: [
    (usaha: string) =>
      `Citra merek yang kuat merupakan aset tak berwujud yang memberikan keunggulan kompetitif ` +
      `berkelanjutan bagi perusahaan. Konsumen yang memiliki asosiasi positif terhadap suatu merek ` +
      `cenderung lebih mudah menerima dan mempercayai produk baru yang dikeluarkan oleh merek tersebut. ` +
      `Bagi pelaku usaha di bidang ${usaha || "pemasaran"}, pengelolaan identitas dan reputasi merek ` +
      `secara strategis menjadi bagian yang tidak terpisahkan dari upaya membangun pangsa pasar ` +
      `yang berkelanjutan (Aaker, 2022).`,

    (usaha: string) =>
      `Pembentukan persepsi konsumen terhadap suatu merek terjadi melalui akumulasi pengalaman, ` +
      `informasi, dan interaksi yang berlangsung dalam jangka waktu tertentu. Merek yang berhasil ` +
      `membangun keterikatan emosional dengan konsumennya tidak hanya memperoleh loyalitas pembelian, ` +
      `tetapi juga mendapatkan advokasi organik yang berdampak positif terhadap pertumbuhan bisnis. ` +
      `Kondisi ini mendorong pelaku usaha di bidang ${usaha || "pemasaran"} untuk menjadikan ` +
      `penguatan merek sebagai prioritas dalam agenda strategisnya (Aaker, 2022).`,
  ] as unknown as string[],

  distribution: [
    (usaha: string) =>
      `Ketersediaan produk di tempat dan waktu yang tepat menjadi salah satu penentu utama kepuasan ` +
      `konsumen dan keberhasilan penjualan. Sistem distribusi yang efisien memastikan bahwa produk ` +
      `dapat menjangkau konsumen dengan cara yang paling mudah dan nyaman, baik melalui saluran ` +
      `fisik maupun digital. Pelaku usaha di bidang ${usaha || "pemasaran"} yang mampu mengelola ` +
      `rantai distribusinya dengan baik akan memiliki keunggulan dalam memenuhi permintaan pasar ` +
      `secara lebih responsif (Tjiptono, 2021).`,
  ] as unknown as string[],

  consumer_decision: [
    (usaha: string) =>
      `Proses pengambilan keputusan konsumen merupakan fenomena yang kompleks dan dipengaruhi oleh ` +
      `berbagai faktor, mulai dari stimulus pemasaran, persepsi kualitas, hingga pengaruh sosial dari ` +
      `kelompok referensi. Memahami pola keputusan konsumen dengan tepat menjadi kunci bagi pelaku ` +
      `usaha dalam merancang strategi pemasaran yang efektif dan tepat sasaran. Dalam industri ` +
      `${usaha || "pemasaran"}, pemahaman mendalam tentang faktor-faktor yang memengaruhi keputusan ` +
      `konsumen menjadi landasan penting dalam mengembangkan pendekatan bisnis yang kompetitif ` +
      `(Schiffman & Kanuk, 2022).`,

    (usaha: string) =>
      `Dinamika perilaku konsumen yang terus berkembang seiring perubahan sosial, teknologi, dan ` +
      `ekonomi menjadikan pemahaman tentang faktor-faktor penentu keputusan pembelian sebagai ` +
      `kebutuhan yang mendesak bagi setiap pelaku usaha. Konsumen saat ini tidak hanya mempertimbangkan ` +
      `manfaat fungsional produk, tetapi juga aspek pengalaman, nilai sosial, dan kepercayaan terhadap ` +
      `penyedia produk atau jasa. Fenomena ini mendorong pelaku usaha di bidang ` +
      `${usaha || "pemasaran"} untuk terus beradaptasi dalam memenuhi ekspektasi konsumen yang ` +
      `semakin beragam (Engel et al., 2021).`,
  ] as unknown as string[],

  general: [
    (usaha: string) =>
      `Keberhasilan suatu usaha dalam mempertahankan dan meningkatkan kinerja bisnisnya sangat ` +
      `ditentukan oleh kemampuannya dalam memahami dan merespons kebutuhan konsumen secara tepat. ` +
      `Persaingan yang semakin ketat di berbagai sektor industri mendorong setiap pelaku usaha ` +
      `untuk terus melakukan evaluasi dan inovasi dalam strategi pemasarannya. Bagi pelaku usaha ` +
      `di bidang ${usaha || "pemasaran"}, identifikasi faktor-faktor yang secara signifikan ` +
      `mempengaruhi perilaku konsumen menjadi langkah awal yang krusial dalam merancang strategi ` +
      `bisnis yang terukur dan berkelanjutan (Kotler & Keller, 2022).`,

    (usaha: string) =>
      `Perkembangan dunia bisnis yang dinamis menuntut setiap pelaku usaha untuk mampu mengidentifikasi ` +
      `dan memanfaatkan peluang secara strategis. Kemampuan suatu usaha untuk bertahan dan berkembang ` +
      `tidak hanya bergantung pada keunggulan produk yang ditawarkan, tetapi juga pada ketepatan ` +
      `strategi pemasaran yang diterapkan dalam menjangkau dan mempertahankan konsumennya. Oleh karena ` +
      `itu, kajian mendalam mengenai faktor-faktor yang mempengaruhi perilaku konsumen di bidang ` +
      `${usaha || "pemasaran"} menjadi topik penelitian yang relevan dan memiliki nilai praktis ` +
      `yang tinggi bagi pengembangan ilmu manajemen pemasaran (Kotler & Armstrong, 2021).`,

    (usaha: string) =>
      `Kelangsungan usaha dalam jangka panjang tidak dapat dipisahkan dari kemampuan perusahaan ` +
      `dalam membangun hubungan yang bermakna dengan konsumennya. Strategi pemasaran yang tepat ` +
      `berperan sebagai jembatan yang menghubungkan nilai-nilai yang ditawarkan perusahaan dengan ` +
      `kebutuhan dan keinginan konsumen di pasar. Dalam konteks ${usaha || "pemasaran"} yang ` +
      `semakin kompetitif, penelitian yang mengkaji faktor-faktor penentu keberhasilan pemasaran ` +
      `memiliki relevansi yang tinggi baik bagi akademisi maupun bagi praktisi bisnis ` +
      `(Tjiptono, 2021).`,
  ] as unknown as string[],
};

// ─── Category Detector ────────────────────────────────────────────────────────

export function detectOpeningCategory(x1: string, x2: string, y: string): OpeningCategory {
  const t = `${x1} ${x2} ${y}`.toLowerCase();

  if (/influencer|brand.?ambassador|endorser|kreator|konten/.test(t)) return "influencer";
  if (/media.?sosial|instagram|tiktok|youtube|digital.?marketing|online/.test(t)) return "digital_media";
  if (/harga|price|diskon|tarif|pricing/.test(t)) return "price";
  if (/kualitas.?produk|mutu.?produk|product.?quality/.test(t)) return "quality_product";
  if (/kualitas.?layanan|pelayanan|service.?quality|kepuasan/.test(t)) return "quality_service";
  if (/brand|merek|citra|ekuitas|loyalitas/.test(t)) return "brand";
  if (/distribusi|saluran|tempat|place|logistik/.test(t)) return "distribution";
  if (/keputusan.?pembelian|minat.?beli|purchase/.test(t)) return "consumer_decision";
  return "general";
}

// ─── Seeded Selection ────────────────────────────────────────────────────────

/** Deterministic "hash" so same inputs always pick same template variant. */
function seedIndex(x1: string, x2: string, y: string, len: number): number {
  let h = 0;
  for (const ch of `${x1}${x2}${y}`) {
    h = ((h << 5) - h + ch.charCodeAt(0)) | 0;
  }
  return Math.abs(h) % len;
}

// ─── Main Export ─────────────────────────────────────────────────────────────

/**
 * Select a context-appropriate, non-templated opening paragraph for BAB I.
 *
 * @param x1 - First independent variable name
 * @param x2 - Second independent variable name
 * @param y  - Dependent variable name
 * @param jenisUsaha - Type of business
 * @returns A full academic opening paragraph (no AI-style clichés)
 */
export function selectOpening(
  x1: string,
  x2: string,
  y: string,
  jenisUsaha: string
): string {
  const category = detectOpeningCategory(x1, x2, y);
  const pool = OPENINGS[category] as unknown as Array<(u: string) => string>;
  const idx = seedIndex(x1, x2, y, pool.length);
  return pool[idx](jenisUsaha);
}
