import { RespondentRow, ValidityItem, ValidityResult, VariableConfig } from "@/types";

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denom = Math.sqrt(denomX * denomY);
  if (denom === 0) return 0;
  return num / denom;
}

export function computeValidity(
  data: RespondentRow[],
  variable: VariableConfig,
  rTable: number
): ValidityResult {
  const n = data.length;

  // Compute total score per respondent for this variable
  const totals = data.map((row) =>
    variable.items.reduce((sum, item) => sum + (Number(row[item]) || 0), 0)
  );

  const items: ValidityItem[] = variable.items.map((itemKey) => {
    const itemScores = data.map((row) => Number(row[itemKey]) || 0);
    const rCount = pearsonCorrelation(itemScores, totals);

    return {
      item: itemKey,
      rCount: parseFloat(rCount.toFixed(4)),
      rTable,
      valid: rCount >= rTable,
    };
  });

  return {
    variableKey: variable.key,
    variableName: variable.name,
    items,
    n,
  };
}
