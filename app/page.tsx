"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  GraduationCap, BookOpen, FileText, BookMarked, BarChart2,
  PresentationIcon, Bookmark, Library, TrendingUp, Sparkles,
  ChevronRight, ArrowRight, CheckCircle, Clock, Upload,
  ClipboardList, GitFork, Table2, Users, ShieldCheck, Settings2,
  Newspaper, Package, Zap, FolderOpen,
} from "lucide-react";
import { useAppContext } from "@/lib/context";
import { loadThesisState } from "@/lib/thesis/store";
import { loadBab1State } from "@/lib/thesis/bab1Store";
import { loadRespondenState } from "@/lib/responden/store";

// ─── Academic Modules ──────────────────────────────────────────────────────────

interface AcademicModule {
  icon: string;
  label: string;
  desc: string;
  href: string;
  status: "ready" | "beta" | "soon";
  color: string;
  textColor: string;
  borderColor: string;
}

const ACADEMIC_MODULES: AcademicModule[] = [
  {
    icon: "🎓",
    label: "Skripsi",
    desc: "BAB I–IV, analisis statistik, DOCX",
    href: "/judul",
    status: "ready",
    color: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200 hover:border-blue-400",
  },
  {
    icon: "📚",
    label: "Makalah",
    desc: "Cover, BAB I–III, daftar pustaka",
    href: "/makalah",
    status: "beta",
    color: "bg-violet-50",
    textColor: "text-violet-700",
    borderColor: "border-violet-200 hover:border-violet-400",
  },
  {
    icon: "📄",
    label: "Proposal",
    desc: "Proposal penelitian terstruktur",
    href: "#",
    status: "soon",
    color: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
  },
  {
    icon: "📑",
    label: "Jurnal",
    desc: "Abstrak, pendahuluan, metode",
    href: "#",
    status: "soon",
    color: "bg-amber-50",
    textColor: "text-amber-700",
    borderColor: "border-amber-200",
  },
  {
    icon: "📊",
    label: "Presentasi",
    desc: "Outline slide akademik",
    href: "#",
    status: "soon",
    color: "bg-rose-50",
    textColor: "text-rose-700",
    borderColor: "border-rose-200",
  },
  {
    icon: "📈",
    label: "Statistik (SPSS)",
    desc: "Uji validitas, reliabilitas, regresi",
    href: "/upload",
    status: "ready",
    color: "bg-teal-50",
    textColor: "text-teal-700",
    borderColor: "border-teal-200 hover:border-teal-400",
  },
  {
    icon: "📖",
    label: "Resume",
    desc: "CV & portofolio akademik",
    href: "#",
    status: "soon",
    color: "bg-orange-50",
    textColor: "text-orange-700",
    borderColor: "border-orange-200",
  },
  {
    icon: "📚",
    label: "Daftar Pustaka",
    desc: "Format APA, IEEE, Harvard",
    href: "#",
    status: "soon",
    color: "bg-pink-50",
    textColor: "text-pink-700",
    borderColor: "border-pink-200",
  },
  {
    icon: "📖",
    label: "Sitasi",
    desc: "Generator sitasi otomatis",
    href: "#",
    status: "soon",
    color: "bg-indigo-50",
    textColor: "text-indigo-700",
    borderColor: "border-indigo-200",
  },
];

// ─── Roadmap Items ────────────────────────────────────────────────────────────

const ROADMAP = [
  { icon: "📄", label: "Proposal Penelitian" },
  { icon: "📑", label: "Format Jurnal Ilmiah" },
  { icon: "📊", label: "Slide Presentasi" },
  { icon: "📖", label: "Resume & CV Akademik" },
  { icon: "✂️", label: "Parafrase & Plagiarisme" },
  { icon: "🃏", label: "Flashcard Belajar" },
  { icon: "❓", label: "Quiz Generator" },
  { icon: "📚", label: "Daftar Pustaka Auto" },
];

// ─── Skripsi Quick Tools ──────────────────────────────────────────────────────

const SKRIPSI_TOOLS = [
  { label: "Generator Judul",      icon: BookOpen,      href: "/judul",          color: "bg-blue-500" },
  { label: "Kuesioner",            icon: ClipboardList, href: "/kuesioner",      color: "bg-blue-500" },
  { label: "Latar Belakang BAB I", icon: Newspaper,     href: "/latar-belakang", color: "bg-blue-600" },
  { label: "Kerangka Berpikir",    icon: GitFork,       href: "/kerangka",       color: "bg-indigo-500" },
  { label: "Upload & Analisis",    icon: Upload,        href: "/upload",         color: "bg-violet-500" },
  { label: "Cek Kelayakan Data",   icon: CheckCircle,   href: "/kelayakan",      color: "bg-teal-500" },
  { label: "Narasi Bab 4",         icon: FileText,      href: "/narasi",         color: "bg-amber-500" },
  { label: "Responden Center",     icon: Users,         href: "/responden",      color: "bg-emerald-500" },
];

