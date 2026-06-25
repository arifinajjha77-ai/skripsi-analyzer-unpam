"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle, XCircle, AlertCircle, ArrowRight, Users,
  CheckCheck, ClipboardList, TrendingUp, ShieldCheck,
  BarChart2, Activity, Database, Lightbulb, Star,
  Sparkles, Copy, Check, Download,
} from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "@/lib/context";
import { computeValidity } from "@/lib/statistics/validity";
import { computeCronbachAlpha } from "@/lib/statistics/reliability";
import {
  computeRegression,
  computeMulticollinearity,
  computeNormality,
  computeHeteroskedasticity,
} from "@/lib/statistics/regression";
import {
  analyzeKelayakan,
  STATUS_META,
  CHECK_STATUS_STYLE,
  type KelayakanCheck,
  type CheckStatus,
  type InsightReport,
  type StatusLevel,
} from "@/lib/kelayakan/analyzer";
import { buildInsightPlainText } from "@/lib/kelayakan/docxExport";

// ─── Check card icons ─────────────────────────────────────────────────────────

const CHECK_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  responden:          Users,
  validitas:          ClipboardList,
  reliabilitas:       ShieldCheck,
  regresi:            TrendingUp,
  uji_t:              BarChart2,
  multikolinearitas:  CheckCheck,
  normalitas:         Activity,
  heteroskedastisitas:Database,
  kelengkapan:        Star,
};

// ─── Status icon ─────────────────────────────────────────────────────────────

function StatusIcon({ status, size = 4 }: { status: CheckStatus; size?: number }) {
  const cls = `w-${size} h-${size}`;
  if (status === "baik")  return <CheckCircle className={`${cls} text-emerald-600`} />;
  if (status === "cukup") return <AlertCircle className={`${cls} text-amber-500`} />;
  return                         <XCircle     className={`${cls} text-red-500`} />;
}

// ─── Check card ───────────────────────────────────────────────────────────────

