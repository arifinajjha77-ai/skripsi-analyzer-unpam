"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/lib/context";
import { detectVariableGroups } from "@/lib/excel/parser";
import { VariableConfig } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

interface VariableEditor {
  key: string;
  name: string;
  items: string[];
  expanded: boolean;
}

function toEditors(variables: VariableConfig[]): VariableEditor[] {
  return variables.map((v) => ({ ...v, expanded: false }));
}

export default function MappingPage() {
  const { state, setVariables } = useAppContext();
  const router = useRouter();

  const [editors, setEditors] = useState<VariableEditor[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (state.variables.length > 0) {
      setEditors(toEditors(state.variables));
    } else if (state.columns.length > 0) {
      // Auto-detect
      const detected = detectVariableGroups(state.columns);
      if (detected.length > 0) {
        setEditors(
          detected.map((g) => ({
            key: g.key,
            name: g.key === "Y" ? "Keputusan Pembelian" : g.key === "X1" ? "Variabel X1" : "Variabel X2",
            items: g.items,
            expanded: true,
          }))
        );
      } else {
        // Blank starter
        setEditors([
          { key: "X1", name: "Variabel X1", items: [], expanded: true },
          { key: "X2", name: "Variabel X2", items: [], expanded: true },
          { key: "Y", name: "Variabel Y", items: [], expanded: true },
        ]);
      }
    }
  }, [state.columns, state.variables]);

  if (!state.rawData.length) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Belum ada data. Silakan upload data responden terlebih dahulu.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  function updateEditor(idx: number, patch: Partial<VariableEditor>) {
    setEditors((prev) => prev.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
    setSaved(false);
  }

  function toggleItem(editorIdx: number, col: string) {
    setEditors((prev) =>
      prev.map((e, i) => {
        if (i !== editorIdx) return e;
        const has = e.items.includes(col);
        const items = has ? e.items.filter((c) => c !== col) : [...e.items, col];
        return { ...e, items };
      })
    );
    setSaved(false);
  }

  function addVariable() {
    const idx = editors.length + 1;
    setEditors((prev) => [
      ...prev,
      { key: `VAR${idx}`, name: `Variabel Baru ${idx}`, items: [], expanded: true },
    ]);
    setSaved(false);
  }

  function removeVariable(idx: number) {
    setEditors((prev) => prev.filter((_, i) => i !== idx));
    setSaved(false);
  }

  function handleSave() {
    const variables: VariableConfig[] = editors
      .filter((e) => e.key.trim() && e.items.length > 0)
      .map((e) => ({ key: e.key.trim().toUpperCase(), name: e.name.trim(), items: e.items }));

    setVariables(variables);
    setSaved(true);
  }

  // Columns already used in other vars (for visual indication)
  function usedElsewhere(editorIdx: number, col: string): string | null {
    for (let i = 0; i < editors.length; i++) {
      if (i !== editorIdx && editors[i].items.includes(col)) return editors[i].key;
    }
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Mapping Variabel</h1>
        <p className="text-slate-500 text-sm mt-1">
          Tentukan nama dan item kolom untuk setiap variabel penelitian.
        </p>
      </div>

      {editors.map((editor, idx) => (
        <Card key={idx} className="border-slate-200">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <input
                    value={editor.key}
                    onChange={(e) => updateEditor(idx, { key: e.target.value })}
                    placeholder="Key (cth: X1)"
                    className="w-20 text-sm font-bold uppercase border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={6}
                  />
                  <input
                    value={editor.name}
                    onChange={(e) => updateEditor(idx, { name: e.target.value })}
                    placeholder="Nama variabel (cth: Kualitas Produk)"
                    className="flex-1 text-sm border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {editor.items.length} item dipilih
                  </Badge>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => updateEditor(idx, { expanded: !editor.expanded })}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded"
                >
                  {editor.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => removeVariable(idx)}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </CardHeader>

          {editor.expanded && (
            <CardContent>
              <p className="text-xs text-slate-500 mb-2">Pilih kolom yang termasuk variabel ini:</p>
              <div className="flex flex-wrap gap-2">
                {state.columns.map((col) => {
                  const selected = editor.items.includes(col);
                  const other = usedElsewhere(idx, col);
                  return (
                    <button
                      key={col}
                      onClick={() => toggleItem(idx, col)}
                      title={other ? `Sudah digunakan di ${other}` : ""}
                      className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                        selected
                          ? "bg-blue-600 text-white border-blue-600"
                          : other
                          ? "bg-slate-50 text-slate-300 border-slate-200 cursor-default"
                          : "bg-white text-slate-600 border-slate-300 hover:border-blue-400 hover:text-blue-600"
                      }`}
                    >
                      {col}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={addVariable}
          className="flex items-center gap-2 text-sm text-slate-600 border border-slate-300 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors"
        >
          <Plus className="w-4 h-4" /> Tambah Variabel
        </button>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg transition-colors"
        >
          Simpan Mapping
        </button>

        {saved && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-green-600 font-medium">✓ Disimpan!</span>
            <button
              onClick={() => router.push("/deskriptif")}
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              Lanjut ke Analisis →
            </button>
          </div>
        )}
      </div>

      {/* Variable summary */}
      {editors.length > 0 && (
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-slate-600 mb-2">Ringkasan Variabel</p>
            <div className="space-y-1">
              {editors.map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="font-mono">{e.key}</Badge>
                  <span className="text-slate-600">{e.name}</span>
                  <span className="text-slate-400">({e.items.join(", ") || "–"})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
