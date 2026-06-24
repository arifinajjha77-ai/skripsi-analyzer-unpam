import * as XLSX from "xlsx";
import { RespondentRow } from "@/types";

export interface ParseResult {
  data: RespondentRow[];
  columns: string[];
  error?: string;
}

export async function parseFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) {
          resolve({ data: [], columns: [], error: "File kosong atau tidak dapat dibaca." });
          return;
        }

        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json<RespondentRow>(sheet, {
          defval: "",
          raw: false,
        });

        if (!jsonData || jsonData.length === 0) {
          resolve({ data: [], columns: [], error: "Sheet pertama kosong atau tidak ada data." });
          return;
        }

        const columns = Object.keys(jsonData[0]);

        // Convert numeric-looking strings to numbers
        const processed = jsonData.map((row) => {
          const newRow: RespondentRow = {};
          for (const col of columns) {
            const val = row[col];
            if (typeof val === "string" && val.trim() !== "" && !isNaN(Number(val))) {
              newRow[col] = Number(val);
            } else {
              newRow[col] = val;
            }
          }
          return newRow;
        });

        resolve({ data: processed, columns });
      } catch (err) {
        resolve({ data: [], columns: [], error: `Error membaca file: ${(err as Error).message}` });
      }
    };

    reader.onerror = () => {
      resolve({ data: [], columns: [], error: "Gagal membaca file." });
    };

    reader.readAsArrayBuffer(file);
  });
}

export function detectVariableGroups(columns: string[]): { key: string; items: string[] }[] {
  const groups: Record<string, string[]> = {};

  for (const col of columns) {
    // Match patterns like X1.1, X2.5, Y.1, Y1.2
    const match = col.match(/^([A-Za-z]+\d*)\.\d+$/);
    if (match) {
      const key = match[1].toUpperCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(col);
    }
  }

  return Object.entries(groups).map(([key, items]) => ({
    key,
    items: items.sort((a, b) => {
      const numA = parseInt(a.split(".").pop() || "0");
      const numB = parseInt(b.split(".").pop() || "0");
      return numA - numB;
    }),
  }));
}
