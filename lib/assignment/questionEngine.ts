import type { AssignmentAnalysis, AssignmentAnswers, AssignmentQuestion, AssignmentWorkspaceState } from "./types";
import { getMissingData, isAssignmentDataComplete } from "./missingData";

export function getCurrentQuestion(analysis: AssignmentAnalysis, answers: AssignmentAnswers): AssignmentQuestion | null {
  return getMissingData(analysis, answers)[0] || null;
}

export function getQuestionProgress(analysis: AssignmentAnalysis, answers: AssignmentAnswers): { answered: number; total: number; remaining: number } {
  const required = analysis.missingData.filter((question) => question.required);
  const remaining = getMissingData(analysis, answers).length;
  return { answered: Math.max(0, required.length - remaining), total: required.length, remaining };
}

export function getNextStateAfterAnswers(analysis: AssignmentAnalysis, answers: AssignmentAnswers): AssignmentWorkspaceState {
  return isAssignmentDataComplete(analysis, answers) ? "READY_TO_GENERATE" : "WAITING_DATA";
}
