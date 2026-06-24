"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/lib/context";
import { parseFile } from "@/lib/excel/parser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, FileSpreadsheet, X, Download, AlertCircle } from "lucide-react";

const PREVIEW_ROWS = 10;

export default function UploadPage() {
  const { state, setRawData, clearAll } = useAppContext();
  const router = useRouter();
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext ?? "")) {
      setError("Format tidak didukung. Gunakan file .xlsx, .xls, atau .csv");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await parseFile(file);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setRawData(result.data, result.columns, file.name);
  }

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) await handleFile(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const onInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleFile(file);
    e.target.value = "";
  };

  const hasData = state.rawData.length > 0;
  const previewData = state.rawData.slice(0, PREVIEW_ROWS);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Upload Data</h1>
        <p className="text-slate-500 text-sm mt-1">
          Unggah file Excel (.xlsx/.xls) atau CSV berisi data responden kuesioner.
        </p>
      </div>

      <Alert className="border-amber-200 bg-amber-50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-700">
          Pastikan data berasal dari responden asli. Tidak ada data yang disimpan di server.
        </AlertDescription>
      </Alert>

      {/* Download template */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-slate-800">Template Excel</p>
                <p className="text-xs text-slate-500">
                  Kolom: Responden, X1.1–X1.10, X2.1–X2.10, Y.1–Y.10
                </p>
              </div>
            </div>
            <a
              href="/templates/template-data-responden.xlsx"
              download
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Unduh Template
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
          dragOver
            ? "border-blue-400 bg-blue-50"
            : "border-slate-300 bg-white hover:border-blue-300 hover:bg-slate-50"
        }`}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={onInputChange}
        />
        {loading ? (
          <div className="space-y-2">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-500 text-sm">Membaca file...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="w-10 h-10 text-slate-400 mx-auto" />
            <div>
              <p className="font-medium text-slate-700">
                Seret file ke sini atau klik untuk memilih
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Mendukung .xlsx, .xls, .csv (maks. 10 MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Preview */}
      {hasData && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base">
                Preview Data
                <Badge className="ml-2 bg-green-100 text-green-700 border-green-200 font-medium">
                  {state.rawData.length} baris × {state.columns.length} kolom
                </Badge>
              </CardTitle>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push("/mapping")}
                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-medium transition-colors"
                >
                  Lanjut Mapping →
                </button>
                <button
                  onClick={() => {
                    clearAll();
                    setError(null);
                  }}
                  className="text-sm text-slate-500 hover:text-red-600 flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> Hapus
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    {state.columns.map((col) => (
                      <TableHead key={col} className="text-xs whitespace-nowrap px-3">
                        {col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, i) => (
                    <TableRow key={i}>
                      {state.columns.map((col) => (
                        <TableCell key={col} className="text-xs px-3 py-2 whitespace-nowrap">
                          {String(row[col] ?? "")}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {state.rawData.length > PREVIEW_ROWS && (
              <p className="text-xs text-slate-400 mt-2">
                Menampilkan {PREVIEW_ROWS} dari {state.rawData.length} baris.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
