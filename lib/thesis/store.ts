"use client";

import { readDraft, writeDraft } from "@/lib/draftStorage";

const KEY = "thesis_generator_state";

export interface ThesisState {
  x1: string;
  x2: string;
  y: string;
  objek: string;
}

const defaultThesisState: ThesisState = {
  x1: "",
  x2: "",
  y: "",
  objek: "",
};

export function loadThesisState(): ThesisState {
  if (typeof window === "undefined") return defaultThesisState;
  try {
    const raw = readDraft(KEY);
    if (!raw) return defaultThesisState;
    return JSON.parse(raw) as ThesisState;
  } catch {
    return defaultThesisState;
  }
}

export function saveThesisState(state: ThesisState): void {
  if (typeof window === "undefined") return;
  try {
    writeDraft(KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}
