import { RespondenRow, DetectedColumns, FreqRow, KarakteristikResult, QualityIssue, QualityReport } from "./types";
import { getAllItemColumns } from "./detector";

// ─── helpers ──────────────────────────────────────────────────────────────────

function pct(n: number, total: number): string {
  if (total === 0) return "0%";
  return ((n / total) * 100).toFixed(1) + "%";
}

function stdDev(values: number[]): number {
  if (values.length <= 1) return 0;
  const m = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function toFreqTable(values: (string | number)[], total: number): FreqRow[] {
  const counts: Record<string, number> = {};
  for (const v of values) {
    const key = String(v ?? "").trim() || "(kosong)";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([kategori, frekuensi]) => ({
      kategori,
      frekuensi,
      persentase: pct(frekuensi, total),
    }));
}

function groupUsia(rawValues: (string | number)[]): FreqRow[] {
  const total = rawValues.length;
  const groups: Record<string, number> = {
    "≤ 18 tahun": 0,
    "19–28 tahun": 0,
    "29–38 tahun": 0,
    "> 38 tahun": 0,
    "Tidak diisi": 0,
  };

  for (const v of rawValues) {
    const n = parseInt(String(v).replace(/[^\d]/g, ""));
    if (isNaN(n) || String(v).trim() === "") {
      groups["Tidak diisi"]++;
    } else if (n <= 18) {
      groups["≤ 18 tahun"]++;
    } else if (n <= 28) {
      groups["19–28 tahun"]++;
    } else if (n <= 38) {
      groups["29–38 tahun"]++;
    } else {
      groups["> 38 tahun"]++;
    }
  }

  return Object.entries(groups)
    .filter(([, freq]) => freq > 0)
    .map(([kategori, frekuensi]) => ({
      kategori,
      frekuensi,
      persentase: pct(frekuensi, total),
    }));
}

// ─── Karakteristik ────────────────────────────────────────────────────────────

export function computeKarakteristik(
  rows: RespondenRow[],
  detected: DetectedColumns
): KarakteristikResult {
  const n = rows.length;

  const get = (col: string | null): (string | number)[] =>
    col ? rows.map((r) => r[col] ?? "") : [];

  return {
    jenisKelamin: detected.jenisKelamin
      ? toFreqTable(get(detected.jenisKelamin), n)
      : [],
    usia: detected.usia
      ? groupUsia(get(detected.usia))
      : [],
    pendidikan: detected.pendidikan
      ? toFreqTable(get(detected.pendidikan), n)
      : [],
    pekerjaan: detected.pekerjaan
      ? toFreqTable(get(detected.pekerjaan), n)
      : [],
  };
}

// ─── Quality Check ────────────────────────────────────────────────────────────

export function runQualityCheck(
  rows: RespondenRow[],
  detected: DetectedColumns
): QualityReport {
  const issues: QualityIssue[] = [];
  const itemCols = getAllItemColumns(detected);
  const n = rows.length;
  const allVarCols = [
    ...detected.x1Items.length > 0 ? ["X1"] : [],
    ...detected.x2Items.length > 0 ? ["X2"] : [],
    ...detected.yItems.length > 0 ? ["Y"] : [],
  ];

  // ─── Missing values ─────────────────────────────────────────────────────────
  const missingByCol: Record<string, number[]> = {};
  const cleanRowIndices: number[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    let rowHasMissing = false;

    for (const col of itemCols) {
      const val = row[col];
      const isEmpty = val === "" || val === null || val === undefined;
      if (isEmpty) {
        if (!missingByCol[col]) missingByCol[col] = [];
        missingByCol[col].push(i + 1);
        rowHasMissing = true;
      }
    }

    if (!rowHasMissing) cleanRowIndices.push(i);
  }

  for (const [col, rowNums] of Object.entries(missingByCol)) {
    issues.push({
      type: "missing",
      severity: "error",
      column: col,
      message: `${rowNums.length} responden belum mengisi ${col} (baris: ${rowNums.slice(0, 5).join(", ")}${rowNums.length > 5 ? "…" : ""})`,
    });
  }

  // ─── Duplicates ──────────────────────────────────────────────────────────────
  if (detected.nama) {
    const nameCounts: Record<string, number[]> = {};
    rows.forEach((r, i) => {
      const nm = String(r[detected.nama!] ?? "").trim().toLowerCase();
      if (nm && nm !== "(kosong)") {
        if (!nameCounts[nm]) nameCounts[nm] = [];
        nameCounts[nm].push(i + 1);
      }
    });
    for (const [name, idxs] of Object.entries(nameCounts)) {
      if (idxs.length > 1) {
        issues.push({
          type: "duplicate",
          severity: "warning",
          message: `Nama "${name}" muncul ${idxs.length}× (baris: ${idxs.join(", ")}) — kemungkinan duplikat`,
        });
      }
    }
  }

  if (detected.email) {
    const emailCounts: Record<string, number[]> = {};
    rows.forEach((r, i) => {
      const em = String(r[detected.email!] ?? "").trim().toLowerCase();
      if (em) {
        if (!emailCounts[em]) emailCounts[em] = [];
        emailCounts[em].push(i + 1);
      }
    });
    for (const [email, idxs] of Object.entries(emailCounts)) {
      if (idxs.length > 1) {
        issues.push({
          type: "duplicate",
          severity: "warning",
          message: `Email "${email}" muncul ${idxs.length}× (baris: ${idxs.join(", ")}) — kemungkinan duplikat`,
        });
      }
    }
  }

  // Duplicate identical response pattern
  if (itemCols.length > 0) {
    const patterns: Record<string, number[]> = {};
    rows.forEach((r, i) => {
      const pattern = itemCols.map((c) => String(r[c] ?? "")).join(",");
      if (!patterns[pattern]) patterns[pattern] = [];
      patterns[pattern].push(i + 1);
    });
    for (const [, idxs] of Object.entries(patterns)) {
      if (idxs.length > 2) {
        issues.push({
          type: "duplicate",
          severity: "warning",
          message: `${idxs.length} responden memiliki pola jawaban identik (baris: ${idxs.slice(0, 5).join(", ")}${idxs.length > 5 ? "…" : ""}) — perlu diperiksa`,
        });
        break;
      }
    }
  }

  // ─── Consistency check ───────────────────────────────────────────────────────
  if (itemCols.length > 0) {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const vals = itemCols
        .map((c) => parseFloat(String(row[c] ?? "")))
        .filter((v) => !isNaN(v));

      if (vals.length < 3) continue;

      const sd = stdDev(vals);
      const name = detected.nama ? String(row[detected.nama] ?? `Responden ${i + 1}`) : `Responden ${i + 1}`;

      if (sd === 0) {
        const constVal = vals[0];
        issues.push({
          type: "consistency",
          severity: "warning",
          respondent: i + 1,
          respondentName: name,
          message: `${name} (baris ${i + 1}): Semua jawaban bernilai ${constVal} — terindikasi menjawab asal-asalan`,
        });
      } else if (sd < 0.3 && vals.length >= 10) {
        issues.push({
          type: "consistency",
          severity: "info",
          respondent: i + 1,
          respondentName: name,
          message: `${name} (baris ${i + 1}): Standar deviasi jawaban sangat rendah (σ = ${sd.toFixed(3)}) — perlu perhatian`,
        });
      }
    }
  }

  // ─── Demographic validation ──────────────────────────────────────────────────
  const PROFESSIONAL_JOBS = ["pns", "pegawai negeri", "karyawan", "guru", "dokter", "perawat", "polisi", "tni", "dosen"];

  if (detected.usia && detected.pekerjaan) {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const usiaN = parseInt(String(row[detected.usia] ?? "").replace(/[^\d]/g, ""));
      const pekerjaan = String(row[detected.pekerjaan] ?? "").toLowerCase().trim();
      const name = detected.nama ? String(row[detected.nama] ?? `Responden ${i + 1}`) : `Responden ${i + 1}`;

      if (!isNaN(usiaN) && usiaN < 17) {
        issues.push({
          type: "demographic",
          severity: "warning",
          respondent: i + 1,
          respondentName: name,
          message: `${name} (baris ${i + 1}): Usia ${usiaN} tahun tampak tidak wajar untuk responden penelitian`,
        });
      }

      if (!isNaN(usiaN) && usiaN < 18 && PROFESSIONAL_JOBS.some((j) => pekerjaan.includes(j))) {
        issues.push({
          type: "demographic",
          severity: "warning",
          respondent: i + 1,
          respondentName: name,
          message: `${name} (baris ${i + 1}): Usia ${usiaN} tahun dengan pekerjaan "${row[detected.pekerjaan!]}" — tampak tidak konsisten`,
        });
      }
    }
  }

  const completeResponden = cleanRowIndices.length;
  const completenessPercent = n > 0 ? parseFloat(((completeResponden / n) * 100).toFixed(1)) : 0;

  return {
    totalResponden: n,
    totalItems: itemCols.length,
    totalVariables: allVarCols.length,
    completeResponden,
    completenessPercent,
    issues,
    cleanRowIndices,
  };
}

