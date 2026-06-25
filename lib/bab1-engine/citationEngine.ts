/**
 * Academic Citation Engine (V2.1 Polish)
 *
 * Paragraph structure per variable theory bridge:
 *   1. Context analysis — state the problem from the data
 *   2. Academic framing — introduce the concept in academic language
 *   3. Theory + citation — integrate author naturally into the sentence
 *   4. Extension — add depth, not just a definition
 *   5. Application & conclusion — connect back to research object and y
 *
 * Theory is an ANALYTICAL TOOL, not a dictionary.
 */

import { getCitationFor, getTwoCitations } from "./authorMapping";

export interface BridgeParagraph {
  varName: string;
  text: string;
}

// ─── Transition Phrase Pools ──────────────────────────────────────────────────

const CONTEXT_OPENERS_X1 = [
  (obj: string, var1: string) =>
    `Kondisi yang dialami ${obj} sebagaimana diuraikan di atas tidak dapat dipisahkan dari bagaimana ${var1} dikelola dan dimanfaatkan dalam strategi pemasarannya.`,
  (obj: string, var1: string) =>
    `Permasalahan yang teridentifikasi pada ${obj} membawa perhatian pada peran strategis ${var1} sebagai salah satu faktor penentu dalam upaya meningkatkan kinerja pemasaran.`,
  (obj: string, var1: string) =>
    `Mencermati fenomena yang terjadi, kajian mengenai ${var1} menjadi titik penting yang perlu mendapat perhatian lebih mendalam dalam konteks ${obj}.`,
];

const CONTEXT_OPENERS_X2 = [
  (var2: string, y: string) =>
    `Selain variabel yang telah dibahas sebelumnya, terdapat faktor lain yang juga memiliki pengaruh signifikan terhadap ${y || "keputusan konsumen"}, yaitu ${var2}.`,
  (var2: string, y: string) =>
    `Dalam kerangka penelitian ini, ${var2} diposisikan sebagai variabel independen kedua yang diperkirakan turut berkontribusi secara nyata terhadap ${y || "keputusan konsumen"}.`,
  (var2: string, y: string) =>
    `Kajian komprehensif mengenai faktor-faktor yang mempengaruhi ${y || "keputusan konsumen"} tidak dapat mengabaikan peran ${var2} sebagai instrumen pemasaran yang memiliki daya jangkau luas.`,
];

const CONTEXT_OPENERS_Y = [
  (y: string) =>
    `Muara dari seluruh strategi pemasaran yang diterapkan suatu perusahaan pada akhirnya dapat diukur dari tingkat ${y || "keputusan pembelian"} yang diraih.`,
  (y: string) =>
    `${y || "Keputusan konsumen"} merupakan variabel yang menjadi fokus utama dalam penelitian ini, sekaligus menjadi tolok ukur keberhasilan strategi pemasaran yang diterapkan.`,
  (y: string) =>
    `Pada akhirnya, efektivitas seluruh upaya pemasaran yang telah diuraikan di atas bermuara pada satu variabel kunci, yaitu ${y || "keputusan pembelian"} konsumen.`,
];

// ─── Academic Framing per Topic ───────────────────────────────────────────────

