"use server";

import { z } from "zod";
import { analyzeAssignment } from "@/lib/assignment/analyzeAssignment";
import { extractAssignmentText } from "@/lib/assignment/extractText";
import { exportAssignmentDocx } from "@/lib/assignment/exportDocx";
import { generateAssignmentReport } from "@/lib/assignment/generateReport";
import { assignmentAnalysisSchema, assignmentAnswerSchema, assignmentReportSchema } from "@/lib/assignment/types";

const analyzeInputSchema = z.object({
  userNotes: z.string().max(10000).optional(),
});

const generateInputSchema = z.object({
  analysis: assignmentAnalysisSchema,
  answers: assignmentAnswerSchema,
  optionalNotes: z.string().max(10000).optional(),
});

const exportInputSchema = z.object({
  report: assignmentReportSchema,
});

export async function analyzeAssignmentAction(formData: FormData) {
  const file = formData.get("assignmentFile");
  const parsed = analyzeInputSchema.safeParse({
    userNotes: formData.get("userNotes")?.toString() || "",
  });

  if (!parsed.success) {
    return { ok: false as const, error: "Catatan terlalu panjang." };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, error: "Upload file tugas dosen terlebih dahulu." };
  }

  try {
    const extractedText = await extractAssignmentText(file);
    const result = await analyzeAssignment(extractedText, parsed.data.userNotes);
    return {
      ok: true as const,
      data: {
        state: result.analysis.missingData.some((item) => item.required) ? "WAITING_DATA" as const : "READY_TO_GENERATE" as const,
        extractedText,
        analysis: result.analysis,
        model: result.model,
        fallback: result.fallback,
      },
    };
  } catch (error) {
    return { ok: false as const, error: messageOf(error) };
  }
}

export async function generateAssignmentAction(input: unknown) {
  const parsed = generateInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Data tugas belum valid atau belum lengkap." };
  }

  try {
    const report = await generateAssignmentReport(parsed.data.analysis, parsed.data.answers, parsed.data.optionalNotes);
    return { ok: true as const, data: report };
  } catch (error) {
    return { ok: false as const, error: messageOf(error) };
  }
}

export async function exportAssignmentAction(input: unknown) {
  const parsed = exportInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Preview laporan belum valid untuk diexport." };
  }

  try {
    const buffer = await exportAssignmentDocx(parsed.data.report);
    return {
      ok: true as const,
      data: {
        fileName: `${safeFileName(parsed.data.report.title)}_${new Date().toISOString().slice(0, 10)}.docx`,
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        base64: buffer.toString("base64"),
      },
    };
  } catch (error) {
    return { ok: false as const, error: messageOf(error) };
  }
}

function safeFileName(value: string): string {
  return value.replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, "-").slice(0, 80) || "SmartCampus-Assignment";
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Terjadi kesalahan tidak dikenal.";
}
