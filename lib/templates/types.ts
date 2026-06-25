export interface CampusTemplate {
  id: string;
  nama: string;
  namaFakultas: string;
  // Typography
  font: string;
  fontSize: number;          // pt
  lineSpacingMultiple: number;
  // Margins (cm)
  marginCm: { top: number; right: number; bottom: number; left: number };
  paragraphIndentCm: number;
  // Headings
  headingBabFormat: string;    // "BAB {ROM}" → "BAB I"
  headingSubbabFormat: string; // "{NUM}.{SUB}" → "1.1"
  nomorBab: "romawi" | "arab";
  // Tables & Figures
  nomorTabel: "arab";
  nomorGambar: "arab";
  captionTabelPosition: "atas" | "bawah";
  captionGambarPosition: "atas" | "bawah";
  captionTabelFormat: string;  // "Tabel {BAB}.{NUM}"
  captionGambarFormat: string; // "Gambar {BAB}.{NUM}"
  // Spacing
  spacingBeforeHeadingPt: number;
  spacingAfterHeadingPt: number;
  // Page numbering
  halamanAwal: "romawi" | "arab";
  halamanIsi: "romawi" | "arab";
  // References
  daftarPustakaGaya: "APA7" | "APA6";
  sitasiGaya: "APA" | "Chicago";
}
