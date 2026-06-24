import {
  RespondentRow,
  VariableConfig,
  RegressionResult,
  MulticollinearityResult,
  NormalityResult,
  HeteroskedasticityResult,
} from "@/types";

// ─── helpers ──────────────────────────────────────────────────────────────────

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function pearson(x: number[], y: number[]): number {
  const n = x.length;
  const mx = mean(x);
  const my = mean(y);
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - mx) * (y[i] - my);
    dx2 += (x[i] - mx) ** 2;
    dy2 += (y[i] - my) ** 2;
  }
  const denom = Math.sqrt(dx2 * dy2);
  return denom === 0 ? 0 : num / denom;
}

/**
 * Solve OLS via normal equations using Gaussian elimination.
 * Returns coefficients [b0, b1, b2, ...]
 */
function olsSolve(X: number[][], y: number[]): number[] {
  const n = X.length;
  const p = X[0].length; // includes intercept column

  // Xt * X  (p x p)
  const XtX: number[][] = Array.from({ length: p }, () => new Array(p).fill(0));
  for (let i = 0; i < p; i++)
    for (let j = 0; j < p; j++)
      for (let k = 0; k < n; k++)
        XtX[i][j] += X[k][i] * X[k][j];

  // Xt * y  (p x 1)
  const Xty: number[] = new Array(p).fill(0);
  for (let i = 0; i < p; i++)
    for (let k = 0; k < n; k++)
      Xty[i] += X[k][i] * y[k];

  // Augmented matrix [XtX | Xty]
  const aug: number[][] = XtX.map((row, i) => [...row, Xty[i]]);

  // Gaussian elimination with partial pivoting
  for (let col = 0; col < p; col++) {
    let maxRow = col;
    for (let row = col + 1; row < p; row++)
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-12) continue;
    for (let row = 0; row < p; row++) {
      if (row === col) continue;
      const factor = aug[row][col] / pivot;
      for (let c = col; c <= p; c++) aug[row][c] -= factor * aug[col][c];
    }
    for (let c = col; c <= p; c++) aug[col][c] /= pivot;
  }

  return aug.map((row) => row[p]);
}

/** t-distribution CDF approximation (two-tailed p-value) */
function tDistPValue(t: number, df: number): number {
  const x = df / (df + t * t);
  // Regularized incomplete beta function approximation
  const a = 0.5 * df;
  const b = 0.5;
  const ibeta = incompleteBeta(x, a, b);
  return Math.min(1, ibeta);
}

function incompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const lbeta = lgamma(a) + lgamma(b) - lgamma(a + b);
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lbeta) / a;
  // Use continued fraction
  return front * betaCF(x, a, b);
}

function betaCF(x: number, a: number, b: number): number {
  const MAXIT = 200;
  const EPS = 3e-7;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - qab * x / qap;
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

function lgamma(x: number): number {
  const c = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5,
  ];
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += c[j] / ++y;
  return -tmp + Math.log(2.5066282746310005 * ser / x);
}

/** F-distribution p-value via beta function */
function fDistPValue(F: number, df1: number, df2: number): number {
  if (F <= 0) return 1;
  const x = df2 / (df2 + df1 * F);
  return incompleteBeta(x, df2 / 2, df1 / 2);
}

// ─── main exports ─────────────────────────────────────────────────────────────

export function getVariableTotalScores(
  data: RespondentRow[],
  variable: VariableConfig
): number[] {
  return data.map((row) =>
    variable.items.reduce((sum, item) => sum + (Number(row[item]) || 0), 0)
  );
}

