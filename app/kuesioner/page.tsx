"use client";

import { useState, useEffect, useCallback } from "react";
import { loadThesisState, saveThesisState, ThesisState } from "@/lib/thesis/store";
import { independentVariables, dependentVariables } from "@/lib/thesis/variables";
import { getQuestionnaire, VariableQuestionnaire } from "@/lib/thesis/questionnaire";
import { getVariableKnowledge, VariableKnowledge } from "@/lib/thesis/variableKnowledge";
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
import {
  Download,
  AlertCircle,
  Settings2,
  BookOpen,
  Printer,
  ExternalLink,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  BookMarked,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const LIKERT = [
  { score: 1, label: "STS" },
  { score: 2, label: "TS" },
  { score: 3, label: "KS" },
  { score: 4, label: "S" },
  { score: 5, label: "SS" },
];

type Mode = "belajar" | "cetak";

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function KuesionerPage() {
  const [form, setForm] = useState<ThesisState>({ x1: "", x2: "", y: "", objek: "" });
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [mode, setMode] = useState<Mode>("belajar");

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

  const variables = isReady && x1Data && x2Data && yData
    ? [
        { key: "X1", label: form.x1, data: x1Data },
        { key: "X2", label: form.x2, data: x2Data },
        { key: "Y",  label: form.y,  data: yData  },
      ]
    : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Generator Kuesioner
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Kuesioner otomatis berdasarkan variabel penelitian. Ekspor ke DOCX siap cetak.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/variabel"
            className="inline-flex items-center gap-1.5 text-sm text-indigo-600 border border-indigo-300 rounded-lg px-3 py-2 hover:bg-indigo-50 transition-colors dark:text-indigo-400 dark:border-indigo-700 dark:hover:bg-indigo-950"
          >
            <BookMarked className="w-4 h-4" />
            Pelajari Variabel
          </Link>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="inline-flex items-center gap-1.5 text-sm text-slate-600 border border-slate-300 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors dark:text-slate-300 dark:border-slate-600"
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
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/30 dark:border-blue-800">
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Variabel X1</label>
                <select
                  value={form.x1}
                  onChange={(e) => update("x1", e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
                >
                  <option value="">-- Pilih --</option>
                  {independentVariables.map((v) => (
                    <option key={v} value={v} disabled={v === form.x2}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Variabel X2</label>
                <select
                  value={form.x2}
                  onChange={(e) => update("x2", e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
                >
                  <option value="">-- Pilih --</option>
                  {independentVariables.map((v) => (
                    <option key={v} value={v} disabled={v === form.x1}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Variabel Y</label>
                <select
                  value={form.y}
                  onChange={(e) => update("y", e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
                >
                  <option value="">-- Pilih --</option>
                  {dependentVariables.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Objek Penelitian</label>
                <input
                  type="text"
                  value={form.objek}
                  onChange={(e) => update("objek", e.target.value)}
                  placeholder="Nama toko/perusahaan"
                  className="w-full text-sm border border-slate-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
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
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Judul Penelitian</p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{judul}</p>
        </div>
      )}

      {/* Mode Toggle */}
      {isReady && (
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
          <button
            onClick={() => setMode("belajar")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              mode === "belajar"
                ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Mode Belajar
          </button>
          <button
            onClick={() => setMode("cetak")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              mode === "cetak"
                ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
            }`}
          >
            <Printer className="w-4 h-4" />
            Mode Cetak
          </button>
        </div>
      )}

      {/* Mode description */}
      {isReady && mode === "belajar" && (
        <div className="flex items-start gap-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-lg px-4 py-3">
          <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-sm text-indigo-700 dark:text-indigo-300">
            <strong>Mode Belajar</strong> menampilkan penjelasan mendalam tentang setiap variabel, indikator, dan item pertanyaan. 
            Klik ikon <strong>❓</strong> di setiap pertanyaan untuk melihat penjelasannya. 
            Gunakan <strong>Mode Cetak</strong> untuk tampilan siap cetak atau ekspor DOCX.
          </p>
        </div>
      )}

      {/* Questionnaire sections */}
      {isReady && variables.length > 0 && (
        <div className="space-y-8">
          {variables.map(({ key, label, data }) =>
            mode === "belajar" ? (
              <BelajarSection
                key={key}
                variableKey={key}
                variableLabel={label}
                data={data}
                objek={form.objek}
              />
            ) : (
              <QuestionnaireSection
                key={key}
                variableKey={key}
                variableLabel={label}
                data={data}
              />
            )
          )}
        </div>
      )}

      {/* Likert legend */}
      {isReady && (
        <Card className="bg-slate-50 dark:bg-slate-800">
          <CardContent className="pt-4">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">Keterangan Skala Likert:</p>
            <div className="flex flex-wrap gap-2">
              {LIKERT.map(({ score, label }) => (
                <div key={score} className="text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-2.5 py-1">
                  <span className="font-bold text-slate-700 dark:text-slate-200">{score} = {label}</span>
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

// ─── Mode Cetak Section (unchanged) ──────────────────────────────────────────

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
    X1: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-200",
    X2: "bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-200",
    Y: "bg-green-50 border-green-200 text-green-800 dark:bg-green-950/40 dark:border-green-800 dark:text-green-200",
  };
  const headerColor = colorMap[variableKey] ?? "bg-slate-50 border-slate-200 text-slate-800";

  return (
    <Card className="overflow-hidden">
      <CardHeader className={`pb-3 border-b ${headerColor}`}>
        <CardTitle className="text-base flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="font-mono font-bold">{variableKey}</Badge>
          {variableLabel}
          <span className="text-xs font-normal ml-2 opacity-70">{data.items.length} item</span>
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
              <TableRow className="bg-slate-50 dark:bg-slate-800">
                <TableHead className="text-xs w-12 text-center">No</TableHead>
                <TableHead className="text-xs w-32">Indikator</TableHead>
                <TableHead className="text-xs">Pernyataan</TableHead>
                {LIKERT.map(({ score, label }) => (
                  <TableHead key={score} className="text-xs text-center w-12">
                    {label}<br />
                    <span className="text-slate-400 font-normal">({score})</span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item) => (
                <TableRow key={item.no} className={item.no % 2 === 0 ? "bg-slate-50/50 dark:bg-slate-800/30" : ""}>
                  <TableCell className="text-xs text-center font-medium">{item.no}</TableCell>
                  <TableCell className="text-xs text-slate-500 dark:text-slate-400">{item.indicator}</TableCell>
                  <TableCell className="text-xs text-slate-700 dark:text-slate-300">{item.statement}</TableCell>
                  {LIKERT.map(({ score }) => (
                    <TableCell key={score} className="text-center">
                      <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded mx-auto" />
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

// ─── Mode Belajar Section ─────────────────────────────────────────────────────

function BelajarSection({
  variableKey,
  variableLabel,
  data,
  objek,
}: {
  variableKey: string;
  variableLabel: string;
  data: VariableQuestionnaire;
  objek: string;
}) {
  const knowledge = getVariableKnowledge(variableLabel);

  const colorConfig: Record<string, { border: string; badge: string; accent: string; dot: string }> = {
    X1: {
      border: "border-blue-200 dark:border-blue-800",
      badge: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      accent: "bg-blue-600",
      dot: "bg-blue-500",
    },
    X2: {
      border: "border-purple-200 dark:border-purple-800",
      badge: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      accent: "bg-purple-600",
      dot: "bg-purple-500",
    },
    Y: {
      border: "border-green-200 dark:border-green-800",
      badge: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      accent: "bg-green-600",
      dot: "bg-green-500",
    },
  };
  const cfg = colorConfig[variableKey] ?? colorConfig.Y;

  // Group items by indicator
  const byIndicator: Record<string, typeof data.items> = {};
  for (const item of data.items) {
    if (!byIndicator[item.indicator]) byIndicator[item.indicator] = [];
    byIndicator[item.indicator].push(item);
  }

  return (
    <div className={`border-2 ${cfg.border} rounded-2xl overflow-hidden`}>
      {/* Variable header */}
      <div className="bg-white dark:bg-slate-900 px-6 py-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{knowledge?.emoji ?? "📚"}</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{variableKey}</span>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{variableLabel}</h2>
              {knowledge && (
                <span className="text-xs text-slate-400 dark:text-slate-500 capitalize border border-slate-200 dark:border-slate-700 rounded px-2 py-0.5">
                  {knowledge.kategori === "independen" ? "Variabel Bebas (X)" : "Variabel Terikat (Y)"}
                </span>
              )}
            </div>
          </div>
        </div>

        {knowledge ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Definisi */}
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Definisi Ilmiah</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{knowledge.definisi}</p>
            </div>
            {/* Bahasa sederhana */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-1">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400">💡 Bahasa Sederhana</p>
              <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">{knowledge.definisiSederhana}</p>
            </div>
            {/* Mengapa digunakan */}
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Mengapa Digunakan?</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{knowledge.mengapaDigunakan}</p>
            </div>
            {/* Contoh */}
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {objek ? `Contoh pada ${objek}` : "Contoh Penerapan"}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{knowledge.contohObjek}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">
            Penjelasan mendalam untuk variabel ini sedang disiapkan.
          </p>
        )}
      </div>

      {/* Indicators + Questions */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {data.indicators.map((indName) => {
          const indKnowledge = knowledge?.indikator.find((i) => i.nama === indName);
          const items = byIndicator[indName] ?? [];
          return (
            <IndicatorBlock
              key={indName}
              indName={indName}
              indKnowledge={indKnowledge}
              items={items}
              dotColor={cfg.dot}
            />
          );
        })}
      </div>

      {/* Tips Penelitian */}
      <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Tips Penelitian</p>
            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
              <li>Apabila responden bingung dengan suatu pertanyaan, peneliti boleh menjelaskan maksudnya tanpa memengaruhi jawaban responden.</li>
              <li>Gunakan bahasa sehari-hari saat menjelaskan pertanyaan — hindari istilah ilmiah yang membingungkan.</li>
              <li>Pastikan responden menjawab berdasarkan pengalaman nyata mereka, bukan berdasarkan apa yang &quot;seharusnya&quot; dijawab.</li>
              <li>Skala 1–5: 1 = Sangat Tidak Setuju, 3 = Netral, 5 = Sangat Setuju.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Referensi */}
      {knowledge && knowledge.referensi.length > 0 && (
        <div className="px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-slate-400" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Daftar Referensi</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {knowledge.referensi.map((ref) => (
              <span
                key={ref.penulis}
                className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1 text-slate-600 dark:text-slate-300"
              >
                {ref.penulis} ({ref.tahun}) — {ref.karya}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Link to variabel page */}
      <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex justify-end">
        <Link
          href="/variabel"
          className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          Lihat penjelasan lengkap di Pusat Belajar Variabel
        </Link>
      </div>
    </div>
  );
}

// ─── Indicator Block ──────────────────────────────────────────────────────────

function IndicatorBlock({
  indName,
  indKnowledge,
  items,
  dotColor,
}: {
  indName: string;
  indKnowledge?: { nama: string; definisi: string; bahasaSederhana: string; contoh: string; mengapa: string };
  items: { no: number; indicator: string; statement: string }[];
  dotColor: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-900">
      {/* Indicator header — clickable accordion */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{indName}</span>
          <span className="text-xs text-slate-400 dark:text-slate-500">{items.length} pertanyaan</span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {open && (
        <div className="px-6 pb-4 space-y-4">
          {/* Indicator knowledge */}
          {indKnowledge && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-sm">
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Definisi</p>
                <p className="text-slate-700 dark:text-slate-300">{indKnowledge.definisi}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Bahasa Sederhana</p>
                <p className="text-slate-700 dark:text-slate-300">{indKnowledge.bahasaSederhana}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Contoh</p>
                <p className="text-slate-700 dark:text-slate-300">{indKnowledge.contoh}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Mengapa Penting?</p>
                <p className="text-slate-700 dark:text-slate-300">{indKnowledge.mengapa}</p>
              </div>
            </div>
          )}

          {/* Questions */}
          <div className="space-y-2">
            {items.map((item) => (
              <QuestionRow key={item.no} item={item} indName={indName} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Question Row with ❓ popover ─────────────────────────────────────────────

function QuestionRow({
  item,
  indName,
}: {
  item: { no: number; indicator: string; statement: string };
  indName: string;
}) {
  const [showExplain, setShowExplain] = useState(false);

  // Algorithmically generate question explanation
  const mengapa = `Pertanyaan ini digunakan untuk mengukur aspek "${indName}" melalui perspektif responden secara langsung. Jawaban dari pertanyaan ini menunjukkan seberapa kuat pengaruh indikator ini pada pengalaman responden.`;
  const yangInginDiukur = `Persepsi responden tentang seberapa setuju mereka dengan pernyataan: "${item.statement}"`;
  const contohKehidupan = `Bayangkan Anda sebagai konsumen. Jika Anda sangat setuju dengan pernyataan ini, berarti ${indName.toLowerCase()} memiliki pengaruh positif pada pengalaman berbelanja Anda.`;

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <div className="flex items-start gap-3 px-4 py-3 bg-white dark:bg-slate-900">
        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 w-5 shrink-0 mt-0.5">{item.no}.</span>
        <p className="text-sm text-slate-700 dark:text-slate-300 flex-1 leading-relaxed">{item.statement}</p>
        <button
          onClick={() => setShowExplain(!showExplain)}
          title="Lihat penjelasan pertanyaan ini"
          className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
            showExplain
              ? "bg-indigo-600 text-white"
              : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 hover:text-indigo-600"
          }`}
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {showExplain && (
        <div className="px-4 py-3 bg-indigo-50 dark:bg-indigo-950/40 border-t border-indigo-100 dark:border-indigo-900 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <p className="font-bold text-indigo-700 dark:text-indigo-400 mb-1">❓ Mengapa ada pertanyaan ini?</p>
              <p className="text-indigo-800 dark:text-indigo-300 leading-relaxed">{mengapa}</p>
            </div>
            <div>
              <p className="font-bold text-indigo-700 dark:text-indigo-400 mb-1">🎯 Yang ingin diukur</p>
              <p className="text-indigo-800 dark:text-indigo-300 leading-relaxed">{yangInginDiukur}</p>
            </div>
            <div>
              <p className="font-bold text-indigo-700 dark:text-indigo-400 mb-1">🌍 Contoh kehidupan sehari-hari</p>
              <p className="text-indigo-800 dark:text-indigo-300 leading-relaxed">{contohKehidupan}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
