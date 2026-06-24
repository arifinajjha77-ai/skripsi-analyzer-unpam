import { RespondentRow, DescriptiveItem, DescriptiveResult, VariableConfig } from "@/types";

const LIKERT_CATEGORIES: Record<string, string> = {
  "1.00-1.80": "Sangat Tidak Setuju (STS)",
  "1.81-2.60": "Tidak Setuju (TS)",
  "2.61-3.40": "Kurang Setuju (KS)",
  "3.41-4.20": "Setuju (S)",
  "4.21-5.00": "Sangat Setuju (SS)",
};

function getLikertCategory(mean: number): string {
  if (mean <= 1.8) return "Sangat Tidak Setuju (STS)";
  if (mean <= 2.6) return "Tidak Setuju (TS)";
  if (mean <= 3.4) return "Kurang Setuju (KS)";
  if (mean <= 4.2) return "Setuju (S)";
  return "Sangat Setuju (SS)";
}

export function computeDescriptive(
  data: RespondentRow[],
  variable: VariableConfig
): DescriptiveResult {
  const n = data.length;

  const items: DescriptiveItem[] = variable.items.map((itemKey) => {
    const values = data.map((row) => Number(row[itemKey]) || 0);

    const freq = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const v of values) {
      const rounded = Math.round(v) as 1 | 2 | 3 | 4 | 5;
      if (rounded >= 1 && rounded <= 5) {
        freq[rounded]++;
      }
    }

    const totalScore = values.reduce((a, b) => a + b, 0);
    const mean = n > 0 ? totalScore / n : 0;

    return {
      item: itemKey,
      freq,
      totalScore,
      mean: parseFloat(mean.toFixed(2)),
      category: getLikertCategory(mean),
      n,
    };
  });

  const totalMean =
    items.length > 0
      ? parseFloat((items.reduce((a, b) => a + b.mean, 0) / items.length).toFixed(2))
      : 0;

  return {
    variableKey: variable.key,
    variableName: variable.name,
    items,
    totalMean,
  };
}

export { getLikertCategory, LIKERT_CATEGORIES };
