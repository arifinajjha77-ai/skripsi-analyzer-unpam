import * as XLSX from "xlsx";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, "../public/templates/template-data-responden.xlsx");

// Build header row
const headers = ["Responden"];
for (let i = 1; i <= 10; i++) headers.push(`X1.${i}`);
for (let i = 1; i <= 10; i++) headers.push(`X2.${i}`);
for (let i = 1; i <= 10; i++) headers.push(`Y.${i}`);

// Build 30 sample rows with values of ""
const rows = [headers];
for (let r = 1; r <= 30; r++) {
  const row = [`Responden ${r}`];
  for (let i = 0; i < 30; i++) row.push("");
  rows.push(row);
}

const ws = XLSX.utils.aoa_to_sheet(rows);

// Style header row (bold)
const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
for (let C = range.s.c; C <= range.e.c; C++) {
  const cellAddr = XLSX.utils.encode_cell({ r: 0, c: C });
  if (!ws[cellAddr]) continue;
  ws[cellAddr].s = {
    font: { bold: true },
    fill: { fgColor: { rgb: "DBEAFE" } },
    alignment: { horizontal: "center" },
  };
}

// Set column widths
ws["!cols"] = [{ wch: 18 }, ...Array(30).fill({ wch: 8 })];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Data Responden");

// Add instruction sheet
const instrRows = [
  ["PETUNJUK PENGISIAN"],
  [""],
  ["1. Isi kolom Responden dengan nomor atau nama responden (opsional)"],
  ["2. Isi kolom X1.1 sampai X1.10 dengan skor item variabel X1 (skala Likert 1-5)"],
  ["3. Isi kolom X2.1 sampai X2.10 dengan skor item variabel X2 (skala Likert 1-5)"],
  ["4. Isi kolom Y.1 sampai Y.10 dengan skor item variabel Y (skala Likert 1-5)"],
  [""],
  ["Skala Likert:"],
  ["1 = Sangat Tidak Setuju (STS)"],
  ["2 = Tidak Setuju (TS)"],
  ["3 = Kurang Setuju (KS)"],
  ["4 = Setuju (S)"],
  ["5 = Sangat Setuju (SS)"],
  [""],
  ["CATATAN: Pastikan data berasal dari responden asli."],
];
const wsInstr = XLSX.utils.aoa_to_sheet(instrRows);
wsInstr["!cols"] = [{ wch: 60 }];
XLSX.utils.book_append_sheet(wb, wsInstr, "Petunjuk");

XLSX.writeFile(wb, outputPath);
console.log(`Template created at: ${outputPath}`);
