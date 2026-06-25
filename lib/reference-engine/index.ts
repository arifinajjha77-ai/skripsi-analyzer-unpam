export type { Reference, TopicKey } from "./database";
export { REFERENCE_DB, getReferencesByTopic, getReferenceById } from "./database";

import type { Reference } from "./database";

// ─── Citation helpers ────────────────────────────────────────────────────────

/** "(Ghozali, 2018); (Sugiyono, 2019)" */
export function formatInlineCitations(refs: Reference[]): string {
  const unique = dedupeRefs(refs);
  return unique.map((r) => r.apaInText).join("; ");
}

/** Deduplicate by id, preserve insertion order */
export function dedupeRefs(refs: Reference[]): Reference[] {
  const seen = new Set<string>();
  const out: Reference[] = [];
  for (const r of refs) {
    if (!seen.has(r.id)) { seen.add(r.id); out.push(r); }
  }
  return out;
}

/** APA-7 sorted bibliography */
export function buildDaftarPustaka(refs: Reference[]): string {
  const unique = dedupeRefs(refs);
  const sorted = [...unique].sort((a, b) => {
    const la = a.penulis[0].split(" ").pop() ?? "";
    const lb = b.penulis[0].split(" ").pop() ?? "";
    return la.localeCompare(lb, "id");
  });
  return sorted.map((r) => r.apaFull).join("\n\n");
}

/** Plain list for UI display */
export function buildDaftarPustakaList(refs: Reference[]): { id: string; text: string }[] {
  const unique = dedupeRefs(refs);
  const sorted = [...unique].sort((a, b) => {
    const la = a.penulis[0].split(" ").pop() ?? "";
    const lb = b.penulis[0].split(" ").pop() ?? "";
    return la.localeCompare(lb, "id");
  });
  return sorted.map((r) => ({ id: r.id, text: r.apaFull }));
}