// ─── Narrative ───────────────────────────────────────────────────────────────

export function buildKarakteristikNarasi(
  result: KarakteristikResult,
  report: QualityReport
): string {
  const lines: string[] = [];
  const n = report.totalResponden;

  lines.push(`Penelitian ini melibatkan ${n} responden. Berikut adalah karakteristik responden berdasarkan data demografis yang dikumpulkan.\n`);

  if (result.jenisKelamin.length > 0) {
    const [first, ...rest] = result.jenisKelamin;
    lines.push(
      `**Jenis Kelamin.** Berdasarkan jenis kelamin, responden terbanyak adalah ${first.kategori} sebanyak ${first.frekuensi} orang (${first.persentase})` +
      (rest.length > 0 ? ", diikuti oleh " + rest.map((r) => `${r.kategori} sebanyak ${r.frekuensi} orang (${r.persentase})`).join(" dan ") : "") +
      "."
    );
  }

  if (result.usia.length > 0) {
    const sorted = [...result.usia].filter((u) => u.kategori !== "Tidak diisi").sort((a, b) => b.frekuensi - a.frekuensi);
    if (sorted.length > 0) {
      lines.push(
        `**Usia.** Kelompok usia terbanyak adalah ${sorted[0].kategori} sebanyak ${sorted[0].frekuensi} orang (${sorted[0].persentase}).`
      );
    }
  }

  if (result.pendidikan.length > 0) {
    const [first] = result.pendidikan;
    lines.push(
      `**Pendidikan.** Tingkat pendidikan responden yang paling banyak adalah ${first.kategori} sebanyak ${first.frekuensi} orang (${first.persentase}).`
    );
  }

  if (result.pekerjaan.length > 0) {
    const [first] = result.pekerjaan;
    lines.push(
      `**Pekerjaan.** Pekerjaan yang paling banyak dimiliki responden adalah ${first.kategori} sebanyak ${first.frekuensi} orang (${first.persentase}).`
    );
  }

  return lines.join("\n\n");
}
