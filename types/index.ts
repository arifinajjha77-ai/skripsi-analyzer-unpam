export interface RespondentRow {
  [key: string]: string | number;
}

export interface VariableConfig {
  name: string;        // e.g. "Kualitas Produk"
  key: string;         // e.g. "X1"
  items: string[];     // e.g. ["X1.1","X1.2",...]
}

export interface AppState {
  rawData: RespondentRow[];
  columns: string[];
  variables: VariableConfig[];
  rTableValue: number;
  fileName: string;
}

export interface DescriptiveItem {
  item: string;
  freq: { 1: number; 2: number; 3: number; 4: number; 5: number };
  totalScore: number;
  mean: number;
  category: string;
  n: number;
}

export interface DescriptiveResult {
  variableKey: string;
  variableName: string;
  items: DescriptiveItem[];
  totalMean: number;
}

export interface ValidityItem {
  item: string;
  rCount: number;
  rTable: number;
  valid: boolean;
}

export interface ValidityResult {
  variableKey: string;
  variableName: string;
  items: ValidityItem[];
  n: number;
}

export interface ReliabilityResult {
  variableKey: string;
  variableName: string;
  cronbachAlpha: number;
  k: number;
  reliable: boolean;
  category: string;
}

export interface RegressionResult {
  coefficients: {
    intercept: number;
    [key: string]: number;
  };
  tValues: {
    intercept: number;
    [key: string]: number;
  };
  pValues: {
    intercept: number;
    [key: string]: number;
  };
  r: number;
  rSquare: number;
  adjustedRSquare: number;
  fValue: number;
  fSig: number;
  n: number;
  variables: string[];
  variableNames: string[];
}

export interface MulticollinearityResult {
  variable: string;
  variableName: string;
  tolerance: number;
  vif: number;
}

export interface NormalityResult {
  meanResidual: number;
  stdResidual: number;
  n: number;
  interpretation: string;
}

export interface HeteroskedasticityResult {
  variable: string;
  variableName: string;
  correlation: number;
  interpretation: string;
}
