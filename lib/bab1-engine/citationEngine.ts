/**
 * Academic Citation Engine — builds full bridging theory paragraphs.
 *
 * Each paragraph follows the academic structure:
 *   [Transition sentence] → [Author theory definition] → [Application to research]
 *
 * Usage: call buildTheoryBridge(varName, namaObjek, y) to get a ready paragraph.
 */

import { getCitationFor, getTwoCitations } from "./authorMapping";

// ─── Theory Bridge Templates ──────────────────────────────────────────────────

export interface BridgeParagraph {
  varName: string;
  text: string;
}

/**
 * Build a full theory bridge paragraph for a given variable.
 * The paragraph integrates author citation naturally, not just appended.
 */
export function buildTheoryBridge(
  varName: string,
  namaObjek: string,
  y: string,
  position: "x1" | "x2" | "y" = "x1"
): BridgeParagraph {
  const entry = getCitationFor(varName);
  const vLower = varName.toLowerCase();

  // Transition phrases vary by position to avoid repetition
  const transitions = {
    x1: [
      `Fenomena yang terjadi di ${namaObjek} tersebut tidak dapat dilepaskan dari peranan ${varName} dalam membentuk perilaku konsumen.`,
      `Kondisi yang dialami oleh ${namaObjek} di atas mengindikasikan perlunya kajian lebih mendalam mengenai peran ${varName} dalam strategi pemasarannya.`,
      `Berkaitan dengan kondisi tersebut, ${varName} menjadi salah satu variabel yang perlu mendapat perhatian serius dalam konteks penelitian ini.`,
    ],
    x2: [
      `Selain ${varName}, terdapat faktor lain yang turut mempengaruhi ${y || "keputusan konsumen"} dan perlu dikaji secara mendalam.`,
      `Kajian terhadap faktor-faktor yang mempengaruhi ${y || "keputusan konsumen"} tidak dapat terlepas dari pembahasan mengenai ${varName}.`,
      `Lebih jauh, penelitian ini juga menempatkan ${varName} sebagai variabel penting yang diperkirakan memiliki pengaruh signifikan terhadap ${y || "keputusan konsumen"}.`,
    ],
    y: [
      `Pada akhirnya, seluruh faktor yang telah diuraikan di atas bermuara pada ${varName} sebagai variabel yang menjadi fokus utama penelitian ini.`,
      `Dampak dari berbagai faktor pemasaran yang telah dibahas tersebut termanifestasi dalam bentuk ${varName} konsumen yang menjadi indikator keberhasilan strategi pemasaran.`,
      `Variabel ${varName} menjadi titik konvergensi dari berbagai strategi pemasaran yang diterapkan oleh perusahaan.`,
    ],
  };

  const transPool = transitions[position];
  let transHash = 0;
  for (const ch of varName) transHash = ((transHash << 5) - transHash + ch.charCodeAt(0)) | 0;
  const transition = transPool[Math.abs(transHash) % transPool.length];

  // Build the theory paragraph
  let text = `${transition} ${entry.fullDef} `;

  // Application sentence
  if (vLower.includes("influencer")) {
    text += `Dalam konteks ${namaObjek}, pemanfaatan influencer sebagai media komunikasi pemasaran diharapkan dapat meningkatkan jangkauan merek dan mendorong ${y || "keputusan pembelian"} konsumen secara lebih efektif.`;
  } else if (vLower.includes("media sosial") || vLower.includes("social media")) {
    text += `Pengelolaan media sosial yang strategis oleh ${namaObjek} diharapkan mampu menciptakan kesadaran merek dan meningkatkan ${y || "keputusan pembelian"} pada segmen konsumen yang aktif secara digital.`;
  } else if (vLower.includes("harga") || vLower.includes("price")) {
    text += `Penetapan harga yang tepat dan kompetitif oleh ${namaObjek} diperkirakan akan memberikan dampak yang signifikan terhadap ${y || "keputusan pembelian"} konsumen, terutama pada segmen yang sensitif terhadap harga.`;
  } else if (vLower.includes("kualitas")) {
    text += `Dengan demikian, kualitas yang dirasakan oleh konsumen ${namaObjek} diperkirakan memiliki peran yang signifikan dalam membentuk ${y || "keputusan pembelian"} dan loyalitas jangka panjang.`;
  } else if (vLower.includes("pelayanan") || vLower.includes("layanan")) {
    text += `Oleh karena itu, peningkatan kualitas pelayanan yang berkelanjutan menjadi salah satu prioritas yang perlu diperhatikan oleh ${namaObjek} dalam upayanya meningkatkan ${y || "kepuasan konsumen"}.`;
  } else if (vLower.includes("brand") || vLower.includes("merek")) {
    text += `Dengan membangun citra merek yang positif, ${namaObjek} diharapkan dapat meningkatkan kepercayaan konsumen yang pada akhirnya akan mendorong ${y || "keputusan pembelian"} secara berkelanjutan.`;
  } else if (vLower.includes("promosi")) {
    text += `Efektivitas promosi yang dilakukan oleh ${namaObjek} diperkirakan berperan penting dalam menarik perhatian konsumen baru dan mendorong ${y || "keputusan pembelian"} secara signifikan.`;
  } else {
    text += `Oleh karena itu, kajian mengenai ${varName} dalam konteks ${namaObjek} menjadi relevan dan diperlukan untuk memahami pengaruhnya terhadap ${y || "keputusan konsumen"}.`;
  }

  return { varName, text };
}

