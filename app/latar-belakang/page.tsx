"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bab1State,
  SalesRow,
  ConsumerRow,
  CompetitorRow,
  CompetitorSource,
  DataMode,
  defaultBab1State,
  loadBab1State,
  saveBab1State,
  DEFAULT_CATATAN_KERAHASIAAN,
} from "@/lib/thesis/bab1Store";
import { loadThesisState, ThesisState } from "@/lib/thesis/store";
import {
  generateLatarBelakang,
  generateManfaatPenelitian,
  buildSalesTable,
  buildConsumerTable,
  buildCompetitorTable,
} from "@/lib/thesis/bab1Generator";
import { checkBab1Quality, getBab1Score } from "@/lib/bab1-engine/qualityChecker";
import type { QualityItem } from "@/lib/bab1-engine/qualityChecker";
import { generateSyncEstimation } from "@/lib/thesis/dataEstimator";
import {
  searchCompetitors,
  generateEstimasiKompetitor,
  SOURCE_LABELS,
  SOURCE_COLORS,
  type CompetitorSearchResult,
} from "@/lib/thesis/competitorDb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Download,
  Copy,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Wand2,
  Lock,
  AlertTriangle,
  Search,
  Sparkles,
  PlusCircle,
  Info,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// ─── Copy button ───────────────────────────────────────────────────────────────

function CopyButton({ text, label = "Salin" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 border border-slate-200 rounded-md px-2.5 py-1.5 transition-colors hover:border-blue-300"
    >
      {copied ? (
        <><Check className="w-3.5 h-3.5 text-green-500" /> Tersalin</>
      ) : (
        <><Copy className="w-3.5 h-3.5" /> {label}</>
      )}
    </button>
  );
}

// ─── Section collapse wrapper ──────────────────────────────────────────────────

function Section({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <Card>
      <CardHeader className="pb-3 bg-slate-50 border-b border-slate-200 cursor-pointer select-none" onClick={() => setOpen(!open)}>
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            {title}
            {badge && <Badge variant="outline" className="text-xs">{badge}</Badge>}
          </span>
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </CardTitle>
      </CardHeader>
      {open && <CardContent className="pt-4">{children}</CardContent>}
    </Card>
  );
}

// ─── Data Mode Selector ────────────────────────────────────────────────────────

const DATA_MODE_OPTIONS: { value: DataMode; label: string; badge: string; color: string }[] = [
  { value: "asli",           label: "Data asli perusahaan",     badge: "📊 Data Asli",         color: "text-green-700 border-green-300 bg-green-50" },
  { value: "estimasi",       label: "Data estimasi/disamarkan", badge: "🔒 Data Disamarkan",    color: "text-amber-700 border-amber-300 bg-amber-50" },
  { value: "tidak_tersedia", label: "Data tidak tersedia",      badge: "⚠ Data Tidak Tersedia", color: "text-red-700 border-red-300 bg-red-50" },
];

