"use client";

import { useMemo } from "react";
import { useAppContext } from "@/lib/context";
import {
  computeRegression,
  computeMulticollinearity,
  computeNormality,
  computeHeteroskedasticity,
} from "@/lib/statistics/regression";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle } from "lucide-react";

export default function RegresiPage() {
  const { state } = useAppContext();

  const xVariables = useMemo(
    () => state.variables.filter((v) => v.key !== "Y"),
    [state.variables]
  );
  const yVariable = useMemo(
    () => state.variables.find((v) => v.key === "Y"),
    [state.variables]
  );

  const regressionResult = useMemo(() => {
    if (!state.rawData.length || !xVariables.length || !yVariable) return null;
    return computeRegression(state.rawData, xVariables, yVariable);
  }, [state.rawData, xVariables, yVariable]);

  const multicolResult = useMemo(() => {
    if (!state.rawData.length || xVariables.length < 2 || !yVariable) return null;
    return computeMulticollinearity(state.rawData, xVariables);
  }, [state.rawData, xVariables, yVariable]);

  const normalityResult = useMemo(() => {
    if (!state.rawData.length || !xVariables.length || !yVariable) return null;
    return computeNormality(state.rawData, xVariables, yVariable);
  }, [state.rawData, xVariables, yVariable]);

  const heterosResult = useMemo(() => {
    if (!state.rawData.length || !xVariables.length || !yVariable) return null;
    return computeHeteroskedasticity(state.rawData, xVariables, yVariable);
  }, [state.rawData, xVariables, yVariable]);

  if (!state.rawData.length || !state.variables.length) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Belum ada data atau mapping variabel. Selesaikan langkah Upload dan Mapping terlebih dahulu.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!yVariable) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Variabel Y belum didefinisikan. Pastikan ada variabel dengan key "Y" di mapping.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Regresi & Asumsi Klasik</h1>
        <p className="text-slate-500 text-sm mt-1">
          Regresi linear berganda Y = a + b₁X₁ + b₂X₂ + ... beserta uji asumsi klasik.
        </p>
      </div>

      {regressionResult && (
        <>
          {/* Coefficients */}
          <Card>
            <CardHeader className="pb-3 bg-slate-50 border-b border-slate-200">
              <CardTitle className="text-base">Koefisien Regresi</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-xs">Variabel</TableHead>
                      <TableHead className="text-xs text-right">Koefisien (B)</TableHead>
                      <TableHead className="text-xs text-right">t Hitung</TableHead>
                      <TableHead className="text-xs text-right">Sig. (p-value)</TableHead>
                      <TableHead className="text-xs text-center">Ket.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-xs font-medium">Konstanta (a)</TableCell>
                      <TableCell className="text-xs text-right font-mono">
                        {regressionResult.coefficients.intercept.toFixed(4)}
                      </TableCell>
                      <TableCell className="text-xs text-right font-mono">
                        {regressionResult.tValues.intercept.toFixed(4)}
                      </TableCell>
                      <TableCell className="text-xs text-right font-mono">
                        {regressionResult.pValues.intercept.toFixed(4)}
                      </TableCell>
                      <TableCell className="text-xs text-center">–</TableCell>
                    </TableRow>
                    {regressionResult.variables.map((key, i) => {
                      const sig = regressionResult.pValues[key] < 0.05;
                      return (
                        <TableRow key={key} className={sig ? "" : "bg-orange-50/40"}>
                          <TableCell className="text-xs font-medium">
                            {key} – {regressionResult.variableNames[i]}
                          </TableCell>
                          <TableCell className="text-xs text-right font-mono">
                            {regressionResult.coefficients[key].toFixed(4)}
                          </TableCell>
                          <TableCell className="text-xs text-right font-mono">
                            {regressionResult.tValues[key].toFixed(4)}
                          </TableCell>
                          <TableCell className="text-xs text-right font-mono">
                            {regressionResult.pValues[key].toFixed(4)}
                          </TableCell>
                          <TableCell className="text-xs text-center">
                            <Badge
                              className={
                                sig
                                  ? "bg-green-100 text-green-700 border-green-200 text-xs"
                                  : "bg-orange-100 text-orange-700 border-orange-200 text-xs"
                              }
                            >
                              {sig ? "Sig." : "Tdk Sig."}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Model summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "R (Korelasi)", value: regressionResult.r.toFixed(4) },
              { label: "R² (Determinasi)", value: regressionResult.rSquare.toFixed(4) },
              { label: "Adjusted R²", value: regressionResult.adjustedRSquare.toFixed(4) },
              { label: "n (Sampel)", value: String(regressionResult.n) },
            ].map(({ label, value }) => (
              <Card key={label} className="text-center">
                <CardContent className="pt-4 pb-4">
                  <p className="text-2xl font-bold text-slate-800">{value}</p>
                  <p className="text-xs text-slate-500 mt-1">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ANOVA / F test */}
          <Card>
            <CardHeader className="pb-3 bg-slate-50 border-b border-slate-200">
              <CardTitle className="text-base">Uji F (ANOVA)</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-center gap-6 flex-wrap">
                <div>
                  <p className="text-xs text-slate-500">F Hitung</p>
                  <p className="text-2xl font-bold text-slate-800">{regressionResult.fValue.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Sig. (p-value)</p>
                  <p className="text-2xl font-bold text-slate-800">{regressionResult.fSig.toFixed(4)}</p>
                </div>
                <div>
                  <Badge
                    className={
                      regressionResult.fSig < 0.05
                        ? "bg-green-100 text-green-700 border-green-200"
                        : "bg-orange-100 text-orange-700 border-orange-200"
                    }
                  >
                    {regressionResult.fSig < 0.05
                      ? "✓ Model Signifikan (Fit)"
                      : "⚠ Model Tidak Signifikan"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Multicollinearity */}
      {multicolResult && (
        <Card>
          <CardHeader className="pb-3 bg-slate-50 border-b border-slate-200">
            <CardTitle className="text-base">Uji Multikolinearitas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-xs">Variabel</TableHead>
                    <TableHead className="text-xs text-right">Tolerance</TableHead>
                    <TableHead className="text-xs text-right">VIF</TableHead>
                    <TableHead className="text-xs text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {multicolResult.map((r) => {
                    const ok = r.tolerance > 0.1 && r.vif < 10;
                    return (
                      <TableRow key={r.variable}>
                        <TableCell className="text-xs font-medium">
                          {r.variable} – {r.variableName}
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono">{r.tolerance.toFixed(4)}</TableCell>
                        <TableCell className="text-xs text-right font-mono">{r.vif.toFixed(4)}</TableCell>
                        <TableCell className="text-xs text-center">
                          <Badge
                            className={
                              ok
                                ? "bg-green-100 text-green-700 border-green-200"
                                : "bg-red-100 text-red-700 border-red-200"
                            }
                          >
                            {ok ? "Bebas" : "Ada Multikolinearitas"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Normality */}
      {normalityResult && (
        <Card>
          <CardHeader className="pb-3 bg-slate-50 border-b border-slate-200">
            <CardTitle className="text-base">Uji Normalitas Residual</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex gap-8 flex-wrap">
              <div>
                <p className="text-xs text-slate-500">Mean Residual</p>
                <p className="text-xl font-bold text-slate-800">{normalityResult.meanResidual.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Std. Deviasi Residual</p>
                <p className="text-xl font-bold text-slate-800">{normalityResult.stdResidual.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">n</p>
                <p className="text-xl font-bold text-slate-800">{normalityResult.n}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
              {normalityResult.interpretation}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Heteroskedasticity */}
      {heterosResult && (
        <Card>
          <CardHeader className="pb-3 bg-slate-50 border-b border-slate-200">
            <CardTitle className="text-base">Uji Heteroskedastisitas (Pendekatan Glejser)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-xs">Variabel</TableHead>
                    <TableHead className="text-xs text-right">|r| Korelasi Absolut Residual</TableHead>
                    <TableHead className="text-xs">Interpretasi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {heterosResult.map((r) => {
                    const ok = Math.abs(r.correlation) < 0.2;
                    return (
                      <TableRow key={r.variable}>
                        <TableCell className="text-xs font-medium">
                          {r.variable} – {r.variableName}
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono">
                          <span className={ok ? "text-green-700" : "text-red-600"}>
                            {Math.abs(r.correlation).toFixed(4)}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 max-w-xs">
                          {r.interpretation}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
