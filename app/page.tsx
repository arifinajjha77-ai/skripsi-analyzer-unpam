"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  BookOpen, ClipboardList, Newspaper, GitFork, Table2,
  Upload, Settings2, BarChart2, CheckCircle, ShieldCheck,
  TrendingUp, FileText, Users, Zap, Package, ChevronRight,
  FolderOpen, ArrowRight,
} from "lucide-react";
import { useAppContext } from "@/lib/context";
import { loadThesisState } from "@/lib/thesis/store";
import { loadBab1State } from "@/lib/thesis/bab1Store";
import { loadRespondenState } from "@/lib/responden/store";

// ─── wizard steps ─────────────────────────────────────────────────────────────

const WIZARD_STEPS = [
  { num: 1, label: "Judul",       href: "/judul" },
  { num: 2, label: "Kuesioner",   href: "/kuesioner" },
  { num: 3, label: "BAB I",       href: "/latar-belakang" },
  { num: 4, label: "Kerangka",    href: "/kerangka" },
  { num: 5, label: "Operasional", href: "/operasional" },
  { num: 6, label: "Responden",   href: "/responden" },
  { num: 7, label: "Kelayakan",   href: "/kelayakan" },
  { num: 8, label: "Analisis",    href: "/upload" },
  { num: 9, label: "Export",      href: "/narasi" },
];

// ─── quick actions ─────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: "Buat Judul",    icon: BookOpen,   href: "/judul",       color: "bg-blue-500" },
  { label: "Upload Data",   icon: Upload,     href: "/upload",      color: "bg-violet-500" },
  { label: "Cek Kelayakan", icon: CheckCircle,href: "/kelayakan",   color: "bg-teal-500" },
  { label: "Analisis",      icon: BarChart2,  href: "/deskriptif",  color: "bg-amber-500" },
  { label: "Responden",     icon: Users,      href: "/responden",   color: "bg-emerald-500" },
  { label: "Narasi Bab 4",  icon: FileText,   href: "/narasi",      color: "bg-rose-500" },
];

// ─── all nav cards ─────────────────────────────────────────────────────────────

const NAV_CARDS = [
  { label: "Generator Judul",      desc: "Buat judul, rumusan, hipotesis",     icon: BookOpen,      href: "/judul",           color: "border-blue-200 bg-blue-50",   iconColor: "text-blue-600" },
  { label: "Kuesioner",            desc: "Generate & export kuesioner DOCX",   icon: ClipboardList, href: "/kuesioner",       color: "border-blue-200 bg-blue-50",   iconColor: "text-blue-600" },
  { label: "Latar Belakang",       desc: "Generator BAB I otomatis",           icon: Newspaper,     href: "/latar-belakang",  color: "border-blue-200 bg-blue-50",   iconColor: "text-blue-600" },
  { label: "Kerangka Berpikir",    desc: "Diagram SVG + export PNG",           icon: GitFork,       href: "/kerangka",        color: "border-blue-200 bg-blue-50",   iconColor: "text-blue-600" },
  { label: "Operasional Variabel", desc: "Tabel definisi operasional",         icon: Table2,        href: "/operasional",     color: "border-blue-200 bg-blue-50",   iconColor: "text-blue-600" },
  { label: "Responden Center",     desc: "Import & validasi data responden",   icon: Users,         href: "/responden",       color: "border-violet-200 bg-violet-50",iconColor:"text-violet-600"},
  { label: "Upload Data",          desc: "Upload Excel/CSV analisis",          icon: Upload,        href: "/upload",          color: "border-violet-200 bg-violet-50",iconColor:"text-violet-600"},
  { label: "Mapping Variabel",     desc: "Konfigurasi kolom X1, X2, Y",       icon: Settings2,     href: "/mapping",         color: "border-violet-200 bg-violet-50",iconColor:"text-violet-600"},
  { label: "Cek Kelayakan Data",   desc: "Laporan kelayakan & skor 0–100",     icon: CheckCircle,   href: "/kelayakan",       color: "border-amber-200 bg-amber-50",  iconColor: "text-amber-600" },
  { label: "Deskriptif",           desc: "Frekuensi, mean, kategori Likert",   icon: BarChart2,     href: "/deskriptif",      color: "border-amber-200 bg-amber-50",  iconColor: "text-amber-600" },
  { label: "Validitas",            desc: "Pearson item-total, r-tabel",        icon: CheckCircle,   href: "/validitas",       color: "border-amber-200 bg-amber-50",  iconColor: "text-amber-600" },
  { label: "Reliabilitas",         desc: "Cronbach Alpha per variabel",        icon: ShieldCheck,   href: "/reliabilitas",    color: "border-amber-200 bg-amber-50",  iconColor: "text-amber-600" },
  { label: "Regresi",              desc: "Koefisien, t-test, F-test, R²",     icon: TrendingUp,    href: "/regresi",         color: "border-amber-200 bg-amber-50",  iconColor: "text-amber-600" },
  { label: "Narasi Bab 4",         desc: "Narasi otomatis Bahasa Indonesia",   icon: FileText,      href: "/narasi",          color: "border-amber-200 bg-amber-50",  iconColor: "text-amber-600" },
];

