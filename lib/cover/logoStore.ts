/**
 * SmartCampus — Project-Level Logo Store
 *
 * Stores uploaded logos as base64 in localStorage, keyed by projectId.
 * Each project can have its own logo. Logo is not global.
 *
 * Key format: "sc_logo_v1_{projectId}"
 */

const PREFIX = "sc_logo_v1_";
const DEFAULT_PROJECT_ID = "makalah_default";

function key(projectId: string): string {
  return PREFIX + (projectId || DEFAULT_PROJECT_ID);
}

/** Save a base64 data URL logo for a project */
export function saveLogo(base64DataUrl: string, projectId = DEFAULT_PROJECT_ID): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key(projectId), base64DataUrl);
  } catch {
    // storage quota exceeded — skip silently
  }
}

/** Retrieve a logo for a project (returns undefined if none) */
export function loadLogo(projectId = DEFAULT_PROJECT_ID): string | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem(key(projectId)) ?? undefined;
}

/** Remove a logo for a project */
export function clearLogo(projectId = DEFAULT_PROJECT_ID): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key(projectId));
}

/** Convert a File object to a base64 data URL */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/** Convert a base64 data URL to an ArrayBuffer (for docx ImageRun) */
export function base64ToArrayBuffer(dataUrl: string): ArrayBuffer {
  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
  const binary  = atob(base64);
  const bytes   = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/** Fetch a public image file (for registered university logos) as ArrayBuffer */
export async function fetchPublicLogo(path: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

/** Get effective logo for DOCX generation:
 *  1. Custom uploaded logo (base64)
 *  2. Built-in logo from public path
 *  3. null (no logo)
 */
export async function resolveLogoBuffer(
  logoUrl: string | undefined,
  publicLogoPath: string | undefined
): Promise<ArrayBuffer | null> {
  if (logoUrl) {
    return base64ToArrayBuffer(logoUrl);
  }
  if (publicLogoPath) {
    return fetchPublicLogo(publicLogoPath);
  }
  return null;
}
