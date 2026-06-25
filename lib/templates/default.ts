import type { CampusTemplate } from "./types";

/** Generic default — Times New Roman, 2cm margins, APA7 */
export const defaultTemplate: CampusTemplate = {
  id: "default",
  nama: "Kampus Default",
  namaFakultas: "Fakultas Ekonomi dan Bisnis",
  font: "Times New Roman",
  fontSize: 12,
  lineSpacingMultiple: 1.5,
  marginCm: { top: 3, right: 3, bottom: 3, left: 4 },
  paragraphIndentCm: 1.25,
  headingBabFormat: "BAB {ROM}",
  headingSubbabFormat: "{NUM}.{SUB}",
  nomorBab: "romawi",
  nomorTabel: "arab",
  nomorGambar: "arab",
  captionTabelPosition: "atas",
  captionGambarPosition: "bawah",
  captionTabelFormat: "Tabel {BAB}.{NUM}",
  captionGambarFormat: "Gambar {BAB}.{NUM}",
  spacingBeforeHeadingPt: 12,
  spacingAfterHeadingPt: 6,
  halamanAwal: "romawi",
  halamanIsi: "arab",
  daftarPustakaGaya: "APA7",
  sitasiGaya: "APA",
};