function DataModeSelector({
  mode,
  onChange,
}: {
  mode: DataMode;
  onChange: (m: DataMode) => void;
}) {
  const current = DATA_MODE_OPTIONS.find((o) => o.value === mode) ?? DATA_MODE_OPTIONS[0];
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Sumber Data</p>
      <div className="flex flex-wrap gap-2">
        {DATA_MODE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border-2 transition-all ${
              mode === opt.value
                ? opt.color + " border-current"
                : "border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            {opt.badge}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-400">Dipilih: <span className="font-medium text-slate-600">{current.label}</span></p>
    </div>
  );
}

// ─── Dynamic table editors ─────────────────────────────────────────────────────

function SalesTableEditor({
  data,
  onChange,
}: {
  data: SalesRow[];
  onChange: (rows: SalesRow[]) => void;
}) {
  function update(i: number, key: keyof SalesRow, val: string) {
    const next = data.map((r, idx) => (idx === i ? { ...r, [key]: val } : r));
    onChange(next);
  }
  function addRow() {
    const lastYear = data.length > 0 ? parseInt(data[data.length - 1].tahun || "2023") + 1 : 2024;
    onChange([...data, { tahun: String(lastYear), target: "", realisasi: "" }]);
  }
  function removeRow(i: number) {
    if (data.length <= 1) return;
    onChange(data.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {["Tahun", "Target Penjualan", "Realisasi Penjualan", ""].map((h) => (
                <th key={h} className="text-xs text-left px-3 py-2 font-semibold text-slate-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="px-2 py-1.5">
                  <input value={row.tahun} onChange={(e) => update(i, "tahun", e.target.value)}
                    className="w-20 text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="2024" />
                </td>
                <td className="px-2 py-1.5">
                  <input value={row.target} onChange={(e) => update(i, "target", e.target.value)}
                    className="w-36 text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="cth: 500 unit / Rp 50.000.000" />
                </td>
                <td className="px-2 py-1.5">
                  <input value={row.realisasi} onChange={(e) => update(i, "realisasi", e.target.value)}
                    className="w-36 text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="cth: 420 unit / Rp 42.000.000" />
                </td>
                <td className="px-2 py-1.5">
                  <button onClick={() => removeRow(i)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addRow} className="inline-flex items-center gap-1.5 text-xs text-slate-600 border border-slate-300 rounded-md px-3 py-1.5 hover:bg-slate-50 transition-colors">
        <Plus className="w-3.5 h-3.5" /> Tambah Tahun
      </button>
    </div>
  );
}

function ConsumerTableEditor({
  data,
  onChange,
}: {
  data: ConsumerRow[];
  onChange: (rows: ConsumerRow[]) => void;
}) {
  function update(i: number, key: keyof ConsumerRow, val: string) {
    onChange(data.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));
  }
  function addRow() {
    const lastYear = data.length > 0 ? parseInt(data[data.length - 1].tahun || "2023") + 1 : 2024;
    onChange([...data, { tahun: String(lastYear), target: "", realisasi: "" }]);
  }
  function removeRow(i: number) {
    if (data.length <= 1) return;
    onChange(data.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {["Tahun", "Target Konsumen", "Realisasi Konsumen", ""].map((h) => (
                <th key={h} className="text-xs text-left px-3 py-2 font-semibold text-slate-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="px-2 py-1.5">
                  <input value={row.tahun} onChange={(e) => update(i, "tahun", e.target.value)}
                    className="w-20 text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="2024" />
                </td>
                <td className="px-2 py-1.5">
                  <input value={row.target} onChange={(e) => update(i, "target", e.target.value)}
                    className="w-36 text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="cth: 1000 orang" />
                </td>
                <td className="px-2 py-1.5">
                  <input value={row.realisasi} onChange={(e) => update(i, "realisasi", e.target.value)}
                    className="w-36 text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="cth: 850 orang" />
                </td>
                <td className="px-2 py-1.5">
                  <button onClick={() => removeRow(i)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addRow} className="inline-flex items-center gap-1.5 text-xs text-slate-600 border border-slate-300 rounded-md px-3 py-1.5 hover:bg-slate-50 transition-colors">
        <Plus className="w-3.5 h-3.5" /> Tambah Tahun
      </button>
    </div>
  );
}

// ─── Auto Riset Kompetitor Panel ───────────────────────────────────────────────

type RisetMode = "manual" | "auto" | "estimasi";

function AutoRisetPanel({
  namaObjek,
  jenisUsaha,
  lokasi,
  onAdd,
}: {
  namaObjek: string;
  jenisUsaha: string;
  lokasi: string;
  onAdd: (rows: CompetitorRow[]) => void;
}) {
  const [mode, setMode] = useState<RisetMode>("manual");
  const [produkKeyword, setProdukKeyword] = useState("");
  const [extraKeyword, setExtraKeyword] = useState("");
  const [results, setResults] = useState<CompetitorSearchResult[]>([]);
  const [estimasiResults, setEstimasiResults] = useState<ReturnType<typeof generateEstimasiKompetitor>>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searched, setSearched] = useState(false);

  function doSearch() {
    const r = searchCompetitors(jenisUsaha, produkKeyword, lokasi, extraKeyword);
    setResults(r);
    setSearched(true);
    setSelected(new Set());
  }

  function doEstimasi() {
    const r = generateEstimasiKompetitor(jenisUsaha, lokasi, produkKeyword, namaObjek);
    setEstimasiResults(r);
    setSearched(true);
    setSelected(new Set());
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addSelected() {
    const allEntries = mode === "auto" ? results.map((r) => r.entry) : estimasiResults;
    const toAdd: CompetitorRow[] = allEntries
      .filter((e) => selected.has(e.id))
      .map((e) => ({
        nama: e.nama,
        produk: e.produk,
        harga: e.harga,
        source: e.source as CompetitorSource,
        catatan: e.catatan,
      }));
    if (toAdd.length > 0) {
      onAdd(toAdd);
      setSelected(new Set());
      toast.success(`${toAdd.length} kompetitor ditambahkan ke tabel`);
    }
  }

  function addSingle(id: string, source: "auto" | "estimasi") {
    const allEntries = source === "auto" ? results.map((r) => r.entry) : estimasiResults;
    const entry = allEntries.find((e) => e.id === id);
    if (!entry) return;
    onAdd([{
      nama: entry.nama,
      produk: entry.produk,
      harga: entry.harga,
      source: entry.source as CompetitorSource,
      catatan: entry.catatan,
    }]);
    toast.success("Kompetitor ditambahkan ke tabel");
  }

  const displayEntries = mode === "auto" ? results.map((r) => r.entry) : estimasiResults;

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Mode Input Kompetitor</p>
        <div className="flex flex-wrap gap-2">
          {(["manual", "auto", "estimasi"] as RisetMode[]).map((m) => {
            const labels: Record<RisetMode, string> = {
              manual: "✏ Manual",
              auto: "🔍 Auto Search",
              estimasi: "📊 Estimasi Aman",
            };
            return (
              <button
                key={m}
                onClick={() => { setMode(m); setSearched(false); }}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border-2 transition-all ${
                  mode === m
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                {labels[m]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Auto Search form */}
      {mode === "auto" && (
        <div className="space-y-3 bg-blue-50/60 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5" /> Auto Search dari Database Referensi
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Produk Utama</label>
              <input
                value={produkKeyword}
                onChange={(e) => setProdukKeyword(e.target.value)}
                placeholder="cth: Ghost Lady, Jibbitz, Keychain"
                className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Keyword Tambahan</label>
              <input
                value={extraKeyword}
                onChange={(e) => setExtraKeyword(e.target.value)}
                placeholder="cth: online, depok, custom"
                className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                onKeyDown={(e) => { if (e.key === "Enter") doSearch(); }}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={doSearch}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <Search className="w-3.5 h-3.5" /> Cari Kompetitor
            </button>
            {selected.size > 0 && (
              <button
                onClick={addSelected}
                className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Gunakan {selected.size} Terpilih
              </button>
            )}
          </div>
        </div>
      )}

      {/* Estimasi Aman form */}
      {mode === "estimasi" && (
        <div className="space-y-3 bg-yellow-50/60 border border-yellow-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-yellow-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Estimasi Aman — Kompetitor Umum
          </p>
          <p className="text-xs text-yellow-600">
            Sistem akan menghasilkan nama kompetitor estimasi berdasarkan jenis usaha dan lokasi Anda.
            Data bersifat referensi dan harus diverifikasi.
          </p>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Produk Utama (opsional)</label>
            <input
              value={produkKeyword}
              onChange={(e) => setProdukKeyword(e.target.value)}
              placeholder="cth: jibbitz, kaos kaki, kopi"
              className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={doEstimasi}
              className="inline-flex items-center gap-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" /> Generate Estimasi
            </button>
            {selected.size > 0 && (
              <button
                onClick={addSelected}
                className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Gunakan {selected.size} Terpilih
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results preview */}
      {searched && mode !== "manual" && (
        <div className="space-y-3">
          {displayEntries.length === 0 ? (
            <div className="text-center py-6 text-sm text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
              Tidak ditemukan kompetitor yang cocok. Coba ubah keyword atau gunakan mode Estimasi Aman.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600">{displayEntries.length} kompetitor ditemukan — pilih yang ingin digunakan:</p>
                <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selected.size === displayEntries.length && displayEntries.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelected(new Set(displayEntries.map((e) => e.id)));
                      else setSelected(new Set());
                    }}
                    className="rounded"
                  />
                  Pilih Semua
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {displayEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`relative rounded-xl border-2 p-3 cursor-pointer transition-all ${
                      selected.has(entry.id)
                        ? "border-blue-400 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                    onClick={() => toggleSelect(entry.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{entry.nama}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{entry.produk}</p>
                        <p className="text-xs font-medium text-slate-700 mt-1">{entry.harga}</p>
                        {entry.catatan && (
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 italic">{entry.catatan}</p>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={selected.has(entry.id)}
                        onChange={() => {}}
                        className="shrink-0 mt-0.5 rounded"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${SOURCE_COLORS[entry.source]}`}>
                        {SOURCE_LABELS[entry.source]}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); addSingle(entry.id, mode === "auto" ? "auto" : "estimasi"); }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                      >
                        <PlusCircle className="w-3 h-3" /> Gunakan
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Warning disclaimer */}
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  <span className="font-semibold">Peringatan:</span> Data kompetitor bersifat referensi awal.
                  Pastikan pengguna melakukan pengecekan ulang sebelum digunakan dalam skripsi.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Dynamic table editors ─────────────────────────────────────────────────────

function CompetitorTableEditor({
  data,
  onChange,
}: {
  data: CompetitorRow[];
  onChange: (rows: CompetitorRow[]) => void;
}) {
  function update(i: number, key: keyof CompetitorRow, val: string) {
    onChange(data.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));
  }
  function addRow() {
    onChange([...data, { nama: "", produk: "", harga: "", source: "manual" }]);
  }
  function removeRow(i: number) {
    if (data.length <= 1) return;
    onChange(data.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {["Nama Kompetitor", "Produk", "Harga", "Media Promosi", "Sumber", ""].map((h) => (
                <th key={h} className="text-xs text-left px-3 py-2 font-semibold text-slate-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="px-2 py-1.5">
                  <input value={row.nama} onChange={(e) => update(i, "nama", e.target.value)}
                    className="w-36 text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="Nama kompetitor" />
                </td>
                <td className="px-2 py-1.5">
                  <input value={row.produk} onChange={(e) => update(i, "produk", e.target.value)}
                    className="w-32 text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="Produk utama" />
                </td>
                <td className="px-2 py-1.5">
                  <input value={row.harga} onChange={(e) => update(i, "harga", e.target.value)}
                    className="w-24 text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="Rp18.000" />
                </td>
                <td className="px-2 py-1.5">
                  <input value={row.mediaProposi ?? ""} onChange={(e) => update(i, "mediaProposi", e.target.value)}
                    className="w-28 text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="Instagram, TikTok" />
                </td>
                <td className="px-2 py-1.5">
                  {row.source && row.source !== "manual" ? (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full border ${SOURCE_COLORS[row.source]}`}>
                      {SOURCE_LABELS[row.source]}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Manual</span>
                  )}
                </td>
                <td className="px-2 py-1.5">
                  <button onClick={() => removeRow(i)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addRow} className="inline-flex items-center gap-1.5 text-xs text-slate-600 border border-slate-300 rounded-md px-3 py-1.5 hover:bg-slate-50 transition-colors">
        <Plus className="w-3.5 h-3.5" /> Tambah Manual
      </button>
    </div>
  );
}

// ─── Generated table display ───────────────────────────────────────────────────

function GeneratedTableView({ table }: { table: ReturnType<typeof buildSalesTable> }) {
  if (table.rows.length === 0) return null;
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-xs">
        <thead className="bg-blue-50">
          <tr>
            {table.headers.map((h) => (
              <th key={h} className="text-left px-3 py-2 font-semibold text-slate-700 border-b border-slate-200">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => {
            const status = row.cols[4] ?? "";
            const isBad  = ["Tidak Tercapai", "Rendah"].includes(status);
            const isWarn = status === "Belum Optimal";
            const isGood = status === "Tercapai";
            return (
              <tr key={i} className={`border-t border-slate-100 ${isBad ? "bg-red-50/40" : isWarn ? "bg-amber-50/40" : ""}`}>
                {row.cols.map((cell, ci) => (
                  <td key={ci} className={`px-3 py-2 ${ci === 0 ? "font-medium" : ""} ${ci === 4 && isBad ? "text-red-600 font-medium" : ci === 4 && isWarn ? "text-amber-600 font-medium" : ci === 4 && isGood ? "text-green-600 font-medium" : ""}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CompetitorTableView({ table }: { table: ReturnType<typeof buildCompetitorTable> }) {
  if (table.rows.length === 0) return null;
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-xs">
        <thead className="bg-blue-50">
          <tr>
            {table.headers.map((h) => (
              <th key={h} className="text-left px-3 py-2 font-semibold text-slate-700 border-b border-slate-200">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i} className="border-t border-slate-100">
              {row.cols.map((cell, ci) => (
                <td key={ci} className={`px-3 py-2 ${ci === 0 ? "font-medium text-center" : ""}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function LatarBelakangPage() {
  const [form, setForm] = useState<Bab1State>(defaultBab1State);
  const [thesis, setThesis] = useState<ThesisState>({ x1: "", x2: "", y: "", objek: "" });
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Output state
  const [latarBelakang, setLatarBelakang] = useState("");
  const [manfaat, setManfaat] = useState("");

  // Quality check — computed live from current form + thesis
  const qualityItems: QualityItem[] = checkBab1Quality(form, thesis);
  const qualityScore = getBab1Score(qualityItems);
  const qualityPassed = qualityItems.filter((q) => q.pass).length;
  const qualityTotal  = qualityItems.length;

  useEffect(() => {
    setForm(loadBab1State());
    setThesis(loadThesisState());
  }, []);

  const updateForm = useCallback((patch: Partial<Bab1State>) => {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      saveBab1State(next);
      return next;
    });
    setGenerated(false);
  }, []);

  function validate(): string | null {
    if (!form.namaObjek.trim()) return "Nama objek penelitian wajib diisi.";
    if (!thesis.x1 || !thesis.x2 || !thesis.y)
      return "Variabel X1, X2, dan Y belum dipilih. Buka halaman Generator Judul terlebih dahulu.";
    return null;
  }

  function handleGenerate() {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    setLatarBelakang(generateLatarBelakang(form, thesis));
    setManfaat(generateManfaatPenelitian(form, thesis));
    setGenerated(true);
    setTimeout(() => {
      document.getElementById("output-section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  async function handleExport() {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    setError(null);
    try {
      const { generateBab1Docx } = await import("@/lib/thesis/bab1DocxExport");
      const blob = await generateBab1Docx(form, thesis);
      const fileName = `BAB-I-${form.namaObjek.replace(/\s+/g, "-")}.docx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("BAB I DOCX berhasil dibuat");
    } catch (e) {
      console.error(e);
      toast.error("Gagal membuat DOCX");
      setError("Gagal mengekspor DOCX. Silakan coba lagi.");
    }
    setLoading(false);
  }

  const salesTable    = buildSalesTable(form.salesData, form.namaObjek || "Objek", form.salesDataMode);
  const consumerTable = buildConsumerTable(form.consumerData, form.namaObjek || "Objek", form.consumerDataMode);

  function handleGenerateEstimation() {
    const estimation = generateSyncEstimation(form.namaObjek || "objek");
    updateForm({
      salesData: estimation.salesRows,
      consumerData: estimation.consumerRows,
    });
    toast.success("Data estimasi sinkron berhasil digenerate");
  }
  const competitorTable = buildCompetitorTable(form.competitors);

  const isReady = !!thesis.x1 && !!thesis.x2 && !!thesis.y;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Generator Latar Belakang</h1>
          <p className="text-slate-500 text-sm mt-1">
            Buat Bab I secara otomatis berdasarkan data penelitian Anda.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
          >
            <BookOpen className="w-4 h-4" /> Generate BAB I
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Mengekspor...</>
            ) : (
              <><Download className="w-4 h-4" /> Export BAB I</>
            )}
          </button>
        </div>
      </div>

      {/* Variabel status */}
      <div className="flex flex-wrap gap-2">
        {isReady ? (
          <>
            <Badge className="bg-blue-100 text-blue-700 border-blue-200">X1: {thesis.x1}</Badge>
            <Badge className="bg-purple-100 text-purple-700 border-purple-200">X2: {thesis.x2}</Badge>
            <Badge className="bg-green-100 text-green-700 border-green-200">Y: {thesis.y}</Badge>
            {thesis.objek && <Badge className="bg-slate-100 text-slate-700 border-slate-200">{thesis.objek}</Badge>}
          </>
        ) : (
          <Alert className="border-amber-200 bg-amber-50 py-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 text-xs">
              Variabel belum dipilih.{" "}
              <a href="/judul" className="text-blue-600 underline font-medium">Buka Generator Judul</a>{" "}
              untuk memilih X1, X2, dan Y.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ── FORM SECTIONS ── */}

      {/* Informasi Objek */}
      <Section title="Informasi Objek Penelitian">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Nama Objek <span className="text-red-500">*</span></label>
            <input
              value={form.namaObjek}
              onChange={(e) => updateForm({ namaObjek: e.target.value })}
              placeholder="cth: Sock Energy"
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Jenis Usaha</label>
            <input
              value={form.jenisUsaha}
              onChange={(e) => updateForm({ jenisUsaha: e.target.value })}
              placeholder="cth: Toko Online Kaos Kaki"
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Lokasi</label>
            <input
              value={form.lokasi}
              onChange={(e) => updateForm({ lokasi: e.target.value })}
              placeholder="cth: Depok"
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Section>

      {/* Data Penjualan */}
      <Section
        title="Data Penjualan"
        badge={
          form.salesDataMode === "estimasi" ? "🔒 Estimasi" :
          form.salesDataMode === "tidak_tersedia" ? "⚠ Tidak Tersedia" :
          `${form.salesData.filter(r => r.tahun).length} tahun`
        }
      >
        <div className="space-y-4">
          {/* Mode selector */}
          <DataModeSelector
            mode={form.salesDataMode}
            onChange={(m) => updateForm({ salesDataMode: m })}
          />

          {/* Generate Sinkron button */}
          {form.salesDataMode === "estimasi" && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-amber-800">Mode Estimasi/Disamarkan</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Data akan diberi keterangan &quot;estimasi/disamarkan&quot; pada narasi BAB I dan tabel DOCX.
                    Isi manual atau gunakan generator untuk data yang sinkron dan masuk akal.
                  </p>
                </div>
                <button
                  onClick={handleGenerateEstimation}
                  className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Generate Data Sinkron
                </button>
              </div>
            </div>
          )}

          {form.salesDataMode === "tidak_tersedia" && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700">Data Tidak Tersedia</p>
                <p className="text-xs text-red-600 mt-0.5">
                  BAB I akan dibuat tanpa tabel data penjualan. Narasi akan menyebutkan bahwa data tidak dapat ditampilkan.
                </p>
              </div>
            </div>
          )}

          {/* Table editor — only show when not "tidak_tersedia" */}
          {form.salesDataMode !== "tidak_tersedia" && (
            <>
              <SalesTableEditor data={form.salesData} onChange={(rows) => updateForm({ salesData: rows })} />
              {salesTable.rows.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500">Preview Tabel:</p>
                  <GeneratedTableView table={salesTable} />
                </div>
              )}
            </>
          )}
        </div>
      </Section>

      {/* Data Konsumen */}
      <Section
        title="Data Konsumen"
        badge={
          form.consumerDataMode === "estimasi" ? "🔒 Estimasi" :
          form.consumerDataMode === "tidak_tersedia" ? "⚠ Tidak Tersedia" :
          `${form.consumerData.filter(r => r.tahun).length} tahun`
        }
      >
        <div className="space-y-4">
          {/* Mode selector */}
          <DataModeSelector
            mode={form.consumerDataMode}
            onChange={(m) => updateForm({ consumerDataMode: m })}
          />

          {form.consumerDataMode === "estimasi" && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-amber-800">Mode Estimasi/Disamarkan</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Data konsumen akan disertai keterangan estimasi. Gunakan tombol di bawah untuk mengisi data yang
                    sinkron dengan data penjualan.
                  </p>
                </div>
                <button
                  onClick={handleGenerateEstimation}
                  className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Generate Data Sinkron
                </button>
              </div>
            </div>
          )}

          {form.consumerDataMode === "tidak_tersedia" && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700">Data Tidak Tersedia</p>
                <p className="text-xs text-red-600 mt-0.5">
                  BAB I akan dibuat tanpa tabel data konsumen. Narasi tetap akan menjelaskan fenomena secara kualitatif.
                </p>
              </div>
            </div>
          )}

          {form.consumerDataMode !== "tidak_tersedia" && (
            <>
              <ConsumerTableEditor data={form.consumerData} onChange={(rows) => updateForm({ consumerData: rows })} />
              {consumerTable.rows.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500">Preview Tabel:</p>
                  <GeneratedTableView table={consumerTable} />
                </div>
              )}
            </>
          )}
        </div>
      </Section>

      {/* Catatan Kerahasiaan — shown when any data is estimated/not available */}
      {(form.salesDataMode !== "asli" || form.consumerDataMode !== "asli") && (
        <Section title="Catatan Kerahasiaan Data">
          <div className="space-y-2">
            <p className="text-xs text-slate-500">
              Catatan ini akan dicantumkan sebagai keterangan sumber data pada tabel DOCX.
            </p>
            <textarea
              value={form.catatanKerahasiaan}
              onChange={(e) => updateForm({ catatanKerahasiaan: e.target.value })}
              rows={3}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <button
              onClick={() => updateForm({ catatanKerahasiaan: DEFAULT_CATATAN_KERAHASIAAN })}
              className="text-xs text-blue-600 hover:underline"
            >
              Reset ke default
            </button>
          </div>
        </Section>
      )}

      {/* Kompetitor */}
      <Section title="Kompetitor" badge={`${form.competitors.filter(c => c.nama).length} kompetitor`}>
        <div className="space-y-5">
          {/* Auto Riset Panel */}
          <AutoRisetPanel
            namaObjek={form.namaObjek}
            jenisUsaha={form.jenisUsaha}
            lokasi={form.lokasi}
            onAdd={(newRows) => {
              const filtered = form.competitors.filter(c => c.nama);
              updateForm({ competitors: [...filtered, ...newRows] });
            }}
          />

          {/* Manual table editor */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Daftar Kompetitor (Edit / Hapus)</p>
            <CompetitorTableEditor
              data={form.competitors}
              onChange={(rows) => updateForm({ competitors: rows })}
            />
          </div>

          {/* Preview */}
          {competitorTable.rows.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500">Preview Tabel:</p>
              <CompetitorTableView table={competitorTable} />
            </div>
          )}
        </div>
      </Section>

      {/* Fenomena */}
      <Section title="Fenomena Penelitian">
        <div className="space-y-2">
          <p className="text-xs text-slate-500">
            Tuliskan fenomena atau permasalahan utama yang ditemukan di objek penelitian (satu fenomena per baris).
          </p>
          <textarea
            value={form.fenomena}
            onChange={(e) => updateForm({ fenomena: e.target.value })}
            rows={5}
            placeholder={"Penjualan mengalami penurunan\nJumlah konsumen berkurang\nKompetitor semakin bertambah\nAktivitas promosi kurang optimal"}
            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
          />
        </div>
      </Section>

      {/* ── OUTPUT SECTION ── */}
      {generated && (
        <div id="output-section" className="space-y-6 pt-4">
          <Separator />
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800">Hasil Generate BAB I</h2>
            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Siap Salin</Badge>
          </div>

          {/* Latar Belakang */}
          <Card>
            <CardHeader className="pb-3 bg-blue-50 border-b border-blue-100">
              <CardTitle className="text-sm text-blue-800 flex items-center justify-between">
                <span>1.1 Latar Belakang Penelitian</span>
                <div className="flex gap-2">
                  <span className="text-xs text-blue-500 font-normal">
                    ~{latarBelakang.split(/\s+/).length} kata
                  </span>
                  <CopyButton text={latarBelakang} />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {latarBelakang.split("\n\n").map((p, i) => (
                  <p key={i} className="text-sm text-slate-700 leading-relaxed text-justify indent-8">
                    {p}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tabel Penjualan */}
          {salesTable.rows.length > 0 && (
            <Card>
              <CardHeader className="pb-3 bg-slate-50 border-b border-slate-200">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Tabel 1.1 {salesTable.caption}</span>
                  <CopyButton
                    text={[
                      salesTable.headers.join("\t"),
                      ...salesTable.rows.map((r) => r.cols.join("\t")),
                    ].join("\n")}
                    label="Salin Tabel"
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <GeneratedTableView table={salesTable} />
              </CardContent>
            </Card>
          )}

          {/* Tabel Konsumen */}
          {consumerTable.rows.length > 0 && (
            <Card>
              <CardHeader className="pb-3 bg-slate-50 border-b border-slate-200">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Tabel 1.2 {consumerTable.caption}</span>
                  <CopyButton
                    text={[
                      consumerTable.headers.join("\t"),
                      ...consumerTable.rows.map((r) => r.cols.join("\t")),
                    ].join("\n")}
                    label="Salin Tabel"
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <GeneratedTableView table={consumerTable} />
              </CardContent>
            </Card>
          )}

          {/* Tabel Kompetitor */}
          {competitorTable.rows.length > 0 && (
            <Card>
              <CardHeader className="pb-3 bg-slate-50 border-b border-slate-200">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Tabel 1.3 {competitorTable.caption}</span>
                  <CopyButton
                    text={[
                      competitorTable.headers.join("\t"),
                      ...competitorTable.rows.map((r) => r.cols.join("\t")),
                    ].join("\n")}
                    label="Salin Tabel"
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <CompetitorTableView table={competitorTable} />
              </CardContent>
            </Card>
          )}

          {/* Rumusan Masalah */}
          <Card>
            <CardHeader className="pb-3 bg-purple-50 border-b border-purple-100">
              <CardTitle className="text-sm text-purple-800 flex items-center justify-between">
                <span>1.2 Rumusan Masalah</span>
                <CopyButton
                  text={[
                    `1. Apakah ${thesis.x1} berpengaruh terhadap ${thesis.y} pada ${form.namaObjek}?`,
                    `2. Apakah ${thesis.x2} berpengaruh terhadap ${thesis.y} pada ${form.namaObjek}?`,
                    `3. Apakah ${thesis.x1} dan ${thesis.x2} secara simultan berpengaruh terhadap ${thesis.y} pada ${form.namaObjek}?`,
                  ].join("\n")}
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              {[
                `1. Apakah ${thesis.x1} berpengaruh terhadap ${thesis.y} pada ${form.namaObjek}?`,
                `2. Apakah ${thesis.x2} berpengaruh terhadap ${thesis.y} pada ${form.namaObjek}?`,
                `3. Apakah ${thesis.x1} dan ${thesis.x2} secara simultan berpengaruh terhadap ${thesis.y} pada ${form.namaObjek}?`,
              ].map((r, i) => (
                <p key={i} className="text-sm text-slate-700">{r}</p>
              ))}
            </CardContent>
          </Card>

          {/* Tujuan Penelitian */}
          <Card>
            <CardHeader className="pb-3 bg-green-50 border-b border-green-100">
              <CardTitle className="text-sm text-green-800 flex items-center justify-between">
                <span>1.3 Tujuan Penelitian</span>
                <CopyButton
                  text={[
                    `1. Untuk mengetahui pengaruh ${thesis.x1} terhadap ${thesis.y} pada ${form.namaObjek}.`,
                    `2. Untuk mengetahui pengaruh ${thesis.x2} terhadap ${thesis.y} pada ${form.namaObjek}.`,
                    `3. Untuk mengetahui pengaruh ${thesis.x1} dan ${thesis.x2} secara simultan terhadap ${thesis.y} pada ${form.namaObjek}.`,
                  ].join("\n")}
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              {[
                `1. Untuk mengetahui pengaruh ${thesis.x1} terhadap ${thesis.y} pada ${form.namaObjek}.`,
                `2. Untuk mengetahui pengaruh ${thesis.x2} terhadap ${thesis.y} pada ${form.namaObjek}.`,
                `3. Untuk mengetahui pengaruh ${thesis.x1} dan ${thesis.x2} secara simultan terhadap ${thesis.y} pada ${form.namaObjek}.`,
              ].map((t, i) => (
                <p key={i} className="text-sm text-slate-700">{t}</p>
              ))}
            </CardContent>
          </Card>

          {/* Manfaat Penelitian */}
          <Card>
            <CardHeader className="pb-3 bg-orange-50 border-b border-orange-100">
              <CardTitle className="text-sm text-orange-800 flex items-center justify-between">
                <span>1.4 Manfaat Penelitian</span>
                <CopyButton text={manfaat} />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {manfaat.split("\n\n").map((block, i) => {
                const lines = block.split("\n");
                const title = lines[0].replace(/\*\*/g, "");
                const body = lines.slice(1).join(" ");
                return (
                  <div key={i}>
                    <p className="text-sm font-semibold text-slate-800 mb-1">{title}</p>
                    <p className="text-sm text-slate-700 leading-relaxed text-justify">{body}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* BAB I Quality Check Engine */}
          <Card className={qualityScore >= 80 ? "border-green-300" : qualityScore >= 50 ? "border-amber-300" : "border-red-300"}>
            <CardHeader className={`pb-3 border-b ${qualityScore >= 80 ? "bg-green-50 border-green-100" : qualityScore >= 50 ? "bg-amber-50 border-amber-100" : "bg-red-50 border-red-100"}`}>
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {qualityScore >= 80
                    ? <ShieldCheck className="w-4 h-4 text-green-600" />
                    : <ShieldAlert className="w-4 h-4 text-amber-600" />}
                  <span className={qualityScore >= 80 ? "text-green-800" : qualityScore >= 50 ? "text-amber-800" : "text-red-800"}>
                    BAB I Quality Check
                  </span>
                </span>
                <Badge
                  variant="outline"
                  className={qualityScore >= 80 ? "border-green-400 text-green-700" : qualityScore >= 50 ? "border-amber-400 text-amber-700" : "border-red-400 text-red-700"}
                >
                  {qualityPassed}/{qualityTotal} — {qualityScore}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {qualityItems.map((item) => (
                  <div
                    key={item.key}
                    className={`flex items-start gap-2 text-xs rounded-md px-3 py-2 ${
                      item.pass
                        ? "bg-green-50 text-green-800 border border-green-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {item.pass
                      ? <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-green-600" />
                      : <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-red-500" />}
                    <div>
                      <p className="font-medium leading-tight">{item.label}</p>
                      {!item.pass && item.hint && (
                        <p className="text-red-600 mt-0.5 leading-tight">{item.hint}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {qualityScore < 80 && (
                <Alert className="mt-3 border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 text-xs">
                    Lengkapi item yang belum terpenuhi sebelum mengekspor ke DOCX untuk hasil terbaik.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Export button repeated at bottom */}
          <div className="flex justify-end gap-3 pb-4">
            <button
              onClick={handleExport}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Mengekspor...</>
              ) : (
                <><Download className="w-4 h-4" /> Export BAB I (.docx)</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
