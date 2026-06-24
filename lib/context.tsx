"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AppState, VariableConfig, RespondentRow } from "@/types";
import { loadState, saveState } from "@/lib/store";

interface AppContextValue {
  state: AppState;
  setRawData: (data: RespondentRow[], columns: string[], fileName: string) => void;
  setVariables: (variables: VariableConfig[]) => void;
  setRTableValue: (value: number) => void;
  clearAll: () => void;
}

const defaultState: AppState = {
  rawData: [],
  columns: [],
  variables: [],
  rTableValue: 0.196,
  fileName: "",
};

const AppContext = createContext<AppContextValue>({
  state: defaultState,
  setRawData: () => {},
  setVariables: () => {},
  setRTableValue: () => {},
  clearAll: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);

  useEffect(() => {
    setState(loadState());
  }, []);

  const setRawData = useCallback((rawData: RespondentRow[], columns: string[], fileName: string) => {
    setState((prev) => {
      const next = { ...prev, rawData, columns, fileName };
      saveState(next);
      return next;
    });
  }, []);

  const setVariables = useCallback((variables: VariableConfig[]) => {
    setState((prev) => {
      const next = { ...prev, variables };
      saveState(next);
      return next;
    });
  }, []);

  const setRTableValue = useCallback((rTableValue: number) => {
    setState((prev) => {
      const next = { ...prev, rTableValue };
      saveState(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setState(defaultState);
    if (typeof window !== "undefined") sessionStorage.clear();
  }, []);

  return (
    <AppContext.Provider value={{ state, setRawData, setVariables, setRTableValue, clearAll }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
