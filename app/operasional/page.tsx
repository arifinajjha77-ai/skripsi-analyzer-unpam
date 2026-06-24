"use client";

import { useState, useEffect, useMemo } from "react";
import { loadThesisState, ThesisState } from "@/lib/thesis/store";
import { getQuestionnaire } from "@/lib/thesis/questionnaire";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, AlertCircle, Layers, Hash, ListChecks } from "lucide-react";
import { toast } from "sonner";

interface OperasionalRow {
  no: number;
  variabel: string;
  variabelKey: string;
  indikator: string;
  pernyataan: string;
  item: string;
  skala: string;
}

function buildRows(thesis: ThesisState): OperasionalRow[] {
  const entries = [
    { name: thesis.x1, varKey: "X1" },
    { name: thesis.x2, varKey: "X2" },
    { name: thesis.y, varKey: "Y" },
  ].filter((e) => e.name);

  const rows: OperasionalRow[] = [];
  let no = 1;

  for (const { name, varKey } of entries) {
    const q = getQuestionnaire(name);
    if (!q) continue;
    for (const item of q.items) {
      rows.push({
        no: no++,
        variabel: name,
        variabelKey: varKey,
        indikator: item.indicator,
        pernyataan: item.statement,
        item: `${varKey}.${item.no}`,
        skala: "Likert 1–5",
      });
    }
  }
  return rows;
}

