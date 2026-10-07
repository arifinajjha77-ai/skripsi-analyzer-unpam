"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DRAFT_CHANGED, DRAFT_ERROR, DRAFT_KEYS, readDraft } from "@/lib/draftStorage";
import { getActiveProjectId, saveCurrentStateToProject } from "@/lib/projectStore";
import { getCloudCode, isSemproWorkspaceEmpty, recoverEmptyWorkspace, reportCloud, saveSemproOnline } from "@/lib/semproPersistence";

export default function DraftPersistence() {
  const [recovering, setRecovering] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let saving = false, pending = false;
    let disposed = false;
    async function upload() {
      if (!getCloudCode() || disposed) return;
      if (saving) { pending = true; return; }
      saving = true;
      try { await saveSemproOnline(); } catch { /* Error status is shown in the backup panel. */ }
      finally {
        saving = false;
        if (pending && !disposed) { pending = false; timer = setTimeout(upload, 1000); }
      }
    }
    function changed() {
      try { const active = getActiveProjectId(); if (active) saveCurrentStateToProject(active); }
      catch { toast.error("Snapshot project belum tersimpan. Unduh cadangan draf."); }
      clearTimeout(timer);
      if (getCloudCode()) {
        reportCloud({ text: "Draf tersimpan di browser; cadangan online menunggu…" });
        timer = setTimeout(upload, 5000);
      }
    }
    function storageError() { toast.error("Draf belum tersimpan: penyimpanan browser penuh atau diblokir. Unduh cadangan sebelum menutup halaman.", { id: "draft-storage-error" }); }
    function changedInOtherTab(event: StorageEvent) {
      if (DRAFT_KEYS.some(key => key === event.key)) toast.info("Draf berubah di tab lain. Muat ulang sebelum melanjutkan edit.", { id: "draft-other-tab", duration: Infinity, action: { label: "Muat ulang", onClick: () => window.location.reload() } });
    }
    try { for (const key of DRAFT_KEYS) readDraft(key); } catch { storageError(); }
    async function openRecoveryLink() {
      const code = new URLSearchParams(window.location.hash.slice(1)).get("pemulihan");
      if (!code || !isSemproWorkspaceEmpty() || disposed) return;
      setRecovering(true);
      reportCloud({ text: "Memuat judul dan BAB I–III dari cadangan online…", saving: true });
      try {
        if (await recoverEmptyWorkspace(code)) {
          // Keep the requested menu, including Generator Judul, after restoring all stores.
          window.location.replace(window.location.pathname + window.location.search);
          return;
        }
        reportCloud({ text: "Draf di browser ini dipertahankan. Klik Buka cadangan untuk membuka cadangan sebagai project terpisah." });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Pemulihan belum berhasil. Coba Buka cadangan lagi.";
        reportCloud({ text: message, error: true }); toast.error(message);
      }
      if (!disposed) setRecovering(false);
    }
    const recoveryTimer = setTimeout(openRecoveryLink, 0);
    window.addEventListener("hashchange", openRecoveryLink);
    // Resume a save interrupted by closing the previous tab; unchanged drafts are skipped.
    timer = setTimeout(upload, 1000);
    window.addEventListener(DRAFT_CHANGED, changed);
    window.addEventListener(DRAFT_ERROR, storageError);
    window.addEventListener("storage", changedInOtherTab);
    window.addEventListener("online", upload);
    function leaving() { if (document.visibilityState === "hidden") { clearTimeout(timer); void upload(); } }
    document.addEventListener("visibilitychange", leaving);
    return () => { disposed = true; clearTimeout(timer); clearTimeout(recoveryTimer); window.removeEventListener("hashchange", openRecoveryLink); window.removeEventListener(DRAFT_CHANGED, changed); window.removeEventListener(DRAFT_ERROR, storageError); window.removeEventListener("storage", changedInOtherTab); window.removeEventListener("online", upload); document.removeEventListener("visibilitychange", leaving); };
  }, []);
  return recovering ? <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50/95 p-6" role="status" aria-live="polite"><div className="max-w-md rounded-xl border border-blue-200 bg-white p-6 text-center shadow-lg"><p className="font-semibold text-slate-900">Memulihkan sempro…</p><p className="mt-2 text-sm text-slate-600">Judul, data BAB I, BAB II–III, tabel, dan daftar pustaka sedang dimuat dari cadangan online.</p></div></div> : null;
}
