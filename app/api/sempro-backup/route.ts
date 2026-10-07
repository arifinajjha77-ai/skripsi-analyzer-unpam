import { get, list, put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { MAX_BACKUP_BYTES, parseSemproBackup } from "@/lib/semproBackup";
import { decryptBackup, encryptBackup, vaultPrefix } from "@/lib/semproVault";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };
function reply(body: unknown, status = 200) { return Response.json(body, { status, headers }); }
function codeFor(request: Request) { return request.headers.get("authorization")?.replace(/^Bearer /, "") || ""; }
function available() { return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID); }

export async function POST(request: Request) {
  const code = codeFor(request);
  if (!/^[a-f0-9]{64}$/.test(code)) return reply({ error: "Tautan pemulihan tidak valid." }, 401);
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) return reply({ error: "Permintaan tidak diizinkan." }, 403);
  if (!available()) return reply({ error: "Cadangan online belum tersedia. Gunakan Unduh cadangan untuk menyimpan draf." }, 503);
  const content = await request.text();
  if (Buffer.byteLength(content) > MAX_BACKUP_BYTES) return reply({ error: "Cadangan terlalu besar (maksimal 512 KB)." }, 413);
  let backup;
  try { backup = parseSemproBackup(JSON.parse(content)); } catch { return reply({ error: "Cadangan kosong atau format data tidak valid. Draf di browser tetap tersimpan." }, 400); }
  try {
    const savedAt = new Date().toISOString();
    // Immutable revisions preserve earlier saves, including simultaneous browser edits.
    const revision = `${Date.now()}-${randomUUID()}.json`;
    await put(`${vaultPrefix(code)}${revision}`, encryptBackup(code, { ...backup, savedAt }), { access: "private", addRandomSuffix: false, contentType: "application/json" });
    return reply({ savedAt, revision });
  } catch { return reply({ error: "Cadangan online belum berhasil. Draf di browser tetap tersimpan; unduh cadangan lalu coba lagi." }, 503); }
}

export async function GET(request: Request) {
  const code = codeFor(request);
  if (!/^[a-f0-9]{64}$/.test(code)) return reply({ error: "Tautan pemulihan tidak valid." }, 401);
  if (!available()) return reply({ error: "Cadangan online belum tersedia." }, 503);
  try {
    let cursor: string | undefined;
    let latest: { pathname: string; uploadedAt: Date } | undefined;
    do {
      const page = await list({ prefix: vaultPrefix(code), limit: 1000, cursor });
      for (const blob of page.blobs) if (!latest || blob.uploadedAt > latest.uploadedAt || (blob.uploadedAt.getTime() === latest.uploadedAt.getTime() && blob.pathname > latest.pathname)) latest = blob;
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    if (!latest) return reply({ error: "Cadangan belum ditemukan. Periksa tautan atau simpan draf dari browser lama terlebih dahulu." }, 404);
    const saved = await get(latest.pathname, { access: "private", useCache: false });
    if (!saved || saved.statusCode !== 200) return reply({ error: "Cadangan belum dapat dibaca. Coba lagi." }, 503);
    const raw = await new Response(saved.stream).text();
    return reply(parseSemproBackup(decryptBackup(code, raw)));
  } catch { return reply({ error: "Cadangan belum dapat dibaca. Draf di browser tetap tersedia." }, 503); }
}
