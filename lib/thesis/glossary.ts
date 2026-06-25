export interface GlossaryTerm {
  term: string;
  kategori: string;
  definisiSederhana: string;
  contoh: string;
}

export const GLOSSARY: GlossaryTerm[] = [
  /* ─── Pemasaran Digital ───────────────────────────────────────────────────── */
  {
    term: "Brand Awareness",
    kategori: "Branding",
    definisiSederhana: "Seberapa banyak orang yang mengenal dan mengingat suatu merek. Semakin tinggi brand awareness, semakin banyak orang kenal merek tersebut.",
    contoh: "Ketika ditanya merek minuman bersoda, kebanyakan orang langsung menjawab Coca-Cola — itu adalah brand awareness yang sangat tinggi.",
  },
  {
    term: "CTR (Click-Through Rate)",
    kategori: "Digital Marketing",
    definisiSederhana: "Persentase orang yang mengklik iklan dibandingkan yang melihat iklan. CTR tinggi berarti iklan menarik dan relevan.",
    contoh: "Dari 1.000 orang yang melihat iklan, 50 orang mengkliknya — berarti CTR-nya 5%.",
  },
  {
    term: "Conversion Rate",
    kategori: "Digital Marketing",
    definisiSederhana: "Persentase pengunjung yang melakukan tindakan yang diinginkan — misalnya membeli, mendaftar, atau mengisi formulir.",
    contoh: "Dari 100 pengunjung toko online, 10 orang benar-benar membeli — berarti conversion rate-nya 10%.",
  },
  {
    term: "Engagement",
    kategori: "Social Media",
    definisiSederhana: "Tingkat interaksi pengguna dengan konten di media sosial — termasuk like, komentar, share, dan save.",
    contoh: "Postingan yang mendapat 500 like, 100 komentar, dan 200 share memiliki engagement yang tinggi.",
  },
  {
    term: "Reach",
    kategori: "Social Media",
    definisiSederhana: "Jumlah orang unik yang melihat suatu konten atau iklan. Berbeda dengan impressions yang bisa dihitung berkali-kali untuk satu orang.",
    contoh: "Postingan dilihat oleh 5.000 orang unik — berarti reach-nya 5.000.",
  },
  {
    term: "Impressions",
    kategori: "Digital Marketing",
    definisiSederhana: "Total berapa kali suatu konten atau iklan ditampilkan, termasuk jika satu orang melihatnya beberapa kali.",
    contoh: "Satu iklan dilihat 10.000 kali, meskipun hanya 3.000 orang unik yang melihatnya.",
  },
  {
    term: "ROI (Return on Investment)",
    kategori: "Bisnis",
    definisiSederhana: "Perbandingan antara keuntungan yang didapat dengan biaya yang dikeluarkan. ROI positif berarti investasi menguntungkan.",
    contoh: "Keluar biaya iklan Rp 1.000.000, dapat penjualan Rp 5.000.000 — ROI = 400%.",
  },
  {
    term: "Influencer",
    kategori: "Social Media",
    definisiSederhana: "Seseorang yang memiliki banyak pengikut di media sosial dan mampu mempengaruhi opini atau keputusan pembelian pengikutnya.",
    contoh: "Seorang YouTuber dengan 500.000 subscriber yang merekomendasikan suatu produk.",
  },
  {
    term: "Micro-influencer",
    kategori: "Social Media",
    definisiSederhana: "Influencer dengan jumlah pengikut yang relatif kecil (biasanya 1.000–100.000) namun memiliki engagement yang tinggi dan niche yang spesifik.",
    contoh: "Akun Instagram skincare dengan 20.000 followers yang sangat aktif dan dipercaya komunitas skincare.",
  },
  {
    term: "eWOM (Electronic Word of Mouth)",
    kategori: "Pemasaran",
    definisiSederhana: "Rekomendasi atau informasi tentang produk yang disebarkan melalui internet — komentar, review, posting di forum, atau pesan di grup chat.",
    contoh: "Seseorang memposting pengalaman positif menggunakan suatu produk di Twitter dan mendapat ribuan retweet.",
  },
  {
    term: "Loyalitas Merek",
    kategori: "Branding",
    definisiSederhana: "Kecenderungan konsumen untuk terus membeli produk dari merek yang sama secara berulang-ulang.",
    contoh: "Seseorang yang selalu membeli iPhone setiap kali ganti HP, meskipun ada Android dengan spesifikasi lebih bagus dan harga lebih murah.",
  },
  {
    term: "Segmentasi Pasar",
    kategori: "Strategi Pemasaran",
    definisiSederhana: "Proses membagi pasar yang luas menjadi kelompok-kelompok kecil berdasarkan karakteristik tertentu seperti usia, lokasi, atau minat.",
    contoh: "Produk susu bayi ditargetkan khusus untuk ibu yang memiliki bayi usia 0–12 bulan.",
  },
  {
    term: "Target Pasar",
    kategori: "Strategi Pemasaran",
    definisiSederhana: "Kelompok konsumen spesifik yang menjadi sasaran utama produk atau strategi pemasaran.",
    contoh: "Aplikasi game mobile menarget pria usia 15–30 tahun sebagai target pasar utamanya.",
  },
  {
    term: "Positioning",
    kategori: "Strategi Pemasaran",
    definisiSederhana: "Cara merek menempatkan dirinya di benak konsumen — apa yang membedakannya dari kompetitor.",
    contoh: "Volvo memposisikan diri sebagai merek mobil paling aman, bukan paling kencang atau paling mewah.",
  },
  {
    term: "Bauran Pemasaran (Marketing Mix)",
    kategori: "Pemasaran",
    definisiSederhana: "Empat elemen utama pemasaran yang dikenal sebagai 4P: Product (Produk), Price (Harga), Place (Tempat), dan Promotion (Promosi).",
    contoh: "Strategi pemasaran yang baik mempertimbangkan produk yang tepat, harga yang sesuai, distribusi yang efektif, dan promosi yang kuat.",
  },
  {
    term: "Customer Journey",
    kategori: "Pemasaran",
    definisiSederhana: "Perjalanan yang dilalui konsumen mulai dari tidak tahu tentang produk hingga akhirnya membeli dan menjadi pelanggan setia.",
    contoh: "Melihat iklan → tertarik → browsing produk → baca review → tambah ke keranjang → checkout → beli → puas → beli lagi.",
  },
  {
    term: "Unique Selling Proposition (USP)",
    kategori: "Branding",
    definisiSederhana: "Keunikan atau keunggulan yang dimiliki suatu produk dan tidak dimiliki oleh kompetitor — alasan utama konsumen memilih produk tersebut.",
    contoh: "Domino's Pizza memiliki USP 'Pizza diantarkan dalam 30 menit atau gratis'.",
  },
  {
    term: "Skala Likert",
    kategori: "Metodologi",
    definisiSederhana: "Skala penilaian yang digunakan dalam kuesioner penelitian, biasanya dari 1 (sangat tidak setuju) hingga 5 (sangat setuju).",
    contoh: "Pertanyaan 'Harga produk ini terjangkau' dijawab dengan skor 1–5 oleh responden.",
  },
  {
    term: "Variabel Independen (X)",
    kategori: "Metodologi",
    definisiSederhana: "Variabel bebas yang mempengaruhi variabel lain. Dalam penelitian, ini adalah variabel yang diteliti pengaruhnya.",
    contoh: "Dalam penelitian pengaruh harga dan promosi terhadap keputusan pembelian, Harga (X1) dan Promosi (X2) adalah variabel independen.",
  },
  {
    term: "Variabel Dependen (Y)",
    kategori: "Metodologi",
    definisiSederhana: "Variabel terikat yang dipengaruhi oleh variabel independen. Ini adalah variabel yang hasilnya diteliti.",
    contoh: "Keputusan Pembelian (Y) adalah variabel dependen yang dipengaruhi oleh harga dan promosi.",
  },
  {
    term: "Hipotesis",
    kategori: "Metodologi",
    definisiSederhana: "Dugaan atau jawaban sementara atas pertanyaan penelitian yang akan dibuktikan melalui analisis data.",
    contoh: "H1: Harga berpengaruh positif dan signifikan terhadap Keputusan Pembelian.",
  },
  {
    term: "Uji Validitas",
    kategori: "Statistik",
    definisiSederhana: "Pengujian untuk memastikan bahwa pertanyaan dalam kuesioner benar-benar mengukur apa yang ingin diukur.",
    contoh: "Pertanyaan tentang harga seharusnya mengukur persepsi harga, bukan kepuasan konsumen.",
  },
  {
    term: "Uji Reliabilitas",
    kategori: "Statistik",
    definisiSederhana: "Pengujian untuk memastikan bahwa kuesioner menghasilkan jawaban yang konsisten jika diulang kepada responden yang sama.",
    contoh: "Kuesioner yang reliabel akan menghasilkan skor yang mirip jika ditanyakan ulang kepada responden yang sama 2 minggu kemudian.",
  },
  {
    term: "Regresi Linier Berganda",
    kategori: "Statistik",
    definisiSederhana: "Metode statistik untuk mengukur seberapa besar pengaruh beberapa variabel bebas (X) terhadap satu variabel terikat (Y) secara bersamaan.",
    contoh: "Mengukur seberapa besar pengaruh Harga (X1) dan Promosi (X2) terhadap Keputusan Pembelian (Y) secara bersamaan.",
  },
  {
    term: "Koefisien Determinasi (R²)",
    kategori: "Statistik",
    definisiSederhana: "Angka yang menunjukkan seberapa besar variasi variabel Y dapat dijelaskan oleh variabel X. Nilainya antara 0–1 atau 0%–100%.",
    contoh: "R² = 0.65 berarti 65% perubahan Keputusan Pembelian bisa dijelaskan oleh Harga dan Promosi yang diteliti.",
  },
  {
    term: "Nilai p (p-value)",
    kategori: "Statistik",
    definisiSederhana: "Angka yang menunjukkan apakah hasil penelitian bermakna secara statistik. Jika p-value < 0.05, berarti hasilnya signifikan.",
    contoh: "p-value = 0.003 berarti pengaruh yang ditemukan sangat bermakna secara statistik.",
  },
  {
    term: "FOMO (Fear of Missing Out)",
    kategori: "Psikologi Konsumen",
    definisiSederhana: "Rasa takut ketinggalan sesuatu yang baik — dalam konteks pemasaran, dimanfaatkan melalui promosi terbatas waktu atau stok terbatas.",
    contoh: "'Hanya tersisa 3 produk! Beli sekarang sebelum kehabisan!' — menciptakan FOMO pada calon pembeli.",
  },
  {
    term: "Affiliate Marketing",
    kategori: "Digital Marketing",
    definisiSederhana: "Model pemasaran di mana seseorang mendapat komisi setiap kali berhasil membawa penjualan melalui link khusus miliknya.",
    contoh: "Content creator TikTok yang mendapat komisi 5% setiap kali penontonnya membeli produk melalui link di bionya.",
  },
  {
    term: "Flash Sale",
    kategori: "Promosi",
    definisiSederhana: "Penjualan dengan diskon besar yang hanya berlangsung dalam waktu singkat — biasanya beberapa jam — untuk menciptakan urgensi pembelian.",
    contoh: "Flash sale jam 12.00–14.00 dengan diskon 70% di Shopee atau Tokopedia.",
  },
  {
    term: "Harbolnas",
    kategori: "Promosi",
    definisiSederhana: "Hari Belanja Online Nasional — hari khusus di mana marketplace mengadakan diskon besar-besaran. Biasanya pada tanggal 11.11, 12.12, dsb.",
    contoh: "Harbolnas 12.12 membuat transaksi e-commerce naik ratusan persen dibanding hari biasa.",
  },
];

export function searchGlossary(query: string): GlossaryTerm[] {
  const q = query.toLowerCase();
  return GLOSSARY.filter(
    (g) =>
      g.term.toLowerCase().includes(q) ||
      g.definisiSederhana.toLowerCase().includes(q) ||
      g.kategori.toLowerCase().includes(q)
  );
}

export function getGlossaryByKategori(kategori: string): GlossaryTerm[] {
  return GLOSSARY.filter((g) => g.kategori === kategori);
}

export const GLOSSARY_CATEGORIES = [...new Set(GLOSSARY.map((g) => g.kategori))];
