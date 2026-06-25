import { Bab1State, SalesRow, ConsumerRow, CompetitorRow, DataMode } from "./bab1Store";
import { ThesisState } from "./store";
import { selectOpening } from "@/lib/bab1-engine/openingEngine";
import { buildTheoryBridge, buildDataTheoryBridge, buildUrgencyParagraph } from "@/lib/bab1-engine/citationEngine";
import { buildResearchGap as buildResearchGapEngine } from "@/lib/bab1-engine/researchGapEngine";

// Re-export engine types so callers don't need to import from two places
export type { QualityItem } from "@/lib/bab1-engine/qualityChecker";
export { checkBab1Quality } from "@/lib/bab1-engine/qualityChecker";

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
  const filtered    = competitors.filter((c) => c.nama);
  const hasSource   = filtered.some((c) => c.source && c.source !== "manual");
  const hasMedia    = filtered.some((c) => c.mediaProposi && c.mediaProposi.trim());

  const headers: string[] = ["No", "Nama Kompetitor", "Produk/Jasa", "Rentang Harga"];
  if (hasMedia)  headers.push("Media Promosi");
  if (hasSource) headers.push("Sumber");

  const rows = filtered.map((c, i) => {
    const cols = [String(i + 1), c.nama, c.produk || "-", c.harga || "Harga belum tersedia"];
    if (hasMedia)  cols.push(c.mediaProposi?.trim() || "-");
    if (hasSource) cols.push(SOURCE_LABEL_MAP[c.source ?? "manual"] ?? "-");
    return { cols };
  });

  return { headers, rows, caption: "Daftar Kompetitor" };
}

// ─── Company reference rotation (Reduce Repetition Engine) ────────────────────

/** Rotate company references to avoid repeating the full name. */
function varRef(namaObjek: string, n: number): string {
  const refs = [
    namaObjek,
    "perusahaan",
    "objek penelitian",
    "usaha tersebut",
    "pelaku usaha",
    namaObjek,
    "perusahaan yang diteliti",
    "pihak manajemen",
  ];
  return refs[Math.abs(n) % refs.length];
}


// ─── Latar Belakang text generator (V2.0 Academic Writing Engine) ─────────────

const TREND_LABEL: Record<string, string> = {
  meningkat:  "mengalami peningkatan",
  menurun:    "mengalami penurunan",
  fluktuatif: "mengalami fluktuasi",
  stabil:     "relatif stabil",
};

