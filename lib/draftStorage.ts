/** Durable browser drafts, with migration from the former per-tab storage. */
export const DRAFT_KEYS = ["thesis_generator_state", "bab1_state", "smartcampus_proposal_feb2021_v1", "skripsi_analyzer_state", "responden_center_state"] as const;
export const DRAFT_CHANGED = "smartcampus:draft-changed";
export const DRAFT_ERROR = "smartcampus:draft-error";

export function readDraft(key: string): string | null {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem(key);
  if (saved !== null) return saved;
  const legacy = sessionStorage.getItem(key);
  if (legacy !== null) {
    localStorage.setItem(key, legacy);
    sessionStorage.removeItem(key);
  }
  return legacy;
}

export function writeDraft(key: string, value: string | null, notify = true): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
    sessionStorage.removeItem(key);
    if (notify) window.dispatchEvent(new CustomEvent(DRAFT_CHANGED, { detail: key }));
    return true;
  } catch {
    window.dispatchEvent(new Event(DRAFT_ERROR));
    return false;
  }
}
