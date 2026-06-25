/**
 * SmartCampus — University Template Engine
 *
 * Registry of supported universities + their cover templates.
 * Adding a new university = add an entry to REGISTERED_UNIVERSITIES.
 * If no specific template exists, falls back to GENERIC_TEMPLATE.
 *
 * Templates are purposely modular so they can be extended (or split into
 * individual files like templates/unpam.ts, templates/ugm.ts) later.
 */

import { UniversityInfo, UniversityTemplate, CoverData } from "./types";
import { convertInchesToTwip } from "docx";

// ─── Utility ──────────────────────────────────────────────────────────────────

const CM = (cm: number) => convertInchesToTwip(cm / 2.54);

// ─── Built-in Templates ───────────────────────────────────────────────────────

/** UNPAM Standard Cover (4cm left, 3cm others, TNR, uppercase title) */
const UNPAM_TEMPLATE: UniversityTemplate = {
  id: "unpam",
  name: "UNPAM Standard",
  margins: { top: CM(3), right: CM(3), bottom: CM(3), left: CM(4) },
  fontTitle: "Times New Roman",
  fontBody:  "Times New Roman",
  titleSizePt: 12,
  bodySizePt:  12,
  titleUppercase: true,
  titleBold: true,
  logoSizeCm: 3,
  logoAlignment: "center",
  showDividerLine: false,
  dividerColor: "000000",
  layout: [
    "universitas", "fakultas", "programStudi",
    "logo",
    "label_makalah",
    "judul",
    "spacer",
    "penyusun_label", "penyusun_list", "kelompok",
    "spacer",
    "mata_kuliah_label", "dosen_label",
    "spacer",
    "kota_tahun",
  ],
};

/** Generic Indonesian academic cover (used as fallback for most universities) */
const GENERIC_TEMPLATE: UniversityTemplate = {
  id: "generic",
  name: "Standar Indonesia",
  margins: { top: CM(3), right: CM(3), bottom: CM(3), left: CM(4) },
  fontTitle: "Times New Roman",
  fontBody:  "Times New Roman",
  titleSizePt: 12,
  bodySizePt:  12,
  titleUppercase: true,
  titleBold: true,
  logoSizeCm: 3,
  logoAlignment: "center",
  showDividerLine: false,
  dividerColor: "000000",
  layout: [
    "logo",
    "universitas", "fakultas", "programStudi",
    "label_makalah",
    "judul",
    "spacer",
    "penyusun_label", "penyusun_list", "kelompok",
    "spacer",
    "mata_kuliah_label", "dosen_label",
    "spacer",
    "kota_tahun",
  ],
};

/** Custom university (user uploads logo, no built-in styling) */
export const CUSTOM_TEMPLATE: UniversityTemplate = {
  ...GENERIC_TEMPLATE,
  id: "custom",
  name: "Custom / Lainnya",
};

// ─── Template Registry ────────────────────────────────────────────────────────

const TEMPLATE_REGISTRY: Record<string, UniversityTemplate> = {
  unpam:   UNPAM_TEMPLATE,
  generic: GENERIC_TEMPLATE,
  custom:  CUSTOM_TEMPLATE,
};

export function getTemplate(templateId: string): UniversityTemplate {
  return TEMPLATE_REGISTRY[templateId] ?? GENERIC_TEMPLATE;
}

// ─── University Registry ──────────────────────────────────────────────────────