// ─── component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { state } = useAppContext();

  const thesis  = useMemo(() => { try { return loadThesisState(); } catch { return null; } }, []);
  const bab1    = useMemo(() => { try { return loadBab1State();   } catch { return null; } }, []);
  const resp    = useMemo(() => { try { return loadRespondenState(); } catch { return null; } }, []);

  const hasJudul    = !!(thesis?.x1 && thesis?.x2 && thesis?.y);
  const hasBab1     = !!(bab1?.namaObjek);
  const hasResp     = !!(resp?.rows?.length);
  const hasData     = state.rawData.length > 0;
  const hasMapping  = state.variables.length > 0;

  const checklist = [
    { label: "Variabel Penelitian (Judul)",  done: hasJudul },
    { label: "Kuesioner",                    done: hasJudul },
    { label: "Latar Belakang (BAB I)",       done: hasBab1 },
    { label: "Kerangka Berpikir",            done: hasJudul },
    { label: "Operasional Variabel",         done: hasJudul },
    { label: "Upload Responden",             done: hasResp },
    { label: "Upload Data Analisis",         done: hasData },
    { label: "Analisis Statistik",           done: hasMapping },
  ];

  const doneCount = checklist.filter((c) => c.done).length;
  const progress  = Math.round((doneCount / checklist.length) * 100);

  // wizard active step = first not-done step
  const activeStep = (() => {
    if (!hasJudul) return 1;
    if (!hasBab1)  return 3;
    if (!hasResp)  return 6;
    if (!hasData)  return 8;
    if (!hasMapping) return 8;
    return 9;
  })();

  const statCards = [
    { label: "Generator",  value: "5 Tools",   sub: "Judul → Operasional", icon: Package,    color: "bg-blue-500" },
    { label: "Analisis",   value: "5 Uji",     sub: "Deskriptif → Regresi", icon: BarChart2,  color: "bg-amber-500" },
    { label: "Export",     value: "3 Format",  sub: "DOCX · PNG · Excel",   icon: Zap,        color: "bg-emerald-500" },
    { label: "Progress",   value: `${progress}%`, sub: `${doneCount}/${checklist.length} selesai`, icon: CheckCircle, color: "bg-violet-500" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-6 py-8 text-white shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">FEB · Manajemen Pemasaran · UNPAM</p>
            <h1 className="text-3xl font-bold leading-tight mb-2">Skripsi Analyzer UNPAM</h1>
            <p className="text-blue-100 text-base max-w-xl">
              Membantu penyusunan proposal, kuesioner, analisis data dan dokumen skripsi Manajemen.
            </p>
          </div>
          <Link href="/project" className="hidden sm:flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors shrink-0">
            <FolderOpen className="w-4 h-4" />
            Project
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {statCards.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white/10 border border-white/15 rounded-xl p-3.5">
                <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center mb-2`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-xl font-bold leading-none">{s.value}</p>
                <p className="text-blue-200 text-xs mt-1">{s.sub}</p>
                <p className="text-white/70 text-[10px] uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Wizard ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-700 mb-4">Alur Pengerjaan Skripsi</h2>
        <div className="overflow-x-auto">
          <div className="flex items-center gap-0 min-w-max">
            {WIZARD_STEPS.map((step, i) => {
              const isDone   = step.num < activeStep;
              const isActive = step.num === activeStep;
              return (
                <div key={step.num} className="flex items-center">
                  <Link href={step.href} className="flex flex-col items-center gap-1.5 group">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all
                      ${isDone   ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                      : isActive ? "bg-blue-600 text-white shadow-md shadow-blue-200 ring-4 ring-blue-100"
                      : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"}`}
                    >
                      {isDone ? <CheckCircle className="w-4 h-4" /> : step.num}
                    </div>
                    <span className={`text-[11px] font-medium text-center leading-tight max-w-[60px]
                      ${isDone ? "text-emerald-600" : isActive ? "text-blue-700" : "text-slate-400"}`}>
                      {step.label}
                    </span>
                  </Link>
                  {i < WIZARD_STEPS.length - 1 && (
                    <div className={`h-0.5 w-8 mx-1 mb-5 rounded-full transition-colors
                      ${step.num < activeStep ? "bg-emerald-400" : "bg-slate-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Progress + Quick Actions ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Progress */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-700">Progress Skripsi</h2>
            <span className="text-2xl font-bold text-blue-600">{progress}%</span>
          </div>

          {/* Bar */}
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-4">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            {checklist.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0
                  ${item.done ? "bg-emerald-500" : "border-2 border-slate-200"}`}>
                  {item.done && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <span className={`text-sm ${item.done ? "text-slate-700" : "text-slate-400"}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-700 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-2">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">{action.label}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── All Tools Grid ───────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          Semua Fitur
          <span className="text-xs font-normal text-slate-400">{NAV_CARDS.length} tools tersedia</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {NAV_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className={`flex items-start gap-3 p-4 rounded-xl border ${card.color} hover:shadow-md transition-all group`}
              >
                <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${card.iconColor}`} />
                <div className="min-w-0">
                  <p className={`font-semibold text-sm ${card.iconColor}`}>{card.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{card.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 ml-auto shrink-0 mt-0.5 transition-colors" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
