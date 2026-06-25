/**
 * Research Gap Engine (V2.1 Polish)
 *
 * Produces a TWO-PARAGRAPH research gap:
 *
 * Para 1 — Academic landscape & gap identification:
 *   Sejumlah penelitian terdahulu… [specific sectors that have been studied]
 *   Namun, kajian pada sektor [jenisUsaha] di [lokasi] masih terbatas…
 *   Kombinasi [x1] dan [x2] terhadap [y] dalam konteks ini belum banyak diteliti…
 *
 * Para 2 — Why this specific research matters:
 *   Kesenjangan tersebut menjadi relevan mengingat [data evidence]…
 *   Dengan demikian, penelitian ini hadir untuk mengisi gap tersebut…
 */

export type TrendKey = "meningkat" | "menurun" | "fluktuatif" | "stabil";

export interface ResearchGapInput {
  namaObjek: string;
  jenisUsaha: string;
  lokasi: string;
  x1: string;
  x2: string;
  y: string;
  saleTrend: TrendKey;
  consumerTrend: TrendKey;
  hasCompetitors: boolean;
  hasFenomena: boolean;
}

// ─── Prior Research Context ───────────────────────────────────────────────────

/** Returns a plausible description of sectors where similar research has been done. */
function getPriorResearchContext(jenisUsaha: string, x1: string, x2: string, y: string): string {
  const combo = `${x1} ${x2} ${y}`.toLowerCase();
  const usaha = jenisUsaha.toLowerCase();

  if (/influencer|media.?sosial|digital/.test(combo)) {
    return (
      `Penelitian mengenai pengaruh strategi pemasaran digital, khususnya yang melibatkan ` +
      `${x1 || "pemasaran digital"} dan ${x2 || "media sosial"} terhadap ${y || "keputusan pembelian"}, ` +
      `telah banyak dilakukan pada sektor e-commerce, fashion, dan produk kecantikan. ` +
      `Beberapa penelitian juga telah mengkaji konteks usaha makanan dan minuman (F&B) ` +
      `serta produk elektronik konsumen.`
    );
  }
  if (/harga|price/.test(combo)) {
    return (
      `Kajian mengenai pengaruh ${x1 || "harga"} dan ${x2 || "promosi"} terhadap ` +
      `${y || "keputusan pembelian"} telah cukup banyak dilakukan dalam konteks sektor ritel ` +
      `modern, supermarket, dan platform belanja online. ` +
      `Penelitian serupa pada sektor jasa dan usaha kecil menengah (UKM) juga mulai ` +
      `berkembang dalam beberapa tahun terakhir.`
    );
  }
  if (/kualitas|quality/.test(combo)) {
    return (
      `Tema penelitian mengenai kualitas produk atau kualitas layanan dan dampaknya terhadap ` +
      `${y || "kepuasan konsumen"} telah banyak diteliti di sektor perhotelan, perbankan, ` +
      `dan layanan kesehatan. ` +
      `Studi pada sektor ritel dan jasa konsumer juga telah menghasilkan sejumlah temuan ` +
      `yang relevan di berbagai negara, termasuk Indonesia.`
    );
  }
  if (/pelayanan|service/.test(combo)) {
    return (
      `Penelitian yang mengkaji dimensi kualitas pelayanan dan pengaruhnya terhadap ` +
      `${y || "kepuasan pelanggan"} telah banyak dilakukan pada sektor perbankan, ` +
      `telekomunikasi, dan transportasi online. ` +
      `Namun, temuan dari sektor-sektor tersebut tidak serta merta dapat digeneralisasikan ` +
      `pada jenis usaha yang memiliki karakteristik layanan yang berbeda.`
    );
  }

  // Generic prior research context based on jenisUsaha
  if (/kuliner|makanan|f.b|restoran|kafe|cafe/.test(usaha)) {
    return (
      `Penelitian mengenai pengaruh ${x1 || "strategi pemasaran"} dan ${x2 || "promosi"} ` +
      `terhadap ${y || "keputusan pembelian"} telah cukup banyak dilakukan pada bisnis ` +
      `kuliner berskala besar seperti restoran waralaba dan kafe premium. ` +
      `Sementara kajian pada usaha kuliner berskala kecil dan menengah (UKM) yang beroperasi ` +
      `secara lokal masih relatif terbatas dalam literatur akademik Indonesia.`
    );
  }
  if (/fashion|pakaian|busana|konveksi/.test(usaha)) {
    return (
      `Industri fashion menjadi salah satu sektor yang cukup banyak diteliti dalam kaitannya ` +
      `dengan pengaruh ${x1 || "pemasaran digital"} terhadap ${y || "keputusan pembelian"}, ` +
      `terutama pada merek-merek ternama yang beroperasi secara nasional. ` +
      `Namun, penelitian yang berfokus pada usaha fashion lokal dan independen yang beroperasi ` +
      `di tingkat kota atau kabupaten masih sangat terbatas jumlahnya.`
    );
  }

  return (
    `Sejumlah penelitian terdahulu telah mengkaji pengaruh ${x1 || "variabel X1"} dan ` +
    `${x2 || "variabel X2"} terhadap ${y || "variabel Y"} pada berbagai sektor industri, ` +
    `di antaranya sektor perbankan, ritel, pendidikan, dan kesehatan. ` +
    `Temuan dari penelitian-penelitian tersebut secara konsisten menunjukkan adanya hubungan ` +
    `yang signifikan antara variabel-variabel tersebut, meskipun besaran dan arah pengaruhnya ` +
    `bervariasi tergantung pada konteks industri dan karakteristik konsumen yang diteliti.`
  );
}

