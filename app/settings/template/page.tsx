"use client";

import { useState, useEffect, useCallback } from "react";
import { BookOpen, Save, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { loadSettings, saveSettings, type AppSettings } from "@/lib/settingsStore";
import { TEMPLATE_OPTIONS, TEMPLATE_REGISTRY } from "@/lib/templates";

export default function TemplateSettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const handleSelect = useCallback((id: string) => {
    if (!settings) return;
    setSettings({ ...settings, template: id });
    setSaved(false);
  }, [settings]);

  const handleSave = useCallback(() => {
    if (!settings) return;
    saveSettings(settings);
    setSaved(true);
    toast.success("Template kampus berhasil disimpan");
    setTimeout(() => setSaved(false), 2000);
  }, [settings]);

  if (!settings) return null;

  const activeTemplate = TEMPLATE_REGISTRY[settings.template] ?? TEMPLATE_REGISTRY.unpam;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Template Kampus</h1>
            <p className="text-sm text-slate-500">Format dokumen sesuai pedoman penulisan skripsi</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium"
        >
          <Save className="w-3.5 h-3.5" />
          {saved ? "Tersimpan ✓" : "Simpan"}
        </button>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        Template yang dipilih mengatur format semua dokumen yang dieksport: margin, font, spasi, penomoran, sitasi, dan daftar pustaka.
      </div>

      {/* Template selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-700 mb-4">Pilih Template Kampus</h2>
        <div className="space-y-2">
          {TEMPLATE_OPTIONS.map((opt) => {
            const isSelected = settings.template === opt.id;
            const isAvailable = opt.available;
            return (
              <button
                key={opt.id}
                onClick={() => isAvailable && handleSelect(opt.id)}
                disabled={!isAvailable}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all text-left
                  ${isSelected   ? "border-blue-500 bg-blue-50"
                  : isAvailable  ? "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  : "border-slate-100 opacity-50 cursor-not-allowed bg-slate-50"}`}
              >
                <div>
                  <p className={`text-sm font-semibold ${isSelected ? "text-blue-800" : "text-slate-700"}`}>
                    {opt.label}
                  </p>
                  {!isAvailable && (
                    <p className="text-xs text-slate-400 mt-0.5">Segera hadir</p>
                  )}
                </div>
                {isSelected && <Check className="w-5 h-5 text-blue-600 shrink-0" />}
                {!isAvailable && (
                  <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full shrink-0">Coming Soon</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active template detail */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-700 mb-4">
          Konfigurasi Aktif — {activeTemplate.nama}
        </h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ["Kampus",         activeTemplate.nama],
            ["Fakultas",       activeTemplate.namaFakultas],
            ["Font",           `${activeTemplate.font} ${activeTemplate.fontSize}pt`],
            ["Spasi",          `${activeTemplate.lineSpacingMultiple}x`],
            ["Margin",         `K${activeTemplate.marginCm.left} · Ka${activeTemplate.marginCm.right} · A${activeTemplate.marginCm.top} · B${activeTemplate.marginCm.bottom} cm`],
            ["Indentasi",      `${activeTemplate.paragraphIndentCm} cm`],
            ["Heading BAB",    activeTemplate.headingBabFormat],
            ["Heading Subbab", activeTemplate.headingSubbabFormat],
            ["Nomor BAB",      activeTemplate.nomorBab],
            ["Caption Tabel",  activeTemplate.captionTabelPosition + " tabel"],
            ["Caption Gambar", activeTemplate.captionGambarPosition + " gambar"],
            ["Halaman Awal",   activeTemplate.halamanAwal],
            ["Halaman Isi",    activeTemplate.halamanIsi],
            ["Daftar Pustaka", activeTemplate.daftarPustakaGaya],
            ["Sitasi",         activeTemplate.sitasiGaya],
          ].map(([key, val]) => (
            <div key={key} className="flex justify-between items-center py-1.5 border-b border-slate-50">
              <span className="text-slate-500">{key}</span>
              <span className="font-medium text-slate-800 text-right">{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Links */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs text-slate-500 space-y-1.5">
        <p className="font-semibold text-slate-600">Referensi Pedoman:</p>
        <a href="https://unpam.ac.id" target="_blank" rel="noopener noreferrer"
           className="flex items-center gap-1 text-blue-600 hover:underline">
          <ExternalLink className="w-3 h-3" /> Pedoman Penulisan Skripsi FEB UNPAM
        </a>
        <p className="text-[11px] text-slate-400">
          Template dikonfigurasi berdasarkan pedoman resmi. Selalu verifikasi format dengan pembimbing Anda.
        </p>
      </div>
    </div>
  );
}
