"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { DRAFT_CHANGED, DRAFT_ERROR, DRAFT_KEYS, readDraft } from "@/lib/draftStorage";
import { getActiveProjectId, saveCurrentStateToProject } from "@/lib/projectStore";
import { getCloudCode, reportCloud, saveSemproOnline } from "@/lib/semproPersistence";

export default function DraftPersistence() {
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
    window.addEventListener(DRAFT_CHANGED, changed);
    window.addEventListener(DRAFT_ERROR, storageError);
    window.addEventListener("storage", changedInOtherTab);
    window.addEventListener("online", upload);
    function leaving() { if (document.visibilityState === "hidden") { clearTimeout(timer); void upload(); } }
    document.addEventListener("visibilitychange", leaving);
    return () => { disposed = true; clearTimeout(timer); window.removeEventListener(DRAFT_CHANGED, changed); window.removeEventListener(DRAFT_ERROR, storageError); window.removeEventListener("storage", changedInOtherTab); window.removeEventListener("online", upload); document.removeEventListener("visibilitychange", leaving); };
  }, []);
  return null;
}
