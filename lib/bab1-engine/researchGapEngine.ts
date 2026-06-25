/**
 * Research Gap Engine — automatically constructs a "Meskipun… Namun… Oleh karena itu…"
 * research gap paragraph based on data trends, variables, and context.
 *
 * Structure:
 *   1. Meskipun [existing conditions / prior research]
 *   2. Namun [problem / gap found]
 *   3. Oleh karena itu / Dengan demikian [this research is needed]
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

// ─── Clause Builders ─────────────────────────────────────────────────────────

function buildMeskipunClause(
  namaObjek: string,
  saleTrend: TrendKey,
  x1: string,
  x2: string
): string {
  if (saleTrend === "meningkat") {
    return (
      `Meskipun ${namaObjek} telah berhasil mencatatkan pertumbuhan penjualan dalam beberapa ` +
      `periode terakhir, serta telah menerapkan berbagai upaya pemasaran yang mencakup strategi ` +
      `${x1 || "pemasaran"} dan ${x2 || "promosi"}, `
    );
  }
  if (saleTrend === "stabil") {
    return (
      `Meskipun ${namaObjek} mampu mempertahankan stabilitas kinerja penjualannya dan telah ` +
      `menjalankan berbagai inisiatif pemasaran melalui optimalisasi ${x1 || "variabel pemasaran"} ` +
      `dan ${x2 || "strategi promosi"}, `
    );
  }
  // menurun or fluktuatif
  return (
    `Meskipun ${namaObjek} telah berupaya menerapkan berbagai strategi pemasaran yang melibatkan ` +
    `${x1 || "berbagai instrumen pemasaran"} dan ${x2 || "kegiatan promosi"} untuk mendorong ` +
    `pertumbuhan bisnisnya, `
  );
}

function buildNamunClause(
  namaObjek: string,
  saleTrend: TrendKey,
  consumerTrend: TrendKey,
  x1: string,
  x2: string,
  y: string,
  hasCompetitors: boolean
): string {
  const salesProblem =
    saleTrend === "menurun" || saleTrend === "fluktuatif"
      ? `pencapaian target penjualan yang belum konsisten menunjukkan adanya permasalahan yang ` +
        `memerlukan identifikasi lebih lanjut. `
      : `upaya untuk mempertahankan momentum pertumbuhan secara berkelanjutan tetap menjadi ` +
        `tantangan yang tidak dapat diabaikan. `;

  const consumerProblem =
    consumerTrend === "menurun" || consumerTrend === "fluktuatif"
      ? `Fluktuasi jumlah konsumen yang tercatat dalam data menunjukkan bahwa loyalitas dan ` +
        `minat konsumen terhadap produk ${namaObjek} belum sepenuhnya terbentuk dengan kuat. `
      : ``;

  const competitorPressure = hasCompetitors
    ? `Tekanan dari kompetitor yang semakin agresif dalam memanfaatkan berbagai kanal pemasaran ` +
      `turut mempersempit ruang gerak ${namaObjek} dalam mempertahankan pangsa pasarnya. `
    : ``;

  const gapSentence =
    `Belum tersedianya kajian ilmiah yang secara spesifik menguji pengaruh ${x1 || "variabel X1"} ` +
    `dan ${x2 || "variabel X2"} terhadap ${y || "variabel Y"} dalam konteks ` +
    `${namaObjek} menjadikan penelitian ini relevan dan perlu untuk dilakukan.`;

  return `namun ${salesProblem}${consumerProblem}${competitorPressure}${gapSentence}`;
}

function buildOlehKarenaItuClause(
  namaObjek: string,
  x1: string,
  x2: string,
  y: string,
  jenisUsaha: string,
  lokasi: string
): string {
  return (
    `Oleh karena itu, penelitian yang mengkaji secara empiris pengaruh ${x1 || "variabel X1"} ` +
    `dan ${x2 || "variabel X2"} terhadap ${y || "variabel Y"} pada ${namaObjek} sangat ` +
    `diperlukan sebagai landasan ilmiah yang dapat digunakan oleh pihak manajemen dalam ` +
    `merumuskan strategi pemasaran yang lebih efektif. Penelitian ini diharapkan mampu mengisi ` +
    `kesenjangan penelitian yang ada dan memberikan kontribusi nyata bagi pengembangan ilmu ` +
    `manajemen pemasaran, khususnya dalam konteks ${jenisUsaha || "usaha"}` +
    `${lokasi ? " di " + lokasi : " di Indonesia"}.`
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

/**
 * Build a complete research gap paragraph in academic Meskipun–Namun–Oleh karena itu structure.
 */
export function buildResearchGap(input: ResearchGapInput): string {
  const { namaObjek, jenisUsaha, lokasi, x1, x2, y, saleTrend, consumerTrend, hasCompetitors } =
    input;

  const meskipun = buildMeskipunClause(namaObjek, saleTrend, x1, x2);
  const namun = buildNamunClause(namaObjek, saleTrend, consumerTrend, x1, x2, y, hasCompetitors);
  const olehKarenaItu = buildOlehKarenaItuClause(namaObjek, x1, x2, y, jenisUsaha, lokasi);

  return `${meskipun}${namun}\n\n${olehKarenaItu}`;
}
