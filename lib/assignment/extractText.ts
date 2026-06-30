const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TEXT_LENGTH = 80000;

export async function extractAssignmentText(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Ukuran file maksimal 10MB.");
  }

  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();
  let text = "";

  if (name.endsWith(".txt") || mime.startsWith("text/")) {
    text = await file.text();
  } else if (name.endsWith(".docx") || mime.includes("wordprocessingml")) {
    text = await extractDocx(file);
  } else if (name.endsWith(".pdf") || mime === "application/pdf") {
    text = await extractPdf(file);
  } else {
    throw new Error("Format file belum didukung. Upload PDF, DOCX, atau TXT.");
  }

  const cleaned = normalizeText(text);
  if (!cleaned) {
    throw new Error("Teks tugas tidak terbaca. Pastikan file berisi instruksi yang dapat disalin.");
  }

  return cleaned.slice(0, MAX_TEXT_LENGTH);
}

function normalizeText(text: string): string {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

async function extractPdf(file: File): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(await file.arrayBuffer()) });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}
