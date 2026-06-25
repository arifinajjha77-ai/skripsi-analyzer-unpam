import { Bab1State, SalesRow, ConsumerRow, CompetitorRow, DataMode } from "./bab1Store";
import { ThesisState } from "./store";

// ─── helpers ──────────────────────────────────────────────────────────────────

function pct(target: string, realisasi: string): string {
  const t = parseFloat(target.replace(/[^\d.]/g, ""));
  const r = parseFloat(realisasi.replace(/[^\d.]/g, ""));
  if (!t || isNaN(t) || isNaN(r)) return "-";
  return ((r / t) * 100).toFixed(1) + "%";
}

function keterangan(target: string, realisasi: string): string {
  const t = parseFloat(target.replace(/[^\d.]/g, ""));
  const r = parseFloat(realisasi.replace(/[^\d.]/g, ""));
  if (isNaN(t) || isNaN(r)) return "-";
  const ratio = r / t;
  if (ratio >= 1.0) return "Tercapai";
  if (ratio >= 0.80) return "Belum Optimal";
  if (ratio >= 0.60) return "Tidak Tercapai";
  return "Rendah";
}

function formatNumber(val: string): string {
  return val.trim() || "-";
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

export function buildCompetitorTable(competitors: CompetitorRow[]): GeneratedTable {
  const headers = ["No", "Nama Kompetitor", "Produk", "Harga"];
  const rows = competitors
    .filter((c) => c.nama)
    .map((c, i) => ({
      cols: [String(i + 1), c.nama, c.produk || "-", c.harga || "-"],
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

  // Trend analysis helpers
  const lastSale = validSales[validSales.length - 1];
  const firstSale = validSales[0];
  const saleTrend = validSales.length >= 2 && lastSale && firstSale
    ? parseFloat(lastSale.realisasi.replace(/[^\d.]/g, "")) < parseFloat(firstSale.realisasi.replace(/[^\d.]/g, ""))
      ? "mengalami penurunan"
      : "mengalami peningkatan"
    : "berfluktuasi";

  const lastConsumer = validConsumers[validConsumers.length - 1];
  const firstConsumer = validConsumers[0];
  const consumerTrend = validConsumers.length >= 2 && lastConsumer && firstConsumer
    ? parseFloat(lastConsumer.realisasi.replace(/[^\d.]/g, "")) < parseFloat(firstConsumer.realisasi.replace(/[^\d.]/g, ""))
      ? "mengalami penurunan"
      : "mengalami peningkatan"
    : "berfluktuasi";

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

    const notAchieved = validSales.filter((r) => keterangan(r.target, r.realisasi) === "Tidak Tercapai");
    if (notAchieved.length > 0) {
      salesDesc += `Terdapat ${notAchieved.length} tahun di mana realisasi penjualan tidak mencapai target yang telah ditetapkan, yaitu pada tahun ${notAchieved.map((r) => r.tahun).join(" dan ")}. `;
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
    let consumerDesc = consumerMode === "estimasi"
      ? `Sejalan dengan data penjualan, data konsumen yang telah disamarkan menunjukkan tren yang ` +
        `${consumerTrend === saleTrend ? "serupa dengan data penjualan" : "berbeda dengan data penjualan"}. ` +
        `Berdasarkan estimasi yang disusun berdasarkan gambaran umum kondisi perusahaan, ` +
        `jumlah konsumen ${namaObjek} ${consumerTrend} selama periode yang sama. `
      : `Sejalan dengan data penjualan, data konsumen ${namaObjek} juga menunjukkan tren yang ` +
        `${consumerTrend === saleTrend ? "serupa" : "berbeda"}. ` +
        `Jumlah konsumen ${namaObjek} ${consumerTrend} selama periode yang sama. `;

    if (validConsumers.length >= 1) {
      const rows = validConsumers.map(
        (r) =>
          `pada tahun ${r.tahun} jumlah konsumen yang ditargetkan sebanyak ${formatNumber(r.target)} dengan realisasi ${formatNumber(r.realisasi)} (${pct(r.target, r.realisasi)})`
      );
      consumerDesc += `${rows.join("; ")}. `;
    }

    const notAchievedC = validConsumers.filter((r) => keterangan(r.target, r.realisasi) === "Tidak Tercapai");
    if (notAchievedC.length > 0) {
      consumerDesc +=
        `Pencapaian konsumen yang tidak memenuhi target pada tahun ${notAchievedC.map((r) => r.tahun).join(" dan ")} ` +
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
    let compDesc = `Tantangan yang dihadapi ${namaObjek} semakin bertambah dengan semakin banyaknya pesaing ` +
      `yang bergerak di bidang yang sama. `;
    compDesc += `Beberapa kompetitor yang diidentifikasi antara lain ${competitorNames}. `;
    compDesc += `Kehadiran para pesaing ini memberikan tekanan kompetitif yang signifikan bagi ${namaObjek}, `;
    compDesc += `sehingga mendorong perusahaan untuk terus berinovasi dan meningkatkan strategi pemasarannya. `;
    compDesc += `Persaingan harga dan kualitas produk menjadi salah satu faktor yang perlu diperhatikan `;
    compDesc += `agar ${namaObjek} tetap kompetitif di pasar.`;
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

  // 10. Penutup
  paragraphs.push(
    `Berdasarkan latar belakang permasalahan yang telah diuraikan di atas, peneliti tertarik untuk ` +
    `melakukan penelitian dengan judul: ` +
    `"Pengaruh ${x1 || "Variabel X1"} dan ${x2 || "Variabel X2"} Terhadap ${y || "Variabel Y"} ` +
    `Pada ${namaObjek}${lokasi ? " di " + lokasi : ""}." ` +
    `Penelitian ini diharapkan dapat memberikan kontribusi nyata bagi pengembangan ilmu manajemen ` +
    `pemasaran, khususnya dalam memahami faktor-faktor yang mempengaruhi ${y || "perilaku konsumen"} ` +
    `pada ${jenisUsaha || "usaha"} di ${lokasi || "Indonesia"}.`
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
