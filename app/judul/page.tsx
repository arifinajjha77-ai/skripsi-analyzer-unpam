"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { independentVariables, dependentVariables } from "@/lib/thesis/variables";
import { loadThesisState, saveThesisState, ThesisState } from "@/lib/thesis/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, ArrowRight, BookOpen } from "lucide-react";

const defaultState: ThesisState = { x1: "", x2: "", y: "", objek: "" };

interface CopyButtonProps {
  text: string;
}

function CopyButton({ text }: CopyButtonProps) {
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
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 border border-slate-200 rounded-md px-2.5 py-1.5 transition-colors hover:border-blue-300"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-green-500" /> Tersalin
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" /> Salin
        </>
      )}
    </button>
  );
}

export default function JudulPage() {
  const router = useRouter();
  const [form, setForm] = useState<ThesisState>(defaultState);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    const saved = loadThesisState();
    if (saved.x1 || saved.x2 || saved.y) {
      setForm(saved);
      setGenerated(true);
    }
  }, []);

  const update = useCallback((key: keyof ThesisState, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setGenerated(false);
  }, []);

  function handleGenerate() {
    if (!form.x1 || !form.x2 || !form.y || !form.objek.trim()) return;
    saveThesisState(form);
    setGenerated(true);
  }

  const isReady = !!form.x1 && !!form.x2 && !!form.y && !!form.objek.trim();

  // Generated texts
  const judul = generated && isReady
    ? `Pengaruh ${form.x1} dan ${form.x2} Terhadap ${form.y} Pada ${form.objek}`
    : null;

  const rumusan = generated && isReady
    ? [
        `1. Apakah ${form.x1} berpengaruh terhadap ${form.y} pada ${form.objek}?`,
        `2. Apakah ${form.x2} berpengaruh terhadap ${form.y} pada ${form.objek}?`,
        `3. Apakah ${form.x1} dan ${form.x2} secara simultan berpengaruh terhadap ${form.y} pada ${form.objek}?`,
      ]
    : null;

  const tujuan = generated && isReady
    ? [
        `1. Untuk mengetahui pengaruh ${form.x1} terhadap ${form.y} pada ${form.objek}.`,
        `2. Untuk mengetahui pengaruh ${form.x2} terhadap ${form.y} pada ${form.objek}.`,
        `3. Untuk mengetahui pengaruh ${form.x1} dan ${form.x2} secara simultan terhadap ${form.y} pada ${form.objek}.`,
      ]
    : null;

  const hipotesis = generated && isReady
    ? [
        { code: "H1", text: `${form.x1} berpengaruh positif dan signifikan terhadap ${form.y} pada ${form.objek}.` },
        { code: "H2", text: `${form.x2} berpengaruh positif dan signifikan terhadap ${form.y} pada ${form.objek}.` },
        { code: "H3", text: `${form.x1} dan ${form.x2} secara simultan berpengaruh positif dan signifikan terhadap ${form.y} pada ${form.objek}.` },
      ]
    : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Generator Judul & Hipotesis</h1>
        <p className="text-slate-500 text-sm mt-1">
          Buat judul, rumusan masalah, tujuan penelitian, dan hipotesis secara otomatis.
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader className="pb-3 bg-slate-50 border-b border-slate-200">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            Konfigurasi Penelitian
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* X1 */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Variabel X1 (Independen)
              </label>
              <select
                value={form.x1}
                onChange={(e) => update("x1", e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">-- Pilih Variabel X1 --</option>
                {independentVariables.map((v) => (
                  <option key={v} value={v} disabled={v === form.x2}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {/* X2 */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Variabel X2 (Independen)
              </label>
              <select
                value={form.x2}
                onChange={(e) => update("x2", e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">-- Pilih Variabel X2 --</option>
                {independentVariables.map((v) => (
                  <option key={v} value={v} disabled={v === form.x1}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {/* Y */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Variabel Y (Dependen)
              </label>
              <select
                value={form.y}
                onChange={(e) => update("y", e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">-- Pilih Variabel Y --</option>
                {dependentVariables.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {/* Objek */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Nama Objek Penelitian
              </label>
              <input
                type="text"
                value={form.objek}
                onChange={(e) => update("objek", e.target.value)}
                placeholder="cth: Toko Vapor Energy Station"
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleGenerate}
              disabled={!isReady}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              Generate
            </button>
            {generated && (
              <button
                onClick={() => router.push("/kuesioner")}
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Buka Kuesioner <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Output cards */}
      {generated && judul && rumusan && tujuan && hipotesis && (
        <div className="space-y-4">
          {/* Judul */}
          <Card>
            <CardHeader className="pb-2 bg-blue-50 border-b border-blue-100">
              <CardTitle className="text-sm text-blue-800 flex items-center justify-between">
                <span>Judul Penelitian</span>
                <CopyButton text={judul} />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-base font-semibold text-slate-800 leading-relaxed">
                {judul}
              </p>
              <div className="flex gap-2 mt-3 flex-wrap">
                <Badge variant="outline" className="text-xs">{form.x1}</Badge>
                <Badge variant="outline" className="text-xs">{form.x2}</Badge>
                <Badge variant="outline" className="text-xs">{form.y}</Badge>
                <Badge variant="outline" className="text-xs">{form.objek}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Rumusan Masalah */}
          <Card>
            <CardHeader className="pb-2 bg-purple-50 border-b border-purple-100">
              <CardTitle className="text-sm text-purple-800 flex items-center justify-between">
                <span>Rumusan Masalah</span>
                <CopyButton text={rumusan.join("\n")} />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ol className="space-y-2">
                {rumusan.map((r, i) => (
                  <li key={i} className="text-sm text-slate-700 leading-relaxed">
                    {r}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Tujuan Penelitian */}
          <Card>
            <CardHeader className="pb-2 bg-green-50 border-b border-green-100">
              <CardTitle className="text-sm text-green-800 flex items-center justify-between">
                <span>Tujuan Penelitian</span>
                <CopyButton text={tujuan.join("\n")} />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ol className="space-y-2">
                {tujuan.map((t, i) => (
                  <li key={i} className="text-sm text-slate-700 leading-relaxed">
                    {t}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Hipotesis */}
          <Card>
            <CardHeader className="pb-2 bg-orange-50 border-b border-orange-100">
              <CardTitle className="text-sm text-orange-800 flex items-center justify-between">
                <span>Hipotesis Penelitian</span>
                <CopyButton
                  text={hipotesis.map((h) => `${h.code}: ${h.text}`).join("\n")}
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {hipotesis.map((h) => (
                  <div key={h.code} className="flex gap-3 items-start">
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200 shrink-0 text-xs font-bold mt-0.5">
                      {h.code}
                    </Badge>
                    <p className="text-sm text-slate-700 leading-relaxed">{h.text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Navigation CTA */}
          <div className="flex justify-end">
            <button
              onClick={() => router.push("/kuesioner")}
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              Lanjut ke Kuesioner <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
