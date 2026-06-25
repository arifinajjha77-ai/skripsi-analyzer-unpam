import type { CampusTemplate } from "./types";
import { unpamTemplate } from "./unpam";
import { defaultTemplate } from "./default";

export type { CampusTemplate };

// ── Registry ────────────────────────────────────────────────────────────────

export const TEMPLATE_REGISTRY: Record<string, CampusTemplate> = {
  unpam: unpamTemplate,
  default: defaultTemplate,
  // Future: mercubuana, gunadarma, esa_unggul, ...
};

export const TEMPLATE_OPTIONS: { id: string; label: string; available: boolean }[] = [
  { id: "unpam",       label: "Universitas Pamulang (UNPAM)",  available: true  },
  { id: "mercubuana",  label: "Universitas Mercu Buana",       available: false },
  { id: "gunadarma",   label: "Universitas Gunadarma",         available: false },
  { id: "esa_unggul",  label: "Universitas Esa Unggul",        available: false },
  { id: "bsi",         label: "BSI University",                available: false },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

const SETTINGS_KEY = "app_settings";

/** Read selected template id from localStorage settings, fall back to "unpam" */
export function getActiveTemplateId(): string {
  if (typeof window === "undefined") return "unpam";
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return "unpam";
    const parsed = JSON.parse(raw) as { template?: string };
    return parsed.template ?? "unpam";
  } catch {
    return "unpam";
  }
}

/** Get the full CampusTemplate for the currently selected campus */
export function getActiveTemplate(): CampusTemplate {
  const id = getActiveTemplateId();
  return TEMPLATE_REGISTRY[id] ?? unpamTemplate;
}

/** Convert template margin cm → docx twips (1 cm ≈ 567 twips) */
export function marginTwips(template: CampusTemplate) {
  const toTwips = (cm: number) => Math.round(cm * 567);
  return {
    top:    toTwips(template.marginCm.top),
    right:  toTwips(template.marginCm.right),
    bottom: toTwips(template.marginCm.bottom),
    left:   toTwips(template.marginCm.left),
  };
}

/** Convert pt line spacing to docx line value (240 = single space) */
export function lineSpacingDocx(template: CampusTemplate): number {
  return Math.round(240 * template.lineSpacingMultiple);
}
