"use client";

/**
 * SmartCampus — Academic Cover Builder Component
 *
 * Features:
 * - University Mode: registered (auto logo + template) vs custom (upload logo)
 * - Drag & Drop / Click logo uploader (PNG, JPG, SVG, WEBP)
 * - All cover fields: universitas, fakultas, prodi, matakuliah, dosen, judul, kelompok, penyusun, kota, tahun
 * - Live A4 Preview that updates in real-time
 * - Smart title wrapping
 * - Cover quality checklist
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Building2, Upload, X, CheckCircle, AlertCircle,
  Plus, Trash2, Search, ChevronDown,
} from "lucide-react";
import { CoverData, PenyusunItem } from "@/lib/cover/types";
import { REGISTERED_UNIVERSITIES, prefillFromUniversity, getUniversityInfo } from "@/lib/cover/templates";
import { fileToBase64, saveLogo, loadLogo } from "@/lib/cover/logoStore";
import { checkCoverQuality } from "@/lib/cover/coverQuality";
import { smartWrapTitle } from "@/lib/cover/docxCover";
import UnpamCoverPreview from "./UnpamCoverPreview";

// ─── Props ────────────────────────────────────────────────────────────────────

interface CoverBuilderProps {
  cover: CoverData;
  onChange: (patch: Partial<CoverData>) => void;
  projectId?: string;
}

// ─── Input Helpers ────────────────────────────────────────────────────────────

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <label className={`block text-xs font-semibold text-slate-600 mb-1 ${className ?? ""}`}>
      {children}
    </label>
  );
}

function Input({ value, onChange, placeholder, className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <input
      value={value} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder-slate-400 ${className ?? ""}`}
    />
  );
}

// ─── University Selector ──────────────────────────────────────────────────────

function UniversitySelector({
  cover,
  onChange,
}: {
  cover: CoverData;
  onChange: (patch: Partial<CoverData>) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen]   = useState(false);

  const filtered = REGISTERED_UNIVERSITIES.filter((u) =>
    u.name.toLowerCase().includes(query.toLowerCase()) ||
    u.shortName.toLowerCase().includes(query.toLowerCase()) ||
    u.city.toLowerCase().includes(query.toLowerCase())
  );

  function select(id: string) {
    const patch = prefillFromUniversity(cover, id);
    onChange(patch);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white hover:border-blue-300 transition-colors"
      >
        <span className="truncate text-slate-700">
          {cover.universityId && cover.universityId !== "custom"
            ? (getUniversityInfo(cover.universityId)?.name ?? cover.universitas) || "Pilih universitas"
            : "Pilih universitas"}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded-lg">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari universitas..."
                className="flex-1 text-sm bg-transparent focus:outline-none placeholder-slate-400"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => select(u.id)}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors"
              >
                <p className="text-sm font-semibold text-slate-800">{u.name}</p>
                <p className="text-xs text-slate-400">{u.shortName} · {u.city}</p>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-sm text-slate-400 text-center">
                Tidak ditemukan — gunakan mode Custom
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Logo Uploader ────────────────────────────────────────────────────────────

function LogoUploader({
  logoUrl,
  onLogoChange,
  projectId,
}: {
  logoUrl?: string;
  onLogoChange: (url: string | undefined) => void;
  projectId?: string;
}) {
  const inputRef  = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File) {
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      alert("Format tidak didukung. Gunakan PNG, JPG, WEBP, atau SVG.");
      return;
    }
    const base64 = await fileToBase64(file);
    saveLogo(base64, projectId);
    onLogoChange(base64);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  if (logoUrl) {
    return (
      <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50">
        <img src={logoUrl} alt="Logo" className="w-14 h-14 object-contain rounded border border-slate-200 bg-white p-1" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-700">Logo tersimpan</p>
          <p className="text-[10px] text-slate-400">Tersimpan untuk project ini</p>
        </div>
        <button
          type="button"
          onClick={() => { onLogoChange(undefined); if (projectId) saveLogo("", projectId); }}
          className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`w-full flex flex-col items-center justify-center py-5 border-2 border-dashed rounded-xl cursor-pointer transition-colors
        ${dragging ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"}`}
    >
      <Upload className="w-6 h-6 text-slate-400 mb-2" />
      <p className="text-sm font-medium text-slate-600">Drag & Drop logo</p>
      <p className="text-xs text-slate-400 mt-0.5">atau <span className="text-blue-600 font-medium">pilih file</span></p>
      <p className="text-[10px] text-slate-300 mt-1">PNG · JPG · WEBP · SVG</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
        className="hidden"
        onChange={onFileInput}
      />
    </div>
  );
}

// ─── A4 Cover Preview ─────────────────────────────────────────────────────────

function CoverPreview({ cover }: { cover: CoverData }) {
  const uniInfo = getUniversityInfo(cover.universityId);
  const logoSrc = cover.logoUrl ?? (uniInfo?.logoPath || undefined);

  const titleLines = cover.judul
    ? smartWrapTitle(cover.judul.toUpperCase(), 6)
    : ["JUDUL MAKALAH"];

  return (
    <div className="sticky top-4">
      <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider text-center">
        Live Preview Cover
      </p>
      {/* A4 ratio = 1 : 1.414 */}
      <div
        className="w-full bg-white border border-slate-200 shadow-xl overflow-hidden flex flex-col items-center text-center px-6 py-6"
        style={{ aspectRatio: "1 / 1.414", fontFamily: "Georgia, serif" }}
      >
        {/* Registered university: name at top, then logo */}
        {cover.universityMode === "registered" && (
          <>
            <p className="text-[9px] font-bold uppercase leading-tight text-slate-900 mb-0.5">
              {cover.universitas || "NAMA UNIVERSITAS"}
            </p>
            {cover.fakultas && (
              <p className="text-[7.5px] text-slate-700 leading-tight">{cover.fakultas}</p>
            )}
            {cover.programStudi && (
              <p className="text-[7.5px] text-slate-700 leading-tight mb-2">{cover.programStudi}</p>
            )}
          </>
        )}

        {/* Logo */}
        {logoSrc ? (
          <img
            src={logoSrc} alt="Logo"
            className="object-contain mb-2"
            style={{ width: "10%", height: "10%", minWidth: 36, minHeight: 36, maxWidth: 64, maxHeight: 64 }}
          />
        ) : (
          <div className="w-10 h-10 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center mb-2 shrink-0">
            <Building2 className="w-4 h-4 text-slate-300" />
          </div>
        )}

        {/* Custom mode: name below logo */}
        {cover.universityMode === "custom" && (
          <>
            <p className="text-[9px] font-bold uppercase leading-tight text-slate-900 mb-0.5">
              {cover.universitas || "NAMA UNIVERSITAS"}
            </p>
            {cover.fakultas && (
              <p className="text-[7.5px] text-slate-700 leading-tight">{cover.fakultas}</p>
            )}
            {cover.programStudi && (
              <p className="text-[7.5px] text-slate-700 leading-tight mb-2">{cover.programStudi}</p>
            )}
          </>
        )}

        {/* MAKALAH label */}
        <div className="border-t border-b border-slate-800 py-0.5 px-3 mb-2 mt-1">
          <p className="text-[9px] font-bold tracking-widest text-slate-900">MAKALAH</p>
        </div>

        {/* Title (wrapped) */}
        <div className="mb-auto mt-1">
          {titleLines.map((line, i) => (
            <p key={i} className="text-[8px] font-bold uppercase leading-tight text-slate-900">
              {line}
            </p>
          ))}
        </div>

        {/* Members */}
        <div className="mt-2 text-center">
          <p className="text-[7px] text-slate-600 mb-0.5">Disusun oleh:</p>
          {cover.kelompok && (
            <p className="text-[7.5px] font-bold text-slate-800">Kelompok {cover.kelompok}</p>
          )}
          {cover.penyusun.filter((p) => p.nama).slice(0, 3).map((p, i) => (
            <p key={i} className="text-[7px] text-slate-700 leading-tight">
              {p.nama}{p.nim ? ` (${p.nim})` : ""}
            </p>
          ))}
          {cover.penyusun.filter((p) => p.nama).length > 3 && (
            <p className="text-[7px] text-slate-400">
              +{cover.penyusun.filter((p) => p.nama).length - 3} lainnya
            </p>
          )}
        </div>

        {/* Mata kuliah / Dosen */}
        {(cover.mataKuliah || cover.namaDosen) && (
          <div className="mt-1.5 text-center">
            {cover.mataKuliah && (
              <p className="text-[7px] text-slate-600">Mata Kuliah: {cover.mataKuliah}</p>
            )}
            {cover.namaDosen && (
              <p className="text-[7px] text-slate-600">Dosen: {cover.namaDosen}</p>
            )}
          </div>
        )}

        {/* City + Year */}
        <div className="mt-2">
          <p className="text-[7.5px] text-slate-700">
            {[cover.kota, cover.tahun].filter(Boolean).join(", ") || "Kota, Tahun"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Quality Badge ────────────────────────────────────────────────────────────

function QualityBadge({ cover }: { cover: CoverData }) {
  const report = checkCoverQuality(cover);
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold
      ${report.isComplete
        ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
        : "bg-amber-50 border border-amber-200 text-amber-700"}`}>
      {report.isComplete
        ? <><CheckCircle className="w-4 h-4" /> Cover lengkap — {report.passCount}/10 terpenuhi</>
        : <><AlertCircle className="w-4 h-4" /> {report.missingCount} field masih kosong</>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CoverBuilder({ cover, onChange, projectId }: CoverBuilderProps) {
  // Load saved logo on mount
  useEffect(() => {
    if (!cover.logoUrl && projectId) {
      const saved = loadLogo(projectId);
      if (saved) onChange({ logoUrl: saved });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  function updatePenyusun(idx: number, field: keyof PenyusunItem, val: string) {
    const list = [...cover.penyusun];
    list[idx] = { ...list[idx], [field]: val };
    onChange({ penyusun: list });
  }

  function addPenyusun() {
    onChange({ penyusun: [...cover.penyusun, { nim: "", nama: "" }] });
  }

  function removePenyusun(idx: number) {
    const list = cover.penyusun.filter((_, i) => i !== idx);
    onChange({ penyusun: list.length ? list : [{ nim: "", nama: "" }] });
  }

  const currentYear = new Date().getFullYear().toString();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ── Left: Form ──────────────────────────────────────────────────────── */}
      <div className="space-y-5 overflow-y-auto max-h-[80vh] pr-1">

        {/* Quality badge */}
        <QualityBadge cover={cover} />

        {/* University Mode */}
        <div>
          <Label>Mode Universitas</Label>
          <div className="flex gap-2">
            {(["registered", "custom"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onChange({ universityMode: mode, universityId: mode === "custom" ? "custom" : cover.universityId })}
                className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-colors
                  ${cover.universityMode === mode
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "border-slate-200 text-slate-600 hover:border-blue-300"}`}
              >
                {mode === "registered" ? "🏛️ Universitas Terdaftar" : "✏️ Custom"}
              </button>
            ))}
          </div>
        </div>

        {/* University selector (registered mode) */}
        {cover.universityMode === "registered" && (
          <div>
            <Label>Pilih Universitas</Label>
            <UniversitySelector cover={cover} onChange={onChange} />
            {cover.universityId && getUniversityInfo(cover.universityId)?.logoPath && (
              <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Logo otomatis tersedia
              </p>
            )}
          </div>
        )}

        {/* Logo uploader */}
        <div>
          <Label>
            {cover.universityMode === "registered" ? "Override Logo (Opsional)" : "Upload Logo Universitas"}
          </Label>
          <LogoUploader
            logoUrl={cover.logoUrl}
            onLogoChange={(url) => onChange({ logoUrl: url })}
            projectId={projectId}
          />
        </div>

        {/* Universitas (editable) */}
        <div>
          <Label>Nama Universitas</Label>
          <Input
            value={cover.universitas}
            onChange={(v) => onChange({ universitas: v })}
            placeholder="Universitas Pamulang"
          />
        </div>

        {/* Fakultas */}
        <div>
          <Label>Fakultas</Label>
          <Input
            value={cover.fakultas}
            onChange={(v) => onChange({ fakultas: v })}
            placeholder="Fakultas Ekonomi dan Bisnis"
          />
        </div>

        {/* Program Studi */}
        <div>
          <Label>Program Studi</Label>
          <Input
            value={cover.programStudi}
            onChange={(v) => onChange({ programStudi: v })}
            placeholder="Manajemen Pemasaran"
          />
        </div>

        {/* Judul */}
        <div>
          <Label>Judul Makalah</Label>
          <textarea
            value={cover.judul}
            onChange={(e) => onChange({ judul: e.target.value })}
            rows={3}
            placeholder='"Perbandingan Investasi Saham, Emas, dan Deposito..."'
            className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder-slate-400 resize-none"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Judul panjang akan otomatis dibagi baris (Smart Title Wrapping)
          </p>
        </div>

        {/* Mata Kuliah + Dosen */}
        <div className="grid grid-cols-1 gap-3">
          <div>
            <Label>Mata Kuliah</Label>
            <Input
              value={cover.mataKuliah}
              onChange={(v) => onChange({ mataKuliah: v })}
              placeholder="Manajemen Keuangan"
            />
          </div>
          <div>
            <Label>Nama Dosen Pengampu</Label>
            <Input
              value={cover.namaDosen}
              onChange={(v) => onChange({ namaDosen: v })}
              placeholder="Dr. Ahmad Fauzi, M.M."
            />
          </div>
        </div>

        {/* Kelompok + Penyusun */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label>Penyusun / Anggota Kelompok</Label>
          </div>
          <div className="mb-2">
            <Input
              value={cover.kelompok}
              onChange={(v) => onChange({ kelompok: v })}
              placeholder="Nomor Kelompok (opsional)"
            />
          </div>
          <div className="space-y-2">
            {cover.penyusun.map((p, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-5 text-center text-xs font-bold text-slate-400 shrink-0">{idx + 1}</span>
                <Input value={p.nim}  onChange={(v) => updatePenyusun(idx, "nim",  v)} placeholder="NIM" className="w-24 shrink-0" />
                <Input value={p.nama} onChange={(v) => updatePenyusun(idx, "nama", v)} placeholder="Nama Lengkap" />
                <button type="button" onClick={() => removePenyusun(idx)} className="p-1 text-slate-300 hover:text-rose-500 shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addPenyusun} className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium">
            <Plus className="w-3.5 h-3.5" /> Tambah Anggota
          </button>
        </div>

        {/* Kota + Tahun */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Kota</Label>
            <Input value={cover.kota} onChange={(v) => onChange({ kota: v })} placeholder="Tangerang Selatan" />
          </div>
          <div>
            <Label>Tahun</Label>
            <Input value={cover.tahun} onChange={(v) => onChange({ tahun: v })} placeholder={currentYear} />
          </div>
        </div>

      </div>

      {/* ── Right: Live Preview ──────────────────────────────────────────────── */}
      <div>
        {/* UNPAM: pixel-perfect fixed layout (transform:scale A4) */}
        {cover.universityMode === "registered" && cover.universityId === "unpam"
          ? <UnpamCoverPreview cover={cover} />
          : <CoverPreview cover={cover} />}
      </div>
    </div>
  );
}
