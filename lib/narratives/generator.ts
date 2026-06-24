import {
  ValidityResult,
  ReliabilityResult,
  RegressionResult,
  MulticollinearityResult,
  NormalityResult,
  HeteroskedasticityResult,
  VariableConfig,
} from "@/types";

function fmt(n: number, decimals = 3): string {
  return n.toFixed(decimals);
}

export function narrativeValiditas(results: ValidityResult[]): string {
  const lines: string[] = [];
  lines.push("**Hasil Uji Validitas**\n");
  lines.push(
    "Uji validitas dilakukan dengan menggunakan korelasi Pearson Product Moment antara skor item dengan skor total. " +
    "Suatu item dinyatakan valid apabila nilai r hitung lebih besar dari r tabel.\n"
  );

  for (const res of results) {
    const validCount = res.items.filter((i) => i.valid).length;
    const invalidItems = res.items.filter((i) => !i.valid).map((i) => i.item);
    lines.push(
      `Pada variabel **${res.variableName} (${res.variableKey})** dengan jumlah responden n = ${res.n}, ` +
      `diperoleh hasil bahwa ${validCount} dari ${res.items.length} item pernyataan dinyatakan valid. ` +
      (invalidItems.length > 0
        ? `Item yang tidak valid adalah: ${invalidItems.join(", ")}. Item-item tersebut sebaiknya direvisi atau dihapus dari kuesioner.`
        : "Seluruh item pernyataan dinyatakan valid karena nilai r hitung melebihi nilai r tabel.")
    );
    lines.push("");
  }

  return lines.join("\n");
}

export function narrativeReliabilitas(results: ReliabilityResult[]): string {
  const lines: string[] = [];
  lines.push("**Hasil Uji Reliabilitas**\n");
  lines.push(
    "Uji reliabilitas menggunakan metode Cronbach's Alpha. Instrumen penelitian dinyatakan reliabel " +
    "apabila nilai Cronbach's Alpha ≥ 0,60.\n"
  );

  for (const res of results) {
    lines.push(
      `Variabel **${res.variableName} (${res.variableKey})** memiliki nilai Cronbach's Alpha sebesar ${fmt(res.cronbachAlpha, 3)}, ` +
      `yang termasuk dalam kategori **${res.category}**. ` +
      (res.reliable
        ? "Dengan demikian, instrumen pada variabel ini dinyatakan **reliabel** dan dapat digunakan sebagai alat ukur yang konsisten."
        : "Dengan demikian, instrumen pada variabel ini **belum reliabel** dan perlu dilakukan perbaikan kuesioner.")
    );
    lines.push("");
  }

  return lines.join("\n");
}

export function narrativeRegresi(result: RegressionResult, yName: string): string {
  const lines: string[] = [];
  lines.push("**Hasil Analisis Regresi Linear Berganda**\n");

  const varParts = result.variables.map((key, i) => {
    const b = result.coefficients[key];
    return `${b >= 0 ? "+" : ""} ${fmt(b, 3)}${key}`;
  });

  lines.push(
    `Berdasarkan hasil analisis regresi linear berganda, diperoleh persamaan regresi sebagai berikut:\n\n` +
    `**Y = ${fmt(result.coefficients.intercept, 3)} ${varParts.join(" ")}**\n\n` +
    `Di mana Y merupakan variabel ${yName}.`
  );
  lines.push("");

  lines.push("Interpretasi koefisien regresi:\n");
  lines.push(
    `- Konstanta (a) sebesar **${fmt(result.coefficients.intercept, 3)}** berarti apabila seluruh variabel independen bernilai 0, ` +
    `maka variabel ${yName} memiliki nilai sebesar ${fmt(result.coefficients.intercept, 3)}.`
  );

  result.variables.forEach((key, i) => {
    const name = result.variableNames[i];
    const b = result.coefficients[key];
    const direction = b >= 0 ? "positif" : "negatif";
    lines.push(
      `- Koefisien ${key} (${name}) sebesar **${fmt(b, 3)}** menunjukkan pengaruh ${direction} terhadap ${yName}. ` +
      `Setiap kenaikan 1 satuan ${name} akan ${b >= 0 ? "meningkatkan" : "menurunkan"} ${yName} sebesar ${fmt(Math.abs(b), 3)} satuan.`
    );
  });

  return lines.join("\n");
}

