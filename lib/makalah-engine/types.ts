export interface MakalahEngineInput {
  judul: string;
  namaKampus: string;
  fakultas: string;
  programStudi: string;
  mataKuliah: string;
  namaDosen: string;
  namaMahasiswa: string;
  nim: string;
  kelas: string;
  tema: string;
  jumlahBab: number;
  targetHalaman: number;
  pedoman: string;
}

export interface MakalahSubsection {
  id: string;
  title: string;
  bullets: string[];
  content?: string;
}

export interface MakalahChapterOutline {
  id: "bab1" | "bab2" | "bab3" | "bab4" | "bab5";
  number: string;
  title: string;
  purpose: string;
  subsections: MakalahSubsection[];
}

export interface MakalahOutline {
  title: string;
  chapters: MakalahChapterOutline[];
  bibliographyPlan: string[];
  appendixPlan: string[];
}

export interface MakalahChapter {
  id: MakalahChapterOutline["id"];
  number: string;
  title: string;
  subsections: Array<MakalahSubsection & { content: string }>;
}

export interface ReviewIssue {
  type: "duplicate-paragraph" | "empty-heading" | "short-subsection" | "incomplete-structure";
  severity: "info" | "warning" | "error";
  message: string;
  location?: string;
}

export interface ReviewReport {
  passed: boolean;
  score: number;
  issues: ReviewIssue[];
}

export interface MakalahDocument {
  input: MakalahEngineInput;
  outline: MakalahOutline;
  kataPengantar: string;
  daftarIsi: string;
  chapters: MakalahChapter[];
  daftarPustaka: string[];
  lampiran: string[];
  review: ReviewReport;
  generatedWith: {
    model: string;
    fallback: boolean;
  };
}

export interface EngineResult<T> {
  data: T;
  meta: {
    model: string;
    fallback: boolean;
  };
}
