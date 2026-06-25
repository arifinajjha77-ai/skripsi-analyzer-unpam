"use client";

import { useState, useCallback } from "react";
import {
  ChevronRight, ChevronLeft, Plus, Trash2, FileText,
  Download, Eye, EyeOff, CheckCircle, BookOpen,
  User, Building2, GraduationCap, BookCopy, Users,
  Hash, Sparkles, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  MakalahState,
  AnggotaKelompok,
  defaultMakalahState,
  loadMakalahState,
  saveMakalahState,
} from "@/lib/makalah/store";
import { generateMakalah, MakalahOutput } from "@/lib/makalah/generator";

// ─── Wizard Config ─────────────────────────────────────────────────────────────

interface WizardStep {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
}

const STEPS: WizardStep[] = [
  { id: "judul",        label: "Judul",         icon: FileText,      desc: "Judul makalah yang akan dibuat" },
  { id: "universitas",  label: "Universitas",   icon: Building2,     desc: "Nama universitas & program studi" },
  { id: "matakuliah",   label: "Mata Kuliah",   icon: BookOpen,      desc: "Mata kuliah & dosen pengampu" },
  { id: "kelompok",     label: "Kelompok",      icon: Users,         desc: "Anggota kelompok" },
  { id: "detail",       label: "Detail",        icon: Hash,          desc: "Topik & target halaman" },
  { id: "generate",     label: "Generate",      icon: Sparkles,      desc: "Preview & export DOCX" },
];

// ─── Input Components ─────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-slate-700 mb-1.5">{children}</label>;
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white placeholder-slate-400"
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white placeholder-slate-400 resize-none"
    />
  );
}

// ─── Preview Panel ────────────────────────────────────────────────────────────

const SECTION_LABELS: Array<{ key: keyof MakalahOutput; label: string }> = [
  { key: "kataPengantar",  label: "Kata Pengantar" },
  { key: "daftarIsi",      label: "Daftar Isi" },
  { key: "bab1",           label: "BAB I — Pendahuluan" },
  { key: "bab2",           label: "BAB II — Pembahasan" },
  { key: "bab3",           label: "BAB III — Penutup" },
  { key: "daftarPustaka",  label: "Daftar Pustaka" },
];

