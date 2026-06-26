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
  mode: MakalahGenerationMode;
  assignmentAnalysis?: AssignmentAnalysis | null;
}

export type MakalahGenerationMode = "fast" | "complete";

export type AssignmentDeliverableType =
  | "proposal"
  | "weekly_report"
  | "final_report"
  | "presentation"
  | "makalah"
  | "other";

export type AssignmentAnalysis = {
  title: string;
  course?: string;
  deadline?: string;
  summaryForStudent: string;
  requiredDeliverables: Array<{
    name: string;
    type: AssignmentDeliverableType;
    description: string;
    estimatedPages?: number;
    requiredSections: string[];
    priority: "high" | "medium" | "low";
  }>;
  writingRules: {
    font?: string;
    fontSize?: number;
    spacing?: string;
    margin?: string;
    citationStyle?: string;
    languageStyle?: string;
  };
  gradingRubric: Array<{
    aspect: string;
    weight?: string;
    description?: string;
  }>;
  timelineRequirements: string[];
  missingInfoQuestions: string[];
  suggestedWorkflow: Array<{
    step: number;
    title: string;
    description: string;
  }>;
};

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
  type:
    | "duplicate-paragraph"
    | "empty-heading"
    | "short-subsection"
    | "incomplete-structure"
    | "misaligned-objectives"
    | "conclusion-mismatch"
    | "generic-sentences";
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
