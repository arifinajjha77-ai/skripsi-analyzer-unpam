"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Download, FileText, Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import type { EngineResult, MakalahDocument, MakalahEngineInput, MakalahOutline, ReviewIssue } from "@/lib/makalah-engine";

const initialForm: MakalahEngineInput = {
  judul: "",
  namaKampus: "",
  fakultas: "",
  programStudi: "",
  mataKuliah: "",
  namaDosen: "",
  namaMahasiswa: "",
  nim: "",
  kelas: "",
  tema: "",
  jumlahBab: 5,
  targetHalaman: 10,
  pedoman: "",
};

const fields: Array<{ key: keyof MakalahEngineInput; label: string; type?: "textarea" | "number"; placeholder?: string }> = [
  { key: "judul", label: "Judul makalah", placeholder: "Contoh: Strategi Pemasaran Digital pada UMKM Kuliner" },
  { key: "namaKampus", label: "Nama kampus", placeholder: "Universitas Pamulang" },
  { key: "fakultas", label: "Fakultas", placeholder: "Fakultas Ekonomi dan Bisnis" },
  { key: "programStudi", label: "Program studi", placeholder: "Manajemen" },
  { key: "mataKuliah", label: "Mata kuliah", placeholder: "Manajemen Pemasaran" },
  { key: "namaDosen", label: "Nama dosen", placeholder: "Nama dosen pengampu" },
  { key: "namaMahasiswa", label: "Nama mahasiswa/kelompok", type: "textarea", placeholder: "Andi Saputra\nBudi Santoso" },
  { key: "nim", label: "NIM", placeholder: "231011700000" },
  { key: "kelas", label: "Kelas", placeholder: "06SMJP001" },
  { key: "tema", label: "Tema/produk/studi kasus", type: "textarea", placeholder: "Objek, produk, atau kasus yang ingin dianalisis" },
  { key: "jumlahBab", label: "Jumlah bab", type: "number" },
  { key: "targetHalaman", label: "Target halaman", type: "number" },
  { key: "pedoman", label: "Catatan pedoman penulisan", type: "textarea", placeholder: "Contoh: gunakan bahasa formal, minimal 5 referensi, format kampus..." },
];