/**
 * Build a data-to-theory bridge that appears after sales/consumer data presentation.
 * This creates natural flow: Data → Analysis → Theory.
 */
export function buildDataTheoryBridge(
  namaObjek: string,
  saleTrend: string,
  x1: string,
  x2: string,
  y: string
): string {
  const [c1, c2] = getTwoCitations(x1, x2);

  const trendAnalysis =
    saleTrend === "menurun"
      ? `penurunan kinerja penjualan yang terjadi`
      : saleTrend === "fluktuatif"
      ? `fluktuasi kinerja penjualan yang tidak konsisten`
      : saleTrend === "meningkat"
      ? `pertumbuhan penjualan yang menunjukkan tren positif`
      : `kinerja penjualan yang relatif stabil`;

  return (
    `Mencermati ${trendAnalysis} di ${namaObjek} sebagaimana ditampilkan pada data di atas, ` +
    `diperlukan kajian yang lebih mendalam untuk mengidentifikasi faktor-faktor yang berkontribusi ` +
    `terhadap kondisi tersebut. Menurut ${c1.citation}, keberhasilan suatu perusahaan dalam ` +
    `mencapai target penjualannya sangat dipengaruhi oleh ketepatan strategi pemasaran yang ` +
    `diterapkan, termasuk di antaranya efektivitas ${x1 || "variabel pemasaran pertama"} ` +
    `yang menjadi salah satu instrumen kunci dalam komunikasi dengan konsumen. Sejalan dengan ` +
    `hal tersebut, ${c2.citation} menegaskan bahwa ${x2 || "faktor pemasaran lainnya"} ` +
    `juga memegang peranan penting dalam membentuk persepsi dan preferensi konsumen yang ` +
    `pada akhirnya bermuara pada ${y || "keputusan pembelian"}.`
  );
}

/**
 * Build an urgency paragraph — explains why this specific research is important.
 */
export function buildUrgencyParagraph(
  namaObjek: string,
  x1: string,
  x2: string,
  y: string,
  jenisUsaha: string,
  lokasi: string
): string {
  return (
    `Berdasarkan paparan fenomena dan data empiris yang telah diuraikan di atas, terdapat urgensi ` +
    `yang nyata untuk melakukan penelitian yang secara spesifik mengkaji pengaruh ${x1 || "variabel X1"} ` +
    `dan ${x2 || "variabel X2"} terhadap ${y || "variabel Y"} pada ${namaObjek}. ` +
    `Penelitian ini tidak hanya bermakna secara teoritis sebagai kontribusi pada pengembangan ilmu ` +
    `manajemen pemasaran, tetapi juga memiliki nilai praktis yang tinggi bagi ${namaObjek} sebagai ` +
    `pelaku usaha di bidang ${jenisUsaha || "pemasaran"}${lokasi ? " yang beroperasi di " + lokasi : ""}. ` +
    `Hasil penelitian diharapkan dapat menjadi landasan ilmiah bagi perumusan strategi pemasaran ` +
    `yang lebih efektif dan berbasis data, sehingga ${namaObjek} dapat meningkatkan daya saingnya ` +
    `secara berkelanjutan.`
  );
}