export function computeRegression(
  data: RespondentRow[],
  xVariables: VariableConfig[],
  yVariable: VariableConfig
): RegressionResult {
  const n = data.length;
  const yScores = getVariableTotalScores(data, yVariable);
  const xScoresArr = xVariables.map((v) => getVariableTotalScores(data, v));

  // Design matrix with intercept
  const X: number[][] = data.map((_, i) => [1, ...xScoresArr.map((xs) => xs[i])]);

  const coeffs = olsSolve(X, yScores);
  const intercept = coeffs[0];
  const slopes = coeffs.slice(1);

  // Fitted values & residuals
  const fitted = X.map((row) => row.reduce((s, v, j) => s + v * coeffs[j], 0));
  const residuals = yScores.map((y, i) => y - fitted[i]);

  const meanY = mean(yScores);
  const ssTot = yScores.reduce((s, y) => s + (y - meanY) ** 2, 0);
  const ssRes = residuals.reduce((s, r) => s + r ** 2, 0);
  const ssReg = ssTot - ssRes;

  const p = xVariables.length; // number of predictors
  const dfReg = p;
  const dfRes = n - p - 1;

  const rSquare = ssTot === 0 ? 0 : ssReg / ssTot;
  const adjustedRSquare = ssTot === 0 ? 0 : 1 - (ssRes / dfRes) / (ssTot / (n - 1));
  const r = Math.sqrt(Math.max(0, rSquare));

  const msRes = dfRes > 0 ? ssRes / dfRes : 0;
  const msReg = dfReg > 0 ? ssReg / dfReg : 0;
  const fValue = msRes === 0 ? 0 : msReg / msRes;
  const fSig = fDistPValue(fValue, dfReg, dfRes);

  // Standard errors of coefficients via (XtX)^-1 * msRes
  // We compute (XtX)^-1 using the same augmented approach
  const XtXInv = invertMatrix(
    X.reduce<number[][]>((acc, row) => {
      for (let i = 0; i < row.length; i++)
        for (let j = 0; j < row.length; j++)
          acc[i][j] += row[i] * row[j];
      return acc;
    }, Array.from({ length: p + 1 }, () => new Array(p + 1).fill(0)))
  );

  const seCoeffs = coeffs.map((_, i) =>
    Math.sqrt(Math.max(0, (XtXInv?.[i]?.[i] ?? 0) * msRes))
  );

  const tValues: Record<string, number> = { intercept: seCoeffs[0] === 0 ? 0 : intercept / seCoeffs[0] };
  const pValues: Record<string, number> = { intercept: tDistPValue(Math.abs(tValues.intercept), dfRes) };
  const coefficients: Record<string, number> = { intercept };

  xVariables.forEach((v, i) => {
    coefficients[v.key] = parseFloat(slopes[i].toFixed(4));
    tValues[v.key] = seCoeffs[i + 1] === 0 ? 0 : parseFloat((slopes[i] / seCoeffs[i + 1]).toFixed(4));
    pValues[v.key] = parseFloat(tDistPValue(Math.abs(tValues[v.key]), dfRes).toFixed(4));
  });

  return {
    coefficients: Object.fromEntries(
      Object.entries(coefficients).map(([k, v]) => [k, parseFloat(v.toFixed(4))])
    ) as RegressionResult["coefficients"],
    tValues: Object.fromEntries(
      Object.entries(tValues).map(([k, v]) => [k, parseFloat(v.toFixed(4))])
    ) as RegressionResult["tValues"],
    pValues: Object.fromEntries(
      Object.entries(pValues).map(([k, v]) => [k, parseFloat(v.toFixed(4))])
    ) as RegressionResult["pValues"],
    r: parseFloat(r.toFixed(4)),
    rSquare: parseFloat(rSquare.toFixed(4)),
    adjustedRSquare: parseFloat(adjustedRSquare.toFixed(4)),
    fValue: parseFloat(fValue.toFixed(4)),
    fSig: parseFloat(fSig.toFixed(4)),
    n,
    variables: xVariables.map((v) => v.key),
    variableNames: xVariables.map((v) => v.name),
  };
}

