import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export function vaultPrefix(code: string): string {
  if (!/^[a-f0-9]{64}$/.test(code)) throw new Error("Tautan pemulihan tidak valid.");
  return `sempro/${createHash("sha256").update(code).digest("hex")}/`;
}
function key(code: string) { return createHash("sha256").update(`smartcampus-sempro-v1:${code}`).digest(); }
export function encryptBackup(code: string, data: unknown): string {
  vaultPrefix(code);
  const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", key(code), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(data), "utf8"), cipher.final()]);
  return JSON.stringify({ v: 1, iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), data: encrypted.toString("base64") });
}
export function decryptBackup(code: string, raw: string): unknown {
  vaultPrefix(code);
  const data = JSON.parse(raw);
  if (data.v !== 1) throw new Error("Format cadangan tidak dikenal.");
  const decipher = createDecipheriv("aes-256-gcm", key(code), Buffer.from(data.iv, "base64"));
  decipher.setAuthTag(Buffer.from(data.tag, "base64"));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(data.data, "base64")), decipher.final()]).toString("utf8"));
}
