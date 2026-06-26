"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Download, FileText, Loader2, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  buildDynamicFormSchema,
  type AssignmentAnalysis,
  type DynamicField,
  type DynamicFormSchema,
  type EngineResult,
  type MakalahDocument,
  type MakalahEngineInput,
  type MakalahGenerationMode,
  type MakalahOutline,
  type ReviewIssue,
} from "@/lib/makalah-engine";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const emptyInput: MakalahEngineInput = {
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
  dynamicValues: {},
};

type AnalyzeResponse = {
  ok: boolean;
  analysis?: AssignmentAnalysis;
  error?: string;
  meta?: { fallback: boolean; model: string; extractedCharacters: number };
};

export default function MakalahEnginePage() {
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [userNotes, setUserNotes] = useState("");
  const [assignmentAnalysis, setAssignmentAnalysis] = useState<AssignmentAnalysis | null>(null);
  const [formSchema, setFormSchema] = useState<DynamicFormSchema | null>(null);
  const [dynamicValues, setDynamicValues] = useState<Record<string, string>>({});
  const [outline, setOutline] = useState<MakalahOutline | null>(null);
  const [document, setDocument] = useState<MakalahDocument | null>(null);
  const [status, setStatus] = useState<"idle" | "analyze" | "generate" | "export">("idle");
  const [error, setError] = useState("");

  const isBusy = status !== "idle";
  const missingRequired = useMemo(() => getMissingRequired(formSchema, dynamicValues), [formSchema, dynamicValues]);
  const canGenerate = Boolean(assignmentAnalysis && formSchema && missingRequired.length === 0 && !isBusy);
  const smartDefaults = useMemo(() => assignmentAnalysis ? getSmartDefaults(assignmentAnalysis) : { mode: "fast" as MakalahGenerationMode, jumlahBab: 5, targetHalaman: 12 }, [assignmentAnalysis]);
  const issueSummary = useMemo(() => summarizeIssues(document?.review.issues || []), [document]);

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
    setAssignmentAnalysis(null);
    setFormSchema(null);
    setDynamicValues({});
    setOutline(null);
    setDocument(null);
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
      if (!response.ok || !result.ok || !result.analysis) throw new Error(result.error || "Gagal memahami tugas.");

      const schema = buildDynamicFormSchema(result.analysis);
      setAssignmentAnalysis(result.analysis);
      setFormSchema(schema);
      setDynamicValues(buildInitialValues(schema));
      setOutline(null);
      setDocument(null);
      toast.success("Saya sudah memahami tugas Anda.");
    } catch (err) {
      setError(messageOf(err));
      toast.error("Gagal memahami tugas.");
    } finally {
      setStatus("idle");
    }
  }

  async function handleGenerate() {
    if (!assignmentAnalysis || !formSchema) {
      toast.error("Upload dan analisis tugas terlebih dahulu.");
      return;
    }
    if (missingRequired.length > 0) {
      toast.error(`Lengkapi dulu: ${missingRequired.join(", ")}`);
      return;
    }

    const input = buildInputFromDynamic(assignmentAnalysis, dynamicValues, smartDefaults);
    setStatus("generate");
    setError("");
    try {
      const result = await postJson<EngineResult<MakalahDocument>>("/api/makalah-engine/generate", {
        input,
        assignmentAnalysis,
        mode: input.mode,
      });
      setOutline(result.data.outline);
      setDocument(result.data);
      toast.success(result.data.review.passed ? "Proposal selesai dan siap diexport." : "Proposal selesai dengan catatan reviewer.");
    } catch (err) {
      setError(messageOf(err));
      toast.error("Gagal generate proposal.");
    } finally {
      setStatus("idle");
    }
  }

  async function handleExport() {
    if (!document) {
      toast.error("Generate proposal terlebih dahulu.");
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
      anchor.download = `Makalah_${safeFileName(document.input.judul || "SmartCampus")}_${new Date().toISOString().slice(0, 10)}.docx`;
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
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-xs font-bold uppercase tracking-wide text-violet-700">SmartCampus V3</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-950">Dynamic Assignment Workspace</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Upload tugas dosen. SmartCampus memahami instruksi, menanyakan data yang kurang, lalu membuat DOCX.
        </p>
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

      {assignmentAnalysis && formSchema && (
        <>
          <UnderstoodCard analysis={assignmentAnalysis} defaults={smartDefaults} />
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-900">{formSchema.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{formSchema.description}</p>
            </div>
            <DynamicForm schema={formSchema} values={dynamicValues} onChange={setDynamicValues} />
            {missingRequired.length > 0 && (
              <p className="mt-3 text-xs text-amber-700">Belum lengkap: {missingRequired.join(", ")}</p>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm shadow-violet-100 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === "generate" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate Proposal
              </button>
              <button
                onClick={handleExport}
                disabled={status === "export" || !document}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === "export" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Export DOCX
              </button>
            </div>
          </section>
        </>
      )}

      {document && (
        <div className="flex flex-col gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Proposal selesai. Skor reviewer {document.review.score}/100. {document.generatedWith.fallback ? "Mode fallback aktif." : "Menggunakan AI."}</span>
          </div>
          {issueSummary && <span className="text-xs font-semibold">{issueSummary}</span>}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <OutlinePanel outline={outline} />
        <DocumentPanel document={document} />
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
        <h2 className="text-sm font-bold text-slate-900">Upload Tugas Dosen</h2>
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
        <p className="mt-2 text-xs text-slate-500">Maksimal 10MB. File hanya dipakai untuk request ini.</p>
        {file && <p className="mt-2 text-sm font-semibold text-slate-800">{file.name}</p>}
      </div>
      <textarea
        value={userNotes}
        onChange={(event) => onNotesChange(event.target.value)}
        rows={2}
        placeholder="Catatan opsional, misalnya: deadline besok atau dosen minta format tertentu."
        className="mt-3 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
      />
      <button
        onClick={onAnalyze}
        disabled={analyzing || !file}
        className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-violet-600 px-3 text-sm font-semibold text-white shadow-sm shadow-violet-100 hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
        Pahami Tugas
      </button>
    </section>
  );
}

function UnderstoodCard({
  analysis,
  defaults,
}: {
  analysis: AssignmentAnalysis;
  defaults: { mode: MakalahGenerationMode; jumlahBab: number; targetHalaman: number };
}) {
  const primary = getPrimaryDeliverable(analysis);
  return (
    <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-extrabold text-slate-950">Saya sudah memahami tugas Anda.</h2>
          <div className="mt-3 grid gap-3 text-sm md:grid-cols-4">
            <SummaryItem label="Yang harus dikumpulkan" value={primary?.name || analysis.title} />
            <SummaryItem label="Deadline" value={analysis.deadline || inferDeadline(analysis)} />
            <SummaryItem label="Status" value="Siap dibuat" />
            <SummaryItem label="Smart default" value={`${defaults.jumlahBab} BAB, ${defaults.targetHalaman} halaman, ${defaults.mode === "complete" ? "Lengkap" : "Cepat"}`} />
          </div>
        </div>
      </div>
    </section>
  );
}

function DynamicForm({
  schema,
  values,
  onChange,
}: {
  schema: DynamicFormSchema;
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}) {
  function update(id: string, value: string) {
    onChange({ ...values, [id]: value });
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {schema.fields.map((field) => (
        <DynamicFieldControl key={field.id} field={field} value={values[field.id] || ""} onChange={(value) => update(field.id, value)} />
      ))}
    </div>
  );
}

function DynamicFieldControl({ field, value, onChange }: { field: DynamicField; value: string; onChange: (value: string) => void }) {
  const label = `${field.label}${field.required ? " *" : ""}`;
  const className = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

  return (
    <label className={field.type === "textarea" ? "block md:col-span-2" : "block"}>
      <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
      {field.type === "textarea" ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} placeholder={field.placeholder} className={`${className} resize-none`} />
      ) : field.type === "image" ? (
        <input
          type="file"
          accept="image/*"
          onChange={(event) => onChange(event.target.files?.item(0)?.name || "")}
          className={className}
        />
      ) : field.type === "select" ? (
        <select value={value} onChange={(event) => onChange(event.target.value)} className={className}>
          <option value="">{field.placeholder}</option>
          {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder} className={className} />
      )}
    </label>
  );
}

function OutlinePanel({ outline }: { outline: MakalahOutline | null }) {
  if (!outline) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold text-slate-900">Planner</h2>
      <div className="mt-3 space-y-2">
        {outline.chapters.map((chapter) => (
          <div key={chapter.id} className="rounded-lg bg-slate-50 p-3">
            <p className="text-sm font-bold text-slate-800">{chapter.number} {chapter.title}</p>
            <p className="mt-1 text-xs text-slate-500">{chapter.subsections.map((subsection) => subsection.title).join(", ")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocumentPanel({ document }: { document: MakalahDocument | null }) {
  if (!document) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold text-slate-900">Preview Singkat</h2>
      <div className="mt-3 max-h-[520px] space-y-4 overflow-y-auto pr-2">
        <PreviewBlock title="Kata Pengantar" text={document.kataPengantar} />
        {document.chapters.slice(0, 2).map((chapter) => (
          <PreviewBlock key={chapter.id} title={`${chapter.number} ${chapter.title}`} text={chapter.subsections[0]?.content || ""} />
        ))}
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

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{label}</p>
      <p className="mt-1 font-bold text-slate-900">{value}</p>
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

function buildInitialValues(schema: DynamicFormSchema): Record<string, string> {
  return Object.fromEntries(schema.fields.map((field) => [field.id, field.defaultValue || ""]));
}

function getMissingRequired(schema: DynamicFormSchema | null, values: Record<string, string>): string[] {
  if (!schema) return [];
  return schema.fields.filter((field) => field.required && !values[field.id]?.trim()).map((field) => field.label);
}

function buildInputFromDynamic(
  analysis: AssignmentAnalysis,
  values: Record<string, string>,
  defaults: { mode: MakalahGenerationMode; jumlahBab: number; targetHalaman: number }
): MakalahEngineInput {
  const primary = getPrimaryDeliverable(analysis);
  const brand = values.brandName || values.businessName || "";
  const product = values.productName || "";
  const topic = compact([
    product ? `Produk: ${product}` : "",
    brand ? `Brand: ${brand}` : "",
    values.tagline ? `Tagline: ${values.tagline}` : "",
    values.socialPlatforms ? `Platform: ${values.socialPlatforms}` : "",
    values.productDescription,
    values.targetMarket ? `Target market: ${values.targetMarket}` : "",
    values.requiredContent,
    values.topic,
  ]).join("\n");

  return {
    ...emptyInput,
    judul: values.title || values.researchTitle || (brand ? `Proposal Mini Project Social Media Marketing ${brand}` : analysis.title),
    namaKampus: values.campusName || "",
    fakultas: values.faculty || "",
    programStudi: values.studyProgram || "",
    mataKuliah: analysis.course || "",
    namaDosen: values.lecturerName || "",
    namaMahasiswa: values.members || values.studentName || values.groupName || "",
    nim: values.nim || "",
    kelas: values.className || "",
    tema: topic || primary?.description || analysis.summaryForStudent,
    pedoman: buildPedoman(analysis),
    jumlahBab: defaults.jumlahBab,
    targetHalaman: defaults.targetHalaman,
    mode: defaults.mode,
    assignmentAnalysis: analysis,
    dynamicValues: values,
  };
}

function buildPedoman(analysis: AssignmentAnalysis): string {
  const rules = analysis.writingRules;
  return compact([
    rules.font ? `Font: ${rules.font}` : "",
    rules.fontSize ? `Ukuran font: ${rules.fontSize}` : "",
    rules.spacing ? `Spasi: ${rules.spacing}` : "",
    rules.margin ? `Margin: ${rules.margin}` : "",
    rules.citationStyle ? `Sitasi: ${rules.citationStyle}` : "",
    rules.languageStyle ? `Gaya bahasa: ${rules.languageStyle}` : "",
    analysis.deadline ? `Deadline: ${analysis.deadline}` : "",
  ]).join("\n");
}

function getSmartDefaults(analysis: AssignmentAnalysis): { mode: MakalahGenerationMode; jumlahBab: number; targetHalaman: number } {
  const text = [analysis.title, analysis.course, analysis.summaryForStudent].join(" ").toLowerCase();
  if (/proposal|mini project|social media marketing/.test(text)) {
    return { mode: "complete", jumlahBab: 7, targetHalaman: 20 };
  }
  return { mode: "fast", jumlahBab: 5, targetHalaman: analysis.requiredDeliverables[0]?.estimatedPages || 12 };
}

function getPrimaryDeliverable(analysis: AssignmentAnalysis) {
  return analysis.requiredDeliverables.find((item) => item.priority === "high")
    || analysis.requiredDeliverables.find((item) => item.type === "proposal" || item.type === "makalah")
    || analysis.requiredDeliverables[0];
}

function inferDeadline(analysis: AssignmentAnalysis): string {
  const text = [analysis.deadline, ...analysis.timelineRequirements, analysis.summaryForStudent].join(" ").toLowerCase();
  if (text.includes("besok")) return "Besok";
  if (analysis.deadline) return analysis.deadline;
  return "Tidak disebutkan";
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

function compact(values: Array<string | undefined>): string[] {
  return values.map((value) => value?.trim() || "").filter(Boolean);
}
