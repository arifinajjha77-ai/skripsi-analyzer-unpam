"use client";

import { useMemo } from "react";
import { useAppContext } from "@/lib/context";
import { computeDescriptive } from "@/lib/statistics/descriptive";
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
import { AlertCircle } from "lucide-react";

export default function DeskriptifPage() {
  const { state } = useAppContext();

  const results = useMemo(() => {
    if (!state.rawData.length || !state.variables.length) return [];
    return state.variables.map((v) => computeDescriptive(state.rawData, v));
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
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Statistik Deskriptif</h1>
        <p className="text-slate-500 text-sm mt-1">
          Distribusi frekuensi, skor total, dan mean per item skala Likert (1–5).
        </p>
      </div>

      {results.map((result) => (
        <Card key={result.variableKey} className="overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-200 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-sm">
                {result.variableKey}
              </Badge>
              {result.variableName}
              <span className="text-slate-400 font-normal text-xs ml-auto">
                Mean keseluruhan: <strong className="text-slate-700">{result.totalMean}</strong>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-xs w-20">Item</TableHead>
                    <TableHead className="text-xs text-center">STS (1)</TableHead>
                    <TableHead className="text-xs text-center">TS (2)</TableHead>
                    <TableHead className="text-xs text-center">KS (3)</TableHead>
                    <TableHead className="text-xs text-center">S (4)</TableHead>
                    <TableHead className="text-xs text-center">SS (5)</TableHead>
                    <TableHead className="text-xs text-center">Total Skor</TableHead>
                    <TableHead className="text-xs text-center">Mean</TableHead>
                    <TableHead className="text-xs">Kategori</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.items.map((item) => (
                    <TableRow key={item.item}>
                      <TableCell className="text-xs font-mono font-medium">{item.item}</TableCell>
                      <TableCell className="text-xs text-center">{item.freq[1]}</TableCell>
                      <TableCell className="text-xs text-center">{item.freq[2]}</TableCell>
                      <TableCell className="text-xs text-center">{item.freq[3]}</TableCell>
                      <TableCell className="text-xs text-center">{item.freq[4]}</TableCell>
                      <TableCell className="text-xs text-center">{item.freq[5]}</TableCell>
                      <TableCell className="text-xs text-center font-medium">{item.totalScore}</TableCell>
                      <TableCell className="text-xs text-center font-medium">{item.mean}</TableCell>
                      <TableCell className="text-xs">
                        <CategoryBadge category={item.category} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Total row */}
                  <TableRow className="bg-slate-50 font-semibold">
                    <TableCell className="text-xs font-bold" colSpan={7}>
                      Rata-rata Variabel
                    </TableCell>
                    <TableCell className="text-xs text-center font-bold">{result.totalMean}</TableCell>
                    <TableCell className="text-xs">
                      <CategoryBadge
                        category={
                          result.totalMean <= 1.8
                            ? "Sangat Tidak Setuju (STS)"
                            : result.totalMean <= 2.6
                            ? "Tidak Setuju (TS)"
                            : result.totalMean <= 3.4
                            ? "Kurang Setuju (KS)"
                            : result.totalMean <= 4.2
                            ? "Setuju (S)"
                            : "Sangat Setuju (SS)"
                        }
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Likert scale legend */}
      <Card className="bg-slate-50">
        <CardContent className="pt-4">
          <p className="text-xs font-semibold text-slate-600 mb-2">Kategori Interpretasi Mean Likert:</p>
          <div className="flex flex-wrap gap-2">
            {[
              { range: "1,00 – 1,80", label: "Sangat Tidak Setuju (STS)", color: "bg-red-100 text-red-700" },
              { range: "1,81 – 2,60", label: "Tidak Setuju (TS)", color: "bg-orange-100 text-orange-700" },
              { range: "2,61 – 3,40", label: "Kurang Setuju (KS)", color: "bg-yellow-100 text-yellow-700" },
              { range: "3,41 – 4,20", label: "Setuju (S)", color: "bg-green-100 text-green-700" },
              { range: "4,21 – 5,00", label: "Sangat Setuju (SS)", color: "bg-blue-100 text-blue-700" },
            ].map(({ range, label, color }) => (
              <div key={range} className={`text-xs px-2.5 py-1 rounded-full ${color}`}>
                {range}: {label}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const colorMap: Record<string, string> = {
    "Sangat Tidak Setuju (STS)": "bg-red-50 text-red-700 border-red-200",
    "Tidak Setuju (TS)": "bg-orange-50 text-orange-700 border-orange-200",
    "Kurang Setuju (KS)": "bg-yellow-50 text-yellow-700 border-yellow-200",
    "Setuju (S)": "bg-green-50 text-green-700 border-green-200",
    "Sangat Setuju (SS)": "bg-blue-50 text-blue-700 border-blue-200",
  };
  const cls = colorMap[category] ?? "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex text-xs px-2 py-0.5 rounded border font-medium whitespace-nowrap ${cls}`}>
      {category}
    </span>
  );
}
