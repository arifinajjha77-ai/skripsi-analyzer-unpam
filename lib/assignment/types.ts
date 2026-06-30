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

export const assignmentTypeRouterSchema = z.enum([
  "PROPOSAL",
  "MAKALAH",
  "BUSINESS_PLAN",
  "SKRIPSI",
  "PKM",
  "LAPORAN_PRAKTIKUM",
  "JURNAL",
  "PRESENTASI",
  "CASE_STUDY",
  "UNKNOWN",
]);

export type AssignmentTypeRouter = z.infer<typeof assignmentTypeRouterSchema>;

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
  routedType: assignmentTypeRouterSchema,
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

export const assignmentTimelineRowSchema = z.object({
  week: z.string(),
  activity: z.string(),
  target: z.string(),
});

export const assignmentCostRowSchema = z.object({
  item: z.string(),
  quantity: z.string(),
  unitCost: z.string(),
  total: z.string(),
});

export const assignmentAcademicSectionSchema = z.object({
  heading: z.string(),
  level: z.enum(["chapter", "subheading"]),
  body: z.string().optional(),
  timelineRows: z.array(assignmentTimelineRowSchema).optional(),
  costRows: z.array(assignmentCostRowSchema).optional(),
});

export const assignmentRubricCheckSchema = z.object({
  aspect: z.string(),
  status: z.enum(["met", "partial", "missing"]),
  note: z.string(),
});

export const assignmentQualityReviewSchema = z.object({
  passed: z.boolean(),
  warnings: z.array(z.string()),
  checks: z.array(z.object({
    label: z.string(),
    passed: z.boolean(),
  })),
});

export const assignmentProposalMetaSchema = z.object({
  university: z.string(),
  title: z.string(),
  brandOrProduct: z.string(),
  groupName: z.string(),
  members: z.string(),
  course: z.string(),
  lecturer: z.string(),
  studyProgram: z.string(),
  year: z.string(),
});

export const assignmentReportImageSchema = z.object({
  name: z.string(),
  dataUrl: z.string(),
});

export const assignmentReportSchema = z.object({
  title: z.string(),
  course: z.string(),
  outputType: z.string(),
  executiveSummary: z.string(),
  proposalMeta: assignmentProposalMetaSchema.optional(),
  productImage: assignmentReportImageSchema.optional(),
  sections: z.array(assignmentReportSectionSchema),
  academicSections: z.array(assignmentAcademicSectionSchema).optional(),
  references: z.array(z.string()),
  appendices: z.array(z.string()),
  rubricChecks: z.array(assignmentRubricCheckSchema),
  qualityReview: assignmentQualityReviewSchema.optional(),
  generatedWith: z.object({
    model: z.string(),
    fallback: z.boolean(),
  }),
});

export type AssignmentReport = z.infer<typeof assignmentReportSchema>;
export type AssignmentReportSection = z.infer<typeof assignmentReportSectionSchema>;
export type AssignmentAcademicSection = z.infer<typeof assignmentAcademicSectionSchema>;
export type AssignmentTimelineRow = z.infer<typeof assignmentTimelineRowSchema>;
export type AssignmentCostRow = z.infer<typeof assignmentCostRowSchema>;
export type AssignmentRubricCheck = z.infer<typeof assignmentRubricCheckSchema>;
export type AssignmentQualityReview = z.infer<typeof assignmentQualityReviewSchema>;
export type AssignmentProposalMeta = z.infer<typeof assignmentProposalMetaSchema>;

export type AssignmentAnalyzeResult = {
  state: AssignmentWorkspaceState;
  extractedText: string;
  analysis: AssignmentAnalysis;
  model: string;
  fallback: boolean;
};