export function narrativeUjiT(result: RegressionResult, yName: string): string {
  const lines: string[] = [];
  lines.push("**Hasil Uji t (Parsial)**\n");
  lines.push(
    "Uji t dilakukan untuk mengetahui pengaruh masing-masing variabel independen secara parsial terhadap variabel dependen. " +
    "Hipotesis diterima apabila nilai signifikansi < 0,05.\n"
  );

  result.variables.forEach((key, i) => {
    const name = result.variableNames[i];
    const t = result.tValues[key];
    const sig = result.pValues[key];
    const berpengaruh = sig < 0.05;
    lines.push(
      `Variabel **${name} (${key})** memiliki nilai t hitung sebesar **${fmt(t, 3)}** dengan signifikansi sebesar **${fmt(sig, 3)}**. ` +
      (berpengaruh
        ? `Karena nilai signifikansi (${fmt(sig, 3)}) < 0,05, maka ${name} berpengaruh **signifikan secara parsial** terhadap ${yName}.`
        : `Karena nilai signifikansi (${fmt(sig, 3)}) ≥ 0,05, maka ${name} **tidak berpengaruh signifikan secara parsial** terhadap ${yName}.`)
    );
    lines.push("");
  });

  return lines.join("\n");
}

export function narrativeUjiF(result: RegressionResult, yName: string): string {
  const lines: string[] = [];
  lines.push("**Hasil Uji F (Simultan)**\n");
  lines.push(
    "Uji F dilakukan untuk mengetahui apakah seluruh variabel independen secara bersama-sama (simultan) berpengaruh terhadap variabel dependen.\n"
  );

  const berpengaruh = result.fSig < 0.05;
  lines.push(
    `Diperoleh nilai F hitung sebesar **${fmt(result.fValue, 3)}** dengan signifikansi sebesar **${fmt(result.fSig, 3)}**. ` +
    (berpengaruh
      ? `Karena nilai signifikansi (${fmt(result.fSig, 3)}) < 0,05, maka seluruh variabel independen secara **simultan berpengaruh signifikan** terhadap ${yName}. ` +
        "Dengan demikian model regresi yang digunakan layak (fit)."
      : `Karena nilai signifikansi (${fmt(result.fSig, 3)}) ≥ 0,05, maka seluruh variabel independen secara **simultan tidak berpengaruh signifikan** terhadap ${yName}.`)
  );

  return lines.join("\n");
}

export function narrativeRSquare(result: RegressionResult, yName: string): string {
  const lines: string[] = [];
  lines.push("**Koefisien Determinasi (R²)**\n");

  const persen = (result.rSquare * 100).toFixed(2);
  const sisanya = (100 - parseFloat(persen)).toFixed(2);

  lines.push(
    `Nilai koefisien korelasi (R) sebesar **${fmt(result.r, 4)}** menunjukkan tingkat hubungan yang ` +
    (result.r >= 0.8
      ? "sangat kuat"
      : result.r >= 0.6
      ? "kuat"
      : result.r >= 0.4
      ? "sedang"
      : "lemah") +
    ` antara variabel independen dengan ${yName}.\n\n` +
    `Nilai koefisien determinasi (R²) sebesar **${fmt(result.rSquare, 4)}** atau **${persen}%** menunjukkan bahwa ` +
    `variabel-variabel independen mampu menjelaskan variasi ${yName} sebesar ${persen}%, ` +
    `sedangkan sisanya sebesar ${sisanya}% dijelaskan oleh faktor-faktor lain di luar model penelitian ini.`
  );

  return lines.join("\n");
}

