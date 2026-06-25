"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
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
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Template Kampus</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Format dokumen sesuai pedoman penulisan skripsi</p>
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
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-300">
        Template yang dipilih mengatur format semua dokumen yang dieksport: margin, font, spasi, penomoran, sitasi, daftar pustaka, dan logo institusi.
      </div>

      {/* Active template hero card */}
      <div
        className="rounded-2xl border-2 overflow-hidden shadow-sm"
        style={{ borderColor: activeTemplate.primaryColor }}
      >
        {/* Color band */}
        <div
          className="h-2"
          style={{ background: `linear-gradient(90deg, ${activeTemplate.primaryColor}, ${activeTemplate.secondaryColor})` }}
        />
        <div className="bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="w-16 h-16 rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
              <Image
                src={activeTemplate.logo}
                alt={`Logo ${activeTemplate.nama}`}
                width={64}
                height={64}
                className="object-contain w-14 h-14"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/logo-unpam.png"; }}
              />
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-slate-800 dark:text-slate-100">{activeTemplate.nama}</h2>
                <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-semibold">
                  ✓ Aktif
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{activeTemplate.namaFakultas}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Program Studi {activeTemplate.programStudi}</p>
            </div>
            {/* Color swatches */}
            <div className="flex flex-col gap-1.5 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-white shadow-sm" style={{ background: activeTemplate.primaryColor }} />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{activeTemplate.primaryColor}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-white shadow-sm" style={{ background: activeTemplate.secondaryColor }} />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{activeTemplate.secondaryColor}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Template selector */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">Pilih Template Kampus</h2>
        <div className="space-y-2">
          {TEMPLATE_OPTIONS.map((opt) => {
            const isSelected = settings.template === opt.id;
            const isAvailable = opt.available;
            const tpl = TEMPLATE_REGISTRY[opt.id];
            return (
              <button
                key={opt.id}
                onClick={() => isAvailable && handleSelect(opt.id)}
                disabled={!isAvailable}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all text-left
                  ${isSelected   ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-600"
                  : isAvailable  ? "border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  : "border-slate-100 dark:border-slate-800 opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50"}`}
              >
                <div className="flex items-center gap-3">
                  {tpl && (
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 flex items-center justify-center overflow-hidden shrink-0">
                      <Image
                        src={tpl.logo}
                        alt={tpl.nama}
                        width={32}
                        height={32}
                        className="object-contain w-7 h-7"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/logo-unpam.png"; }}
                      />
                    </div>
                  )}
                  <div>
                    <p className={`text-sm font-semibold ${isSelected ? "text-blue-800 dark:text-blue-200" : "text-slate-700 dark:text-slate-200"}`}>
                      {opt.label}
                    </p>
                    {!isAvailable && (
                      <p className="text-xs text-slate-400 mt-0.5">Segera hadir</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {tpl && (
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ background: tpl.primaryColor }} />
                      <div className="w-3 h-3 rounded-full" style={{ background: tpl.secondaryColor }} />
                    </div>
                  )}
                  {isSelected && <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                  {!isAvailable && (
                    <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">Coming Soon</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active template detail */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">
          Konfigurasi Aktif — {activeTemplate.nama}
        </h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ["Kampus",         activeTemplate.nama],
            ["Fakultas",       activeTemplate.namaFakultas],
            ["Program Studi",  activeTemplate.programStudi],
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
            <div key={key} className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">{key}</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 text-right">{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Links */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
        <p className="font-semibold text-slate-600 dark:text-slate-300">Referensi Pedoman:</p>
        <a href="https://unpam.ac.id" target="_blank" rel="noopener noreferrer"
           className="flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400">
          <ExternalLink className="w-3 h-3" /> Pedoman Penulisan Skripsi FEB UNPAM
        </a>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          Template dikonfigurasi berdasarkan pedoman resmi. Selalu verifikasi format dengan pembimbing Anda.
        </p>
      </div>
    </div>
  );
}
