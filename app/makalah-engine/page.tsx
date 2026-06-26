"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  Loader2,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import type {
  AssignmentAnalysis,
  EngineResult,
  MakalahDocument,
  MakalahEngineInput,
  MakalahGenerationMode,
  MakalahOutline,
  ReviewIssue,
} from "@/lib/makalah-engine";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

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
  targetHalaman: 12,
  pedoman: "",
  mode: "fast",
  assignmentAnalysis: null,
};

const fields: Array<{ key: keyof MakalahEngineInput; label: string; type?: "textarea" | "number"; placeholder?: string }> = [
  { key: "judul", label: "Judul makalah/proposal", placeholder: "Contoh: Proposal Mini Project Social Media Marketing" },
  { key: "namaKampus", label: "Nama kampus", placeholder: "Universitas Pamulang" },
  { key: "fakultas", label: "Fakultas", placeholder: "Fakultas Ekonomi dan Bisnis" },
  { key: "programStudi", label: "Program studi", placeholder: "Manajemen" },
  { key: "mataKuliah", label: "Mata kuliah", placeholder: "Social Media Marketing" },
  { key: "namaDosen", label: "Nama dosen", placeholder: "Nama dosen pengampu" },
  { key: "namaMahasiswa", label: "Nama mahasiswa/kelompok", type: "textarea", placeholder: "Andi Saputra\nBudi Santoso" },
  { key: "nim", label: "NIM", placeholder: "231011700000" },
  { key: "kelas", label: "Kelas", placeholder: "06SMJP001" },
  { key: "tema", label: "Tema/produk/studi kasus", type: "textarea", placeholder: "Produk, brand, atau studi kasus yang dipilih" },
  { key: "jumlahBab", label: "Jumlah bab", type: "number" },
  { key: "targetHalaman", label: "Target halaman", type: "number" },
  { key: "pedoman", label: "Catatan pedoman penulisan", type: "textarea", placeholder: "Format, rubrik, deadline, sitasi, atau catatan dosen" },
];

type AnalyzeResponse = {
  ok: boolean;
  analysis?: AssignmentAnalysis;
  error?: string;
  meta?: { fallback: boolean; model: string; extractedCharacters: number };
};

