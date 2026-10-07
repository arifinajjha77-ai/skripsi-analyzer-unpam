"use client";

import { useEffect, useState } from "react";
import { CLOUD_STATUS, createSemproBackup, fetchSemproBackup, getCloudCode, getCloudSavedAt, isSemproWorkspaceEmpty, parseRecoveryCode, recoveryLink, restoreSemproBackup, saveSemproOnline, type CloudStatus } from "@/lib/semproPersistence";
import { MAX_BACKUP_BYTES } from "@/lib/semproBackup";

const button = "rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50";
export default function SemproBackupPanel() {
  const [status, setStatus] = useState<CloudStatus>({ text: "Memeriksa draf yang tersimpan…" });
  const [link, setLink] = useState("");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    function refresh() { const code = getCloudCode(); if (code) setLink(recoveryLink(code)); }
    function changed(event: Event) { setStatus((event as CustomEvent<CloudStatus>).detail); refresh(); }
    const timer = setTimeout(() => {
      refresh();
      const savedAt = getCloudSavedAt();
      if (getCloudCode() && savedAt) setStatus({ text: `Tersimpan online · ${new Date(savedAt).toLocaleString("id-ID")}. Perubahan berikutnya dicadangkan otomatis.` });
      else setStatus({ text: isSemproWorkspaceEmpty() ? "Browser ini belum terhubung ke draf Anda. Buka tautan pemulihan privat atau gunakan Impor cadangan untuk memuat judul dan BAB I–III." : "Draf tersimpan di browser ini. Simpan online untuk membukanya di browser lain." });
      const code = new URLSearchParams(window.location.hash.slice(1)).get("pemulihan");
      if (code) { setInput(code); setStatus({ text: isSemproWorkspaceEmpty() ? "Memuat cadangan online secara otomatis…" : "Tautan pemulihan tersedia. Draf saat ini dipertahankan; klik Buka cadangan untuk membuka cadangan sebagai project terpisah." }); }
    }, 0);
    window.addEventListener(CLOUD_STATUS, changed);
    return () => { clearTimeout(timer); window.removeEventListener(CLOUD_STATUS, changed); };
  }, []);
  function fail(error: unknown) { setStatus({ text: error instanceof Error ? error.message : "Penyimpanan belum berhasil.", error: true }); }
  async function save() {
    setBusy(true);
    try { const code = await saveSemproOnline(undefined, true); setLink(recoveryLink(code)); } catch (error) { fail(error); }
    finally { setBusy(false); }
  }
  async function restore() {
    setBusy(true);
    try {
      const code = parseRecoveryCode(input);
      const backup = await fetchSemproBackup(code);
      restoreSemproBackup(backup, code);
      window.location.assign(window.location.pathname);
    } catch (error) { fail(error); setBusy(false); }
  }
  function download() {
    try {
      const backup = createSemproBackup();
      const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `Cadangan-Sempro-${new Date().toISOString().slice(0, 10)}.json`; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus({ text: "Cadangan BAB I–III diunduh. Gunakan Impor cadangan di browser baru untuk melanjutkan edit." });
    } catch (error) { fail(error); }
  }
  async function importFile(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error("Cadangan terlalu besar (maksimal 512 KB).");
      restoreSemproBackup(JSON.parse(await file.text()));
      window.location.assign(window.location.pathname);
    } catch (error) { fail(error); setBusy(false); }
  }
  return <section className="rounded-xl border border-blue-200 bg-blue-50 p-4 md:p-6" aria-labelledby="sempro-backup-heading">
    <h2 id="sempro-backup-heading" className="font-semibold text-slate-900">Simpan dan pulihkan sempro</h2>
    <p className="mt-1 text-sm text-slate-600">Judul, data BAB I, BAB II–III, tabel, dan daftar pustaka disimpan bersama. Setelah Simpan online berhasil, perubahan berikutnya dicadangkan otomatis.</p>
    <p role="status" className={`mt-3 text-sm ${status.error ? "text-red-700" : "text-blue-900"}`}>{status.text}</p>
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" className={button} disabled={busy || status.saving} onClick={save}>{busy || status.saving ? "Memproses…" : "Simpan online"}</button>
      <button type="button" className={button} disabled={busy} onClick={download}>Unduh cadangan</button>
      <label className={`${button} cursor-pointer`}>Impor cadangan<input aria-label="Impor cadangan sempro" className="sr-only" type="file" accept=".json,application/json" disabled={busy} onChange={e => { void importFile(e.target.files?.[0]); e.target.value = ""; }} /></label>
    </div>
    {link && <div className="mt-4 space-y-2"><label htmlFor="sempro-recovery-link" className="block text-sm font-medium">Tautan pemulihan privat</label><input id="sempro-recovery-link" className="w-full rounded-lg border border-blue-200 bg-white p-2 text-sm" value={link} readOnly onFocus={e => e.target.select()} /><button type="button" className="text-sm font-medium text-blue-800 underline" onClick={async () => { try { await navigator.clipboard.writeText(link); setStatus({ text: "Tautan disalin. Buka di browser baru: draf yang kosong akan dipulihkan otomatis." }); } catch { setStatus({ text: "Pilih dan salin tautan pemulihan di atas." }); } }}>Salin tautan pemulihan</button><p className="text-xs text-slate-600">Simpan tautan ini untuk membuka draf di Chrome atau perangkat lain. Siapa pun yang memiliki tautan dapat membuka cadangan; jangan bagikan secara publik.</p></div>}
    <div className="mt-4 border-t border-blue-200 pt-4"><label htmlFor="sempro-restore-code" className="block text-sm font-medium">Buka draf dari browser lama</label><input id="sempro-restore-code" className="mt-1 w-full rounded-lg border border-blue-200 bg-white p-2 text-sm" placeholder="Tempel tautan pemulihan atau kode cadangan" value={input} onChange={e => setInput(e.target.value)} /><button type="button" className={`${button} mt-2`} disabled={busy || !input.trim()} onClick={restore}>Buka cadangan</button></div>
  </section>;
}
