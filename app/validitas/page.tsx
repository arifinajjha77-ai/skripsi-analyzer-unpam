"use client";

import { useMemo, useState } from "react";
import { useAppContext } from "@/lib/context";
import { computeValidity } from "@/lib/statistics/validity";
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
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";

export default function ValiditasPage() {
  const { state, setRTableValue } = useAppContext();
  const [rInput, setRInput] = useState(String(state.rTableValue));

  const results = useMemo(() => {
    if (!state.rawData.length || !state.variables.length) return [];
    return state.variables.map((v) =>
      computeValidity(state.rawData, v, state.rTableValue)
    );
  }, [state.rawData, state.variables, state.rTableValue]);

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

  function handleRTableChange() {
    const val = parseFloat(rInput);
    if (!isNaN(val) && val > 0 && val < 1) {
      setRTableValue(val);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Uji Validitas</h1>
        <p className="text-slate-500 text-sm mt-1">
          Korelasi Pearson item-total. Item valid jika r hitung ≥ r tabel.
        </p>
      </div>

      {/* r table setting */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="pt-4">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="text-sm font-medium text-slate-700">Nilai r Tabel:</label>
            <input
              type="number"
              value={rInput}
              step="0.001"
              min="0.01"
              max="0.99"
              onChange={(e) => setRInput(e.target.value)}
              onBlur={handleRTableChange}
              onKeyDown={(e) => e.key === "Enter" && handleRTableChange()}
              className="w-28 text-sm border border-slate-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-xs text-slate-500">
              (Default n=100: 0.196 | n=50: 0.273 | n=30: 0.361)
            </span>
          </div>
        </CardContent>
      </Card>

      {results.map((result) => {
        const validCount = result.items.filter((i) => i.valid).length;
        const total = result.items.length;

        return (
          <Card key={result.variableKey} className="overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-200 pb-3">
              <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="font-mono">{result.variableKey}</Badge>
                {result.variableName}
                <span className="ml-auto text-xs font-normal text-slate-500">
                  n = {result.n} | r Tabel = {state.rTableValue}
                </span>
                <Badge
                  className={
                    validCount === total
                      ? "bg-green-100 text-green-700 border-green-200"
                      : "bg-orange-100 text-orange-700 border-orange-200"
                  }
                >
                  {validCount}/{total} valid
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-xs">Item</TableHead>
                      <TableHead className="text-xs text-right">r Hitung</TableHead>
                      <TableHead className="text-xs text-right">r Tabel</TableHead>
                      <TableHead className="text-xs text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.items.map((item) => (
                      <TableRow key={item.item} className={item.valid ? "" : "bg-red-50/50"}>
                        <TableCell className="text-xs font-mono font-medium">{item.item}</TableCell>
                        <TableCell className="text-xs text-right font-medium">
                          {item.rCount.toFixed(4)}
                        </TableCell>
                        <TableCell className="text-xs text-right text-slate-500">
                          {item.rTable.toFixed(3)}
                        </TableCell>
                        <TableCell className="text-xs text-center">
                          {item.valid ? (
                            <span className="inline-flex items-center gap-1 text-green-700 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                              <XCircle className="w-3.5 h-3.5" /> Tidak Valid
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
