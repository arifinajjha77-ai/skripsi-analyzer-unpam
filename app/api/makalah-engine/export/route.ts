import { exportMakalahEngineDocx } from "@/lib/makalah-engine";
import type { MakalahDocument } from "@/lib/makalah-engine";

export async function POST(request: Request) {
  try {
    const document = await request.json() as MakalahDocument;
    const buffer = await exportMakalahEngineDocx(document);
    const fileName = `Makalah_${safeFileName(document.input.judul || "SmartCampus")}_${dateStamp()}`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${fileName}.docx"`,
      },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Gagal export DOCX." },
      { status: 400 }
    );
  }
}

function safeFileName(value: string): string {
  return value.replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, "-").slice(0, 70) || "Makalah-SmartCampus";
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}