export default function MakalahEnginePage() {
  const [form, setForm] = useState<MakalahEngineInput>(initialForm);
  const [outline, setOutline] = useState<MakalahOutline | null>(null);
  const [document, setDocument] = useState<MakalahDocument | null>(null);
  const [status, setStatus] = useState<"idle" | "outline" | "generate" | "export">("idle");
  const [error, setError] = useState("");

  const isBusy = status !== "idle";
  const canGenerate = form.judul.trim().length > 2 && form.tema.trim().length > 2;
  const issueSummary = useMemo(() => summarizeIssues(document?.review.issues || []), [document]);

  function update<K extends keyof MakalahEngineInput>(key: K, value: MakalahEngineInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleOutline() {
    if (!canGenerate) {
      toast.error("Isi judul dan tema terlebih dahulu.");
      return;
    }

    setStatus("outline");
    setError("");
    try {
      const result = await postJson<EngineResult<MakalahOutline>>("/api/makalah-engine/outline", form);
      setOutline(result.data);
      setDocument(null);
      toast.success(result.meta.fallback ? "Outline fallback berhasil dibuat." : "Outline AI berhasil dibuat.");
    } catch (err) {
      setError(messageOf(err));
      toast.error("Gagal membuat outline.");
    } finally {
      setStatus("idle");
    }
  }

  async function handleGenerate() {
    if (!canGenerate) {
      toast.error("Isi judul dan tema terlebih dahulu.");
      return;
    }

    setStatus("generate");
    setError("");
    try {
      const result = await postJson<EngineResult<MakalahDocument>>("/api/makalah-engine/generate", { input: form, outline });
      setOutline(result.data.outline);
      setDocument(result.data);
      toast.success(result.data.review.passed ? "Makalah selesai dan lolos review." : "Makalah selesai dengan catatan reviewer.");
    } catch (err) {
      setError(messageOf(err));
      toast.error("Gagal generate makalah.");
    } finally {
      setStatus("idle");
    }
  }

  async function handleExport() {
    if (!document) {
      toast.error("Generate makalah terlebih dahulu.");
      return;
    }

    setStatus("export");
    setError("");
    try {
      const response = await fetch("/api/makalah-engine/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(document),
      });
      if (!response.ok) throw new Error(await response.text());

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = `${safeFileName(form.judul || "Makalah-SmartCampus")}.docx`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("DOCX berhasil diunduh.");
    } catch (err) {
      setError(messageOf(err));
      toast.error("Gagal export DOCX.");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-violet-700">MakalahEngine V2</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-950">Generator Makalah Akademik</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Buat outline, generate isi per BAB, review struktur, lalu export DOCX siap edit.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton disabled={isBusy || !canGenerate} active={status === "outline"} onClick={handleOutline} icon="outline">
            Generate Outline
          </ActionButton>
          <ActionButton disabled={isBusy || !canGenerate} active={status === "generate"} onClick={handleGenerate} icon="generate">
            Generate Makalah
          </ActionButton>
          <ActionButton disabled={isBusy || !document} active={status === "export"} onClick={handleExport} icon="export">
            Export DOCX
          </ActionButton>
        </div>
      </header>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {document && (
        <div className="flex flex-col gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Makalah selesai. Skor reviewer {document.review.score}/100. {document.generatedWith.fallback ? "Mode fallback aktif." : "Menggunakan AI."}</span>
          </div>
          {issueSummary && <span className="text-xs font-semibold">{issueSummary}</span>}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-violet-600" />
            <h2 className="text-sm font-bold text-slate-900">Input Makalah</h2>
          </div>
          <div className="grid gap-3">
            {fields.map((field) => (
              <FieldControl key={field.key} field={field} form={form} update={update} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <OutlinePanel outline={outline} />
          <DocumentPanel document={document} />
        </section>
      </div>
    </div>
  );
}

function FieldControl({
  field,
  form,
  update,
}: {
  field: (typeof fields)[number];
  form: MakalahEngineInput;
  update: <K extends keyof MakalahEngineInput>(key: K, value: MakalahEngineInput[K]) => void;
}) {
  const value = form[field.key];
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600">{field.label}</span>
      {field.type === "textarea" ? (
        <textarea
          value={String(value)}
          onChange={(event) => update(field.key, event.target.value as never)}
          placeholder={field.placeholder}
          rows={field.key === "pedoman" ? 4 : 3}
          className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
        />
      ) : (
        <input
          value={String(value)}
          min={field.key === "jumlahBab" ? 5 : 5}
          max={field.key === "jumlahBab" ? 5 : 30}
          type={field.type || "text"}
          onChange={(event) => update(field.key, (field.type === "number" ? Number(event.target.value) : event.target.value) as never)}
          placeholder={field.placeholder}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
        />
      )}
    </label>
  );
}

function ActionButton({
  children,
  disabled,
  active,
  onClick,
  icon,
}: {
  children: React.ReactNode;
  disabled: boolean;
  active: boolean;
  onClick: () => void;
  icon: "outline" | "generate" | "export";
}) {
  const Icon = icon === "outline" ? Wand2 : icon === "generate" ? Sparkles : Download;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-9 items-center gap-2 rounded-lg bg-violet-600 px-3 text-sm font-semibold text-white shadow-sm shadow-violet-100 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {active ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

function OutlinePanel({ outline }: { outline: MakalahOutline | null }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold text-slate-900">Outline</h2>
      {!outline ? (
        <p className="mt-2 text-sm text-slate-500">Outline akan tampil setelah tombol Generate Outline atau Generate Makalah dijalankan.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {outline.chapters.map((chapter) => (
            <div key={chapter.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p className="text-sm font-bold text-slate-800">{chapter.number} {chapter.title}</p>
              <p className="mt-1 text-xs text-slate-500">{chapter.purpose}</p>
              <div className="mt-2 grid gap-1">
                {chapter.subsections.map((subsection) => (
                  <p key={subsection.id} className="text-xs text-slate-700">{subsection.id} {subsection.title}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentPanel({ document }: { document: MakalahDocument | null }) {
  if (!document) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
        Preview isi makalah akan muncul di sini setelah generate.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-slate-900">Preview Makalah</h2>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
          {document.chapters.length} BAB
        </span>
      </div>
      <div className="mt-4 max-h-[720px] space-y-5 overflow-y-auto pr-2">
        <PreviewBlock title="Kata Pengantar" text={document.kataPengantar} />
        {document.chapters.map((chapter) => (
          <div key={chapter.id} className="space-y-3">
            <h3 className="text-base font-black text-slate-900">{chapter.number} {chapter.title}</h3>
            {chapter.subsections.map((subsection) => (
              <PreviewBlock key={subsection.id} title={`${subsection.id} ${subsection.title}`} text={subsection.content} />
            ))}
          </div>
        ))}
        <PreviewBlock title="Daftar Pustaka" text={document.daftarPustaka.join("\n\n")} />
        {document.review.issues.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm font-bold text-amber-900">Catatan Reviewer</p>
            <div className="mt-2 space-y-1">
              {document.review.issues.map((issue, index) => (
                <p key={`${issue.type}-${index}`} className="text-xs text-amber-800">
                  {issue.location ? `${issue.location}: ` : ""}{issue.message}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewBlock({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h4 className="text-sm font-bold text-slate-800">{title}</h4>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-slate-600">{text}</p>
    </div>
  );
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<T>;
}

function summarizeIssues(issues: ReviewIssue[]): string {
  if (issues.length === 0) return "";
  const errors = issues.filter((issue) => issue.severity === "error").length;
  const warnings = issues.filter((issue) => issue.severity === "warning").length;
  return `${errors} error, ${warnings} warning`;
}

function safeFileName(value: string): string {
  return value.replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, "-").slice(0, 70) || "Makalah-SmartCampus";
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Terjadi kesalahan tidak dikenal.";
}