function getAcademicFraming(vLower: string, varName: string): string {
  if (/influencer/.test(vLower))
    return `Dalam kerangka pemasaran modern, ${varName} merupakan strategi komunikasi yang memanfaatkan kredibilitas dan jangkauan sosial seorang individu berpengaruh untuk mempromosikan produk atau merek kepada audiens yang relevan.`;
  if (/media.?sosial|social.?media/.test(vLower))
    return `Dalam ekosistem pemasaran digital, ${varName} telah bertransformasi menjadi salah satu kanal komunikasi paling efektif yang menghubungkan merek dengan konsumen secara langsung dan interaktif.`;
  if (/harga|price/.test(vLower))
    return `Dalam bauran pemasaran, ${varName} merupakan elemen yang secara langsung mempengaruhi persepsi nilai konsumen dan pada saat yang sama menjadi satu-satunya unsur yang menghasilkan pendapatan bagi perusahaan.`;
  if (/kualitas.?produk|product.?quality/.test(vLower))
    return `Kualitas produk menjadi fondasi utama yang membentuk persepsi dan kepercayaan konsumen terhadap suatu merek, di mana konsistensi kualitas yang terjaga akan menciptakan loyalitas yang sulit digoyahkan oleh persaingan harga semata.`;
  if (/kualitas.?layanan|pelayanan|service/.test(vLower))
    return `Kualitas pelayanan berfungsi sebagai pembeda utama dalam industri yang produknya cenderung homogen, di mana pengalaman konsumen selama proses layanan berlangsung seringkali lebih berkesan daripada produk itu sendiri.`;
  if (/brand|merek|citra/.test(vLower))
    return `Citra merek yang terbangun dalam benak konsumen merupakan aset strategis jangka panjang yang tidak hanya mendorong keputusan pembelian, tetapi juga membentuk loyalitas yang membuat konsumen tahan terhadap penawaran dari kompetitor.`;
  if (/promosi/.test(vLower))
    return `Promosi dalam konteks manajemen pemasaran berfungsi tidak hanya sebagai alat untuk menginformasikan keberadaan produk, tetapi juga sebagai instrumen strategis untuk membentuk persepsi, membangun preferensi, dan pada akhirnya mendorong tindakan pembelian.`;
  if (/loyalitas/.test(vLower))
    return `Loyalitas konsumen merupakan kondisi psikologis dan perilaku di mana konsumen memiliki kecenderungan untuk terus memilih produk atau merek yang sama secara berulang, bahkan ketika dihadapkan pada alternatif yang kompetitif.`;
  if (/kepuasan/.test(vLower))
    return `Kepuasan konsumen dipahami sebagai kondisi evaluatif purna beli di mana pengalaman aktual yang diterima konsumen sesuai atau melampaui ekspektasi awal yang terbentuk sebelum melakukan pembelian.`;
  if (/keputusan.?pembelian|purchase|minat.?beli/.test(vLower))
    return `Keputusan pembelian merupakan puncak dari proses kognitif dan afektif yang dilalui konsumen dalam mengevaluasi alternatif yang tersedia dan pada akhirnya memilih satu pilihan yang dianggap paling memenuhi kebutuhannya.`;
  return `${varName} dalam perspektif manajemen pemasaran modern merupakan salah satu variabel strategis yang memiliki pengaruh signifikan terhadap perilaku dan keputusan konsumen di pasar.`;
}

// ─── Extension Sentences ──────────────────────────────────────────────────────

function getExtension(vLower: string, citation: string): string {
  if (/influencer/.test(vLower))
    return `${citation} menambahkan bahwa tingkat kepercayaan konsumen terhadap pesan yang disampaikan melalui influencer cenderung lebih tinggi dibandingkan iklan konvensional, karena dipersepsikan sebagai rekomendasi yang lebih autentik dan personal.`;
  if (/media.?sosial|social.?media/.test(vLower))
    return `${citation} menegaskan bahwa konten yang relevan, konsisten, dan menarik di platform media sosial terbukti mampu meningkatkan keterlibatan konsumen secara organik dan memperkuat kesadaran merek tanpa biaya yang besar.`;
  if (/harga|price/.test(vLower))
    return `${citation} mengemukakan bahwa persepsi konsumen terhadap kewajaran harga dipengaruhi tidak hanya oleh angka nominal yang tertera, tetapi juga oleh nilai yang dirasakan, perbandingan dengan kompetitor, dan konteks pembelian itu sendiri.`;
  if (/kualitas.?produk|product.?quality/.test(vLower))
    return `${citation} menggarisbawahi bahwa kualitas yang dirasakan konsumen bersifat multidimensi, mencakup aspek performa, keandalan, daya tahan, estetika, dan kesesuaian dengan kebutuhan spesifik konsumen tersebut.`;
  if (/kualitas.?layanan|pelayanan|service/.test(vLower))
    return `${citation} menegaskan bahwa gap antara harapan konsumen dan pengalaman aktual yang diterima merupakan inti dari evaluasi kualitas layanan, sehingga konsistensi layanan di setiap titik interaksi menjadi sangat krusial.`;
  if (/brand|merek|citra/.test(vLower))
    return `${citation} menjelaskan bahwa ekuitas merek yang kuat memungkinkan perusahaan untuk menetapkan harga premium, memperoleh loyalitas konsumen yang lebih besar, dan lebih mudah dalam memperkenalkan produk baru ke pasar.`;
  if (/keputusan.?pembelian|purchase|minat.?beli/.test(vLower))
    return `${citation} mengidentifikasi bahwa proses pengambilan keputusan pembelian konsumen dipengaruhi oleh kombinasi faktor internal seperti motivasi dan persepsi, serta faktor eksternal seperti stimulus pemasaran dan pengaruh sosial.`;
  return `${citation} menekankan pentingnya pemahaman yang komprehensif terhadap variabel ini sebagai dasar bagi perusahaan dalam merancang strategi pemasaran yang tepat sasaran dan terukur.`;
}

// ─── Application Sentences ────────────────────────────────────────────────────