function PreviewPanel({ output }: { output: MakalahOutput }) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["bab1"]));

  function toggle(key: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="space-y-2">
      {SECTION_LABELS.map(({ key, label }) => {
        const isOpen = openSections.has(key);
        return (
          <div key={key} className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => toggle(key)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
            >
              <span className="text-sm font-semibold text-slate-700">{label}</span>
              {isOpen ? (
                <EyeOff className="w-4 h-4 text-slate-400" />
              ) : (
                <Eye className="w-4 h-4 text-slate-400" />
              )}
            </button>
            {isOpen && (
              <div className="px-4 py-3 bg-white">
                <pre className="whitespace-pre-wrap text-xs text-slate-600 font-sans leading-relaxed">
                  {output[key]}
                </pre>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MakalahPage() {
  const [step, setStep]     = useState(0);
  const [state, setState]   = useState<MakalahState>(() => loadMakalahState());
  const [output, setOutput] = useState<MakalahOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const update = useCallback(
    (patch: Partial<MakalahState>) => {
      setState((prev) => {
        const next = { ...prev, ...patch };
        saveMakalahState(next);
        return next;
      });
    },
    []
  );

  function updateAnggota(index: number, field: keyof AnggotaKelompok, value: string) {
    const anggota = [...state.anggota];
    anggota[index] = { ...anggota[index], [field]: value };
    update({ anggota });
  }

  function addAnggota() {
    update({ anggota: [...state.anggota, { nim: "", nama: "" }] });
  }

  function removeAnggota(index: number) {
    const anggota = state.anggota.filter((_, i) => i !== index);
    update({ anggota: anggota.length ? anggota : [{ nim: "", nama: "" }] });
  }

  function handleGenerate() {
    if (!state.judul) { toast.error("Isi judul makalah terlebih dahulu"); return; }
    setLoading(true);
    setTimeout(() => {
      try {
        const result = generateMakalah(state);
        setOutput(result);
        toast.success("Makalah berhasil di-generate!");
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
    judul: (
      <div className="space-y-4">
        <div>
          <Label>Judul Makalah</Label>
          <Textarea
            value={state.judul}
            onChange={(v) => update({ judul: v })}
            placeholder='Contoh: "Analisis Strategi Pemasaran Digital pada UMKM di Era 4.0"'
            rows={3}
          />
          <p className="text-xs text-slate-400 mt-1.5">Tuliskan judul yang spesifik dan mencerminkan isi makalah.</p>
        </div>
        <div>
          <Label>Topik Ringkas (Opsional)</Label>
          <Textarea
            value={state.topikRingkas}
            onChange={(v) => update({ topikRingkas: v })}
            placeholder="Deskripsi singkat topik yang dibahas untuk membantu generate konten lebih relevan..."
            rows={2}
          />
        </div>
      </div>
    ),

    universitas: (
      <div className="space-y-4">
        <div>
          <Label>Nama Universitas</Label>
          <Input
            value={state.universitas}
            onChange={(v) => update({ universitas: v })}
            placeholder="Universitas Pamulang"
          />
        </div>
        <div>
          <Label>Program Studi</Label>
          <Input
            value={state.programStudi}
            onChange={(v) => update({ programStudi: v })}
            placeholder="Manajemen Pemasaran"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Semester</Label>
            <Input
              value={state.semester}
              onChange={(v) => update({ semester: v })}
              placeholder="Genap / Gasal"
            />
          </div>
          <div>
            <Label>Tahun Akademik</Label>
            <Input
              value={state.tahunAkademik}
              onChange={(v) => update({ tahunAkademik: v })}
              placeholder="2025/2026"
            />
          </div>
        </div>
        <div>
          <Label>Kota</Label>
          <Input
            value={state.kota}
            onChange={(v) => update({ kota: v })}
            placeholder="Tangerang Selatan"
          />
        </div>
      </div>
    ),

    matakuliah: (
      <div className="space-y-4">
        <div>
          <Label>Mata Kuliah</Label>
          <Input
            value={state.mataKuliah}
            onChange={(v) => update({ mataKuliah: v })}
            placeholder="Manajemen Strategik"
          />
        </div>
        <div>
          <Label>Nama Dosen Pengampu</Label>
          <Input
            value={state.namaDosen}
            onChange={(v) => update({ namaDosen: v })}
            placeholder="Dr. Ahmad Fauzi, M.M."
          />
        </div>
      </div>
    ),

    kelompok: (
      <div className="space-y-4">
        <div>
          <Label>Nama / Nomor Kelompok</Label>
          <Input
            value={state.kelompok}
            onChange={(v) => update({ kelompok: v })}
            placeholder="1"
          />
        </div>

        <div>
          <Label>Anggota Kelompok</Label>
          <div className="space-y-2">
            {state.anggota.map((anggota, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </div>
                <Input
                  value={anggota.nim}
                  onChange={(v) => updateAnggota(idx, "nim", v)}
                  placeholder="NIM"
                />
                <Input
                  value={anggota.nama}
                  onChange={(v) => updateAnggota(idx, "nama", v)}
                  placeholder="Nama Lengkap"
                />
                <button
                  onClick={() => removeAnggota(idx)}
                  className="p-2 text-slate-300 hover:text-rose-500 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addAnggota}
            className="mt-2 flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-700 font-medium"
          >
            <Plus className="w-4 h-4" />
            Tambah Anggota
          </button>
        </div>
      </div>
    ),

    detail: (
      <div className="space-y-4">
        <div>
          <Label>Target Jumlah Halaman</Label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={5}
              max={30}
              step={1}
              value={state.targetHalaman}
              onChange={(e) => update({ targetHalaman: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="w-16 text-center text-sm font-bold text-violet-700 bg-violet-50 rounded-lg py-1.5">
              {state.targetHalaman} hal
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Panduan: 5–10 hal untuk tugas biasa, 10–20 hal untuk makalah ilmiah.</p>
        </div>

        <div>
          <Label>Latar Belakang Custom (Opsional)</Label>
          <Textarea
            value={state.latar ?? ""}
            onChange={(v) => update({ latar: v })}
            placeholder="Tulis latar belakang kamu sendiri, atau biarkan kosong untuk di-generate otomatis..."
            rows={4}
          />
        </div>

        <div>
          <Label>Tujuan Penulisan Custom (Opsional)</Label>
          <Textarea
            value={state.tujuan ?? ""}
            onChange={(v) => update({ tujuan: v })}
            placeholder="Tulis tujuan sendiri, atau biarkan kosong untuk di-generate otomatis..."
            rows={2}
          />
        </div>
      </div>
    ),

    generate: (
      <div className="space-y-4">
        {/* Summary card */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-sm space-y-1.5">
          <p className="font-semibold text-slate-700 mb-2">Ringkasan Makalah</p>
          <Row label="Judul"       value={state.judul || "—"} />
          <Row label="Universitas" value={state.universitas || "—"} />
          <Row label="Prodi"       value={state.programStudi || "—"} />
          <Row label="Mata Kuliah" value={state.mataKuliah || "—"} />
          <Row label="Dosen"       value={state.namaDosen || "—"} />
          <Row label="Kelompok"    value={state.kelompok ? `Kelompok ${state.kelompok}` : "—"} />
          <Row label="Anggota"     value={`${state.anggota.filter((a) => a.nama).length} orang`} />
          <Row label="Target"      value={`${state.targetHalaman} halaman`} />
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={loading || !state.judul}
          className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors shadow-md shadow-violet-200"
        >
          {loading ? (
            <><RefreshCw className="w-4 h-4 animate-spin" />Generating...</>
          ) : (
            <><Sparkles className="w-4 h-4" />Generate Makalah</>
          )}
        </button>

        {/* Export button */}
        {output && (
          <>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors shadow-md shadow-emerald-200"
            >
              {exporting ? (
                <><RefreshCw className="w-4 h-4 animate-spin" />Mengekspor...</>
              ) : (
                <><Download className="w-4 h-4" />Unduh DOCX</>
              )}
            </button>

            <div className="mt-4">
              <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-slate-400" />
                Preview Konten
              </p>
              <PreviewPanel output={output} />
            </div>
          </>
        )}
      </div>
    ),
  };

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="text-3xl">📚</div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Modul Makalah</h1>
          <p className="text-sm text-slate-500">Buat makalah akademik lengkap & ekspor ke DOCX</p>
        </div>
        <span className="ml-auto text-[10px] font-bold bg-violet-500 text-white px-2 py-1 rounded-full uppercase">
          Beta
        </span>
      </div>

      {/* Step indicators */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const isDone   = i < step;
            const isActive = i === step;
            const Icon     = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setStep(i)}
                className="flex flex-col items-center gap-1 group"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all
                  ${isDone   ? "bg-emerald-500 text-white"
                  : isActive ? "bg-violet-600 text-white ring-4 ring-violet-100"
                  : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"}`}
                >
                  {isDone ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-[9px] font-medium hidden sm:block
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
          <h2 className="text-base font-bold text-slate-800">{currentStep.label}</h2>
          <p className="text-xs text-slate-500">{currentStep.desc}</p>
        </div>

        <div className="p-5">
          {stepContent[currentStep.id]}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-3">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={isFirst}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Kembali
        </button>

        {!isLast && (
          <button
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors shadow-md shadow-violet-200"
          >
            Lanjut
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="text-slate-800 font-medium text-right truncate max-w-[200px]">{value}</span>
    </div>
  );
}
