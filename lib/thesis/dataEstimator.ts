/**
 * Auto-generate synchronized, internally-consistent estimated data
 * for sales and consumer tables (Data Estimasi / Disamarkan mode).
 *
 * Rules:
 *  1. Target grows 8–15% per year.
 *  2. Realisasi = 65–92% of target (not always meeting target).
 *  3. Persentase is calculated: realisasi / target × 100.
 *  4. Keterangan: ≥100% Tercapai | 80–99% Belum Optimal | 60–79% Tidak Tercapai | <60% Rendah.
 *  5. Consumer data is synchronized with sales (same % achievement ± 3–5%).
 *  6. No extreme numbers; round readable values.
 */

import type { SalesRow, ConsumerRow } from "./bab1Store";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return Math.abs(s) / 0xffffffff;
  };
}

function roundTo(n: number, multiple: number): number {
  return Math.round(n / multiple) * multiple;
}

function formatReadable(n: number): string {
  if (n >= 1_000_000) return `Rp${(n / 1_000_000).toFixed(0)} juta`;
  if (n >= 1_000) {
    const rounded = Math.round(n / 1_000);
    return `${rounded.toLocaleString("id-ID")} unit`;
  }
  return `${n} unit`;
}

function formatConsumerReadable(n: number): string {
  return `${n.toLocaleString("id-ID")} orang`;
}

// ─── Sales Estimator ──────────────────────────────────────────────────────────

export interface EstimatedSalesRow extends SalesRow {
  pctValue: number;
  keteranganValue: string;
}

export interface EstimatedConsumerRow extends ConsumerRow {
  pctValue: number;
  keteranganValue: string;
}

export interface SyncEstimation {
  salesRows: SalesRow[];
  consumerRows: ConsumerRow[];
  tahunList: string[];
}

/**
 * Generate 3 years of synchronized sales + consumer data.
 * Uses the object name as a seed for consistent generation per object.
 */
export function generateSyncEstimation(namaObjek: string): SyncEstimation {
  const seed = namaObjek.split("").reduce((acc, c) => acc + c.charCodeAt(0), 42);
  const rand = seededRand(seed);

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear].map(String);

  // Base targets — sales in units, consumers in persons
  const baseSalesTarget  = roundTo(800 + Math.round(rand() * 400), 50);   // 800–1200 units
  const baseConsumerTarget = roundTo(baseSalesTarget * (1.2 + rand() * 0.5), 50); // slightly more than sales

  const salesRows: SalesRow[] = [];
  const consumerRows: ConsumerRow[] = [];

  let salesTarget    = baseSalesTarget;
  let consumerTarget = baseConsumerTarget;

  for (let i = 0; i < 3; i++) {
    // Year-over-year target growth: 8–14%
    if (i > 0) {
      const growthRate = 1.08 + rand() * 0.06;
      salesTarget    = roundTo(salesTarget * growthRate, 50);
      consumerTarget = roundTo(consumerTarget * growthRate, 50);
    }

    // Realisasi: 65–92% of target (ensure it doesn't always achieve)
    const salesAchievePct    = 0.65 + rand() * 0.27; // 65–92%
    const consumerAchievePct = Math.max(0.62, Math.min(0.95, salesAchievePct + (rand() - 0.5) * 0.08));

    const salesReal    = roundTo(salesTarget    * salesAchievePct,    25);
    const consumerReal = roundTo(consumerTarget * consumerAchievePct, 25);

    salesRows.push({
      tahun: years[i],
      target: formatReadable(salesTarget),
      realisasi: formatReadable(salesReal),
    });

    consumerRows.push({
      tahun: years[i],
      target: formatConsumerReadable(consumerTarget),
      realisasi: formatConsumerReadable(consumerReal),
    });
  }

  return { salesRows, consumerRows, tahunList: years };
}

// ─── Keterangan granular ──────────────────────────────────────────────────────

export function keteranganGranular(target: string, realisasi: string): string {
  const t = parseFloat(target.replace(/[^\d.]/g, ""));
  const r = parseFloat(realisasi.replace(/[^\d.]/g, ""));
  if (!t || isNaN(t) || isNaN(r)) return "-";
  const pct = (r / t) * 100;
  if (pct >= 100) return "Tercapai";
  if (pct >= 80)  return "Belum Optimal";
  if (pct >= 60)  return "Tidak Tercapai";
  return "Rendah";
}

export function pctCalc(target: string, realisasi: string): string {
  const t = parseFloat(target.replace(/[^\d.]/g, ""));
  const r = parseFloat(realisasi.replace(/[^\d.]/g, ""));
  if (!t || isNaN(t) || isNaN(r)) return "-";
  return ((r / t) * 100).toFixed(1) + "%";
}
