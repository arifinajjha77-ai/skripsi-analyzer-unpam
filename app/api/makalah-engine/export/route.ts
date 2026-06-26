import { exportMakalahEngineDocx } from "@/lib/makalah-engine";
import type { MakalahDocument } from "@/lib/makalah-engine";

export async function POST(request: Request) {
  try {
    const document = await request.json() as MakalahDocument;
    const buffer = await exportMakalahEngineDocx(document);
    const fileName = safeFileName(document.input.judul || "Makalah-SmartCampus");

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