// ─── Skripsi Wizard Steps ─────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { state } = useAppContext();

  const thesis = useMemo(() => { try { return loadThesisState(); } catch { return null; } }, []);
  const bab1   = useMemo(() => { try { return loadBab1State();   } catch { return null; } }, []);
  const resp   = useMemo(() => { try { return loadRespondenState(); } catch { return null; } }, []);

  const hasJudul   = !!(thesis?.x1 && thesis?.x2 && thesis?.y);
  const hasBab1    = !!(bab1?.namaObjek);
  const hasResp    = !!(resp?.rows?.length);
  const hasData    = state.rawData.length > 0;
  const hasMapping = state.variables.length > 0;

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

  const activeStep = (() => {
    if (!hasJudul)   return 1;
    if (!hasBab1)    return 3;
    if (!hasResp)    return 6;
    if (!hasData)    return 8;
    if (!hasMapping) return 8;
    return 9;
  })();

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 px-6 py-10 text-white shadow-xl">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-12 text-8xl select-none">🎓</div>
          <div className="absolute bottom-4 right-32 text-5xl select-none">📚</div>
          <div className="absolute top-8 right-48 text-4xl select-none">📊</div>
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-xl shadow-lg">
              🎓
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">SmartCampus</h1>
              <p className="text-blue-300 text-sm font-medium">Academic Workspace Indonesia</p>
            </div>
          </div>

          <p className="text-blue-100 text-lg font-medium max-w-xl mb-6 leading-relaxed">
            Satu platform untuk semua kebutuhan akademik mahasiswa —
            <span className="text-white font-semibold"> Skripsi, Makalah, Proposal,</span> dan lebih banyak lagi.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/judul"
              className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-lg shadow-blue-900/50"
            >
              <GraduationCap className="w-4 h-4" />
              Mulai Skripsi
            </Link>
            <Link
              href="/makalah"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Buat Makalah
            </Link>
            <Link
              href="/project"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              <FolderOpen className="w-4 h-4" />
              Project
            </Link>
          </div>
        </div>
      </div>

      {/* ── Apa yang ingin kamu kerjakan? ─────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Apa yang ingin kamu kerjakan hari ini?</h2>
            <p className="text-sm text-slate-500">Pilih modul akademik yang sesuai kebutuhanmu</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {ACADEMIC_MODULES.map((mod) => {
            const isReady = mod.status === "ready" || mod.status === "beta";
            const card = (
              <div
                className={`relative flex flex-col items-start p-4 rounded-2xl border-2 ${mod.color} ${mod.borderColor} transition-all duration-150 ${
                  isReady ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5" : "opacity-60 cursor-not-allowed"
                }`}
              >
                <span className="text-3xl mb-2 leading-none">{mod.icon}</span>
                <p className={`font-bold text-sm leading-tight mb-0.5 ${mod.textColor}`}>{mod.label}</p>
                <p className="text-xs text-slate-500 leading-snug">{mod.desc}</p>

                {/* Status badge */}
                {mod.status === "beta" && (
                  <span className="absolute top-2 right-2 text-[9px] font-bold bg-violet-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                    Beta
                  </span>
                )}
                {mod.status === "soon" && (
                  <span className="absolute top-2 right-2 text-[9px] font-bold bg-slate-400 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                    Segera
                  </span>
                )}
                {mod.status === "ready" && (
                  <span className="absolute top-2 right-2 text-[9px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                    Tersedia
                  </span>
                )}
              </div>
            );

            return isReady ? (
              <Link key={mod.label} href={mod.href}>
                {card}
              </Link>
            ) : (
              <div key={mod.label}>{card}</div>
            );
          })}
        </div>
      </div>

      {/* ── Skripsi Workspace ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎓</span>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Skripsi Workspace</h2>
              <p className="text-xs text-slate-500">Semua tools yang kamu butuhkan</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{progress}% selesai</span>
            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Wizard progress strip */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 overflow-x-auto">
          <div className="flex items-center gap-0 min-w-max">
            {WIZARD_STEPS.map((step, i) => {
              const isDone   = step.num < activeStep;
              const isActive = step.num === activeStep;
              return (
                <div key={step.num} className="flex items-center">
                  <Link href={step.href} className="flex flex-col items-center gap-1 group">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                      ${isDone   ? "bg-emerald-500 text-white"
                      : isActive ? "bg-blue-600 text-white ring-4 ring-blue-100"
                      : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"}`}
                    >
                      {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : step.num}
                    </div>
                    <span className={`text-[10px] font-medium max-w-[56px] text-center leading-tight
                      ${isDone ? "text-emerald-600" : isActive ? "text-blue-700" : "text-slate-400"}`}>
                      {step.label}
                    </span>
                  </Link>
                  {i < WIZARD_STEPS.length - 1 && (
                    <div className={`h-0.5 w-6 mx-1 mb-4 rounded-full ${step.num < activeStep ? "bg-emerald-400" : "bg-slate-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick tools grid */}
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SKRIPSI_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.label}
                href={tool.href}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
              >
                <div className={`w-7 h-7 rounded-lg ${tool.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs font-medium text-slate-700 group-hover:text-blue-700 leading-tight">{tool.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Makalah Quick Start ────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl border-2 border-violet-200 p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="text-4xl">📚</div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-violet-800">Modul Makalah</h3>
              <span className="text-[10px] font-bold bg-violet-500 text-white px-1.5 py-0.5 rounded-full uppercase">Beta</span>
            </div>
            <p className="text-sm text-violet-600">
              Buat makalah lengkap dengan cover, BAB I–III, dan daftar pustaka — ekspor ke DOCX dalam menit.
            </p>
          </div>
        </div>
        <Link
          href="/makalah"
          className="shrink-0 inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-md shadow-violet-200"
        >
          Mulai <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* ── Roadmap ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-bold text-slate-700">Segera Hadir di SmartCampus</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ROADMAP.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100"
            >
              <span className="text-xl shrink-0">{item.icon}</span>
              <span className="text-xs font-medium text-slate-500 leading-tight">{item.label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Fitur baru ditambahkan secara berkala. SmartCampus terus berkembang bersama mahasiswa Indonesia.
        </p>
      </div>

    </div>
  );
}
