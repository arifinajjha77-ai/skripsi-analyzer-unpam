"use client";

import { useState, useCallback } from "react";
import {
  ChevronRight, ChevronLeft, CheckCircle, XCircle, AlertCircle,
  FileText, Hash, Sparkles, RefreshCw, Download, Eye, EyeOff,
  Cpu, Shield, BookCopy,
} from "lucide-react";
import { toast } from "sonner";
import {
  MakalahState, defaultMakalahState, loadMakalahState, saveMakalahState,
  stateToCoverData, coverDataToState,
} from "@/lib/makalah/store";
import { generateMakalah, MakalahOutput } from "@/lib/makalah/generator";
import { checkMakalahQuality, MakalahQualityReport } from "@/lib/makalah/qualityChecker";
import { CoverData } from "@/lib/cover/types";
import CoverBuilder from "./components/CoverBuilder";

// ─── Wizard Config ─────────────────────────────────────────────────────────────

const STEPS = [
  { id: "cover",    label: "Cover",    icon: BookCopy, desc: "Universitas, logo, judul, anggota" },
  { id: "topik",    label: "Topik",    icon: FileText, desc: "Topik dan preferensi konten" },
  { id: "detail",   label: "Detail",   icon: Hash,     desc: "Target halaman & custom teks" },
  { id: "generate", label: "Generate", icon: Sparkles, desc: "Preview, kualitas & export DOCX" },
];

// ─── Input Helpers ────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-slate-700 mb-1.5">{children}</label>;
}
function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white placeholder-slate-400"
    />
  );
}
function Textarea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea value={value} placeholder={placeholder} rows={rows} onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white placeholder-slate-400 resize-none"
    />
  );
}

// ─── Quality Panel ────────────────────────────────────────────────────────────

const STATUS_ICON = {
  pass: <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />,
  warn: <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />,
  fail: <XCircle    className="w-4 h-4 text-rose-500 shrink-0" />,
};
const GRADE_COLORS: Record<string, string> = {
  A: "text-emerald-700 bg-emerald-100 border-emerald-300",
  B: "text-blue-700 bg-blue-100 border-blue-300",
  C: "text-amber-700 bg-amber-100 border-amber-300",
  D: "text-rose-700 bg-rose-100 border-rose-300",
};

