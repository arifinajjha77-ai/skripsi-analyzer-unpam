import type { AssignmentAnalysis, AssignmentAnswers, AssignmentQuestion } from "./types";

export function getMissingData(analysis: AssignmentAnalysis, answers: AssignmentAnswers): AssignmentQuestion[] {
  return analysis.missingData.filter((question) => {
    if (!question.required) return false;
    const answer = answers[question.id]?.trim();
    return !answer || answer === "-";
  });
}

export function isAssignmentDataComplete(analysis: AssignmentAnalysis, answers: AssignmentAnswers): boolean {
  return getMissingData(analysis, answers).length === 0;
}

export function mergeAnswer(answers: AssignmentAnswers, questionId: string, value: string): AssignmentAnswers {
  return { ...answers, [questionId]: value.trim() };
}

export function buildAnsweredFacts(analysis: AssignmentAnalysis, answers: AssignmentAnswers): Array<{ label: string; value: string }> {
  return analysis.missingData
    .map((question) => ({ label: question.label, value: answers[question.id]?.trim() || "" }))
    .filter((item) => item.value);
}
