import { generateOutline, normalizeInput } from "@/lib/makalah-engine";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = normalizeInput(body.input || body);
    if (body.assignmentAnalysis) input.assignmentAnalysis = body.assignmentAnalysis;
    if (body.mode === "complete" || body.mode === "fast") input.mode = body.mode;
    const result = await generateOutline(input);
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Gagal membuat outline." },
      { status: 400 }
    );
  }
}
