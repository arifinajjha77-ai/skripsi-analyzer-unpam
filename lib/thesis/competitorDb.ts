/**
 * Client-side competitor reference database.
 * Organized by Indonesian SME industry categories.
 * Search is done by keyword matching (jenis usaha + produk + lokasi).
 *
 * Sources annotated per entry:
 *   "google"      = found via Google search / general web presence
 *   "marketplace" = found on Tokopedia / Shopee / Lazada
 *   "estimasi"    = price/data estimated, not from a specific source
 */

import type { CompetitorSource } from "./bab1Store";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CompetitorEntry {
  id: string;
  nama: string;
  produk: string;
  harga: string;
  source: CompetitorSource;
  catatan: string;
  keywords: string[]; // matched against query tokens
}

// ─── Database ──────────────────────────────────────────────────────────────────

const DB: CompetitorEntry[] = [
  // ── 3D Printing / Printing / Percetakan ─────────────────────────────────────
  {
    id: "3dp-1",
    nama: "JKT3D Print",
    produk: "Jasa cetak 3D berbagai material (PLA, ABS, PETG)",
    harga: "Rp 25.000 – Rp 150.000/item",
    source: "marketplace",
    catatan: "Aktif di Tokopedia & Shopee, pengiriman seluruh Indonesia",
    keywords: ["3d", "printing", "print", "cetak", "pla", "abs", "petg", "resin"],
  },
  {
    id: "3dp-2",
    nama: "Printspace Indonesia",
    produk: "3D Printing FDM & SLA, miniatur, prototype",
    harga: "Rp 30.000 – Rp 200.000/item",
    source: "google",
    catatan: "Studio 3D printing profesional, melayani B2B",
    keywords: ["3d", "printing", "fdm", "sla", "miniatur", "prototype", "model"],
  },
  {
    id: "3dp-3",
    nama: "Depok 3D Studio",
    produk: "Jibbitz custom, keychain, aksesori 3D print",
    harga: "Rp 15.000 – Rp 80.000/pcs",
    source: "marketplace",
    catatan: "Spesialis aksesori fashion 3D print, berbasis Depok",
    keywords: ["3d", "print", "jibbitz", "keychain", "aksesori", "custom", "depok", "fashion"],
  },
  {
    id: "3dp-4",
    nama: "GhostPrint Creative",
    produk: "Ghost lady figure, ornamen dekorasi 3D",
    harga: "Rp 45.000 – Rp 250.000/pcs",
    source: "marketplace",
    catatan: "Spesialis figurin dan dekorasi unik 3D printing",
    keywords: ["3d", "print", "ghost", "figurin", "dekorasi", "ornamen", "lady"],
  },
  {
    id: "3dp-5",
    nama: "Custom3D.id",
    produk: "Souvenir custom, plakat, nameplate 3D",
    harga: "Rp 35.000 – Rp 175.000/item",
    source: "google",
    catatan: "Fokus pada souvenir korporat dan pernikahan",
    keywords: ["3d", "print", "souvenir", "custom", "plakat", "nameplate", "pernikahan"],
  },

  // ── Fashion / Pakaian / Kaos ─────────────────────────────────────────────────
  {
    id: "fsh-1",
    nama: "H&M Indonesia",
    produk: "Pakaian fashion wanita, pria, anak",
    harga: "Rp 99.000 – Rp 599.000",
    source: "google",
    catatan: "Brand internasional, toko di mall besar Indonesia",
    keywords: ["fashion", "pakaian", "baju", "kaos", "wanita", "pria", "busana"],
  },
  {
    id: "fsh-2",
    nama: "ERIGO",
    produk: "Streetwear, kaos, jaket, celana",
    harga: "Rp 150.000 – Rp 450.000",
    source: "marketplace",
    catatan: "Brand lokal ternama, kuat di marketplace nasional",
    keywords: ["fashion", "kaos", "streetwear", "jaket", "celana", "brand lokal"],
  },
  {
    id: "fsh-3",
    nama: "Cotton Ink",
    produk: "Busana wanita modern, atasan, rok",
    harga: "Rp 200.000 – Rp 600.000",
    source: "google",
    catatan: "Target segmen wanita dewasa, online & offline",
    keywords: ["fashion", "wanita", "busana", "atasan", "rok", "modern"],
  },

  // ── Kaos Kaki / Kaus Kaki ────────────────────────────────────────────────────
  {
    id: "kk-1",
    nama: "Kaos Kaki Neon",
    produk: "Kaos kaki ankle, crew, motif",
    harga: "Rp 12.000 – Rp 35.000/pasang",
    source: "marketplace",
    catatan: "Best seller Tokopedia kategori kaos kaki",
    keywords: ["kaos kaki", "kaus kaki", "ankle", "crew", "sock", "socks", "motif"],
  },
  {
    id: "kk-2",
    nama: "Sock Energy",
    produk: "Kaos kaki olahraga, casual, terry",
    harga: "Rp 15.000 – Rp 40.000/pasang",
    source: "marketplace",
    catatan: "Merek lokal dengan variasi warna dan motif lengkap",
    keywords: ["kaos kaki", "sock", "olahraga", "casual", "terry", "energy"],
  },
  {
    id: "kk-3",
    nama: "Miniso Socks",
    produk: "Kaos kaki karakter, set 5 pasang",
    harga: "Rp 25.000 – Rp 65.000/set",
    source: "google",
    catatan: "Brand retail internasional, tersedia di seluruh Indonesia",
    keywords: ["kaos kaki", "sock", "karakter", "set", "miniso"],
  },

  // ── Makanan & Minuman (F&B) ──────────────────────────────────────────────────
  {
    id: "fnb-1",
    nama: "Fore Coffee",
    produk: "Kopi kekinian, minuman kopi",
    harga: "Rp 25.000 – Rp 55.000",
    source: "google",
    catatan: "Jaringan kedai kopi modern berbasis aplikasi",
    keywords: ["kopi", "coffee", "minuman", "cafe", "kedai", "kekinian"],
  },
  {
    id: "fnb-2",
    nama: "Kopi Kenangan",
    produk: "Kopi susu, matcha latte, minuman kekinian",
    harga: "Rp 18.000 – Rp 45.000",
    source: "google",
    catatan: "Salah satu jaringan kopi terbesar di Indonesia",
    keywords: ["kopi", "coffee", "susu", "minuman", "kekinian", "latte"],
  },
  {
    id: "fnb-3",
    nama: "Mie Gacoan",
    produk: "Mie pedas level, aneka topping",
    harga: "Rp 15.000 – Rp 30.000",
    source: "google",
    catatan: "Restoran mie pedas dengan antrian panjang di kota besar",
    keywords: ["mie", "makanan", "pedas", "restoran", "kuliner"],
  },
  {
    id: "fnb-4",
    nama: "BreadTalk",
    produk: "Roti, kue, pastri",
    harga: "Rp 15.000 – Rp 50.000",
    source: "google",
    catatan: "Waralaba bakeri internasional, hadir di mall",
    keywords: ["roti", "bakeri", "kue", "pastri", "bread", "makanan"],
  },
  {
    id: "fnb-5",
    nama: "JCO Donuts & Coffee",
    produk: "Donat, minuman kopi, smoothie",
    harga: "Rp 10.000 – Rp 65.000",
    source: "google",
    catatan: "Brand internasional dengan lokasi di mal seluruh Indonesia",
    keywords: ["donat", "kopi", "minuman", "makanan", "dessert", "pastri"],
  },

  // ── Kosmetik / Kecantikan ────────────────────────────────────────────────────
  {
    id: "kos-1",
    nama: "Wardah",
    produk: "Lipstik, foundation, skincare halal",
    harga: "Rp 35.000 – Rp 200.000",
    source: "marketplace",
    catatan: "Brand kosmetik halal terkemuka Indonesia",
    keywords: ["kosmetik", "kecantikan", "makeup", "halal", "lipstik", "skincare"],
  },
  {
    id: "kos-2",
    nama: "Emina Cosmetics",
    produk: "Cushion, eyeshadow, produk kecantikan muda",
    harga: "Rp 30.000 – Rp 150.000",
    source: "marketplace",
    catatan: "Target remaja, brand lokal harga terjangkau",
    keywords: ["kosmetik", "makeup", "remaja", "kecantikan", "cushion"],
  },
  {
    id: "kos-3",
    nama: "Somethinc",
    produk: "Skincare serum, moisturizer, sunscreen",
    harga: "Rp 80.000 – Rp 300.000",
    source: "marketplace",
    catatan: "Brand lokal skincare millennial, populer di medsos",
    keywords: ["skincare", "serum", "moisturizer", "sunscreen", "kecantikan"],
  },

  // ── Elektronik / Gadget ──────────────────────────────────────────────────────
  {
    id: "ele-1",
    nama: "iBox",
    produk: "iPhone, iPad, MacBook, aksesori Apple",
    harga: "Rp 3.000.000 – Rp 30.000.000",
    source: "google",
    catatan: "Premium reseller Apple resmi di Indonesia",
    keywords: ["elektronik", "gadget", "hp", "apple", "iphone", "laptop", "komputer"],
  },
  {
    id: "ele-2",
    nama: "Samsung Official Store",
    produk: "Smartphone, tablet, TV, home appliances",
    harga: "Rp 2.000.000 – Rp 25.000.000",
    source: "google",
    catatan: "Brand elektronik terbesar dunia",
    keywords: ["elektronik", "gadget", "hp", "samsung", "smartphone", "tv"],
  },
  {
    id: "ele-3",
    nama: "Erafone",
    produk: "Smartphone Android berbagai merek",
    harga: "Rp 1.500.000 – Rp 15.000.000",
    source: "google",
    catatan: "Jaringan toko resmi ponsel terbesar di Indonesia",
    keywords: ["elektronik", "gadget", "hp", "smartphone", "android", "ponsel"],
  },

  // ── Otomotif / Kendaraan ─────────────────────────────────────────────────────
  {
    id: "oto-1",
    nama: "Bengkel Auto2000",
    produk: "Servis Toyota, spare part, body repair",
    harga: "Rp 150.000 – Rp 5.000.000/servis",
    source: "google",
    catatan: "Dealer & bengkel resmi Toyota terbesar",
    keywords: ["otomotif", "bengkel", "servis", "mobil", "motor", "toyota", "kendaraan"],
  },
  {
    id: "oto-2",
    nama: "Ahass Honda",
    produk: "Servis motor Honda, spare part, modifikasi",
    harga: "Rp 100.000 – Rp 2.000.000/servis",
    source: "google",
    catatan: "Bengkel resmi Honda, tersebar di seluruh Indonesia",
    keywords: ["otomotif", "bengkel", "motor", "honda", "servis", "kendaraan", "spare part"],
  },
  {
    id: "oto-3",
    nama: "Goo-Clean Car Wash",
    produk: "Cuci mobil, detailing, coating",
    harga: "Rp 50.000 – Rp 1.500.000",
    source: "estimasi",
    catatan: "Data harga estimasi berdasarkan pasaran jasa cuci mobil",
    keywords: ["cuci mobil", "car wash", "detailing", "coating", "otomotif"],
  },

  // ── Pendidikan / Kursus / Bimbel ─────────────────────────────────────────────
  {
    id: "edu-1",
    nama: "Ganesha Operation (GO)",
    produk: "Bimbingan belajar SD-SMA, persiapan UTBK",
    harga: "Rp 500.000 – Rp 3.000.000/semester",
    source: "google",
    catatan: "Bimbel terbesar nasional dengan ratusan cabang",
    keywords: ["bimbel", "kursus", "pendidikan", "belajar", "les", "utbk", "sd", "sma"],
  },
  {
    id: "edu-2",
    nama: "Primagama",
    produk: "Bimbingan belajar, kursus bahasa",
    harga: "Rp 400.000 – Rp 2.500.000/semester",
    source: "google",
    catatan: "Jaringan bimbel nasional dengan pengalaman 40 tahun",
    keywords: ["bimbel", "kursus", "pendidikan", "bahasa", "les"],
  },
  {
    id: "edu-3",
    nama: "Ruang Guru",
    produk: "Kursus online, video belajar, soal latihan",
    harga: "Rp 100.000 – Rp 800.000/bulan",
    source: "google",
    catatan: "Edtech terbesar Indonesia, platform digital",
    keywords: ["belajar", "online", "kursus", "pendidikan", "digital", "edtech"],
  },

  // ── Jasa Digital / Marketing ─────────────────────────────────────────────────
  {
    id: "dig-1",
    nama: "IDwebhost",
    produk: "Hosting, domain, VPS, cloud server",
    harga: "Rp 10.000 – Rp 500.000/bulan",
    source: "google",
    catatan: "Penyedia hosting lokal terpercaya",
    keywords: ["hosting", "domain", "cloud", "server", "digital", "website", "web"],
  },
  {
    id: "dig-2",
    nama: "Sribu Digital",
    produk: "Desain grafis, logo, branding, konten media",
    harga: "Rp 500.000 – Rp 10.000.000/proyek",
    source: "google",
    catatan: "Platform freelance desain Indonesia",
    keywords: ["desain", "grafis", "logo", "branding", "digital", "marketing", "media sosial"],
  },
  {
    id: "dig-3",
    nama: "Digital Marketing Agency Lokal",
    produk: "Kelola medsos, iklan Google/Meta, SEO",
    harga: "Rp 1.500.000 – Rp 8.000.000/bulan",
    source: "estimasi",
    catatan: "Kisaran harga jasa digital marketing lokal berdasarkan pasaran",
    keywords: ["digital marketing", "medsos", "iklan", "google ads", "facebook", "seo", "marketing"],
  },

  // ── Percetakan / Sablon ──────────────────────────────────────────────────────
  {
    id: "prc-1",
    nama: "Percetakan 99",
    produk: "Sablon kaos, spanduk, brosur, stiker",
    harga: "Rp 15.000 – Rp 200.000/item",
    source: "marketplace",
    catatan: "Tersedia di marketplace, pengiriman ke seluruh Indonesia",
    keywords: ["percetakan", "sablon", "cetak", "kaos", "spanduk", "brosur", "stiker", "printing"],
  },
  {
    id: "prc-2",
    nama: "PrintKing Indonesia",
    produk: "Cetak digital, merchandise, promosi",
    harga: "Rp 20.000 – Rp 350.000/item",
    source: "google",
    catatan: "Melayani cetak partai kecil dan besar",
    keywords: ["percetakan", "cetak", "merchandise", "promosi", "digital print"],
  },

  // ── Properti / Real Estate ───────────────────────────────────────────────────
  {
    id: "prop-1",
    nama: "Ray White Indonesia",
    produk: "Jual beli rumah, properti, sewa apartemen",
    harga: "Rp 500.000.000 – Rp 10.000.000.000",
    source: "google",
    catatan: "Agen properti internasional terbesar Indonesia",
    keywords: ["properti", "rumah", "apartemen", "real estate", "jual beli", "sewa"],
  },
  {
    id: "prop-2",
    nama: "Century21 Indonesia",
    produk: "Properti residensial dan komersial",
    harga: "Rp 400.000.000 ke atas",
    source: "google",
    catatan: "Jaringan agen properti internasional",
    keywords: ["properti", "rumah", "real estate", "komersial", "residensial"],
  },

  // ── Kesehatan / Apotek ───────────────────────────────────────────────────────
  {
    id: "kes-1",
    nama: "Apotek K-24",
    produk: "Obat resep, OTC, vitamin, alat kesehatan",
    harga: "Rp 5.000 – Rp 500.000",
    source: "google",
    catatan: "Apotek 24 jam terbesar di Indonesia",
    keywords: ["apotek", "obat", "kesehatan", "vitamin", "medis", "farmasi"],
  },
  {
    id: "kes-2",
    nama: "Halodoc Pharmacy",
    produk: "Obat online, konsultasi dokter, lab",
    harga: "Rp 15.000 – Rp 300.000",
    source: "google",
    catatan: "Apotek digital, terintegrasi aplikasi Halodoc",
    keywords: ["apotek", "obat", "kesehatan", "online", "digital", "farmasi"],
  },

  // ── Jasa Fotografi / Videografi ──────────────────────────────────────────────
  {
    id: "foto-1",
    nama: "Studio Foto Lokal",
    produk: "Foto produk, foto keluarga, foto wisuda",
    harga: "Rp 200.000 – Rp 2.000.000/sesi",
    source: "estimasi",
    catatan: "Harga estimasi berdasarkan pasaran studio foto lokal",
    keywords: ["foto", "fotografer", "studio", "kamera", "fotografi"],
  },
  {
    id: "foto-2",
    nama: "Content Creator Agency",
    produk: "Pembuatan konten video, foto produk, reels",
    harga: "Rp 500.000 – Rp 5.000.000/proyek",
    source: "estimasi",
    catatan: "Harga estimasi jasa content creator lokal",
    keywords: ["foto", "video", "konten", "reels", "youtube", "tiktok", "videografi"],
  },

  // ── Kerajinan / Handicraft ───────────────────────────────────────────────────
  {
    id: "kra-1",
    nama: "Toko Kerajinan Nusantara",
    produk: "Batik, anyaman, kerajinan tangan lokal",
    harga: "Rp 50.000 – Rp 800.000",
    source: "marketplace",
    catatan: "Produk UMKM kerajinan tangan, tersedia online",
    keywords: ["kerajinan", "handicraft", "batik", "anyaman", "umkm", "souvenir"],
  },

  // ── Jasa Laundry / Kebersihan ────────────────────────────────────────────────
  {
    id: "lau-1",
    nama: "Laundry Express",
    produk: "Cuci kilogram, cuci sepatu, dry clean",
    harga: "Rp 7.000 – Rp 15.000/kg",
    source: "estimasi",
    catatan: "Harga estimasi berdasarkan pasaran laundry kiloan",
    keywords: ["laundry", "cuci", "baju", "sepatu", "kebersihan", "dry clean"],
  },

  // ── Kuliner Khas / UMKM ──────────────────────────────────────────────────────
  {
    id: "umkm-1",
    nama: "Warung Makan Lokal",
    produk: "Nasi, lauk-pauk, menu sehari-hari",
    harga: "Rp 12.000 – Rp 35.000/porsi",
    source: "estimasi",
    catatan: "Data harga estimasi warung makan lokal",
    keywords: ["warung", "makan", "nasi", "kuliner", "umkm", "makanan", "restoran"],
  },
  {
    id: "umkm-2",
    nama: "Toko Sembako Online",
    produk: "Beras, minyak, sembako kebutuhan rumah tangga",
    harga: "Rp 10.000 – Rp 200.000",
    source: "marketplace",
    catatan: "Toko sembako berbasis marketplace, pengiriman lokal",
    keywords: ["sembako", "beras", "minyak", "kebutuhan", "toko", "grosir"],
  },

  // ── Pertanian / Agrobisnis ───────────────────────────────────────────────────
  {
    id: "agro-1",
    nama: "TaniHub Group",
    produk: "Produk pertanian segar, sayuran, buah",
    harga: "Rp 5.000 – Rp 80.000/kg",
    source: "google",
    catatan: "Platform agritech Indonesia",
    keywords: ["pertanian", "agro", "sayuran", "buah", "panen", "tani", "petani"],
  },

  // ── Jasa Transportasi / Logistik ────────────────────────────────────────────
  {
    id: "log-1",
    nama: "JNE Express",
    produk: "Pengiriman paket, dokumen, kargo",
    harga: "Rp 8.000 – Rp 50.000/kg",
    source: "google",
    catatan: "Kurir terbesar Indonesia",
    keywords: ["logistik", "kurir", "pengiriman", "paket", "ekspedisi", "jne"],
  },
  {
    id: "log-2",
    nama: "SiCepat Express",
    produk: "Pengiriman same day, reguler, kargo",
    harga: "Rp 6.000 – Rp 45.000/kg",
    source: "google",
    catatan: "Kurir modern berbasis teknologi",
    keywords: ["logistik", "kurir", "pengiriman", "same day", "ekspedisi"],
  },

  // ── Suplemen / Kesehatan / Gym ───────────────────────────────────────────────
  {
    id: "gym-1",
    nama: "Celebrity Fitness",
    produk: "Membership gym, kelas fitness, personal trainer",
    harga: "Rp 300.000 – Rp 800.000/bulan",
    source: "google",
    catatan: "Jaringan gym premium di mall besar",
    keywords: ["gym", "fitness", "olahraga", "kesehatan", "trainer", "membership"],
  },
  {
    id: "gym-2",
    nama: "Toko Suplemen Lokal",
    produk: "Whey protein, vitamin, suplemen olahraga",
    harga: "Rp 150.000 – Rp 800.000",
    source: "marketplace",
    catatan: "Suplemen lokal tersedia di marketplace",
    keywords: ["suplemen", "protein", "gym", "fitness", "vitamin", "olahraga"],
  },

  // ── E-commerce / Retail Online ───────────────────────────────────────────────
  {
    id: "ecom-1",
    nama: "Tokopedia Official Store",
    produk: "Berbagai produk consumer goods",
    harga: "Variatif",
    source: "marketplace",
    catatan: "Marketplace terbesar Indonesia",
    keywords: ["marketplace", "online", "ecommerce", "jual beli", "toko online"],
  },
  {
    id: "ecom-2",
    nama: "Shopee Mall",
    produk: "Fashion, elektronik, kebutuhan rumah",
    harga: "Variatif",
    source: "marketplace",
    catatan: "Platform e-commerce terpopuler di Asia Tenggara",
    keywords: ["marketplace", "shopee", "online", "fashion", "elektronik"],
  },
];