const BADGE_COLOR: Record<string, string> = {
  X1: "bg-blue-100 text-blue-700 border-blue-200",
  X2: "bg-indigo-100 text-indigo-700 border-indigo-200",
  Y: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default function OperasionalPage() {
  const [thesis, setThesis] = useState<ThesisState>({ x1: "", x2: "", y: "", objek: "" });
  const [filter, setFilter] = useState<"all" | "X1" | "X2" | "Y">("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setThesis(loadThesisState());
  }, []);

  const isReady = !!thesis.x1 && !!thesis.x2 && !!thesis.y;
  const allRows = useMemo(() => buildRows(thesis), [thesis]);
  const filteredRows = useMemo(
    () => (filter === "all" ? allRows : allRows.filter((r) => r.variabelKey === filter)),
    [allRows, filter]
  );

  // Stats
  const totalVars = [...new Set(allRows.map((r) => r.variabelKey))].length;
  const totalIndicators = [...new Set(allRows.map((r) => r.indikator))].length;
  const totalItems = allRows.length;

  async function handleExport() {
    if (!isReady) return;
    setLoading(true);
    try {
      const { generateOperasionalDocx } = await import("@/lib/thesis/operasionalDocx");
      const blob = await generateOperasionalDocx(thesis);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "Operasional-Variabel.docx";
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("DOCX operasional variabel berhasil dibuat");
    } catch (e) {
      console.error(e);
      toast.error("Gagal membuat DOCX");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Operasional Variabel</h1>
          <p className="text-slate-500 text-sm mt-1">
            Tabel definisi operasional variabel beserta indikator dan item pernyataan kuesioner.
          </p>
        </div>
        {isReady && (
          <button
            onClick={handleExport}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Mengekspor...</>
            ) : (
              <><Download className="w-4 h-4" /> Export Operasional Variabel</>
            )}
          </button>
        )}
      </div>

      {!isReady && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Variabel belum dipilih.{" "}
            <a href="/judul" className="text-blue-600 underline font-medium">Buka Generator Judul</a>{" "}
            untuk memilih X1, X2, dan Y.
          </AlertDescription>
        </Alert>
      )}

      {isReady && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Layers, label: "Variabel", value: totalVars, color: "text-blue-600 bg-blue-50" },
              { icon: Hash, label: "Indikator", value: totalIndicators, color: "text-indigo-600 bg-indigo-50" },
              { icon: ListChecks, label: "Item Pernyataan", value: totalItems, color: "text-emerald-600 bg-emerald-50" },
            ].map(({ icon: Icon, label, value, color }) => (
              <Card key={label} className="text-center">
                <CardContent className="pt-5 pb-5">
                  <div className={`inline-flex p-2.5 rounded-xl mb-2 ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-3xl font-bold text-slate-800">{value}</p>
                  <p className="text-xs text-slate-500 mt-1">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Variable info row */}
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-blue-100 text-blue-700 border-blue-200">X1: {thesis.x1}</Badge>
            <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">X2: {thesis.x2}</Badge>
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Y: {thesis.y}</Badge>
          </div>

          {/* Filter */}
          <Card>
            <CardHeader className="pb-3 bg-slate-50 border-b border-slate-200">
              <CardTitle className="text-sm flex items-center justify-between flex-wrap gap-3">
                <span>
                  Tabel Operasional Variabel
                  <span className="ml-2 text-slate-400 font-normal text-xs">
                    ({filteredRows.length} item)
                  </span>
                </span>
                <div className="flex gap-1.5">
                  {(["all", "X1", "X2", "Y"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors border ${
                        filter === f
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      {f === "all" ? "Semua" : f}
                    </button>
                  ))}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-xs w-10 text-center">No</TableHead>
                      <TableHead className="text-xs w-36">Variabel</TableHead>
                      <TableHead className="text-xs w-40">Indikator</TableHead>
                      <TableHead className="text-xs">Pernyataan</TableHead>
                      <TableHead className="text-xs w-16 text-center">Item</TableHead>
                      <TableHead className="text-xs w-24 text-center">Skala</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.map((row, idx) => {
                      // Determine if this row starts a new variable block (for merge visual)
                      const prevRow = filteredRows[idx - 1];
                      const isFirstOfVar = !prevRow || prevRow.variabelKey !== row.variabelKey;
                      const isFirstOfIndicator = !prevRow || prevRow.indikator !== row.indikator || prevRow.variabelKey !== row.variabelKey;

                      return (
                        <TableRow
                          key={row.no}
                          className={`${isFirstOfVar ? "border-t-2 border-slate-300" : ""} ${idx % 2 === 0 ? "" : "bg-slate-50/50"}`}
                        >
                          <TableCell className="text-xs text-center text-slate-500">{row.no}</TableCell>
                          <TableCell className="text-xs">
                            {isFirstOfVar ? (
                              <div>
                                <Badge className={`text-xs font-bold ${BADGE_COLOR[row.variabelKey] ?? ""}`}>
                                  {row.variabelKey}
                                </Badge>
                                <p className="text-slate-700 font-medium mt-0.5">{row.variabel}</p>
                              </div>
                            ) : (
                              <span className="text-slate-300 text-xs">↳</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">
                            {isFirstOfIndicator ? (
                              <span className="font-medium">{row.indikator}</span>
                            ) : (
                              <span className="text-slate-300">↳</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-slate-700 leading-relaxed py-2">
                            {row.pernyataan}
                          </TableCell>
                          <TableCell className="text-xs text-center font-mono font-medium text-slate-700">
                            {row.item}
                          </TableCell>
                          <TableCell className="text-xs text-center">
                            <Badge variant="outline" className="text-xs font-normal">
                              {row.skala}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Per-variable breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: "X1", name: thesis.x1, color: "border-blue-300 bg-blue-50", badge: "bg-blue-100 text-blue-700" },
              { key: "X2", name: thesis.x2, color: "border-indigo-300 bg-indigo-50", badge: "bg-indigo-100 text-indigo-700" },
              { key: "Y", name: thesis.y, color: "border-emerald-300 bg-emerald-50", badge: "bg-emerald-100 text-emerald-700" },
            ].map(({ key, name, color, badge }) => {
              const vRows = allRows.filter((r) => r.variabelKey === key);
              const inds = [...new Set(vRows.map((r) => r.indikator))];
              return (
                <div key={key} className={`border-2 ${color} rounded-xl p-4 space-y-2`}>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs font-bold ${badge}`}>{key}</Badge>
                    <span className="text-sm font-semibold text-slate-800">{name}</span>
                  </div>
                  <p className="text-xs text-slate-500">{vRows.length} item · {inds.length} indikator</p>
                  <div className="space-y-1">
                    {inds.map((ind) => (
                      <div key={ind} className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 shrink-0" />
                        {ind}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
