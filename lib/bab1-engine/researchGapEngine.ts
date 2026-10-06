/** Research gap draft. Claims about prior studies require verified literature. */
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
  hasSalesData?: boolean;
  hasConsumerData?: boolean;
}

export function buildResearchGap(input: ResearchGapInput): string {
  const { namaObjek, jenisUsaha, lokasi, x1, x2, y } = input;
  const context = `${jenisUsaha || "usaha"}${lokasi ? ` di ${lokasi}` : ""}`;
  const literature =
    `Kajian pengaruh ${x1 || "variabel X1"} dan ${x2 || "variabel X2"} terhadap ` +
    `${y || "variabel Y"} pada ${namaObjek} memerlukan perbandingan dengan penelitian terdahulu. ` +
    `Kesenjangan penelitian perlu dirumuskan berdasarkan sumber yang telah ditelaah, dengan ` +
    `membandingkan variabel, metode, objek, serta temuan dalam konteks ${context}. ` +
    `Keterbatasan jumlah kajian atau perbedaan hasil belum dapat dinyatakan tanpa bukti dari tinjauan literatur.`;
  const evidence: string[] = [];
  if (input.hasSalesData) evidence.push(`data penjualan dengan pola ${input.saleTrend}`);
  if (input.hasConsumerData) evidence.push(`data jumlah konsumen dengan pola ${input.consumerTrend}`);
  if (input.hasCompetitors) evidence.push("informasi kompetitor yang dicatat");
  if (input.hasFenomena) evidence.push("fenomena yang dicatat dalam rancangan penelitian");
  const data = evidence.length
    ? `Pembahasan kondisi ${namaObjek} dapat menggunakan ${evidence.join(", ")}, dengan memeriksa sumber dan keterbatasannya. `
    : `Masalah atau tren tertentu pada ${namaObjek} belum dapat disimpulkan sebelum tersedia data empiris yang memadai. `;
  return `${literature}\n\n${data}` +
    `Penelitian direncanakan untuk menguji hubungan antarvariabel berdasarkan data yang dikumpulkan. ` +
    `Hasilnya diharapkan memberi masukan bagi ${namaObjek} serta memperkaya kajian dalam konteks ${context}.`;
}