export function narrativeMultikolinearitas(results: MulticollinearityResult[]): string {
  const lines: string[] = [];
  lines.push("**Hasil Uji Multikolinearitas**\n");
  lines.push(
    "Uji multikolinearitas dilakukan untuk mendeteksi adanya korelasi yang tinggi antar variabel independen. " +
    "Model dikatakan bebas dari multikolinearitas apabila nilai Tolerance > 0,10 dan nilai VIF < 10.\n"
  );

  const allGood = results.every((r) => r.tolerance > 0.1 && r.vif < 10);

  for (const r of results) {
    const status = r.tolerance > 0.1 && r.vif < 10 ? "bebas multikolinearitas" : "terindikasi multikolinearitas";
    lines.push(
      `Variabel **${r.variableName} (${r.variable})** memiliki nilai Tolerance sebesar **${fmt(r.tolerance, 4)}** ` +
      `dan VIF sebesar **${fmt(r.vif, 4)}**, sehingga variabel ini **${status}**.`
    );
  }
  lines.push("");
  lines.push(
    allGood
      ? "Dengan demikian, seluruh variabel independen dalam model regresi **bebas dari multikolinearitas**."
      : "Terdapat indikasi multikolinearitas pada model, perlu dilakukan perbaikan model atau penambahan data."
  );

  return lines.join("\n");
}

export function narrativeNormalitas(result: NormalityResult): string {
  const lines: string[] = [];
  lines.push("**Hasil Uji Normalitas Residual**\n");
  lines.push(
    "Uji normalitas dilakukan untuk menguji apakah residual model regresi berdistribusi normal.\n"
  );
  lines.push(
    `Diperoleh nilai mean residual sebesar **${fmt(result.meanResidual, 4)}** dan standar deviasi residual sebesar **${fmt(result.stdResidual, 4)}**. ` +
    result.interpretation
  );
  lines.push(
    "\n*Catatan: Untuk hasil yang lebih akurat, disarankan melakukan uji Kolmogorov-Smirnov atau Shapiro-Wilk menggunakan software statistik (SPSS/R).*"
  );
  return lines.join("\n");
}

export function narrativeHeteroskedastisitas(results: HeteroskedasticityResult[]): string {
  const lines: string[] = [];
  lines.push("**Hasil Uji Heteroskedastisitas**\n");
  lines.push(
    "Uji heteroskedastisitas dilakukan menggunakan pendekatan Glejser sederhana, yaitu dengan menghitung korelasi " +
    "antara nilai absolut residual dengan masing-masing variabel independen.\n"
  );

  for (const r of results) {
    lines.push(r.interpretation);
  }
  lines.push("");

  const allGood = results.every((r) => Math.abs(r.correlation) < 0.2);
  lines.push(
    allGood
      ? "Secara keseluruhan, **tidak terdeteksi adanya heteroskedastisitas** pada model regresi ini."
      : "Terdapat indikasi heteroskedastisitas pada model. Disarankan melakukan transformasi variabel atau menggunakan metode WLS."
  );

  return lines.join("\n");
}

export function generateBab4Narasi(params: {
  validityResults: ValidityResult[];
  reliabilityResults: ReliabilityResult[];
  regressionResult: RegressionResult;
  multicollinearityResults: MulticollinearityResult[];
  normalityResult: NormalityResult;
  heteroskedasticityResults: HeteroskedasticityResult[];
  yVariable: VariableConfig;
}): string {
  const {
    validityResults,
    reliabilityResults,
    regressionResult,
    multicollinearityResults,
    normalityResult,
    heteroskedasticityResults,
    yVariable,
  } = params;

  const sections = [
    "# BAB IV – HASIL PENELITIAN DAN PEMBAHASAN\n",
    narrativeValiditas(validityResults),
    "---\n",
    narrativeReliabilitas(reliabilityResults),
    "---\n",
    narrativeMultikolinearitas(multicollinearityResults),
    "---\n",
    narrativeNormalitas(normalityResult),
    "---\n",
    narrativeHeteroskedastisitas(heteroskedasticityResults),
    "---\n",
    narrativeRegresi(regressionResult, yVariable.name),
    "---\n",
    narrativeUjiT(regressionResult, yVariable.name),
    "---\n",
    narrativeUjiF(regressionResult, yVariable.name),
    "---\n",
    narrativeRSquare(regressionResult, yVariable.name),
    "\n---\n",
    "> ⚠️ **Catatan:** Pastikan data berasal dari responden asli. Seluruh hasil analisis di atas diperoleh berdasarkan data yang Anda unggah.",
  ];

  return sections.join("\n");
}