function CheckCard({ check }: { check: KelayakanCheck }) {
  const Icon  = CHECK_ICONS[check.id] ?? Star;
  const style = CHECK_STATUS_STYLE[check.status];
  const hasScore = check.maxSkor > 0;

  return (
    <div className={`bg-white rounded-xl border p-4 shadow-sm flex flex-col gap-2
      ${check.status === "baik"  ? "border-emerald-200"
      : check.status === "cukup" ? "border-amber-200"
      : "border-red-200"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
            ${check.status === "baik"  ? "bg-emerald-100"
            : check.status === "cukup" ? "bg-amber-100"
            : "bg-red-100"}`}>
            <Icon className={`w-4 h-4
              ${check.status === "baik"  ? "text-emerald-600"
              : check.status === "cukup" ? "text-amber-600"
              : "text-red-600"}`} />
          </div>
          <p className="font-semibold text-sm text-slate-700">{check.label}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {hasScore && <span className="text-xs font-bold text-slate-500">{check.skor}/{check.maxSkor}</span>}
          <StatusIcon status={check.status} size={4} />
        </div>
      </div>
      <span className={`self-start text-xs font-medium px-2.5 py-1 rounded-full ${style.badge}`}>
        {style.icon} {check.nilai}
      </span>
      <p className="text-xs text-slate-500 leading-relaxed">{check.detail}</p>
      {hasScore && (
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
          <div
            className={`h-full rounded-full ${
              check.status === "baik" ? "bg-emerald-500" : check.status === "cukup" ? "bg-amber-400" : "bg-red-400"
            }`}
            style={{ width: `${(check.skor / check.maxSkor) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Insight section card ─────────────────────────────────────────────────────

function InsightSection({
  num, title, items, icon: Icon, color,
}: {
  num: number;
  title: string;
  items: string[];
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-2 ${color}`}>
        <div className={`w-6 h-6 rounded-full ${color.includes("emerald") ? "bg-emerald-100" : color.includes("red") ? "bg-red-100" : color.includes("amber") ? "bg-amber-100" : color.includes("blue") ? "bg-blue-100" : "bg-slate-100"} flex items-center justify-center shrink-0`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <h3 className="text-sm font-bold">
          <span className="text-slate-400 mr-1">{num}.</span>
          {title}
        </h3>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400 italic pl-8">Tidak ada item.</p>
      ) : (
        <ul className="space-y-2 pl-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed">
              <span className="shrink-0 text-slate-300 mt-1">▸</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function KelayakanPage() {
  const { state } = useAppContext();
  const [copied, setCopied]       = useState(false);
  const [exporting, setExporting] = useState(false);

  const yVar   = state.variables.find((v) => v.key === "Y");
  const xVars  = state.variables.filter((v) => v.key !== "Y");
  const hasData = state.rawData.length > 0;
  const hasVars = state.variables.length >= 2 && !!yVar;

  // ── Compute stats ──────────────────────────────────────────────────────────

  const validityResults = useMemo(() => {
    if (!hasData || !hasVars) return [];
    return [...xVars, ...(yVar ? [yVar] : [])].map((v) =>
      computeValidity(state.rawData, v, state.rTableValue)
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.rawData, state.variables, state.rTableValue]);

  const reliabilityResults = useMemo(() => {
    if (!hasData || !hasVars) return [];
    return [...xVars, ...(yVar ? [yVar] : [])].map((v) =>
      computeCronbachAlpha(state.rawData, v)
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.rawData, state.variables]);

  const regressionResult = useMemo(() => {
    if (!hasData || !hasVars) return null;
    try { return computeRegression(state.rawData, xVars, yVar!); }
    catch { return null; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.rawData, state.variables]);

  const multicollinearityResults = useMemo(() => {
    if (!hasData || !hasVars) return [];
    return computeMulticollinearity(state.rawData, xVars);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.rawData, state.variables]);

  const normalityResult = useMemo(() => {
    if (!hasData || !hasVars) return null;
    try { return computeNormality(state.rawData, xVars, yVar!); }
    catch { return null; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.rawData, state.variables]);

  const heteroskedasticityResults = useMemo(() => {
    if (!hasData || !hasVars) return [];
    try { return computeHeteroskedasticity(state.rawData, xVars, yVar!); }
    catch { return []; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.rawData, state.variables]);

  const report = useMemo(() => {
    if (!hasData) return null;
    return analyzeKelayakan({
      n: state.rawData.length,
      validityResults,
      reliabilityResults,
      regressionResult,
      multicollinearityResults,
      normalityResult,
      heteroskedasticityResults,
    });
  }, [hasData, state.rawData.length, validityResults, reliabilityResults,
      regressionResult, multicollinearityResults, normalityResult, heteroskedasticityResults]);

  // ── Copy insight ───────────────────────────────────────────────────────────

  const handleCopy = useCallback(async () => {
    if (!report) return;
    const text = buildInsightPlainText(report.insight, report.totalSkor, report.statusLabel);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text; document.body.appendChild(el); el.select();
      document.execCommand("copy"); document.body.removeChild(el);
    }
    setCopied(true);
    toast.success("Insight berhasil disalin");
    setTimeout(() => setCopied(false), 2000);
  }, [report]);

  // ── Export DOCX ────────────────────────────────────────────────────────────

  const handleExport = useCallback(async () => {
    if (!report) return;
    setExporting(true);
    try {
      const { generateInsightDocx } = await import("@/lib/kelayakan/docxExport");
      const blob = await generateInsightDocx(report.insight, report.totalSkor, report.statusLabel);
      const url = URL.createObjectURL(blob);
      const a   = document.createElement("a");
      a.href     = url;
      a.download = "Kelayakan-Data-Insight.docx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Insight DOCX berhasil dibuat");
    } catch (e) {
      console.error(e);
      toast.error("Gagal membuat DOCX");
    }
    setExporting(false);
  }, [report]);

  // ── Guards ─────────────────────────────────────────────────────────────────

  if (!hasData) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-slate-800">Cek Kelayakan Data</h1>
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center space-y-4">
          <Database className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-600">Data belum diupload</p>
          <p className="text-sm text-slate-400">Upload file Excel/CSV terlebih dahulu, lalu lakukan mapping variabel.</p>
          <Link href="/upload" className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors">
            Upload Data
          </Link>
        </div>
      </div>
    );
  }

  if (!hasVars) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-slate-800">Cek Kelayakan Data</h1>
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <p className="font-semibold text-amber-800">Variabel belum di-mapping</p>
          <p className="text-sm text-amber-700">Data sudah diupload ({state.rawData.length} responden). Lakukan mapping variabel X1, X2, dan Y terlebih dahulu.</p>
          <Link href="/mapping" className="inline-block mt-2 px-4 py-2 bg-amber-500 text-white text-sm rounded-xl hover:bg-amber-600 transition-colors">
            Mapping Variabel
          </Link>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const statusMeta  = STATUS_META[report.statusLabel];
  const mainChecks  = report.checks.filter((c) => c.id !== "uji_t");
  const ujiTCheck   = report.checks.find((c) => c.id === "uji_t");
  const { insight } = report;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Header ────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Cek Kelayakan Data</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Laporan otomatis kondisi data penelitian · {state.rawData.length} responden · {state.variables.length} variabel
        </p>
      </div>

      {/* ── Status Card ───────────────────────────────────── */}
      <div className={`rounded-2xl border-2 p-6 ${statusMeta.color}`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-medium opacity-70 mb-1">Status Data Penelitian</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{statusMeta.emoji}</span>
              <div>
                <p className="text-2xl font-bold">{statusMeta.label}</p>
                <p className="text-sm opacity-70">{state.fileName || "data penelitian"}</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium opacity-70">Skor Kelayakan</p>
            <p className="text-5xl font-bold tabular-nums">{report.totalSkor}</p>
            <p className="text-sm opacity-70">dari 100</p>
          </div>
        </div>
        <div className="mt-5">
          <div className="w-full h-3 bg-black/10 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${statusMeta.bar}`}
              style={{ width: `${report.totalSkor}%` }} />
          </div>
          <div className="flex justify-between mt-1 text-xs opacity-60">
            <span>0 — Belum Layak</span>
            <span>55 — Cukup</span>
            <span>85 — Sangat Baik</span>
          </div>
        </div>
      </div>

      {/* ── Check Cards Grid ──────────────────────────────── */}
      <div>
        <h2 className="text-sm font-bold text-slate-700 mb-3">Hasil Pemeriksaan Detail</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {mainChecks.map((check) => <CheckCard key={check.id} check={check} />)}
          {ujiTCheck && <CheckCard check={ujiTCheck} />}
        </div>
      </div>

      {/* ── Simple Good / Bad / Suggestions ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-sm">
          <h3 className="text-sm font-bold text-emerald-700 flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4" /> Yang Sudah Baik
          </h3>
          {report.yangBaik.length === 0
            ? <p className="text-xs text-slate-400 italic">Belum ada komponen yang baik.</p>
            : <ul className="space-y-1.5">{report.yangBaik.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-emerald-500 shrink-0 mt-0.5">✔</span><span>{item}</span>
                </li>
              ))}</ul>
          }
        </div>
        <div className="bg-white rounded-2xl border border-red-200 p-4 shadow-sm">
          <h3 className="text-sm font-bold text-red-600 flex items-center gap-2 mb-3">
            <XCircle className="w-4 h-4" /> Yang Perlu Diperbaiki
          </h3>
          {report.yangPerluDiperbaiki.length === 0
            ? <p className="text-xs text-emerald-600 italic">Tidak ada masalah! 🎉</p>
            : <ul className="space-y-1.5">{report.yangPerluDiperbaiki.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-red-500 shrink-0 mt-0.5">⚠</span><span>{item}</span>
                </li>
              ))}</ul>
          }
        </div>
        <div className="bg-white rounded-2xl border border-amber-200 p-4 shadow-sm">
          <h3 className="text-sm font-bold text-amber-700 flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4" /> Saran Perbaikan
          </h3>
          {report.saranPerbaikan.length === 0
            ? <p className="text-xs text-emerald-600 italic">Data sudah sangat baik!</p>
            : <ul className="space-y-2">{report.saranPerbaikan.map((saran, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-amber-500 shrink-0 font-bold mt-0.5">{i + 1}.</span><span>{saran}</span>
                </li>
              ))}</ul>
          }
        </div>
      </div>

      {/* ── Score Breakdown ───────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-700 mb-4">Rincian Skor Kelayakan</h2>
        <div className="space-y-2.5">
          {report.checks.filter((c) => c.maxSkor > 0).map((c) => {
            const pct = Math.round((c.skor / c.maxSkor) * 100);
            return (
              <div key={c.id} className="flex items-center gap-3">
                <span className="text-sm text-slate-600 w-44 shrink-0 truncate">{c.label}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${
                    c.status === "baik" ? "bg-emerald-500" : c.status === "cukup" ? "bg-amber-400" : "bg-red-400"
                  }`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-600 w-12 text-right shrink-0">{c.skor}/{c.maxSkor}</span>
              </div>
            );
          })}
          <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700">Total</span>
            <span className="text-lg font-bold text-blue-600">{report.totalSkor}/100</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* ── INSIGHT ENGINE ────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-2xl p-6 shadow-xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">Insight Engine</h2>
              <p className="text-xs text-blue-300">Analisis mendalam · Bahasa Indonesia sederhana</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Tersalin!" : "Salin Insight"}
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-400 disabled:opacity-50 rounded-lg transition-colors font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              {exporting ? "Membuat..." : "Export DOCX"}
            </button>
          </div>
        </div>

        {/* 6 sections */}
        <div className="space-y-6 divide-y divide-white/10">

          {/* 1. Ringkasan */}
          <div className="pt-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full">01</span>
              <h3 className="text-sm font-bold text-blue-200">Ringkasan Hasil</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{insight.ringkasan}</p>
          </div>

          {/* 2. Yang Sudah Baik */}
          <div className="pt-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full">02</span>
              <h3 className="text-sm font-bold text-emerald-300">Hal yang Sudah Baik</h3>
            </div>
            {insight.yangBaik.length === 0
              ? <p className="text-sm text-slate-400 italic">Belum ada komponen dalam kondisi optimal.</p>
              : <ul className="space-y-2">
                  {insight.yangBaik.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300 leading-relaxed">
                      <span className="text-emerald-400 shrink-0 mt-0.5">✔</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
            }
          </div>

          {/* 3. Yang Perlu Diperhatikan */}
          <div className="pt-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold bg-red-500/30 text-red-300 px-2 py-0.5 rounded-full">03</span>
              <h3 className="text-sm font-bold text-red-300">Hal yang Perlu Diperhatikan</h3>
            </div>
            {insight.yangPerluDiperhatikan.length === 0
              ? <p className="text-sm text-emerald-400 italic">Tidak ditemukan masalah signifikan pada data Anda. 🎉</p>
              : <ul className="space-y-2.5">
                  {insight.yangPerluDiperhatikan.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300 leading-relaxed">
                      <span className="text-red-400 shrink-0 mt-0.5">⚠</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
            }
          </div>

          {/* 4. Kemungkinan Penyebab */}
          <div className="pt-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full">04</span>
              <h3 className="text-sm font-bold text-amber-300">Kemungkinan Penyebab</h3>
            </div>
            <ul className="space-y-3">
              {insight.kemungkinanPenyebab.map((item, i) => (
                <li key={i} className="text-sm text-slate-300 leading-relaxed bg-white/5 rounded-xl p-3 border border-white/10">
                  <span className="text-amber-400 font-bold mr-2">▸</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* 5. Saran Perbaikan */}
          <div className="pt-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full">05</span>
              <h3 className="text-sm font-bold text-purple-300">Saran Perbaikan</h3>
            </div>
            <ol className="space-y-2.5">
              {insight.saranPerbaikan.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-purple-500/30 text-purple-300 flex items-center justify-center text-xs font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* 6. Kesimpulan Akhir */}
          <div className="pt-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold bg-slate-500/50 text-slate-300 px-2 py-0.5 rounded-full">06</span>
              <h3 className="text-sm font-bold text-slate-200">Kesimpulan Akhir</h3>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-sm text-slate-200 leading-relaxed italic">
                &ldquo;{insight.kesimpulanAkhir}&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Actions ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <Link
          href="/deskriptif"
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-md shadow-blue-200"
        >
          Lanjut ke Analisis <ArrowRight className="w-4 h-4" />
        </Link>
        <Link href="/validitas" className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-medium rounded-xl transition-colors">
          Detail Validitas
        </Link>
        <Link href="/regresi" className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-medium rounded-xl transition-colors">
          Detail Regresi
        </Link>
      </div>

      <p className="text-xs text-slate-400 text-center pb-4">
        ⚠️ Laporan ini bersifat panduan awal berbasis algoritma. Selalu konsultasikan hasil dengan dosen pembimbing Anda.
      </p>
    </div>
  );
}
