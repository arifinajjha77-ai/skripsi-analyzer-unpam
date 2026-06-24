"use client";

import { useMemo, useState } from "react";
import { useAppContext } from "@/lib/context";
import { computeValidity } from "@/lib/statistics/validity";
import { computeCronbachAlpha } from "@/lib/statistics/reliability";
import {
  computeRegression,
  computeMulticollinearity,
  computeNormality,
  computeHeteroskedasticity,
} from "@/lib/statistics/regression";
import { generateBab4Narasi } from "@/lib/narratives/generator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function NarasiPage() {
  const { state } = useAppContext();
  const [copied, setCopied] = useState(false);

  const xVariables = useMemo(
    () => state.variables.filter((v) => v.key !== "Y"),
    [state.variables]
  );
  const yVariable = useMemo(
    () => state.variables.find((v) => v.key === "Y"),
    [state.variables]
  );

  const narasi = useMemo(() => {
    if (!state.rawData.length || !xVariables.length || !yVariable) return null;

    const validityResults = state.variables.map((v) =>
      computeValidity(state.rawData, v, state.rTableValue)
    );
    const reliabilityResults = state.variables.map((v) =>
      computeCronbachAlpha(state.rawData, v)
    );
    const regressionResult = computeRegression(state.rawData, xVariables, yVariable);
    const multicollinearityResults = computeMulticollinearity(state.rawData, xVariables);
    const normalityResult = computeNormality(state.rawData, xVariables, yVariable);
    const heteroskedasticityResults = computeHeteroskedasticity(
      state.rawData,
      xVariables,
      yVariable
    );

    return generateBab4Narasi({
      validityResults,
      reliabilityResults,
      regressionResult,
      multicollinearityResults,
      normalityResult,
      heteroskedasticityResults,
      yVariable,
    });
  }, [state.rawData, state.variables, state.rTableValue, xVariables, yVariable]);

  if (!state.rawData.length || !state.variables.length) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Belum ada data atau mapping variabel. Selesaikan langkah Upload dan Mapping terlebih dahulu.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!yVariable) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Variabel Y belum didefinisikan di mapping.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  async function handleCopy() {
    if (!narasi) return;
    try {
      await navigator.clipboard.writeText(narasi);
      setCopied(true);
      toast.success("Narasi Bab 4 berhasil disalin");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = narasi;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Narasi Bab 4</h1>
          <p className="text-slate-500 text-sm mt-1">
            Narasi otomatis Bahasa Indonesia format skripsi, siap disalin ke dokumen.
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" /> Tersalin!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" /> Salin Narasi
            </>
          )}
        </button>
      </div>

      <Alert className="border-amber-200 bg-amber-50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-700">
          Pastikan data berasal dari responden asli. Periksa kembali hasil analisis sebelum memasukkan ke skripsi.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="pb-3 border-b border-slate-200 bg-slate-50">
          <CardTitle className="text-base">
            Teks Narasi – Bab IV Hasil Penelitian dan Pembahasan
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {narasi ? (
            <NarasiRenderer text={narasi} />
          ) : (
            <p className="text-slate-400 text-sm italic">
              Narasi belum dapat dihasilkan. Pastikan semua variabel telah dikonfigurasi.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NarasiRenderer({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith("# ")) {
          return (
            <h2 key={i} className="text-lg font-bold text-slate-800 mt-4 mb-2">
              {line.replace("# ", "")}
            </h2>
          );
        }
        if (line.startsWith("**") && line.endsWith("**")) {
          return (
            <h3 key={i} className="text-sm font-bold text-slate-800 mt-4">
              {line.replace(/\*\*/g, "")}
            </h3>
          );
        }
        if (line === "---") {
          return <hr key={i} className="border-slate-200 my-3" />;
        }
        if (line.startsWith("> ")) {
          return (
            <blockquote key={i} className="border-l-4 border-amber-300 pl-4 text-amber-700 bg-amber-50 py-2 rounded-r text-xs">
              {line.replace(/^> /, "").replace("⚠️ **Catatan:** ", "⚠️ Catatan: ")}
            </blockquote>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <li key={i} className="ml-4 text-sm list-disc">
              <InlineMarkdown text={line.slice(2)} />
            </li>
          );
        }
        if (line.trim() === "") return <br key={i} />;
        return (
          <p key={i} className="text-sm">
            <InlineMarkdown text={line} />
          </p>
        );
      })}
    </div>
  );
}

function InlineMarkdown({ text }: { text: string }) {
  // Bold: **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
