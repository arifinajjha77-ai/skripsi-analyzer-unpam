"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { loadSettings, saveSettings, defaultSettings, type AppSettings } from "@/lib/settingsStore";

const FIELD_GROUPS = [
  {
    label: "Identitas Mahasiswa",
    fields: [
      { key: "namaKampus",      label: "Nama Kampus",         type: "text", placeholder: "Universitas Pamulang" },
      { key: "programStudi",    label: "Program Studi",       type: "text", placeholder: "Manajemen" },
      { key: "namaMahasiswa",   label: "Nama Mahasiswa",      type: "text", placeholder: "Nama lengkap" },
      { key: "npm",             label: "NPM",                 type: "text", placeholder: "201010....." },
      { key: "tahunAjaran",     label: "Tahun Ajaran",        type: "text", placeholder: "2024/2025" },
    ],
  },
  {
    label: "Pembimbing",
    fields: [
      { key: "namaPembimbing",   label: "Nama Pembimbing 1",  type: "text", placeholder: "Dr. ..." },
      { key: "namaKoPembimbing", label: "Nama Pembimbing 2",  type: "text", placeholder: "Dr. ..." },
    ],
  },
  {
    label: "Format Dokumen Export",
    fields: [
      {
        key: "margin", label: "Margin (cm)", type: "select",
        options: ["4-3-3-3", "3-3-3-3", "4-4-3-3"],
      },
      {
        key: "font", label: "Font", type: "select",
        options: ["Times New Roman", "Arial", "Calibri"],
      },
      {
        key: "spasi", label: "Spasi", type: "select",
        options: ["1.0", "1.5", "2.0"],
      },
    ],
  },
] as const;

type FieldKey = keyof AppSettings;

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const handleChange = useCallback((key: FieldKey, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }, []);

  const handleSave = useCallback(() => {
    saveSettings(settings);
    setSaved(true);
    toast.success("Pengaturan berhasil disimpan");
    setTimeout(() => setSaved(false), 2000);
  }, [settings]);

  const handleReset = useCallback(() => {
    setSettings(defaultSettings);
    saveSettings(defaultSettings);
    toast.info("Pengaturan direset ke default");
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <Settings className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Pengaturan</h1>
            <p className="text-sm text-slate-500">Konfigurasi identitas dan format dokumen</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            <Save className="w-3.5 h-3.5" />
            {saved ? "Tersimpan ✓" : "Simpan"}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        Pengaturan ini digunakan secara otomatis saat export DOCX (kuesioner, BAB I, operasional variabel, dll).
        Data disimpan di browser (localStorage).
      </div>

      {/* Form groups */}
      {FIELD_GROUPS.map((group) => (
        <div key={group.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">{group.label}</h2>
          {group.fields.map((field) => {
            const key = field.key as FieldKey;
            const val = (settings[key] as string) ?? "";
            return (
              <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-sm font-medium text-slate-600 sm:w-44 shrink-0">
                  {field.label}
                </label>
                {"options" in field ? (
                  <select
                    value={val}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={"placeholder" in field ? field.placeholder : ""}
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-700 mb-3">Preview Header Dokumen</h2>
        <div className="bg-slate-50 rounded-xl p-4 text-center text-sm space-y-1 text-slate-600 border border-slate-200">
          <p className="font-bold text-base text-slate-800 uppercase">{settings.namaKampus || "Nama Kampus"}</p>
          <p>Fakultas Ekonomi dan Bisnis — {settings.programStudi || "Program Studi"}</p>
          <p className="text-xs text-slate-400 mt-2">
            Nama: {settings.namaMahasiswa || "—"} · NPM: {settings.npm || "—"}
          </p>
          <p className="text-xs text-slate-400">
            Pembimbing: {settings.namaPembimbing || "—"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Font: {settings.font} · Spasi: {settings.spasi} · Margin: {settings.margin}
          </p>
        </div>
      </div>
    </div>
  );
}