// ─── Gap Identification ───────────────────────────────────────────────────────

function buildGapIdentification(
  jenisUsaha: string,
  lokasi: string,
  x1: string,
  x2: string,
  y: string
): string {
  const sectorStr = jenisUsaha ? `sektor ${jenisUsaha}` : "sektor yang diteliti";
  const lokStr = lokasi ? ` yang beroperasi di wilayah ${lokasi}` : "";

  return (
    `Namun demikian, kajian yang secara spesifik mengeksplorasi pengaruh ${x1 || "variabel X1"} ` +
    `dan ${x2 || "variabel X2"} terhadap ${y || "variabel Y"} pada ${sectorStr}${lokStr} ` +
    `masih sangat terbatas. ` +
    `Sebagian besar penelitian terdahulu berfokus pada pelaku usaha berskala nasional atau ` +
    `pada segmen pasar yang karakteristiknya berbeda secara signifikan dengan konteks yang ` +
    `diteliti dalam penelitian ini. ` +
    `Kesenjangan ini menjadi penting untuk diisi, mengingat perilaku konsumen dan dinamika ` +
    `persaingan pada ${sectorStr} memiliki kekhasan tersendiri yang tidak dapat ` +
    `digeneralisasikan dari hasil penelitian pada sektor lain.`
  );
}

// ─── Evidence from Data ───────────────────────────────────────────────────────

function buildDataEvidence(
  namaObjek: string,
  saleTrend: TrendKey,
  consumerTrend: TrendKey,
  hasCompetitors: boolean,
  hasFenomena: boolean
): string {
  const salesDesc =
    saleTrend === "menurun"
      ? `penurunan realisasi penjualan yang terjadi secara konsisten`
      : saleTrend === "fluktuatif"
      ? `ketidakkonsistenan pencapaian target penjualan`
      : saleTrend === "meningkat"
      ? `pertumbuhan penjualan yang perlu terus dipertahankan`
      : `kestabilan penjualan yang berpotensi mengalami stagnasi`;

  const consumerDesc =
    consumerTrend === "menurun" || consumerTrend === "fluktuatif"
      ? ` disertai dengan fluktuasi pertumbuhan konsumen`
      : consumerTrend === "meningkat"
      ? ` yang diiringi tren positif pertumbuhan konsumen`
      : ``;

  const competitorDesc = hasCompetitors
    ? ` serta intensitas persaingan dari kompetitor yang terus meningkat di segmen yang sama`
    : ``;

  const fenDesc = hasFenomena
    ? ` yang diperkuat oleh fenomena lapangan yang teridentifikasi melalui observasi dan wawancara awal`
    : ``;

  return (
    `Relevansi penelitian ini semakin menguat jika mempertimbangkan kondisi empiris yang ` +
    `ditemukan pada ${namaObjek}, yakni ${salesDesc}${consumerDesc}${competitorDesc}${fenDesc}. ` +
    `Kondisi-kondisi tersebut memerlukan landasan empiris yang kuat untuk dapat dianalisis ` +
    `secara akademis dan ditindaklanjuti secara strategis oleh pihak yang berkepentingan.`
  );
}

// ─── Closing Oleh Karena Itu ──────────────────────────────────────────────────

function buildResearchNecessity(
  namaObjek: string,
  x1: string,
  x2: string,
  y: string,
  jenisUsaha: string,
  lokasi: string
): string {
  const sectorStr = jenisUsaha ? `dalam konteks ${jenisUsaha}` : "dalam konteks usaha ini";
  const lokStr = lokasi ? ` di ${lokasi}` : " di Indonesia";

  return (
    `Berdasarkan identifikasi kesenjangan penelitian dan fenomena empiris yang telah diuraikan, ` +
    `penelitian yang mengkaji secara spesifik pengaruh ${x1 || "variabel X1"} dan ` +
    `${x2 || "variabel X2"} terhadap ${y || "variabel Y"} pada ${namaObjek} menjadi ` +
    `sangat relevan dan mendesak untuk dilakukan. ` +
    `Penelitian ini diharapkan mampu mengisi kesenjangan literatur ${sectorStr}${lokStr}, ` +
    `sekaligus memberikan kontribusi praktis berupa rekomendasi berbasis data bagi pihak ` +
    `manajemen dalam merumuskan kebijakan pemasaran yang lebih adaptif terhadap dinamika ` +
    `kebutuhan konsumen dan tekanan kompetitif yang dihadapi.`
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

/**
 * Build a sector-specific, evidence-backed research gap — two paragraphs.
 */
export function buildResearchGap(input: ResearchGapInput): string {
  const {
    namaObjek, jenisUsaha, lokasi, x1, x2, y,
    saleTrend, consumerTrend, hasCompetitors, hasFenomena,
  } = input;

  const priorResearch = getPriorResearchContext(jenisUsaha, x1, x2, y);
  const gapId        = buildGapIdentification(jenisUsaha, lokasi, x1, x2, y);
  const evidence     = buildDataEvidence(namaObjek, saleTrend, consumerTrend, hasCompetitors, hasFenomena);
  const necessity    = buildResearchNecessity(namaObjek, x1, x2, y, jenisUsaha, lokasi);

  // Paragraph 1: Prior research context + gap identification
  const para1 = `${priorResearch} ${gapId}`;

  // Paragraph 2: Data evidence + research necessity
  const para2 = `${evidence} ${necessity}`;

  return `${para1}\n\n${para2}`;
}
