import { Bab1State, SalesRow, ConsumerRow, CompetitorRow, DataMode } from "./bab1Store";
import { ThesisState } from "./store";

// ─── helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse an Indonesian-formatted number string to a JS number.
 *
 * Handles:
 *   "1.000 orang"  → 1000   (dot = thousands separator)
 *   "50.000.000"   → 50000000
 *   "Rp 25.000"    → 25000
 *   "1.234,56"     → 1234.56  (dot thousands, comma decimal)
 *   "72.5%"        → 72.5    (dot = decimal, < 3 trailing digits)
 *   "725"          → 725
 *   "Rp5 juta"     → 5000000
 *   "850 unit"     → 850
 */
export function parseIDNumber(s: string): number {
  if (!s || !s.trim()) return NaN;

  const hasJuta = /juta/i.test(s);
  const hasMiliar = /miliar|milyar/i.test(s);

  // Keep only digits, dots, and commas
  let num = s.replace(/[^\d.,]/g, "").trim();
  if (!num) return NaN;

  let result: number;

  if (num.includes(",")) {
    // Indonesian style: 1.000,50 → dots=thousands, comma=decimal
    num = num.replace(/\./g, "").replace(",", ".");
    result = parseFloat(num);
  } else {
    const dots = (num.match(/\./g) ?? []).length;
    if (dots > 1) {
      // Multiple dots → all are thousands separators: 50.000.000 → 50000000
      result = parseFloat(num.replace(/\./g, ""));
    } else if (dots === 1 && /\.\d{3}$/.test(num)) {
      // Single dot followed by exactly 3 digits → thousands separator: 1.000 → 1000
      result = parseFloat(num.replace(/\./g, ""));
    } else {
      // Standard float: 72.5, 0.85, 725
      result = parseFloat(num);
    }
  }

  if (isNaN(result)) return NaN;
  if (hasJuta)   return result * 1_000_000;
  if (hasMiliar) return result * 1_000_000_000;
  return result;
}

function pct(target: string, realisasi: string): string {
  const t = parseIDNumber(target);
  const r = parseIDNumber(realisasi);
  if (!t || isNaN(t) || isNaN(r)) return "-";
  return ((r / t) * 100).toFixed(1) + "%";
}

function keterangan(target: string, realisasi: string): string {
  const t = parseIDNumber(target);
  const r = parseIDNumber(realisasi);
  if (isNaN(t) || isNaN(r) || t === 0) return "-";
  const ratio = r / t;
  if (ratio >= 1.0)  return "Tercapai";
  if (ratio >= 0.80) return "Belum Optimal";
  if (ratio >= 0.60) return "Tidak Tercapai";
  return "Rendah";
}

function formatNumber(val: string): string {
  return val.trim() || "-";
}

/**
 * Detect trend from a numeric series.
 * Returns: "meningkat" | "menurun" | "fluktuatif" | "stabil"
 */
export function detectTrend(values: number[]): "meningkat" | "menurun" | "fluktuatif" | "stabil" {
  if (values.length < 2) return "fluktuatif";

  let allUp = true;
  let allDown = true;
  let totalChange = 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  for (let i = 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    if (diff <= 0) allUp = false;
    if (diff >= 0) allDown = false;
    totalChange += Math.abs(diff);
  }

  if (allUp)   return "meningkat";
  if (allDown) return "menurun";
  // Stabil: total change < 8% of average
  if (avg > 0 && totalChange / avg < 0.08 * (values.length - 1)) return "stabil";
  return "fluktuatif";
}

/**
 * Format a list of years with proper Indonesian conjunction.
 *   ["2024"]           → "2024"
 *   ["2024","2025"]    → "2024 dan 2025"
 *   ["2024","2025","2026"] → "2024, 2025, dan 2026"
 */
export function formatYearList(years: string[]): string {
  if (years.length === 0) return "";
  if (years.length === 1) return years[0];
  if (years.length === 2) return `${years[0]} dan ${years[1]}`;
  return years.slice(0, -1).join(", ") + ", dan " + years[years.length - 1];
}