export default function MakalahEnginePage() {
  const [form, setForm] = useState<MakalahEngineInput>(initialForm);
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [userNotes, setUserNotes] = useState("");
  const [assignmentAnalysis, setAssignmentAnalysis] = useState<AssignmentAnalysis | null>(null);
  const [outline, setOutline] = useState<MakalahOutline | null>(null);
  const [document, setDocument] = useState<MakalahDocument | null>(null);
  const [status, setStatus] = useState<"idle" | "analyze" | "outline" | "generate" | "export">("idle");
  const [error, setError] = useState("");

  const isBusy = status !== "idle";
  const canGenerate = form.judul.trim().length > 2 && form.tema.trim().length > 2;
  const issueSummary = useMemo(() => summarizeIssues(document?.review.issues || []), [document]);

  function update<K extends keyof MakalahEngineInput>(key: K, value: MakalahEngineInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setMode(mode: MakalahGenerationMode) {
    setForm((prev) => ({
      ...prev,
      mode,
      targetHalaman: mode === "fast" ? Math.min(Math.max(prev.targetHalaman || 12, 12), 18) : Math.max(prev.targetHalaman || 25, 25),
    }));
  }

  function onFileChange(file: File | null) {
    setError("");
    if (!file) {
      setAssignmentFile(null);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Ukuran file maksimal 10MB.");
      setAssignmentFile(null);
      return;
    }
    setAssignmentFile(file);
  }

  async function handleAnalyzeAssignment() {
    if (!assignmentFile) {
      toast.error("Pilih file tugas dosen terlebih dahulu.");
      return;
    }

    setStatus("analyze");
    setError("");
    try {
      const payload = new FormData();
      payload.append("assignmentFile", assignmentFile);
      payload.append("userNotes", userNotes);
      const response = await fetch("/api/makalah-engine/analyze-assignment", { method: "POST", body: payload });
      const result = await response.json() as AnalyzeResponse;
      if (!response.ok || !result.ok || !result.analysis) throw new Error(result.error || "Gagal menganalisis tugas.");
      setAssignmentAnalysis(result.analysis);
      toast.success(result.meta?.fallback ? "Analisis fallback berhasil dibuat." : "Tugas dosen berhasil dianalisis.");
    } catch (err) {
      setError(messageOf(err));
      toast.error("Gagal menganalisis tugas.");
    } finally {
      setStatus("idle");
    }
  }

  function buildFormFromAnalysis(mode: MakalahGenerationMode = form.mode): MakalahEngineInput | null {
    if (!assignmentAnalysis) {
      toast.error("Analisis tugas belum tersedia.");
      return null;
    }
    const primary = assignmentAnalysis.requiredDeliverables.find((item) => item.type === "proposal" || item.type === "makalah")
      || assignmentAnalysis.requiredDeliverables[0];
    const target = primary?.estimatedPages || (mode === "fast" ? 15 : 28);
    const writingRules = compact([
      assignmentAnalysis.writingRules.font ? `Font: ${assignmentAnalysis.writingRules.font}` : "",
      assignmentAnalysis.writingRules.fontSize ? `Ukuran font: ${assignmentAnalysis.writingRules.fontSize}` : "",
      assignmentAnalysis.writingRules.spacing ? `Spasi: ${assignmentAnalysis.writingRules.spacing}` : "",
      assignmentAnalysis.writingRules.margin ? `Margin: ${assignmentAnalysis.writingRules.margin}` : "",
      assignmentAnalysis.writingRules.citationStyle ? `Sitasi: ${assignmentAnalysis.writingRules.citationStyle}` : "",
      assignmentAnalysis.writingRules.languageStyle ? `Gaya bahasa: ${assignmentAnalysis.writingRules.languageStyle}` : "",
      primary?.requiredSections.length ? `Bagian wajib: ${primary.requiredSections.join(", ")}` : "",
      assignmentAnalysis.deadline ? `Deadline: ${assignmentAnalysis.deadline}` : "",
    ]).join("\n");

    return {
      ...form,
      judul: form.judul || assignmentAnalysis.title,
      mataKuliah: form.mataKuliah || assignmentAnalysis.course || "",
      tema: form.tema || primary?.description || assignmentAnalysis.summaryForStudent,
      pedoman: compact([form.pedoman, writingRules, assignmentAnalysis.summaryForStudent]).join("\n\n"),
      jumlahBab: /proposal|mini project|social media marketing|clickora|custom clicker/i.test(`${assignmentAnalysis.title} ${primary?.description || ""}`) ? 7 : 5,
      targetHalaman: mode === "fast" ? Math.min(Math.max(target, 12), 18) : Math.min(Math.max(target, 25), 40),
      mode,
      assignmentAnalysis,
    };
  }

  function applyAnalysis(mode: MakalahGenerationMode = form.mode): MakalahEngineInput | null {
    const next = buildFormFromAnalysis(mode);
    if (!next) return null;
    setForm(next);
    setOutline(null);
    setDocument(null);
    toast.success("Hasil analisis dipakai untuk mengisi form.");
    return next;
  }

  async function handleOutline() {
    if (!canGenerate) {
      toast.error("Isi judul dan tema terlebih dahulu.");
      return;
    }

    setStatus("outline");
    setError("");
    try {
      const result = await postJson<EngineResult<MakalahOutline>>("/api/makalah-engine/outline", {
        input: { ...form, assignmentAnalysis },
        assignmentAnalysis,
        mode: form.mode,
      });
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

  async function handleGenerate(inputOverride?: MakalahEngineInput) {
    const input = inputOverride || form;
    if (input.judul.trim().length <= 2 || input.tema.trim().length <= 2) {
      toast.error("Isi judul dan tema terlebih dahulu.");
      return;
    }

    setStatus("generate");
    setError("");
    try {
      const result = await postJson<EngineResult<MakalahDocument>>("/api/makalah-engine/generate", {
        input: { ...input, assignmentAnalysis: input.assignmentAnalysis || assignmentAnalysis },
        outline,
        assignmentAnalysis: input.assignmentAnalysis || assignmentAnalysis,
        mode: input.mode,
      });
      setOutline(result.data.outline);
      setDocument(result.data);
      toast.success(result.data.review.passed ? "Dokumen selesai dan lolos review." : "Dokumen selesai dengan catatan reviewer.");
    } catch (err) {
      setError(messageOf(err));
      toast.error("Gagal generate dokumen.");
    } finally {
      setStatus("idle");
    }
  }

  async function handleExport() {
    if (!document) {
      toast.error("Generate dokumen terlebih dahulu.");
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
      anchor.download = `Makalah_${safeFileName(form.judul || "SmartCampus")}_${new Date().toISOString().slice(0, 10)}.docx`;
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
          <h1 className="mt-1 text-2xl font-extrabold text-slate-950">Academic Assignment Workspace</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Upload tugas dosen, ambil instruksi penting, lengkapi data, lalu generate DOCX akademik.
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

      <AssignmentUploadPanel
        file={assignmentFile}
        userNotes={userNotes}
        analyzing={status === "analyze"}
        onFileChange={onFileChange}
        onNotesChange={setUserNotes}
        onAnalyze={handleAnalyzeAssignment}
      />

      {assignmentAnalysis && (
        <AssignmentAnalysisPanel
          analysis={assignmentAnalysis}
          onApply={() => applyAnalysis()}
          onFastProposal={() => {
            const next = applyAnalysis("fast");
            if (next) void handleGenerate(next);
          }}
        />
      )}

      {document && (
        <div className="flex flex-col gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Dokumen selesai. Skor reviewer {document.review.score}/100. {document.generatedWith.fallback ? "Mode fallback aktif." : "Menggunakan AI."}</span>
          </div>
          {issueSummary && <span className="text-xs font-semibold">{issueSummary}</span>}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-violet-600" />
            <h2 className="text-sm font-bold text-slate-900">2. Lengkapi Data Mahasiswa</h2>
          </div>
          <ModeSelector mode={form.mode} onChange={setMode} />
          <div className="mt-4 grid gap-3">
            {fields.map((field) => (
              <FieldControl key={field.key} field={field} form={form} update={update} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <ChecklistPanel analysis={assignmentAnalysis} />
          <OutlinePanel outline={outline} />
          <DocumentPanel document={document} />
        </section>
      </div>
    </div>
  );
}

function AssignmentUploadPanel({
  file,
  userNotes,
  analyzing,
  onFileChange,
  onNotesChange,
  onAnalyze,
}: {
  file: File | null;
  userNotes: string;
  analyzing: boolean;
  onFileChange: (file: File | null) => void;
  onNotesChange: (value: string) => void;
  onAnalyze: () => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Upload className="h-4 w-4 text-violet-600" />
        <h2 className="text-sm font-bold text-slate-900">1. Upload Tugas Dosen</h2>
      </div>
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          onFileChange(event.dataTransfer.files.item(0));
        }}
        className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center"
      >
        <input
          id="assignment-file"
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          className="hidden"
          onChange={(event) => onFileChange(event.target.files?.item(0) || null)}
        />
        <label htmlFor="assignment-file" className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">
          <Upload className="h-4 w-4" />
          Pilih PDF/DOCX/TXT
        </label>
        <p className="mt-2 text-xs text-slate-500">Bisa drag/drop. Maksimal 10MB. File tidak disimpan permanen.</p>
        {file && <p className="mt-2 text-sm font-semibold text-slate-800">{file.name}</p>}
      </div>
      <textarea
        value={userNotes}
        onChange={(event) => onNotesChange(event.target.value)}
        rows={2}
        placeholder="Catatan opsional, misalnya: dosen minta proposal dikumpulkan besok."
        className="mt-3 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
      />
      <button
        onClick={onAnalyze}
        disabled={analyzing || !file}
        className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-violet-600 px-3 text-sm font-semibold text-white shadow-sm shadow-violet-100 hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
        Analisis Tugas
      </button>
    </section>
  );
}

function AssignmentAnalysisPanel({
  analysis,
  onApply,
  onFastProposal,
}: {
  analysis: AssignmentAnalysis;
  onApply: () => void;
  onFastProposal: () => void;
}) {
  return (
    <section className="rounded-lg border border-violet-200 bg-violet-50 p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-violet-700">Hasil Analisis Tugas</p>
          <h2 className="mt-1 text-lg font-extrabold text-slate-950">{analysis.title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-700">{analysis.summaryForStudent}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button onClick={onApply} className="h-9 rounded-lg border border-violet-200 bg-white px-3 text-sm font-semibold text-violet-700 hover:bg-violet-100">
            Gunakan Hasil Analisis
          </button>
          <button onClick={onFastProposal} className="h-9 rounded-lg bg-violet-600 px-3 text-sm font-semibold text-white hover:bg-violet-700">
            Generate Proposal Cepat
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <InfoList title="Yang harus dikumpulkan" items={analysis.requiredDeliverables.map((item) => `${item.name} (${item.priority}) - ${item.description}`)} />
        <InfoList title="Pedoman penulisan" items={compact([
          analysis.writingRules.font ? `Font ${analysis.writingRules.font}` : "",
          analysis.writingRules.fontSize ? `Ukuran ${analysis.writingRules.fontSize}` : "",
          analysis.writingRules.spacing ? `Spasi ${analysis.writingRules.spacing}` : "",
          analysis.writingRules.citationStyle ? `Sitasi ${analysis.writingRules.citationStyle}` : "",
          analysis.writingRules.languageStyle || "",
        ])} />
        <InfoList title="Rubrik penilaian" items={analysis.gradingRubric.map((item) => `${item.aspect}${item.weight ? ` (${item.weight})` : ""}${item.description ? ` - ${item.description}` : ""}`)} />
        <InfoList title="Informasi yang masih kurang" items={analysis.missingInfoQuestions} />
        <InfoList title="Suggested workflow" items={analysis.suggestedWorkflow.map((item) => `${item.step}. ${item.title} - ${item.description}`)} />
        <InfoList title="Timeline" items={analysis.timelineRequirements} />
      </div>
    </section>
  );
}

function ModeSelector({ mode, onChange }: { mode: MakalahGenerationMode; onChange: (mode: MakalahGenerationMode) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {[
        ["fast", "Mode Cepat", "Untuk deadline dekat, ringkas, langsung siap kumpul"],
        ["complete", "Mode Lengkap", "Lebih panjang, lebih detail, cocok untuk finalisasi"],
      ].map(([value, title, description]) => (
        <button
          key={value}
          onClick={() => onChange(value as MakalahGenerationMode)}
          className={`rounded-lg border p-3 text-left transition ${mode === value ? "border-violet-300 bg-violet-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}
        >
          <p className="text-sm font-bold text-slate-900">{title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </button>
      ))}
    </div>
  );
}

function ChecklistPanel({ analysis }: { analysis: AssignmentAnalysis | null }) {
  if (!analysis) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold text-slate-900">Checklist Deliverable</h2>
      <div className="mt-3 space-y-2">
        {analysis.requiredDeliverables.map((item) => (
          <div key={item.name} className="flex items-start gap-2 text-sm">
            <CheckCircle2 className={`mt-0.5 h-4 w-4 ${item.priority === "high" ? "text-violet-600" : "text-slate-400"}`} />
            <div>
              <p className="font-semibold text-slate-800">{item.name}</p>
              <p className="text-xs leading-5 text-slate-500">{item.description}</p>
            </div>
          </div>
        ))}
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
  if (field.key === "mode" || field.key === "assignmentAnalysis") return null;
  const value = form[field.key];
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600">{field.label}</span>
      {field.type === "textarea" ? (
        <textarea
          value={String(value)}
          onChange={(event) => update(field.key, event.target.value as never)}
          placeholder={field.placeholder}
          rows={field.key === "pedoman" ? 5 : 3}
          className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
        />
      ) : (
        <input
          value={String(value)}
          min={field.key === "jumlahBab" ? 5 : 5}
          max={field.key === "jumlahBab" ? 7 : 40}
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
        <p className="mt-2 text-sm text-slate-500">Outline akan tampil setelah Generate Outline atau Generate Makalah dijalankan.</p>
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
        Preview isi dokumen akan muncul di sini setelah generate.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-slate-900">Preview Dokumen</h2>
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
        <PreviewBlock title="Lampiran" text={document.lampiran.join("\n\n")} />
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

function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-violet-100 bg-white/75 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-violet-700">{title}</p>
      <div className="mt-2 space-y-1">
        {(items.length ? items : ["Belum terdeteksi dari instruksi."]).map((item) => (
          <p key={item} className="text-xs leading-5 text-slate-700">{item}</p>
        ))}
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
  return value.replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, "-").slice(0, 70) || "SmartCampus";
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Terjadi kesalahan tidak dikenal.";
}

function compact(values: string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean);
}