// ─── Search Engine ─────────────────────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function scoreEntry(entry: CompetitorEntry, queryTokens: string[]): number {
  if (queryTokens.length === 0) return 0;
  let score = 0;
  const entryTokens = entry.keywords;
  for (const qt of queryTokens) {
    for (const et of entryTokens) {
      if (et === qt) { score += 3; break; }
      if (et.includes(qt) || qt.includes(et)) { score += 1; break; }
    }
    // Also match against nama and produk
    const entryText = `${entry.nama} ${entry.produk}`.toLowerCase();
    if (entryText.includes(qt)) score += 1;
  }
  return score;
}

export interface CompetitorSearchResult {
  entry: CompetitorEntry;
  score: number;
}

/**
 * Search the competitor database using free-text query.
 * Returns top results sorted by relevance score.
 */
export function searchCompetitors(
  jenisUsaha: string,
  produkUtama: string,
  lokasi: string,
  keyword: string,
  limit = 8
): CompetitorSearchResult[] {
  const query = [jenisUsaha, produkUtama, lokasi, keyword].join(" ");
  const tokens = tokenize(query);

  if (tokens.length === 0) return [];

  const scored = DB.map((entry) => ({
    entry,
    score: scoreEntry(entry, tokens),
  })).filter((r) => r.score > 0);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

/**
 * Generate estimated competitors when no DB match is found or user requests "Estimasi Aman".
 * Creates plausible competitors based on jenis usaha and lokasi.
 */
export function generateEstimasiKompetitor(
  jenisUsaha: string,
  lokasi: string,
  produkUtama: string,
  namaObjek: string
): CompetitorEntry[] {
  const lokasiStr = lokasi || "Indonesia";
  const usaha = jenisUsaha || "usaha sejenis";
  const produk = produkUtama || "produk serupa";

  return [
    {
      id: "est-1",
      nama: `${usaha.charAt(0).toUpperCase() + usaha.slice(1)} Mandiri ${lokasiStr}`,
      produk: produk,
      harga: "Harga belum tersedia",
      source: "estimasi",
      catatan: `Kompetitor estimasi di bidang ${usaha}, berlokasi di ${lokasiStr}`,
      keywords: [],
    },
    {
      id: "est-2",
      nama: `Toko ${usaha.charAt(0).toUpperCase() + usaha.slice(1)} Online`,
      produk: produk,
      harga: "Harga belum tersedia",
      source: "estimasi",
      catatan: `Kompetitor online berbasis marketplace di bidang ${usaha}`,
      keywords: [],
    },
    {
      id: "est-3",
      nama: `${lokasiStr} ${usaha.charAt(0).toUpperCase() + usaha.slice(1)} Center`,
      produk: produk,
      harga: "Harga belum tersedia",
      source: "estimasi",
      catatan: `Kompetitor lokal di wilayah ${lokasiStr}`,
      keywords: [],
    },
  ];
}

export const SOURCE_LABELS: Record<CompetitorEntry["source"], string> = {
  google: "📍 Data Google",
  marketplace: "🛒 Data Marketplace",
  estimasi: "📊 Estimasi",
  manual: "✏ Manual",
};

export const SOURCE_COLORS: Record<CompetitorEntry["source"], string> = {
  google: "bg-blue-100 text-blue-700 border-blue-200",
  marketplace: "bg-orange-100 text-orange-700 border-orange-200",
  estimasi: "bg-yellow-100 text-yellow-700 border-yellow-200",
  manual: "bg-slate-100 text-slate-600 border-slate-200",
};