/**
 * Build object label for title/judul, avoiding duplicate location.
 *   ("GYFIN 3D Printing Depok", "Depok") → "GYFIN 3D Printing Depok"
 *   ("Sock Energy", "Depok")             → "Sock Energy di Depok"
 *   ("Sock Energy", "")                  → "Sock Energy"
 */
export function buildObjectLabel(name: string, location: string): string {
  if (!location || !location.trim()) return name;
  if (name.toLowerCase().includes(location.toLowerCase().trim())) return name;
  return `${name} di ${location}`;
}

// ─── table generators (plain text, used inside DOCX and preview) ──────────────

export interface TableRow {
  cols: string[];
}

export interface GeneratedTable {
  headers: string[];
  rows: TableRow[];
  caption: string;
}

export function buildSalesTable(
  salesData: SalesRow[],
  namaObjek: string,
  mode: DataMode = "asli"
): GeneratedTable {
  const modeLabel = mode === "estimasi" ? " (Estimasi/Disamarkan)" : mode === "tidak_tersedia" ? " (Tidak Tersedia)" : "";
  const headers = ["Tahun", "Target Penjualan", "Realisasi Penjualan", "Persentase", "Keterangan"];
  const rows = salesData
    .filter((r) => r.tahun)
    .map((r) => ({
      cols: [
        r.tahun,
        formatNumber(r.target),
        formatNumber(r.realisasi),
        pct(r.target, r.realisasi),
        keterangan(r.target, r.realisasi),
      ],
    }));
  return {
    headers,
    rows,
    caption: `Data Penjualan ${namaObjek}${modeLabel}`,
  };
}

export function buildConsumerTable(
  consumerData: ConsumerRow[],
  namaObjek: string,
  mode: DataMode = "asli"
): GeneratedTable {
  const modeLabel = mode === "estimasi" ? " (Estimasi/Disamarkan)" : mode === "tidak_tersedia" ? " (Tidak Tersedia)" : "";
  const headers = ["Tahun", "Target Konsumen", "Realisasi Konsumen", "Persentase", "Keterangan"];
  const rows = consumerData
    .filter((r) => r.tahun)
    .map((r) => ({
      cols: [
        r.tahun,
        formatNumber(r.target),
        formatNumber(r.realisasi),
        pct(r.target, r.realisasi),
        keterangan(r.target, r.realisasi),
      ],
    }));
  return {
    headers,
    rows,
    caption: `Data Konsumen ${namaObjek}${modeLabel}`,
  };
}

const SOURCE_LABEL_MAP: Record<string, string> = {
  google: "Data Google",
  marketplace: "Data Marketplace",
  estimasi: "Estimasi",
  manual: "Manual",
};

export function buildCompetitorTable(competitors: CompetitorRow[]): GeneratedTable {
  const hasSource = competitors.some((c) => c.source && c.source !== "manual");
  const headers = hasSource
    ? ["No", "Nama Kompetitor", "Produk", "Harga", "Sumber"]
    : ["No", "Nama Kompetitor", "Produk", "Harga"];

  const rows = competitors
    .filter((c) => c.nama)
    .map((c, i) => ({
      cols: hasSource
        ? [String(i + 1), c.nama, c.produk || "-", c.harga || "-", SOURCE_LABEL_MAP[c.source ?? "manual"] ?? "-"]
        : [String(i + 1), c.nama, c.produk || "-", c.harga || "-"],
    }));
  return {
    headers,
    rows,
    caption: "Daftar Kompetitor",
  };
}

// ─── Latar Belakang text generator ────────────────────────────────────────────

