/** Bibliographic editions checked against publisher/library catalogues.
 * Do not update a year without replacing it with a verified edition. */
export interface AuthorEntry {
  citation: string;
  fullDef: string;
  discipline: string[];
  bibliography?: string;
  sourceUrl?: string;
}

export const AUTHOR_DB: AuthorEntry[] = [
  {
    citation: "Kotler & Keller (2016)",
    fullDef: "Menurut Kotler dan Keller (2016), manajemen pemasaran berkaitan dengan pemilihan pasar sasaran serta penciptaan, penyampaian, dan komunikasi nilai kepada pelanggan.",
    discipline: ["pemasaran", "marketing", "harga", "price", "produk", "kualitas", "pelayanan", "layanan", "kepuasan", "loyalitas", "merek", "brand", "promosi", "keputusan pembelian", "minat beli"],
    bibliography: "Kotler, P., & Keller, K. L. (2016). Marketing management (15th ed.). Boston: Pearson.",
    sourceUrl: "https://www.pearson.com/en-us/subject-catalog/p/Kotler-Marketing-Management-15th-Edition/P200000007478?view=educator",
  },
  {
    citation: "Tuten & Solomon (2018)",
    fullDef: "Menurut Tuten dan Solomon (2018), pemasaran melalui media sosial mencakup perencanaan strategi, pelaksanaan kegiatan, dan pengukuran pemanfaatan platform sosial untuk mendukung tujuan pemasaran.",
    discipline: ["media sosial", "social media", "instagram", "tiktok", "youtube", "facebook", "influencer", "konten kreator", "endorser"],
    bibliography: "Tuten, T. L., & Solomon, M. R. (2018). Social media marketing (3rd ed.). Los Angeles: SAGE.",
    sourceUrl: "https://uk.sagepub.com/sites/default/files/upm-assets/89036_book_item_89036.pdf",
  },
  {
    citation: "Chaffey & Ellis-Chadwick (2019)",
    fullDef: "Menurut Chaffey dan Ellis-Chadwick (2019), pemasaran digital memerlukan perencanaan strategi, pelaksanaan, dan evaluasi pemanfaatan teknologi digital dalam kegiatan pemasaran.",
    discipline: ["digital marketing", "pemasaran digital", "online marketing", "e-marketing", "media digital", "seo", "e-commerce"],
    bibliography: "Chaffey, D., & Ellis-Chadwick, F. (2019). Digital marketing (7th ed.). Harlow: Pearson.",
    sourceUrl: "https://library.fra.ac.uk/bib/36828",
  },
];

function currentReferences(year = new Date().getFullYear()): AuthorEntry[] {
  return AUTHOR_DB.filter((entry) => {
    const published = Number(entry.citation.match(/\((\d{4})\)/)?.[1]);
    return year - published >= 0 && year - published <= 10;
  });
}

export function getCitationFor(topic: string): AuthorEntry {
  const t = topic.trim().toLowerCase();
  let best: AuthorEntry | undefined;
  let score = 0;
  for (const entry of currentReferences()) {
    const match = entry.discipline.filter(tag => t.includes(tag)).reduce((sum, tag) => sum + tag.length, 0);
    if (match > score) { score = match; best = entry; }
  }
  return best || { citation: "", fullDef: `Landasan teori mengenai ${topic} perlu dilengkapi dengan sumber yang relevan dan terverifikasi.`, discipline: [] };
}

export function getCitationTag(topic: string): string {
  const entry = getCitationFor(topic);
  const match = entry.citation.match(/^(.+) \((\d{4})\)$/);
  return match ? `(${match[1]}, ${match[2]})` : "";
}

/** Keep each variable's relevant source; repetition does not justify an unrelated citation. */
export function getTwoCitations(topic1: string, topic2: string): [AuthorEntry, AuthorEntry] {
  return [getCitationFor(topic1), getCitationFor(topic2)];
}

export function getBab1References(topics: string[]): string[] {
  return [...new Set(topics.map(topic => getCitationFor(topic).bibliography).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, "id"));
}
