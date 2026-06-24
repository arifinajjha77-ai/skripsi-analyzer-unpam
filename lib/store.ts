"use client";

import { AppState, VariableConfig, RespondentRow } from "@/types";

const STORAGE_KEY = "skripsi_analyzer_state";

const defaultState: AppState = {
  rawData: [],
  columns: [],
  variables: [],
  rTableValue: 0.196,
  fileName: "",
};

export function loadState(): AppState {
  if (typeof window === "undefined") return defaultState;
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultState;
    return JSON.parse(stored) as AppState;
  } catch {
    return defaultState;
  }
}

export function saveState(state: Partial<AppState>): void {
  if (typeof window === "undefined") return;
  try {
    const current = loadState();
    const next = { ...current, ...state };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
}

export function clearState(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function updateRawData(rawData: RespondentRow[], columns: string[], fileName: string): void {
  saveState({ rawData, columns, fileName });
}

export function updateVariables(variables: VariableConfig[]): void {
  saveState({ variables });
}

export function updateRTable(rTableValue: number): void {
  saveState({ rTableValue });
}
