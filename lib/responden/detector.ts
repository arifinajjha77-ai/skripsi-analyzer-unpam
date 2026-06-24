import { DetectedColumns } from "./types";

const KEYWORD_MAP: Record<keyof Omit<DetectedColumns, "x1Items" | "x2Items" | "yItems" | "otherItems">, string[]> = {
  nama: ["nama", "name", "responden"],
  jenisKelamin: ["jenis kelamin", "jeniskelamin", "gender", "kelamin", "jk"],
  usia: ["usia", "umur", "age", "tahun"],
  pekerjaan: ["pekerjaan", "profesi", "occupation", "job", "kerja"],
  pendidikan: ["pendidikan", "education", "edu", "pendidikan terakhir"],
  email: ["email", "e-mail", "surel"],
  timestamp: ["timestamp", "waktu", "time", "created"],
};

function matchKeyword(col: string, keywords: string[]): boolean {
  const lower = col.toLowerCase().replace(/[_\-\s]/g, " ").trim();
  return keywords.some((kw) => lower.includes(kw));
}

function isItemColumn(col: string, prefix: string): boolean {
  const patterns = [
    new RegExp(`^${prefix}\\.\\d+$`, "i"),
    new RegExp(`^${prefix}\\d+$`, "i"),
    new RegExp(`^${prefix}_\\d+$`, "i"),
  ];
  return patterns.some((p) => p.test(col.trim()));
}

export function detectColumns(columns: string[]): DetectedColumns {
  const result: DetectedColumns = {
    nama: null,
    jenisKelamin: null,
    usia: null,
    pekerjaan: null,
    pendidikan: null,
    email: null,
    timestamp: null,
    x1Items: [],
    x2Items: [],
    yItems: [],
    otherItems: [],
  };

  const assigned = new Set<string>();

  // Detect item columns first (X1.*, X2.*, Y.*)
  for (const col of columns) {
    if (isItemColumn(col, "X1")) {
      result.x1Items.push(col);
      assigned.add(col);
    } else if (isItemColumn(col, "X2")) {
      result.x2Items.push(col);
      assigned.add(col);
    } else if (isItemColumn(col, "Y")) {
      result.yItems.push(col);
      assigned.add(col);
    }
  }

  // Sort item columns numerically
  const sortItems = (items: string[]) =>
    items.sort((a, b) => {
      const na = parseInt(a.replace(/\D+(\d+)$/, "$1"));
      const nb = parseInt(b.replace(/\D+(\d+)$/, "$1"));
      return na - nb;
    });

  result.x1Items = sortItems(result.x1Items);
  result.x2Items = sortItems(result.x2Items);
  result.yItems = sortItems(result.yItems);

  // Detect demographic columns
  for (const col of columns) {
    if (assigned.has(col)) continue;
    for (const [field, keywords] of Object.entries(KEYWORD_MAP)) {
      if (!result[field as keyof typeof result] && matchKeyword(col, keywords)) {
        (result as unknown as Record<string, unknown>)[field] = col;
        assigned.add(col);
        break;
      }
    }
  }

  // Remaining unassigned
  result.otherItems = columns.filter((c) => !assigned.has(c));

  return result;
}

export function getAllItemColumns(detected: DetectedColumns): string[] {
  return [...detected.x1Items, ...detected.x2Items, ...detected.yItems];
}
