import * as XLSX from "xlsx";
import { RespondenRow } from "./types";

export function exportCleanData(rows: RespondenRow[], columns: string[]): void {
  const ws = XLSX.utils.json_to_sheet(
    rows.map((r) => {
      const obj: Record<string, string | number> = {};
      for (const col of columns) obj[col] = r[col] as string | number ?? "";
      return obj;
    }),
    { header: columns }
  );

  // Style header
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
  for (let C = range.s.c; C <= range.e.c; C++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c: C });
    if (ws[addr]) {
      ws[addr].s = { font: { bold: true }, fill: { fgColor: { rgb: "DBEAFE" } } };
    }
  }

  // Column widths
  ws["!cols"] = columns.map((col) => ({ wch: Math.max(12, col.length + 2) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Clean Data");

  // Add info sheet
  const infoRows = [
    ["File ini dihasilkan oleh Skripsi Analyzer UNPAM"],
    [""],
    ["Jumlah responden:", rows.length],
    ["Jumlah kolom:", columns.length],
    [""],
    ["CATATAN: Data ini merupakan data bersih (clean data) yang lolos validasi missing value."],
    ["Pastikan data berasal dari responden asli."],
  ];
  const wsInfo = XLSX.utils.aoa_to_sheet(infoRows);
  wsInfo["!cols"] = [{ wch: 50 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsInfo, "Info");

  XLSX.writeFile(wb, "clean-data.xlsx");
}
