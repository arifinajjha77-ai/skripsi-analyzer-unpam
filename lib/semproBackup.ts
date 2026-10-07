import { z } from "zod";

export const SEMPRO_KEYS = ["thesis_generator_state", "bab1_state", "smartcampus_proposal_feb2021_v1"] as const;
export const MAX_BACKUP_BYTES = 512_000;
const text = z.string().max(150_000);
const thesis = z.object({ x1: text, x2: text, y: text, objek: text });
const row = z.object({ tahun: text, target: text, realisasi: text });
const bab1 = z.object({
  documentType: z.enum(["skripsi", "proposal-skripsi"]).optional(),
  namaObjek: text, jenisUsaha: text, lokasi: text,
  salesDataMode: z.enum(["asli", "estimasi", "tidak_tersedia"]).optional(),
  consumerDataMode: z.enum(["asli", "estimasi", "tidak_tersedia"]).optional(),
  salesData: z.array(row).max(100), consumerData: z.array(row).max(100),
  competitors: z.array(z.object({ nama: text, produk: text, harga: text, mediaProposi: text.optional(), source: z.enum(["google", "marketplace", "estimasi", "manual"]).optional(), catatan: text.optional() })).max(100),
  fenomena: text, catatanKerahasiaan: text.optional(),
});
const proposal = z.object({
  sections: z.object(Object.fromEntries(["theory", "studies", "framework", "hypotheses", "method", "location", "operations", "sample", "collection", "analysis"].map(key => [key, text]))),
  studies: z.array(z.object({ author: text, title: text, method: text, result: text, comparison: text, journal: text.optional(), reference: text.optional() })).max(100),
  operations: z.array(z.object({ variable: text, definition: text, indicators: text, scale: text, source: text })).max(100),
  references: text,
});
const schemas = { thesis_generator_state: thesis, bab1_state: bab1, smartcampus_proposal_feb2021_v1: proposal };
const envelope = z.object({ format: z.literal("smartcampus-sempro"), version: z.literal(1), savedAt: z.iso.datetime(), snapshot: z.object({ thesis_generator_state: text.optional(), bab1_state: text.optional(), smartcampus_proposal_feb2021_v1: text.optional() }).strict() }).strict();
export type SemproBackup = z.infer<typeof envelope>;
export function isStoredSemproValueValid(key: typeof SEMPRO_KEYS[number], value: unknown): boolean {
  return schemas[key].safeParse(value).success;
}

export function parseSemproBackup(value: unknown): SemproBackup {
  const backup = envelope.parse(value);
  if (new TextEncoder().encode(JSON.stringify(backup)).length > MAX_BACKUP_BYTES) throw new Error("Cadangan terlalu besar (maksimal 512 KB).");
  let meaningful = false;
  for (const key of SEMPRO_KEYS) {
    const raw = backup.snapshot[key];
    if (!raw) continue;
    const parsed = schemas[key].parse(JSON.parse(raw));
    if (key === "thesis_generator_state") meaningful ||= Object.values(parsed).some(v => typeof v === "string" && v.trim());
    if (key === "bab1_state") meaningful ||= Boolean((parsed as z.infer<typeof bab1>).namaObjek.trim() || (parsed as z.infer<typeof bab1>).fenomena.trim());
    if (key === "smartcampus_proposal_feb2021_v1") {
      const p = parsed as z.infer<typeof proposal>;
      meaningful ||= Object.values(p.sections).some(v => typeof v === "string" && v.trim()) || p.studies.some(s => s.title.trim()) || Boolean(p.references.trim());
    }
  }
  if (!meaningful) throw new Error("Draf masih kosong. Isi data penelitian atau BAB terlebih dahulu.");
  return backup;
}