export function generateLatarBelakang(bab1: Bab1State, thesis: ThesisState): string {
  const { namaObjek, jenisUsaha, lokasi, salesData, consumerData, competitors, fenomena } = bab1;
  const { x1, x2, y } = thesis;

  const validSales = (bab1.salesDataMode === "tidak_tersedia")
    ? []
    : salesData.filter((r) => r.tahun && r.target && r.realisasi);
  const validConsumers = (bab1.consumerDataMode === "tidak_tersedia")
    ? []
    : consumerData.filter((r) => r.tahun && r.target && r.realisasi);
  const validCompetitors = competitors.filter((c) => c.nama);

  // Trend analysis — parse realisasi values and detect proper trend
  const salesValues    = validSales.map((r) => parseIDNumber(r.realisasi)).filter((v) => !isNaN(v));
  const consumerValues = validConsumers.map((r) => parseIDNumber(r.realisasi)).filter((v) => !isNaN(v));

  const saleTrendKey    = detectTrend(salesValues);
  const consumerTrendKey = detectTrend(consumerValues);

  const TREND_LABEL: Record<ReturnType<typeof detectTrend>, string> = {
    meningkat:  "mengalami peningkatan",
    menurun:    "mengalami penurunan",
    fluktuatif: "mengalami fluktuasi",
    stabil:     "relatif stabil",
  };
  const saleTrend    = TREND_LABEL[saleTrendKey];
  const consumerTrend = TREND_LABEL[consumerTrendKey];

  const salesPeriod = validSales.length >= 2
    ? `${validSales[0].tahun} hingga ${validSales[validSales.length - 1].tahun}`
    : validSales[0]?.tahun ?? "";

  const competitorNames = validCompetitors.map((c) => c.nama).join(", ");
  const fenomenaLines = fenomena
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const paragraphs: string[] = [];

  // 1. Gambaran industri
  paragraphs.push(
    `Di era persaingan bisnis yang semakin kompetitif saat ini, dunia usaha dituntut untuk terus berinovasi ` +
    `dan meningkatkan daya saingnya agar dapat bertahan dan berkembang di pasar. Perkembangan teknologi informasi ` +
    `dan digitalisasi yang pesat telah membawa perubahan signifikan dalam perilaku konsumen, khususnya dalam ` +
    `proses pengambilan keputusan pembelian. Konsumen kini memiliki akses yang lebih luas terhadap informasi ` +
    `produk dan jasa, sehingga mereka menjadi semakin selektif dan kritis dalam menentukan pilihan. ` +
    `Kondisi ini menuntut setiap pelaku usaha, termasuk ${jenisUsaha || "pelaku usaha"}, untuk memahami ` +
    `faktor-faktor yang mempengaruhi perilaku konsumen secara mendalam.`
  );

  // 2. Gambaran objek
  paragraphs.push(
    `${namaObjek} merupakan ${jenisUsaha || "usaha"} yang berlokasi di ${lokasi || "wilayah Indonesia"}. ` +
    `Sebagai salah satu pemain di industri ini, ${namaObjek} berkomitmen untuk memberikan produk dan layanan ` +
    `terbaik kepada konsumennya. Dalam menjalankan kegiatan operasionalnya, ${namaObjek} menghadapi berbagai ` +
    `tantangan yang tidak terlepas dari dinamika pasar dan persaingan yang semakin ketat. Untuk dapat ` +
    `mempertahankan dan meningkatkan kinerjanya, ${namaObjek} perlu memahami secara komprehensif faktor-faktor ` +
    `yang mempengaruhi ${y || "keputusan konsumen"}.`
  );

  const salesMode    = bab1.salesDataMode    ?? "asli";
  const consumerMode = bab1.consumerDataMode ?? "asli";

  // 3. Data penjualan
  if (validSales.length > 0) {
    let salesDesc = salesMode === "estimasi"
      ? `Berdasarkan data penjualan yang telah disamarkan untuk menjaga kerahasiaan perusahaan, ` +
        `gambaran kondisi penjualan ${namaObjek} pada periode ${salesPeriod} menunjukkan bahwa ` +
        `penjualan ${namaObjek} ${saleTrend} dari tahun ke tahun. ` +
        `(Data merupakan estimasi yang disusun berdasarkan gambaran umum kondisi perusahaan.) `
      : `Berdasarkan data penjualan ${namaObjek} pada periode ${salesPeriod}, ` +
        `penjualan ${namaObjek} ${saleTrend} dari tahun ke tahun. `;

    if (validSales.length >= 1) {
      const rows = validSales.map(
        (r) =>
          `pada tahun ${r.tahun} dengan target ${formatNumber(r.target)} dan realisasi ${formatNumber(r.realisasi)} (${pct(r.target, r.realisasi)})`
      );
      salesDesc += `Secara rinci, ${rows.join("; ")}. `;
    }

    const notAchieved = validSales.filter((r) => {
      const kt = keterangan(r.target, r.realisasi);
      return kt === "Tidak Tercapai" || kt === "Belum Optimal" || kt === "Rendah";
    });
    if (notAchieved.length > 0) {
      salesDesc += `Terdapat ${notAchieved.length} tahun di mana realisasi penjualan belum mencapai target yang telah ditetapkan, yaitu pada tahun ${formatYearList(notAchieved.map((r) => r.tahun))}. `;
      salesDesc += `Kondisi ini mengindikasikan adanya permasalahan yang perlu mendapatkan perhatian serius dari pihak manajemen ${namaObjek}. `;
    }

    salesDesc += `Data penjualan tersebut dapat dilihat pada tabel berikut.`;
    paragraphs.push(salesDesc);
  } else if (salesMode === "tidak_tersedia") {
    paragraphs.push(
      `Data penjualan ${namaObjek} tidak dapat ditampilkan secara rinci karena perusahaan tidak ` +
      `bersedia memberikan data tersebut. Namun, berdasarkan observasi dan informasi yang diperoleh ` +
      `peneliti, terdapat indikasi bahwa kinerja penjualan ${namaObjek} belum mencapai kondisi yang ` +
      `diharapkan, sehingga diperlukan evaluasi terhadap faktor-faktor yang mempengaruhi ${y || "keputusan konsumen"}.`
    );
  }

  // 4. Data konsumen
  if (validConsumers.length > 0) {
    const consumerTrendSimilar = consumerTrendKey === saleTrendKey;
    let consumerDesc = consumerMode === "estimasi"
      ? `Sejalan dengan data penjualan, data konsumen yang telah disamarkan menunjukkan tren yang ` +
        `${consumerTrendSimilar ? "serupa dengan data penjualan" : "berbeda dengan data penjualan"}. ` +
        `Berdasarkan estimasi yang disusun berdasarkan gambaran umum kondisi perusahaan, ` +
        `jumlah konsumen ${namaObjek} ${consumerTrend} selama periode yang sama. `
      : `Sejalan dengan data penjualan, data konsumen ${namaObjek} juga menunjukkan tren yang ` +
        `${consumerTrendSimilar ? "serupa" : "berbeda"}. ` +
        `Jumlah konsumen ${namaObjek} ${consumerTrend} selama periode yang sama. `;

    if (validConsumers.length >= 1) {
      const rows = validConsumers.map(
        (r) =>
          `pada tahun ${r.tahun} jumlah konsumen yang ditargetkan sebanyak ${formatNumber(r.target)} dengan realisasi ${formatNumber(r.realisasi)} (${pct(r.target, r.realisasi)})`
      );
      consumerDesc += `${rows.join("; ")}. `;
    }

    const notAchievedC = validConsumers.filter((r) => {
      const kt = keterangan(r.target, r.realisasi);
      return kt === "Tidak Tercapai" || kt === "Belum Optimal" || kt === "Rendah";
    });
    if (notAchievedC.length > 0) {
      consumerDesc +=
        `Pencapaian konsumen yang belum memenuhi target pada tahun ${formatYearList(notAchievedC.map((r) => r.tahun))} ` +
        `menunjukkan bahwa ${namaObjek} mengalami kesulitan dalam menarik dan mempertahankan konsumennya. `;
    }

    paragraphs.push(consumerDesc);
  } else if (consumerMode === "tidak_tersedia") {
    paragraphs.push(
      `Data jumlah konsumen ${namaObjek} juga tidak tersedia secara resmi. Berdasarkan gambaran ` +
      `lapangan yang diperoleh peneliti, terdapat indikasi bahwa pertumbuhan konsumen ${namaObjek} ` +
      `menghadapi tantangan yang memerlukan perbaikan strategi pemasaran secara menyeluruh.`
    );
  }

  // 5. Kompetitor
  if (validCompetitors.length > 0) {
    const hasEstimatedComp = validCompetitors.some((c) => c.source === "estimasi");
    const referensiNote = hasEstimatedComp
      ? `Berdasarkan pengamatan awal dan referensi yang diperoleh peneliti, `
      : `Berdasarkan observasi lapangan yang dilakukan peneliti, `;

    let compDesc = referensiNote +
      `terdapat beberapa usaha sejenis di wilayah ${lokasi || "sekitar"} yang menawarkan produk serupa ` +
      `sehingga persaingan usaha semakin meningkat. `;
    compDesc += `Beberapa kompetitor yang teridentifikasi antara lain ${competitorNames}. `;
    compDesc += `Kehadiran para pesaing ini memberikan tekanan kompetitif yang signifikan bagi ${namaObjek}, `;
    compDesc += `sehingga mendorong perusahaan untuk terus berinovasi dan meningkatkan strategi pemasarannya. `;
    compDesc += `Persaingan harga dan kualitas produk menjadi salah satu faktor yang perlu diperhatikan `;
    compDesc += `agar ${namaObjek} tetap kompetitif di pasar.`;
    if (hasEstimatedComp) {
      compDesc += ` (Catatan: Data kompetitor bersifat referensi awal. Pastikan dilakukan pengecekan ulang sebelum digunakan dalam skripsi.)`;
    }
    paragraphs.push(compDesc);
  }

  // 6. Fenomena
  if (fenomenaLines.length > 0) {
    let fenDesc = `Berdasarkan observasi dan wawancara awal yang dilakukan peneliti, terdapat beberapa fenomena ` +
      `yang menjadi permasalahan utama di ${namaObjek}. `;
    fenDesc += `Fenomena-fenomena tersebut antara lain: ${fenomenaLines.join("; ")}. `;
    fenDesc += `Kondisi ini menunjukkan bahwa ${namaObjek} perlu melakukan evaluasi dan perbaikan secara `;
    fenDesc += `menyeluruh terhadap strategi bisnisnya untuk mengatasi permasalahan yang ada.`;
    paragraphs.push(fenDesc);
  }

  // 7. Variabel X1
  if (x1) {
    paragraphs.push(
      `Salah satu faktor yang diduga mempengaruhi ${y || "variabel dependen"} adalah ${x1}. ` +
      `${x1} merupakan salah satu elemen penting dalam strategi pemasaran yang memiliki pengaruh langsung ` +
      `terhadap perilaku konsumen. Menurut berbagai penelitian terdahulu, ${x1} terbukti memiliki hubungan ` +
      `yang signifikan dengan ${y || "keputusan konsumen"}. Konsumen cenderung mempertimbangkan aspek ${x1} ` +
      `sebelum membuat keputusan pembelian, sehingga kemampuan ${namaObjek} dalam mengelola ${x1} dengan baik ` +
      `akan berdampak positif terhadap ${y || "perilaku pembelian konsumen"}.`
    );
  }

  // 8. Variabel X2
  if (x2) {
    paragraphs.push(
      `Selain ${x1 || "variabel pertama"}, faktor ${x2} juga menjadi variabel yang tidak kalah penting dalam ` +
      `mempengaruhi ${y || "variabel dependen"}. ` +
      `${x2} yang dilakukan secara tepat dan efektif dapat meningkatkan kesadaran dan minat konsumen ` +
      `terhadap produk yang ditawarkan. Dalam konteks ${namaObjek}, ${x2} memegang peranan strategis ` +
      `dalam upaya menarik konsumen baru sekaligus mempertahankan loyalitas konsumen yang sudah ada. ` +
      `Penelitian-penelitian sebelumnya menunjukkan bahwa ${x2} berpengaruh positif dan signifikan ` +
      `terhadap ${y || "keputusan pembelian"}, sehingga perlu mendapat perhatian lebih dari pihak manajemen.`
    );
  }

  // 9. Variabel Y
  if (y) {
    paragraphs.push(
      `${y} merupakan variabel dependen yang menjadi fokus utama dalam penelitian ini. ` +
      `${y} konsumen dipengaruhi oleh berbagai faktor, baik internal maupun eksternal. ` +
      `Dalam konteks penelitian ini, ${y} di ${namaObjek} dipengaruhi oleh ${x1 || "faktor pertama"} ` +
      `dan ${x2 || "faktor kedua"} yang menjadi variabel independen. ` +
      `Pemahaman yang mendalam tentang faktor-faktor yang mempengaruhi ${y} akan membantu ` +
      `${namaObjek} dalam merancang strategi yang lebih efektif untuk meningkatkan kinerja bisnisnya.`
    );
  }

  // 10. Penutup — use buildObjectLabel to avoid duplicate location in title
  const objectLabel = buildObjectLabel(namaObjek, lokasi);
  paragraphs.push(
    `Berdasarkan latar belakang permasalahan yang telah diuraikan di atas, peneliti tertarik untuk ` +
    `melakukan penelitian dengan judul: ` +
    `"Pengaruh ${x1 || "Variabel X1"} dan ${x2 || "Variabel X2"} Terhadap ${y || "Variabel Y"} ` +
    `Pada ${objectLabel}." ` +
    `Penelitian ini diharapkan dapat memberikan kontribusi nyata bagi pengembangan ilmu manajemen ` +
    `pemasaran, khususnya dalam memahami faktor-faktor yang mempengaruhi ${y || "perilaku konsumen"} ` +
    `pada ${jenisUsaha || "usaha"}${lokasi ? " di " + lokasi : ""}.`
  );

  return paragraphs.join("\n\n");
}

