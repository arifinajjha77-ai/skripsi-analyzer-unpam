import type {
  ValidityResult,
  ReliabilityResult,
  RegressionResult,
  MulticollinearityResult,
  NormalityResult,
  HeteroskedasticityResult,
} from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StatusLevel = "sangat_baik" | "baik" | "cukup" | "perlu_perbaikan" | "belum_layak";
export type CheckStatus  = "baik" | "cukup" | "buruk";

export interface KelayakanCheck {
  id: string;
  label: string;
  nilai: string;
  status: CheckStatus;
  detail: string;
  skor: number;
  maxSkor: number;
}

export interface InsightReport {
  ringkasan: string;
  yangBaik: string[];
  yangPerluDiperhatikan: string[];
  kemungkinanPenyebab: string[];
  saranPerbaikan: string[];
  kesimpulanAkhir: string;
}

export interface KelayakanReport {
  totalSkor: number;
  statusLabel: StatusLevel;
  checks: KelayakanCheck[];
  yangBaik: string[];
  yangPerluDiperbaiki: string[];
  saranPerbaikan: string[];
  kesimpulan: string;
  insight: InsightReport;
}

// ─── Status helpers ───────────────────────────────────────────────────────────

export function getStatusLabel(score: number): StatusLevel {
  if (score >= 85) return "sangat_baik";
  if (score >= 70) return "baik";
  if (score >= 55) return "cukup";
  if (score >= 40) return "perlu_perbaikan";
  return "belum_layak";
}

export const STATUS_META: Record<StatusLevel, { label: string; emoji: string; color: string; bar: string }> = {
  sangat_baik:      { label: "Sangat Baik",     emoji: "🟢", color: "text-emerald-700 bg-emerald-50 border-emerald-200", bar: "bg-emerald-500" },
  baik:             { label: "Baik",             emoji: "🟢", color: "text-green-700 bg-green-50 border-green-200",       bar: "bg-green-500"   },
  cukup:            { label: "Cukup",            emoji: "🟡", color: "text-amber-700 bg-amber-50 border-amber-200",       bar: "bg-amber-400"   },
  perlu_perbaikan:  { label: "Perlu Perbaikan",  emoji: "🟠", color: "text-orange-700 bg-orange-50 border-orange-200",   bar: "bg-orange-500"  },
  belum_layak:      { label: "Belum Layak",      emoji: "🔴", color: "text-red-700 bg-red-50 border-red-200",            bar: "bg-red-500"     },
};

