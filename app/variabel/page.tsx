"use client";

import { useState, useEffect } from "react";
import { getAllVariableKnowledge, VariableKnowledge } from "@/lib/thesis/variableKnowledge";
import { GLOSSARY, GlossaryTerm, searchGlossary, GLOSSARY_CATEGORIES } from "@/lib/thesis/glossary";
import { loadThesisState } from "@/lib/thesis/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Search,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Lightbulb,
  BookMarked,
  Network,
  GraduationCap,
  Tag,
  Filter,
} from "lucide-react";

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VariabelPage() {
  const [activeTab, setActiveTab] = useState<"variabel" | "hubungan" | "contoh" | "glossary">("variabel");
  const [search, setSearch] = useState("");
  const [selectedKategori, setSelectedKategori] = useState<"semua" | "independen" | "dependen">("semua");
  const [selectedVariabel, setSelectedVariabel] = useState<string | null>(null);

  const [thesisForm, setThesisForm] = useState({ x1: "", x2: "", y: "", objek: "" });
  useEffect(() => {
    setThesisForm(loadThesisState());
  }, []);

  const allKnowledge = getAllVariableKnowledge();

  const filtered = allKnowledge.filter((v) => {
    const matchSearch = search === "" ||
      v.nama.toLowerCase().includes(search.toLowerCase()) ||
      v.definisiSederhana.toLowerCase().includes(search.toLowerCase());
    const matchKategori = selectedKategori === "semua" || v.kategori === selectedKategori;
    return matchSearch && matchKategori;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Pusat Belajar Variabel</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Pahami semua variabel penelitian — definisi, indikator, hubungan, dan contoh nyata.
            </p>
          </div>
        </div>

        {/* Selected variables banner */}
        {(thesisForm.x1 || thesisForm.x2 || thesisForm.y) && (
          <div className="mt-4 flex flex-wrap items-center gap-2 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl px-4 py-3">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Variabel Penelitianmu:</span>
            {thesisForm.x1 && <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-0">X1: {thesisForm.x1}</Badge>}
            {thesisForm.x2 && <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-0">X2: {thesisForm.x2}</Badge>}
            {thesisForm.y && <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0">Y: {thesisForm.y}</Badge>}
            {thesisForm.objek && <span className="text-xs text-indigo-500 dark:text-indigo-400">pada {thesisForm.objek}</span>}
          </div>
        )}
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 overflow-x-auto">
        {[
          { id: "variabel", label: "Semua Variabel", icon: BookOpen },
          { id: "hubungan", label: "Hubungan & Mind Map", icon: Network },
          { id: "contoh", label: "Contoh Penelitian", icon: Lightbulb },
          { id: "glossary", label: "Glosarium", icon: Tag },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === id
                ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "variabel" && (
        <VariabelTab
          all={filtered}
          search={search}
          setSearch={setSearch}
          selectedKategori={selectedKategori}
          setSelectedKategori={setSelectedKategori}
          selectedVariabel={selectedVariabel}
          setSelectedVariabel={setSelectedVariabel}
          thesisForm={thesisForm}
        />
      )}
      {activeTab === "hubungan" && (
        <HubunganTab thesisForm={thesisForm} allKnowledge={allKnowledge} />
      )}
      {activeTab === "contoh" && (
        <ContohTab thesisForm={thesisForm} />
      )}
      {activeTab === "glossary" && (
        <GlossaryTab />
      )}
    </div>
  );
}

// ─── Tab: Semua Variabel ──────────────────────────────────────────────────────

function VariabelTab({
  all,
  search,
  setSearch,
  selectedKategori,
  setSelectedKategori,
  selectedVariabel,
  setSelectedVariabel,
  thesisForm,
}: {
  all: VariableKnowledge[];
  search: string;
  setSearch: (v: string) => void;
  selectedKategori: "semua" | "independen" | "dependen";
  setSelectedKategori: (v: "semua" | "independen" | "dependen") => void;
  selectedVariabel: string | null;
  setSelectedVariabel: (v: string | null) => void;
  thesisForm: { x1: string; x2: string; y: string; objek: string };
}) {
  const myVariables = new Set([thesisForm.x1, thesisForm.x2, thesisForm.y].filter(Boolean));

  return (
    <div className="space-y-4">
      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari variabel..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 dark:text-slate-200"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {(["semua", "independen", "dependen"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setSelectedKategori(k)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-medium ${
                selectedKategori === k
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-indigo-400"
              }`}
            >
              {k === "semua" ? "Semua" : k === "independen" ? "Variabel X" : "Variabel Y"}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">{all.length} variabel ditemukan</p>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-4">
        {all.map((v) => {
          const isMyVar = myVariables.has(v.nama);
          const myKey = v.nama === thesisForm.x1 ? "X1" : v.nama === thesisForm.x2 ? "X2" : v.nama === thesisForm.y ? "Y" : null;
          const isOpen = selectedVariabel === v.nama;

          return (
            <div
              key={v.nama}
              className={`border-2 rounded-2xl overflow-hidden transition-all ${
                isMyVar
                  ? myKey === "X1"
                    ? "border-blue-300 dark:border-blue-700"
                    : myKey === "X2"
                    ? "border-purple-300 dark:border-purple-700"
                    : "border-green-300 dark:border-green-700"
                  : "border-slate-200 dark:border-slate-700"
              }`}
            >
              {/* Card header */}
              <button
                onClick={() => setSelectedVariabel(isOpen ? null : v.nama)}
                className="w-full flex items-center justify-between px-5 py-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xl">{v.emoji}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{v.nama}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    v.kategori === "independen"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  }`}>
                    {v.kategori === "independen" ? "Variabel X" : "Variabel Y"}
                  </span>
                  {myKey && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      myKey === "X1" ? "bg-blue-600 text-white" :
                      myKey === "X2" ? "bg-purple-600 text-white" :
                      "bg-green-600 text-white"
                    }`}>
                      {myKey} — Variabelmu
                    </span>
                  )}
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
              </button>

              {/* Expanded content */}
              {isOpen && <VariabelDetail knowledge={v} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Variable Detail (expanded) ───────────────────────────────────────────────

function VariabelDetail({ knowledge }: { knowledge: VariableKnowledge }) {
  return (
    <div className="border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
      {/* Main info */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Definisi Ilmiah</p>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{knowledge.definisi}</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">💡 AI Penjelasan (Bahasa Mahasiswa)</p>
          <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">{knowledge.definisiSederhana}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Mengapa Digunakan?</p>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{knowledge.mengapaDigunakan}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Contoh Penerapan</p>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{knowledge.contohObjek}</p>
        </div>
      </div>

      {/* Indicators */}
      <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-4">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
          Indikator ({knowledge.indikator.length})
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {knowledge.indikator.map((ind) => (
            <div
              key={ind.nama}
              className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/50 space-y-2"
            >
              <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">{ind.nama}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{ind.definisi}</p>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-100 dark:border-slate-700">
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-0.5">Contoh:</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">{ind.contoh}</p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500 italic">{ind.mengapa}</p>
            </div>
          ))}
        </div>
      </div>

      {/* References */}
      <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-4">
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">Referensi Akademik</p>
        <div className="flex flex-wrap gap-2">
          {knowledge.referensi.map((ref) => (
            <span
              key={ref.penulis}
              className="text-xs bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-full px-3 py-1 text-indigo-700 dark:text-indigo-300"
            >
              📖 {ref.penulis} ({ref.tahun}) — {ref.karya}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Hubungan Antar Variabel ─────────────────────────────────────────────

function HubunganTab({
  thesisForm,
  allKnowledge,
}: {
  thesisForm: { x1: string; x2: string; y: string; objek: string };
  allKnowledge: VariableKnowledge[];
}) {
  const hasVars = thesisForm.x1 && thesisForm.x2 && thesisForm.y;
  const x1K = allKnowledge.find((v) => v.nama === thesisForm.x1);
  const x2K = allKnowledge.find((v) => v.nama === thesisForm.x2);
  const yK = allKnowledge.find((v) => v.nama === thesisForm.y);

  return (
    <div className="space-y-6">
      {!hasVars && (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700">
          <Network className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Variabel penelitian belum diatur.</p>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
            Atur variabel X1, X2, dan Y di halaman{" "}
            <a href="/judul" className="text-indigo-600 underline">Generator Judul</a>.
          </p>
        </div>
      )}

      {hasVars && (
        <>
          {/* Mind Map Visual */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Network className="w-4 h-4" />
                Mind Map Hubungan Variabel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4 py-6">
                {/* X variables */}
                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  {/* X1 */}
                  <div className="flex-1 bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-300 dark:border-blue-700 rounded-2xl p-4 text-center">
                    <span className="text-xs font-bold text-blue-500 dark:text-blue-400 block mb-1">X1 (Variabel Bebas 1)</span>
                    <span className="text-xl">{x1K?.emoji ?? "📊"}</span>
                    <p className="font-bold text-blue-800 dark:text-blue-200 text-sm mt-1">{thesisForm.x1}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 line-clamp-2">{x1K?.definisiSederhana}</p>
                  </div>

                  {/* Arrow + H1 */}
                  <div className="flex sm:flex-col items-center justify-center gap-1 px-2">
                    <div className="flex items-center gap-1">
                      <div className="hidden sm:block h-0.5 w-8 bg-blue-400 dark:bg-blue-600" />
                      <ArrowRight className="w-4 h-4 text-blue-400 dark:text-blue-600 hidden sm:block" />
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-600 rounded px-2 py-0.5">H1</span>
                    </div>
                    <div className="block sm:hidden h-0.5 w-12 bg-blue-400 dark:bg-blue-600" />
                  </div>

                  {/* Y */}
                  <div className="flex-1 flex items-center">
                    <div className="w-full bg-green-50 dark:bg-green-950/40 border-2 border-green-300 dark:border-green-700 rounded-2xl p-4 text-center">
                      <span className="text-xs font-bold text-green-500 dark:text-green-400 block mb-1">Y (Variabel Terikat)</span>
                      <span className="text-xl">{yK?.emoji ?? "🎯"}</span>
                      <p className="font-bold text-green-800 dark:text-green-200 text-sm mt-1">{thesisForm.y}</p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1 line-clamp-2">{yK?.definisiSederhana}</p>
                    </div>
                  </div>
                </div>

                {/* X2 row */}
                <div className="flex flex-col sm:flex-row gap-4 w-full items-center">
                  <div className="flex-1 bg-purple-50 dark:bg-purple-950/40 border-2 border-purple-300 dark:border-purple-700 rounded-2xl p-4 text-center">
                    <span className="text-xs font-bold text-purple-500 dark:text-purple-400 block mb-1">X2 (Variabel Bebas 2)</span>
                    <span className="text-xl">{x2K?.emoji ?? "📊"}</span>
                    <p className="font-bold text-purple-800 dark:text-purple-200 text-sm mt-1">{thesisForm.x2}</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 line-clamp-2">{x2K?.definisiSederhana}</p>
                  </div>
                  <div className="flex sm:flex-col items-center gap-1 px-2">
                    <div className="flex items-center gap-1">
                      <div className="hidden sm:block h-0.5 w-8 bg-purple-400 dark:bg-purple-600" />
                      <ArrowRight className="w-4 h-4 text-purple-400 dark:text-purple-600 hidden sm:block" />
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400 border border-purple-300 dark:border-purple-600 rounded px-2 py-0.5">H2</span>
                    </div>
                    <div className="block sm:hidden h-0.5 w-12 bg-purple-400 dark:bg-purple-600" />
                  </div>
                  {/* Simultan H3 */}
                  <div className="flex-1 hidden sm:flex justify-center">
                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-center bg-white dark:bg-slate-900">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">H3 — Simultan</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{thesisForm.x1} & {thesisForm.x2} secara bersama-sama → {thesisForm.y}</p>
                    </div>
                  </div>
                </div>

                {/* H3 mobile */}
                <div className="sm:hidden w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-center bg-white dark:bg-slate-900">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">H3 — Simultan</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{thesisForm.x1} & {thesisForm.x2} → {thesisForm.y}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hypothesis cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { hyp: "H1", color: "blue", x: thesisForm.x1, y: thesisForm.y, xK: x1K, yK: yK },
              { hyp: "H2", color: "purple", x: thesisForm.x2, y: thesisForm.y, xK: x2K, yK: yK },
              { hyp: "H3", color: "slate", x: `${thesisForm.x1} & ${thesisForm.x2}`, y: thesisForm.y, xK: null, yK: yK },
            ].map(({ hyp, color, x, y, xK, yK: yVar }) => (
              <div key={hyp} className={`rounded-xl border p-4 bg-${color}-50 dark:bg-${color}-950/30 border-${color}-200 dark:border-${color}-800`}>
                <span className={`text-xs font-bold text-${color}-600 dark:text-${color}-400`}>{hyp}</span>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-1">
                  {x} berpengaruh signifikan terhadap {y}
                </p>
                {xK && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                    {xK.mengapaDigunakan}
                  </p>
                )}
                {!xK && yVar && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Pengaruh simultan kedua variabel bebas terhadap {yVar.nama} diuji melalui Uji F.
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tab: Contoh Penelitian ───────────────────────────────────────────────────

function ContohTab({ thesisForm }: { thesisForm: { x1: string; x2: string; y: string; objek: string } }) {
  const hasVars = thesisForm.x1 && thesisForm.x2 && thesisForm.y;
  const objek = thesisForm.objek || "Objek Penelitian";

  const whyX1 = hasVars ? generateWhyVariable(thesisForm.x1, objek) : null;
  const whyX2 = hasVars ? generateWhyVariable(thesisForm.x2, objek) : null;
  const whyY = hasVars ? generateWhyVariable(thesisForm.y, objek) : null;

  return (
    <div className="space-y-6">
      {!hasVars && (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700">
          <Lightbulb className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Atur variabel penelitian terlebih dahulu.</p>
        </div>
      )}

      {hasVars && (
        <>
          {/* Research object card */}
          <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30">
            <CardContent className="pt-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {objek.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide mb-1">Objek Penelitian</p>
                  <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-100">{objek}</h3>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
                    Berikut adalah alasan mengapa variabel-variabel yang dipilih relevan untuk meneliti {objek}.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Why each variable */}
          <div className="space-y-4">
            {[
              { key: "X1", nama: thesisForm.x1, why: whyX1, color: "blue" },
              { key: "X2", nama: thesisForm.x2, why: whyX2, color: "purple" },
              { key: "Y",  nama: thesisForm.y,  why: whyY,  color: "green"  },
            ].map(({ key, nama, why, color }) => (
              <div key={key} className={`border-2 border-${color}-200 dark:border-${color}-800 rounded-2xl bg-white dark:bg-slate-900`}>
                <div className={`px-5 py-4 bg-${color}-50 dark:bg-${color}-950/30 rounded-t-2xl border-b border-${color}-100 dark:border-${color}-900`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-${color}-600 text-white`}>{key}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{nama}</span>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                    Kenapa {objek} menggunakan {nama}?
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{why}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Research flow */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Alur Penelitian</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { label: "Fenomena", desc: `Masalah pada ${objek}` },
                  { label: thesisForm.x1, desc: "Variabel X1" },
                  { label: thesisForm.x2, desc: "Variabel X2" },
                  { label: "Kuesioner", desc: "30 item pertanyaan" },
                  { label: "Analisis", desc: "Regresi linier berganda" },
                  { label: thesisForm.y, desc: "Hasil penelitian" },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="text-center">
                      <div className="bg-indigo-100 dark:bg-indigo-900 border border-indigo-200 dark:border-indigo-700 rounded-xl px-3 py-2">
                        <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300">{step.label}</p>
                        <p className="text-xs text-indigo-500 dark:text-indigo-400">{step.desc}</p>
                      </div>
                    </div>
                    {i < 5 && <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// Helper: generate "why" explanation for a variable + object
function generateWhyVariable(variableName: string, objek: string): string {
  const templates: Record<string, string> = {
    "Harga": `${objek} perlu memahami apakah penetapan harga yang mereka terapkan sesuai dengan ekspektasi dan kemampuan finansial konsumen. Penelitian ini akan mengungkap apakah harga menjadi faktor pendorong atau penghambat pembelian pada ${objek}.`,
    "Promosi": `Aktivitas promosi yang dilakukan ${objek} — baik melalui media sosial, influencer, maupun iklan — perlu dievaluasi efektivitasnya. Penelitian ini mengukur seberapa besar promosi mempengaruhi keputusan konsumen untuk memilih ${objek}.`,
    "Kualitas Produk": `Kualitas produk adalah salah satu keunggulan kompetitif utama. Penelitian ini mengevaluasi apakah konsumen ${objek} merasa produk yang ditawarkan memenuhi standar kualitas yang mereka harapkan.`,
    "Kualitas Pelayanan": `Pengalaman pelayanan di ${objek} — dari respons, keramahan, hingga ketepatan — mempengaruhi kepuasan dan loyalitas konsumen. Penelitian ini mengukur dimensi mana yang paling berpengaruh.`,
    "Brand Image": `Citra merek ${objek} di benak konsumen terbentuk dari berbagai pengalaman dan informasi. Penelitian ini mengukur bagaimana brand image mempengaruhi pilihan konsumen.`,
    "Brand Awareness": `Seberapa dikenal ${objek} di kalangan target konsumennya perlu diukur. Penelitian ini menilai tingkat kesadaran merek dan korelasinya dengan keputusan pembelian.`,
    "Social Media Marketing": `Kehadiran ${objek} di media sosial merupakan salah satu strategi pemasaran utama. Penelitian ini mengukur efektivitas konten, interaksi, dan iklan media sosial dalam mendorong pembelian.`,
    "Influencer Marketing": `Kolaborasi ${objek} dengan influencer atau affiliate merupakan strategi yang banyak digunakan bisnis digital saat ini. Penelitian ini mengukur seberapa besar kepercayaan dan daya tarik influencer mempengaruhi keputusan konsumen.`,
    "Online Customer Review": `Ulasan pelanggan di platform online menjadi referensi utama calon pembeli ${objek}. Penelitian ini mengukur pengaruh kualitas, kuantitas, dan kepercayaan ulasan terhadap keputusan pembelian.`,
    "Electronic Word Of Mouth": `Rekomendasi dan informasi yang beredar di komunitas online tentang ${objek} memiliki dampak besar. Penelitian ini mengukur seberapa besar eWOM mempengaruhi calon konsumen.`,
    "Kepercayaan": `Kepercayaan konsumen kepada ${objek} — dalam hal kejujuran, kemampuan, dan integritas — adalah fondasi utama transaksi, terutama untuk bisnis online. Penelitian ini mengukur dimensi kepercayaan yang paling berpengaruh.`,
    "Diskon": `Program diskon yang ditawarkan ${objek} merupakan stimulus pembelian yang kuat. Penelitian ini mengukur seberapa besar besaran, frekuensi, dan daya tarik diskon mempengaruhi keputusan konsumen.`,
    "Gratis Ongkir": `Biaya pengiriman sering menjadi hambatan terakhir sebelum konsumen menyelesaikan pembelian di ${objek}. Penelitian ini mengukur seberapa besar layanan gratis ongkir mendorong keputusan pembelian.`,
    "Keputusan Pembelian": `Keputusan pembelian adalah hasil akhir dari semua stimulus pemasaran yang diterima konsumen ${objek}. Variabel ini menjadi tolok ukur keberhasilan strategi pemasaran yang diterapkan.`,
    "Minat Beli": `Minat beli konsumen terhadap produk ${objek} adalah indikator awal yang menentukan apakah konsumen akan benar-benar melakukan transaksi. Memahami minat beli membantu ${objek} merancang strategi yang lebih tepat sasaran.`,
    "Kepuasan Konsumen": `Kepuasan konsumen ${objek} menentukan apakah mereka akan kembali membeli dan merekomendasikan kepada orang lain. Penelitian ini mengidentifikasi faktor apa yang paling mempengaruhi kepuasan tersebut.`,
    "Loyalitas Konsumen": `Loyalitas konsumen adalah aset jangka panjang bagi ${objek}. Penelitian ini mengukur seberapa kuat komitmen konsumen untuk terus berbelanja di ${objek} dan faktor apa yang membangunnya.`,
  };
  return templates[variableName] ?? `Variabel ${variableName} dipilih karena relevan dengan fenomena yang terjadi pada ${objek} dan didukung oleh berbagai kajian akademis terdahulu.`;
}

// ─── Tab: Glosarium ───────────────────────────────────────────────────────────

function GlossaryTab() {
  const [search, setSearch] = useState("");
  const [activeKat, setActiveKat] = useState<string>("Semua");

  const filtered = search !== ""
    ? searchGlossary(search)
    : activeKat === "Semua"
    ? GLOSSARY
    : GLOSSARY.filter((g) => g.kategori === activeKat);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari istilah..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 dark:text-slate-200"
        />
      </div>

      {/* Category filter */}
      {search === "" && (
        <div className="flex flex-wrap gap-2">
          {["Semua", ...GLOSSARY_CATEGORIES].map((kat) => (
            <button
              key={kat}
              onClick={() => setActiveKat(kat)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-medium ${
                activeKat === kat
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-indigo-400"
              }`}
            >
              {kat}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-400 dark:text-slate-500">{filtered.length} istilah</p>

      {/* Glossary grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((g) => (
          <GlossaryCard key={g.term} term={g} />
        ))}
      </div>
    </div>
  );
}

function GlossaryCard({ term }: { term: GlossaryTerm }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{term.term}</span>
          <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full px-2 py-0.5">{term.kategori}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
          <p className="text-sm text-slate-700 dark:text-slate-300">{term.definisiSederhana}</p>
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Contoh:</p>
            <p className="text-xs text-amber-800 dark:text-amber-300">{term.contoh}</p>
          </div>
        </div>
      )}
    </div>
  );
}
