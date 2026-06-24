"use client";

import { useMemo } from "react";
import { useAppContext } from "@/lib/context";
import { computeCronbachAlpha } from "@/lib/statistics/reliability";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function ReliabilitasPage() {
  const { state } = useAppContext();

  const results = useMemo(() => {
    if (!state.rawData.length || !state.variables.length) return [];
    return state.variables.map((v) => computeCronbachAlpha(state.rawData, v));
  }, [state.rawData, state.variables]);

  if (!state.rawData.length || !state.variables.length) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Belum ada data atau mapping variabel. Selesaikan langkah Upload dan Mapping terlebih dahulu.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Uji Reliabilitas</h1>
        <p className="text-slate-500 text-sm mt-1">
          Cronbach&apos;s Alpha per variabel. Reliabel jika α ≥ 0,60.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {results.map((result) => (
          <Card key={result.variableKey} className="overflow-hidden">
            <CardHeader className="pb-3 bg-slate-50 border-b border-slate-200">
              <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="font-mono">{result.variableKey}</Badge>
                {result.variableName}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              {/* Alpha gauge */}
              <div className="text-center">
                <p className="text-4xl font-bold text-slate-800">
                  {result.cronbachAlpha.toFixed(3)}
                </p>
                <p className="text-xs text-slate-500 mt-1">Cronbach&apos;s Alpha (α)</p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    result.reliable ? "bg-green-500" : "bg-red-400"
                  }`}
                  style={{ width: `${Math.min(100, result.cronbachAlpha * 100).toFixed(0)}%` }}
                />
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-xs text-slate-500">Jumlah item</p>
                  <p className="text-sm font-semibold text-slate-800">{result.k}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Kategori</p>
                  <p className="text-sm font-semibold text-slate-800">{result.category}</p>
                </div>
                <div>
                  <Badge
                    className={
                      result.reliable
                        ? "bg-green-100 text-green-700 border-green-200"
                        : "bg-red-100 text-red-700 border-red-200"
                    }
                  >
                    {result.reliable ? "✓ Reliabel" : "✗ Tidak Reliabel"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reliability scale legend */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="pt-4">
          <p className="text-xs font-semibold text-slate-600 mb-2">Kategori Cronbach&apos;s Alpha:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              { range: "α ≥ 0,90", label: "Sangat Tinggi" },
              { range: "0,80 ≤ α < 0,90", label: "Tinggi" },
              { range: "0,70 ≤ α < 0,80", label: "Cukup Tinggi" },
              { range: "0,60 ≤ α < 0,70", label: "Dapat Diterima" },
              { range: "0,50 ≤ α < 0,60", label: "Rendah" },
              { range: "α < 0,50", label: "Sangat Rendah" },
            ].map(({ range, label }) => (
              <div key={range} className="text-xs bg-white border border-slate-200 rounded px-2 py-1.5">
                <span className="font-medium text-slate-700">{range}</span>
                <br />
                <span className="text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
