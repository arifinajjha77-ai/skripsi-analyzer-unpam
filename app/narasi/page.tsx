"use client";

import { useMemo, useState, useCallback } from "react";
import { useAppContext } from "@/lib/context";
import { computeValidity } from "@/lib/statistics/validity";
import { computeCronbachAlpha } from "@/lib/statistics/reliability";
import {
  computeRegression,
  computeMulticollinearity,
  computeNormality,
  computeHeteroskedasticity,
} from "@/lib/statistics/regression";
import { generateBab4Enhanced } from "@/lib/narratives/generator";
import { buildDaftarPustakaList, dedupeRefs, formatInlineCitations } from "@/lib/reference-engine";
import type { Reference } from "@/lib/reference-engine";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle, Copy, Check, Download, BookOpen, List, FileText,
  Quote,
} from "lucide-react";
import { toast } from "sonner";

// ─── Copy button util ─────────────────────────────────────────────────────────

function CopyButton({ text, label = "Salin" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const el = document.createElement("textarea");
      el.value = text; document.body.appendChild(el); el.select();
      document.execCommand("copy"); document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Tersalin!" : label}
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NarasiPage() {
  const { state } = useAppContext();
  const [exporting, setExporting] = useState(false);

  // ── Compute stats ──────────────────────────────────────────────────────────

  const yVar = state.variables.find((v) => v.key === "Y");
  const xVars = state.variables.filter((v) => v.key !== "Y");

  const computedData = useMemo(() => {
    if (!state.rawData.length || state.variables.length < 2 || !yVar) return null;
    const validityResults         = xVars.concat(yVar ? [yVar] : []).map((v) => computeValidity(state.rawData, v, state.rTableValue));
    const reliabilityResults      = [...xVars, ...(yVar ? [yVar] : [])].map((v) => computeCronbachAlpha(state.rawData, v));
    const regressionResult        = computeRegression(state.rawData, xVars, yVar);
    const multicollinearityResults= computeMulticollinearity(state.rawData, xVars);
    const normalityResult         = computeNormality(state.rawData, xVars, yVar);
    const heteroskedasticityResults = computeHeteroskedasticity(state.rawData, xVars, yVar);
    return { validityResults, reliabilityResults, regressionResult, multicollinearityResults, normalityResult, heteroskedasticityResults };
  }, [state.rawData, state.variables, state.rTableValue, xVars, yVar]);

  const enhanced = useMemo(() => {
    if (!computedData || !yVar) return null;
    return generateBab4Enhanced({
      ...computedData,
      yVariable: yVar,
    });
  }, [computedData, yVar]);

  const narasi    = enhanced?.text ?? "";
  const refsUsed  = enhanced?.refsUsed ?? [];
  const daftarList = useMemo(() => buildDaftarPustakaList(refsUsed), [refsUsed]);
  const inlineCit  = useMemo(() => formatInlineCitations(refsUsed), [refsUsed]);

  // ── Export DOCX ────────────────────────────────────────────────────────────

  const handleExport = useCallback(async () => {
    if (!narasi) return;
    setExporting(true);
    try {
      const { generateBab4Docx } = await import("@/lib/narasi/docxExport");
      const blob = await generateBab4Docx(narasi, refsUsed);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = "BAB-IV-Narasi-Daftar-Pustaka.docx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("BAB IV + Daftar Pustaka DOCX berhasil dibuat");
    } catch (e) {
      console.error(e);
      toast.error("Gagal membuat DOCX");
    }
    setExporting(false);
  }, [narasi, refsUsed]);

  // ── Guards ─────────────────────────────────────────────────────────────────

  if (!state.rawData.length || state.variables.length < 2) {
    return (
      <div className="max-w-3xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Data belum tersedia. Silakan upload data dan lakukan mapping variabel terlebih dahulu.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!yVar) {
    return (
      <div className="max-w-3xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Variabel Y belum di-mapping. Silakan kembali ke halaman Mapping Variabel.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Narasi BAB IV</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Hasil penelitian + dasar teori + sitasi otomatis · {state.rawData.length} responden
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || !narasi}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors shrink-0"
        >
          <Download className="w-4 h-4" />
          {exporting ? "Membuat..." : "Export DOCX"}
        </button>
      </div>

      {/* Template info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
        <BookOpen className="w-4 h-4 shrink-0" />
        Narasi dilengkapi dasar teori dari Ghozali (2018), Sugiyono (2019), Arikunto (2016), Priyatno (2016) dan Hair et al. (2019).
        Format dokumen mengikuti pedoman penulisan kampus yang dipilih di{" "}
        <a href="/settings/template" className="underline font-medium">Template</a>.
      </div>

      {/* Tabs */}
      <Tabs defaultValue="narasi">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="narasi" className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> BAB IV
          </TabsTrigger>
          <TabsTrigger value="referensi" className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> Referensi
          </TabsTrigger>
          <TabsTrigger value="daftar-pustaka" className="flex items-center gap-1.5">
            <List className="w-3.5 h-3.5" /> Daftar Pustaka
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: BAB IV Narasi ────────────────────────────────── */}
        <TabsContent value="narasi" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3 border-b">
              <CardTitle className="text-base">Narasi BAB IV – Hasil & Pembahasan</CardTitle>
              <div className="flex gap-2">
                <CopyButton text={narasi} label="Salin Narasi" />
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap font-serif text-[15px]">
                {narasi}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2: Referensi ─────────────────────────────────────── */}
        <TabsContent value="referensi" className="mt-4 space-y-4">

          {/* Inline citations */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <Quote className="w-4 h-4 text-blue-500" />
                Sitasi Inline
              </CardTitle>
              <CopyButton text={inlineCit} label="Copy Sitasi" />
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm text-slate-500 mb-2">Format: author-date untuk sisipkan dalam teks</p>
              <div className="bg-slate-50 rounded-lg px-4 py-3 font-mono text-sm text-slate-700 border border-slate-200">
                {inlineCit}
              </div>
            </CardContent>
          </Card>

          {/* Reference cards */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-700">
              Referensi yang Digunakan ({dedupeRefs(refsUsed).length} sumber)
            </h2>
            {dedupeRefs(refsUsed).map((ref: Reference) => (
              <Card key={ref.id} className="border-l-4 border-l-blue-400">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{ref.judul}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {ref.penulis.join(", ")} · {ref.tahun}
                        {ref.edisi ? ` · Edisi ${ref.edisi}` : ""} · {ref.kota}: {ref.penerbit}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-mono font-semibold whitespace-nowrap">
                      {ref.apaInText}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {ref.topik.map((t) => (
                      <span key={t} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize">
                        {t.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>

                  {ref.topik.slice(0, 1).map((t) => (
                    ref.aturan[t] ? (
                      <div key={t} className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-800">
                        <span className="font-semibold">Kriteria: </span>{ref.aturan[t]}
                      </div>
                    ) : null
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── Tab 3: Daftar Pustaka ────────────────────────────────── */}
        <TabsContent value="daftar-pustaka" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <List className="w-4 h-4 text-blue-500" />
                Daftar Pustaka — APA 7th Edition
              </CardTitle>
              <CopyButton
                text={daftarList.map((d) => d.text).join("\n\n")}
                label="Copy Daftar Pustaka"
              />
            </CardHeader>
            <CardContent className="pt-5 space-y-3">
              <p className="text-xs text-slate-400">
                {daftarList.length} referensi · Urut alfabet penulis · Hanya yang digunakan dalam analisis
              </p>
              <div className="space-y-4">
                {daftarList.map((item, i) => (
                  <div key={item.id} className="flex gap-3">
                    <span className="text-xs text-slate-400 w-5 mt-0.5 shrink-0">{i + 1}.</span>
                    <p className="text-sm text-slate-700 leading-relaxed font-serif"
                       style={{ textIndent: "-1.25em", paddingLeft: "1.25em" }}>
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Action bar */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                <CopyButton
                  text={daftarList.map((d) => d.text).join("\n\n")}
                  label="Generate Daftar Pustaka"
                />
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export BAB IV + Daftar Pustaka (.docx)
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
        ⚠️ Pastikan data berasal dari responden asli. Seluruh hasil analisis diperoleh berdasarkan data yang Anda unggah.
        Verifikasi ulang referensi dan hasil sebelum diserahkan kepada pembimbing.
      </div>
    </div>
  );
}
