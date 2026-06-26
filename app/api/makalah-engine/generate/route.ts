import { generateMakalahDocument, generateOutline, normalizeInput } from "@/lib/makalah-engine";
import type { MakalahOutline } from "@/lib/makalah-engine";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = normalizeInput(body.input || body);
    if (body.assignmentAnalysis) input.assignmentAnalysis = body.assignmentAnalysis;
    if (body.mode === "complete" || body.mode === "fast") input.mode = body.mode;
    const outlineResult = body.outline
      ? { data: body.outline as MakalahOutline, meta: { model: "provided", fallback: false } }
      : await generateOutline(input);
    const result = await generateMakalahDocument(input, outlineResult.data, outlineResult.meta.fallback);

    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Gagal membuat makalah." },
      { status: 400 }
    );
  }
}