export const CHECK_STATUS_STYLE: Record<CheckStatus, { dot: string; badge: string; icon: string }> = {
  baik:  { dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700", icon: "✓" },
  cukup: { dot: "bg-amber-400",   badge: "bg-amber-100 text-amber-700",     icon: "~" },
  buruk: { dot: "bg-red-500",     badge: "bg-red-100 text-red-700",         icon: "✗" },
};

// ─── Main analyzer ────────────────────────────────────────────────────────────

export function analyzeKelayakan(params: {
  n: number;
  validityResults: ValidityResult[];
  reliabilityResults: ReliabilityResult[];
  regressionResult: RegressionResult | null;
  multicollinearityResults: MulticollinearityResult[];
  normalityResult: NormalityResult | null;
  heteroskedasticityResults: HeteroskedasticityResult[];
}): KelayakanReport {
  const {
    n,
    validityResults,
    reliabilityResults,
    regressionResult,
    multicollinearityResults,
    normalityResult,
    heteroskedasticityResults,
  } = params;

  const checks: KelayakanCheck[] = [];
  const yangBaik: string[] = [];
  const yangPerluDiperbaiki: string[] = [];
  const saranPerbaikan: string[] = [];

  // ── 1. Jumlah Responden (15 pts) ──────────────────────────────────────────
  {
    let skor: number;
    let status: CheckStatus;
    let nilai: string;
    let detail: string;

    if (n >= 100) {
      skor = 15; status = "baik"; nilai = `${n} responden`;
      detail = "Jumlah responden sangat memadai untuk penelitian kuantitatif.";
      yangBaik.push(`Jumlah responden (${n} orang) sudah memenuhi syarat minimal.`);
    } else if (n >= 60) {
      skor = 12; status = "baik"; nilai = `${n} responden`;
      detail = "Jumlah responden cukup baik.";
      yangBaik.push(`Jumlah responden (${n} orang) sudah memadai.`);
    } else if (n >= 30) {
      skor = 8; status = "cukup"; nilai = `${n} responden`;
      detail = "Jumlah responden masih berada di batas minimum. Disarankan menambah.";
      yangPerluDiperbaiki.push(`Jumlah responden (${n} orang) masih di batas minimum.`);
      saranPerbaikan.push(`Disarankan menambah jumlah responden menjadi minimal 60–100 orang agar hasil analisis lebih akurat.`);
    } else {
      skor = 0; status = "buruk"; nilai = `${n} responden`;
      detail = "Jumlah responden terlalu sedikit. Analisis kurang dapat dipercaya.";
      yangPerluDiperbaiki.push(`Jumlah responden (${n} orang) terlalu sedikit untuk analisis kuantitatif.`);
      saranPerbaikan.push(`Tambahkan jumlah responden menjadi minimal 30 orang, dan idealnya 100 orang.`);
    }

    checks.push({ id: "responden", label: "Jumlah Responden", nilai, status, detail, skor, maxSkor: 15 });
  }

  // ── 2. Validitas (20 pts) ──────────────────────────────────────────────────
  {
    const totalItems   = validityResults.reduce((s, r) => s + r.items.length, 0);
    const validItems   = validityResults.reduce((s, r) => s + r.items.filter((i) => i.valid).length, 0);
    const invalidItems = validityResults.flatMap((r) => r.items.filter((i) => !i.valid).map((i) => i.item));
    const pct          = totalItems > 0 ? (validItems / totalItems) * 100 : 0;

    let skor: number;
    let status: CheckStatus;
    let detail: string;

    if (pct === 100) {
      skor = 20; status = "baik";
      detail = "Semua item pernyataan valid.";
      yangBaik.push("Seluruh item pernyataan kuesioner dinyatakan valid.");
    } else if (pct >= 80) {
      skor = 14; status = "cukup";
      detail = `${validItems} dari ${totalItems} item valid (${pct.toFixed(0)}%). Item tidak valid: ${invalidItems.join(", ")}.`;
      yangPerluDiperbaiki.push(`Ada ${invalidItems.length} item tidak valid: ${invalidItems.join(", ")}.`);
      saranPerbaikan.push(`Periksa dan revisi item pernyataan yang tidak valid, yaitu: ${invalidItems.join(", ")}.`);
    } else {
      skor = 5; status = "buruk";
      detail = `Hanya ${pct.toFixed(0)}% item valid. Banyak item yang perlu diperbaiki.`;
      yangPerluDiperbaiki.push(`Banyak item tidak valid (${invalidItems.length} item). Kuesioner perlu diperbaiki.`);
      saranPerbaikan.push(`Lakukan revisi besar pada kuesioner. Item tidak valid: ${invalidItems.slice(0, 5).join(", ")}${invalidItems.length > 5 ? " dll." : "."}`);
    }

    checks.push({
      id: "validitas", label: "Uji Validitas",
      nilai: `${validItems}/${totalItems} item valid (${pct.toFixed(0)}%)`,
      status, detail, skor, maxSkor: 20,
    });
  }

  // ── 3. Reliabilitas (20 pts) ───────────────────────────────────────────────
  {
    const alphas   = reliabilityResults.map((r) => r.cronbachAlpha);
    const minAlpha = alphas.length > 0 ? Math.min(...alphas) : 0;
    const notReliable = reliabilityResults.filter((r) => !r.reliable).map((r) => r.variableName);

    let skor: number;
    let status: CheckStatus;
    let detail: string;
    const alphaStr = alphas.map((a) => a.toFixed(3)).join(", ");

    if (minAlpha >= 0.80) {
      skor = 20; status = "baik";
      detail = `Semua variabel sangat reliabel (Alpha: ${alphaStr}).`;
      yangBaik.push("Seluruh variabel penelitian dinyatakan reliabel (Cronbach's Alpha ≥ 0,80).");
    } else if (minAlpha >= 0.70) {
      skor = 17; status = "baik";
      detail = `Semua variabel reliabel (Alpha: ${alphaStr}).`;
      yangBaik.push("Seluruh variabel penelitian dinyatakan reliabel.");
    } else if (minAlpha >= 0.60) {
      skor = 12; status = "cukup";
      detail = `Semua variabel memenuhi batas minimal reliabilitas (Alpha: ${alphaStr}).`;
      yangBaik.push("Semua variabel memenuhi batas minimal reliabilitas (Alpha ≥ 0,60).");
    } else {
      skor = 3; status = "buruk";
      detail = `Variabel berikut belum reliabel: ${notReliable.join(", ")}.`;
      yangPerluDiperbaiki.push(`Variabel ${notReliable.join(", ")} belum reliabel (Alpha < 0,60).`);
      saranPerbaikan.push(`Tinjau ulang item kuesioner pada variabel ${notReliable.join(", ")} yang belum reliabel. Pertimbangkan menghapus item dengan nilai korelasi rendah.`);
    }

    checks.push({
      id: "reliabilitas", label: "Uji Reliabilitas",
      nilai: `Min. Alpha = ${minAlpha.toFixed(3)}`,
      status, detail, skor, maxSkor: 20,
    });
  }

  // ── 4. Regresi / Uji F (20 pts) ───────────────────────────────────────────
  {
    if (!regressionResult) {
      checks.push({ id: "regresi", label: "Model Regresi (Uji F)", nilai: "—", status: "buruk", detail: "Data tidak cukup untuk regresi.", skor: 0, maxSkor: 20 });
      yangPerluDiperbaiki.push("Model regresi belum dapat dihitung. Pastikan variabel X1, X2, dan Y sudah di-mapping.");
      saranPerbaikan.push("Lakukan mapping variabel X1, X2, dan Y terlebih dahulu di halaman Mapping Variabel.");
    } else {
      const sigF = regressionResult.fSig;
      const fVal = regressionResult.fValue;

      // Also check partial (uji t)
      const allSig    = regressionResult.variables.every((k) => regressionResult.pValues[k] < 0.05);
      const someSig   = regressionResult.variables.some((k) => regressionResult.pValues[k] < 0.05);
      const notSigVars= regressionResult.variables.filter((k) => regressionResult.pValues[k] >= 0.05)
        .map((k, i) => regressionResult.variableNames[i] ?? k);

      let skor: number;
      let status: CheckStatus;
      let detail: string;

      if (sigF < 0.05) {
        skor = 20; status = "baik";
        detail = `Model regresi signifikan (F = ${fVal.toFixed(3)}, Sig. = ${sigF.toFixed(3)}).`;
        yangBaik.push("Model regresi dinyatakan layak/fit (Sig. F < 0,05).");
      } else {
        skor = 5; status = "buruk";
        detail = `Model regresi belum signifikan (F = ${fVal.toFixed(3)}, Sig. = ${sigF.toFixed(3)}).`;
        yangPerluDiperbaiki.push(`Model regresi belum signifikan (Sig. F = ${sigF.toFixed(3)} ≥ 0,05).`);
        saranPerbaikan.push("Pertimbangkan menambah jumlah responden atau mengevaluasi kembali pilihan variabel penelitian.");
      }

      checks.push({ id: "regresi", label: "Model Regresi (Uji F)", nilai: `F = ${fVal.toFixed(3)}, Sig. = ${sigF.toFixed(3)}`, status, detail, skor, maxSkor: 20 });

      // Uji t — masuk ke asumsi klasik skor tapi tampilkan sebagai check terpisah
      let tStatus: CheckStatus;
      let tDetail: string;
      if (allSig) {
        tStatus = "baik"; tDetail = "Semua variabel berpengaruh signifikan secara parsial.";
        yangBaik.push("Semua variabel independen berpengaruh signifikan terhadap variabel dependen.");
      } else if (someSig) {
        tStatus = "cukup"; tDetail = `Sebagian variabel signifikan. Tidak signifikan: ${notSigVars.join(", ")}.`;
        yangPerluDiperbaiki.push(`Variabel ${notSigVars.join(", ")} belum berpengaruh signifikan secara parsial.`);
        saranPerbaikan.push(`Evaluasi kembali apakah variabel ${notSigVars.join(", ")} relevan dengan topik penelitian Anda.`);
      } else {
        tStatus = "buruk"; tDetail = "Tidak ada variabel yang berpengaruh signifikan secara parsial.";
        yangPerluDiperbaiki.push("Tidak ada variabel independen yang berpengaruh signifikan terhadap variabel dependen.");
        saranPerbaikan.push("Evaluasi ulang variabel penelitian. Pastikan X1 dan X2 memang memiliki hubungan dengan Y berdasarkan kajian teori.");
      }

      checks.push({ id: "uji_t", label: "Uji t (Parsial)", nilai: allSig ? "Semua signifikan" : someSig ? "Sebagian signifikan" : "Tidak ada signifikan", status: tStatus, detail: tDetail, skor: 0, maxSkor: 0 });
    }
  }

  // ── 5. Asumsi Klasik (15 pts) ─────────────────────────────────────────────

  // Multikolinearitas (5 pts)
  {
    const allOk = multicollinearityResults.every((r) => r.tolerance > 0.1 && r.vif < 10);
    const problematic = multicollinearityResults.filter((r) => r.tolerance <= 0.1 || r.vif >= 10).map((r) => r.variableName);

    checks.push({
      id: "multikolinearitas", label: "Multikolinearitas",
      nilai: allOk ? "Tidak ada masalah" : `Bermasalah: ${problematic.join(", ")}`,
      status: allOk ? "baik" : "buruk",
      detail: allOk
        ? "Tidak ada korelasi berlebihan antar variabel independen. Model aman."
        : `Variabel ${problematic.join(", ")} menunjukkan tanda multikolinearitas.`,
      skor: allOk ? 5 : 0, maxSkor: 5,
    });
    if (allOk) yangBaik.push("Tidak terjadi multikolinearitas antar variabel independen.");
    else {
      yangPerluDiperbaiki.push(`Terjadi multikolinearitas pada variabel: ${problematic.join(", ")}.`);
      saranPerbaikan.push(`Pertimbangkan menghapus salah satu variabel yang berkorelasi tinggi atau menggabungkan indikator.`);
    }
  }

  // Normalitas (5 pts)
  {
    const isNormal = normalityResult ? Math.abs(normalityResult.meanResidual) < 0.5 : false;
    checks.push({
      id: "normalitas", label: "Normalitas Residual",
      nilai: normalityResult ? `Mean residual = ${normalityResult.meanResidual.toFixed(4)}` : "—",
      status: !normalityResult ? "buruk" : isNormal ? "baik" : "cukup",
      detail: !normalityResult
        ? "Tidak dapat dihitung."
        : isNormal
        ? "Residual mendekati distribusi normal (mean ≈ 0)."
        : "Residual menunjukkan sedikit penyimpangan dari normal. Disarankan konfirmasi dengan SPSS.",
      skor: !normalityResult ? 0 : isNormal ? 5 : 2, maxSkor: 5,
    });
    if (normalityResult && isNormal) yangBaik.push("Residual model regresi mendekati distribusi normal.");
    else if (normalityResult) {
      yangPerluDiperbaiki.push("Distribusi residual perlu dikonfirmasi dengan uji formal (Kolmogorov-Smirnov di SPSS).");
      saranPerbaikan.push("Lakukan uji normalitas formal di SPSS (Analyze → Regression → Residuals → Kolmogorov-Smirnov).");
    }
  }

  // Heteroskedastisitas (5 pts)
  {
    const allOk = heteroskedasticityResults.every((r) => Math.abs(r.correlation) < 0.2);
    checks.push({
      id: "heteroskedastisitas", label: "Heteroskedastisitas",
      nilai: allOk ? "Tidak terdeteksi" : "Terindikasi",
      status: allOk ? "baik" : "buruk",
      detail: allOk
        ? "Tidak ditemukan pola heteroskedastisitas pada residual model."
        : "Terdeteksi kemungkinan heteroskedastisitas. Disarankan konfirmasi di SPSS.",
      skor: allOk ? 5 : 0, maxSkor: 5,
    });
    if (allOk) yangBaik.push("Tidak terjadi heteroskedastisitas pada model regresi.");
    else {
      yangPerluDiperbaiki.push("Terindikasi heteroskedastisitas pada model.");
      saranPerbaikan.push("Lakukan uji Glejser formal di SPSS untuk konfirmasi heteroskedastisitas.");
    }
  }

  // ── 6. Kelengkapan Data (10 pts) ──────────────────────────────────────────
  {
    const hasRegression = regressionResult !== null;
    const hasValidity   = validityResults.length > 0;
    const hasReliability= reliabilityResults.length > 0;
    let skor = 0;
    if (hasValidity)   skor += 3;
    if (hasReliability) skor += 3;
    if (hasRegression)  skor += 4;

    checks.push({
      id: "kelengkapan", label: "Kelengkapan Data & Variabel",
      nilai: `${hasValidity ? "✓" : "✗"} Validitas · ${hasReliability ? "✓" : "✗"} Reliabilitas · ${hasRegression ? "✓" : "✗"} Regresi`,
      status: skor === 10 ? "baik" : skor >= 6 ? "cukup" : "buruk",
      detail: skor === 10 ? "Semua komponen analisis tersedia." : "Beberapa komponen analisis belum tersedia.",
      skor, maxSkor: 10,
    });
  }

  // ── Total skor ─────────────────────────────────────────────────────────────
  const totalSkor = checks
    .filter((c) => c.maxSkor > 0)
    .reduce((sum, c) => sum + c.skor, 0);

  const statusLabel = getStatusLabel(totalSkor);

  // ── Kesimpulan ─────────────────────────────────────────────────────────────
  const kesimpulan = buildKesimpulan(totalSkor, statusLabel, yangBaik, yangPerluDiperbaiki);

  // ── Insight Engine ─────────────────────────────────────────────────────────
  const insight = generateInsight({
    n, totalSkor, statusLabel,
    validityResults, reliabilityResults, regressionResult,
    multicollinearityResults, normalityResult, heteroskedasticityResults,
    yangBaik, yangPerluDiperbaiki, saranPerbaikan,
  });

  return { totalSkor, statusLabel, checks, yangBaik, yangPerluDiperbaiki, saranPerbaikan, kesimpulan, insight };
}

// ─── Insight Engine ───────────────────────────────────────────────────────────

interface InsightParams {
  n: number;
  totalSkor: number;
  statusLabel: StatusLevel;
  validityResults: ValidityResult[];
  reliabilityResults: ReliabilityResult[];
  regressionResult: RegressionResult | null;
  multicollinearityResults: MulticollinearityResult[];
  normalityResult: NormalityResult | null;
  heteroskedasticityResults: HeteroskedasticityResult[];
  yangBaik: string[];
  yangPerluDiperbaiki: string[];
  saranPerbaikan: string[];
}

export function generateInsight(p: InsightParams): InsightReport {
  const {
    n, totalSkor, statusLabel,
    validityResults, reliabilityResults, regressionResult,
    multicollinearityResults, normalityResult, heteroskedasticityResults,
  } = p;

  // ── Pre-compute metrics ────────────────────────────────────────────────────

  const totalItems   = validityResults.reduce((s, r) => s + r.items.length, 0);
  const validItems   = validityResults.reduce((s, r) => s + r.items.filter((i) => i.valid).length, 0);
  const invalidItems = validityResults.flatMap((r) => r.items.filter((i) => !i.valid).map((i) => i.item));
  const validPct     = totalItems > 0 ? Math.round((validItems / totalItems) * 100) : 0;

  const alphas    = reliabilityResults.map((r) => r.cronbachAlpha);
  const minAlpha  = alphas.length > 0 ? Math.min(...alphas) : 0;
  const notReliableVars = reliabilityResults.filter((r) => !r.reliable).map((r) => r.variableName);

  const sigF     = regressionResult?.fSig ?? null;
  const fValue   = regressionResult?.fValue ?? null;
  const rSquare  = regressionResult?.rSquare ?? null;
  const xNames   = regressionResult?.variableNames ?? [];
  const yName    = regressionResult ? "(variabel dependen)" : "";

  const notSigVars = regressionResult
    ? regressionResult.variables.filter((k) => regressionResult.pValues[k] >= 0.05)
        .map((k, i) => regressionResult.variableNames[i] ?? k)
    : [];
  const sigVarsCount = regressionResult
    ? regressionResult.variables.filter((k) => regressionResult.pValues[k] < 0.05).length
    : 0;

  const allMkOk    = multicollinearityResults.every((r) => r.tolerance > 0.1 && r.vif < 10);
  const mkProblems = multicollinearityResults.filter((r) => r.tolerance <= 0.1 || r.vif >= 10).map((r) => r.variableName);

  const isNormal   = normalityResult ? Math.abs(normalityResult.meanResidual) < 0.5 : true;
  const allHoOk    = heteroskedasticityResults.every((r) => Math.abs(r.correlation) < 0.2);

  // ── 1. Ringkasan Hasil ────────────────────────────────────────────────────

  const ringkasan = buildRingkasan({
    n, totalSkor, statusLabel, totalItems, validItems, validPct,
    minAlpha, alphas, sigF, fValue, rSquare, xNames,
  });

  // ── 2. Yang Sudah Baik ────────────────────────────────────────────────────

  const yangBaikInsight: string[] = [];
  if (n >= 100) yangBaikInsight.push(`Jumlah responden sangat memadai (${n} orang). Data memiliki representasi yang baik untuk dianalisis secara statistik.`);
  else if (n >= 60) yangBaikInsight.push(`Jumlah responden sudah cukup (${n} orang) untuk menghasilkan analisis yang memadai.`);
  else if (n >= 30) yangBaikInsight.push(`Jumlah responden sudah memenuhi syarat minimum (${n} orang).`);

  if (validPct === 100) yangBaikInsight.push(`Seluruh ${totalItems} item pernyataan kuesioner dinyatakan valid. Ini berarti setiap pernyataan benar-benar mengukur apa yang ingin diukur.`);
  else if (validPct >= 80) yangBaikInsight.push(`Sebagian besar item valid (${validItems} dari ${totalItems} item, ${validPct}%). Kuesioner sudah cukup baik mengukur variabel penelitian.`);

  if (minAlpha >= 0.80) yangBaikInsight.push(`Semua variabel memiliki nilai Cronbach's Alpha ≥ 0,80. Artinya kuesioner sangat konsisten — jika disebarkan ulang, jawaban responden akan relatif sama.`);
  else if (minAlpha >= 0.70) yangBaikInsight.push(`Semua variabel reliabel dengan Alpha ≥ 0,70. Kuesioner sudah konsisten dalam mengukur setiap variabel penelitian.`);
  else if (minAlpha >= 0.60) yangBaikInsight.push(`Semua variabel memenuhi batas minimum reliabilitas (Alpha ≥ 0,60). Kuesioner dapat digunakan, meskipun masih ada ruang untuk perbaikan.`);

  if (sigF !== null && sigF < 0.05) yangBaikInsight.push(`Model regresi terbukti signifikan (Sig. F = ${sigF.toFixed(3)} < 0,05). Artinya variabel yang Anda pilih (${xNames.join(" dan ")}) secara bersama-sama memang berpengaruh terhadap variabel yang diteliti.`);

  if (sigVarsCount === (regressionResult?.variables.length ?? 0) && sigVarsCount > 0) yangBaikInsight.push(`Semua variabel independen (${xNames.join(", ")}) berpengaruh signifikan secara parsial. Ini menguatkan hipotesis penelitian Anda.`);

  if (allMkOk) yangBaikInsight.push(`Tidak ada masalah multikolinearitas. Artinya variabel X1 dan X2 tidak saling mengganggu satu sama lain dalam model regresi.`);
  if (isNormal) yangBaikInsight.push(`Distribusi residual mendekati normal. Model regresi sudah memenuhi salah satu asumsi penting statistik.`);
  if (allHoOk) yangBaikInsight.push(`Tidak terdeteksi heteroskedastisitas. Varians galat model sudah stabil di seluruh rentang data.`);

  // ── 3. Yang Perlu Diperhatikan ────────────────────────────────────────────

  const yangPerluDiperhatikan: string[] = [];

  if (n < 30) yangPerluDiperhatikan.push(`Jumlah responden sangat sedikit (${n} orang). Dalam metodologi penelitian kuantitatif, jumlah ini belum memenuhi syarat minimum. Hasil analisis yang diperoleh perlu ditafsirkan dengan sangat hati-hati.`);
  else if (n < 60) yangPerluDiperhatikan.push(`Jumlah responden masih di batas minimum (${n} orang). Penambahan responden akan meningkatkan akurasi dan kepercayaan hasil analisis.`);

  if (invalidItems.length > 0) yangPerluDiperhatikan.push(`Terdapat ${invalidItems.length} item pernyataan yang tidak valid: ${invalidItems.join(", ")}. Item-item ini tidak mengukur apa yang dimaksud dengan baik dan sebaiknya direvisi atau dihapus.`);

  if (notReliableVars.length > 0) yangPerluDiperhatikan.push(`Variabel ${notReliableVars.join(" dan ")} belum reliabel (Cronbach's Alpha < 0,60). Ini berarti responden menjawab butir pernyataan pada variabel tersebut dengan tidak konsisten.`);

  if (sigF !== null && sigF >= 0.05) yangPerluDiperhatikan.push(`Model regresi belum signifikan (Sig. F = ${sigF.toFixed(3)} ≥ 0,05). Secara statistik, variabel yang dipilih belum terbukti mempengaruhi variabel dependen secara bersama-sama. Ini adalah hal yang paling perlu diperhatikan.`);

  if (notSigVars.length > 0) yangPerluDiperhatikan.push(`Variabel ${notSigVars.join(" dan ")} belum berpengaruh signifikan secara parsial (Sig. > 0,05). Perlu dievaluasi apakah variabel ini relevan dengan topik penelitian.`);

  if (!allMkOk) yangPerluDiperhatikan.push(`Terdapat indikasi multikolinearitas pada variabel ${mkProblems.join(", ")}. Variabel-variabel ini berkorelasi terlalu tinggi satu sama lain, yang dapat memengaruhi keandalan koefisien regresi.`);

  if (!isNormal && normalityResult) yangPerluDiperhatikan.push(`Distribusi residual menunjukkan penyimpangan dari normalitas. Disarankan melakukan konfirmasi dengan uji Kolmogorov-Smirnov di SPSS sebelum mengambil kesimpulan akhir.`);

  if (!allHoOk) yangPerluDiperhatikan.push(`Terindikasi adanya heteroskedastisitas, yang berarti varians galat tidak stabil. Hal ini dapat mempengaruhi ketepatan estimasi koefisien regresi.`);

  // ── 4. Kemungkinan Penyebab ───────────────────────────────────────────────

  const kemungkinanPenyebab: string[] = [];

  if (n < 30) {
    kemungkinanPenyebab.push(
      `Responden terlalu sedikit (${n} orang): Dengan jumlah sekecil ini, daya uji statistik (statistical power) sangat lemah. Bahkan jika hubungan antar variabel sebenarnya ada, uji statistik kemungkinan tidak akan mendeteksinya. Ini menyebabkan banyak nilai Sig. menjadi besar (tidak signifikan) meskipun secara substansi ada pengaruh.`
    );
  } else if (n < 60) {
    kemungkinanPenyebab.push(
      `Responden di batas minimum (${n} orang): Penambahan 20–40 responden lagi akan meningkatkan daya uji statistik secara signifikan, terutama untuk mendeteksi pengaruh variabel yang mungkin nilainya kecil namun nyata.`
    );
  }

  if (invalidItems.length > 0) {
    kemungkinanPenyebab.push(
      `Item tidak valid (${invalidItems.join(", ")}): Kemungkinan penyebabnya adalah: (1) Pernyataan terlalu ambigu atau bermakna ganda sehingga responden menginterpretasikannya secara berbeda-beda; (2) Pernyataan mengandung dua ide sekaligus (double-barreled); (3) Pilihan kata terlalu teknis atau tidak familiar bagi responden; (4) Pernyataan ini sebenarnya mengukur aspek yang berbeda dari indikator yang dimaksud.`
    );
  }

  if (notReliableVars.length > 0) {
    kemungkinanPenyebab.push(
      `Reliabilitas rendah pada variabel ${notReliableVars.join(", ")}: Nilai Alpha yang rendah menunjukkan inkonsistensi internal kuesioner. Kemungkinan penyebab: (1) Butir-butir pernyataan mengukur aspek yang berbeda-beda dan tidak saling berkorelasi; (2) Ada butir yang dijawab secara terbalik (reversed item) tanpa disadari; (3) Responden kurang memahami beberapa pernyataan sehingga menjawab secara tidak konsisten; (4) Skala respons terlalu luas atau membingungkan.`
    );
  }

  if (sigF !== null && sigF >= 0.05) {
    const xList = xNames.join(" dan ");
    kemungkinanPenyebab.push(
      `Model regresi tidak signifikan (Sig. F = ${sigF.toFixed(3)}): Ada beberapa kemungkinan penyebab: (1) Jumlah responden belum cukup untuk mendeteksi pengaruh yang ada — statistik membutuhkan ukuran sampel yang memadai; (2) Variabel ${xList} yang dipilih mungkin bukan faktor utama yang mempengaruhi variabel dependen. Faktor lain di luar model mungkin lebih berpengaruh; (3) Cara pengukuran variabel (kuesioner) belum cukup akurat menangkap konstruk yang dimaksud; (4) Mungkin hubungan antar variabel bersifat non-linear, sehingga regresi linear kurang tepat digunakan.`
    );
  }

  if (notSigVars.length > 0 && sigF !== null && sigF < 0.05) {
    kemungkinanPenyebab.push(
      `Variabel ${notSigVars.join(" dan ")} tidak signifikan secara parsial: Walaupun model secara keseluruhan signifikan, beberapa variabel mungkin memiliki pengaruh yang kecil atau ditutupi oleh pengaruh variabel lain yang lebih dominan. Perlu dikaji ulang relevansi teoritis variabel tersebut dengan topik penelitian.`
    );
  }

  if (!allMkOk) {
    kemungkinanPenyebab.push(
      `Multikolinearitas pada ${mkProblems.join(", ")}: Ini sering terjadi ketika dua variabel independen mengukur konsep yang sangat serupa atau tumpang tindih. Misalnya, jika X1 dan X2 keduanya berkaitan dengan aspek pelayanan atau keduanya mencerminkan persepsi kualitas, mereka akan cenderung berkorelasi tinggi. Akibatnya, model regresi kesulitan memisahkan pengaruh masing-masing variabel.`
    );
  }

  if (!isNormal && normalityResult) {
    kemungkinanPenyebab.push(
      `Penyimpangan normalitas residual: Kemungkinan disebabkan oleh adanya outlier (nilai ekstrem) dalam data, atau distribusi skor responden yang sangat condong ke satu arah (skewed). Bisa juga terjadi karena ukuran sampel yang masih relatif kecil — dengan sampel besar, distribusi residual cenderung lebih normal secara alamiah (Central Limit Theorem).`
    );
  }

  if (!allHoOk) {
    kemungkinanPenyebab.push(
      `Heteroskedastisitas: Kemungkinan ada pola sistematis dalam data yang menyebabkan varians galat tidak konstan. Misalnya, responden dengan skor variabel independen tinggi cenderung lebih beragam jawabannya dibanding yang skor rendah. Ini bisa juga disebabkan oleh adanya kelompok subpopulasi yang berbeda karakteristiknya dalam data.`
    );
  }

  if (kemungkinanPenyebab.length === 0) {
    kemungkinanPenyebab.push(`Data Anda tidak menunjukkan masalah yang perlu dijelaskan penyebabnya. Seluruh komponen analisis berada dalam kondisi baik.`);
  }

  // ── 5. Saran Perbaikan ────────────────────────────────────────────────────

  const saranPerbaikanInsight: string[] = [];

  if (n < 30) {
    saranPerbaikanInsight.push(`Segera tambahkan jumlah responden menjadi minimal 30 orang (idealnya 100 orang). Sebarkan kembali kuesioner ke lebih banyak responden yang sesuai dengan karakteristik populasi penelitian Anda.`);
  } else if (n < 60) {
    saranPerbaikanInsight.push(`Pertimbangkan menambah 20–40 responden lagi untuk meningkatkan kekuatan statistik. Ini akan membuat hasil analisis lebih akurat dan meyakinkan.`);
  }

  if (invalidItems.length > 0) {
    saranPerbaikanInsight.push(`Revisi item yang tidak valid (${invalidItems.join(", ")}): Baca ulang setiap pernyataan dan pastikan kalimatnya jelas, spesifik, dan hanya mengandung satu ide. Konsultasikan dengan dosen pembimbing atau lakukan pilot test pada 10–15 responden sebelum penyebaran resmi.`);
  }

  if (notReliableVars.length > 0) {
    saranPerbaikanInsight.push(`Evaluasi kuesioner untuk variabel ${notReliableVars.join(", ")}: Identifikasi item dengan nilai korelasi item-total yang paling rendah (biasanya < 0,20) dan pertimbangkan untuk menghapus atau menggantinya. Setelah revisi, lakukan uji coba ulang (re-pilot) untuk memastikan Alpha meningkat.`);
  }

  if (sigF !== null && sigF >= 0.05) {
    saranPerbaikanInsight.push(`Untuk memperbaiki signifikansi model regresi: (1) Tambah jumlah responden; (2) Evaluasi apakah variabel X yang dipilih benar-benar memiliki landasan teori yang kuat bahwa ia mempengaruhi Y; (3) Pertimbangkan merevisi indikator kuesioner agar lebih tepat mengukur konstruk; (4) Diskusikan dengan dosen pembimbing apakah perlu mengganti atau menambah variabel penelitian.`);
  }

  if (notSigVars.length > 0) {
    saranPerbaikanInsight.push(`Untuk variabel ${notSigVars.join(", ")} yang tidak signifikan: Kaji ulang literatur apakah ada penelitian terdahulu yang menemukan hasil serupa. Jika konsisten tidak signifikan, Anda dapat mendiskusikannya sebagai temuan menarik dalam bagian pembahasan.`);
  }

  if (!allMkOk) {
    saranPerbaikanInsight.push(`Untuk mengatasi multikolinearitas: Pertimbangkan untuk menggabungkan indikator-indikator yang tumpang tindih, atau menghapus salah satu variabel independen yang paling berkorelasi. Bisa juga mencoba metode analisis lain seperti PLS-SEM jika multikolinearitas tidak bisa dihindari.`);
  }

  if (!allHoOk) {
    saranPerbaikanInsight.push(`Untuk mengatasi heteroskedastisitas: Coba lakukan transformasi data (log, sqrt) pada variabel dependen, atau gunakan metode Weighted Least Squares (WLS) di SPSS. Konfirmasi terlebih dahulu dengan uji Glejser formal.`);
  }

  if (saranPerbaikanInsight.length === 0) {
    saranPerbaikanInsight.push(`Pertahankan kualitas data yang sudah baik. Anda dapat langsung melanjutkan ke tahap analisis dan penulisan BAB IV.`);
  }

  // ── 6. Kesimpulan Akhir ───────────────────────────────────────────────────

  const statusMeta = { sangat_baik: "Sangat Baik", baik: "Baik", cukup: "Cukup", perlu_perbaikan: "Perlu Perbaikan", belum_layak: "Belum Layak" };
  const statusStr  = statusMeta[statusLabel];

  let kesimpulanAkhir =
    `Berdasarkan hasil pemeriksaan menyeluruh terhadap data penelitian Anda, diperoleh Skor Kelayakan sebesar ${totalSkor}/100 dengan status ${statusStr}. `;

  if (totalSkor >= 85) {
    kesimpulanAkhir += `Data penelitian Anda berada dalam kondisi prima dan siap untuk dianalisis serta ditulis dalam BAB IV skripsi. Seluruh komponen statistik — validitas, reliabilitas, regresi, dan asumsi klasik — telah memenuhi standar yang disyaratkan. Selamat! Anda dapat melanjutkan ke tahap analisis dan penulisan.`;
  } else if (totalSkor >= 70) {
    kesimpulanAkhir += `Data penelitian Anda sudah layak digunakan. ${p.yangBaik.length > 0 ? p.yangBaik[0] : ""} Namun ada beberapa hal minor yang perlu diperhatikan. Anda dapat melanjutkan ke analisis sambil mendokumentasikan keterbatasan-keterbatasan tersebut dalam bagian pembahasan skripsi Anda.`;
  } else if (totalSkor >= 55) {
    kesimpulanAkhir += `Data penelitian Anda sudah cukup layak, namun terdapat beberapa kelemahan yang sebaiknya diperbaiki terlebih dahulu. Pertimbangkan untuk menindaklanjuti saran-saran perbaikan di atas sebelum melanjutkan ke penulisan BAB IV, agar hasil penelitian lebih kuat dan dapat dipertahankan di hadapan penguji.`;
  } else if (totalSkor >= 40) {
    kesimpulanAkhir += `Data penelitian Anda memerlukan perbaikan yang cukup signifikan sebelum dapat dianalisis. Prioritaskan perbaikan pada komponen dengan skor paling rendah. Diskusikan kondisi data ini dengan dosen pembimbing Anda untuk mendapatkan arahan yang tepat.`;
  } else {
    kesimpulanAkhir += `Data penelitian Anda belum memenuhi syarat kelayakan untuk analisis statistik yang valid. Diperlukan perbaikan mendasar — terutama pada jumlah responden, validitas, dan reliabilitas instrumen. Konsultasikan segera dengan dosen pembimbing sebelum melanjutkan penelitian.`;
  }

  return {
    ringkasan,
    yangBaik: yangBaikInsight,
    yangPerluDiperhatikan,
    kemungkinanPenyebab,
    saranPerbaikan: saranPerbaikanInsight,
    kesimpulanAkhir,
  };
}

// ─── Ringkasan builder ────────────────────────────────────────────────────────

function buildRingkasan(p: {
  n: number; totalSkor: number; statusLabel: StatusLevel;
  totalItems: number; validItems: number; validPct: number;
  minAlpha: number; alphas: number[];
  sigF: number | null; fValue: number | null; rSquare: number | null;
  xNames: string[];
}): string {
  const statusStr = { sangat_baik: "Sangat Baik", baik: "Baik", cukup: "Cukup", perlu_perbaikan: "Perlu Perbaikan", belum_layak: "Belum Layak" }[p.statusLabel];

  let text = `Penelitian ini menggunakan data dari ${p.n} responden`;
  if (p.xNames.length > 0) text += ` dengan variabel independen ${p.xNames.join(" dan ")}`;
  text += `. Skor kelayakan data secara keseluruhan adalah ${p.totalSkor}/100 (${statusStr}). `;

  if (p.totalItems > 0) {
    text += `Hasil uji validitas menunjukkan ${p.validItems} dari ${p.totalItems} item pernyataan valid (${p.validPct}%). `;
  }

  if (p.alphas.length > 0) {
    text += `Nilai Cronbach's Alpha terendah adalah ${p.minAlpha.toFixed(3)}, `;
    text += p.minAlpha >= 0.70 ? `yang berarti instrumen sudah reliabel. ` : `yang berarti ada variabel yang perlu diperbaiki. `;
  }

  if (p.sigF !== null && p.fValue !== null) {
    text += `Model regresi memiliki nilai F = ${p.fValue.toFixed(3)} dengan Sig. = ${p.sigF.toFixed(3)}, `;
    text += p.sigF < 0.05 ? `sehingga model dinyatakan signifikan dan layak digunakan. ` : `sehingga model belum terbukti signifikan secara statistik. `;
  }

  if (p.rSquare !== null) {
    text += `Koefisien determinasi (R²) = ${(p.rSquare * 100).toFixed(1)}%, yang berarti variabel independen menjelaskan ${(p.rSquare * 100).toFixed(1)}% variasi pada variabel dependen.`;
  }

  return text;
}

// ─── Kesimpulan generator ─────────────────────────────────────────────────────

function buildKesimpulan(
  skor: number,
  status: StatusLevel,
  baik: string[],
  perlu: string[]
): string {
  const opening =
    status === "sangat_baik"
      ? "Secara keseluruhan, data penelitian Anda berada dalam kondisi sangat baik dan siap untuk dianalisis lebih lanjut."
    : status === "baik"
      ? "Secara umum, data penelitian Anda sudah layak digunakan untuk analisis statistik."
    : status === "cukup"
      ? "Data penelitian Anda sudah cukup layak, namun masih terdapat beberapa hal yang perlu diperhatikan sebelum melanjutkan analisis."
    : status === "perlu_perbaikan"
      ? "Data penelitian Anda masih memerlukan perbaikan sebelum dapat dianalisis lebih lanjut."
    : "Data penelitian Anda belum layak untuk dianalisis. Diperlukan perbaikan yang cukup signifikan.";

  const goodPart =
    baik.length > 0
      ? ` ${baik.slice(0, 3).join(" ")}`
      : "";

  const badPart =
    perlu.length > 0
      ? ` Namun, masih terdapat hal yang perlu diperbaiki: ${perlu.slice(0, 2).join("; ")}.`
      : " Tidak ditemukan masalah signifikan pada data Anda.";

  const closing =
    skor >= 85
      ? " Silakan lanjutkan ke tahap analisis statistik."
    : skor >= 70
      ? " Anda dapat melanjutkan ke analisis sambil memperhatikan saran perbaikan di atas."
    : skor >= 55
      ? " Disarankan melakukan perbaikan terlebih dahulu sebelum melanjutkan ke analisis."
    : " Selesaikan perbaikan data terlebih dahulu untuk mendapatkan hasil analisis yang valid dan dapat dipertanggungjawabkan.";

  return `${opening}${goodPart}${badPart}${closing}`;
}
