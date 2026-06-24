"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bab1State,
  SalesRow,
  ConsumerRow,
  CompetitorRow,
  defaultBab1State,
  loadBab1State,
  saveBab1State,
} from "@/lib/thesis/bab1Store";
import { loadThesisState, ThesisState } from "@/lib/thesis/store";
import {
  generateLatarBelakang,
  generateManfaatPenelitian,
  buildSalesTable,
  buildConsumerTable,
  buildCompetitorTable,
  pct,
  keterangan,
} from "@/lib/thesis/bab1Generator";
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
    onChange([...data, { nama: "", produk: "", harga: "" }]);
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
              {["Nama Kompetitor", "Produk Utama", "Harga", ""].map((h) => (
                <th key={h} className="text-xs text-left px-3 py-2 font-semibold text-slate-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="px-2 py-1.5">
                  <input value={row.nama} onChange={(e) => update(i, "nama", e.target.value)}
                    className="w-40 text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="cth: Kaoskaki Store" />
                </td>
                <td className="px-2 py-1.5">
                  <input value={row.produk} onChange={(e) => update(i, "produk", e.target.value)}
                    className="w-36 text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="cth: Ankle Terry" />
                </td>
                <td className="px-2 py-1.5">
                  <input value={row.harga} onChange={(e) => update(i, "harga", e.target.value)}
                    className="w-28 text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="cth: Rp18.000" />
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
        <Plus className="w-3.5 h-3.5" /> Tambah Kompetitor
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
            const isNotAchieved = row.cols[4] === "Tidak Tercapai";
            return (
              <tr key={i} className={`border-t border-slate-100 ${isNotAchieved ? "bg-red-50/40" : ""}`}>
                {row.cols.map((cell, ci) => (
                  <td key={ci} className={`px-3 py-2 ${ci === 0 ? "font-medium" : ""} ${isNotAchieved && ci === 4 ? "text-red-600 font-medium" : ""}`}>
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

  const salesTable = buildSalesTable(form.salesData, form.namaObjek || "Objek");
  const consumerTable = buildConsumerTable(form.consumerData, form.namaObjek || "Objek");
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
      <Section title="Data Penjualan" badge={`${form.salesData.filter(r => r.tahun).length} tahun`}>
        <SalesTableEditor data={form.salesData} onChange={(rows) => updateForm({ salesData: rows })} />
        {salesTable.rows.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-slate-500">Preview Tabel:</p>
            <GeneratedTableView table={salesTable} />
          </div>
        )}
      </Section>

      {/* Data Konsumen */}
      <Section title="Data Konsumen" badge={`${form.consumerData.filter(r => r.tahun).length} tahun`}>
        <ConsumerTableEditor data={form.consumerData} onChange={(rows) => updateForm({ consumerData: rows })} />
        {consumerTable.rows.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-slate-500">Preview Tabel:</p>
            <GeneratedTableView table={consumerTable} />
          </div>
        )}
      </Section>

      {/* Kompetitor */}
      <Section title="Kompetitor" badge={`${form.competitors.filter(c => c.nama).length} kompetitor`}>
        <CompetitorTableEditor data={form.competitors} onChange={(rows) => updateForm({ competitors: rows })} />
        {competitorTable.rows.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-slate-500">Preview Tabel:</p>
            <CompetitorTableView table={competitorTable} />
          </div>
        )}
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
