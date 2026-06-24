"use client";

import { useState, useEffect, useCallback } from "react";
import { loadThesisState, saveThesisState, ThesisState } from "@/lib/thesis/store";
import { independentVariables, dependentVariables } from "@/lib/thesis/variables";
import { getQuestionnaire, VariableQuestionnaire } from "@/lib/thesis/questionnaire";
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
import { Download, AlertCircle, Settings2 } from "lucide-react";
import { toast } from "sonner";

const LIKERT = [
  { score: 1, label: "STS" },
  { score: 2, label: "TS" },
  { score: 3, label: "KS" },
  { score: 4, label: "S" },
  { score: 5, label: "SS" },
];

export default function KuesionerPage() {
  const [form, setForm] = useState<ThesisState>({ x1: "", x2: "", y: "", objek: "" });
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    const saved = loadThesisState();
    setForm(saved);
    if (!saved.x1 || !saved.x2 || !saved.y) setShowConfig(true);
  }, []);

  const update = useCallback((key: keyof ThesisState, val: string) => {
    setForm((prev) => {
      const next = { ...prev, [key]: val };
      saveThesisState(next);
      return next;
    });
  }, []);

  const isReady = !!form.x1 && !!form.x2 && !!form.y;

  const x1Data = isReady ? getQuestionnaire(form.x1) : null;
  const x2Data = isReady ? getQuestionnaire(form.x2) : null;
  const yData = isReady ? getQuestionnaire(form.y) : null;

  const judul = isReady && form.objek
    ? `Pengaruh ${form.x1} dan ${form.x2} Terhadap ${form.y} Pada ${form.objek}`
    : isReady
    ? `Pengaruh ${form.x1} dan ${form.x2} Terhadap ${form.y}`
    : "";

  async function handleExport() {
    if (!isReady || !x1Data || !x2Data || !yData) return;
    setLoading(true);
    try {
      const { generateDocx } = await import("@/lib/thesis/docxExport");
      const blob = await generateDocx({
        judul,
        x1: form.x1,
        x2: form.x2,
        y: form.y,
        objek: form.objek || "Objek Penelitian",
        x1Data,
        x2Data,
        yData,
      });

      const fileName = `Kuesioner-${form.x1}-${form.x2}-${form.y}`.replace(/\s+/g, "-") + ".docx";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("DOCX kuesioner berhasil dibuat");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Gagal membuat DOCX");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Generator Kuesioner</h1>
          <p className="text-slate-500 text-sm mt-1">
            Kuesioner otomatis berdasarkan variabel penelitian. Ekspor ke DOCX siap cetak.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="inline-flex items-center gap-1.5 text-sm text-slate-600 border border-slate-300 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors"
          >
            <Settings2 className="w-4 h-4" />
            {showConfig ? "Tutup" : "Ubah Variabel"}
          </button>
          <button
            onClick={handleExport}
            disabled={!isReady || loading}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Mengekspor...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export Kuesioner (.docx)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Config panel */}
      {showConfig && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Variabel X1</label>
                <select
                  value={form.x1}
                  onChange={(e) => update("x1", e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Pilih --</option>
                  {independentVariables.map((v) => (
                    <option key={v} value={v} disabled={v === form.x2}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Variabel X2</label>
                <select
                  value={form.x2}
                  onChange={(e) => update("x2", e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Pilih --</option>
                  {independentVariables.map((v) => (
                    <option key={v} value={v} disabled={v === form.x1}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Variabel Y</label>
                <select
                  value={form.y}
                  onChange={(e) => update("y", e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Pilih --</option>
                  {dependentVariables.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Objek Penelitian</label>
                <input
                  type="text"
                  value={form.objek}
                  onChange={(e) => update("objek", e.target.value)}
                  placeholder="Nama toko/perusahaan"
                  className="w-full text-sm border border-slate-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isReady && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Pilih variabel X1, X2, dan Y terlebih dahulu. Anda juga dapat mengatur variabel dari halaman{" "}
            <a href="/judul" className="text-blue-600 underline font-medium">Generator Judul</a>.
          </AlertDescription>
        </Alert>
      )}

      {/* Judul preview */}
      {isReady && judul && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
          <p className="text-xs text-slate-500 font-medium mb-1">Judul Penelitian</p>
          <p className="text-sm font-semibold text-slate-800">{judul}</p>
        </div>
      )}

      {/* Questionnaire sections */}
      {isReady && x1Data && x2Data && yData && (
        <div className="space-y-8">
          {[
            { key: "X1", label: form.x1, data: x1Data },
            { key: "X2", label: form.x2, data: x2Data },
            { key: "Y", label: form.y, data: yData },
          ].map(({ key, label, data }) => (
            <QuestionnaireSection key={key} variableKey={key} variableLabel={label} data={data} />
          ))}
        </div>
      )}

      {/* Likert legend */}
      {isReady && (
        <Card className="bg-slate-50">
          <CardContent className="pt-4">
            <p className="text-xs font-semibold text-slate-600 mb-2">Keterangan Skala Likert:</p>
            <div className="flex flex-wrap gap-2">
              {LIKERT.map(({ score, label }) => (
                <div key={score} className="text-xs bg-white border border-slate-200 rounded px-2.5 py-1">
                  <span className="font-bold text-slate-700">{score} = {label}</span>
                </div>
              ))}
              <span className="text-xs text-slate-400 self-center ml-2">
                STS=Sangat Tidak Setuju · TS=Tidak Setuju · KS=Kurang Setuju · S=Setuju · SS=Sangat Setuju
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function QuestionnaireSection({
  variableKey,
  variableLabel,
  data,
}: {
  variableKey: string;
  variableLabel: string;
  data: VariableQuestionnaire;
}) {
  const colorMap: Record<string, string> = {
    X1: "bg-blue-50 border-blue-200 text-blue-800",
    X2: "bg-purple-50 border-purple-200 text-purple-800",
    Y: "bg-green-50 border-green-200 text-green-800",
  };
  const headerColor = colorMap[variableKey] ?? "bg-slate-50 border-slate-200 text-slate-800";

  return (
    <Card className="overflow-hidden">
      <CardHeader className={`pb-3 border-b ${headerColor}`}>
        <CardTitle className="text-base flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="font-mono font-bold">
            {variableKey}
          </Badge>
          {variableLabel}
          <span className="text-xs font-normal ml-2 opacity-70">
            {data.items.length} item
          </span>
        </CardTitle>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {data.indicators.map((ind) => (
            <span key={ind} className="text-xs bg-white/60 border border-current/20 rounded px-2 py-0.5 opacity-80">
              {ind}
            </span>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="text-xs w-12 text-center">No</TableHead>
                <TableHead className="text-xs w-32">Indikator</TableHead>
                <TableHead className="text-xs">Pernyataan</TableHead>
                {LIKERT.map(({ score, label }) => (
                  <TableHead key={score} className="text-xs text-center w-12">
                    {label}
                    <br />
                    <span className="text-slate-400 font-normal">({score})</span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item) => (
                <TableRow key={item.no} className={item.no % 2 === 0 ? "bg-slate-50/50" : ""}>
                  <TableCell className="text-xs text-center font-medium">{item.no}</TableCell>
                  <TableCell className="text-xs text-slate-500">{item.indicator}</TableCell>
                  <TableCell className="text-xs text-slate-700">{item.statement}</TableCell>
                  {LIKERT.map(({ score }) => (
                    <TableCell key={score} className="text-center">
                      <div className="w-5 h-5 border-2 border-slate-300 rounded mx-auto" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