export function computeMulticollinearity(
  data: RespondentRow[],
  xVariables: VariableConfig[]
): MulticollinearityResult[] {
  if (xVariables.length < 2) {
    return xVariables.map((v) => ({
      variable: v.key,
      variableName: v.name,
      tolerance: 1,
      vif: 1,
    }));
  }

  const xScoresArr = xVariables.map((v) => getVariableTotalScores(data, v));

  return xVariables.map((v, idx) => {
    const y = xScoresArr[idx];
    const others = xScoresArr.filter((_, i) => i !== idx);
    const X: number[][] = data.map((_, i) => [1, ...others.map((xs) => xs[i])]);
    const coeffs = olsSolve(X, y);
    const fitted = X.map((row) => row.reduce((s, val, j) => s + val * coeffs[j], 0));
    const ssRes = y.reduce((s, yi, i) => s + (yi - fitted[i]) ** 2, 0);
    const meanY = mean(y);
    const ssTot = y.reduce((s, yi) => s + (yi - meanY) ** 2, 0);
    const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
    const tolerance = Math.max(0, 1 - r2);
    const vif = tolerance < 1e-6 ? 999 : 1 / tolerance;

    return {
      variable: v.key,
      variableName: v.name,
      tolerance: parseFloat(tolerance.toFixed(4)),
      vif: parseFloat(vif.toFixed(4)),
    };
  });
}

export function computeNormality(
  data: RespondentRow[],
  xVariables: VariableConfig[],
  yVariable: VariableConfig
): NormalityResult {
  const n = data.length;
  const yScores = getVariableTotalScores(data, yVariable);
  const xScoresArr = xVariables.map((v) => getVariableTotalScores(data, v));
  const X: number[][] = data.map((_, i) => [1, ...xScoresArr.map((xs) => xs[i])]);
  const coeffs = olsSolve(X, yScores);
  const fitted = X.map((row) => row.reduce((s, v, j) => s + v * coeffs[j], 0));
  const residuals = yScores.map((y, i) => y - fitted[i]);

  const meanRes = mean(residuals);
  const varianceRes =
    residuals.reduce((s, r) => s + (r - meanRes) ** 2, 0) / (n - 1);
  const stdRes = Math.sqrt(varianceRes);

  const interpretation =
    Math.abs(meanRes) < 1
      ? "Mean residual mendekati 0, mengindikasikan residual terdistribusi normal."
      : "Mean residual cukup jauh dari 0, perlu diverifikasi lebih lanjut dengan uji normalitas formal (Kolmogorov-Smirnov atau Shapiro-Wilk).";

  return {
    meanResidual: parseFloat(meanRes.toFixed(4)),
    stdResidual: parseFloat(stdRes.toFixed(4)),
    n,
    interpretation,
  };
}

export function computeHeteroskedasticity(
  data: RespondentRow[],
  xVariables: VariableConfig[],
  yVariable: VariableConfig
): HeteroskedasticityResult[] {
  const n = data.length;
  const yScores = getVariableTotalScores(data, yVariable);
  const xScoresArr = xVariables.map((v) => getVariableTotalScores(data, v));
  const X: number[][] = data.map((_, i) => [1, ...xScoresArr.map((xs) => xs[i])]);
  const coeffs = olsSolve(X, yScores);
  const fitted = X.map((row) => row.reduce((s, v, j) => s + v * coeffs[j], 0));
  const residuals = yScores.map((y, i) => y - fitted[i]);
  const absResiduals = residuals.map(Math.abs);

  return xVariables.map((v, idx) => {
    const xScores = xScoresArr[idx];
    const r = pearson(xScores, absResiduals);

    const threshold = 0.2;
    const interpretation =
      Math.abs(r) < threshold
        ? `Korelasi absolut residual dengan ${v.key} = ${r.toFixed(4)} (< ${threshold}), tidak terindikasi heteroskedastisitas.`
        : `Korelasi absolut residual dengan ${v.key} = ${r.toFixed(4)} (≥ ${threshold}), terindikasi adanya heteroskedastisitas.`;

    return {
      variable: v.key,
      variableName: v.name,
      correlation: parseFloat(r.toFixed(4)),
      interpretation,
    };
  });
}

// ─── matrix inversion ─────────────────────────────────────────────────────────

function invertMatrix(m: number[][]): number[][] | null {
  const n = m.length;
  const aug = m.map((row, i) => {
    const identity = new Array(n).fill(0);
    identity[i] = 1;
    return [...row, ...identity];
  });

  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let row = col + 1; row < n; row++)
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-12) return null;
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = aug[row][col] / pivot;
      for (let c = col; c < 2 * n; c++) aug[row][c] -= factor * aug[col][c];
    }
    for (let c = col; c < 2 * n; c++) aug[col][c] /= pivot;
  }

  return aug.map((row) => row.slice(n));
}
