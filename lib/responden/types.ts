export interface RespondenRow {
  [key: string]: string | number;
}

export interface DetectedColumns {
  nama: string | null;
  jenisKelamin: string | null;
  usia: string | null;
  pekerjaan: string | null;
  pendidikan: string | null;
  email: string | null;
  timestamp: string | null;
  x1Items: string[];
  x2Items: string[];
  yItems: string[];
  otherItems: string[];
}

export interface FreqRow {
  kategori: string;
  frekuensi: number;
  persentase: string;
}

export interface KarakteristikResult {
  jenisKelamin: FreqRow[];
  usia: FreqRow[];
  pendidikan: FreqRow[];
  pekerjaan: FreqRow[];
}

// ─── Quality Check ──────────────────────────────────────────────────────────

export type SeverityLevel = "error" | "warning" | "info";

export interface QualityIssue {
  type: "missing" | "duplicate" | "consistency" | "demographic";
  severity: SeverityLevel;
  respondent?: number;      // row index (1-based)
  respondentName?: string;
  column?: string;
  message: string;
}

export interface QualityReport {
  totalResponden: number;
  totalItems: number;
  totalVariables: number;
  completeResponden: number;        // no missing in item cols
  completenessPercent: number;
  issues: QualityIssue[];
  cleanRowIndices: number[];        // 0-based indices of rows with no missing
}