export function generateLatarBelakang(bab1: Bab1State, thesis: ThesisState): string {
  const { namaObjek, jenisUsaha, lokasi, salesData, consumerData, competitors, fenomena } = bab1;
  const { x1, x2, y } = thesis;

  const salesMode    = bab1.salesDataMode    ?? "asli";
  const consumerMode = bab1.consumerDataMode ?? "asli";

  const validSales = salesMode === "tidak_tersedia"
    ? []
    : salesData.filter((r) => r.tahun && r.target && r.realisasi);
  const validConsumers = consumerMode === "tidak_tersedia"
    ? []
    : consumerData.filter((r) => r.tahun && r.target && r.realisasi);
  const validCompetitors = competitors.filter((c) => c.nama);

  // Trend analysis
  const salesValues    = validSales.map((r) => parseIDNumber(r.realisasi)).filter((v) => !isNaN(v));
  const consumerValues = validConsumers.map((r) => parseIDNumber(r.realisasi)).filter((v) => !isNaN(v));
  const saleTrendKey    = detectTrend(salesValues);
  const consumerTrendKey = detectTrend(consumerValues);
  const saleTrend    = TREND_LABEL[saleTrendKey];
  const consumerTrend = TREND_LABEL[consumerTrendKey];

  const salesPeriod = validSales.length >= 2
    ? `${validSales[0].tahun} hingga ${validSales[validSales.length - 1].tahun}`
    : validSales[0]?.tahun ?? "";
  const competitorNames = validCompetitors.map((c) => c.nama).join(", ");
  const fenomenaLines = fenomena.split("\n").map((l) => l.trim()).filter(Boolean);

  const paragraphs: string[] = [];
  let refN = 0;

  // ── 1. FENOMENA UMUM — context-aware opening (never "Di era persaingan...") ──
  paragraphs.push(selectOpening(x1, x2, y, jenisUsaha));

  // ── 2. GAMBARAN OBJEK PENELITIAN ──────────────────────────────────────────────
  paragraphs.push(
    `${namaObjek} merupakan ${jenisUsaha || "usaha"} yang berlokasi di ${lokasi || "wilayah Indonesia"}. ` +
    `Sebagai salah satu pelaku usaha di bidang ini, ${varRef(namaObjek, ++refN)} berkomitmen untuk ` +
    `memberikan produk dan layanan yang berkualitas kepada konsumennya. Dalam menjalankan kegiatan ` +
    `operasionalnya, ${varRef(namaObjek, ++refN)} menghadapi berbagai tantangan yang tidak terlepas ` +
    `dari dinamika persaingan yang semakin ketat dan perubahan perilaku konsumen yang terus berkembang. ` +
    `Untuk dapat mempertahankan dan meningkatkan daya saingnya, ${varRef(namaObjek, ++refN)} perlu ` +
    `memahami secara mendalam faktor-faktor yang mempengaruhi ${y || "keputusan konsumen"} dalam ` +
    `memilih produk atau jasa yang ditawarkan.`
  );

  // ── 3. DATA PENDUKUNG PENJUALAN ───────────────────────────────────────────────
  if (validSales.length > 0) {
    let salesDesc = salesMode === "estimasi"
      ? `Berdasarkan data penjualan ${varRef(namaObjek, ++refN)} yang telah disamarkan guna ` +
        `menjaga kerahasiaan informasi perusahaan, gambaran kondisi penjualan pada periode ` +
        `${salesPeriod} menunjukkan bahwa realisasi penjualan ${saleTrend} dari tahun ke tahun. ` +
        `(Catatan: Data merupakan estimasi yang disusun berdasarkan gambaran umum kondisi perusahaan.) `
      : `Berdasarkan data penjualan ${varRef(namaObjek, ++refN)} pada periode ${salesPeriod}, ` +
        `realisasi penjualan tercatat ${saleTrend} dari tahun ke tahun. `;

    const rows = validSales.map(
      (r) =>
        `pada tahun ${r.tahun} dengan target ${formatNumber(r.target)} dan realisasi ` +
        `${formatNumber(r.realisasi)} atau sebesar ${pct(r.target, r.realisasi)}`
    );
    salesDesc += `Secara rinci, ${rows.join("; ")}. `;

    // ── 4. ANALISIS DATA PENJUALAN ────────────────────────────────────────────
    const notAchieved = validSales.filter((r) => {
      const kt = keterangan(r.target, r.realisasi);
      return kt === "Tidak Tercapai" || kt === "Belum Optimal" || kt === "Rendah";
    });
    const achieved = validSales.filter((r) => keterangan(r.target, r.realisasi) === "Tercapai");

    if (notAchieved.length > 0 && notAchieved.length >= achieved.length) {
      salesDesc +=
        `Terdapat ${notAchieved.length} periode di mana realisasi penjualan belum memenuhi ` +
        `target yang telah ditetapkan, yaitu pada tahun ` +
        `${formatYearList(notAchieved.map((r) => r.tahun))}. ` +
        `Kondisi ini mengindikasikan adanya permasalahan mendasar yang perlu mendapat perhatian ` +
        `serius dari ${varRef(namaObjek, ++refN)} dalam upayanya meningkatkan kinerja penjualan. `;
    } else if (achieved.length > 0 && achieved.length > notAchieved.length) {
      salesDesc +=
        `Secara umum, ${varRef(namaObjek, ++refN)} berhasil mencapai target penjualan pada ` +
        `sebagian besar periode yang diamati, meskipun masih terdapat ruang untuk peningkatan ` +
        `lebih lanjut guna mempertahankan momentum pertumbuhan yang ada. `;
    }

    salesDesc += `Data penjualan tersebut disajikan secara lengkap pada tabel di bawah ini.`;
    paragraphs.push(salesDesc);
  } else if (salesMode === "tidak_tersedia") {
    paragraphs.push(
      `Data penjualan ${namaObjek} tidak dapat disajikan secara rinci mengingat keterbatasan ` +
      `aksesibilitas informasi dari pihak ${varRef(namaObjek, ++refN)}. Namun, berdasarkan ` +
      `observasi dan informasi yang diperoleh peneliti di lapangan, terdapat indikasi bahwa ` +
      `kinerja penjualan ${varRef(namaObjek, ++refN)} menghadapi tantangan yang memerlukan ` +
      `evaluasi mendalam terhadap faktor-faktor yang mempengaruhi ${y || "keputusan konsumen"}.`
    );
  }

  // ── 5. PENGUATAN TEORI — DATA TO THEORY BRIDGE ───────────────────────────────
  if (validSales.length >= 1 || salesMode === "tidak_tersedia") {
    paragraphs.push(
      buildDataTheoryBridge(namaObjek, saleTrend, x1, x2, y)
    );
  }

  // ── 6. DATA KONSUMEN ──────────────────────────────────────────────────────────
  if (validConsumers.length > 0) {
    const consumerTrendSimilar = consumerTrendKey === saleTrendKey;
    const transitionWord = consumerTrendSimilar
      ? "Sejalan dengan data penjualan tersebut"
      : "Sementara itu, apabila dicermati dari sisi jumlah konsumen";

    let consumerDesc = consumerMode === "estimasi"
      ? `${transitionWord}, data konsumen ${varRef(namaObjek, ++refN)} yang telah diestimasi ` +
        `menunjukkan jumlah konsumen yang ${consumerTrend} dalam periode yang sama. ` +
        `(Catatan: Data merupakan estimasi berdasarkan gambaran umum kondisi perusahaan.) `
      : `${transitionWord}, jumlah konsumen ${varRef(namaObjek, ++refN)} juga menunjukkan ` +
        `tren yang ${consumerTrend} dalam periode yang diamati. `;

    const rows = validConsumers.map(
      (r) =>
        `pada tahun ${r.tahun} jumlah konsumen yang ditargetkan sebanyak ${formatNumber(r.target)} ` +
        `dengan realisasi ${formatNumber(r.realisasi)} (${pct(r.target, r.realisasi)})`
    );
    consumerDesc += `Secara rinci, ${rows.join("; ")}. `;

    const notAchievedC = validConsumers.filter((r) => {
      const kt = keterangan(r.target, r.realisasi);
      return kt === "Tidak Tercapai" || kt === "Belum Optimal" || kt === "Rendah";
    });
    if (notAchievedC.length > 0) {
      consumerDesc +=
        `Realisasi jumlah konsumen yang belum memenuhi target pada tahun ` +
        `${formatYearList(notAchievedC.map((r) => r.tahun))} menunjukkan bahwa ` +
        `${varRef(namaObjek, ++refN)} masih menghadapi kendala dalam menarik dan ` +
        `mempertahankan basis konsumennya secara konsisten. `;
    }

    consumerDesc += `Data konsumen tersebut disajikan pada tabel berikut.`;
    paragraphs.push(consumerDesc);
  } else if (consumerMode === "tidak_tersedia") {
    paragraphs.push(
      `Data jumlah konsumen ${namaObjek} juga tidak tersedia secara resmi. Berdasarkan ` +
      `pengamatan langsung di lapangan, terdapat indikasi bahwa pertumbuhan konsumen ` +
      `${varRef(namaObjek, ++refN)} menghadapi tantangan yang memerlukan perbaikan ` +
      `strategi pemasaran secara menyeluruh.`
    );
  }

  // ── 7. KOMPETITOR ─────────────────────────────────────────────────────────────
  if (validCompetitors.length > 0) {
    const hasEstimatedComp = validCompetitors.some((c) => c.source === "estimasi" || c.source === "google" || c.source === "marketplace");
    const referensiNote = hasEstimatedComp
      ? `Berdasarkan pengamatan awal dan data referensi yang diperoleh peneliti`
      : `Berdasarkan observasi lapangan yang dilakukan peneliti`;

    let compDesc =
      `${referensiNote}, terdapat sejumlah usaha sejenis yang beroperasi di wilayah ` +
      `${lokasi || "yang sama"} dan menawarkan produk atau jasa yang serupa dengan ` +
      `${varRef(namaObjek, ++refN)}, sehingga tingkat persaingan usaha di segmen ini ` +
      `dapat dikategorikan cukup tinggi. `;
    compDesc +=
      `Beberapa kompetitor yang teridentifikasi antara lain ${competitorNames}. ` +
      `Kehadiran para pesaing ini menciptakan tekanan kompetitif yang mendorong ` +
      `${varRef(namaObjek, ++refN)} untuk terus berinovasi dan mengoptimalkan ` +
      `strategi pemasarannya agar tetap dapat mempertahankan pangsa pasar. `;
    compDesc +=
      `Persaingan yang terjadi tidak hanya pada aspek harga, tetapi juga pada dimensi ` +
      `kualitas produk, kecepatan layanan, dan efektivitas promosi yang dijalankan ` +
      `oleh masing-masing pelaku usaha.`;
    if (hasEstimatedComp) {
      compDesc +=
        ` (Catatan: Sebagian data kompetitor bersifat referensi awal dan perlu diverifikasi lebih lanjut.)`;
    }
    paragraphs.push(compDesc);
  }

  // ── 8. FENOMENA OBJEK PENELITIAN (observasi/wawancara) ───────────────────────
  if (fenomenaLines.length > 0) {
    let fenDesc =
      `Selain data kuantitatif yang telah dipaparkan di atas, peneliti juga melakukan ` +
      `observasi awal dan wawancara pendahuluan untuk memperoleh gambaran yang lebih ` +
      `komprehensif mengenai kondisi ${varRef(namaObjek, ++refN)}. ` +
      `Dari hasil observasi tersebut, ditemukan beberapa fenomena yang menjadi ` +
      `permasalahan utama, antara lain: ${fenomenaLines.join("; ")}. `;
    fenDesc +=
      `Fenomena-fenomena tersebut mengindikasikan bahwa ${varRef(namaObjek, ++refN)} ` +
      `perlu melakukan evaluasi strategis yang lebih mendalam untuk mengidentifikasi ` +
      `akar permasalahan dan merancang langkah-langkah perbaikan yang terstruktur.`;
    paragraphs.push(fenDesc);
  }

  // ── 9. HUBUNGAN DENGAN VARIABEL X1 (Theory Bridge) ────────────────────────────
  if (x1) {
    paragraphs.push(buildTheoryBridge(x1, namaObjek, y, "x1").text);
  }

  // ── 10. HUBUNGAN DENGAN VARIABEL X2 (Theory Bridge) ───────────────────────────
  if (x2) {
    paragraphs.push(buildTheoryBridge(x2, namaObjek, y, "x2").text);
  }

  // ── 11. HUBUNGAN DENGAN VARIABEL Y (Dependen) ─────────────────────────────────
  if (y) {
    paragraphs.push(buildTheoryBridge(y, namaObjek, y, "y").text);
  }

  // ── 12. RESEARCH GAP (Meskipun... Namun... Oleh karena itu...) ───────────────
  paragraphs.push(
    buildResearchGapEngine({
      namaObjek,
      jenisUsaha,
      lokasi,
      x1,
      x2,
      y,
      saleTrend: saleTrendKey,
      consumerTrend: consumerTrendKey,
      hasCompetitors: validCompetitors.length > 0,
      hasFenomena: fenomenaLines.length > 0,
    })
  );

  // ── 13. URGENSI PENELITIAN ─────────────────────────────────────────────────────
  paragraphs.push(buildUrgencyParagraph(namaObjek, x1, x2, y, jenisUsaha, lokasi));

  // ── 14. PENUTUP + JUDUL PENELITIAN ────────────────────────────────────────────
  const objectLabel = buildObjectLabel(namaObjek, lokasi);
  paragraphs.push(
    `Berdasarkan uraian latar belakang permasalahan yang telah dipaparkan di atas, maka ` +
    `peneliti mengajukan penelitian dengan judul: ` +
    `"Pengaruh ${x1 || "Variabel X1"} dan ${x2 || "Variabel X2"} Terhadap ` +
    `${y || "Variabel Y"} Pada ${objectLabel}."`
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
