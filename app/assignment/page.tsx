"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Download, FileQuestion, FileText, Loader2, Send, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { analyzeAssignmentAction, exportAssignmentAction, generateAssignmentAction } from "./actions";
import type { AssignmentAcademicSection, AssignmentAnalysis, AssignmentAnswers, AssignmentQuestion, AssignmentReport, AssignmentWorkspaceState } from "@/lib/assignment/types";
import { getCurrentQuestion, getNextStateAfterAnswers, getQuestionProgress } from "@/lib/assignment/questionEngine";
import { mergeAnswer } from "@/lib/assignment/missingData";

const STORAGE_KEY = "smartcampus.assignment.workspace.v1";

type PersistedWorkspace = {
  state: AssignmentWorkspaceState;
  userNotes: string;
  analysis: AssignmentAnalysis | null;
  answers: AssignmentAnswers;
  currentAnswer: string;
  report: AssignmentReport | null;
  meta: { model: string; fallback: boolean; extractedCharacters: number } | null;
};

export default function AssignmentWorkspacePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [state, setState] = useState<AssignmentWorkspaceState>("UPLOAD");
  const [file, setFile] = useState<File | null>(null);
  const [userNotes, setUserNotes] = useState("");
  const [analysis, setAnalysis] = useState<AssignmentAnalysis | null>(null);
  const [answers, setAnswers] = useState<AssignmentAnswers>({});
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [report, setReport] = useState<AssignmentReport | null>(null);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState<{ model: string; fallback: boolean; extractedCharacters: number } | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentQuestion = useMemo(() => analysis ? getCurrentQuestion(analysis, answers) : null, [analysis, answers]);
  const progress = useMemo(() => analysis ? getQuestionProgress(analysis, answers) : { answered: 0, total: 0, remaining: 0 }, [analysis, answers]);
  const canGenerate = Boolean(analysis && state === "READY_TO_GENERATE" && !isPending);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as PersistedWorkspace;
      setState(saved.state === "ANALYZE" || saved.state === "GENERATING" ? "READY_TO_GENERATE" : saved.state);
      setUserNotes(saved.userNotes || "");
      setAnalysis(saved.analysis);
      setAnswers(saved.answers || {});
      setCurrentAnswer(saved.currentAnswer || "");
      setReport(saved.report);
      setMeta(saved.meta);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const payload: PersistedWorkspace = { state, userNotes, analysis, answers, currentAnswer, report, meta };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [state, userNotes, analysis, answers, currentAnswer, report, meta]);

  function resetForFile(nextFile: File | null) {
    setFile(nextFile);
    setState("UPLOAD");
    setAnalysis(null);
    setAnswers({});
    setCurrentAnswer("");
    setReport(null);
    setMeta(null);
    setError("");
    window.localStorage.removeItem(STORAGE_KEY);
  }

  function analyze() {
    if (!file) {
      toast.error("Pilih file tugas dosen terlebih dahulu.");
      return;
    }

    const formData = new FormData();
    formData.append("assignmentFile", file);
    formData.append("userNotes", userNotes);
    setState("ANALYZE");
    setError("");

    startTransition(async () => {
      const result = await analyzeAssignmentAction(formData);
      if (!result.ok) {
        setState("UPLOAD");
        setError(result.error);
        toast.error("Gagal memahami tugas.");
        return;
      }

      setAnalysis(result.data.analysis);
      setAnswers({});
      setCurrentAnswer("");
      setReport(null);
      setMeta({
        model: result.data.model,
        fallback: result.data.fallback,
        extractedCharacters: result.data.extractedText.length,
      });
      setState(result.data.state);
      toast.success("Tugas berhasil dipahami.");
    });
  }

  function submitAnswer() {
    if (!analysis || !currentQuestion) return;
    if (currentQuestion.required && !currentAnswer.trim()) {
      toast.error("Jawaban ini wajib diisi.");
      return;
    }

    const nextAnswers = mergeAnswer(answers, currentQuestion.id, currentAnswer || "-");
    setAnswers(nextAnswers);
    setCurrentAnswer("");
    setState(getNextStateAfterAnswers(analysis, nextAnswers));
  }

  function skipOptional() {
    if (!analysis || !currentQuestion || currentQuestion.required) return;
    const nextAnswers = mergeAnswer(answers, currentQuestion.id, "-");
    setAnswers(nextAnswers);
    setCurrentAnswer("");
    setState(getNextStateAfterAnswers(analysis, nextAnswers));
  }

  function generate() {
    if (!analysis) return;
    setState("GENERATING");
    setError("");

    startTransition(async () => {
      const result = await generateAssignmentAction({ analysis, answers, optionalNotes: userNotes });
      if (!result.ok) {
        setState("READY_TO_GENERATE");
        setError(result.error);
        toast.error("Gagal generate laporan.");
        return;
      }

      setReport(result.data);
      setState("DONE");
      toast.success("Proposal/laporan selesai.");
    });
  }

  function exportDocx() {
    if (!report) return;
    startTransition(async () => {
      const result = await exportAssignmentAction({ report });
      if (!result.ok) {
        setError(result.error);
        toast.error("Gagal export DOCX.");
        return;
      }

      downloadBase64(result.data.base64, result.data.mimeType, result.data.fileName);
      toast.success("DOCX berhasil diunduh.");
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-xs font-bold uppercase tracking-wide text-blue-700">SmartCampus</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-950">Dynamic Assignment Workspace V1</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-500">
          Upload instruksi tugas dosen, lengkapi data yang kurang satu per satu, lalu generate proposal atau laporan dan export ke DOCX.
        </p>
      </header>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Upload className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Upload Tugas Dosen</h2>
            </div>
            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                resetForFile(event.dataTransfer.files.item(0));
              }}
              className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                className="hidden"
                onChange={(event) => resetForFile(event.target.files?.item(0) || null)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Upload className="h-4 w-4" />
                Pilih PDF/DOCX/TXT
              </button>
              <p className="mt-2 text-xs text-slate-500">Maksimal 10MB.</p>
              {file && <p className="mt-2 break-words text-sm font-semibold text-slate-800">{file.name}</p>}
            </div>
            <label className="mt-3 block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">Catatan opsional</span>
              <textarea
                value={userNotes}
                onChange={(event) => setUserNotes(event.target.value)}
                rows={4}
                placeholder="Contoh: output yang diminta, deadline, format dosen, atau konteks tugas yang belum tertulis di file."
                className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <button
              type="button"
              onClick={analyze}
              disabled={!file || state === "ANALYZE" || isPending}
              className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-100 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {state === "ANALYZE" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Pahami Tugas
            </button>
          </section>

          <StateCard state={state} />
          {meta && (
            <section className="rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-500 shadow-sm">
              Model: <span className="font-semibold text-slate-700">{meta.model}</span>
              <br />
              Karakter terbaca: <span className="font-semibold text-slate-700">{meta.extractedCharacters}</span>
              <br />
              Mode: <span className="font-semibold text-slate-700">{meta.fallback ? "fallback" : "AI"}</span>
            </section>
          )}
        </aside>

        <main className="space-y-4">
          {analysis ? (
            <>
              <UnderstandingPanel analysis={analysis} />
              <QuestionPanel
                question={currentQuestion}
                progress={progress}
                value={currentAnswer}
                onChange={setCurrentAnswer}
                onSubmit={submitAnswer}
                onSkip={skipOptional}
              />
              <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <PreGenerateReview analysis={analysis} answers={answers} canGenerate={canGenerate} state={state} onGenerate={generate} />
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={exportDocx}
                    disabled={!report || isPending}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    Export DOCX
                  </button>
                </div>
              </section>
              <ReportPreview report={report} />
            </>
          ) : (
            <section className="flex min-h-[420px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <div>
                <FileQuestion className="mx-auto h-10 w-10 text-slate-400" />
                <h2 className="mt-3 text-base font-bold text-slate-900">Belum ada tugas yang dianalisis</h2>
                <p className="mt-1 max-w-md text-sm text-slate-500">Upload PDF, DOCX, atau TXT tugas dosen untuk memulai workspace dinamis.</p>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function StateCard({ state }: { state: AssignmentWorkspaceState }) {
  const items: AssignmentWorkspaceState[] = ["UPLOAD", "ANALYZE", "WAITING_DATA", "READY_TO_GENERATE", "GENERATING", "DONE"];
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold text-slate-900">State</h2>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-2 text-xs">
            <span className={item === state ? "h-2.5 w-2.5 rounded-full bg-blue-600" : "h-2.5 w-2.5 rounded-full bg-slate-200"} />
            <span className={item === state ? "font-bold text-slate-900" : "text-slate-500"}>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function UnderstandingPanel({ analysis }: { analysis: AssignmentAnalysis }) {
  return (
    <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-extrabold text-slate-950">Hasil Pemahaman Tugas</h2>
          <p className="mt-1 text-sm leading-6 text-slate-700">{analysis.summary}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <InfoBlock title="Mata Kuliah" items={[analysis.course || "Belum disebutkan"]} />
            <InfoBlock title="Jenis Tugas" items={[analysis.assignmentType]} />
            <InfoBlock title="Router" items={[analysis.routedType]} />
            <InfoBlock title="Output yang Diminta" items={analysis.requestedOutput} />
            <InfoBlock title="Struktur Laporan" items={analysis.reportStructure} />
            <InfoBlock title="Data yang Masih Kurang" items={analysis.missingData.map((item) => item.label)} />
          </div>
          <RubricChecklist analysis={analysis} />
        </div>
      </div>
    </section>
  );
}

function InfoBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-white/70 bg-white/80 p-3">
      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</h3>
      <ul className="mt-2 space-y-1 text-sm text-slate-800">
        {items.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}
      </ul>
    </div>
  );
}

function PreGenerateReview({
  analysis,
  answers,
  canGenerate,
  state,
  onGenerate,
}: {
  analysis: AssignmentAnalysis;
  answers: AssignmentAnswers;
  canGenerate: boolean;
  state: AssignmentWorkspaceState;
  onGenerate: () => void;
}) {
  const collected = analysis.missingData
    .map((question) => ({ label: question.label, value: answers[question.id]?.trim() || "" }))
    .filter((item) => item.value && item.value !== "-");
  const assumed = [
    ...analysis.missingData
      .filter((question) => !answers[question.id]?.trim() || answers[question.id] === "-")
      .map((question) => question.label),
    ...analysis.assumptions,
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Pre-Generate Review</h2>
          <p className="mt-1 text-xs text-slate-500">
            Periksa ringkasan ini sebelum SmartCampus membuat dokumen final.
          </p>
        </div>
        <button
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-100 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state === "GENERATING" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Konfirmasi Generate
        </button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <InfoBlock title="Jenis Tugas" items={[analysis.routedType]} />
        <InfoBlock title="Mata Kuliah" items={[analysis.course || "Belum disebutkan"]} />
        <InfoBlock title="Output yang Akan Dibuat" items={analysis.requestedOutput} />
        <InfoBlock title="Struktur Dokumen" items={analysis.reportStructure} />
        <InfoBlock title="Data Terkumpul" items={collected.length ? collected.map((item) => `${item.label}: ${item.value}`) : ["Belum ada data mahasiswa yang tersimpan."]} />
        <InfoBlock title="Diasumsikan/Kosong" items={assumed.length ? assumed : ["Tidak ada asumsi atau data kosong terdeteksi."]} />
      </div>
    </div>
  );
}

function RubricChecklist({ analysis }: { analysis: AssignmentAnalysis }) {
  if (analysis.gradingRubric.length === 0) return null;
  return (
    <div className="mt-4 rounded-lg border border-emerald-100 bg-white/80 p-3">
      <h3 className="text-xs font-bold uppercase tracking-wide text-emerald-700">Rubric Awareness V1</h3>
      <div className="mt-2 space-y-2">
        {analysis.gradingRubric.map((item, index) => (
          <label key={`${item.aspect}-${index}`} className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" checked readOnly className="mt-1 h-3.5 w-3.5 rounded border-slate-300" />
            <span>{[item.aspect, item.weight, item.description].filter(Boolean).join(" - ")}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function QuestionPanel({
  question,
  progress,
  value,
  onChange,
  onSubmit,
  onSkip,
}: {
  question: AssignmentQuestion | null;
  progress: { answered: number; total: number; remaining: number };
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
}) {
  if (!question) {
    return (
      <section className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
        <h2 className="text-sm font-bold text-blue-950">Data lengkap</h2>
        <p className="mt-1 text-sm text-blue-800">Semua data wajib sudah terisi. Lanjut generate dokumen.</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Pertanyaan Data Kurang</h2>
          <p className="mt-1 text-xs text-slate-500">Pertanyaan {progress.answered + 1} dari {progress.total}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{progress.remaining} tersisa</span>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-slate-800">{question.question}</span>
        {question.type === "textarea" ? (
          <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} placeholder={question.placeholder} className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
        ) : question.type === "select" ? (
          <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
            <option value="">Pilih jawaban</option>
            {(question.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        ) : (
          <input value={value} onChange={(event) => onChange(event.target.value)} type={question.type === "number" ? "number" : question.type === "date" ? "date" : "text"} placeholder={question.placeholder} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
        )}
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={onSubmit} className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white transition hover:bg-blue-700">
          <Send className="h-4 w-4" />
          Simpan Jawaban
        </button>
        {!question.required && (
          <button type="button" onClick={onSkip} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            Lewati
          </button>
        )}
      </div>
    </section>
  );
}

function ReportPreview({ report }: { report: AssignmentReport | null }) {
  if (!report) return null;
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-extrabold text-slate-950">Preview Laporan</h2>
        <p className="mt-1 text-sm text-slate-500">{report.title}</p>
      </div>
      <div className="max-h-[680px] space-y-4 overflow-y-auto pr-2">
        {report.qualityReview && !report.qualityReview.passed && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <h3 className="text-sm font-bold text-amber-950">Quality Review Warning</h3>
            <div className="mt-2 space-y-1">
              {report.qualityReview.warnings.map((warning) => (
                <p key={warning} className="text-xs text-amber-900">{warning}</p>
              ))}
            </div>
          </div>
        )}
        <PreviewBlock title="Ringkasan" body={report.executiveSummary} />
        {report.rubricChecks.length > 0 && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
            <h3 className="text-sm font-bold text-blue-950">Rubric Check Setelah Generate</h3>
            <div className="mt-2 space-y-1">
              {report.rubricChecks.map((item, index) => (
                <p key={`${item.aspect}-${index}`} className="text-xs text-blue-900">
                  <span className="font-semibold">{item.status.toUpperCase()}</span> - {item.aspect}: {item.note}
                </p>
              ))}
            </div>
          </div>
        )}
        {report.academicSections?.length
          ? <AcademicDocumentPreview sections={report.academicSections} references={report.references} />
          : report.sections.map((section) => <PreviewBlock key={section.title} title={section.title} body={section.body} />)
        }
      </div>
    </section>
  );
}

function AcademicDocumentPreview({ sections, references }: { sections: AssignmentAcademicSection[]; references: string[] }) {
  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <div key={`${section.heading}-${index}`}>
          {section.level === "chapter" ? (
            <h3 className="mt-5 text-base font-extrabold uppercase text-slate-950">{section.heading}</h3>
          ) : (
            <h4 className="mt-3 text-sm font-bold text-slate-900">{section.heading}</h4>
          )}
          {section.body && <p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-slate-600">{section.body}</p>}
          {section.timelineRows && (
            <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[640px] border-collapse text-left text-xs">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="border-b border-slate-200 px-3 py-2">Minggu</th>
                    <th className="border-b border-slate-200 px-3 py-2">Kegiatan</th>
                    <th className="border-b border-slate-200 px-3 py-2">Target</th>
                  </tr>
                </thead>
                <tbody>
                  {section.timelineRows.map((row) => (
                    <tr key={row.week} className="align-top">
                      <td className="border-b border-slate-100 px-3 py-2 font-semibold text-slate-700">{row.week}</td>
                      <td className="border-b border-slate-100 px-3 py-2 text-slate-600">{row.activity}</td>
                      <td className="border-b border-slate-100 px-3 py-2 text-slate-600">{row.target}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
      {references.length > 0 && (
        <div>
          <h3 className="mt-5 text-base font-extrabold uppercase text-slate-950">DAFTAR PUSTAKA</h3>
          <div className="mt-2 space-y-2">
            {references.map((reference) => <p key={reference} className="text-sm leading-6 text-slate-600">{reference}</p>)}
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewBlock({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-slate-600">{body}</p>
    </div>
  );
}

function downloadBase64(base64: string, mimeType: string, fileName: string) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