function getApplication(vLower: string, namaObjek: string, y: string): string {
  const obj = namaObjek || "perusahaan";
  const yVar = y || "keputusan pembelian";

  if (/influencer/.test(vLower))
    return `Dengan demikian, pilihan dan pengelolaan influencer yang tepat oleh ${obj} berpotensi besar untuk memperluas jangkauan merek sekaligus mendorong peningkatan ${yVar} konsumen di pasar yang semakin kompetitif.`;
  if (/media.?sosial|social.?media/.test(vLower))
    return `Bagi ${obj}, pengelolaan konten media sosial yang strategis dan terencana dapat menjadi keunggulan kompetitif yang nyata dalam mendorong ${yVar} dan membangun komunitas konsumen yang loyal.`;
  if (/harga|price/.test(vLower))
    return `Kemampuan ${obj} dalam menetapkan harga yang dipersepsikan wajar dan kompetitif oleh konsumennya akan menjadi faktor penentu yang signifikan dalam membentuk ${yVar} di tengah ketatnya persaingan.`;
  if (/kualitas.?produk|product.?quality/.test(vLower))
    return `Investasi ${obj} pada peningkatan dan konsistensi kualitas produk akan berdampak langsung pada kepercayaan konsumen, yang pada gilirannya menjadi pendorong utama ${yVar} dan loyalitas jangka panjang.`;
  if (/kualitas.?layanan|pelayanan|service/.test(vLower))
    return `Standar pelayanan yang tinggi dan konsisten dari ${obj} akan menjadi salah satu determinan utama dalam membentuk pengalaman positif konsumen yang berujung pada ${yVar} yang lebih baik dan retensi konsumen yang lebih kuat.`;
  if (/brand|merek|citra/.test(vLower))
    return `Penguatan identitas dan reputasi merek ${obj} secara berkelanjutan akan membangun kepercayaan konsumen yang pada akhirnya tercermin dalam peningkatan ${yVar} dan pangsa pasar yang lebih luas.`;
  if (/keputusan.?pembelian|purchase|minat.?beli/.test(vLower))
    return `Pemahaman mendalam mengenai mekanisme ${yVar} konsumen akan memberikan ${obj} landasan yang kuat untuk merancang pendekatan pemasaran yang lebih personal, relevan, dan efektif.`;
  return `Kajian mendalam mengenai pengaruh variabel ini pada ${obj} diharapkan dapat memberikan wawasan strategis yang berguna bagi pengembangan kebijakan pemasaran yang lebih efektif dalam mendorong ${yVar}.`;
}

// ─── Main Theory Bridge Builder ───────────────────────────────────────────────

/**
 * Build a full 4-5 sentence theory bridge paragraph:
 * Context → Academic framing → Theory+Citation → Extension → Application & conclusion
 */
export function buildTheoryBridge(
  varName: string,
  namaObjek: string,
  y: string,
  position: "x1" | "x2" | "y" = "x1"
): BridgeParagraph {
  const entry = getCitationFor(varName);
  const vLower = varName.toLowerCase();

  // Seeded selection for varied context openers
  let seed = 0;
  for (const ch of varName + position) seed = ((seed << 5) - seed + ch.charCodeAt(0)) | 0;
  const idx = Math.abs(seed);

  let context = "";
  if (position === "x1") {
    context = CONTEXT_OPENERS_X1[idx % CONTEXT_OPENERS_X1.length](namaObjek, varName);
  } else if (position === "x2") {
    context = CONTEXT_OPENERS_X2[idx % CONTEXT_OPENERS_X2.length](varName, y);
  } else {
    context = CONTEXT_OPENERS_Y[idx % CONTEXT_OPENERS_Y.length](y);
  }

  const framing = getAcademicFraming(vLower, varName);

  // Theory sentence — citation woven into the sentence naturally
  const theory =
    `${entry.citation} mendefinisikan ${varName} sebagai ` +
    entry.fullDef
      .replace(/^[^,]+mendefinisikan[^s]*sebagai\s*/i, "")
      .replace(/^[^,]+menyatakan bahwa\s*/i, "")
      .replace(/^[^,]+menjelaskan bahwa\s*/i, "")
      .replace(/^[^,]+mengidentifikasi bahwa\s*/i, "");

  const extension = getExtension(vLower, entry.citation);
  const application = getApplication(vLower, namaObjek, y);

  const text = [context, framing, theory, extension, application].join(" ");

  return { varName, text };
}

// ─── Data to Theory Bridge ────────────────────────────────────────────────────

/**
 * Bridge from data analysis to theoretical framework.
 * Structure: [Trend implication] → [Author 1 + X1 linkage] → [Author 2 + X2 linkage] → [Synthesis]
 */
