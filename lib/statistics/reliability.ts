import { RespondentRow, ReliabilityResult, VariableConfig } from "@/types";

function variance(values: number[]): number {
  const n = values.length;
  if (n <= 1) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
}

export function computeCronbachAlpha(
  data: RespondentRow[],
  variable: VariableConfig
): ReliabilityResult {
  const k = variable.items.length;

  if (k < 2) {
    return {
      variableKey: variable.key,
      variableName: variable.name,
      cronbachAlpha: 0,
      k,
      reliable: false,
      category: "Tidak dapat dihitung (item < 2)",
    };
  }

  // Variance for each item
  const itemVariances = variable.items.map((itemKey) => {
    const values = data.map((row) => Number(row[itemKey]) || 0);
    return variance(values);
  });

  const sumItemVariances = itemVariances.reduce((a, b) => a + b, 0);

  // Total score variance
  const totalScores = data.map((row) =>
    variable.items.reduce((sum, item) => sum + (Number(row[item]) || 0), 0)
  );
  const totalVariance = variance(totalScores);

  if (totalVariance === 0) {
    return {
      variableKey: variable.key,
      variableName: variable.name,
      cronbachAlpha: 0,
      k,
      reliable: false,
      category: "Tidak dapat dihitung (varians total = 0)",
    };
  }

  const alpha = (k / (k - 1)) * (1 - sumItemVariances / totalVariance);
  const alphaRounded = parseFloat(Math.min(1, Math.max(0, alpha)).toFixed(4));

  return {
    variableKey: variable.key,
    variableName: variable.name,
    cronbachAlpha: alphaRounded,
    k,
    reliable: alphaRounded >= 0.6,
    category: getAlphaCategory(alphaRounded),
  };
}

function getAlphaCategory(alpha: number): string {
  if (alpha >= 0.9) return "Sangat Tinggi";
  if (alpha >= 0.8) return "Tinggi";
  if (alpha >= 0.7) return "Cukup Tinggi";
  if (alpha >= 0.6) return "Dapat Diterima";
  if (alpha >= 0.5) return "Rendah";
  return "Sangat Rendah";
}
