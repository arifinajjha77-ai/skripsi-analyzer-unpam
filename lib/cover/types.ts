/**
 * SmartCampus — Cover Builder Types
 *
 * Shared types for the Academic Cover Builder system.
 * Used by templates, logo store, quality checker, DOCX exporter, and UI.
 */

// ─── Cover Data ───────────────────────────────────────────────────────────────

export type UniversityMode = "registered" | "custom";

export interface PenyusunItem {
  nim: string;
  nama: string;
}

export interface CoverData {
  universityMode: UniversityMode;
  universityId: string;       // "unpam" | "ugm" | "ui" | ... | "custom"
  universitas: string;
  fakultas: string;
  programStudi: string;
  mataKuliah: string;
  namaDosen: string;
  judul: string;
  kelompok: string;
  penyusun: PenyusunItem[];
  kota: string;
  tahun: string;
  logoUrl?: string;            // base64 data URL (custom upload or override)
}

// ─── University Registry ──────────────────────────────────────────────────────

export interface UniversityInfo {
  id: string;
  name: string;
  shortName: string;
  city: string;
  province: string;
  logoPath?: string;           // /path relative to /public
  templateId: string;          // which template to use
  faculty?: string;            // default faculty (if applicable)
  prefillFields?: Partial<CoverData>;
}

// ─── University Template ──────────────────────────────────────────────────────

export type CoverLayoutItem =
  | "logo"
  | "universitas"
  | "fakultas"
  | "programStudi"
  | "divider"
  | "label_makalah"
  | "judul"
  | "spacer"
  | "penyusun_label"
  | "penyusun_list"
  | "kelompok"
  | "mata_kuliah_label"
  | "dosen_label"
  | "kota_tahun";

export interface UniversityTemplate {
  id: string;
  name: string;
  // Document margins (in twip; 1440 = 1 inch ≈ 2.54 cm)
  margins: { top: number; right: number; bottom: number; left: number };
  // Typography
  fontTitle: string;
  fontBody: string;
  titleSizePt: number;      // points for title
  bodySizePt: number;       // points for body text
  // Title formatting
  titleUppercase: boolean;
  titleBold: boolean;
  // Logo
  logoSizeCm: number;
  logoAlignment: "center" | "left";
  // Layout
  showDividerLine: boolean;
  dividerColor: string;
  layout: CoverLayoutItem[];
}

// ─── Cover Quality ────────────────────────────────────────────────────────────

export type CoverCheckStatus = "pass" | "warn" | "missing";

export interface CoverCheck {
  id: string;
  label: string;
  status: CoverCheckStatus;
  hint?: string;
}

export interface CoverQualityReport {
  checks: CoverCheck[];
  passCount: number;
  missingCount: number;
  isComplete: boolean;
}
