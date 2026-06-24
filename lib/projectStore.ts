"use client";

const PROJECTS_KEY = "skripsi_projects";
const ACTIVE_KEY = "skripsi_active_project";

/** All sessionStorage keys we manage per-project */
const SESSION_KEYS = [
  "skripsi_analyzer_state",
  "thesis_generator_state",
  "bab1_state",
  "responden_center_state",
];

export interface Project {
  id: string;
  name: string;
  stage: string;
  description: string;
  createdAt: string;
  lastModified: string;
  snapshot: Record<string, string>;
}

function genId(): string {
  return `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function loadProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Project[];
  } catch {
    return [];
  }
}

export function saveProjects(projects: Project[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch {
    // ignore
  }
}

export function getActiveProjectId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveProjectId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);
}

/** Snapshot current sessionStorage state into a project */
export function snapshotCurrentState(): Record<string, string> {
  const snap: Record<string, string> = {};
  for (const key of SESSION_KEYS) {
    const val = sessionStorage.getItem(key);
    if (val) snap[key] = val;
  }
  return snap;
}

/** Restore a project's snapshot into sessionStorage */
export function restoreSnapshot(snap: Record<string, string>): void {
  for (const key of SESSION_KEYS) {
    if (snap[key]) sessionStorage.setItem(key, snap[key]);
    else sessionStorage.removeItem(key);
  }
}

export function createProject(name: string, description = ""): Project {
  return {
    id: genId(),
    name: name.trim() || "Skripsi Baru",
    stage: "Persiapan",
    description,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    snapshot: snapshotCurrentState(),
  };
}

export function saveCurrentStateToProject(projectId: string): void {
  const projects = loadProjects();
  const idx = projects.findIndex((p) => p.id === projectId);
  if (idx < 0) return;
  projects[idx] = {
    ...projects[idx],
    snapshot: snapshotCurrentState(),
    lastModified: new Date().toISOString(),
  };
  saveProjects(projects);
}

export function switchToProject(project: Project): void {
  restoreSnapshot(project.snapshot);
  setActiveProjectId(project.id);
}

export function deleteProject(id: string): void {
  const projects = loadProjects().filter((p) => p.id !== id);
  saveProjects(projects);
  if (getActiveProjectId() === id) setActiveProjectId(null);
}

/** Estimate progress 0–100 by reading sessionStorage keys */
export function estimateProgress(snap: Record<string, string>): number {
  let score = 0;
  const max = 8;

  try {
    // thesis state
    const thesis = snap["thesis_generator_state"] ? JSON.parse(snap["thesis_generator_state"]) : {};
    if (thesis.x1) score++;
    if (thesis.x2) score++;
    if (thesis.y) score++;

    // bab1
    const bab1 = snap["bab1_state"] ? JSON.parse(snap["bab1_state"]) : {};
    if (bab1.namaObjek) score++;

    // responden
    const resp = snap["responden_center_state"] ? JSON.parse(snap["responden_center_state"]) : {};
    if (resp.rows && resp.rows.length > 0) score++;

    // analysis
    const analysis = snap["skripsi_analyzer_state"] ? JSON.parse(snap["skripsi_analyzer_state"]) : {};
    if (analysis.rawData && analysis.rawData.length > 0) score++;
    if (analysis.variables && analysis.variables.length > 0) score++;
    if (analysis.variables && analysis.variables.length > 0 && analysis.rawData?.length > 0) score++;
  } catch {
    // ignore
  }

  return Math.round((Math.min(score, max) / max) * 100);
}

export function getStageLabel(progress: number): string {
  if (progress === 0) return "Belum Dimulai";
  if (progress < 30) return "Persiapan";
  if (progress < 60) return "Proposal";
  if (progress < 85) return "Analisis";
  if (progress < 100) return "Finalisasi";
  return "Selesai";
}
