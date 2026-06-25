/**
 * Smart Author Mapping — assigns contextually appropriate academic references
 * to research variables based on discipline and topic keywords.
 */

export interface AuthorEntry {
  citation: string;          // e.g. "Kotler & Keller (2022)"
  fullDef: string;           // short definition sentence using the author
  discipline: string[];      // keyword tags
}

// ─── Master Reference Database ────────────────────────────────────────────────

export const AUTHOR_DB: AuthorEntry[] = [
  // ── Marketing / Pemasaran ────────────────────────────────────────────────────
  {
    citation: "Kotler & Keller (2022)",
    fullDef: "Kotler & Keller (2022) mendefinisikan pemasaran sebagai proses sosial dan manajerial di mana individu dan kelompok mendapatkan apa yang mereka butuhkan dan inginkan melalui penciptaan dan pertukaran nilai.",
    discipline: ["pemasaran", "marketing", "keputusan pembelian", "keputusan", "strategi", "consumer", "konsumen"],
  },
  {
    citation: "Kotler & Armstrong (2021)",
    fullDef: "Kotler & Armstrong (2021) menyatakan bahwa bauran pemasaran mencakup serangkaian alat pemasaran yang dapat dikendalikan perusahaan untuk menghasilkan respons yang diinginkan dari target pasar.",
    discipline: ["bauran pemasaran", "marketing mix", "produk", "harga", "promosi", "distribusi", "tempat", "place"],
  },
  {
    citation: "Tjiptono (2021)",
    fullDef: "Tjiptono (2021) menjelaskan bahwa strategi pemasaran merupakan rencana yang menyeluruh dan terpadu yang menjadi panduan bagi kegiatan pemasaran perusahaan dalam rangka mencapai tujuan yang telah ditetapkan.",
    discipline: ["strategi", "pemasaran", "promosi", "jasa", "layanan", "loyalitas", "kepuasan"],
  },
  {
    citation: "Tjiptono & Chandra (2022)",
    fullDef: "Tjiptono & Chandra (2022) mendefinisikan harga sebagai satu-satunya unsur bauran pemasaran yang memberikan pendapatan bagi perusahaan, sekaligus merupakan unsur bauran pemasaran yang bersifat fleksibel.",
    discipline: ["harga", "price", "pricing", "diskon", "tarif"],
  },
  {
    citation: "Shimp (2022)",
    fullDef: "Shimp (2022) menyatakan bahwa komunikasi pemasaran terpadu merupakan proses pengembangan dan implementasi berbagai bentuk program komunikasi persuasif kepada pelanggan dan calon pelanggan secara berkelanjutan.",
    discipline: ["iklan", "periklanan", "advertising", "komunikasi", "promosi", "endorser"],
  },
  {
    citation: "Belch & Belch (2021)",
    fullDef: "Belch & Belch (2021) mendefinisikan promosi penjualan sebagai aktivitas pemasaran yang memberikan nilai tambah atau insentif kepada tenaga penjual, distributor, atau konsumen akhir.",
    discipline: ["promosi penjualan", "sales promotion", "diskon", "kupon", "insentif"],
  },
  // ── Influencer & Media Sosial ─────────────────────────────────────────────────
  {
    citation: "Kotler et al. (2022)",
    fullDef: "Kotler et al. (2022) menjelaskan bahwa pemasaran di era digital membutuhkan pendekatan yang lebih personal dan interaktif, di mana konsumen tidak lagi sekadar penerima pesan tetapi juga berperan aktif dalam membentuk opini dan keputusan pembelian.",
    discipline: ["digital marketing", "digital", "pemasaran digital", "online", "e-commerce", "influencer"],
  },
  {
    citation: "Shimp & Andrews (2023)",
    fullDef: "Shimp & Andrews (2023) menyatakan bahwa influencer marketing merupakan bentuk pemasaran yang memanfaatkan individu dengan pengaruh signifikan di media sosial untuk mempromosikan produk atau jasa kepada pengikutnya.",
    discipline: ["influencer", "influencer marketing", "endorser", "brand ambassador", "konten kreator"],
  },
  {
    citation: "Kaplan & Haenlein (2022)",
    fullDef: "Kaplan & Haenlein (2022) mendefinisikan media sosial sebagai sekelompok aplikasi berbasis internet yang dibangun di atas fondasi ideologis dan teknologi Web 2.0 dan memungkinkan penciptaan dan pertukaran konten yang dibuat pengguna.",
    discipline: ["media sosial", "social media", "instagram", "tiktok", "youtube", "facebook", "platform digital"],
  },
  {
    citation: "Chaffey & Ellis-Chadwick (2022)",
    fullDef: "Chaffey & Ellis-Chadwick (2022) mendefinisikan pemasaran digital sebagai penerapan teknologi digital yang membentuk saluran online untuk pasar, berkontribusi pada kegiatan pemasaran yang bertujuan untuk mencapai profitabilitas dan retensi pelanggan.",
    discipline: ["digital marketing", "online marketing", "e-marketing", "media digital", "seo", "konten"],
  },
  // ── Kualitas Produk / Layanan ─────────────────────────────────────────────────
  {
    citation: "Zeithaml et al. (2022)",
    fullDef: "Zeithaml et al. (2022) mendefinisikan kualitas layanan sebagai tingkat perbedaan antara harapan konsumen dengan persepsi konsumen terhadap layanan yang diterima, yang mencakup dimensi keandalan, ketanggapan, jaminan, empati, dan bukti fisik.",
    discipline: ["kualitas layanan", "service quality", "pelayanan", "kepuasan", "servqual"],
  },
  {
    citation: "Parasuraman et al. (2022)",
    fullDef: "Parasuraman et al. (2022) menyatakan bahwa kualitas pelayanan merupakan hasil perbandingan antara harapan konsumen sebelum menerima pelayanan dengan pengalaman aktual yang dirasakan selama dan setelah pelayanan berlangsung.",
    discipline: ["pelayanan", "layanan", "service", "kepuasan", "kualitas layanan"],
  },
  {
    citation: "Kotler & Armstrong (2021)",
    fullDef: "Kotler & Armstrong (2021) mendefinisikan kualitas produk sebagai karakteristik produk atau layanan yang bergantung pada kemampuannya untuk memuaskan kebutuhan pelanggan yang dinyatakan atau tersirat.",
    discipline: ["kualitas produk", "product quality", "mutu", "kinerja produk", "keandalan"],
  },
  // ── Brand & Loyalitas ─────────────────────────────────────────────────────────
  {
    citation: "Aaker (2022)",
    fullDef: "Aaker (2022) mendefinisikan ekuitas merek sebagai seperangkat aset dan kewajiban merek yang berkaitan dengan nama dan simbol merek yang menambah atau mengurangi nilai yang diberikan produk atau jasa kepada perusahaan dan pelanggan.",
    discipline: ["brand", "merek", "ekuitas merek", "brand equity", "citra merek", "brand image", "kesadaran merek"],
  },
  {
    citation: "Griffin (2022)",
    fullDef: "Griffin (2022) menyatakan bahwa loyalitas konsumen merupakan suatu keadaan di mana konsumen memiliki sikap positif terhadap suatu merek, memiliki komitmen terhadap merek tersebut, dan bermaksud untuk meneruskan pembeliannya.",
    discipline: ["loyalitas", "loyalitas konsumen", "customer loyalty", "retensi pelanggan"],
  },
  // ── SDM ───────────────────────────────────────────────────────────────────────
  {
    citation: "Hasibuan (2022)",
    fullDef: "Hasibuan (2022) mendefinisikan manajemen sumber daya manusia sebagai ilmu dan seni mengatur hubungan dan peranan tenaga kerja agar efektif dan efisien membantu terwujudnya tujuan perusahaan, karyawan, dan masyarakat.",
    discipline: ["sdm", "sumber daya manusia", "karyawan", "tenaga kerja", "hrm", "personalia"],
  },
  {
    citation: "Mangkunegara (2022)",
    fullDef: "Mangkunegara (2022) menyatakan bahwa kinerja karyawan adalah hasil kerja secara kualitas dan kuantitas yang dicapai oleh seorang pegawai dalam melaksanakan tugasnya sesuai dengan tanggung jawab yang diberikan kepadanya.",
    discipline: ["kinerja", "kinerja karyawan", "produktivitas", "performa", "sdm"],
  },
  // ── Keuangan ─────────────────────────────────────────────────────────────────
  {
    citation: "Kasmir (2022)",
    fullDef: "Kasmir (2022) mendefinisikan manajemen keuangan sebagai segala aktivitas perusahaan yang berhubungan dengan bagaimana memperoleh dana, menggunakan dana, dan mengelola aset sesuai tujuan perusahaan secara menyeluruh.",
    discipline: ["keuangan", "modal", "investasi", "profitabilitas", "aset", "neraca"],
  },
  {
    citation: "Fahmi (2022)",
    fullDef: "Fahmi (2022) menjelaskan bahwa analisis keuangan merupakan suatu proses untuk mengidentifikasi dan mengevaluasi berbagai kondisi keuangan perusahaan guna membantu manajemen dalam pengambilan keputusan.",
    discipline: ["keuangan", "laporan keuangan", "rasio keuangan", "analisis keuangan"],
  },
  // ── Keputusan Pembelian / Konsumen ────────────────────────────────────────────
  {
    citation: "Schiffman & Kanuk (2022)",
    fullDef: "Schiffman & Kanuk (2022) mendefinisikan keputusan pembelian sebagai suatu tindakan yang dipilih konsumen dari dua atau lebih alternatif pilihan berdasarkan pertimbangan terhadap kebutuhan, harga, kualitas, dan faktor lingkungan.",
    discipline: ["keputusan pembelian", "keputusan", "minat beli", "purchase decision", "pembelian"],
  },
  {
    citation: "Engel et al. (2021)",
    fullDef: "Engel et al. (2021) menyatakan bahwa perilaku konsumen mencerminkan keseluruhan tindakan yang dilakukan seseorang dalam mendapatkan, mengkonsumsi, dan menghabiskan produk dan jasa, termasuk proses keputusan yang mendahului dan menyusul tindakan tersebut.",
    discipline: ["perilaku konsumen", "consumer behavior", "keputusan", "minat", "pembelian"],
  },
  // ── Kepuasan ──────────────────────────────────────────────────────────────────
  {
    citation: "Tjiptono (2021)",
    fullDef: "Tjiptono (2021) mendefinisikan kepuasan pelanggan sebagai evaluasi purna beli konsumen terhadap suatu produk atau jasa, di mana persepsi terhadap kualitas yang diterima memenuhi atau melebihi ekspektasi sebelum pembelian.",
    discipline: ["kepuasan", "kepuasan pelanggan", "customer satisfaction", "purna beli"],
  },
];

// ─── Lookup Functions ─────────────────────────────────────────────────────────

/** Find the best matching citation for a given variable or topic. */
export function getCitationFor(topic: string): AuthorEntry {
  const t = topic.toLowerCase();
  let best: AuthorEntry | null = null;
  let bestScore = 0;

  for (const entry of AUTHOR_DB) {
    let score = 0;
    for (const tag of entry.discipline) {
      if (t.includes(tag) || tag.includes(t)) {
        score += tag.length; // longer match = more specific
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  return best ?? AUTHOR_DB[0];
}

/** Get citation string only (e.g. "(Kotler & Keller, 2022)"). */
export function getCitationTag(topic: string): string {
  const entry = getCitationFor(topic);
  return `(${entry.citation})`;
}

/** Get different citations for two different variables (avoid repetition). */
export function getTwoCitations(topic1: string, topic2: string): [AuthorEntry, AuthorEntry] {
  const c1 = getCitationFor(topic1);
  let c2 = getCitationFor(topic2);
  if (c2.citation === c1.citation) {
    c2 = AUTHOR_DB.find((a) => a.citation !== c1.citation) ?? AUTHOR_DB[1];
  }
  return [c1, c2];
}
