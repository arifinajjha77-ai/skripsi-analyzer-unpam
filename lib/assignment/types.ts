import { z } from "zod";

export const assignmentWorkspaceStateSchema = z.enum([
  "UPLOAD",
  "ANALYZE",
  "WAITING_DATA",
  "READY_TO_GENERATE",
  "GENERATING",
  "DONE",
]);

export type AssignmentWorkspaceState = z.infer<typeof assignmentWorkspaceStateSchema>;

export const assignmentDeliverableSchema = z.object({
  name: z.string(),
  type: z.enum(["proposal", "report", "weekly_report", "final_report", "presentation", "essay", "worksheet", "other"]),
  description: z.string(),
  priority: z.enum(["high", "medium", "low"]),
});

export const assignmentQuestionSchema = z.object({
  id: z.string(),
  label: z.string(),
  question: z.string(),
  required: z.boolean(),
  type: z.enum(["text", "textarea", "number", "date", "select"]),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
  answer: z.string().optional(),
});

export const assignmentAnalysisSchema = z.object({
  title: z.string(),
  course: z.string().optional(),
  assignmentType: z.string(),
  requestedOutput: z.array(z.string()),
  reportStructure: z.array(z.string()),
  gradingRubric: z.array(z.object({
    aspect: z.string(),
    weight: z.string().optional(),
    description: z.string().optional(),
  })),
  missingData: z.array(assignmentQuestionSchema),
  summary: z.string(),
  writingRules: z.object({
    language: z.string().optional(),
    citationStyle: z.string().optional(),
    formatting: z.string().optional(),
    deadline: z.string().optional(),
  }),
  assumptions: z.array(z.string()),
  deliverables: z.array(assignmentDeliverableSchema),
});

export type AssignmentAnalysis = z.infer<typeof assignmentAnalysisSchema>;
export type AssignmentQuestion = z.infer<typeof assignmentQuestionSchema>;

export const assignmentAnswerSchema = z.record(z.string(), z.string());
export type AssignmentAnswers = z.infer<typeof assignmentAnswerSchema>;

export const assignmentReportSectionSchema = z.object({
  title: z.string(),
  body: z.string(),
});

export const assignmentReportSchema = z.object({
  title: z.string(),
  course: z.string(),
  outputType: z.string(),
  executiveSummary: z.string(),
  sections: z.array(assignmentReportSectionSchema),
  references: z.array(z.string()),
  appendices: z.array(z.string()),
  generatedWith: z.object({
    model: z.string(),
    fallback: z.boolean(),
  }),
});

export type AssignmentReport = z.infer<typeof assignmentReportSchema>;
export type AssignmentReportSection = z.infer<typeof assignmentReportSectionSchema>;

export type AssignmentAnalyzeResult = {
  state: AssignmentWorkspaceState;
  extractedText: string;
  analysis: AssignmentAnalysis;
  model: string;
  fallback: boolean;
};