function QualityPanel({ report }: { report: MakalahQualityReport }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-bold text-slate-700">SmartCampus Quality Check</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-black px-3 py-1 rounded-xl border ${GRADE_COLORS[report.grade]}`}>
            Grade {report.grade}
          </span>
          <span className="text-xl font-black text-violet-700">{report.smartCampusScore}</span>
          <span className="text-xs text-slate-400">/100</span>
        </div>
      </div>
      <div className="px-4 pt-3">
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              report.smartCampusScore >= 85 ? "bg-emerald-500" :
              report.smartCampusScore >= 70 ? "bg-blue-500" :
              report.smartCampusScore >= 55 ? "bg-amber-500" : "bg-rose-500"
            }`}
            style={{ width: `${report.smartCampusScore}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-1.5">{report.summary}</p>
      </div>
      <div className="p-4 space-y-2">
        {report.checks.map((check) => (
          <div key={check.id} className="flex items-start gap-2.5">
            {STATUS_ICON[check.status]}
            <div className="min-w-0">
              <p className={`text-xs font-semibold ${
                check.status === "pass" ? "text-slate-700" :
                check.status === "warn" ? "text-amber-700" : "text-rose-700"
              }`}>{check.label}</p>
              <p className="text-[10px] text-slate-400 leading-snug mt-0.5">{check.hint}</p>
            </div>
            <span className={`ml-auto text-[10px] font-bold shrink-0 ${
              check.score >= 80 ? "text-emerald-600" :
              check.score >= 60 ? "text-amber-600" : "text-rose-600"
            }`}>{check.score}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Preview Panel ────────────────────────────────────────────────────────────

type PreviewKey = "kataPengantar" | "daftarIsi" | "bab1" | "bab2" | "bab3" | "daftarPustaka";

const SECTIONS: Array<{ key: PreviewKey; label: string }> = [
  { key: "kataPengantar", label: "Kata Pengantar" },
  { key: "daftarIsi",     label: "Daftar Isi" },
  { key: "bab1",          label: "BAB I — Pendahuluan" },
  { key: "bab2",          label: "BAB II — Pembahasan" },
  { key: "bab3",          label: "BAB III — Penutup" },
  { key: "daftarPustaka", label: "Daftar Pustaka" },
];

function PreviewPanel({ output }: { output: MakalahOutput }) {
  const [open, setOpen] = useState<Set<string>>(new Set(["bab2"]));
  const toggle = (k: string) => setOpen((p) => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; });
  return (
    <div className="space-y-2">
      {SECTIONS.map(({ key, label }) => (
        <div key={key} className="border border-slate-200 rounded-xl overflow-hidden">
          <button onClick={() => toggle(key)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left">
            <span className="text-sm font-semibold text-slate-700">{label}</span>
            {open.has(key) ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
          </button>
          {open.has(key) && (
            <div className="px-4 py-3 bg-white max-h-60 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-xs text-slate-600 font-sans leading-relaxed">
                {String(output[key])}
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Topic Badge ──────────────────────────────────────────────────────────────

function TopicBadge({ output }: { output: MakalahOutput }) {
  const { analysis } = output;
  return (
    <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl border border-violet-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Cpu className="w-4 h-4 text-violet-600" />
        <span className="text-sm font-bold text-violet-800">Topic Intelligence</span>
        <span className="ml-auto text-xs font-bold text-violet-600">
          {output.citationCount} sitasi
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div><span className="text-slate-500">Bidang</span><p className="font-semibold text-slate-800">{analysis.label}</p></div>
        <div><span className="text-slate-500">Mode</span><p className="font-semibold text-violet-700">{analysis.isComparison ? "📊 Komparasi" : "📝 Eksplorasi"}</p></div>
      </div>
      {analysis.keywords.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {analysis.keywords.slice(0, 6).map((kw) => (
            <span key={kw} className="text-[10px] font-medium bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">{kw}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MakalahPage() {
  const [step, setStep]       = useState(0);
  const [state, setState]     = useState<MakalahState>(() => loadMakalahState());
  const [output, setOutput]   = useState<MakalahOutput | null>(null);
  const [report, setReport]   = useState<MakalahQualityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const update = useCallback((patch: Partial<MakalahState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      saveMakalahState(next);
      return next;
    });
  }, []);

  // Cover Builder <-> State bridge
  const coverData: CoverData = stateToCoverData(state);
  function onCoverChange(patch: Partial<CoverData>) {
    const merged: CoverData = { ...coverData, ...patch };
    const statePatch = coverDataToState(merged, state);
    update(statePatch);
  }

  function handleGenerate() {
    if (!state.judul) { toast.error("Isi judul di step Cover terlebih dahulu"); return; }
    setLoading(true);
    setTimeout(() => {
      try {
        const result  = generateMakalah(state);
        const quality = checkMakalahQuality(result, result.analysis);
        setOutput(result);
        setReport(quality);
        toast.success(`Makalah selesai! Score: ${quality.smartCampusScore}/100`);
      } catch (e) {
        toast.error("Gagal generate: " + String(e));
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  async function handleExport() {
    if (!output) { toast.error("Generate makalah terlebih dahulu"); return; }
    setExporting(true);
    try {
      const { exportMakalahDocx } = await import("@/lib/makalah/docxExport");
      const blob = await exportMakalahDocx(state, output);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `Makalah_${state.judul.slice(0, 40) || "SmartCampus"}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("DOCX berhasil diunduh!");
    } catch (e) {
      toast.error("Gagal export: " + String(e));
    } finally {
      setExporting(false);
    }
  }

  // ─── Step Content ────────────────────────────────────────────────────────────

  const stepContent: Record<string, React.ReactNode> = {

    // Step 0 — Cover Builder
    cover: (
      <CoverBuilder
        cover={coverData}
        onChange={onCoverChange}
        projectId={state.universityId || "default"}
      />
    ),

    // Step 1 — Topik & Konten
    topik: (
      <div className="space-y-4">
        <div>
          <Label>Topik Ringkas</Label>
          <Textarea
            value={state.topikRingkas}
            onChange={(v) => update({ topikRingkas: v })}
            placeholder="Deskripsi singkat topik agar konten makalah lebih relevan dan spesifik..."
            rows={3}
          />
          <p className="text-xs text-slate-400 mt-1.5">
            Topic Intelligence akan mendeteksi bidang ilmu dari judul & topik ini secara otomatis.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Semester</Label>
            <Input value={state.semester} onChange={(v) => update({ semester: v })} placeholder="Genap / Gasal" />
          </div>
          <div>
            <Label>Tahun Akademik</Label>
            <Input value={state.tahunAkademik} onChange={(v) => update({ tahunAkademik: v })} placeholder="2025/2026" />
          </div>
        </div>
      </div>
    ),

    // Step 2 — Detail
    detail: (
      <div className="space-y-4">
        <div>
          <Label>Target Jumlah Halaman</Label>
          <div className="flex items-center gap-3">
            <input
              type="range" min={5} max={30} step={1}
              value={state.targetHalaman}
              onChange={(e) => update({ targetHalaman: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="w-16 text-center text-sm font-bold text-violet-700 bg-violet-50 rounded-lg py-1.5">
              {state.targetHalaman} hal
            </span>
          </div>
        </div>
        <div>
          <Label>Latar Belakang Custom (Opsional)</Label>
          <Textarea
            value={state.latar ?? ""}
            onChange={(v) => update({ latar: v })}
            placeholder="Biarkan kosong untuk di-generate otomatis berdasarkan topik..."
            rows={4}
          />
        </div>
        <div>
          <Label>Tujuan Penulisan Custom (Opsional)</Label>
          <Textarea
            value={state.tujuan ?? ""}
            onChange={(v) => update({ tujuan: v })}
            placeholder="Biarkan kosong untuk di-generate otomatis..."
            rows={2}
          />
        </div>
      </div>
    ),

    // Step 3 — Generate
    generate: (
      <div className="space-y-4">
        {/* Summary */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs space-y-1.5">
          <p className="font-bold text-slate-700 mb-2 text-sm">Ringkasan Makalah</p>
          {[
            ["Judul", state.judul || "—"],
            ["Universitas", state.universitas || "—"],
            ["Fakultas", state.fakultas || "—"],
            ["Prodi", state.programStudi || "—"],
            ["Mata Kuliah", state.mataKuliah || "—"],
            ["Dosen", state.namaDosen || "—"],
            ["Anggota", `${state.anggota.filter((a) => a.nama).length} orang`],
            ["Target", `${state.targetHalaman} halaman`],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between gap-4">
              <span className="text-slate-500 shrink-0">{l}</span>
              <span className="text-slate-800 font-medium text-right truncate max-w-[200px]">{v}</span>
            </div>
          ))}
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={loading || !state.judul}
          className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors shadow-md shadow-violet-200"
        >
          {loading
            ? <><RefreshCw className="w-4 h-4 animate-spin" />Generating dengan AI Engine...</>
            : <><Sparkles className="w-4 h-4" />Generate Makalah</>}
        </button>

        {/* Results */}
        {output && report && (
          <>
            <TopicBadge output={output} />
            <QualityPanel report={report} />
            <button
              onClick={handleExport}
              disabled={exporting}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors shadow-md shadow-emerald-200"
            >
              {exporting
                ? <><RefreshCw className="w-4 h-4 animate-spin" />Mengekspor...</>
                : <><Download className="w-4 h-4" />Unduh DOCX</>}
            </button>
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-slate-400" /> Preview Konten
              </p>
              <PreviewPanel output={output} />
            </div>
          </>
        )}
      </div>
    ),
  };

  const current = STEPS[step];
  const isCover = step === 0;
  const isFirst = step === 0;
  const isLast  = step === STEPS.length - 1;

  return (
    <div className={`mx-auto space-y-6 ${isCover ? "max-w-5xl" : "max-w-2xl"}`}>

      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">📚</span>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Modul Makalah</h1>
          <p className="text-sm text-slate-500">Cover Builder + Topic Intelligence V2.2</p>
        </div>
        <span className="ml-auto text-[10px] font-bold bg-violet-500 text-white px-2 py-1 rounded-full uppercase">
          V2.2
        </span>
      </div>

      {/* Step indicators */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isDone   = i < step;
            const isActive = i === step;
            return (
              <button key={s.id} onClick={() => setStep(i)} className="flex flex-col items-center gap-1 group">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all
                  ${isDone   ? "bg-emerald-500 text-white"
                  : isActive ? "bg-violet-600 text-white ring-4 ring-violet-100"
                  : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"}`}>
                  {isDone ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-[10px] font-semibold hidden sm:block
                  ${isDone ? "text-emerald-600" : isActive ? "text-violet-700" : "text-slate-400"}`}>
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
          <p className="text-xs font-bold uppercase tracking-wider text-violet-600 mb-0.5">
            Langkah {step + 1} dari {STEPS.length}
          </p>
          <h2 className="text-base font-bold text-slate-800">{current.label}</h2>
          <p className="text-xs text-slate-500">{current.desc}</p>
        </div>
        <div className={isCover ? "p-5" : "p-5"}>
          {stepContent[current.id]}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-3">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={isFirst}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Kembali
        </button>
        {!isLast && (
          <button
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors shadow-md shadow-violet-200"
          >
            Lanjut <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

    </div>
  );
}