export const REGISTERED_UNIVERSITIES: UniversityInfo[] = [
  {
    id: "unpam",
    name: "Universitas Pamulang",
    shortName: "UNPAM",
    city: "Tangerang Selatan",
    province: "Banten",
    logoPath: "/logo-unpam.png",
    templateId: "unpam",
    prefillFields: { kota: "Tangerang Selatan" },
  },
  {
    id: "ui",
    name: "Universitas Indonesia",
    shortName: "UI",
    city: "Depok",
    province: "Jawa Barat",
    templateId: "generic",
    prefillFields: { kota: "Depok" },
  },
  {
    id: "ugm",
    name: "Universitas Gadjah Mada",
    shortName: "UGM",
    city: "Yogyakarta",
    province: "DI Yogyakarta",
    templateId: "generic",
    prefillFields: { kota: "Yogyakarta" },
  },
  {
    id: "unj",
    name: "Universitas Negeri Jakarta",
    shortName: "UNJ",
    city: "Jakarta",
    province: "DKI Jakarta",
    templateId: "generic",
    prefillFields: { kota: "Jakarta" },
  },
  {
    id: "its",
    name: "Institut Teknologi Sepuluh Nopember",
    shortName: "ITS",
    city: "Surabaya",
    province: "Jawa Timur",
    templateId: "generic",
    prefillFields: { kota: "Surabaya" },
  },
  {
    id: "uny",
    name: "Universitas Negeri Yogyakarta",
    shortName: "UNY",
    city: "Yogyakarta",
    province: "DI Yogyakarta",
    templateId: "generic",
    prefillFields: { kota: "Yogyakarta" },
  },
  {
    id: "undip",
    name: "Universitas Diponegoro",
    shortName: "UNDIP",
    city: "Semarang",
    province: "Jawa Tengah",
    templateId: "generic",
    prefillFields: { kota: "Semarang" },
  },
  {
    id: "unair",
    name: "Universitas Airlangga",
    shortName: "UNAIR",
    city: "Surabaya",
    province: "Jawa Timur",
    templateId: "generic",
    prefillFields: { kota: "Surabaya" },
  },
  {
    id: "upi",
    name: "Universitas Pendidikan Indonesia",
    shortName: "UPI",
    city: "Bandung",
    province: "Jawa Barat",
    templateId: "generic",
    prefillFields: { kota: "Bandung" },
  },
  {
    id: "unpad",
    name: "Universitas Padjadjaran",
    shortName: "UNPAD",
    city: "Bandung",
    province: "Jawa Barat",
    templateId: "generic",
    prefillFields: { kota: "Bandung" },
  },
  {
    id: "ipb",
    name: "Institut Pertanian Bogor",
    shortName: "IPB",
    city: "Bogor",
    province: "Jawa Barat",
    templateId: "generic",
    prefillFields: { kota: "Bogor" },
  },
  {
    id: "ubinus",
    name: "Universitas Bina Nusantara",
    shortName: "BINUS",
    city: "Jakarta",
    province: "DKI Jakarta",
    templateId: "generic",
    prefillFields: { kota: "Jakarta" },
  },
  {
    id: "ubd",
    name: "Universitas Bakrie",
    shortName: "UB",
    city: "Jakarta",
    province: "DKI Jakarta",
    templateId: "generic",
    prefillFields: { kota: "Jakarta" },
  },
  {
    id: "telkom",
    name: "Universitas Telkom",
    shortName: "Tel-U",
    city: "Bandung",
    province: "Jawa Barat",
    templateId: "generic",
    prefillFields: { kota: "Bandung" },
  },
  {
    id: "mercubuana",
    name: "Universitas Mercu Buana",
    shortName: "UMB",
    city: "Jakarta",
    province: "DKI Jakarta",
    templateId: "generic",
    prefillFields: { kota: "Jakarta" },
  },
];

export function getUniversityInfo(id: string): UniversityInfo | undefined {
  return REGISTERED_UNIVERSITIES.find((u) => u.id === id);
}

/** Prefill CoverData from a registered university */
export function prefillFromUniversity(
  current: CoverData,
  universityId: string
): Partial<CoverData> {
  const info = getUniversityInfo(universityId);
  if (!info) return {};
  return {
    universitas: info.name,
    kota: info.city,
    ...(info.prefillFields ?? {}),
    universityId,
    universityMode: "registered",
    logoUrl: undefined, // will use built-in logo
  };
}