export function buildDataTheoryBridge(
  namaObjek: string,
  saleTrend: string,
  x1: string,
  x2: string,
  y: string
): string {
  const [c1, c2] = getTwoCitations(x1, x2);

  const trendImplication =
    saleTrend === "menurun"
      ? `Tren penurunan penjualan yang dialami ${namaObjek} mengindikasikan adanya gap antara apa yang ditawarkan perusahaan dengan apa yang diharapkan dan dibutuhkan oleh konsumennya. Gap tersebut perlu diidentifikasi secara ilmiah agar dapat diatasi dengan strategi yang tepat.`
      : saleTrend === "fluktuatif"
      ? `Ketidakkonsistenan pencapaian penjualan ${namaObjek} yang tercermin dalam data menunjukkan bahwa strategi pemasaran yang diterapkan belum mampu menciptakan dampak yang stabil dan berkelanjutan terhadap perilaku pembelian konsumen.`
      : saleTrend === "meningkat"
      ? `Pertumbuhan penjualan yang berhasil dicatatkan ${namaObjek} merupakan sinyal positif yang perlu dipertahankan dan diperkuat melalui strategi pemasaran yang terstruktur dan berbasis pada pemahaman mendalam tentang faktor-faktor pendorongnya.`
      : `Stabilitas penjualan yang ditunjukkan oleh data ${namaObjek} perlu dimaknai secara hati-hati, karena kondisi stabil dalam pasar yang dinamis berisiko menjadi awal dari stagnasi apabila tidak disertai dengan inovasi strategi pemasaran yang berkelanjutan.`;

  const theory1 =
    `Dalam kerangka teori manajemen pemasaran, ${c1.citation} mengemukakan bahwa kemampuan ` +
    `perusahaan dalam mempertahankan dan meningkatkan volume penjualannya sangat ditentukan oleh ` +
    `seberapa efektif strategi ${x1 || "pemasaran"} yang diterapkan dalam menyentuh kebutuhan ` +
    `dan preferensi segmen konsumen yang dituju.`;

  const theory2 =
    `Sementara itu, ${c2.citation} memperkuat argumen tersebut dengan menyatakan bahwa ` +
    `${x2 || "faktor pemasaran komplementer"} memainkan peran yang tidak kalah penting ` +
    `dalam membentuk persepsi konsumen dan mendorong terbentuknya ${y || "keputusan pembelian"} ` +
    `yang menguntungkan bagi perusahaan.`;

  const synthesis =
    `Dengan demikian, penguatan sinergi antara ${x1 || "variabel pertama"} dan ` +
    `${x2 || "variabel kedua"} dalam strategi pemasaran ${namaObjek} menjadi langkah ` +
    `yang diperlukan untuk mengoptimalkan pencapaian kinerja penjualan secara berkelanjutan.`;

  return [trendImplication, theory1, theory2, synthesis].join(" ");
}

// ─── Urgency Paragraph ────────────────────────────────────────────────────────

/**
 * Build the urgency paragraph — connects all data findings to research necessity.
 * Uses a structure: [Summary of evidence] → [Research necessity] → [Practical value] → [Academic value]
 */
export function buildUrgencyParagraph(
  namaObjek: string,
  x1: string,
  x2: string,
  y: string,
  jenisUsaha: string,
  lokasi: string
): string {
  const sectorCtx = jenisUsaha
    ? `pada sektor ${jenisUsaha}${lokasi ? ` di ${lokasi}` : ""}`
    : lokasi
    ? `di wilayah ${lokasi}`
    : "di Indonesia";

  return (
    `Beranjak dari seluruh fenomena, data, dan kajian teoretis yang telah diuraikan di atas, ` +
    `penelitian ini hadir sebagai respons terhadap kebutuhan nyata akan kajian empiris yang ` +
    `mengukur pengaruh ${x1 || "variabel X1"} dan ${x2 || "variabel X2"} terhadap ` +
    `${y || "variabel Y"} ${sectorCtx}. ` +
    `Secara praktis, temuan penelitian ini diharapkan dapat menjadi masukan strategis bagi ` +
    `pihak manajemen ${namaObjek} dalam mengalokasikan sumber daya pemasaran secara lebih ` +
    `efektif dan terukur. Secara akademis, penelitian ini berkontribusi pada pengembangan ` +
    `literatur manajemen pemasaran dengan menyajikan bukti empiris mengenai hubungan antar ` +
    `variabel yang dikaji dalam konteks ${jenisUsaha || "usaha"} yang selama ini belum ` +
    `banyak mendapat perhatian dalam penelitian terdahulu.`
  );
}