// ─── Manfaat Penelitian generator ─────────────────────────────────────────────

export function generateManfaatPenelitian(bab1: Bab1State, thesis: ThesisState): string {
  const { namaObjek, jenisUsaha } = bab1;
  const { x1, x2, y } = thesis;

  const items = [
    {
      pihak: "Bagi Peneliti",
      manfaat:
        `Penelitian ini bermanfaat untuk menambah wawasan dan pengetahuan peneliti dalam bidang manajemen ` +
        `pemasaran, khususnya mengenai pengaruh ${x1 || "variabel X1"} dan ${x2 || "variabel X2"} ` +
        `terhadap ${y || "variabel Y"}, serta merupakan salah satu syarat untuk memperoleh gelar Sarjana ` +
        `Manajemen di Universitas Pamulang.`,
    },
    {
      pihak: "Bagi Perusahaan",
      manfaat:
        `Hasil penelitian ini diharapkan dapat memberikan masukan dan rekomendasi yang bermanfaat bagi ` +
        `${namaObjek} sebagai ${jenisUsaha || "pelaku usaha"} dalam merumuskan strategi pemasaran yang ` +
        `lebih efektif, terutama dalam mengelola ${x1 || "variabel X1"} dan ${x2 || "variabel X2"} ` +
        `guna meningkatkan ${y || "kinerja bisnis"}.`,
    },
    {
      pihak: "Bagi Akademisi",
      manfaat:
        `Penelitian ini diharapkan dapat menjadi referensi dan bahan kajian bagi peneliti selanjutnya ` +
        `yang akan melakukan penelitian serupa mengenai ${x1 || "variabel X1"}, ${x2 || "variabel X2"}, ` +
        `dan ${y || "variabel Y"}, serta memperkaya khazanah ilmu pengetahuan di bidang manajemen pemasaran.`,
    },
    {
      pihak: "Bagi Pembaca",
      manfaat:
        `Penelitian ini diharapkan dapat menambah pengetahuan dan pemahaman pembaca mengenai faktor-faktor ` +
        `yang mempengaruhi ${y || "perilaku konsumen"}, khususnya dalam konteks ${jenisUsaha || "usaha"}, ` +
        `sehingga dapat dijadikan bahan pertimbangan dalam pengambilan keputusan yang lebih baik.`,
    },
  ];

  return items.map((item) => `**${item.pihak}**\n${item.manfaat}`).join("\n\n");
}

export { pct, keterangan, formatNumber };
