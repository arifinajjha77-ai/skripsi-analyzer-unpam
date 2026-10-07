"use client";

import { readDraft, writeDraft } from "@/lib/draftStorage";

import { RespondenRow } from "./types";

const KEY = "responden_center_state";

export interface RespondenState {
  rows: RespondenRow[];
  columns: string[];
  fileName: string;
}

export const defaultRespondenState: RespondenState = {
  rows: [],
  columns: [],
  fileName: "",
};

export function loadRespondenState(): RespondenState {
  if (typeof window === "undefined") return defaultRespondenState;
  try {
    const raw = readDraft(KEY);
    if (!raw) return defaultRespondenState;
    return JSON.parse(raw) as RespondenState;
  } catch {
    return defaultRespondenState;
  }
}

export function saveRespondenState(state: RespondenState): void {
  if (typeof window === "undefined") return;
  try {
    writeDraft(KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function clearRespondenState(): void {
  if (typeof window === "undefined") return;
  writeDraft(KEY, null);
}
