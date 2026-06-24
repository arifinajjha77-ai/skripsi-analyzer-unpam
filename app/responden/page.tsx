"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { parseFile } from "@/lib/excel/parser";
import {
  loadRespondenState,
  saveRespondenState,
  clearRespondenState,
  RespondenState,
} from "@/lib/responden/store";
import { detectColumns, getAllItemColumns } from "@/lib/responden/detector";
import {
  computeKarakteristik,
  runQualityCheck,
  buildKarakteristikNarasi,
} from "@/lib/responden/analyzer";
import { exportCleanData } from "@/lib/responden/excelExport";
import { RespondenRow, FreqRow, QualityIssue } from "@/lib/responden/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  Users,
  ListChecks,
  Layers,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Download,
  Copy,
  Check,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";

// ─── helpers ──────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function handle() {
    try { await navigator.clipboard.writeText(text); }
    catch { const el = document.createElement("textarea"); el.value = text; document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el); }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={handle} className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 border border-slate-200 rounded-md px-2.5 py-1.5 transition-colors">
      {copied ? <><Check className="w-3.5 h-3.5 text-green-500" /> Tersalin</> : <><Copy className="w-3.5 h-3.5" /> Salin</>}
    </button>
  );
}

function FreqTable({ rows, caption }: { rows: FreqRow[]; caption: string }) {
  if (rows.length === 0) return <p className="text-xs text-slate-400 italic">Data tidak tersedia.</p>;
  const total = rows.reduce((s, r) => s + r.frekuensi, 0);
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-xs">
          <thead className="bg-blue-50">
            <tr>
              <th className="text-left px-3 py-2 font-semibold text-slate-700">Kategori</th>
              <th className="text-center px-3 py-2 font-semibold text-slate-700">Frekuensi</th>
              <th className="text-center px-3 py-2 font-semibold text-slate-700">Persentase</th>
              <th className="px-3 py-2 font-semibold text-slate-700">Bar</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const pctNum = parseFloat(r.persentase);
              return (
                <tr key={i} className={`border-t border-slate-100 ${i % 2 === 1 ? "bg-slate-50/50" : ""}`}>
                  <td className="px-3 py-2 font-medium text-slate-700">{r.kategori}</td>
                  <td className="px-3 py-2 text-center">{r.frekuensi}</td>
                  <td className="px-3 py-2 text-center font-medium">{r.persentase}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(100, pctNum)}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-slate-300 bg-blue-50 font-bold">
              <td className="px-3 py-2">Total</td>
              <td className="px-3 py-2 text-center">{total}</td>
              <td className="px-3 py-2 text-center">100%</td>
              <td className="px-3 py-2" />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IssueRow({ issue }: { issue: QualityIssue }) {
  const iconMap = {
    error: <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />,
    info: <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />,
  };
  const bgMap = {
    error: "bg-red-50 border-red-100",
    warning: "bg-amber-50 border-amber-100",
    info: "bg-blue-50 border-blue-100",
  };
  const badgeMap = {
    missing: "bg-red-100 text-red-700",
    duplicate: "bg-amber-100 text-amber-700",
    consistency: "bg-orange-100 text-orange-700",
    demographic: "bg-purple-100 text-purple-700",
  };
  return (
    <div className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border ${bgMap[issue.severity]}`}>
      {iconMap[issue.severity]}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${badgeMap[issue.type]}`}>
            {issue.type === "missing" ? "Missing" : issue.type === "duplicate" ? "Duplikat" : issue.type === "consistency" ? "Konsistensi" : "Demografi"}
          </span>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed">{issue.message}</p>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

const PREVIEW_ROWS = 20;

export default function RespondenPage() {
  const [state, setState] = useState<RespondenState>({ rows: [], columns: [], fileName: "" });
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState("preview");

  useEffect(() => {
    setState(loadRespondenState());
  }, []);

  const detected = useMemo(() => detectColumns(state.columns), [state.columns]);
  const itemCols = useMemo(() => getAllItemColumns(detected), [detected]);
  const karakteristik = useMemo(
    () => state.rows.length > 0 ? computeKarakteristik(state.rows, detected) : null,
    [state.rows, detected]
  );
  const qualityReport = useMemo(
    () => state.rows.length > 0 ? runQualityCheck(state.rows, detected) : null,
    [state.rows, detected]
  );
  const narasi = useMemo(
    () => karakteristik && qualityReport ? buildKarakteristikNarasi(karakteristik, qualityReport) : "",
    [karakteristik, qualityReport]
  );

  const hasData = state.rows.length > 0;

  async function handleFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext ?? "")) {
      setUploadError("Format tidak didukung. Gunakan .xlsx, .xls, atau .csv");
      return;
    }
    setLoading(true);
    setUploadError(null);
    const result = await parseFile(file);
    setLoading(false);
    if (result.error) { setUploadError(result.error); return; }
    const next: RespondenState = { rows: result.data as RespondenRow[], columns: result.columns, fileName: file.name };
    setState(next);
    saveRespondenState(next);
    setActiveTab("preview");
  }

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) await handleFile(file);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleExportDocx() {
    if (!karakteristik || !qualityReport) return;
    setExporting(true);
    try {
      const { generateKarakteristikDocx } = await import("@/lib/responden/karakteristikDocx");
      const blob = await generateKarakteristikDocx(karakteristik, qualityReport);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "Karakteristik-Responden.docx";
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("DOCX karakteristik responden berhasil dibuat");
    } catch (e) { console.error(e); toast.error("Gagal membuat DOCX"); }
    setExporting(false);
  }

  function handleExportClean() {
    if (!qualityReport) return;
    const cleanRows = qualityReport.cleanRowIndices.map((i) => state.rows[i]);
    exportCleanData(cleanRows, state.columns);
    toast.success("Clean data Excel berhasil diunduh");
  }

  const issuesByType = useMemo(() => {
    if (!qualityReport) return { missing: [], duplicate: [], consistency: [], demographic: [] };
    const groups: Record<string, QualityIssue[]> = { missing: [], duplicate: [], consistency: [], demographic: [] };
    for (const iss of qualityReport.issues) groups[iss.type].push(iss);
    return groups;
  }, [qualityReport]);

  const demoColsFound = detected.jenisKelamin || detected.usia || detected.pendidikan || detected.pekerjaan;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Responden Center</h1>
          <p className="text-slate-500 text-sm mt-1">
            Import hasil Google Form, validasi kualitas data, dan analisis karakteristik responden.
          </p>
        </div>
        {hasData && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleExportClean}
              className="inline-flex items-center gap-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-2 rounded-lg transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" /> Download Clean Data
            </button>
            <button
              onClick={handleExportDocx}
              disabled={exporting}
              className="inline-flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-3 py-2 rounded-lg transition-colors"
            >
              {exporting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Mengekspor...</> : <><Download className="w-4 h-4" /> Export Karakteristik</>}
            </button>
            <button onClick={() => { clearRespondenState(); setState({ rows: [], columns: [], fileName: "" }); setUploadError(null); }} className="text-slate-400 hover:text-red-500 p-2 transition-colors" title="Hapus data">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Upload zone */}
      {!hasData && (
        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => document.getElementById("resp-file-input")?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${dragOver ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-white hover:border-blue-300 hover:bg-slate-50"}`}
        >
          <input id="resp-file-input" type="file" accept=".xlsx,.xls,.csv" className="hidden"
            onChange={async (e) => { const f = e.target.files?.[0]; if (f) await handleFile(f); e.target.value = ""; }} />
          {loading ? (
            <div className="space-y-2"><div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" /><p className="text-slate-500 text-sm">Membaca file…</p></div>
          ) : (
            <div className="space-y-3">
              <Upload className="w-12 h-12 text-slate-300 mx-auto" />
              <div>
                <p className="font-semibold text-slate-700">Import Hasil Google Form</p>
                <p className="text-xs text-slate-400 mt-1">Drag & drop atau klik · .xlsx, .xls, .csv</p>
              </div>
              <p className="text-xs text-slate-400">
                Kolom yang dikenali otomatis: Nama, Jenis Kelamin, Usia, Pekerjaan, Pendidikan, X1.*, X2.*, Y.*
              </p>
            </div>
          )}
        </div>
      )}

      {uploadError && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

      {/* Main content */}
      {hasData && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Users, label: "Responden", value: qualityReport?.totalResponden ?? 0, color: "text-blue-600 bg-blue-50" },
              { icon: ListChecks, label: "Pertanyaan", value: qualityReport?.totalItems ?? 0, color: "text-indigo-600 bg-indigo-50" },
              { icon: Layers, label: "Variabel", value: qualityReport?.totalVariables ?? 0, color: "text-violet-600 bg-violet-50" },
              { icon: CheckCircle2, label: "Data Lengkap", value: `${qualityReport?.completenessPercent ?? 0}%`, color: "text-emerald-600 bg-emerald-50" },
            ].map(({ icon: Icon, label, value, color }) => (
              <Card key={label} className="text-center">
                <CardContent className="pt-4 pb-4">
                  <div className={`inline-flex p-2 rounded-xl mb-2 ${color}`}><Icon className="w-5 h-5" /></div>
                  <p className="text-2xl font-bold text-slate-800">{value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Progress bar */}
          {qualityReport && (
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">Progress Kelengkapan Data</span>
                  <span className="text-sm font-bold text-slate-700">
                    {qualityReport.completeResponden}/{qualityReport.totalResponden} ({qualityReport.completenessPercent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${qualityReport.completenessPercent === 100 ? "bg-emerald-500" : qualityReport.completenessPercent >= 80 ? "bg-blue-500" : "bg-amber-500"}`}
                    style={{ width: `${qualityReport.completenessPercent}%` }}
                  />
                </div>
                <div className="flex gap-3 mt-2 flex-wrap">
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">✓ {qualityReport.completeResponden} lengkap</Badge>
                  {qualityReport.totalResponden - qualityReport.completeResponden > 0 && (
                    <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                      ✗ {qualityReport.totalResponden - qualityReport.completeResponden} ada nilai kosong
                    </Badge>
                  )}
                  {state.fileName && <Badge variant="outline" className="text-xs">{state.fileName}</Badge>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detected columns info */}
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs font-semibold text-slate-600 mb-2">Kolom Terdeteksi Otomatis:</p>
              <div className="flex flex-wrap gap-1.5">
                {detected.nama && <Badge variant="outline" className="text-xs">Nama: {detected.nama}</Badge>}
                {detected.jenisKelamin && <Badge variant="outline" className="text-xs">Jenis Kelamin: {detected.jenisKelamin}</Badge>}
                {detected.usia && <Badge variant="outline" className="text-xs">Usia: {detected.usia}</Badge>}
                {detected.pekerjaan && <Badge variant="outline" className="text-xs">Pekerjaan: {detected.pekerjaan}</Badge>}
                {detected.pendidikan && <Badge variant="outline" className="text-xs">Pendidikan: {detected.pendidikan}</Badge>}
                {detected.x1Items.length > 0 && <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">X1: {detected.x1Items.length} item</Badge>}
                {detected.x2Items.length > 0 && <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-xs">X2: {detected.x2Items.length} item</Badge>}
                {detected.yItems.length > 0 && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Y: {detected.yItems.length} item</Badge>}
                {itemCols.length === 0 && <span className="text-xs text-amber-600">⚠ Tidak ada kolom item (X1.*, X2.*, Y.*) terdeteksi</span>}
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full max-w-xl">
              <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
              <TabsTrigger value="karakteristik" className="text-xs">Karakteristik</TabsTrigger>
              <TabsTrigger value="quality" className="text-xs">
                Quality Check
                {qualityReport && qualityReport.issues.filter(i => i.severity === "error" || i.severity === "warning").length > 0 && (
                  <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                    {qualityReport.issues.filter(i => i.severity === "error" || i.severity === "warning").length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="demografi" className="text-xs">Validasi</TabsTrigger>
            </TabsList>

            {/* ── Tab: Preview ── */}
            <TabsContent value="preview" className="mt-4">
              <Card>
                <CardHeader className="pb-3 bg-slate-50 border-b border-slate-200">
                  <CardTitle className="text-sm flex items-center justify-between">
                    Preview Data ({Math.min(PREVIEW_ROWS, state.rows.length)} dari {state.rows.length} baris)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto max-h-96">
                    <Table>
                      <TableHeader className="sticky top-0 bg-slate-50">
                        <TableRow>
                          <TableHead className="text-xs w-10">#</TableHead>
                          {state.columns.map((col) => (
                            <TableHead key={col} className="text-xs whitespace-nowrap px-2">
                              {col}
                              {itemCols.includes(col) && <span className="ml-1 text-blue-400">●</span>}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {state.rows.slice(0, PREVIEW_ROWS).map((row, i) => {
                          const isClean = qualityReport?.cleanRowIndices.includes(i) ?? true;
                          return (
                            <TableRow key={i} className={!isClean ? "bg-red-50/40" : ""}>
                              <TableCell className="text-xs text-slate-400">{i + 1}</TableCell>
                              {state.columns.map((col) => {
                                const val = row[col];
                                const isEmpty = val === "" || val === null || val === undefined;
                                return (
                                  <TableCell key={col} className={`text-xs px-2 py-1.5 ${isEmpty && itemCols.includes(col) ? "bg-red-100 text-red-600 font-medium" : ""}`}>
                                    {isEmpty ? <span className="italic text-slate-300">–</span> : String(val)}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  {state.rows.length > PREVIEW_ROWS && (
                    <p className="text-xs text-slate-400 px-4 py-2">… {state.rows.length - PREVIEW_ROWS} baris lainnya tidak ditampilkan.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Tab: Karakteristik ── */}
            <TabsContent value="karakteristik" className="mt-4 space-y-4">
              {!demoColsFound && (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700">
                    Kolom demografis (Jenis Kelamin, Usia, Pendidikan, Pekerjaan) tidak terdeteksi. Pastikan nama kolom mengandung kata kunci tersebut.
                  </AlertDescription>
                </Alert>
              )}

              {karakteristik && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: "Jenis Kelamin", rows: karakteristik.jenisKelamin },
                    { title: "Kelompok Usia", rows: karakteristik.usia },
                    { title: "Pendidikan Terakhir", rows: karakteristik.pendidikan },
                    { title: "Pekerjaan", rows: karakteristik.pekerjaan },
                  ].map(({ title, rows }) => (
                    <Card key={title} className="overflow-hidden">
                      <CardHeader className="pb-2 bg-slate-50 border-b border-slate-200">
                        <CardTitle className="text-sm">{title}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-3">
                        <FreqTable rows={rows} caption={title} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Narasi */}
              {narasi && (
                <Card>
                  <CardHeader className="pb-3 bg-blue-50 border-b border-blue-100">
                    <CardTitle className="text-sm text-blue-800 flex items-center justify-between">
                      Narasi Karakteristik Responden (Siap Tempel ke BAB IV)
                      <CopyButton text={narasi} />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    {narasi.split("\n\n").map((para, i) => (
                      <p key={i} className="text-sm text-slate-700 leading-relaxed">
                        {para.replace(/\*\*/g, "")}
                      </p>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── Tab: Quality Check ── */}
            <TabsContent value="quality" className="mt-4 space-y-4">
              {qualityReport && (
                <>
                  {/* Summary badges */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      { type: "missing", label: "Missing Value", count: issuesByType.missing.length, color: "bg-red-100 text-red-700" },
                      { type: "duplicate", label: "Duplikat", count: issuesByType.duplicate.length, color: "bg-amber-100 text-amber-700" },
                      { type: "consistency", label: "Konsistensi", count: issuesByType.consistency.length, color: "bg-orange-100 text-orange-700" },
                      { type: "demographic", label: "Demografi", count: issuesByType.demographic.length, color: "bg-purple-100 text-purple-700" },
                    ].map(({ label, count, color }) => (
                      <Badge key={label} className={`${color} border-0 text-xs`}>
                        {label}: {count} isu
                      </Badge>
                    ))}
                    {qualityReport.issues.length === 0 && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                        ✓ Tidak ada isu ditemukan
                      </Badge>
                    )}
                  </div>

                  {/* Issue groups */}
                  {[
                    { key: "missing", title: "Missing Value", icon: <AlertCircle className="w-4 h-4 text-red-500" /> },
                    { key: "duplicate", title: "Data Duplikat", icon: <AlertTriangle className="w-4 h-4 text-amber-500" /> },
                    { key: "consistency", title: "Konsistensi Jawaban", icon: <AlertTriangle className="w-4 h-4 text-orange-500" /> },
                    { key: "demographic", title: "Validasi Demografi", icon: <AlertTriangle className="w-4 h-4 text-purple-500" /> },
                  ].map(({ key, title, icon }) => {
                    const issues = issuesByType[key] ?? [];
                    if (issues.length === 0) return null;
                    return (
                      <Card key={key}>
                        <CardHeader className="pb-2 bg-slate-50 border-b border-slate-200">
                          <CardTitle className="text-sm flex items-center gap-2">{icon}{title} <Badge variant="outline" className="ml-auto text-xs">{issues.length} isu</Badge></CardTitle>
                        </CardHeader>
                        <CardContent className="pt-3 space-y-2">
                          {issues.map((iss, i) => <IssueRow key={i} issue={iss} />)}
                        </CardContent>
                      </Card>
                    );
                  })}

                  {qualityReport.issues.length === 0 && (
                    <div className="text-center py-10">
                      <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                      <p className="text-slate-600 font-medium">Data bersih! Tidak ada isu yang ditemukan.</p>
                      <p className="text-xs text-slate-400 mt-1">Seluruh {qualityReport.totalResponden} responden lolos validasi.</p>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* ── Tab: Validasi ── */}
            <TabsContent value="demografi" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-3 bg-slate-50 border-b border-slate-200">
                  <CardTitle className="text-sm">Distribusi Per Variabel Item</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {itemCols.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">Tidak ada kolom item terdeteksi.</p>
                  ) : (
                    <div className="space-y-3">
                      {[
                        { label: "X1", cols: detected.x1Items, color: "bg-blue-500" },
                        { label: "X2", cols: detected.x2Items, color: "bg-indigo-500" },
                        { label: "Y", cols: detected.yItems, color: "bg-emerald-500" },
                      ].filter(g => g.cols.length > 0).map(({ label, cols, color }) => {
                        const means = cols.map((col) => {
                          const vals = state.rows.map(r => parseFloat(String(r[col] ?? ""))).filter(v => !isNaN(v));
                          return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                        });
                        const overallMean = means.length > 0 ? (means.reduce((a, b) => a + b, 0) / means.length) : 0;
                        return (
                          <div key={label} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge className={`${color.replace("bg-", "bg-").replace("500", "100")} ${color.replace("bg-", "text-").replace("500", "700")} text-xs`}>{label}</Badge>
                              <span className="text-xs text-slate-500">{cols.length} item · Mean keseluruhan: {overallMean.toFixed(2)}</span>
                            </div>
                            <div className="grid grid-cols-5 md:grid-cols-10 gap-1">
                              {cols.map((col, ci) => {
                                const m = means[ci];
                                const heightPct = (m / 5) * 100;
                                return (
                                  <div key={col} className="flex flex-col items-center gap-1">
                                    <div className="w-full h-12 bg-slate-100 rounded flex flex-col justify-end relative">
                                      <div className={`${color} rounded w-full transition-all`} style={{ height: `${heightPct}%` }} />
                                    </div>
                                    <span className="text-[9px] text-slate-400 truncate w-full text-center">{col.split(".").pop()}</span>
                                    <span className="text-[9px] font-medium text-slate-600">{m.toFixed(1)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Demographic issues summary */}
              {issuesByType.demographic.length > 0 && (
                <Card>
                  <CardHeader className="pb-3 bg-purple-50 border-b border-purple-100">
                    <CardTitle className="text-sm text-purple-800">Isu Demografi Terdeteksi</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3 space-y-2">
                    {issuesByType.demographic.map((iss, i) => <IssueRow key={i} issue={iss} />)}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
