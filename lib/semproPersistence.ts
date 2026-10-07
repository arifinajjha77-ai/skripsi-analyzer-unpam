"use client";

import { readDraft } from "@/lib/draftStorage";
import { createProject, getActiveProjectId, loadProjects, restoreSnapshot, saveCurrentStateToProject, saveProjects, setActiveProjectId, snapshotCurrentState } from "@/lib/projectStore";
import { parseSemproBackup, SEMPRO_KEYS, type SemproBackup } from "@/lib/semproBackup";

export const CLOUD_STATUS = "smartcampus:cloud-status";
export type CloudStatus = { text: string; error?: boolean; saving?: boolean };
const connectionKey = () => `smartcampus_cloud_${getActiveProjectId() || "draft"}`;
export function getCloudCode(): string { try { return localStorage.getItem(connectionKey()) || ""; } catch { return ""; } }
export function getCloudSavedAt(): string { try { return localStorage.getItem(`${connectionKey()}:savedAt`) || ""; } catch { return ""; } }
export function recoveryLink(code: string): string { return `${window.location.origin}/proposal#pemulihan=${code}`; }
export function reportCloud(status: CloudStatus) { window.dispatchEvent(new CustomEvent(CLOUD_STATUS, { detail: status })); }
export function createSemproBackup(): SemproBackup {
  const snapshot: SemproBackup["snapshot"] = {};
  for (const key of SEMPRO_KEYS) { const value = readDraft(key); if (value) snapshot[key] = value; }
  return parseSemproBackup({ format: "smartcampus-sempro", version: 1, savedAt: new Date().toISOString(), snapshot });
}
export function newRecoveryCode(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, "0")).join("");
}
export async function saveSemproOnline(code = getCloudCode() || newRecoveryCode(), force = false): Promise<string> {
  const backup = createSemproBackup();
  const signature = JSON.stringify(backup.snapshot);
  const key = connectionKey();
  if (!force && localStorage.getItem(`${key}:last`) === signature && localStorage.getItem(key) === code) return code;
  reportCloud({ text: "Menyimpan cadangan online…", saving: true });
  try {
    const response = await fetch("/api/sempro-backup", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${code}` }, body: JSON.stringify(backup), signal: AbortSignal.timeout(25000) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Cadangan online belum berhasil.");
    // Connect only after the server confirms a successful durable save.
    localStorage.setItem(key, code);
    localStorage.setItem(`${key}:last`, signature);
    localStorage.setItem(`${key}:savedAt`, result.savedAt);
    reportCloud({ text: `Tersimpan online · ${new Date(result.savedAt).toLocaleString("id-ID")}` });
    return code;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cadangan online belum berhasil.";
    reportCloud({ text: `${message} Draf tetap tersimpan di browser; unduh cadangan bila perlu.`, error: true });
    throw error;
  }
}
export async function fetchSemproBackup(code: string): Promise<SemproBackup> {
  if (!/^[a-f0-9]{64}$/.test(code)) throw new Error("Tautan pemulihan tidak valid.");
  const response = await fetch("/api/sempro-backup", { headers: { Authorization: `Bearer ${code}` }, cache: "no-store", signal: AbortSignal.timeout(25000) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Cadangan belum dapat dibaca.");
  return parseSemproBackup(result);
}
export function restoreSemproBackup(input: unknown, code?: string): void {
  const backup = parseSemproBackup(input);
  const current = snapshotCurrentState();
  const active = getActiveProjectId();
  if (active) saveCurrentStateToProject(active);
  const projects = loadProjects();
  if (!active) {
    try { createSemproBackup(); projects.push({ ...createProject("Draf sebelum pemulihan"), snapshot: current }); } catch { /* No research draft to preserve. */ }
  }
  const context = JSON.parse(backup.snapshot.thesis_generator_state || "{}");
  const project = { ...createProject(`Sempro ${context.objek || "Dipulihkan"}`), snapshot: backup.snapshot, lastModified: backup.savedAt };
  // Preserve the current workspace as a separate project before loading the recovered one.
  saveProjects([...projects, project]);
  restoreSnapshot(project.snapshot);
  setActiveProjectId(project.id);
  if (code) {
    localStorage.setItem(connectionKey(), code);
    localStorage.setItem(`${connectionKey()}:last`, JSON.stringify(backup.snapshot));
    localStorage.setItem(`${connectionKey()}:savedAt`, backup.savedAt);
  }
}
